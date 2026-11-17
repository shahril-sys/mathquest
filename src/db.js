import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

export class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'ralat';
  }
}

export function openDb(file = config.dbFile) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  return db;
}

export function migrate(db, dir = config.migrationsDir) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
  const done = new Set(db.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name));
  const applied = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    if (done.has(f)) continue;
    db.exec('BEGIN');
    try {
      db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
      db.prepare('INSERT INTO schema_migrations(name) VALUES (?)').run(f);
      db.exec('COMMIT');
      applied.push(f);
    } catch (e) {
      db.exec('ROLLBACK');
      throw new Error(`Migrasi ${f} gagal: ${e.message}`);
    }
  }
  return applied;
}

/** Run fn inside an IMMEDIATE transaction (write lock taken up front). Nested calls join the outer one. */
export function tx(db, fn) {
  if (db.__inTx) return fn();
  db.exec('BEGIN IMMEDIATE');
  db.__inTx = true;
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    db.__inTx = false;
  }
}

export function audit(db, user, action, target, detail) {
  db.prepare('INSERT INTO administrator_audit_logs(user_id, role, action, target, detail) VALUES (?,?,?,?,?)').run(
    user?.id ?? null,
    user?.role ?? null,
    action,
    target == null ? null : String(target),
    detail == null ? null : typeof detail === 'string' ? detail : JSON.stringify(detail),
  );
}

export const DEFAULT_SETTINGS = {
  school_name: 'SK MathQuest Demo',
  points_correct: 10,
  points_level_complete: 50,
  points_perfect: 100,
  points_world_complete: 200,
  points_daily: 20,
  default_pass_percent: 70,
  default_num_questions: 10,
  repeat_rewards: 0,
  leaderboard_public: 1,
  daily_questions: 5,
  retention_days: 365,
  audit_retention_days: 730,
};

export function getSettings(db, schoolId = 1) {
  const out = { ...DEFAULT_SETTINGS };
  const sch = db.prepare('SELECT name FROM schools WHERE id = ?').get(schoolId);
  if (sch) out.school_name = sch.name;
  for (const r of db.prepare('SELECT key, value FROM system_settings WHERE school_id = ?').all(schoolId)) {
    if (r.key in DEFAULT_SETTINGS) out[r.key] = typeof DEFAULT_SETTINGS[r.key] === 'number' ? Number(r.value) : r.value;
  }
  return out;
}

const SETTING_LIMITS = {
  points_correct: [0, 1000], points_level_complete: [0, 5000], points_perfect: [0, 5000],
  points_world_complete: [0, 10000], points_daily: [0, 5000], default_pass_percent: [40, 100],
  default_num_questions: [3, 30], repeat_rewards: [0, 1], leaderboard_public: [0, 1], daily_questions: [3, 20],
  retention_days: [30, 3650], audit_retention_days: [30, 3650],
};

export function saveSettings(db, schoolId, input) {
  const clean = {};
  for (const [k, v] of Object.entries(input || {})) {
    if (!(k in DEFAULT_SETTINGS)) continue;
    if (k === 'school_name') {
      const s = String(v).trim();
      if (!s || s.length > 80) throw new AppError(400, 'Nama sekolah tidak sah.');
      clean[k] = s;
      continue;
    }
    const n = Number(v);
    const [lo, hi] = SETTING_LIMITS[k];
    if (!Number.isInteger(n) || n < lo || n > hi) throw new AppError(400, `Nilai "${k}" mesti nombor bulat antara ${lo} dan ${hi}.`);
    clean[k] = n;
  }
  const st = db.prepare(`INSERT INTO system_settings(school_id,key,value,updated_at) VALUES (?,?,?,datetime('now'))
    ON CONFLICT(school_id,key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`);
  tx(db, () => { for (const [k, v] of Object.entries(clean)) st.run(schoolId, k, String(v)); });
  return clean;
}
