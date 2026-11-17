import { AppError, tx, audit } from '../db.js';
import { DIFFICULTIES } from '../engine/generators.js';
import { parseNumber } from '../engine/check.js';
import { parseCsv } from '../http.js';

const QTYPES = ['mcq', 'numeric', 'fill', 'word', 'visual', 'match', 'count'];
const VISUAL_KINDS = { objects: ['emoji', 'count'], groups: ['groups', 'op'], pie: ['parts', 'shaded'], clock: ['h', 'm'], ruler: ['length'], rect: ['w', 'h', 'unit'], tri: ['b', 'h', 'unit'], cuboid: ['l', 'w', 'h', 'unit'] };

function cleanVisual(v) {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'object' || !VISUAL_KINDS[v.kind]) throw new AppError(400, `Jenis visual mesti salah satu: ${Object.keys(VISUAL_KINDS).join(', ')}.`);
  const out = { kind: v.kind };
  for (const k of VISUAL_KINDS[v.kind]) {
    if (v[k] == null) continue;
    if (k === 'groups') {
      if (!Array.isArray(v.groups) || v.groups.length > 12) throw new AppError(400, 'Kumpulan visual tidak sah.');
      out.groups = v.groups.map((g) => ({ emoji: String(g.emoji || '🔵').slice(0, 4), count: Math.min(30, Math.max(0, Number(g.count) | 0)) }));
    } else if (['emoji', 'unit', 'op'].includes(k)) out[k] = String(v[k]).slice(0, 4);
    else { const n = Number(v[k]); if (!Number.isFinite(n) || n < 0 || n > 10000) throw new AppError(400, `Nilai visual "${k}" tidak sah.`); out[k] = n; }
  }
  return out;
}

/** Validate a question payload from the admin form / CSV and normalise it for storage. */
export function normalizeQuestion(db, input) {
  const topic = db.prepare('SELECT id FROM mathematics_topics WHERE code = ?').get(String(input.topic || ''));
  if (!topic) throw new AppError(400, 'Topik tidak sah.');
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 1 || year > 6) throw new AppError(400, 'Tahun mesti 1-6.');
  if (!DIFFICULTIES.includes(input.difficulty)) throw new AppError(400, 'Kesukaran tidak sah.');
  if (!QTYPES.includes(input.qtype)) throw new AppError(400, 'Jenis soalan tidak sah.');
  const text = String(input.text || '').trim();
  if (text.length < 5 || text.length > 500) throw new AppError(400, 'Soalan mesti 5-500 aksara.');
  const explanation = String(input.explanation || '').trim();
  if (explanation.length < 5 || explanation.length > 800) throw new AppError(400, 'Penjelasan penyelesaian wajib diisi (5-800 aksara).');
  const hint = String(input.hint || '').trim().slice(0, 300);
  let time = input.time_limit_sec === '' || input.time_limit_sec == null ? null : Number(input.time_limit_sec);
  if (time != null && (!Number.isInteger(time) || time < 5 || time > 600)) throw new AppError(400, 'Had masa mesti 5-600 saat.');
  const data = {};
  const options = [];
  let answer = '';
  const unit = input.unit ? String(input.unit).slice(0, 8) : '';
  if (unit) data.unit = unit;
  const visual = cleanVisual(input.visual);
  if (visual) data.visual = visual;
  if (input.qtype === 'match') {
    const pairs = Array.isArray(input.pairs) ? input.pairs.map((p) => [String(p?.[0] ?? '').trim(), String(p?.[1] ?? '').trim()]) : [];
    if (pairs.length < 2 || pairs.length > 6 || pairs.some((p) => !p[0] || !p[1] || p[0].length > 60 || p[1].length > 60)) throw new AppError(400, 'Padanan: 2-6 pasangan lengkap diperlukan.');
    if (new Set(pairs.map((p) => p[1])).size !== pairs.length || new Set(pairs.map((p) => p[0])).size !== pairs.length) throw new AppError(400, 'Padanan: kedua-dua lajur mesti unik.');
    data.pairs = pairs;
    answer = 'match';
  } else if (Array.isArray(input.options) && input.options.filter((o) => String(o).trim()).length) {
    const opts = input.options.map((o) => String(o).trim()).filter(Boolean);
    if (opts.length < 2 || opts.length > 6 || new Set(opts).size !== opts.length || opts.some((o) => o.length > 80)) throw new AppError(400, 'Pilihan jawapan: 2-6 pilihan unik diperlukan.');
    const correct = Number(input.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct >= opts.length) throw new AppError(400, 'Pilihan jawapan betul tidak sah.');
    opts.forEach((o, i) => options.push({ idx: i, text: o, is_correct: i === correct ? 1 : 0 }));
    answer = String(correct);
  } else {
    if (input.qtype === 'mcq') throw new AppError(400, 'Soalan pilihan jawapan memerlukan sekurang-kurangnya 2 pilihan.');
    const n = parseNumber(String(input.answer ?? ''));
    if (!Number.isFinite(n)) throw new AppError(400, 'Jawapan mesti nombor.');
    answer = String(n);
  }
  return { topic_id: topic.id, year, difficulty: input.difficulty, qtype: input.qtype, text, answer, explanation, hint, data: JSON.stringify(data), time_limit_sec: time, active: input.active === 0 || input.active === false ? 0 : 1, options };
}

