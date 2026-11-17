/**
 * Template-based question generators (Bahasa Melayu), scaled by school year (1-6) and difficulty index d (0-3).
 * Every generator returns a question whose answer is computed from the same numbers shown in the text.
 * Arithmetic generators also return meta.expr so tests can re-verify the answer independently.
 */
import { validateQuestion } from './check.js';

export const DIFFICULTIES = ['mudah', 'sederhana', 'sukar', 'pakar'];

const LIM = [
  [10, 10, 20, 20],
  [20, 50, 100, 100],
  [100, 500, 1000, 1000],
  [1000, 5000, 10000, 10000],
  [10000, 50000, 100000, 100000],
  [100000, 500000, 1000000, 1000000],
];
const lim = (y, d) => LIM[y - 1][d];

const NAMES = ['Ali', 'Siti', 'Aminah', 'Wei Jie', 'Kumar', 'Mei Ling', 'Farid', 'Aisyah', 'Raju', 'Nurul', 'Hafiz', 'Devi', 'Adam', 'Balqis'];
const ITEMS = [
  { c: 'biji', n: 'epal', e: '🍎' }, { c: 'batang', n: 'pensel', e: '✏️' }, { c: 'buah', n: 'buku', e: '📘' },
  { c: 'biji', n: 'gula-gula', e: '🍬' }, { c: 'biji', n: 'bola', e: '⚽' }, { c: 'kuntum', n: 'bunga', e: '🌸' },
  { c: 'keping', n: 'biskut', e: '🍪' }, { c: 'ekor', n: 'ikan', e: '🐟' }, { c: 'biji', n: 'belon', e: '🎈' },
  { c: 'keping', n: 'kad', e: '🃏' },
];
const THINGS = ['buku cerita', 'topi', 'beg sekolah', 'kasut', 'mainan', 'kotak pensel'];
const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

const phrase = (n, it) => `${fmt(n)} ${it.c} ${it.n}`;
export function fmt(n) {
  const s = String(n);
  if (!/^-?\d+$/.test(s)) return s;
  const neg = s[0] === '-';
  const dgt = neg ? s.slice(1) : s;
  return (neg ? '-' : '') + (dgt.length >= 5 ? dgt.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : dgt);
}
const decStr = (v, p) => (v / 10 ** p).toFixed(p);
const rm = (sen) => `RM${(sen / 100).toFixed(2)}`;
const frac = (a, b) => `${a}/${b}`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const timeStr = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

function twoNames(r) {
  const a = r.pick(NAMES);
  let b = r.pick(NAMES);
  while (b === a) b = r.pick(NAMES);
  return [a, b];
}

function splitSum(r, L) {
  const lo = Math.max(1, Math.floor(L / 10));
  const a = r.int(lo, L - lo);
  const b = L - a >= lo ? r.int(lo, L - a) : r.int(1, L - a);
  return [a, b];
}

function nearNums(r, c, { unit = 1, min = 0, places = 0 } = {}) {
  const offs = [1, 2, 3, 5, 10, -1, -2, -3, -5, -10, 4, -4, 20, -20, 6, -6, 7, -7];
  const out = [];
  const reach = Math.max(5, Math.ceil(Math.abs(c) / 5)); // penarik sentiasa munasabah berbanding jawapan
  for (const o of r.shuffle(offs.filter((x) => Math.abs(x) <= reach))) {
    const v = Number((c + o * unit).toFixed(places));
    if (v >= min && v !== c && !out.includes(v)) out.push(v);
    if (out.length >= 4) break;
  }
  if (places === 0 && Math.abs(c) >= 100) {
    for (const v of [c + 100, c - 100, c + 1000]) if (v >= min && v !== c && !out.includes(v)) out.push(v);
  }
  return out;
}

function mcq(r, correct, distractors, n = 4) {
  const uniq = [...new Set(distractors.map(String))].filter((x) => x !== String(correct));
  const opts = r.shuffle([String(correct), ...r.shuffle(uniq).slice(0, n - 1)]);
  return { options: opts, answer: opts.indexOf(String(correct)) };
}

/** Numeric question; sometimes presented as multiple choice. */
function numQ(r, base, correct, o = {}) {
  const show = o.show || fmt;
  if (r.chance(o.mcq ?? 0.3)) {
    const ds = nearNums(r, correct, { unit: o.unit || 1, min: o.min ?? 0, places: o.places || 0 }).map(show);
    return { ...base, type: base.type || 'mcq', ...mcq(r, show(correct), ds), answerText: show(correct) };
  }
  return { ...base, type: base.type || 'numeric', answer: correct, answerText: show(correct) + (base.unit ? ` ${base.unit}` : '') };
}

function matchQ(r, pairs, explanation, hint, text = 'Seret dan padankan setiap ayat nombor dengan jawapan yang betul.') {
  const rights = r.shuffle(pairs.map((p) => p[1]));
  return {
    type: 'match', text, lefts: pairs.map((p) => p[0]), rights,
    answer: pairs.map((p) => rights.indexOf(p[1])), explanation, hint,
    answerText: pairs.map((p) => `${p[0]} → ${p[1]}`).join('; '),
  };
}

function distinctPairs(n, make) {
  const res = new Set();
  const pairs = [];
  let guard = 0;
  while (pairs.length < n && guard++ < 200) {
    const p = make();
    if (res.has(p[1])) continue;
    res.add(p[1]);
    pairs.push(p);
  }
  return pairs;
}

function mulOps(r, y, d) {
  if (y <= 2) return [r.pick(d < 2 ? [2, 5, 10] : [2, 3, 4, 5, 10]), r.int(1, d < 2 ? 5 : 10)];
  if (y === 3) return [r.int(2, d < 2 ? 5 : 9), r.int(2, 10)];
  if (y === 4) return d < 2 ? [r.int(2, 9), r.int(2, 12)] : [r.int(11, d < 3 ? 50 : 99), r.int(2, 9)];
  if (y === 5) return d < 2 ? [r.int(11, 99), r.int(2, 9)] : [r.int(100, d < 3 ? 500 : 999), r.int(11, d < 3 ? 30 : 99)];
  return d < 2 ? [r.int(100, 999), r.int(2, 9)] : [r.int(100, 999), r.int(11, 99)];
}
function divOps(r, y, d) {
  const [a, b] = mulOps(r, y, d);
  let div = Math.min(a, b);
  let q = Math.max(a, b);
  if (div < 2) [div, q] = [q, div];
  return [div * q, div, q];
}

export const GENERATORS = {};
const def = (key, topic, minYear, maxYear, fn) => { GENERATORS[key] = { key, topic, minYear, maxYear, fn }; };

