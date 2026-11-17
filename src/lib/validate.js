import { AppError } from '../db.js';

const bad = (msg) => { throw new AppError(400, msg); };

export function str(v, label, { min = 1, max = 200, optional = false } = {}) {
  if (v == null || v === '') { if (optional) return null; bad(`${label} diperlukan.`); }
  if (typeof v !== 'string') bad(`${label} tidak sah.`);
  const s = v.trim();
  if (s.length < min || s.length > max) bad(`${label} mesti ${min}-${max} aksara.`);
  return s;
}

export function int(v, label, { min = -Infinity, max = Infinity, optional = false } = {}) {
  if (v == null || v === '') { if (optional) return null; bad(`${label} diperlukan.`); }
  const n = typeof v === 'string' && /^-?\d+$/.test(v.trim()) ? Number(v) : v;
  if (!Number.isInteger(n) || n < min || n > max) bad(`${label} mesti nombor bulat antara ${min} dan ${max}.`);
  return n;
}

export function oneOf(v, label, list) {
  if (!list.includes(v)) bad(`${label} tidak sah.`);
  return v;
}

export const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);

export function id(v, label = 'ID') {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) bad(`${label} tidak sah.`);
  return n;
}
