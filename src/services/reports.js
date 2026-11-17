import { getSettings } from '../db.js';

const inList = (ids) => (ids.length ? ids.map(() => '?').join(',') : 'NULL');

/** Share of wrong answers per topic. classIds = null for all (administrator). */
export function topicAccuracy(db, { classIds = null, studentId = null, schoolId = 1 } = {}) {
  const where = ['u.school_id = ?'];
  const args = [schoolId];
  if (studentId) { where.push('a.student_id = ?'); args.push(studentId); }
  if (classIds) { where.push(`s.class_id IN (${inList(classIds)})`); args.push(...classIds); }
  return db.prepare(`SELECT t.code, t.name, COUNT(*) AS answered, SUM(a.is_correct) AS correct,
      ROUND(100.0 * SUM(a.is_correct) / COUNT(*), 1) AS accuracy
    FROM student_answers a JOIN students s ON s.user_id = a.student_id JOIN users u ON u.id = s.user_id
    JOIN mathematics_topics t ON t.id = a.topic_id WHERE ${where.join(' AND ')}
    GROUP BY t.id ORDER BY accuracy ASC`).all(...args).map((r) => ({ ...r, weak: r.answered >= 10 && r.accuracy < 70 }));
}

export function studentRows(db, { classIds = null, schoolId = 1 } = {}) {
  const args = [schoolId];
  let extra = '';
  if (classIds) { extra = `AND s.class_id IN (${inList(classIds)})`; args.push(...classIds); }
  return db.prepare(`SELECT u.id, u.username AS id_murid, u.display_name AS nama_paparan, c.name AS kelas, s.year AS tahun, s.points_lifetime AS mata_seumur_hidup, s.points_balance AS baki_mata,
      (SELECT COUNT(*) FROM student_progress p WHERE p.student_id = s.user_id AND p.passed = 1) AS tahap_lulus,
      (SELECT COALESCE(SUM(stars),0) FROM student_progress p WHERE p.student_id = s.user_id) AS bintang,
      (SELECT COUNT(*) FROM student_answers a WHERE a.student_id = s.user_id) AS soalan_dijawab,
      (SELECT ROUND(100.0 * SUM(is_correct) / COUNT(*), 1) FROM student_answers a WHERE a.student_id = s.user_id) AS ketepatan_peratus,
      (SELECT MAX(finished_at) FROM game_sessions g WHERE g.student_id = s.user_id AND g.status = 'finished') AS aktiviti_terakhir
    FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN classes c ON c.id = s.class_id
    WHERE u.school_id = ? AND u.active = 1 ${extra} ORDER BY c.name, u.display_name`).all(...args);
}

export function classReport(db, classId) {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return null;
  return {
    class: cls,
    students: studentRows(db, { classIds: [classId], schoolId: cls.school_id }),
    topics: topicAccuracy(db, { classIds: [classId], schoolId: cls.school_id }),
  };
}

export function redemptionRows(db, { classIds = null, schoolId = 1 } = {}) {
  const args = [schoolId];
  let extra = '';
  if (classIds) { extra = `AND s.class_id IN (${inList(classIds)})`; args.push(...classIds); }
  return db.prepare(`SELECT d.reference_no AS rujukan, u.username AS id_murid, u.display_name AS nama_paparan, c.name AS kelas, r.name AS hadiah, d.points_spent AS mata,
      d.status, d.created_at AS tarikh_mohon, d.updated_at AS tarikh_kemaskini, d.note AS catatan
    FROM reward_redemptions d JOIN students s ON s.user_id = d.student_id JOIN users u ON u.id = s.user_id LEFT JOIN classes c ON c.id = s.class_id
    JOIN reward_catalog r ON r.id = d.reward_id WHERE u.school_id = ? ${extra} ORDER BY d.id DESC`).all(...args);
}

export function trends(db, { classIds = null, schoolId = 1 } = {}) {
  const args = [schoolId];
  let extra = '';
  if (classIds) { extra = `AND s.class_id IN (${inList(classIds)})`; args.push(...classIds); }
  const daily = db.prepare(`SELECT date(g.finished_at) AS day, COUNT(*) AS sessions, COUNT(DISTINCT g.student_id) AS students, ROUND(AVG(g.percent),1) AS avg_percent
    FROM game_sessions g JOIN students s ON s.user_id = g.student_id JOIN users u ON u.id = s.user_id
    WHERE g.status = 'finished' AND g.finished_at >= date('now','-13 days') AND u.school_id = ? ${extra} GROUP BY day ORDER BY day`).all(...args);
  const weekly = db.prepare(`SELECT strftime('%Y-%W', p.created_at) AS week, SUM(p.lifetime_delta) AS points
    FROM point_transactions p JOIN students s ON s.user_id = p.student_id JOIN users u ON u.id = s.user_id
    WHERE p.lifetime_delta > 0 AND p.created_at >= date('now','-56 days') AND u.school_id = ? ${extra} GROUP BY week ORDER BY week`).all(...args);
  return { daily, weekly };
}