/* ---------------------------------------------------------------- Dunia Nombor */
def('count', 'nombor', 1, 2, (r, y, d) => {
  const it = r.pick(ITEMS);
  const n = r.int(2, y === 1 ? [5, 10, 10, 20][d] : [10, 20, 20, 30][d]);
  return {
    type: 'count', text: `Sentuh setiap ${it.e} untuk mengira. Berapakah jumlahnya?`,
    visual: { kind: 'objects', emoji: it.e, count: n }, answer: n, answerText: String(n),
    explanation: `Kira satu per satu. Ada ${n} ${it.e}.`, hint: 'Sentuh setiap objek sambil mengira 1, 2, 3 ...',
  };
});
def('compare', 'nombor', 1, 6, (r, y, d) => {
  const L = lim(y, d);
  const lo = y === 1 ? 1 : Math.floor(L / 10) + 1;
  const set = new Set();
  while (set.size < 4) set.add(r.int(lo, L));
  const nums = [...set];
  const big = r.chance(0.5);
  const c = big ? Math.max(...nums) : Math.min(...nums);
  return {
    type: 'mcq', text: `Nombor yang manakah paling ${big ? 'besar' : 'kecil'}?`,
    ...mcq(r, fmt(c), nums.filter((x) => x !== c).map(fmt)), answerText: fmt(c),
    explanation: `Bandingkan bilangan digit dahulu, kemudian digit dari kiri. Nombor paling ${big ? 'besar' : 'kecil'} ialah ${fmt(c)}.`,
    hint: 'Bandingkan digit paling kiri dahulu.',
  };
});
def('placevalue', 'nombor', 2, 6, (r, y, d) => {
  const L = lim(y, d);
  const k = Math.max(2, Math.min(6, String(L - 1).length));
  const digits = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k);
  const n = Number(digits.join(''));
  const pos = r.int(0, k - 1);
  const dig = digits[k - 1 - pos];
  const val = dig * 10 ** pos;
  const names = ['sa', 'puluh', 'ratus', 'ribu', 'puluh ribu', 'ratus ribu'];
  return {
    type: 'fill', text: `Nilai digit ${dig} dalam nombor ${fmt(n)} ialah ___`, answer: val, answerText: fmt(val),
    explanation: `Digit ${dig} berada pada tempat ${names[pos]}, maka nilainya ${fmt(val)}.`, hint: 'Lihat kedudukan digit: sa, puluh, ratus, ribu ...',
  };
});
def('skip', 'nombor', 1, 6, (r, y, d) => {
  const steps = { 1: [1, 2, 5, 10], 2: [2, 3, 4, 5, 10, 20], 3: [5, 10, 25, 50, 100], 4: [25, 100, 250, 500, 1000], 5: [500, 1000, 2500, 5000], 6: [2500, 5000, 10000, 25000] };
  const step = r.pick(y === 1 && d < 1 ? [1, 2] : steps[y]);
  const start = y === 1 ? r.int(0, 10) : step * r.int(0, 5);
  const seq = [0, 1, 2, 3, 4].map((i) => start + step * i);
  const hide = r.int(1, 3);
  const shown = seq.map((v, i) => (i === hide ? '___' : fmt(v))).join(', ');
  return {
    type: 'fill', text: `Lengkapkan urutan nombor: ${shown}`, answer: seq[hide], answerText: fmt(seq[hide]),
    explanation: `Urutan bertambah ${fmt(step)} setiap kali. Nombor yang hilang ialah ${fmt(seq[hide])}.`, hint: 'Cari beza antara dua nombor bersebelahan.',
  };
});
def('evenodd', 'nombor', 1, 3, (r, y, d) => {
  const n = r.int(1, Math.min(lim(y, d), 1000));
  const even = n % 2 === 0;
  return {
    type: 'mcq', text: `Nombor ${n} ialah nombor ...`, ...mcq(r, even ? 'Genap' : 'Ganjil', [even ? 'Ganjil' : 'Genap'], 2),
    answerText: even ? 'Genap' : 'Ganjil',
    explanation: `Digit sa ialah ${n % 10}. ${even ? 'Nombor genap berakhir dengan 0, 2, 4, 6 atau 8.' : 'Nombor ganjil berakhir dengan 1, 3, 5, 7 atau 9.'}`,
    hint: 'Lihat digit sa (digit paling kanan).',
  };
});
def('round', 'nombor', 3, 6, (r, y, d) => {
  const p = y === 3 ? r.pick([10, 100]) : y === 4 ? r.pick([10, 100, 1000]) : r.pick([100, 1000, 10000]);
  const names = { 10: 'puluh', 100: 'ratus', 1000: 'ribu', 10000: 'puluh ribu' };
  const n = r.int(Math.max(p * 2, 11), Math.max(lim(y, d), p * 10));
  const ans = Math.round(n / p) * p;
  return numQ(r, {
    type: 'numeric', text: `Bundarkan ${fmt(n)} kepada ${names[p]} yang terdekat.`,
    explanation: `Lihat digit di sebelah kanan tempat ${names[p]}. Jika 5 atau lebih, bundarkan ke atas; jika kurang, ke bawah. Jawapan: ${fmt(ans)}.`,
    hint: 'Digit 5 dan ke atas dibundarkan ke atas.',
  }, ans, { mcq: 0.3, unit: p });
});

/* ------------------------------------------------------ Pulau Tambah dan Tolak */
def('add', 'tambah_tolak', 1, 6, (r, y, d) => {
  const [a, b] = splitSum(r, lim(y, d));
  return numQ(r, {
    text: `${fmt(a)} + ${fmt(b)} = ?`, meta: { expr: `${a} + ${b}` },
    explanation: `Tambah ${fmt(a)} dan ${fmt(b)}, hasilnya ${fmt(a + b)}.`, hint: 'Tambah dari digit sa, simpan jika melebihi 9.',
  }, a + b);
});
def('sub', 'tambah_tolak', 1, 6, (r, y, d) => {
  const L = lim(y, d);
  const lo = Math.max(1, Math.floor(L / 10));
  const a = r.int(Math.max(2, 2 * lo), L);
  const b = r.int(Math.min(lo, a - 1), a - 1);
  return numQ(r, {
    text: `${fmt(a)} − ${fmt(b)} = ?`, meta: { expr: `${a} - ${b}` },
    explanation: `Tolak ${fmt(b)} daripada ${fmt(a)}, hasilnya ${fmt(a - b)}.`, hint: 'Tolak dari digit sa. Pinjam daripada digit sebelah jika perlu.',
  }, a - b);
});
def('addmissing', 'tambah_tolak', 1, 6, (r, y, d) => {
  const [a, b] = splitSum(r, lim(y, d));
  const hideA = r.chance(0.5);
  return {
    type: 'fill', text: hideA ? `___ + ${fmt(b)} = ${fmt(a + b)}` : `${fmt(a)} + ___ = ${fmt(a + b)}`,
    answer: hideA ? a : b, answerText: fmt(hideA ? a : b),
    explanation: `Nombor yang hilang = ${fmt(a + b)} − ${fmt(hideA ? b : a)} = ${fmt(hideA ? a : b)}.`, hint: 'Gunakan operasi songsang: tolak.',
  };
});
def('submissing', 'tambah_tolak', 1, 6, (r, y, d) => {
  const L = lim(y, d);
  const a = r.int(Math.max(2, Math.floor(L / 5)), L);
  const b = r.int(1, a - 1);
  const c = a - b;
  const hideA = r.chance(0.5);
  return {
    type: 'fill', text: hideA ? `___ − ${fmt(b)} = ${fmt(c)}` : `${fmt(a)} − ___ = ${fmt(c)}`,
    answer: hideA ? a : b, answerText: fmt(hideA ? a : b),
    explanation: hideA ? `Nombor awal = ${fmt(c)} + ${fmt(b)} = ${fmt(a)}.` : `Nombor yang ditolak = ${fmt(a)} − ${fmt(c)} = ${fmt(b)}.`,
    hint: 'Gunakan operasi songsang.',
  };
});
def('word_addsub', 'tambah_tolak', 1, 6, (r, y, d) => {
  const [n1, n2] = twoNames(r);
  const it = r.pick(ITEMS);
  const [a, b] = splitSum(r, lim(y, d));
  if (r.chance(0.5)) {
    return numQ(r, {
      type: 'word', text: `${n1} ada ${phrase(a, it)}. ${n2} memberinya ${phrase(b, it)} lagi. Berapakah jumlah ${it.n} ${n1} sekarang?`,
      meta: { expr: `${a} + ${b}` }, explanation: `Jumlah = ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`, hint: 'Perkataan "lagi" bermaksud tambah.',
    }, a + b, { mcq: 0.25 });
  }
  const big = a + b;
  return numQ(r, {
    type: 'word', text: `${n1} ada ${phrase(big, it)}. Dia memberikan ${phrase(b, it)} kepada ${n2}. Berapakah baki ${it.n} ${n1}?`,
    meta: { expr: `${big} - ${b}` }, explanation: `Baki = ${fmt(big)} − ${fmt(b)} = ${fmt(a)}.`, hint: '"Memberikan" bermaksud tolak.',
  }, a, { mcq: 0.25 });
});
def('mixed3', 'tambah_tolak', 2, 6, (r, y, d) => {
  const [a, b] = splitSum(r, lim(y, d));
  const c = r.int(1, a + b - 1);
  const addFirst = r.chance(0.5);
  const expr = addFirst ? `${a} + ${b} - ${c}` : `${a + b} - ${c} + ${b}`;
  const val = addFirst ? a + b - c : a + b - c + b;
  const shown = addFirst ? `${fmt(a)} + ${fmt(b)} − ${fmt(c)}` : `${fmt(a + b)} − ${fmt(c)} + ${fmt(b)}`;
  return numQ(r, {
    text: `${shown} = ?`, meta: { expr },
    explanation: `Kira dari kiri ke kanan. ${addFirst ? `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}, kemudian ${fmt(a + b)} − ${fmt(c)} = ${fmt(val)}.` : `${fmt(a + b)} − ${fmt(c)} = ${fmt(a + b - c)}, kemudian + ${fmt(b)} = ${fmt(val)}.`}`,
    hint: 'Selesaikan dari kiri ke kanan, satu langkah demi satu langkah.',
  }, val);
});
def('add_match', 'tambah_tolak', 1, 6, (r, y, d) => {
  const L = lim(y, d);
  const pairs = distinctPairs(4, () => { const [a, b] = splitSum(r, L); return [`${fmt(a)} + ${fmt(b)}`, fmt(a + b)]; });
  return matchQ(r, pairs, `Jawapan betul: ${pairs.map((p) => `${p[0]} = ${p[1]}`).join('; ')}.`, 'Selesaikan satu ayat nombor pada satu masa.');
});
def('add_visual', 'tambah_tolak', 1, 2, (r, y, d) => {
  const it = r.pick(ITEMS);
  const mx = y === 1 ? (d < 2 ? 5 : 9) : 10;
  const a = r.int(1, mx);
  const b = r.int(1, mx);
  return numQ(r, {
    type: 'visual', text: 'Berapakah jumlah semua objek?', visual: { kind: 'groups', groups: [{ emoji: it.e, count: a }, { emoji: it.e, count: b }], op: '+' },
    meta: { expr: `${a} + ${b}` }, explanation: `Ada ${a} dan ${b}. ${a} + ${b} = ${a + b}.`, hint: 'Kira kumpulan pertama, kemudian sambung mengira kumpulan kedua.',
  }, a + b, { mcq: 0.5 });
});

