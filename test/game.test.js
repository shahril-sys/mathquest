import test from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, uid, student, levelId, playLevel, answerSession, setBalance } from './helpers.js';
import * as game from '../src/services/game.js';
import { getSettings, saveSettings } from '../src/db.js';
import { makeRng } from '../src/engine/random.js';

const ledgerSum = (db, id) => ({ ...db.prepare('SELECT COALESCE(SUM(balance_delta),0) b, COALESCE(SUM(lifetime_delta),0) l FROM point_transactions WHERE student_id = ?').get(id) });

test('pembukaan tahap: tahap seterusnya dikunci sehingga tahap sebelumnya lulus', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006'); // Tahun 2
  assert.throws(() => game.startLevel(db, sid, levelId(db, 'pulau_tambah_tolak', 2)), /dikunci/);
  const r1 = playLevel(db, 'M26006', levelId(db, 'pulau_tambah_tolak', 1), 4); // 40% -> gagal
  assert.equal(r1.passed, false);
  assert.throws(() => game.startLevel(db, sid, levelId(db, 'pulau_tambah_tolak', 2)), /dikunci/);
  const r2 = playLevel(db, 'M26006', levelId(db, 'pulau_tambah_tolak', 1), 7); // tepat 70% -> lulus
  assert.equal(r2.passed, true);
  assert.equal(r2.next_level.level_no, 2);
  assert.doesNotThrow(() => game.startLevel(db, sid, levelId(db, 'pulau_tambah_tolak', 2)));
});

test('kandungan mengikut tahun: dunia untuk tahun lebih tinggi dikunci', () => {
  const db = freshDb();
  const y1 = uid(db, 'M26001');
  assert.throws(() => game.startLevel(db, y1, levelId(db, 'hutan_darab', 1)), /dikunci/);
  assert.throws(() => game.startLevel(db, y1, levelId(db, 'planet_perpuluhan', 1)), /dikunci/);
  const worlds = game.listWorlds(db, y1);
  assert.equal(worlds.find((w) => w.code === 'hutan_darab').year_locked, true);
  assert.equal(worlds.find((w) => w.code === 'dunia_nombor').year_locked, false);
});

test('pengiraan mata: betul + tamat tahap + markah penuh, jumlah ledger sepadan baki', () => {
  const db = freshDb();
  const id = uid(db, 'M26006');
  const r = playLevel(db, 'M26006', levelId(db, 'pulau_tambah_tolak', 1), 10);
  assert.equal(r.points_earned, 10 * 10 + 50 + 100);
  assert.equal(r.stars, 3);
  const st = student(db, 'M26006');
  assert.equal(st.points_balance, 250);
  assert.equal(st.points_lifetime, 250);
  assert.deepEqual(ledgerSum(db, id), { b: 250, l: 250 });
  assert.ok(r.new_badges.some((b) => b.code === 'raja_tambah'), 'lencana Raja Tambah');
});

test('mata boleh dikonfigurasi oleh pentadbir', () => {
  const db = freshDb();
  saveSettings(db, 1, { points_correct: 5, points_level_complete: 20, points_perfect: 0 });
  const r = playLevel(db, 'M26006', levelId(db, 'pulau_tambah_tolak', 1), 10);
  assert.equal(r.points_earned, 10 * 5 + 20);
  assert.throws(() => saveSettings(db, 1, { points_correct: -1 }), /antara/);
});

test('pencegahan ganjaran pendua: tamat sesi dua kali, main semula dan muat semula tidak menggandakan mata', () => {
  const db = freshDb();
  const id = uid(db, 'M26006');
  const lvl = levelId(db, 'pulau_tambah_tolak', 1);
  const st = game.startLevel(db, id, lvl, makeRng(3));
  const first = answerSession(db, id, st, 10);
  const again = game.finishSession(db, id, st.id); // panggilan kedua: keputusan sama, tiada mata baharu
  assert.deepEqual(JSON.parse(JSON.stringify(again)), JSON.parse(JSON.stringify(first)));
  const afterFirst = student(db, 'M26006').points_balance;
  // jawab semula soalan sama = tiada kesan
  const replay = game.submitAnswer; assert.throws(() => replay(db, id, st.id, 0, { choice: 0 }), /tamat/);
  // main semula tahap yang sudah lulus: tiada mata
  const r2 = playLevel(db, 'M26006', lvl, 10, 4);
  assert.equal(r2.points_earned, 0);
  assert.equal(student(db, 'M26006').points_balance, afterFirst);
  assert.deepEqual(ledgerSum(db, id), { b: afterFirst, l: afterFirst });
});

