import { AppError, getSettings } from '../db.js';
import { login, logout, publicUser, changePassword, completeSetup } from '../auth.js';
import { config } from '../config.js';
import { AVATARS } from '../lib/constants.js';

export default function register(router) {
  router.get('/api/public/info', { public: true }, ({ db }) => ({ school_name: getSettings(db, 1).school_name, avatars: AVATARS }));

  router.post('/api/auth/login', { public: true }, ({ db, body, setCookie }) => {
    const { token, user } = login(db, body.username, body.password);
    setCookie(token, config.sessionHours * 3600);
    return { user };
  });

  router.post('/api/auth/logout', { public: true }, ({ db, cookies, setCookie }) => {
    logout(db, cookies);
    setCookie(null);
    return { ok: true };
  });

  router.get('/api/auth/me', { public: true }, ({ db, user }) => (user ? { user: publicUser(db, user.id), avatars: AVATARS } : { user: null }));

  // First-login account setup for students: new password + nickname + avatar.
  router.post('/api/auth/setup', { allowPending: true }, ({ db, user, body, cookies }) => {
    if (user.role !== 'murid') throw new AppError(403, 'Hanya untuk murid.');
    completeSetup(db, user, { oldPassword: body.old_password, newPassword: body.new_password, nickname: body.nickname, avatar: body.avatar }, cookies);
    return { user: publicUser(db, user.id) };
  });

  router.post('/api/auth/change-password', { allowPending: true }, ({ db, user, body, cookies }) => {
    changePassword(db, user.id, body.old_password, body.new_password, cookies);
    return { ok: true, user: publicUser(db, user.id) };
  });
}