/* ------------------------------------------------------------------ Hutan Darab */
def('mul', 'darab', 2, 6, (r, y, d) => {
  const [a, b] = mulOps(r, y, d);
  return numQ(r, {
    text: `${fmt(a)} × ${fmt(b)} = ?`, meta: { expr: `${a} * ${b}` },
    explanation: `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)}.`, hint: 'Gunakan sifir atau tambah berulang.',
  }, a * b);
});
def('mul_fill', 'darab', 2, 6, (r, y, d) => {
  const [a, b] = mulOps(r, y, d);
  const hideA = r.chance(0.5);
  return {
    type: 'fill', text: hideA ? `___ × ${fmt(b)} = ${fmt(a * b)}` : `${fmt(a)} × ___ = ${fmt(a * b)}`,
    answer: hideA ? a : b, answerText: fmt(hideA ? a : b),
    explanation: `Nombor yang hilang = ${fmt(a * b)} ÷ ${fmt(hideA ? b : a)} = ${fmt(hideA ? a : b)}.`, hint: 'Gunakan operasi songsang: bahagi.',
  };
});
def('word_mul', 'darab', 2, 6, (r, y, d) => {
  const [a, b] = mulOps(r, y, d);
  const it = r.pick(ITEMS);
  const [n1] = twoNames(r);
  return numQ(r, {
    type: 'word', text: `${n1} mempunyai ${fmt(a)} kotak. Setiap kotak mengandungi ${phrase(b, it)}. Berapakah jumlah ${it.n} semuanya?`,
    meta: { expr: `${a} * ${b}` }, explanation: `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)} ${it.n}.`, hint: 'Bilangan kotak darab bilangan dalam setiap kotak.',
  }, a * b, { mcq: 0.25 });
});
def('mul_groups', 'darab', 2, 3, (r) => {
  const it = r.pick(ITEMS);
  const a = r.int(2, 5);
  const b = r.int(2, 5);
  return numQ(r, {
    type: 'visual', text: `Ada ${a} kumpulan. Setiap kumpulan ada ${b} ${it.e}. Berapakah jumlah semuanya?`,
    visual: { kind: 'groups', groups: Array.from({ length: a }, () => ({ emoji: it.e, count: b })), op: '×' },
    meta: { expr: `${a} * ${b}` }, explanation: `${a} kumpulan × ${b} = ${a * b}.`, hint: 'Tambah berulang: kira kumpulan demi kumpulan.',
  }, a * b, { mcq: 0.4 });
});
def('mul_match', 'darab', 2, 6, (r, y, d) => {
  const pairs = distinctPairs(4, () => { const [a, b] = mulOps(r, y, d); return [`${fmt(a)} × ${fmt(b)}`, fmt(a * b)]; });
  return matchQ(r, pairs, `Jawapan betul: ${pairs.map((p) => `${p[0]} = ${p[1]}`).join('; ')}.`, 'Selesaikan yang paling mudah dahulu.');
});

/* ---------------------------------------------------------------- Gunung Bahagi */
def('div', 'bahagi', 2, 6, (r, y, d) => {
  const [n, dv, q] = divOps(r, y, d);
  return numQ(r, {
    text: `${fmt(n)} ÷ ${fmt(dv)} = ?`, meta: { expr: `${n} / ${dv}` },
    explanation: `${fmt(n)} ÷ ${fmt(dv)} = ${fmt(q)} kerana ${fmt(dv)} × ${fmt(q)} = ${fmt(n)}.`, hint: 'Fikirkan: berapa darab dengan pembahagi untuk mendapat nombor ini?',
  }, q);
});
def('div_fill', 'bahagi', 2, 6, (r, y, d) => {
  const [n, dv, q] = divOps(r, y, d);
  const hideN = r.chance(0.5);
  return {
    type: 'fill', text: hideN ? `___ ÷ ${fmt(dv)} = ${fmt(q)}` : `${fmt(n)} ÷ ___ = ${fmt(q)}`,
    answer: hideN ? n : dv, answerText: fmt(hideN ? n : dv),
    explanation: hideN ? `Nombor awal = ${fmt(q)} × ${fmt(dv)} = ${fmt(n)}.` : `Pembahagi = ${fmt(n)} ÷ ${fmt(q)} = ${fmt(dv)}.`, hint: 'Gunakan operasi songsang.',
  };
});
def('word_div', 'bahagi', 2, 6, (r, y, d) => {
  const [n, dv, q] = divOps(r, y, d);
  const it = r.pick(ITEMS);
  const [n1] = twoNames(r);
  return numQ(r, {
    type: 'word', text: `${n1} ada ${phrase(n, it)}. Dia membahagikan sama banyak kepada ${fmt(dv)} orang kawan. Berapakah ${it.n} yang diterima oleh seorang kawan?`,
    meta: { expr: `${n} / ${dv}` }, explanation: `${fmt(n)} ÷ ${fmt(dv)} = ${fmt(q)}.`, hint: '"Sama banyak" bermaksud bahagi.',
  }, q, { mcq: 0.25 });
});
def('div_rem', 'bahagi', 4, 6, (r, y, d) => {
  const dv = r.int(3, y === 4 ? 9 : 12);
  const q = r.int(5, d < 2 ? 20 : 99);
  const rem = r.int(1, dv - 1);
  const n = dv * q + rem;
  return numQ(r, {
    type: 'numeric', text: `Berapakah baki apabila ${fmt(n)} dibahagi dengan ${dv}?`, meta: { expr: `${n} % ${dv}` },
    explanation: `${fmt(n)} ÷ ${dv} = ${q} baki ${rem}, kerana ${dv} × ${q} = ${fmt(dv * q)} dan ${fmt(n)} − ${fmt(dv * q)} = ${rem}.`, hint: 'Darabkan pembahagi dengan hasil bahagi, kemudian tolak daripada nombor asal.',
  }, rem, { mcq: 0.3, min: 0 });
});
def('div_match', 'bahagi', 2, 6, (r, y, d) => {
  const pairs = distinctPairs(4, () => { const [n, dv, q] = divOps(r, y, d); return [`${fmt(n)} ÷ ${fmt(dv)}`, fmt(q)]; });
  return matchQ(r, pairs, `Jawapan betul: ${pairs.map((p) => `${p[0]} = ${p[1]}`).join('; ')}.`, 'Gunakan sifir darab untuk menyemak.');
});

