import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppError, tx, audit, getSettings } from '../db.js';
import { config } from '../config.js';
import { createUserAccount } from '../auth.js';
import { sniffImage, randomPassword } from '../lib/security.js';
import { parseCsv } from '../http.js';
import { id, int, str, bool } from '../lib/validate.js';

/* ------------------------------------------------------------------ students */
export function createStudent(db, admin, body) {
  const year = int(body.year, 'Tahun', { min: 1, max: 6 });
  const classId = body.class_id ? id(body.class_id, 'Kelas') : null;
  if (classId && !db.prepare('SELECT 1 FROM classes WHERE id = ? AND school_id = ?').get(classId, admin.school_id)) throw new AppError(400, 'Kelas tidak sah.');
  const password = body.password || `${randomPassword()}A`;
  const username = str(body.username, 'ID murid', { max: 30 });
  return tx(db, () => {
    const uid = createUserAccount(db, admin, { username, password, role: 'murid', displayName: body.display_name, schoolId: admin.school_id });
    db.prepare('INSERT INTO students(user_id, class_id, year) VALUES (?,?,?)').run(uid, classId, year);
    return { id: uid, username, temp_password: password };
  });
}

export function importStudentsCsv(db, admin, text) {
  const rows = parseCsv(String(text || ''));
  if (rows.length < 2 || rows.length > 501) throw new AppError(400, 'CSV mesti mempunyai 1-500 baris murid.');
  const head = rows[0].map((h) => h.trim().toLowerCase());
  for (const c of ['id', 'nama', 'tahun']) if (!head.includes(c)) throw new AppError(400, `Lajur wajib "${c}" tiada. Lajur sah: id, nama, tahun, kelas.`);
  const classes = new Map(db.prepare('SELECT id, name FROM classes WHERE school_id = ?').all(admin.school_id).map((c) => [c.name.toLowerCase(), c.id]));
  const created = [];
  const errors = [];
  rows.slice(1).forEach((cells, i) => {
    const g = (c) => (cells[head.indexOf(c)] ?? '').trim();
    try {
      const cn = g('kelas').toLowerCase();
      if (cn && !classes.has(cn)) throw new AppError(400, `Kelas "${g('kelas')}" tiada.`);
      created.push(createStudent(db, admin, { username: g('id'), display_name: g('nama'), year: Number(g('tahun')), class_id: cn ? classes.get(cn) : null }));
    } catch (e) { errors.push({ row: i + 2, message: e.message }); }
  });
  audit(db, admin, 'student.import', null, { created: created.length, errors: errors.length });
  return { created, errors };
}

export function deleteStudent(db, admin, studentId) {
  const u = db.prepare("SELECT username FROM users WHERE id = ? AND role = 'murid' AND school_id = ?").get(studentId, admin.school_id);
  if (!u) throw new AppError(404, 'Murid tidak dijumpai.');
  tx(db, () => { db.prepare('DELETE FROM users WHERE id = ?').run(studentId); audit(db, admin, 'student.delete', u.username); });
}

/* ------------------------------------------------------------------ rewards */
export function saveReward(db, admin, body, rewardId = null) {
  const name = str(body.name, 'Nama hadiah', { max: 80 });
  const description = str(body.description ?? '', 'Penerangan', { max: 300, optional: true }) || '';
  const emoji = String(body.emoji || '🎁').slice(0, 4);
  const cost = int(body.points_cost, 'Mata diperlukan', { min: 1, max: 1000000 });
  const minYear = int(body.min_year ?? 1, 'Tahun minimum', { min: 1, max: 6 });
  const limit = body.limit_per_student === '' || body.limit_per_student == null ? null : int(body.limit_per_student, 'Had setiap murid', { min: 1, max: 100 });
  const active = body.active === undefined ? 1 : bool(body.active);
  return tx(db, () => {
    let rid = rewardId;
    if (rid) {
      const r = db.prepare('UPDATE reward_catalog SET name=?, description=?, emoji=?, points_cost=?, min_year=?, limit_per_student=?, active=? WHERE id=? AND school_id=?')
        .run(name, description, emoji, cost, minYear, limit, active, rid, admin.school_id);
      if (!r.changes) throw new AppError(404, 'Hadiah tidak dijumpai.');
      if (body.stock != null) {
        const stock = int(body.stock, 'Stok', { min: 0, max: 100000 });
        const inv = db.prepare('SELECT reserved FROM reward_inventory WHERE reward_id = ?').get(rid);
        if (stock < inv.reserved) throw new AppError(409, `Stok tidak boleh kurang daripada kuantiti yang ditempah (${inv.reserved}).`);
        db.prepare('UPDATE reward_inventory SET stock = ? WHERE reward_id = ?').run(stock, rid);
      }
    } else {
      const r = db.prepare('INSERT INTO reward_catalog(school_id, name, description, emoji, points_cost, min_year, limit_per_student, active) VALUES (?,?,?,?,?,?,?,?)')
        .run(admin.school_id, name, description, emoji, cost, minYear, limit, active);
      rid = Number(r.lastInsertRowid);
      db.prepare('INSERT INTO reward_inventory(reward_id, stock, reserved) VALUES (?,?,0)').run(rid, int(body.stock ?? 0, 'Stok', { min: 0, max: 100000 }));
    }
    audit(db, admin, rewardId ? 'reward.update' : 'reward.create', rid, { name, cost });
    return rid;
  });
}

