import { tx, getSettings, saveSettings, DEFAULT_SETTINGS } from './db.js';
import { hashPassword } from './lib/security.js';
import { makeRng } from './engine/random.js';
import { GENERATORS, generate, DIFFICULTIES } from './engine/generators.js';
import { TOPICS, WORLDS, levelPlan, BADGES } from './engine/plans.js';
import { saveQuestion } from './services/questions.js';
import * as game from './services/game.js';
import * as rewards from './services/rewards.js';
import { randomUUID } from 'node:crypto';

const STUDENT_NAMES = ['Singa Berani', 'Arnab Pantas', 'Harimau Bijak', 'Panda Ceria', 'Burung Hantu', 'Rubah Cerdik', 'Dino Hebat', 'Robot Ria', 'Koala Comel', 'Kuda Sembrani',
  'Bintang Laut', 'Pari Pari', 'Naga Mas', 'Helang Gagah', 'Kancil Bijak', 'Penyu Tenang', 'Lebah Rajin', 'Kupu Kupu', 'Ikan Emas', 'Kelip Kelip',
  'Pelangi Ceria', 'Awan Putih', 'Bulan Terang', 'Matahari Ria', 'Bintang Jatuh', 'Ombak Biru', 'Gunung Hijau', 'Sungai Jernih', 'Angin Lembut', 'Hutan Rimba'];
const AVATARS = ['lion', 'rabbit', 'tiger', 'panda', 'owl', 'fox', 'dino', 'robot', 'koala', 'unicorn'];

const PRIZES = [
  ['Pemadam', 'Pemadam bersih untuk kerja matematik anda.', '🧽', 200, 1, 40], ['Pensel', 'Pensel 2B berkualiti.', '✏️', 300, 1, 50],
  ['Pembaris', 'Pembaris 30 cm yang jelas.', '📏', 400, 1, 30], ['Buku Nota', 'Buku nota bergaris 80 muka surat.', '📓', 500, 1, 25],
  ['Pen Warna', 'Set 6 pen warna ceria.', '🖍️', 700, 1, 20], ['Set Alat Tulis Matematik', 'Pembaris, jangka lukis dan protraktor.', '📐', 1000, 2, 12],
  ['Sijil Pencapaian', 'Sijil Pencapaian MathQuest bertandatangan guru besar.', '🏅', 1500, 1, 15], ['Hadiah Misteri Istimewa', 'Kejutan istimewa dari guru!', '🎁', 2000, 3, 6],
  ['Buku Cerita', 'Buku cerita kanak-kanak pilihan.', '📚', 1200, 1, 10], ['Topi MathQuest', 'Topi rasmi MathQuest.', '🧢', 2500, 3, 4],
];

