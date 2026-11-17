/** Answer validation. Pure functions, no database access. */

export function parseNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v !== 'string') return NaN;
  let s = v.trim().replace(/^rm\s*/i, '').replace(/[\s\u00a0]/g, '');
  if (!s || s.length > 20) return NaN;
  if (!s.includes('.')) s = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

/** secret: {input, answer}; response: {choice} | {value} | {order} */
export function checkAnswer(secret, response) {
  if (!response || typeof response !== 'object') return false;
  switch (secret.input) {
    case 'mcq':
      return Number.isInteger(response.choice) && response.choice === secret.answer;
    case 'number':
    case 'count': {
      const n = parseNumber(response.value);
      return Number.isFinite(n) && Math.abs(n - Number(secret.answer)) < 1e-9;
    }
    case 'match':
      return (
        Array.isArray(response.order) &&
        response.order.length === secret.answer.length &&
        response.order.every((x, i) => Number.isInteger(x) && x === secret.answer[i])
      );
    default:
      return false;
  }
}

/** Structural validation of a (generated or stored) question. Throws on defects. */
export function validateQuestion(q) {
  const fail = (m) => { throw new Error(`Soalan tidak sah: ${m} [${q.text}]`); };
  if (!q.text || !q.explanation) fail('teks/penjelasan kosong');
  if (q.input === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) fail('pilihan kurang');
    if (new Set(q.options).size !== q.options.length) fail('pilihan berulang');
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) fail('indeks jawapan');
  } else if (q.input === 'number' || q.input === 'count') {
    if (!Number.isFinite(Number(q.answer))) fail('jawapan bukan nombor');
  } else if (q.input === 'match') {
    if (!q.lefts?.length || q.lefts.length !== q.rights?.length || new Set(q.rights).size !== q.rights.length) fail('padanan');
    if (q.answer.length !== q.lefts.length) fail('jawapan padanan');
  } else fail('jenis input');
  return q;
}
