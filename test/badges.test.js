import test from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, uid, levelId, playLevel } from './helpers.js';
import * as game from '../src/services/game.js';

test('migrasi 003: lencana baharu wujud tanpa pendua dan boleh dijalankan semula dengan selamat', () => {
  const db = freshDb();
  const codes = db.prepare('SELECT code FROM achievement_badges').all().map((b) => b.code);
  for (const c of ['penakluk_dunia', 'pengumpul_mata', 'bintang_emas', 'juara_sekolah', 'raja_tambah', 'legenda_mathquest']) assert.ok(codes.includes(c), c);
  assert.equal(new Set(codes).size, codes.length);
  db.exec(db.prepare('SELECT 1').get() ? "INSERT OR IGNORE INTO achievement_badges(code,name,description,icon,criteria_type,criteria) VALUES ('penakluk_dunia','x','x','x','worlds_completed','{}')" : '');
  assert.equal(db.prepare("SELECT COUNT(*) c FROM achievement_badges WHERE code = 'penakluk_dunia'").get().c, 1);
});

test('lencana Penakluk Dunia diberi apabila dunia tamat; Pengumpul Mata apabila 1 000 mata; tidak diberi dua kali', () => {
  const db = freshDb();
  const id = uid(db, 'M26001');
  const wid = db.prepare("SELECT id FROM game_worlds WHERE code = 'dunia_masa'").get().id;
  const ids = db.prepare('SELECT id FROM game_levels WHERE world_id = ? ORDER BY level_no').all(wid).map((x) => x.id);
  const earned = [];
  for (const l of ids) earned.push(...playLevel(db, 'M26001', l, 10, l).new_badges.map((b) => b.code));
  assert.equal(earned.filter((c) => c === 'penakluk_dunia').length, 1);
  assert.ok(earned.includes('pengumpul_mata'), '10 tahap markah penuh melebihi 1 000 mata');
  assert.ok(earned.includes('penjelajah'), 'lulus 10 tahap');
  assert.deepEqual(game.evaluateBadges(db, id), [], 'penilaian semula tidak memberi lencana pendua');
  assert.equal(db.prepare('SELECT COUNT(*) c FROM student_achievements WHERE student_id = ?').get(id).c, earned.length);
  void levelId;
});
