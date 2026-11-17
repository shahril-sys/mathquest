import test from 'node:test';
import assert from 'node:assert/strict';
import { GENERATORS, generate, DIFFICULTIES } from '../src/engine/generators.js';
import { checkAnswer, parseNumber } from '../src/engine/check.js';
import { makeRng } from '../src/engine/random.js';

/** Independent evaluation of a restricted arithmetic expression. */
export function evalExpr(expr) {
  if (!/^[0-9+\-*/%().\s]+$/.test(expr)) throw new Error('ungkapan tidak selamat');
  return Function(`"use strict"; return (${expr});`)();
}

function correctResponse(q) {
  if (q.input === 'mcq') return { choice: q.answer };
  if (q.input === 'match') return { order: q.answer };
  return { value: String(q.answer) };
}

test('semua penjana menghasilkan soalan sah untuk setiap tahun dan kesukaran', () => {
  const r = makeRng(12345);
  let n = 0;
  for (const g of Object.values(GENERATORS)) {
    for (let y = g.minYear; y <= g.maxYear; y++) {
      for (let d = 0; d < 4; d++) {
        for (let i = 0; i < 40; i++) {
          const q = generate(g.key, r, y, d);
          n++;
          assert.ok(q.explanation.length > 5, `${g.key}: penjelasan`);
          assert.ok(q.hint, `${g.key}: petunjuk`);
          assert.equal(q.difficulty, DIFFICULTIES[d]);
          assert.ok(checkAnswer({ input: q.input, answer: q.answer }, correctResponse(q)), `${g.key}: jawapan betul diterima`);
          if (q.input === 'mcq') assert.equal(q.options.length >= 3 || q.options.length === 2, true);
          if (q.meta?.expr) {
            const expected = evalExpr(q.meta.expr);
            const got = q.input === 'mcq' ? parseNumber(q.options[q.answer].replace(/^RM/, '')) : Number(q.answer);
            assert.ok(Math.abs(expected - got) < 1e-9, `${g.key} Y${y}: ${q.text} → jangkaan ${expected}, dapat ${got}`);
          }
        }
      }
    }
  }
  assert.ok(n > 1000);
});

test('jawapan salah ditolak dan input tidak sah tidak diterima', () => {
  const mc = { input: 'mcq', answer: 2 };
  assert.equal(checkAnswer(mc, { choice: 2 }), true);
  assert.equal(checkAnswer(mc, { choice: 1 }), false);
  assert.equal(checkAnswer(mc, { choice: '2' }), false);
  assert.equal(checkAnswer(mc, null), false);
  const nm = { input: 'number', answer: 3.5 };
  assert.equal(checkAnswer(nm, { value: '3.5' }), true);
  assert.equal(checkAnswer(nm, { value: '3,5' }), true);
  assert.equal(checkAnswer(nm, { value: ' RM3.50 ' }), true);
  assert.equal(checkAnswer(nm, { value: '3.6' }), false);
  assert.equal(checkAnswer(nm, { value: 'abc' }), false);
  assert.equal(checkAnswer(nm, { value: '' }), false);
  assert.equal(checkAnswer({ input: 'number', answer: 12000 }, { value: '12 000' }), true);
  const mt = { input: 'match', answer: [1, 0, 2] };
  assert.equal(checkAnswer(mt, { order: [1, 0, 2] }), true);
  assert.equal(checkAnswer(mt, { order: [0, 1, 2] }), false);
  assert.equal(checkAnswer(mt, { order: [1, 0] }), false);
});

test('soalan sepadan dengan tahun: Tahun 1 tidak mendapat kandungan lanjutan', () => {
  const r = makeRng(7);
  for (const g of Object.values(GENERATORS)) assert.ok(g.minYear >= 1 && g.maxYear <= 6);
  assert.ok(GENERATORS.mul.minYear >= 2);
  assert.ok(GENERATORS.dec_add.minYear >= 3);
  assert.ok(GENERATORS.prob_percent.minYear >= 5);
  for (let i = 0; i < 100; i++) {
    const q = generate('add', r, 1, 3);
    const m = q.meta.expr.match(/\d+/g).map(Number);
    assert.ok(m[0] + m[1] <= 20, 'Tahun 1: jumlah tidak melebihi 20');
  }
});
