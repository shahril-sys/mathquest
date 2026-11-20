import { AppError, tx, getSettings } from '../db.js';
import { makeRng } from '../engine/random.js';
import { DIFFICULTIES, GENERATORS, generate, generatorsFor, generatorsForTopic } from '../engine/generators.js';
import { checkAnswer, validateQuestion } from '../engine/check.js';
import { earn } from './points.js';

export const myDate = (offsetDays = 0) => new Date(Date.now() + 8 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);
const diffIdx = (d) => Math.max(0, DIFFICULTIES.indexOf(d));

export function getStudent(db, id) {
  const s = db.prepare(`SELECT s.*, u.display_name, u.school_id, u.active FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id = ?`).get(id);
  if (!s) throw new AppError(404, 'Murid tidak dijumpai.');
  return s;
}

/* ------------------------------------------------------------ progress & unlocking */
export function isLevelUnlocked(db, student, level) {
  if (!level.active || !level.world_active) return false;
  if (student.year < level.min_year) return false;
  const prev = db.prepare('SELECT id FROM game_levels WHERE world_id = ? AND active = 1 AND level_no < ? ORDER BY level_no DESC LIMIT 1').get(level.world_id, level.level_no);
  if (!prev) return true;
  return !!db.prepare('SELECT 1 FROM student_progress WHERE student_id = ? AND level_id = ? AND passed = 1').get(student.user_id, prev.id);
}

/** Tetapan tahap setiap sekolah (override) digabungkan ke atas nilai lalai tahap. */
export function applyLevelSettings(level, o) {
  if (!o) return level;
  if (o.pass_percent != null) level.pass_percent = o.pass_percent;
  if (o.num_questions != null) level.num_questions = o.num_questions;
  if (o.time_limit_sec != null) level.time_limit_sec = o.time_limit_sec === 0 ? null : o.time_limit_sec;
  if (o.bonus_points != null) level.bonus_points = o.bonus_points;
  return level;
}
export const schoolLevelSettings = (db, schoolId) => new Map(db.prepare('SELECT * FROM school_level_settings WHERE school_id = ?').all(schoolId).map((o) => [o.level_id, o]));

export function upsertLevelSettings(db, schoolId, levelId, v) {
  if (!db.prepare('SELECT 1 FROM game_levels WHERE id = ?').get(levelId)) throw new AppError(404, 'Tahap tidak dijumpai.');
  const chk = (x, lo, hi, label, nullable) => {
    if ((x === '' || x == null) && nullable) return null;
    const n = Number(x);
    if (!Number.isInteger(n) || n < lo || n > hi) throw new AppError(400, `${label} mesti nombor bulat antara ${lo} dan ${hi}.`);
    return n;
  };
  const pass = chk(v.pass_percent, 40, 100, 'Peratus lulus', true);
  const num = chk(v.num_questions, 3, 30, 'Bilangan soalan', true);
  const time = !v.time_limit_sec ? 0 : chk(v.time_limit_sec, 5, 600, 'Had masa', false); // kosong/0 = tiada had masa
  const bonus = chk(v.bonus_points, 0, 5000, 'Mata bonus', true);
  db.prepare(`INSERT INTO school_level_settings(school_id, level_id, pass_percent, num_questions, time_limit_sec, bonus_points, updated_at) VALUES (?,?,?,?,?,?,datetime('now'))
    ON CONFLICT(school_id, level_id) DO UPDATE SET pass_percent = excluded.pass_percent, num_questions = excluded.num_questions, time_limit_sec = excluded.time_limit_sec, bonus_points = excluded.bonus_points, updated_at = excluded.updated_at`)
    .run(schoolId, levelId, pass, num, time, bonus);
}