test('penternakan mata dihalang: gagal berulang tidak boleh mengumpul mata soalan yang sama', () => {
  const db = freshDb();
  const lvl = levelId(db, 'pulau_tambah_tolak', 1);
  const a = playLevel(db, 'M26006', lvl, 6, 5); // 6 betul, gagal
  const b = playLevel(db, 'M26006', lvl, 6, 6); // slot sama lagi
  assert.equal(a.points_earned, 60);
  assert.equal(b.points_earned, 0);
});

test('ganjaran berulang hanya jika pentadbir mengaktifkannya secara jelas', () => {
  const db = freshDb();
  saveSettings(db, 1, { repeat_rewards: 1 });
  const lvl = levelId(db, 'pulau_tambah_tolak', 1);
  playLevel(db, 'M26006', lvl, 10, 1);
  const r = playLevel(db, 'M26006', lvl, 10, 2);
  assert.equal(r.points_earned, 250);
});

test('bonus tamat dunia diberi sekali sahaja', () => {
  const db = freshDb();
  const id = uid(db, 'M26001');
  const wid = db.prepare("SELECT id FROM game_worlds WHERE code = 'dunia_masa'").get().id;
  const ids = db.prepare('SELECT id FROM game_levels WHERE world_id = ? ORDER BY level_no').all(wid).map((x) => x.id);
  let last;
  for (const l of ids) last = playLevel(db, 'M26001', l, 10, l);
  assert.equal(last.world_completed, true);
  assert.ok(last.awards.some((a) => a.type === 'world_complete' && a.points === 200));
  assert.equal(db.prepare("SELECT COUNT(*) c FROM point_transactions WHERE student_id = ? AND type = 'world_complete'").get(id).c, 1);
  assert.ok(last.new_badges.length >= 0);
});

test('jawapan tidak boleh dimanipulasi: tidak boleh langkau soalan dan jawapan tidak bocor kepada klien', () => {
  const db = freshDb();
  const id = uid(db, 'M26006');
  const st = game.startLevel(db, id, levelId(db, 'pulau_tambah_tolak', 1), makeRng(9));
  const json = JSON.stringify(st);
  assert.ok(!/"answer"|explanation|secret/.test(json), 'tiada jawapan dalam payload');
  assert.throws(() => game.submitAnswer(db, id, st.id, 3, { choice: 0 }), /urutan/);
  assert.throws(() => game.finishSession(db, id, st.id), /Jawab semua/);
  const other = uid(db, 'M26007');
  assert.throws(() => game.sessionState(db, other, st.id), /tidak dijumpai/);
});

test('cabaran bermasa: soalan yang tidak dimulakan atau melebihi had masa dikira salah', () => {
  const db = freshDb();
  const id = uid(db, 'M26006');
  const st = game.startLevel(db, id, (() => { const l = levelId(db, 'pulau_tambah_tolak', 8); db.prepare('UPDATE game_levels SET time_limit_sec = 30 WHERE id = ?').run(l); db.prepare("INSERT INTO student_progress(student_id, level_id, passed, best_percent, stars, attempts) SELECT ?, id, 1, 100, 3, 1 FROM game_levels WHERE world_id = (SELECT world_id FROM game_levels WHERE id = ?) AND level_no < 8").run(id, l); return l; })(), makeRng(2));
  const secret = JSON.parse(db.prepare('SELECT secret FROM session_questions WHERE session_id = ? AND idx = 0').get(st.id).secret);
  const resp = secret.input === 'mcq' ? { choice: secret.answer } : secret.input === 'match' ? { order: secret.answer } : { value: String(secret.answer) };
  const r = game.submitAnswer(db, id, st.id, 0, resp); // tidak pernah "begin" -> tiada jam sah
  assert.equal(r.correct, false);
  assert.equal(r.timed_out, true);
  game.beginQuestion(db, id, st.id, 1);
  db.prepare('UPDATE session_questions SET started_at = ? WHERE session_id = ? AND idx = 1').run(Date.now() - 60_000, st.id);
  const s1 = JSON.parse(db.prepare('SELECT secret FROM session_questions WHERE session_id = ? AND idx = 1').get(st.id).secret);
  const r1 = game.submitAnswer(db, id, st.id, 1, s1.input === 'mcq' ? { choice: s1.answer } : s1.input === 'match' ? { order: s1.answer } : { value: String(s1.answer) });
  assert.equal(r1.correct, false);
});

test('cabaran harian: sekali sehari dengan bonus 20 mata', () => {
  const db = freshDb();
  const id = uid(db, 'M26010');
  const st = game.startDaily(db, id, makeRng(11));
  const r = answerSession(db, id, st, st.total);
  assert.ok(r.awards.some((a) => a.type === 'daily' && a.points === getSettings(db, 1).points_daily));
  assert.throws(() => game.startDaily(db, id), /sudah selesai/);
});

void setBalance;