/** Kandungan asas kongsi semua sekolah: topik, dunia, tahap, lencana dan bank soalan. Tiada pengguna atau sekolah. */
export function seedContent(db, r = makeRng(20260101)) {
  tx(db, () => {
    for (const [code, name] of TOPICS) db.prepare('INSERT INTO mathematics_topics(code, name) VALUES (?,?)').run(code, name);
    const topicId = (c) => db.prepare('SELECT id FROM mathematics_topics WHERE code = ?').get(c).id;

    WORLDS.forEach((w, i) => {
      const res = db.prepare('INSERT INTO game_worlds(school_id, code, name, description, topic_id, min_year, theme, icon, sort_order) VALUES (NULL,?,?,?,?,?,?,?,?)')
        .run(w.code, w.name, w.description, topicId(w.topic), w.min_year, w.theme, w.icon, i + 1);
      for (const l of levelPlan(w.topic)) {
        db.prepare('INSERT INTO game_levels(world_id, level_no, title, difficulty, generators, num_questions, pass_percent, time_limit_sec, is_boss) VALUES (?,?,?,?,?,?,?,?,?)')
          .run(Number(res.lastInsertRowid), l.level_no, l.title, l.difficulty, JSON.stringify(l.generators), l.num_questions, l.pass_percent, l.time_limit_sec, l.is_boss);
      }
    });
    for (const b of BADGES) db.prepare('INSERT OR IGNORE INTO achievement_badges(code, name, description, icon, criteria_type, criteria) VALUES (?,?,?,?,?,?)').run(b.code, b.name, b.description, b.icon, b.criteria_type, JSON.stringify(b.criteria));

    // Verified question bank: generated from validated templates (answers computed, not typed), then stored for admin editing.
    const seen = new Set();
    let count = 0;
    for (const g of Object.values(GENERATORS)) {
      for (let y = g.minYear; y <= g.maxYear; y++) {
        for (const d of [0, 2]) {
          for (let tries = 0; tries < 8 && count < 400; tries++) {
            const q = generate(g.key, r, y, d);
            const key = JSON.stringify([q.text, q.visual || null, q.lefts || null]);
            if (seen.has(key)) continue;
            seen.add(key);
            const input = { topic: q.topic, year: y, difficulty: DIFFICULTIES[d], qtype: q.type === 'numeric' ? 'numeric' : q.type, text: q.text, explanation: q.explanation, hint: q.hint, unit: q.unit, visual: q.visual };
            if (q.input === 'match') input.pairs = q.lefts.map((l, i) => [l, q.rights[q.answer[i]]]);
            else if (q.input === 'mcq') { input.options = q.options; input.correct = q.answer; } else input.answer = q.answer;
            saveQuestion(db, null, input, null, null);
            count++;
            break;
          }
        }
      }
    }
  });
}

export function seedDemo(db, { password = 'MathQuest#2026', seed = 20260101, simulate = true } = {}) {
  const r = makeRng(seed);
  const hash = hashPassword(password);
  tx(db, () => {
    db.prepare("INSERT INTO schools(id, name, code) VALUES (1, 'SK MathQuest Demo', 'DEMO001')").run();
    saveSettings(db, 1, DEFAULT_SETTINGS);
    seedContent(db, r);
    const topicId = (c) => db.prepare('SELECT id FROM mathematics_topics WHERE code = ?').get(c).id; void topicId;
    const mkUser = (username, role, name, mustChange = 0) => Number(db.prepare('INSERT INTO users(school_id, username, password_hash, role, display_name, must_change_password) VALUES (1,?,?,?,?,?)').run(username, hash, role, name, mustChange).lastInsertRowid);
    mkUser('admin', 'pentadbir', 'Pentadbir Sekolah');
    db.prepare("UPDATE users SET is_platform_admin = 1 WHERE username = 'admin'").run();
    const classNames = ['1 Cemerlang', '2 Gemilang', '3 Terbilang', '4 Bestari', '5 Harmoni', '6 Cemerlang'];
    const classIds = classNames.map((n, i) => Number(db.prepare('INSERT INTO classes(school_id, name, year) VALUES (1,?,?)').run(n, i + 1).lastInsertRowid));
    [['guru1', 'Cikgu Aminah', [0, 1, 2]], ['guru2', 'Cikgu Raju', [3, 4, 5]]].forEach(([u, n, cls]) => {
      const tid = mkUser(u, 'guru', n);
      db.prepare('INSERT INTO teachers(user_id) VALUES (?)').run(tid);
      for (const c of cls) db.prepare('INSERT INTO teacher_classes(teacher_id, class_id) VALUES (?,?)').run(tid, classIds[c]);
    });
    for (let i = 0; i < 30; i++) {
      const year = Math.floor(i / 5) + 1;
      const uid = mkUser(`M26${String(i + 1).padStart(3, '0')}`, 'murid', STUDENT_NAMES[i], i === 29 ? 1 : 0);
      db.prepare('INSERT INTO students(user_id, class_id, year, avatar, setup_done) VALUES (?,?,?,?,?)').run(uid, classIds[year - 1], year, AVATARS[i % AVATARS.length], i === 29 ? 0 : 1);
    }

    PRIZES.forEach(([name, desc, emoji, cost, minYear, stock]) => {
      const rid = Number(db.prepare('INSERT INTO reward_catalog(school_id, name, description, emoji, points_cost, min_year, limit_per_student) VALUES (1,?,?,?,?,?,?)').run(name, desc, emoji, cost, minYear, cost >= 1500 ? 1 : null).lastInsertRowid);
      db.prepare('INSERT INTO reward_inventory(reward_id, stock) VALUES (?,?)').run(rid, stock);
    });

  });
  if (simulate) simulatePlay(db, r);
}