export function levelWithWorld(db, levelId, schoolId = null) {
  const l = db.prepare(`SELECT l.*, w.min_year, w.active AS world_active, w.name AS world_name, w.code AS world_code, w.topic_id, t.code AS topic_code
    FROM game_levels l JOIN game_worlds w ON w.id = l.world_id JOIN mathematics_topics t ON t.id = w.topic_id WHERE l.id = ?`).get(levelId);
  if (!l) throw new AppError(404, 'Tahap tidak dijumpai.');
  if (schoolId) applyLevelSettings(l, db.prepare('SELECT * FROM school_level_settings WHERE school_id = ? AND level_id = ?').get(schoolId, levelId));
  return l;
}

export function listWorlds(db, studentId) {
  const st = getStudent(db, studentId);
  const worlds = db.prepare(`SELECT w.*, t.code AS topic_code FROM game_worlds w JOIN mathematics_topics t ON t.id = w.topic_id WHERE w.active = 1 AND (w.school_id IS NULL OR w.school_id = ?) ORDER BY w.sort_order, w.id`).all(st.school_id);
  const levels = db.prepare('SELECT * FROM game_levels WHERE world_id = ? AND active = 1 ORDER BY level_no');
  const overrides = schoolLevelSettings(db, st.school_id);
  const prog = new Map(db.prepare('SELECT * FROM student_progress WHERE student_id = ?').all(studentId).map((p) => [p.level_id, p]));
  const assigned = new Set(db.prepare(`SELECT level_id FROM assignments WHERE class_id = ?`).all(st.class_id ?? -1).map((a) => a.level_id));
  return worlds.map((w) => {
    const yearLocked = st.year < w.min_year;
    let prevPassed = true;
    const lv = levels.all(w.id).map((l0) => {
      const l = applyLevelSettings({ ...l0 }, overrides.get(l0.id));
      const p = prog.get(l.id);
      const unlocked = !yearLocked && prevPassed;
      prevPassed = !!p?.passed;
      return {
        id: l.id, level_no: l.level_no, title: l.title, difficulty: l.difficulty, num_questions: l.num_questions, pass_percent: l.pass_percent,
        time_limit_sec: l.time_limit_sec, is_boss: l.is_boss, unlocked, passed: !!p?.passed, stars: p?.stars || 0, best_percent: p?.best_percent || 0,
        attempts: p?.attempts || 0, assigned: assigned.has(l.id),
      };
    });
    const passedCount = lv.filter((l) => l.passed).length;
    return {
      id: w.id, code: w.code, name: w.name, description: w.description, theme: w.theme, icon: w.icon, min_year: w.min_year, year_locked: yearLocked,
      levels: lv, passed: passedCount, total: lv.length, stars: lv.reduce((s, l) => s + l.stars, 0), completed: lv.length > 0 && passedCount === lv.length,
    };
  });
}

/* ------------------------------------------------------------ question set building */
function bankToQuestion(row, optionRows, r) {
  const data = JSON.parse(row.data || '{}');
  const base = { type: row.qtype, text: row.text, explanation: row.explanation, hint: row.hint || 'Baca soalan dengan teliti.', visual: data.visual, unit: data.unit, time_limit_sec: row.time_limit_sec };
  let q;
  if (row.qtype === 'match') {
    const pairs = data.pairs;
    const rights = r.shuffle(pairs.map((p) => p[1]));
    q = { ...base, lefts: pairs.map((p) => p[0]), rights, answer: pairs.map((p) => rights.indexOf(p[1])), answerText: pairs.map((p) => `${p[0]} → ${p[1]}`).join('; '), input: 'match' };
  } else if (optionRows.length) {
    const shuffled = r.shuffle(optionRows);
    const ans = shuffled.findIndex((o) => o.is_correct);
    q = { ...base, options: shuffled.map((o) => o.text), answer: ans, answerText: shuffled[ans]?.text, input: 'mcq' };
  } else {
    q = { ...base, answer: Number(row.answer), answerText: row.answer + (data.unit ? ` ${data.unit}` : ''), input: row.qtype === 'count' ? 'count' : 'number' };
  }
  q.source_question_id = row.id;
  return validateQuestion(q);
}

const questionKey = (q) => JSON.stringify([q.text, q.visual || null, q.lefts || null]);