/* -------------------------------------------------------------- Istana Pecahan */
const denoms = (y, d) => (y === 2 ? [2, 3, 4] : y === 3 ? [2, 3, 4, 5, 6, 8] : d < 2 ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
def('frac_visual', 'pecahan', 2, 6, (r, y, d) => {
  const den = r.pick(denoms(y, d));
  const k = r.int(1, den - 1);
  const ds = [frac(k + 1, den), frac(den - k, den), frac(k, den + 1), frac(1, den + 1), frac(k, den + 2), frac(den, den + 1)];
  return {
    type: 'visual', text: 'Pecahan manakah yang mewakili bahagian berwarna?', visual: { kind: 'pie', parts: den, shaded: k },
    ...mcq(r, frac(k, den), ds), answerText: frac(k, den),
    explanation: `Bulatan dibahagi kepada ${den} bahagian sama besar dan ${k} bahagian berwarna. Pecahannya ${frac(k, den)}.`,
    hint: 'Bahagian berwarna di atas jumlah semua bahagian.',
  };
});
def('frac_of', 'pecahan', 2, 6, (r, y, d) => {
  const opts = y === 2 ? [[1, 2], [1, 4], [3, 4]] : null;
  let a; let b;
  if (opts) [a, b] = r.pick(opts);
  else { b = r.pick(y === 3 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 8, 10]); a = r.int(1, b - 1); }
  const m = r.int(2, y <= 3 ? 10 : y === 4 ? 20 : 50);
  const qty = b * m;
  const ans = a * m;
  if (r.chance(0.5)) {
    return numQ(r, {
      type: 'fill', text: `${frac(a, b)} daripada ${fmt(qty)} = ___`, meta: { expr: `${qty} / ${b} * ${a}` },
      explanation: `Bahagi ${fmt(qty)} dengan ${b} = ${m}. Darab dengan ${a} = ${fmt(ans)}.`, hint: 'Bahagi dengan penyebut, kemudian darab dengan pengangka.',
    }, ans, { mcq: 0.2 });
  }
  const [n1, n2] = twoNames(r);
  const it = r.pick(ITEMS);
  return numQ(r, {
    type: 'word', text: `${n1} mempunyai ${phrase(qty, it)}. Dia memberi ${frac(a, b)} daripadanya kepada ${n2}. Berapakah ${it.n} yang diberi?`, meta: { expr: `${qty} / ${b} * ${a}` },
    explanation: `${fmt(qty)} ÷ ${b} = ${m}, kemudian ${m} × ${a} = ${fmt(ans)}.`, hint: 'Bahagi dengan penyebut, kemudian darab dengan pengangka.',
  }, ans, { mcq: 0.2 });
});
def('frac_add', 'pecahan', 3, 6, (r, y, d) => {
  if (y >= 5 && d >= 2) {
    const d1 = r.pick([2, 3, 4, 5]);
    const f = r.pick([2, 3]);
    const d2 = d1 * f;
    let a; let b; let num;
    let guard = 0;
    do { a = r.int(1, d1 - 1); b = r.int(1, d2 - 1); num = a * f + b; guard++; } while ((num >= d2 || num === 0) && guard < 50);
    if (num >= d2) { a = 1; b = 1; num = f + 1; }
    const g = gcd(num, d2);
    const ans = frac(num / g, d2 / g);
    return {
      type: 'mcq', text: `${frac(a, d1)} + ${frac(b, d2)} = ?`,
      ...mcq(r, ans, [frac(a + b, d1 + d2), frac(a + b, d2), frac((num + 1) / g > 0 ? num + 1 : 2, d2), frac(Math.max(1, num - 1), d2)]),
      answerText: ans,
      explanation: `Samakan penyebut kepada ${d2}: ${frac(a * f, d2)} + ${frac(b, d2)} = ${frac(num, d2)}${g > 1 ? ` = ${ans}` : ''}.`, hint: 'Samakan penyebut dahulu.',
    };
  }
  const den = r.int(4, y === 3 ? 10 : 12);
  const a = r.int(1, den - 2);
  const b = r.int(1, den - 1 - a);
  const ans = frac(a + b, den);
  return {
    type: 'mcq', text: `${frac(a, den)} + ${frac(b, den)} = ?`,
    ...mcq(r, ans, [frac(a + b, den * 2), frac(a + b + 1, den), frac(a + b - 1, den), frac(a + b, den + 1), frac(Math.abs(a - b) || 1, den)]),
    answerText: ans, explanation: `Penyebut sama, jadi tambah pengangka: ${a} + ${b} = ${a + b}. Jawapan ${ans}.`, hint: 'Penyebut sama: tambah pengangka sahaja.',
  };
});
def('frac_equiv', 'pecahan', 3, 6, (r, y, d) => {
  const b = r.int(2, 6);
  const a = r.int(1, b - 1);
  const k = r.int(2, d < 2 ? 5 : 10);
  return numQ(r, {
    type: 'fill', text: `${frac(a, b)} = ___/${b * k}`, explanation: `Penyebut didarab ${k} (${b} × ${k} = ${b * k}), maka pengangka juga: ${a} × ${k} = ${a * k}.`,
    hint: 'Darabkan pengangka dan penyebut dengan nombor yang sama.',
  }, a * k, { mcq: 0.2 });
});
def('frac_compare', 'pecahan', 3, 6, (r, y, d) => {
  const den = r.int(5, y === 3 ? 10 : 12);
  const set = new Set();
  while (set.size < 4) set.add(r.int(1, den - 1));
  const nums = [...set];
  const big = r.chance(0.5);
  const c = big ? Math.max(...nums) : Math.min(...nums);
  return {
    type: 'mcq', text: `Pecahan manakah yang paling ${big ? 'besar' : 'kecil'}?`,
    ...mcq(r, frac(c, den), nums.filter((x) => x !== c).map((x) => frac(x, den))), answerText: frac(c, den),
    explanation: `Penyebut sama (${den}), jadi bandingkan pengangka. Pengangka ${big ? 'terbesar' : 'terkecil'} ialah ${c}.`, hint: 'Penyebut sama: pengangka lebih besar bermaksud pecahan lebih besar.',
  };
});

