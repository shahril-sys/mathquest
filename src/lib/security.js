import crypto from 'node:crypto';
import { AppError } from '../db.js';

// scrypt password hashing: "scrypt$N$salt$hash"
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [alg, n, saltHex, hashHex] = String(stored).split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(hashHex, 'hex');
  const got = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: Number(n), r: 8, p: 1 });
  return crypto.timingSafeEqual(got, expected);
}

export function validatePasswordStrength(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw new AppError(400, 'Kata laluan mesti sekurang-kurangnya 8 aksara.');
  if (pw.length > 100) throw new AppError(400, 'Kata laluan terlalu panjang.');
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new AppError(400, 'Kata laluan mesti mengandungi huruf dan nombor.');
}

export const newToken = () => crypto.randomBytes(32).toString('base64url');
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomPassword = () => {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 5; i++) s += letters[crypto.randomInt(letters.length)];
  return s + crypto.randomInt(1000, 9999);
};

/** Fixed-window in-memory rate limiter. */
export class RateLimiter {
  constructor(max, windowMs) { this.max = max; this.windowMs = windowMs; this.hits = new Map(); }
  check(key) {
    const now = Date.now();
    let h = this.hits.get(key);
    if (!h || h.reset <= now) { h = { n: 0, reset: now + this.windowMs }; this.hits.set(key, h); }
    h.n++;
    if (this.hits.size > 5000) for (const [k, v] of this.hits) if (v.reset <= now) this.hits.delete(k);
    return h.n <= this.max;
  }
}

// Image upload validation by magic bytes (SVG intentionally rejected: script risk)
export function sniffImage(buf) {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  if (buf.length > 6 && ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString())) return 'gif';
  return null;
}