/** Bots play through the real game services so the ledger, progress and redemptions are genuine. */
function simulatePlay(db, r) {
  const students = db.prepare("SELECT user_id, year FROM students ORDER BY user_id").all();
  const secrets = db.prepare('SELECT idx, secret FROM session_questions WHERE session_id = ? ORDER BY idx');
  const playLevel = (sid, levelId, acc) => {
    const st = game.startLevel(db, sid, levelId, r);
    for (const q of secrets.all(st.id)) {
      const s = JSON.parse(q.secret);
      game.beginQuestion(db, sid, st.id, q.idx);
      const ok = r.chance(acc);
      const resp = s.input === 'mcq' ? { choice: ok ? s.answer : (s.answer + 1) % st.questions[q.idx].options.length }
        : s.input === 'match' ? { order: ok ? s.answer : [...s.answer].reverse() } : { value: String(ok ? s.answer : Number(s.answer) + 1) };
      game.submitAnswer(db, sid, st.id, q.idx, resp);
    }
    return game.finishSession(db, sid, st.id);
  };
  students.forEach((s, i) => {
    if (i === 29) return; // last student keeps a fresh account to demo first-login setup
    const target = [0, 2, 4, 6, 9, 12, 16, 22][i % 8];
    const acc = 0.62 + (i % 5) * 0.08;
    let passed = 0;
    for (const w of game.listWorlds(db, s.user_id)) {
      if (w.year_locked) continue;
      for (const l of w.levels) {
        if (passed >= target) break;
        let res = playLevel(s.user_id, l.id, acc);
        if (!res.passed) res = playLevel(s.user_id, l.id, Math.min(0.97, acc + 0.2));
        if (res.passed) passed++; else break;
      }
    }
    if (i % 3 === 0) { try { const st = game.startDaily(db, s.user_id, r); for (const q of secrets.all(st.id)) { game.beginQuestion(db, s.user_id, st.id, q.idx); game.submitAnswer(db, s.user_id, st.id, q.idx, { choice: JSON.parse(q.secret).answer, value: String(JSON.parse(q.secret).answer), order: JSON.parse(q.secret).answer }); } game.finishSession(db, s.user_id, st.id); } catch { /* ignore */ } }
  });
  // sample redemption requests in different states
  const admin = db.prepare("SELECT id, role, school_id FROM users WHERE username = 'admin'").get();
  const rich = db.prepare('SELECT user_id, points_balance FROM students WHERE points_balance >= 200 ORDER BY points_balance DESC LIMIT 6').all();
  const cheap = db.prepare('SELECT id FROM reward_catalog WHERE points_cost <= ? ORDER BY points_cost DESC').all;
  const actions = [null, 'approve', 'ready', 'collect', 'reject', null];
  rich.forEach((s, i) => {
    const prize = db.prepare('SELECT id FROM reward_catalog WHERE points_cost <= ? ORDER BY points_cost DESC LIMIT 1').get(s.points_balance);
    if (!prize) return;
    try {
      const red = rewards.redeem(db, s.user_id, prize.id, randomUUID());
      const seq = { approve: ['approve'], ready: ['approve', 'ready'], collect: ['approve', 'ready', 'collect'], reject: ['reject'] }[actions[i]] || [];
      for (const a of seq) rewards.transitionRedemption(db, admin, red.id, a, a === 'reject' ? 'Stok sedang disemak semula' : undefined);
    } catch { /* eligibility may fail for some */ }
  });
  void cheap; void getSettings;
}