export function buildQuestions(db, { student, count, topicId, generatorKeys, difficulty, timeLimit, rng, topicIds }) {
  const r = rng || makeRng();
  const di = diffIdx(difficulty);
  const recent = new Set(db.prepare('SELECT question_id FROM student_answers WHERE student_id = ? AND question_id IS NOT NULL ORDER BY id DESC LIMIT 80').all(student.user_id).map((x) => x.question_id));
  let bank = [];
  if (topicId) {
    bank = db.prepare(`SELECT * FROM questions WHERE active = 1 AND topic_id = ? AND difficulty = ? AND year IN (?, ?) AND (school_id IS NULL OR school_id = ?)`)
      .all(topicId, difficulty, student.year, Math.max(1, student.year - 1), student.school_id).filter((x) => !recent.has(x.id));
    bank = r.shuffle(bank);
  }
  const optStmt = db.prepare('SELECT idx, text, is_correct FROM question_options WHERE question_id = ? ORDER BY idx');
  const topicIdByCode = new Map(db.prepare('SELECT id, code FROM mathematics_topics').all().map((t) => [t.code, t.id]));
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    let q = null;
    if (bank.length && r.chance(0.35)) {
      const row = bank.pop();
      try { q = bankToQuestion(row, optStmt.all(row.id), r); q.topic_id = row.topic_id; } catch { q = null; }
    }
    if (!q) {
      try {
        const key = r.pick(generatorKeys);
        q = generate(key, r, student.year, di);
        q.topic_id = topicIdByCode.get(GENERATORS[key].topic) ?? topicId;
      } catch { continue; }
    }
    const k = questionKey(q);
    if (seen.has(k) && guard < count * 25) continue;
    seen.add(k);
    q.time_limit_sec = q.time_limit_sec || timeLimit || null;
    out.push(q);
  }
  if (out.length < count) throw new AppError(500, 'Tidak dapat menjana soalan yang mencukupi untuk tahap ini.');
  return out;
}

const publicPart = (q, idx) => ({
  idx, type: q.type, input: q.input, text: q.text, options: q.options, lefts: q.lefts, rights: q.rights,
  visual: q.visual, unit: q.unit, time_limit_sec: q.time_limit_sec || null,
});

function createSession(db, student, { level, kind, dailyDate, questions, passPercent, timeLimit }) {
  return tx(db, () => {
    const res = db.prepare(`INSERT INTO game_sessions(student_id, level_id, kind, daily_date, total, pass_percent, time_limit_sec) VALUES (?,?,?,?,?,?,?)`)
      .run(student.user_id, level?.id ?? null, kind, dailyDate ?? null, questions.length, passPercent, timeLimit ?? null);
    const sid = Number(res.lastInsertRowid);
    const ins = db.prepare('INSERT INTO session_questions(session_id, idx, source_question_id, topic_id, payload, secret, started_at) VALUES (?,?,?,?,?,?,?)');
    questions.forEach((q, i) => {
      ins.run(sid, i, q.source_question_id ?? null, q.topic_id ?? null, JSON.stringify(publicPart(q, i)),
        JSON.stringify({ input: q.input, answer: q.answer, explanation: q.explanation, hint: q.hint, answerText: q.answerText, hintUsed: false }), null);
    });
    return sid;
  });
}

/* ------------------------------------------------------------ starting sessions */
function abandonStale(db, studentId) {
  db.prepare(`UPDATE game_sessions SET status = 'abandoned' WHERE student_id = ? AND status = 'active' AND started_at < datetime('now', '-6 hours')`).run(studentId);
}