export function saveQuestion(db, admin, input, existingId = null, schoolId = null) {
  const n = normalizeQuestion(db, input);
  return tx(db, () => {
    let qid = existingId;
    if (existingId) {
      const r = db.prepare(`UPDATE questions SET topic_id=?, year=?, difficulty=?, qtype=?, text=?, answer=?, explanation=?, hint=?, data=?, time_limit_sec=?, active=?, verified=1 WHERE id=?`)
        .run(n.topic_id, n.year, n.difficulty, n.qtype, n.text, n.answer, n.explanation, n.hint, n.data, n.time_limit_sec, n.active, existingId);
      if (!r.changes) throw new AppError(404, 'Soalan tidak dijumpai.');
      db.prepare('DELETE FROM question_options WHERE question_id = ?').run(existingId);
    } else {
      const r = db.prepare(`INSERT INTO questions(school_id, topic_id, year, difficulty, qtype, text, answer, explanation, hint, data, time_limit_sec, active, verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`)
        .run(schoolId, n.topic_id, n.year, n.difficulty, n.qtype, n.text, n.answer, n.explanation, n.hint, n.data, n.time_limit_sec, n.active);
      qid = Number(r.lastInsertRowid);
    }
    const ins = db.prepare('INSERT INTO question_options(question_id, idx, text, is_correct) VALUES (?,?,?,?)');
    for (const o of n.options) ins.run(qid, o.idx, o.text, o.is_correct);
    if (admin) audit(db, admin, existingId ? 'question.update' : 'question.create', qid);
    return qid;
  });
}

export function getQuestion(db, id) {
  const q = db.prepare(`SELECT q.*, t.code AS topic FROM questions q JOIN mathematics_topics t ON t.id = q.topic_id WHERE q.id = ?`).get(id);
  if (!q) throw new AppError(404, 'Soalan tidak dijumpai.');
  const data = JSON.parse(q.data || '{}');
  const options = db.prepare('SELECT idx, text, is_correct FROM question_options WHERE question_id = ? ORDER BY idx').all(id);
  return { ...q, data: undefined, unit: data.unit || '', visual: data.visual || null, pairs: data.pairs || [], options: options.map((o) => o.text), correct: options.findIndex((o) => o.is_correct), answer: options.length ? '' : q.answer };
}

const CSV_COLS = ['tahun', 'topik', 'kesukaran', 'jenis', 'soalan', 'jawapan', 'pilihan1', 'pilihan2', 'pilihan3', 'pilihan4', 'padanan', 'penjelasan', 'petunjuk', 'masa'];

export const importQuestionsCsv = (db, admin, text, schoolId) => importQuestionRows(db, admin, parseCsv(String(text || '')), schoolId);

export const TEMPLATE_ROWS = [CSV_COLS,
  [1, 'tambah_tolak', 'mudah', 'numeric', '3 + 4 = ?', 7, '', '', '', '', '', '3 tambah 4 ialah 7.', 'Kira dengan jari.', ''],
  [1, 'tambah_tolak', 'mudah', 'mcq', 'Berapakah 5 + 2?', 7, 5, 6, 7, 8, '', '5 tambah 2 ialah 7.', 'Mula dari 5, kira 2 lagi.', ''],
  [2, 'darab', 'sederhana', 'match', 'Padankan setiap ayat nombor dengan jawapannya.', '', '', '', '', '', '2 × 3=6;4 × 5=20', '2 × 3 = 6 dan 4 × 5 = 20.', 'Gunakan sifir.', 30]];

export function importQuestionRows(db, admin, rows, schoolId) {
  if (rows.length < 2) throw new AppError(400, 'Fail CSV kosong atau tiada baris data.');
  if (rows.length > 2001) throw new AppError(400, 'Maksimum 2000 baris setiap import.');
  const head = rows[0].map((h) => String(h).trim().toLowerCase());
  for (const c of ['tahun', 'topik', 'kesukaran', 'jenis', 'soalan', 'penjelasan']) if (!head.includes(c)) throw new AppError(400, `Lajur wajib "${c}" tiada. Lajur sah: ${CSV_COLS.join(', ')}.`);
  const errors = [];
  let imported = 0;
  tx(db, () => {
    rows.slice(1).forEach((cells, i) => {
      const g = (c) => String(cells[head.indexOf(c)] ?? '').trim();
      try {
        const opts = ['pilihan1', 'pilihan2', 'pilihan3', 'pilihan4'].map(g).filter(Boolean);
        const input = { year: g('tahun'), topic: g('topik'), difficulty: g('kesukaran').toLowerCase(), qtype: g('jenis').toLowerCase(), text: g('soalan'), explanation: g('penjelasan'), hint: g('petunjuk'), time_limit_sec: g('masa') };
        if (input.qtype === 'match') input.pairs = g('padanan').split(';').filter(Boolean).map((p) => p.split('='));
        else if (opts.length) { input.options = opts; input.correct = opts.indexOf(g('jawapan')); } else input.answer = g('jawapan');
        saveQuestion(db, null, input, null, schoolId);
        imported++;
      } catch (e) { errors.push({ row: i + 2, message: e.message }); }
    });
    audit(db, admin, 'question.import', null, { imported, errors: errors.length });
  });
  return { imported, errors: errors.slice(0, 50), error_count: errors.length };
}
