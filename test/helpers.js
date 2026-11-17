import http from 'node:http';
import { openDb, migrate } from '../src/db.js';
import { seedDemo } from '../src/seed.js';
import { createApp } from '../src/app.js';
import * as game from '../src/services/game.js';
import { makeRng } from '../src/engine/random.js';

export const PASSWORD = 'MathQuest#2026';

export function freshDb() {
  const db = openDb(':memory:');
  migrate(db);
  seedDemo(db, { password: PASSWORD, simulate: false });
  return db;
}

export const uid = (db, username) => db.prepare('SELECT id FROM users WHERE username = ?').get(username).id;
export const student = (db, username) => db.prepare('SELECT * FROM students WHERE user_id = ?').get(uid(db, username));
export const levelId = (db, worldCode, no) => db.prepare('SELECT l.id FROM game_levels l JOIN game_worlds w ON w.id = l.world_id WHERE w.code = ? AND l.level_no = ?').get(worldCode, no).id;
export const setBalance = (db, studentId, n) => db.prepare('UPDATE students SET points_balance = ?, points_lifetime = MAX(points_lifetime, ?) WHERE user_id = ?').run(n, n, studentId);

/** Play a started session with a given number of correct answers (reads real answers from the DB, as a bot would). */
export function answerSession(db, studentId, state, nCorrect) {
  const rows = db.prepare('SELECT idx, secret FROM session_questions WHERE session_id = ? ORDER BY idx').all(state.id);
  const answered = state.answered.length;
  rows.forEach((q) => {
    if (q.idx < answered) return;
    const s = JSON.parse(q.secret);
    const right = q.idx < nCorrect;
    game.beginQuestion(db, studentId, state.id, q.idx);
    const wrongChoice = s.input === 'mcq' ? (s.answer + 1) % state.questions[q.idx].options.length : null;
    const resp = s.input === 'mcq' ? { choice: right ? s.answer : wrongChoice } : s.input === 'match' ? { order: right ? s.answer : [...s.answer].reverse().concat(99) } : { value: String(right ? s.answer : Number(s.answer) + 1) };
    game.submitAnswer(db, studentId, state.id, q.idx, resp);
  });
  return game.finishSession(db, studentId, state.id);
}

export function playLevel(db, username, levelIdNo, nCorrect, seed = 1) {
  const sid = uid(db, username);
  const st = game.startLevel(db, sid, levelIdNo, makeRng(seed));
  return answerSession(db, sid, st, nCorrect);
}

/** Real HTTP server around the app, with a small cookie-aware client. */
export async function startServer(db) {
  const server = http.createServer(createApp(db, { rateLimit: false }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    const call = async (method, path, body, extra = {}) => {
      const res = await fetch(base + path, { method, headers: { 'X-Requested-With': 'mathquest', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extra }, body: body !== undefined ? JSON.stringify(body) : undefined });
      const set = res.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0];
      const text = await res.text();
      let json = null; try { json = JSON.parse(text); } catch { /* csv etc */ }
      return { status: res.status, json, text, headers: res.headers };
    };
    return { call, login: (u, p = PASSWORD) => call('POST', '/api/auth/login', { username: u, password: p }) };
  };
  return { base, client, close: () => new Promise((r) => server.close(r)) };
}
