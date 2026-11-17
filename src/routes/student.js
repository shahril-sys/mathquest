import { AppError, tx, getSettings } from '../db.js';
import { AVATARS, validateNickname } from '../lib/constants.js';
import { int, id, str } from '../lib/validate.js';
import * as game from '../services/game.js';
import * as rewards from '../services/rewards.js';
import { ledger } from '../services/points.js';
import { topicAccuracy, leaderboard } from '../services/reports.js';

const S = { roles: ['murid'] };
const LEVELS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

/** Player level (Tahap Pahlawan) derived from lifetime points; never from redeemable balance. */
export function playerLevel(lifetime) {
  let lv = 1;
  for (let i = 0; i < LEVELS.length; i++) if (lifetime >= LEVELS[i]) lv = i + 1;
  const cur = LEVELS[lv - 1];
  const next = LEVELS[lv] ?? null;
  return { level: lv, current_floor: cur, next_at: next, progress: next ? Math.round(((lifetime - cur) / (next - cur)) * 100) : 100 };
}

export default function register(router) {
  router.get('/api/student/home', S, ({ db, user }) => {
    const st = game.getStudent(db, user.id);
    const cls = st.class_id ? db.prepare('SELECT name FROM classes WHERE id = ?').get(st.class_id) : null;
    const worlds = game.listWorlds(db, user.id);
    const totalLevels = worlds.filter((w) => !w.year_locked).reduce((s, w) => s + w.total, 0);
    const passedLevels = worlds.filter((w) => !w.year_locked).reduce((s, w) => s + w.passed, 0);
    const assignments = st.class_id ? db.prepare(`SELECT a.id, a.title, a.due_date, l.id AS level_id, l.title AS level_title, w.name AS world_name,
        EXISTS (SELECT 1 FROM student_progress p WHERE p.student_id = ? AND p.level_id = l.id AND p.passed = 1) AS done
      FROM assignments a JOIN game_levels l ON l.id = a.level_id JOIN game_worlds w ON w.id = l.world_id WHERE a.class_id = ? ORDER BY a.id DESC LIMIT 10`).all(user.id, st.class_id) : [];
    const badges = db.prepare(`SELECT b.code, b.name, b.icon FROM student_achievements a JOIN achievement_badges b ON b.id = a.badge_id WHERE a.student_id = ? ORDER BY a.earned_at DESC LIMIT 4`).all(user.id);
    const next = worlds.flatMap((w) => (w.year_locked ? [] : w.levels.filter((l) => l.unlocked && !l.passed).slice(0, 1).map((l) => ({ ...l, world_name: w.name, world_icon: w.icon })))).slice(0, 3);
    return {
      profile: { display_name: st.display_name, avatar: st.avatar, year: st.year, class_name: cls?.name || null },
      points: { balance: st.points_balance, lifetime: st.points_lifetime }, player: playerLevel(st.points_lifetime),
      progress: { passed: passedLevels, total: totalLevels }, stars: worlds.reduce((s, w) => s + w.stars, 0),
      daily: game.dailyStatus(db, user.id), assignments, badges, next_levels: next,
    };
  });

  router.get('/api/student/worlds', S, ({ db, user }) => ({ worlds: game.listWorlds(db, user.id) }));

  router.post('/api/student/levels/:id/start', S, ({ db, user, params }) => game.startLevel(db, user.id, id(params.id)));
  router.post('/api/student/daily/start', S, ({ db, user }) => game.startDaily(db, user.id));
  router.get('/api/sessions/:id', S, ({ db, user, params }) => game.sessionState(db, user.id, id(params.id)));
  router.post('/api/sessions/:id/answer', S, ({ db, user, params, body }) => game.submitAnswer(db, user.id, id(params.id), body.idx, body.response));
  router.post('/api/sessions/:id/begin', S, ({ db, user, params, body }) => game.beginQuestion(db, user.id, id(params.id), body.idx));
  router.post('/api/sessions/:id/hint', S, ({ db, user, params, body }) => game.getHint(db, user.id, id(params.id), body.idx));
  router.post('/api/sessions/:id/finish', S, ({ db, user, params }) => game.finishSession(db, user.id, id(params.id)));

  router.get('/api/student/badges', S, ({ db, user }) => ({
    badges: db.prepare(`SELECT b.code, b.name, b.icon, b.description, a.earned_at FROM achievement_badges b
      LEFT JOIN student_achievements a ON a.badge_id = b.id AND a.student_id = ? ORDER BY b.id`).all(user.id).map((b) => ({ ...b, earned: !!b.earned_at })),
  }));

  router.get('/api/student/profile', S, ({ db, user }) => {
    const st = game.getStudent(db, user.id);
    const cls = st.class_id ? db.prepare('SELECT name FROM classes WHERE id = ?').get(st.class_id) : null;
    const accuracy = topicAccuracy(db, { studentId: user.id, schoolId: st.school_id });
    const worlds = game.listWorlds(db, user.id).filter((w) => !w.year_locked).map((w) => ({ name: w.name, icon: w.icon, passed: w.passed, total: w.total, stars: w.stars }));
    return {
      username: user.username, display_name: st.display_name, avatar: st.avatar, year: st.year, class_name: cls?.name || null,
      points: { balance: st.points_balance, lifetime: st.points_lifetime }, player: playerLevel(st.points_lifetime), accuracy, worlds, avatars: AVATARS,
    };
  });

  router.patch('/api/student/profile', S, ({ db, user, body }) => {
    const nick = body.display_name != null ? validateNickname(body.display_name) : null;
    if (body.avatar != null && !AVATARS.includes(body.avatar)) throw new AppError(400, 'Avatar tidak sah.');
    tx(db, () => {
      if (nick) db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(nick, user.id);
      if (body.avatar) db.prepare('UPDATE students SET avatar = ? WHERE user_id = ?').run(body.avatar, user.id);
    });
    return { ok: true };
  });

  router.get('/api/student/points', S, ({ db, user }) => ({ transactions: ledger(db, user.id, 100) }));

  router.get('/api/leaderboard', { roles: ['murid', 'guru', 'pentadbir'] }, ({ db, user, query }) => {
    const type = ['individual', 'class', 'weekly', 'monthly'].includes(query.type) ? query.type : 'individual';
    const data = leaderboard(db, { type, schoolId: user.school_id, viewerId: user.id });
    if (user.role === 'murid' && !data.public) return { type, disabled: true, rows: [], message: 'Papan pendahulu dimatikan oleh sekolah.' };
    return data;
  });

  router.get('/api/rewards', S, ({ db, user }) => {
    const st = game.getStudent(db, user.id);
    return { balance: st.points_balance, lifetime: st.points_lifetime, rewards: rewards.listRewards(db, user.id) };
  });
  router.post('/api/rewards/:id/redeem', S, ({ db, user, params, body }) => rewards.redeem(db, user.id, id(params.id), str(body.request_id, 'ID permintaan', { min: 8, max: 64 })));
  router.get('/api/student/redemptions', S, ({ db, user }) => ({ redemptions: rewards.studentRedemptions(db, user.id) }));
  router.post('/api/student/redemptions/:id/cancel', S, ({ db, user, params }) => rewards.transitionRedemption(db, user, id(params.id), 'cancel', 'Dibatalkan oleh murid'));

  void int; void getSettings;
}