export function startLevel(db, studentId, levelId, rng) {
  const student = getStudent(db, studentId);
  if (!student.active) throw new AppError(403, 'Akaun tidak aktif.');
  const level = levelWithWorld(db, levelId, student.school_id);
  if (!isLevelUnlocked(db, student, level)) throw new AppError(403, 'Tahap ini masih dikunci. Lulus tahap sebelumnya dahulu.', 'tahap_dikunci');
  abandonStale(db, studentId);
  const existing = db.prepare(`SELECT id FROM game_sessions WHERE student_id = ? AND level_id = ? AND status = 'active'`).get(studentId, levelId);
  if (existing) return sessionState(db, studentId, existing.id);
  let keys = generatorsFor(student.year, JSON.parse(level.generators));
  if (!keys.length) keys = generatorsForTopic(level.topic_code, student.year);
  if (!keys.length) throw new AppError(409, 'Tiada soalan sesuai untuk tahun anda di tahap ini.');
  const questions = buildQuestions(db, { student, count: level.num_questions, topicId: level.topic_id, generatorKeys: keys, difficulty: level.difficulty, timeLimit: level.time_limit_sec, rng });
  const sid = createSession(db, student, { level, kind: 'level', questions, passPercent: level.pass_percent, timeLimit: level.time_limit_sec });
  return sessionState(db, studentId, sid);
}

export function dailyStatus(db, studentId) {
  const today = myDate();
  const row = db.prepare(`SELECT id, status, percent, passed FROM game_sessions WHERE student_id = ? AND kind = 'daily' AND daily_date = ? ORDER BY id DESC LIMIT 1`).get(studentId, today);
  return { date: today, done: row?.status === 'finished', active: row?.status === 'active' ? row.id : null, passed: !!row?.passed };
}

export function startDaily(db, studentId, rng) {
  const student = getStudent(db, studentId);
  if (!student.active) throw new AppError(403, 'Akaun tidak aktif.');
  const st = dailyStatus(db, studentId);
  if (st.done) throw new AppError(409, 'Cabaran harian hari ini sudah selesai. Datang lagi esok!', 'harian_selesai');
  if (st.active) return sessionState(db, studentId, st.active);
  const settings = getSettings(db, student.school_id);
  const pool = ['nombor', 'tambah_tolak', 'darab', 'bahagi', 'pecahan', 'perpuluhan', 'wang', 'masa', 'ukuran', 'masalah'].flatMap((t) => generatorsForTopic(t, student.year));
  const questions = buildQuestions(db, { student, count: settings.daily_questions, topicId: null, generatorKeys: pool, difficulty: 'sederhana', rng });
  const sid = createSession(db, student, { level: null, kind: 'daily', dailyDate: st.date, questions, passPercent: 60 });
  return sessionState(db, studentId, sid);
}

/* ------------------------------------------------------------ session state & answers */
function ownSession(db, studentId, sessionId) {
  const s = db.prepare('SELECT * FROM game_sessions WHERE id = ? AND student_id = ?').get(sessionId, studentId);
  if (!s) throw new AppError(404, 'Sesi permainan tidak dijumpai.');
  return s;
}

export function sessionState(db, studentId, sessionId) {
  const s = ownSession(db, studentId, sessionId);
  const qs = db.prepare('SELECT idx, payload, started_at FROM session_questions WHERE session_id = ? ORDER BY idx').all(sessionId);
  const answers = db.prepare('SELECT idx, is_correct FROM student_answers WHERE session_id = ? ORDER BY idx').all(sessionId);
  const current = answers.length;
  const cur = qs[current];
  const payload = cur ? JSON.parse(cur.payload) : null;
  const limit = payload?.time_limit_sec;
  let level = null;
  if (s.level_id) {
    const l = levelWithWorld(db, s.level_id);
    level = { id: l.id, title: l.title, level_no: l.level_no, world_name: l.world_name, world_code: l.world_code, is_boss: l.is_boss };
  }
  return {
    id: s.id, kind: s.kind, status: s.status, total: s.total, pass_percent: s.pass_percent, level,
    current, answered: answers.map((a) => !!a.is_correct),
    questions: qs.map((q) => JSON.parse(q.payload)),
    remaining_ms: limit ? (cur?.started_at ? Math.max(0, limit * 1000 - (Date.now() - Number(cur.started_at))) : limit * 1000) : null,
    result: s.result ? JSON.parse(s.result) : null,
  };
}