/* ------------------------------------------------------------ Planet Perpuluhan */
function decCfg(y, d) {
  const p = y === 3 || (y === 4 && d < 2) ? 1 : 2;
  const wholeMax = { 3: 10, 4: 50, 5: 100, 6: 1000 }[y];
  return { p, max: wholeMax * 10 ** p, u: 10 ** p };
}
function decVal(r, c) {
  let v;
  do v = r.int(c.u / 10 + 1, c.max); while (v % c.u === 0);
  return v;
}
def('dec_add', 'perpuluhan', 3, 6, (r, y, d) => {
  const c = decCfg(y, d);
  const a = decVal(r, c);
  const b = decVal(r, c);
  const s = a + b;
  return numQ(r, {
    text: `${decStr(a, c.p)} + ${decStr(b, c.p)} = ?`, meta: { expr: `(${a} + ${b}) / ${c.u}` },
    explanation: `Susun titik perpuluhan secara menegak, kemudian tambah. Jawapan ${decStr(s, c.p)}.`, hint: 'Sejajarkan titik perpuluhan.',
  }, s / c.u, { show: (n) => n.toFixed(c.p), unit: 1 / c.u, places: c.p, mcq: 0.3 });
});
def('dec_sub', 'perpuluhan', 3, 6, (r, y, d) => {
  const c = decCfg(y, d);
  let a = decVal(r, c);
  let b = decVal(r, c);
  if (a === b) a += 1;
  if (a < b) [a, b] = [b, a];
  return numQ(r, {
    text: `${decStr(a, c.p)} − ${decStr(b, c.p)} = ?`, meta: { expr: `(${a} - ${b}) / ${c.u}` },
    explanation: `Sejajarkan titik perpuluhan, kemudian tolak. Jawapan ${decStr(a - b, c.p)}.`, hint: 'Sejajarkan titik perpuluhan.',
  }, (a - b) / c.u, { show: (n) => n.toFixed(c.p), unit: 1 / c.u, places: c.p, mcq: 0.3 });
});
def('dec_compare', 'perpuluhan', 3, 6, (r, y, d) => {
  const c = decCfg(y, d);
  const set = new Set();
  while (set.size < 4) set.add(decVal(r, c));
  const vals = [...set];
  const big = r.chance(0.5);
  const best = big ? Math.max(...vals) : Math.min(...vals);
  return {
    type: 'mcq', text: `Nombor perpuluhan yang manakah paling ${big ? 'besar' : 'kecil'}?`,
    ...mcq(r, decStr(best, c.p), vals.filter((v) => v !== best).map((v) => decStr(v, c.p))), answerText: decStr(best, c.p),
    explanation: `Bandingkan bahagian bulat dahulu, kemudian digit perpuluhan dari kiri. Jawapan ${decStr(best, c.p)}.`, hint: 'Bandingkan bahagian bulat dahulu.',
  };
});
def('dec_frac', 'perpuluhan', 3, 6, (r, y) => {
  const p = y === 3 ? 1 : 2;
  const u = 10 ** p;
  const v = r.int(1, u - 1);
  if (r.chance(0.5)) {
    return numQ(r, {
      type: 'fill', text: `${decStr(v, p)} = ___/${u}`, explanation: `${decStr(v, p)} mempunyai ${p} tempat perpuluhan, maka penyebutnya ${u}. Pengangka ${v}.`, hint: `Satu tempat perpuluhan = persepuluh (10), dua tempat = perseratus (100).`,
    }, v, { mcq: 0.2 });
  }
  return numQ(r, {
    type: 'fill', text: `${frac(v, u)} = ___ (dalam perpuluhan)`, explanation: `${frac(v, u)} = ${decStr(v, p)}.`, hint: 'Bahagi pengangka dengan penyebut.',
  }, v / u, { show: (n) => n.toFixed(p), unit: 1 / u, places: p, mcq: 0.3 });
});
def('dec_round', 'perpuluhan', 5, 6, (r) => {
  const v = r.int(101, 9999);
  const ans = Math.round(v / 10) / 10;
  return numQ(r, {
    text: `Bundarkan ${decStr(v, 2)} kepada 1 tempat perpuluhan.`, explanation: `Lihat digit perpuluhan kedua (${v % 10}). ${v % 10 >= 5 ? 'Ia 5 atau lebih, bundarkan ke atas' : 'Ia kurang daripada 5, kekalkan'}. Jawapan ${ans.toFixed(1)}.`,
    hint: 'Lihat digit di tempat perpuluhan kedua.',
  }, ans, { show: (n) => n.toFixed(1), unit: 0.1, places: 1, mcq: 0.3 });
});
def('dec_mul', 'perpuluhan', 5, 6, (r, y, d) => {
  const p = d < 2 ? 1 : 2;
  const u = 10 ** p;
  const v = decVal(r, { u, max: (y === 5 ? 20 : 100) * u });
  const k = r.int(2, 9);
  return numQ(r, {
    text: `${decStr(v, p)} × ${k} = ?`, meta: { expr: `${v} * ${k} / ${u}` },
    explanation: `Darab ${v} × ${k} = ${v * k}, kemudian letak ${p} tempat perpuluhan: ${decStr(v * k, p)}.`, hint: 'Darab seperti nombor bulat, kemudian letak titik perpuluhan.',
  }, (v * k) / u, { show: (n) => n.toFixed(p), unit: 1 / u, places: p, mcq: 0.3 });
});
def('dec_word', 'perpuluhan', 4, 6, (r, y) => {
  const p = 2;
  const u = 100;
  const a = r.int(300, y === 4 ? 1000 : 5000);
  const b = r.int(50, a - 50);
  const [n1] = twoNames(r);
  if (r.chance(0.5)) {
    return numQ(r, {
      type: 'word', unit: 'm', text: `${n1} mempunyai pita sepanjang ${decStr(a, p)} m. Dia memotong ${decStr(b, p)} m. Berapakah baki pita (dalam m)?`,
      meta: { expr: `(${a} - ${b}) / ${u}` }, explanation: `${decStr(a, p)} − ${decStr(b, p)} = ${decStr(a - b, p)} m.`, hint: 'Tolak, sejajarkan titik perpuluhan.',
    }, (a - b) / u, { show: (n) => n.toFixed(p), unit: 0.01, places: p, mcq: 0.25 });
  }
  return numQ(r, {
    type: 'word', unit: 'kg', text: `Beg A berjisim ${decStr(a, p)} kg dan beg B berjisim ${decStr(b, p)} kg. Berapakah jumlah jisim kedua-dua beg (dalam kg)?`,
    meta: { expr: `(${a} + ${b}) / ${u}` }, explanation: `${decStr(a, p)} + ${decStr(b, p)} = ${decStr(a + b, p)} kg.`, hint: 'Tambah, sejajarkan titik perpuluhan.',
  }, (a + b) / u, { show: (n) => n.toFixed(p), unit: 0.01, places: p, mcq: 0.25 });
});