export function classSummary(db, schoolId = 1, classIds = null) {
  const args = [schoolId];
  let extra = '';
  if (classIds) { extra = `AND c.id IN (${inList(classIds)})`; args.push(...classIds); }
  return db.prepare(`SELECT c.id, c.name, c.year,
      (SELECT COUNT(*) FROM students s JOIN users u ON u.id = s.user_id WHERE s.class_id = c.id AND u.active = 1) AS students,
      (SELECT COALESCE(ROUND(AVG(s.points_lifetime)),0) FROM students s WHERE s.class_id = c.id) AS avg_points,
      (SELECT COUNT(*) FROM student_progress p JOIN students s ON s.user_id = p.student_id WHERE s.class_id = c.id AND p.passed = 1) AS levels_passed,
      (SELECT ROUND(100.0 * SUM(a.is_correct) / COUNT(*), 1) FROM student_answers a JOIN students s ON s.user_id = a.student_id WHERE s.class_id = c.id) AS accuracy
    FROM classes c WHERE c.school_id = ? ${extra} ORDER BY c.year, c.name`).all(...args);
}

export function adminDashboard(db, schoolId = 1) {
  const one = (sql, ...a) => db.prepare(sql).get(schoolId, ...a);
  return {
    students: one(`SELECT COUNT(*) c FROM students s JOIN users u ON u.id = s.user_id WHERE u.school_id = ?`).c,
    active_students: one(`SELECT COUNT(DISTINCT g.student_id) c FROM game_sessions g JOIN users u ON u.id = g.student_id WHERE u.school_id = ? AND g.started_at >= datetime('now','-7 days')`).c,
    questions: one(`SELECT COUNT(*) c FROM questions WHERE active = 1 AND (school_id IS NULL OR school_id = ?)`).c,
    levels_completed: one(`SELECT COUNT(*) c FROM student_progress p JOIN users u ON u.id = p.student_id WHERE u.school_id = ? AND p.passed = 1`).c,
    points_awarded: one(`SELECT COALESCE(SUM(p.lifetime_delta),0) c FROM point_transactions p JOIN users u ON u.id = p.student_id WHERE u.school_id = ? AND p.lifetime_delta > 0`).c,
    points_redeemed: one(`SELECT COALESCE(SUM(d.points_spent),0) c FROM reward_redemptions d JOIN users u ON u.id = d.student_id WHERE u.school_id = ? AND d.status IN ('menunggu','diluluskan','sedia','dituntut')`).c,
    pending_redemptions: one(`SELECT COUNT(*) c FROM reward_redemptions d JOIN users u ON u.id = d.student_id WHERE u.school_id = ? AND d.status = 'menunggu'`).c,
    inventory_available: one(`SELECT COALESCE(SUM(i.stock - i.reserved),0) c FROM reward_inventory i JOIN reward_catalog r ON r.id = i.reward_id WHERE r.school_id = ? AND r.active = 1`).c,
    settings: getSettings(db, schoolId),
  };
}

export function leaderboard(db, { type, schoolId, viewerId }) {
  const settings = getSettings(db, schoolId);
  const out = { type, rows: [], me: null };
  let rows;
  if (type === 'class') {
    rows = db.prepare(`SELECT c.name AS label, '🏫' AS avatar, ROUND(AVG(s.points_lifetime)) AS points, COUNT(*) AS members
      FROM classes c JOIN students s ON s.class_id = c.id JOIN users u ON u.id = s.user_id WHERE c.school_id = ? AND u.active = 1
      GROUP BY c.id ORDER BY points DESC LIMIT 20`).all(schoolId);
    rows.forEach((r, i) => { r.rank = i + 1; });
    out.rows = rows;
    return { ...out, public: settings.leaderboard_public === 1 };
  }
  let sql;
  if (type === 'weekly' || type === 'monthly') {
    const since = type === 'weekly' ? "datetime('now','-7 days')" : "datetime('now','start of month')";
    sql = `SELECT u.id, u.display_name AS label, s.avatar, COALESCE(SUM(p.lifetime_delta),0) AS points
      FROM students s JOIN users u ON u.id = s.user_id
      LEFT JOIN point_transactions p ON p.student_id = s.user_id AND p.lifetime_delta > 0 AND p.created_at >= ${since}
      WHERE u.school_id = ? AND u.active = 1 GROUP BY s.user_id HAVING points > 0 ORDER BY points DESC, u.display_name`;
  } else {
    sql = `SELECT u.id, u.display_name AS label, s.avatar, s.points_lifetime AS points FROM students s JOIN users u ON u.id = s.user_id
      WHERE u.school_id = ? AND u.active = 1 AND s.points_lifetime > 0 ORDER BY s.points_lifetime DESC, u.display_name`;
  }
  const all = db.prepare(sql).all(schoolId).map((r, i) => ({ ...r, rank: i + 1 }));
  out.rows = all.slice(0, 20).map((r) => ({ rank: r.rank, label: r.label, avatar: r.avatar, points: r.points, me: r.id === viewerId }));
  const me = all.find((r) => r.id === viewerId);
  if (me) out.me = { rank: me.rank, points: me.points };
  out.public = settings.leaderboard_public === 1;
  return out;
}