export function submitAnswer(db, studentId, sessionId, idx, response) {
  return tx(db, () => {
    const s = ownSession(db, studentId, sessionId);
    if (s.status !== 'active') throw new AppError(409, 'Sesi ini sudah tamat.');
    if (!Number.isInteger(idx) || idx < 0 || idx >= s.total) throw new AppError(400, 'Nombor soalan tidak sah.');
    const prev = db.prepare('SELECT * FROM student_answers WHERE session_id = ? AND idx = ?').get(sessionId, idx);
    const q = db.prepare('SELECT * FROM session_questions WHERE session_id = ? AND idx = ?').get(sessionId, idx);
    const secret = JSON.parse(q.secret);
    const feedback = (correct, timedOut) => ({
      correct: !!correct, timed_out: !!timedOut, answer_text: correct ? undefined : secret.answerText, explanation: correct ? undefined : secret.explanation, next: idx + 1, done: idx + 1 >= s.total,
    });
    if (prev) return { ...feedback(prev.is_correct, prev.timed_out), replay: true }; // duplicate submit: same result, nothing recounted
    const answeredCount = db.prepare('SELECT COUNT(*) c FROM student_answers WHERE session_id = ?').get(sessionId).c;
    if (idx !== answeredCount) throw new AppError(409, 'Jawab soalan mengikut urutan.');
    const payload = JSON.parse(q.payload);
    const now = Date.now();
    const elapsed = q.started_at ? now - Number(q.started_at) : null;
    // timed question never 'begun' by the client = no valid timer, counted as timed out
    const timedOut = !!(payload.time_limit_sec && (elapsed == null || elapsed > (payload.time_limit_sec + 3) * 1000));
    const correct = !timedOut && checkAnswer(secret, response);
    db.prepare(`INSERT INTO student_answers(session_id, student_id, idx, question_id, topic_id, response, is_correct, timed_out, hint_used, elapsed_ms) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(sessionId, studentId, idx, q.source_question_id, q.topic_id, JSON.stringify(response ?? null).slice(0, 500), correct ? 1 : 0, timedOut ? 1 : 0, secret.hintUsed ? 1 : 0, elapsed);
    return feedback(correct, timedOut);
  });
}

/** Client calls this when a question is actually shown; starts the server-side clock once. */
export function beginQuestion(db, studentId, sessionId, idx) {
  const s = ownSession(db, studentId, sessionId);
  if (s.status !== 'active') throw new AppError(409, 'Sesi ini sudah tamat.');
  const answered = db.prepare('SELECT COUNT(*) c FROM student_answers WHERE session_id = ?').get(sessionId).c;
  if (idx !== answered) throw new AppError(409, 'Bukan soalan semasa.');
  db.prepare('UPDATE session_questions SET started_at = ? WHERE session_id = ? AND idx = ? AND started_at IS NULL').run(Date.now(), sessionId, idx);
  return sessionState(db, studentId, sessionId).remaining_ms === null ? { remaining_ms: null } : { remaining_ms: sessionState(db, studentId, sessionId).remaining_ms };
}

export function getHint(db, studentId, sessionId, idx) {
  const s = ownSession(db, studentId, sessionId);
  if (s.status !== 'active') throw new AppError(409, 'Sesi ini sudah tamat.');
  const answered = db.prepare('SELECT COUNT(*) c FROM student_answers WHERE session_id = ?').get(sessionId).c;
  if (idx !== answered) throw new AppError(409, 'Petunjuk hanya untuk soalan semasa.');
  const q = db.prepare('SELECT secret FROM session_questions WHERE session_id = ? AND idx = ?').get(sessionId, idx);
  const secret = JSON.parse(q.secret);
  secret.hintUsed = true;
  db.prepare('UPDATE session_questions SET secret = ? WHERE session_id = ? AND idx = ?').run(JSON.stringify(secret), sessionId, idx);
  return { hint: secret.hint };
}

/* ------------------------------------------------------------ finishing, points, badges */
export function finishSession(db, studentId, sessionId) {
  return tx(db, () => {
    const s = ownSession(db, studentId, sessionId);
    if (s.status === 'finished') return JSON.parse(s.result); // idempotent: never pays twice
    if (s.status !== 'active') throw new AppError(409, 'Sesi ini sudah ditamatkan.');
    const answers = db.prepare('SELECT idx, is_correct FROM student_answers WHERE session_id = ? ORDER BY idx').all(sessionId);
    if (answers.length < s.total) throw new AppError(409, 'Jawab semua soalan sebelum menamatkan sesi.');
    const student = getStudent(db, studentId);
    const settings = getSettings(db, student.school_id);
    const correct = answers.filter((a) => a.is_correct).length;
    const percent = Math.round((correct / s.total) * 100);
    const passed = percent >= s.pass_percent;
    const repeat = settings.repeat_rewards === 1;
    const awards = [];
    const give = (type, amount, key, label) => {
      const res = earn(db, studentId, type, amount, key, 'session', sessionId, label);
      if (res.applied) {
        const prev = awards.find((a) => a.type === type);
        if (prev) { prev.points += amount; prev.count += 1; prev.label = `${label.replace(/ \(harian\)$/, '')} ×${prev.count}`; } else awards.push({ type, label, points: amount, count: 1 });
      }
    };
    let level = null;
    let worldCompleted = false;
    let stars = 0;
    let unlockedNext = null;
    if (s.kind === 'level') {
      level = levelWithWorld(db, s.level_id, student.school_id);
      const scope = repeat ? `s${sessionId}` : `lv${level.id}`;
      // per-question points: one award per level question slot per student (no farming by replay)
      for (const a of answers) if (a.is_correct) give('correct_answer', settings.points_correct, `q:${scope}:${studentId}:${a.idx}`, 'Jawapan betul');
      if (passed) {
        give('level_complete', level.bonus_points ?? settings.points_level_complete, `done:${scope}:${studentId}`, `Tamat tahap ${level.level_no}`);
        if (percent === 100) give('perfect_score', settings.points_perfect, `perfect:${scope}:${studentId}`, 'Markah penuh');
      }
      stars = !passed ? 0 : percent === 100 ? 3 : percent >= 90 ? 2 : 1;
      const prog = db.prepare('SELECT * FROM student_progress WHERE student_id = ? AND level_id = ?').get(studentId, level.id);
      if (!prog) {
        db.prepare('INSERT INTO student_progress(student_id, level_id, attempts, best_percent, stars, passed, passed_at) VALUES (?,?,?,?,?,?,?)')
          .run(studentId, level.id, 1, percent, stars, passed ? 1 : 0, passed ? new Date().toISOString() : null);
      } else {
        db.prepare(`UPDATE student_progress SET attempts = attempts + 1, best_percent = MAX(best_percent, ?), stars = MAX(stars, ?), passed = MAX(passed, ?),
          passed_at = COALESCE(passed_at, ?) WHERE student_id = ? AND level_id = ?`).run(percent, stars, passed ? 1 : 0, passed ? new Date().toISOString() : null, studentId, level.id);
      }
      if (passed) {
        const left = db.prepare(`SELECT COUNT(*) c FROM game_levels l WHERE l.world_id = ? AND l.active = 1 AND NOT EXISTS
          (SELECT 1 FROM student_progress p WHERE p.level_id = l.id AND p.student_id = ? AND p.passed = 1)`).get(level.world_id, studentId).c;
        if (left === 0) {
          worldCompleted = true;
          give('world_complete', settings.points_world_complete, `world:${level.world_id}:${studentId}`, `Tamat dunia ${level.world_name}`);
        }
        const next = db.prepare('SELECT id, level_no, title FROM game_levels WHERE world_id = ? AND active = 1 AND level_no > ? ORDER BY level_no LIMIT 1').get(level.world_id, level.level_no);
        unlockedNext = next || null;
      }
    } else {
      for (const a of answers) if (a.is_correct) give('correct_answer', settings.points_correct, `q:daily:${s.daily_date}:${studentId}:${a.idx}`, 'Jawapan betul (harian)');
      if (passed) give('daily', settings.points_daily, `daily:${s.daily_date}:${studentId}`, 'Cabaran harian');
      stars = passed ? (percent === 100 ? 3 : percent >= 90 ? 2 : 1) : 0;
    }
    // tandakan sesi selesai DAHULU supaya sesi ini turut dikira dalam kriteria lencana (cth markah penuh ke-10)
    db.prepare(`UPDATE game_sessions SET status = 'finished', correct = ?, percent = ?, passed = ?, finished_at = datetime('now') WHERE id = ?`).run(correct, percent, passed ? 1 : 0, sessionId);
    const newBadges = evaluateBadges(db, studentId);
    const fresh = db.prepare('SELECT points_balance, points_lifetime FROM students WHERE user_id = ?').get(studentId);
    const result = {
      session_id: sessionId, kind: s.kind, correct, total: s.total, percent, passed, pass_percent: s.pass_percent, stars,
      awards, points_earned: awards.reduce((x, a) => x + a.points, 0), balance: fresh.points_balance, lifetime: fresh.points_lifetime,
      world_completed: worldCompleted, next_level: unlockedNext, new_badges: newBadges,
      level: level ? { id: level.id, title: level.title, level_no: level.level_no, world_name: level.world_name } : null,
    };
    db.prepare('UPDATE game_sessions SET result = ? WHERE id = ?').run(JSON.stringify(result), sessionId);
    return result;
  });
}

export function evaluateBadges(db, studentId) {
  const have = new Set(db.prepare('SELECT badge_id FROM student_achievements WHERE student_id = ?').all(studentId).map((b) => b.badge_id));
  const badges = db.prepare('SELECT * FROM achievement_badges').all().filter((b) => !have.has(b.id));
  if (!badges.length) return [];
  const passedLevels = db.prepare('SELECT COUNT(*) c FROM student_progress WHERE student_id = ? AND passed = 1').get(studentId).c;
  const perfect = db.prepare(`SELECT COUNT(*) c FROM game_sessions WHERE student_id = ? AND status = 'finished' AND percent = 100 AND kind = 'level'`).get(studentId).c;
  const lifetime = db.prepare('SELECT points_lifetime FROM students WHERE user_id = ?').get(studentId).points_lifetime;
  const worldsDone = db.prepare(`SELECT COUNT(*) c FROM game_worlds w WHERE w.active = 1
    AND EXISTS (SELECT 1 FROM game_levels l WHERE l.world_id = w.id AND l.active = 1)
    AND NOT EXISTS (SELECT 1 FROM game_levels l WHERE l.world_id = w.id AND l.active = 1
      AND NOT EXISTS (SELECT 1 FROM student_progress p WHERE p.level_id = l.id AND p.student_id = ? AND p.passed = 1))`).get(studentId).c;
  const earned = [];
  for (const b of badges) {
    const c = JSON.parse(b.criteria);
    let ok = false;
    if (b.criteria_type === 'levels_passed') ok = passedLevels >= c.count;
    else if (b.criteria_type === 'perfect_scores') ok = perfect >= c.count;
    else if (b.criteria_type === 'lifetime_points') ok = lifetime >= c.count;
    else if (b.criteria_type === 'worlds_completed') ok = worldsDone >= c.count;
    else if (b.criteria_type === 'level_pass') {
      ok = !!db.prepare(`SELECT 1 FROM student_progress p JOIN game_levels l ON l.id = p.level_id JOIN game_worlds w ON w.id = l.world_id
        WHERE p.student_id = ? AND p.passed = 1 AND w.code = ? AND l.level_no = ?`).get(studentId, c.world, c.level_no);
    }
    if (ok) {
      const r = db.prepare('INSERT OR IGNORE INTO student_achievements(student_id, badge_id) VALUES (?,?)').run(studentId, b.id);
      if (r.changes) earned.push({ code: b.code, name: b.name, icon: b.icon, description: b.description });
    }
  }
  return earned;
}
