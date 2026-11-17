import { AppError } from '../db.js';

export const AVATARS = ['fox', 'panda', 'lion', 'rabbit', 'tiger', 'owl', 'dino', 'robot', 'unicorn', 'koala'];

const BLOCKED = ['bodoh', 'babi', 'sial', 'celaka', 'bangsat', 'anjing', 'stupid', 'idiot', 'fuck', 'shit', 'damn'];

/** Display names are nicknames shown on leaderboards: short, no contact details, no profanity. */
export function validateNickname(raw) {
  const s = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (s.length < 2 || s.length > 24) throw new AppError(400, 'Nama paparan mesti 2-24 aksara.');
  if (!/^[\p{L}\p{N} '.-]+$/u.test(s)) throw new AppError(400, 'Nama paparan hanya boleh mengandungi huruf, nombor dan ruang.');
  if (/\d{6,}/.test(s.replace(/\s/g, '')) || /@/.test(s)) throw new AppError(400, 'Nama paparan tidak boleh mengandungi nombor panjang atau maklumat perhubungan.');
  const low = s.toLowerCase();
  if (BLOCKED.some((w) => low.includes(w))) throw new AppError(400, 'Nama paparan tidak sesuai. Sila pilih nama lain.');
  return s;
}

export const DIFFICULTY_LABEL = { mudah: 'Mudah', sederhana: 'Sederhana', sukar: 'Sukar', pakar: 'Pakar' };