/* ------------------------------------------------------------------ Bandar Wang */
const MONEY_CAP = [[10, 20, 50, 100], [20, 50, 100, 500], [100, 500, 1000, 5000], [500, 2000, 5000, 10000], [1000, 5000, 10000, 50000], [5000, 10000, 50000, 100000]];
function moneyPair(r, y, d) {
  if (y === 1) {
    const coins = [5, 10, 20, 50];
    let a; let b;
    do { a = r.pick(coins); b = r.pick(coins); } while (a + b > 100);
    return { text: `${a} sen + ${b} sen`, sum: a + b, unit: 'sen', ans: a + b, sen: a + b };
  }
  const [a, b] = splitSum(r, MONEY_CAP[y - 1][d] * 20);
  return { text: `${rm(a * 5)} + ${rm(b * 5)}`, sum: (a + b) * 5, unit: 'RM', ans: ((a + b) * 5) / 100, sen: (a + b) * 5, expr: `(${a * 5} + ${b * 5}) / 100` };
}
def('money_add', 'wang', 1, 6, (r, y, d) => {
  const m = moneyPair(r, y, d);
  const base = {
    text: `${m.text} = ${m.unit === 'sen' ? '?' : '___ (dalam RM)'}`, explanation: `Jumlah = ${m.unit === 'sen' ? `${m.sum} sen` : rm(m.sum)}.`, hint: 'Tambah sen dengan sen dan ringgit dengan ringgit.',
    ...(m.expr ? { meta: { expr: m.expr } } : {}),
  };
  if (m.unit === 'sen') return numQ(r, { ...base, unit: 'sen' }, m.ans, { mcq: 0.4, unit: 5 });
  return numQ(r, base, m.ans, { show: (n) => `RM${n.toFixed(2)}`, unit: 0.05, places: 2, mcq: 0.3 });
});
def('money_match', 'wang', 1, 6, (r, y, d) => {
  const pairs = distinctPairs(4, () => { const m = moneyPair(r, y, d); return [m.text, m.unit === 'sen' ? `${m.sum} sen` : rm(m.sum)]; });
  return matchQ(r, pairs, `Jawapan betul: ${pairs.map((p) => `${p[0]} = ${p[1]}`).join('; ')}.`, 'Tambah sen dahulu, kemudian ringgit.', 'Padankan jumlah wang dengan jawapan yang betul.');
});
def('money_change', 'wang', 1, 6, (r, y, d) => {
  const [n1] = twoNames(r);
  const thing = r.pick(THINGS);
  if (y === 1) {
    const price = 10 * r.int(1, 9);
    return numQ(r, {
      type: 'word', unit: 'sen', text: `${n1} membayar 100 sen untuk sebuah ${thing} berharga ${price} sen. Berapakah baki (dalam sen)?`, meta: { expr: `100 - ${price}` },
      explanation: `Baki = 100 − ${price} = ${100 - price} sen.`, hint: 'Tolak harga daripada wang yang dibayar.',
    }, 100 - price, { mcq: 0.4, unit: 10 });
  }
  const cap = Math.min(MONEY_CAP[y - 1][d], 1000);
  const price = 5 * r.int(2, cap * 20 - 1);
  const bills = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000];
  const pay = bills.find((b) => b * 100 > price);
  const baki = pay * 100 - price;
  return numQ(r, {
    type: 'word', text: `${n1} membeli sebuah ${thing} berharga ${rm(price)}. Dia membayar RM${pay}. Berapakah baki yang diterima?`, meta: { expr: `${pay} - ${price} / 100` },
    explanation: `Baki = RM${pay}.00 − ${rm(price)} = ${rm(baki)}.`, hint: 'Tolak harga barang daripada wang yang dibayar.',
  }, baki / 100, { show: (n) => `RM${n.toFixed(2)}`, unit: 0.05, places: 2, mcq: 0.3 });
});
def('money_buy', 'wang', 2, 6, (r, y) => {
  const price = 50 * r.int(1, 10) * (y >= 4 ? r.int(1, 4) : 1);
  const n = r.int(2, y <= 2 ? 5 : 12);
  const [n1] = twoNames(r);
  const thing = r.pick(THINGS);
  return numQ(r, {
    type: 'word', text: `${n1} membeli ${n} ${thing} dengan harga ${rm(price)} sebuah. Berapakah jumlah yang perlu dibayar?`, meta: { expr: `${n} * ${price} / 100` },
    explanation: `${n} × ${rm(price)} = ${rm(n * price)}.`, hint: 'Darabkan bilangan barang dengan harga sebuah.',
  }, (n * price) / 100, { show: (v) => `RM${v.toFixed(2)}`, unit: 0.5, places: 2, mcq: 0.3 });
});

