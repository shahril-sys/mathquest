import { AppError, audit } from '../db.js';
import { csv } from '../http.js';
import { id, int, str } from '../lib/validate.js';
import { topicAccuracy, studentRows, classReport, redemptionRows, classSummary, trends } from '../services/reports.js';
import { STATUS_LABEL } from '../services/rewards.js';
import { levelWithWorld, upsertLevelSettings, applyLevelSettings, schoolLevelSettings } from '../services/game.js';

const T = { roles: ['guru'] };

export const teacherClassIds = (db, teacherId) => db.prepare('SELECT class_id FROM teacher_classes WHERE teacher_id = ?').all(teacherId).map((x) => x.class_id);

function requireOwnClass(db, user, classId) {
  if (!teacherClassIds(db, user.id).includes(classId)) throw new AppError(403, 'Kelas ini bukan di bawah seliaan anda.');
}
function requireOwnStudent(db, user, studentId) {
  const s = db.prepare('SELECT class_id FROM students WHERE user_id = ?').get(studentId);
  if (!s || !teacherClassIds(db, user.id).includes(s.class_id)) throw new AppError(403, 'Murid ini bukan di bawah seliaan anda.');
  return s;
}

export default function register(router) {
  router.get('/api/teacher/overview', T, ({ db, user }) => {
    const ids = teacherClassIds(db, user.id);
    return {
      classes: classSummary(db, user.school_id, ids),
      weak_topics: topicAccuracy(db, { classIds: ids, schoolId: user.school_id }).filter((t) => t.weak),
      topics: topicAccuracy(db, { classIds: ids, schoolId: user.school_id }),
      trends: trends(db, { classIds: ids, schoolId: user.school_id }),
    };
  });

  router.get('/api/teacher/students', T, ({ db, user, query }) => {
    let ids = teacherClassIds(db, user.id);
    if (query.class_id) { const c = id(query.class_id); requireOwnClass(db, user, c); ids = [c]; }
    return { students: studentRows(db, { classIds: ids, schoolId: user.school_id }) };
  });

  router.get('/api/teacher/students/:id', T, ({ db, user, params }) => {
    const sid = id(params.id);
    requireOwnStudent(db, user, sid);
    const info = db.prepare(`SELECT u.display_name, u.username, s.year, s.avatar, s.points_balance, s.points_lifetime, c.name AS class_name
      FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN classes c ON c.id = s.class_id WHERE s.user_id = ?`).get(sid);
    const levels = db.prepare(`SELECT w.name AS world, l.level_no, l.title, p.best_percent, p.stars, p.passed, p.attempts FROM student_progress p
      JOIN game_levels l ON l.id = p.level_id JOIN game_worlds w ON w.id = l.world_id WHERE p.student_id = ? ORDER BY w.sort_order, l.level_no`).all(sid);
    const sessions = db.prepare(`SELECT g.finished_at, g.kind, g.percent, g.passed, l.title FROM game_sessions g LEFT JOIN game_levels l ON l.id = g.level_id
      WHERE g.student_id = ? AND g.status = 'finished' ORDER BY g.id DESC LIMIT 15`).all(sid);
    return { student: info, topics: topicAccuracy(db, { studentId: sid, schoolId: user.school_id }), levels, sessions };
  });

  router.get('/api/teacher/classes/:id/report', T, ({ db, user, params, query, raw }) => {
    const cid = id(params.id);
    requireOwnClass(db, user, cid);
    const rep = classReport(db, cid);
    if (query.format === 'csv') {
      const headers = ['id_murid', 'nama_paparan', 'kelas', 'tahun', 'mata_seumur_hidup', 'tahap_lulus', 'bintang', 'soalan_dijawab', 'ketepatan_peratus', 'aktiviti_terakhir'];
      audit(db, user, 'report.class_csv', cid);
      return raw('text/csv; charset=utf-8', csv(rep.students, headers), `laporan-kelas-${cid}.csv`);
    }
    return rep;
  });

  router.get('/api/teacher/levels', T, ({ db, user }) => {
    const ov = schoolLevelSettings(db, user.school_id);
    return { levels: db.prepare(`SELECT l.id, l.level_no, l.title, l.pass_percent, l.difficulty, w.name AS world, w.min_year FROM game_levels l JOIN game_worlds w ON w.id = l.world_id
      WHERE l.active = 1 AND w.active = 1 ORDER BY w.sort_order, l.level_no`).all().map((l) => applyLevelSettings(l, ov.get(l.id))) };
  });

  // Teachers may adjust the passing threshold only (not other level settings).
  router.patch('/api/teacher/levels/:id', T, ({ db, user, params, body }) => {
    const lid = id(params.id);
    const pct = int(body.pass_percent, 'Peratus lulus', { min: 40, max: 100 });
    const old = levelWithWorld(db, lid, user.school_id); // nilai berkesan sekolah ini
    // hanya peratus lulus berubah; tetapan lain sekolah dikekalkan. Tidak menjejaskan sekolah lain.
    upsertLevelSettings(db, user.school_id, lid, { pass_percent: pct, num_questions: old.num_questions, time_limit_sec: old.time_limit_sec ?? 0, bonus_points: old.bonus_points ?? null });
    audit(db, user, 'level.pass_percent', lid, { from: old.pass_percent, to: pct });
    return { ok: true };
  });

  router.get('/api/teacher/assignments', T, ({ db, user }) => {
    const ids = teacherClassIds(db, user.id);
    const rows = db.prepare(`SELECT a.id, a.title, a.due_date, a.created_at, c.id AS class_id, c.name AS class_name, l.title AS level_title, w.name AS world_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS total_students,
        (SELECT COUNT(*) FROM students s JOIN student_progress p ON p.student_id = s.user_id AND p.level_id = a.level_id AND p.passed = 1 WHERE s.class_id = c.id) AS completed
      FROM assignments a JOIN classes c ON c.id = a.class_id JOIN game_levels l ON l.id = a.level_id JOIN game_worlds w ON w.id = l.world_id
      WHERE a.class_id IN (${ids.length ? ids.map(() => '?').join(',') : 'NULL'}) ORDER BY a.id DESC`).all(...ids);
    return { assignments: rows, classes: db.prepare(`SELECT id, name, year FROM classes WHERE id IN (${ids.length ? ids.map(() => '?').join(',') : 'NULL'})`).all(...ids) };
  });

  router.post('/api/teacher/assignments', T, ({ db, user, body }) => {
    const cid = id(body.class_id, 'Kelas');
    requireOwnClass(db, user, cid);
    const lid = id(body.level_id, 'Tahap');
    if (!db.prepare('SELECT 1 FROM game_levels WHERE id = ? AND active = 1').get(lid)) throw new AppError(404, 'Tahap tidak dijumpai.');
    const title = str(body.title, 'Tajuk cabaran', { max: 80 });
    const due = body.due_date ? str(body.due_date, 'Tarikh akhir', { max: 10 }) : null;
    if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new AppError(400, 'Format tarikh mesti YYYY-MM-DD.');
    const res = db.prepare('INSERT INTO assignments(class_id, level_id, title, due_date, created_by) VALUES (?,?,?,?,?)').run(cid, lid, title, due, user.id);
    audit(db, user, 'assignment.create', Number(res.lastInsertRowid), { cid, lid });
    return { id: Number(res.lastInsertRowid) };
  });

  router.delete('/api/teacher/assignments/:id', T, ({ db, user, params }) => {
    const a = db.prepare('SELECT class_id FROM assignments WHERE id = ?').get(id(params.id));
    if (!a) throw new AppError(404, 'Cabaran tidak dijumpai.');
    requireOwnClass(db, user, a.class_id);
    db.prepare('DELETE FROM assignments WHERE id = ?').run(id(params.id));
    return { ok: true };
  });

  // Read-only view of redemptions for the teacher's own students.
  router.get('/api/teacher/redemptions', T, ({ db, user }) => ({
    redemptions: redemptionRows(db, { classIds: teacherClassIds(db, user.id), schoolId: user.school_id }).map((r) => ({ ...r, status_label: STATUS_LABEL[r.status] })),
  }));
}