export function saveRewardImage(db, admin, rewardId, dataBase64) {
  const reward = db.prepare('SELECT image_path FROM reward_catalog WHERE id = ? AND school_id = ?').get(rewardId, admin.school_id);
  if (!reward) throw new AppError(404, 'Hadiah tidak dijumpai.');
  if (typeof dataBase64 !== 'string' || dataBase64.length > 900_000) throw new AppError(413, 'Imej terlalu besar (maksimum 600 KB).');
  const buf = Buffer.from(dataBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  if (!buf.length || buf.length > 600_000) throw new AppError(413, 'Imej terlalu besar (maksimum 600 KB).');
  const ext = sniffImage(buf);
  if (!ext) throw new AppError(400, 'Hanya imej PNG, JPEG, WebP atau GIF dibenarkan.');
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(config.uploadDir, name), buf, { mode: 0o640 });
  db.prepare('UPDATE reward_catalog SET image_path = ? WHERE id = ?').run(name, rewardId);
  if (reward.image_path) fs.rmSync(path.join(config.uploadDir, path.basename(reward.image_path)), { force: true });
  audit(db, admin, 'reward.image', rewardId);
  return { image: `/uploads/${name}` };
}

export function deleteReward(db, admin, rewardId) {
  const r = db.prepare('SELECT id, name FROM reward_catalog WHERE id = ? AND school_id = ?').get(rewardId, admin.school_id);
  if (!r) throw new AppError(404, 'Hadiah tidak dijumpai.');
  const used = db.prepare('SELECT COUNT(*) c FROM reward_redemptions WHERE reward_id = ?').get(rewardId).c;
  if (used) {
    db.prepare('UPDATE reward_catalog SET active = 0 WHERE id = ?').run(rewardId);
    audit(db, admin, 'reward.deactivate', rewardId);
    return { deleted: false, deactivated: true };
  }
  db.prepare('DELETE FROM reward_catalog WHERE id = ?').run(rewardId);
  audit(db, admin, 'reward.delete', rewardId, { name: r.name });
  return { deleted: true };
}

/* ------------------------------------------------------------------ retention / privacy */
export function purgeExpired(db, schoolId = 1, admin = null) {
  const s = getSettings(db, schoolId);
  return tx(db, () => {
    const out = {};
    out.sessions = db.prepare("DELETE FROM auth_sessions WHERE expires_at < datetime('now')").run().changes;
    out.audit_logs = db.prepare(`DELETE FROM administrator_audit_logs WHERE created_at < datetime('now', '-${s.audit_retention_days} days') AND user_id IN (SELECT id FROM users WHERE school_id = ?)`).run(schoolId).changes;
    // detailed play history (answers) is removed after the retention period; points, progress and ledger remain
    out.game_sessions = db.prepare(`DELETE FROM game_sessions WHERE status != 'active' AND started_at < datetime('now', '-${s.retention_days} days')`).run().changes;
    out.inactive_students = db.prepare(`DELETE FROM users WHERE role = 'murid' AND active = 0 AND school_id = ? AND COALESCE(last_login_at, created_at) < datetime('now', '-${s.retention_days} days')`).run(schoolId).changes;
    if (admin) audit(db, admin, 'system.purge', null, out);
    return out;
  });
}