/* ------------------------------------------------------- Dunia Masa dan Waktu */
def('clock', 'masa', 1, 6, (r, y, d) => {
  const h = r.int(1, 12);
  const m = y === 1 ? r.pick([0, 30]) : y === 2 ? r.pick([0, 15, 30, 45]) : y === 3 || d < 2 ? 5 * r.int(0, 11) : r.int(0, 59);
  const wrongSwap = timeStr(Math.round(m / 5) || 12, (h % 12) * 5);
  const ds = [timeStr((h % 12) + 1, m), timeStr(h === 1 ? 12 : h - 1, m), timeStr(h, (m + 30) % 60), timeStr(h, (m + 15) % 60), wrongSwap];
  return {
    type: 'visual', text: 'Pukul berapakah yang ditunjukkan oleh jam?', visual: { kind: 'clock', h, m }, ...mcq(r, timeStr(h, m), ds), answerText: timeStr(h, m),
    explanation: `Jarum pendek menunjuk ke ${h}. Jarum panjang menunjuk ${m % 5 === 0 ? `nombor ${m / 5}` : ''} (${m} minit). Masa ialah ${timeStr(h, m)}.`,
    hint: 'Jarum pendek menunjukkan jam. Jarum panjang menunjukkan minit.',
  };
});
def('days_months', 'masa', 1, 2, (r) => {
  if (r.chance(0.5)) {
    const i = r.int(0, 6);
    const after = r.chance(0.5);
    const ans = DAYS[(i + (after ? 1 : 6)) % 7];
    return { type: 'mcq', text: `Hari ${after ? 'selepas' : 'sebelum'} ${DAYS[i]} ialah ...`, ...mcq(r, ans, DAYS.filter((x) => x !== ans)), answerText: ans, explanation: `Urutan hari: ${DAYS.join(', ')}. Jawapan ${ans}.`, hint: 'Senaraikan hari dalam seminggu mengikut urutan.' };
  }
  const i = r.int(0, 11);
  const after = r.chance(0.5);
  const ans = MONTHS[(i + (after ? 1 : 11)) % 12];
  return { type: 'mcq', text: `Bulan ${after ? 'selepas' : 'sebelum'} ${MONTHS[i]} ialah ...`, ...mcq(r, ans, MONTHS.filter((x) => x !== ans)), answerText: ans, explanation: `Urutan bulan bermula Januari hingga Disember. Jawapan ${ans}.`, hint: 'Senaraikan bulan mengikut urutan.' };
});
const TIME_UNITS = [['jam', 'minit', 60, 2], ['hari', 'jam', 24, 2], ['minggu', 'hari', 7, 2], ['tahun', 'bulan', 12, 2], ['minit', 'saat', 60, 3], ['dekad', 'tahun', 10, 4], ['abad', 'tahun', 100, 4]];
def('convert_time', 'masa', 2, 6, (r, y, d) => {
  const [A, B, f] = r.pick(TIME_UNITS.filter((u) => u[3] <= y));
  const n = r.int(2, 9);
  if (d >= 1 && r.chance(0.5)) {
    return numQ(r, { type: 'fill', text: `${fmt(n * f)} ${B} = ___ ${A}`, explanation: `1 ${A} = ${f} ${B}. ${fmt(n * f)} ÷ ${f} = ${n} ${A}.`, hint: `1 ${A} = ${f} ${B}.` }, n, { mcq: 0.2 });
  }
  return numQ(r, { type: 'fill', text: `${n} ${A} = ___ ${B}`, explanation: `1 ${A} = ${f} ${B}. ${n} × ${f} = ${fmt(n * f)} ${B}.`, hint: `1 ${A} = ${f} ${B}.` }, n * f, { mcq: 0.2 });
});
def('duration', 'masa', 2, 6, (r, y, d) => {
  if (y === 2) {
    const h1 = r.int(1, 6);
    const dur = r.int(1, 4);
    return numQ(r, {
      type: 'word', unit: 'jam', text: `Filem bermula pada pukul ${h1}:00 petang dan tamat pada pukul ${h1 + dur}:00 petang. Berapa jamkah filem itu?`,
      explanation: `${h1 + dur} − ${h1} = ${dur} jam.`, hint: 'Tolak masa mula daripada masa tamat.',
    }, dur, { mcq: 0.4 });
  }
  const sh = r.int(1, 5);
  const sm = 15 * r.int(0, 3);
  const dur = 15 * r.int(1, y === 3 ? 8 : y === 4 ? 14 : 20);
  const tot = sh * 60 + sm + dur;
  const eh = Math.floor(tot / 60);
  const em = tot % 60;
  if (eh > 11) return GENERATORS.duration.fn(r, y, d);
  return numQ(r, {
    type: 'word', unit: 'minit', text: `Latihan bermula pada pukul ${timeStr(sh, sm)} petang dan tamat pada pukul ${timeStr(eh, em)} petang. Berapa minitkah tempoh latihan itu?`,
    explanation: `Dari ${timeStr(sh, sm)} hingga ${timeStr(eh, em)} ialah ${dur} minit.`, hint: 'Kira jam penuh dahulu (1 jam = 60 minit), kemudian tambah minit.',
  }, dur, { mcq: 0.2, unit: 15 });
});
def('time24', 'masa', 4, 6, (r) => {
  const h = r.int(1, 11);
  const m = 5 * r.int(0, 11);
  const f = (hh, mm = m) => `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const ans = f(h + 12);
  return {
    type: 'mcq', text: `Tukarkan pukul ${timeStr(h, m)} petang kepada sistem 24 jam.`, ...mcq(r, ans, [f(h), f(h + 11), f(h + 10), f(h + 12, (m + 30) % 60)]), answerText: ans,
    explanation: `Waktu petang: tambah 12 jam. ${h} + 12 = ${h + 12}. Jawapan ${ans}.`, hint: 'Untuk waktu petang, tambah 12 pada jam.',
  };
});

/* ------------------------------------------------------------------ Alam Ukuran */
def('ruler', 'ukuran', 1, 2, (r, y) => {
  const len = r.int(2, y === 1 ? 10 : 15);
  return numQ(r, {
    type: 'visual', unit: 'cm', text: 'Berapakah panjang pensel itu dalam cm?', visual: { kind: 'ruler', length: len },
    explanation: `Hujung pensel berada pada tanda ${len} cm; pensel bermula pada 0. Panjangnya ${len} cm.`, hint: 'Pastikan pensel bermula pada tanda 0.',
  }, len, { mcq: 0.5 });
});
const MEASURE_ITEMS = [['tali', 'panjang', 'cm'], ['kain', 'panjang', 'm'], ['guni beras', 'jisim', 'kg'], ['botol air', 'isi padu', 'ml'], ['kotak', 'jisim', 'g']];
def('measure_diff', 'ukuran', 2, 6, (r, y, d) => {
  const [thing, prop, unit] = r.pick(MEASURE_ITEMS);
  const cap = Math.min(lim(y, d), 10000);
  const [a0, b0] = splitSum(r, Math.max(cap, 20));
  const a = Math.max(a0, b0);
  const b = Math.min(a0, b0) || 1;
  if (r.chance(0.5)) {
    return numQ(r, {
      type: 'word', unit, text: `${prop[0].toUpperCase()}${prop.slice(1)} ${thing} A ialah ${fmt(a)} ${unit} dan ${thing} B ialah ${fmt(b)} ${unit}. Berapakah bezanya (dalam ${unit})?`,
      meta: { expr: `${a} - ${b}` }, explanation: `Beza = ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)} ${unit}.`, hint: 'Tolak nilai yang lebih kecil daripada yang lebih besar.',
    }, a - b, { mcq: 0.25 });
  }
  return numQ(r, {
    type: 'word', unit, text: `${prop[0].toUpperCase()}${prop.slice(1)} ${thing} A ialah ${fmt(a)} ${unit} dan ${thing} B ialah ${fmt(b)} ${unit}. Berapakah jumlahnya (dalam ${unit})?`,
    meta: { expr: `${a} + ${b}` }, explanation: `Jumlah = ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)} ${unit}.`, hint: 'Tambah kedua-dua nilai.',
  }, a + b, { mcq: 0.25 });
});
const CONVERT = [['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000], ['cm', 'mm', 10]];
def('measure_convert', 'ukuran', 3, 6, (r, y, d) => {
  const [A, B, f] = r.pick(CONVERT);
  const n = y >= 5 && d >= 1 && r.chance(0.5) ? r.pick([0.5, 1.5, 2.5, 3.5, 0.25, 0.75, 4.5]) : r.int(1, 9);
  const big = n * f;
  if (d >= 1 && r.chance(0.5)) {
    return numQ(r, { type: 'fill', text: `${fmt(big)} ${B} = ___ ${A}`, explanation: `1 ${A} = ${fmt(f)} ${B}. ${fmt(big)} ÷ ${fmt(f)} = ${n} ${A}.`, hint: `1 ${A} = ${fmt(f)} ${B}. Bahagi untuk menukar kepada unit yang lebih besar.` },
      n, { show: String, unit: n % 1 ? 0.25 : 1, places: 2, mcq: 0.2 });
  }
  return numQ(r, { type: 'fill', text: `${n} ${A} = ___ ${B}`, explanation: `1 ${A} = ${fmt(f)} ${B}. ${n} × ${fmt(f)} = ${fmt(big)} ${B}.`, hint: `1 ${A} = ${fmt(f)} ${B}. Darab untuk menukar kepada unit yang lebih kecil.` },
    big, { mcq: 0.2, unit: f / 10 });
});
def('perimeter', 'ukuran', 3, 6, (r, y, d) => {
  const cap = ({ 3: 12, 4: 20, 5: 50, 6: 100 }[y]) / (d < 2 ? 2 : 1);
  const l = r.int(3, Math.max(4, cap));
  let w = r.int(2, Math.max(3, cap));
  if (w === l) w = l - 1;
  if (y >= 4 && d >= 2 && r.chance(0.5)) {
    return numQ(r, {
      unit: 'cm', type: 'visual', text: `Perimeter sebuah segi empat tepat ialah ${2 * (l + w)} cm. Panjangnya ${l} cm. Berapakah lebarnya (cm)?`, visual: { kind: 'rect', w: l, h: w, unit: 'cm', hideH: true },
      meta: { expr: `${2 * (l + w)} / 2 - ${l}` }, explanation: `Separuh perimeter = ${2 * (l + w)} ÷ 2 = ${l + w}. Lebar = ${l + w} − ${l} = ${w} cm.`, hint: 'Separuh perimeter = panjang + lebar.',
    }, w, { mcq: 0.2 });
  }
  return numQ(r, {
    unit: 'cm', type: 'visual', text: 'Berapakah perimeter segi empat tepat ini (cm)?', visual: { kind: 'rect', w: l, h: w, unit: 'cm' }, meta: { expr: `2 * (${l} + ${w})` },
    explanation: `Perimeter = 2 × (panjang + lebar) = 2 × (${l} + ${w}) = ${2 * (l + w)} cm.`, hint: 'Jumlahkan semua sisi.',
  }, 2 * (l + w), { mcq: 0.25, unit: 2 });
});
def('area', 'ukuran', 4, 6, (r, y) => {
  const cap = { 4: 12, 5: 30, 6: 60 }[y];
  if (y === 6 && r.chance(0.4)) {
    const b = 2 * r.int(2, 20);
    const h = r.int(3, 30);
    return numQ(r, {
      unit: 'cm²', type: 'visual', text: 'Berapakah luas segi tiga ini (cm²)?', visual: { kind: 'tri', b, h, unit: 'cm' }, meta: { expr: `${b} * ${h} / 2` },
      explanation: `Luas = ½ × tapak × tinggi = ½ × ${b} × ${h} = ${(b * h) / 2} cm².`, hint: 'Luas segi tiga = ½ × tapak × tinggi.',
    }, (b * h) / 2, { mcq: 0.25 });
  }
  const l = r.int(3, cap);
  let w = r.int(2, cap);
  if (w === l) w = Math.max(2, l - 1);
  return numQ(r, {
    unit: 'cm²', type: 'visual', text: 'Berapakah luas segi empat tepat ini (cm²)?', visual: { kind: 'rect', w: l, h: w, unit: 'cm' }, meta: { expr: `${l} * ${w}` },
    explanation: `Luas = panjang × lebar = ${l} × ${w} = ${l * w} cm².`, hint: 'Luas = panjang × lebar.',
  }, l * w, { mcq: 0.25, unit: 5 });
});
def('volume', 'ukuran', 5, 6, (r, y) => {
  const cap = y === 5 ? 12 : 25;
  const l = r.int(2, cap);
  const w = r.int(2, cap);
  const h = r.int(2, y === 5 ? 10 : 20);
  return numQ(r, {
    unit: 'cm³', type: 'visual', text: 'Berapakah isi padu kuboid ini (cm³)?', visual: { kind: 'cuboid', l, w, h, unit: 'cm' }, meta: { expr: `${l} * ${w} * ${h}` },
    explanation: `Isi padu = panjang × lebar × tinggi = ${l} × ${w} × ${h} = ${fmt(l * w * h)} cm³.`, hint: 'Isi padu = panjang × lebar × tinggi.',
  }, l * w * h, { mcq: 0.25, unit: 10 });
});

/* ------------------------------------------------ Cabaran Penyelesaian Masalah */
def('prob_two', 'masalah', 2, 6, (r, y, d) => {
  const [n1, n2] = twoNames(r);
  const it = r.pick(ITEMS);
  const pool = y === 2 ? [1, 2] : y === 3 ? [1, 2, 3] : [1, 2, 3, 4];
  const t = r.pick(pool);
  if (t === 1) {
    const a = r.int(2, y <= 2 ? 5 : 9);
    const b = r.int(2, y <= 2 ? 5 : 12) * (y >= 5 ? r.int(2, 9) : 1);
    const tot = a * b;
    const c = r.int(1, tot - 1);
    return numQ(r, {
      type: 'word', text: `${n1} ada ${a} kotak. Setiap kotak mengandungi ${phrase(b, it)}. Dia memberikan ${phrase(c, it)} kepada ${n2}. Berapakah baki ${it.n} ${n1}?`,
      meta: { expr: `${a} * ${b} - ${c}` }, explanation: `Langkah 1: ${a} × ${fmt(b)} = ${fmt(tot)}. Langkah 2: ${fmt(tot)} − ${fmt(c)} = ${fmt(tot - c)}.`, hint: 'Cari jumlah semua dahulu, kemudian tolak.',
    }, tot - c, { mcq: 0.25 });
  }
  if (t === 2) {
    const a = r.int(5, Math.min(lim(y, d), 500));
    const b = r.int(2, a);
    return numQ(r, {
      type: 'word', text: `${n1} mempunyai ${phrase(a, it)}. ${n2} mempunyai ${fmt(b)} ${it.c} lebih banyak daripada ${n1}. Berapakah jumlah ${it.n} mereka berdua?`,
      meta: { expr: `${a} + (${a} + ${b})` }, explanation: `${n2} ada ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}. Jumlah = ${fmt(a)} + ${fmt(a + b)} = ${fmt(2 * a + b)}.`, hint: 'Cari bilangan kepunyaan kedua dahulu.',
    }, 2 * a + b, { mcq: 0.25 });
  }
  if (t === 3) {
    const p = r.int(2, y === 3 ? 10 : 50);
    const n = r.int(2, 9);
    const pay = [10, 20, 50, 100, 500].find((x) => x > n * p);
    return numQ(r, {
      type: 'word', text: `Ibu membeli ${n} ${r.pick(THINGS)} dengan harga RM${p} sebuah. Ibu membayar RM${pay}. Berapakah baki wang Ibu (RM)?`,
      meta: { expr: `${pay} - ${n} * ${p}` }, explanation: `Jumlah harga = ${n} × RM${p} = RM${n * p}. Baki = RM${pay} − RM${n * p} = RM${pay - n * p}.`, hint: 'Cari jumlah harga dahulu.',
    }, pay - n * p, { mcq: 0.25, show: (v) => `RM${v}` });
  }
  const k = r.int(2, 9);
  const per = r.int(5, y === 4 ? 30 : 200);
  const c = r.int(1, 20);
  return numQ(r, {
    type: 'word', text: `${phrase(k * per, it)} dibahagi sama banyak kepada ${k} bakul. Kemudian setiap bakul ditambah ${fmt(c)} ${it.c}. Berapakah bilangan ${it.n} dalam satu bakul sekarang?`,
    meta: { expr: `${k * per} / ${k} + ${c}` }, explanation: `${fmt(k * per)} ÷ ${k} = ${fmt(per)}. Kemudian ${fmt(per)} + ${fmt(c)} = ${fmt(per + c)}.`, hint: 'Bahagi dahulu, kemudian tambah.',
  }, per + c, { mcq: 0.25 });
});
def('prob_frac', 'masalah', 4, 6, (r, y) => {
  const b = r.pick([2, 3, 4, 5, 6, 8, 10]);
  const a = r.int(1, b - 1);
  const m = r.int(2, y === 4 ? 30 : 100);
  const x = b * m;
  const [n1] = twoNames(r);
  return numQ(r, {
    type: 'word', text: `${n1} ada RM${fmt(x)}. Dia membelanjakan ${frac(a, b)} daripada wang itu. Berapakah baki wang ${n1} (RM)?`, meta: { expr: `${x} - ${x} / ${b} * ${a}` },
    explanation: `${fmt(x)} ÷ ${b} = ${m}; ${m} × ${a} = ${fmt(a * m)} (dibelanjakan). Baki = ${fmt(x)} − ${fmt(a * m)} = ${fmt(x - a * m)}.`, hint: 'Cari wang yang dibelanjakan dahulu, kemudian tolak.',
  }, x - a * m, { mcq: 0.25, show: (v) => `RM${fmt(v)}` });
});
def('prob_average', 'masalah', 4, 6, (r, y) => {
  const n = r.int(3, 5);
  const m = r.int(10, y === 4 ? 50 : 200);
  let vals;
  do {
    vals = Array.from({ length: n - 1 }, () => r.int(Math.ceil(m / 2), Math.floor(m * 1.5)));
    vals.push(n * m - vals.reduce((s, v) => s + v, 0));
  } while (vals.some((v) => v < 1));
  return numQ(r, {
    type: 'word', text: `Markah ${n} orang murid ialah ${vals.join(', ')}. Berapakah purata markah mereka?`, meta: { expr: `(${vals.join(' + ')}) / ${n}` },
    explanation: `Jumlah = ${vals.join(' + ')} = ${n * m}. Purata = ${n * m} ÷ ${n} = ${m}.`, hint: 'Purata = jumlah ÷ bilangan.',
  }, m, { mcq: 0.25 });
});
def('prob_percent', 'masalah', 5, 6, (r, y, d) => {
  const p = r.pick([5, 10, 20, 25, 50, 15, 30, 40]);
  const step = 100 / gcd(p, 100);
  const base = step * r.int(1, 10) * (r.chance(0.5) ? 1 : 2);
  const part = (base * p) / 100;
  if (y === 6 && d >= 2 && r.chance(0.5)) {
    return numQ(r, {
      type: 'word', text: `Harga sehelai baju ialah RM${base}. Kedai memberi diskaun ${p}%. Berapakah harga selepas diskaun (RM)?`, meta: { expr: `${base} - ${base} * ${p} / 100` },
      explanation: `Diskaun = ${p}% × RM${base} = RM${part}. Harga selepas diskaun = RM${base} − RM${part} = RM${base - part}.`, hint: 'Cari jumlah diskaun, kemudian tolak daripada harga asal.',
    }, base - part, { mcq: 0.25, show: (v) => `RM${v}` });
  }
  return numQ(r, {
    type: 'word', text: `Berapakah ${p}% daripada ${base}?`, meta: { expr: `${base} * ${p} / 100` },
    explanation: `${p}% = ${p}/100. ${base} × ${p} ÷ 100 = ${part}.`, hint: 'Peratus bermaksud per seratus.',
  }, part, { mcq: 0.25 });
});

export const GENERATOR_KEYS = Object.keys(GENERATORS);

/** Generate one finalized, validated question. */
export function generate(key, r, year, diffIdx) {
  const g = GENERATORS[key];
  if (!g) throw new Error(`Penjana tidak dikenali: ${key}`);
  const q = g.fn(r, year, diffIdx);
  q.input = q.options ? 'mcq' : q.lefts ? 'match' : q.type === 'count' ? 'count' : 'number';
  q.generator = key;
  q.topic = g.topic;
  q.difficulty = DIFFICULTIES[diffIdx];
  q.year = year;
  if (q.answerText == null) q.answerText = q.input === 'mcq' ? q.options[q.answer] : String(q.answer);
  return validateQuestion(q);
}

export const generatorsFor = (year, keys) => keys.filter((k) => GENERATORS[k] && GENERATORS[k].minYear <= year && year <= GENERATORS[k].maxYear);
export const generatorsForTopic = (topic, year) => GENERATOR_KEYS.filter((k) => GENERATORS[k].topic === topic && GENERATORS[k].minYear <= year && year <= GENERATORS[k].maxYear);
