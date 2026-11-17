import { AppError, tx, audit } from './db.js';
import { config } from './config.js';
import { hashPassword, verifyPassword, validatePasswordStrength, newToken, sha256 } from './lib/security.js';
import { AVATARS, validateNickname } from './lib/constants.js';

const COOKIE = 'mq_session';
const DUMMY_HASH = hashPassword('dummy-password-for-timing');
const MAX_FAILS = 5;
const LOCK_MINUTES = 5;

export function cookieHeader(token, maxAgeSec) {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}${config.secureCookies ? '; Secure' : ''}`;
}
export const clearCookieHeader = () => cookieHeader('', 0);

export function userFromCookie(db, cookies) {
  const token = cookies[COOKIE];
  if (!token) return null;
  const row = db.prepare(`SELECT u.id, u.username, u.role, u.display_name, u.school_id, u.must_change_password, u.active, u.is_platform_admin
    FROM auth_sessions s JOIN users u ON u.id = s.user_id JOIN schools sc ON sc.id = u.school_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND sc.active = 1`).get(sha256(token));
  return row && row.active ? row : null;
}

export function login(db, username, password) {
  if (typeof username !== 'string' || typeof password !== 'string' || !username || username.length > 40 || password.length > 100) throw new AppError(400, 'Sila masukkan ID dan kata laluan.');
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  const locked = u?.locked_until && new Date(u.locked_until.replace(' ', 'T') + 'Z') > new Date();
  if (locked) throw new AppError(429, `Akaun dikunci sementara. Cuba lagi dalam ${LOCK_MINUTES} minit.`, 'dikunci');
  if (u && !db.prepare('SELECT active FROM schools WHERE id = ?').get(u.school_id)?.active) throw new AppError(403, 'Akaun sekolah ini dinyahaktifkan. Hubungi pentadbir platform.', 'sekolah_tidak_aktif');
  const ok = u ? verifyPassword(password, u.password_hash) : (verifyPassword(password, DUMMY_HASH), false);
  if (!u || !ok || !u.active) {
    if (u) {
      const fails = u.failed_attempts + 1;
      db.prepare(`UPDATE users SET failed_attempts = ?, locked_until = CASE WHEN ? >= ${MAX_FAILS} THEN datetime('now', '+${LOCK_MINUTES} minutes') ELSE locked_until END WHERE id = ?`).run(fails >= MAX_FAILS ? 0 : fails, fails, u.id);
    }
    throw new AppError(401, 'ID atau kata laluan tidak betul.', 'log_masuk_gagal');
  }
  const token = newToken();
  tx(db, () => {
    db.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = datetime('now') WHERE id = ?").run(u.id);
    db.prepare("DELETE FROM auth_sessions WHERE expires_at < datetime('now')").run();
    db.prepare(`INSERT INTO auth_sessions(token_hash, user_id, expires_at) VALUES (?,?, datetime('now', '+${Math.round(config.sessionHours * 60)} minutes'))`).run(sha256(token), u.id);
  });
  return { token, user: publicUser(db, u.id) };
}

export function logout(db, cookies) {
  if (cookies[COOKIE]) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(sha256(cookies[COOKIE]));
}

export function publicUser(db, id) {
  const u = db.prepare('SELECT id, username, role, display_name, school_id, must_change_password, is_platform_admin FROM users WHERE id = ?').get(id);
  if (u.role === 'murid') {
    const s = db.prepare(`SELECT s.avatar, s.year, s.class_id, s.setup_done, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.user_id = ?`).get(id);
    Object.assign(u, s);
  }
  const school = db.prepare('SELECT name FROM schools WHERE id = ?').get(u.school_id);
  u.school_name = school?.name;
  return u;
}

export function revokeSessions(db, userId, exceptHash) {
  if (exceptHash) db.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?').run(userId, exceptHash);
  else db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
}

export function changePassword(db, userId, oldPassword, newPassword, cookies) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!verifyPassword(String(oldPassword || ''), u.password_hash)) throw new AppError(403, 'Kata laluan semasa tidak betul.');
  validatePasswordStrength(newPassword);
  if (newPassword === oldPassword) throw new AppError(400, 'Kata laluan baharu mesti berbeza.');
  tx(db, () => {
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hashPassword(newPassword), userId);
    revokeSessions(db, userId, cookies[COOKIE] ? sha256(cookies[COOKIE]) : null);
  });
}

/** First-login account setup for students: new password + nickname + avatar. */
export function completeSetup(db, user, { oldPassword, newPassword, nickname, avatar }, cookies) {
  if (!AVATARS.includes(avatar)) throw new AppError(400, 'Avatar tidak sah.');
  const nick = validateNickname(nickname);
  changePassword(db, user.id, oldPassword, newPassword, cookies);
  tx(db, () => {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(nick, user.id);
    db.prepare('UPDATE students SET avatar = ?, setup_done = 1 WHERE user_id = ?').run(avatar, user.id);
  });
}

export function createUserAccount(db, admin, { username, password, role, displayName, schoolId }) {
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username || '')) throw new AppError(400, 'ID pengguna mesti 3-30 aksara (huruf, nombor, titik, sengkang).');
  const nick = validateNickname(displayName);
  validatePasswordStrength(password);
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) throw new AppError(409, 'ID pengguna sudah digunakan. ID mesti unik merentasi semua sekolah; awali dengan kod sekolah (cth SEK001-M001).');
  const res = db.prepare('INSERT INTO users(school_id, username, password_hash, role, display_name, must_change_password) VALUES (?,?,?,?,?,1)')
    .run(schoolId, username, hashPassword(password), role, nick);
  if (admin) audit(db, admin, 'user.create', username, { role });
  return Number(res.lastInsertRowid);
}

export function resetPassword(db, admin, userId, newPassword) {
  validatePasswordStrength(newPassword);
  const u = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
  if (!u) throw new AppError(404, 'Pengguna tidak dijumpai.');
  tx(db, () => {
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1, failed_attempts = 0, locked_until = NULL WHERE id = ?').run(hashPassword(newPassword), userId);
    revokeSessions(db, userId);
    audit(db, admin, 'user.reset_password', u.username);
  });
}
