import { AppError, tx, audit, getSettings, saveSettings } from '../db.js';
import { csv } from '../http.js';
import { id, int, str, oneOf, bool } from '../lib/validate.js';
import { validateNickname } from '../lib/constants.js';
import { randomPassword } from '../lib/security.js';
import { createUserAccount, resetPassword } from '../auth.js';
import { GENERATORS, DIFFICULTIES } from '../engine/generators.js';
import { saveQuestion, getQuestion, importQuestionsCsv, importQuestionRows, TEMPLATE_ROWS } from '../services/questions.js';
import { readXlsx, writeXlsx } from '../lib/xlsx.js';
import { adjustBalance, ledger } from '../services/points.js';
import { transitionRedemption, setStock, STATUS_LABEL } from '../services/rewards.js';
import { topicAccuracy, studentRows, redemptionRows, classSummary, trends, adminDashboard } from '../services/reports.js';
import { applyLevelSettings, schoolLevelSettings, upsertLevelSettings } from '../services/game.js';
import { createStudent, importStudentsCsv, deleteStudent, saveReward, saveRewardImage, deleteReward, purgeExpired } from '../services/admin.js';

const A = { roles: ['pentadbir'] };
const P = { roles: ['pentadbir'], platform: true }; // struktur kongsi: pentadbir platform sahaja

export default function register(router) {
  router.get('/api/admin/dashboard', A, ({ db, user }) => ({
    ...adminDashboard(db, user.school_id),
    topics: topicAccuracy(db, { schoolId: user.school_id }), trends: trends(db, { schoolId: user.school_id }),
  }));

  /* ---------------------------------------------------------- settings */
  router.get('/api/admin/settings', A, ({ db, user }) => ({ settings: getSettings(db, user.school_id) }));
  router.put('/api/admin/settings', A, ({ db, user, body }) => {
    const before = getSettings(db, user.school_id);
    const saved = saveSettings(db, user.school_id, body);
    if (saved.school_name) db.prepare('UPDATE schools SET name = ? WHERE id = ?').run(saved.school_name, user.school_id);
    audit(db, user, 'settings.update', null, { before, after: saved });
    return { settings: getSettings(db, user.school_id) };
  });

  /* ---------------------------------------------------------- questions */
  router.get('/api/admin/topics', A, ({ db }) => ({ topics: db.prepare('SELECT code, name FROM mathematics_topics ORDER BY id').all() }));
  router.get('/api/admin/questions', A, ({ db, user, query }) => {
    const where = ['(q.school_id IS NULL OR q.school_id = ?)'];
    const args = [user.school_id];
    if (query.year) { where.push('q.year = ?'); args.push(int(query.year, 'Tahun', { min: 1, max: 6 })); }
    if (query.topic) { where.push('t.code = ?'); args.push(String(query.topic)); }
    if (query.difficulty) { where.push('q.difficulty = ?'); args.push(oneOf(query.difficulty, 'Kesukaran', DIFFICULTIES)); }
    if (query.q) { where.push('q.text LIKE ?'); args.push(`%${String(query.q).slice(0, 60)}%`); }
    const page = Math.max(1, Number(query.page) || 1);
    const total = db.prepare(`SELECT COUNT(*) c FROM questions q JOIN mathematics_topics t ON t.id = q.topic_id WHERE ${where.join(' AND ')}`).get(...args).c;
    const rows = db.prepare(`SELECT q.id, q.year, q.difficulty, q.qtype, q.text, q.active, q.time_limit_sec, t.code AS topic, t.name AS topic_name
      FROM questions q JOIN mathematics_topics t ON t.id = q.topic_id WHERE ${where.join(' AND ')} ORDER BY q.id DESC LIMIT 25 OFFSET ?`).all(...args, (page - 1) * 25);
    return { total, page, pages: Math.max(1, Math.ceil(total / 25)), questions: rows };
  });
  router.get('/api/admin/questions/template.xlsx', A, ({ db, user, raw }) => {
    audit(db, user, 'question.template', null);
    return raw('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', writeXlsx(TEMPLATE_ROWS), 'templat-soalan.xlsx');
  });
  // soalan bank kongsi (school_id NULL) hanya boleh diubah oleh pentadbir platform; soalan sekolah oleh sekolah itu sahaja
  const questionAccess = (db, user, qid, write) => {
    const q = db.prepare('SELECT school_id FROM questions WHERE id = ?').get(qid);
    if (!q) throw new AppError(404, 'Soalan tidak dijumpai.');
    const own = q.school_id === user.school_id;
    const shared = q.school_id === null;
    if (write ? !(own || (shared && user.is_platform_admin)) : !(own || shared)) throw new AppError(403, shared ? 'Soalan bank kongsi hanya boleh diubah oleh pentadbir platform. Salin sebagai soalan baharu untuk sekolah anda.' : 'Soalan ini milik sekolah lain.');
  };
  router.get('/api/admin/questions/:id', A, ({ db, user, params }) => { questionAccess(db, user, id(params.id), false); return getQuestion(db, id(params.id)); });
  router.post('/api/admin/questions', A, ({ db, user, body }) => ({ id: saveQuestion(db, user, body, null, user.school_id) }));
  router.put('/api/admin/questions/:id', A, ({ db, user, params, body }) => { questionAccess(db, user, id(params.id), true); return { id: saveQuestion(db, user, body, id(params.id), user.school_id) }; });
  router.delete('/api/admin/questions/:id', A, ({ db, user, params }) => {
    questionAccess(db, user, id(params.id), true);
    const r = db.prepare('DELETE FROM questions WHERE id = ?').run(id(params.id));
    if (!r.changes) throw new AppError(404, 'Soalan tidak dijumpai.');
    audit(db, user, 'question.delete', params.id);
    return { ok: true };
  });
  router.post('/api/admin/questions/import', A, ({ db, user, body }) => {
    if (typeof body.xlsx === 'string') {
      const rows = readXlsx(Buffer.from(body.xlsx.replace(/^data:[^,]*,/, ''), 'base64'));
      return importQuestionRows(db, user, rows, user.school_id);
    }
    return importQuestionsCsv(db, user, body.csv, user.school_id);
  });

  /* ---------------------------------------------------------- worlds & levels */
  router.get('/api/admin/generators', A, () => ({ generators: Object.values(GENERATORS).map((g) => ({ key: g.key, topic: g.topic, min_year: g.minYear, max_year: g.maxYear })) }));
  router.get('/api/admin/worlds', A, ({ db, user }) => {
    const worlds = db.prepare('SELECT w.*, t.code AS topic_code FROM game_worlds w JOIN mathematics_topics t ON t.id = w.topic_id ORDER BY w.sort_order, w.id').all();
    const lv = db.prepare('SELECT * FROM game_levels WHERE world_id = ? ORDER BY level_no');
    const ov = schoolLevelSettings(db, user.school_id);
    return { can_edit_structure: !!user.is_platform_admin, worlds: worlds.map((w) => ({ ...w, levels: lv.all(w.id).map((l) => ({ ...applyLevelSettings({ ...l }, ov.get(l.id)), generators: JSON.parse(l.generators), customized: ov.has(l.id) })) })) };
  });
  router.put('/api/admin/worlds/:id', P, ({ db, user, params, body }) => {
    const r = db.prepare('UPDATE game_worlds SET name=?, description=?, min_year=?, active=?, icon=? WHERE id=?')
      .run(str(body.name, 'Nama dunia', { max: 60 }), str(body.description ?? '', 'Penerangan', { max: 200, optional: true }) || '', int(body.min_year, 'Tahun minimum', { min: 1, max: 6 }), bool(body.active), String(body.icon || '🌍').slice(0, 4), id(params.id));
    if (!r.changes) throw new AppError(404, 'Dunia tidak dijumpai.');
    audit(db, user, 'world.update', params.id);
    return { ok: true };
  });
  const structure = (body) => {
    const gens = Array.isArray(body.generators) ? body.generators : [];
    if (!gens.length || gens.some((g) => !GENERATORS[g])) throw new AppError(400, 'Senarai penjana soalan tidak sah.');
    return [str(body.title, 'Tajuk tahap', { max: 60 }), oneOf(body.difficulty, 'Kesukaran', DIFFICULTIES), JSON.stringify(gens), bool(body.is_boss), bool(body.active)];
  };
  router.post('/api/admin/worlds/:id/levels', P, ({ db, user, params, body }) => {
    const wid = id(params.id);
    const last = db.prepare('SELECT COALESCE(MAX(level_no),0) m FROM game_levels WHERE world_id = ?').get(wid).m;
    const [title, difficulty, generators, boss, active] = structure(body);
    const r = db.prepare('INSERT INTO game_levels(world_id, level_no, title, difficulty, generators, num_questions, pass_percent, time_limit_sec, bonus_points, is_boss, active) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(wid, body.level_no ? int(body.level_no, 'No. tahap', { min: 1, max: 99 }) : last + 1, title, difficulty, generators, int(body.num_questions ?? 10, 'Bilangan soalan', { min: 3, max: 30 }), int(body.pass_percent ?? 70, 'Peratus lulus', { min: 40, max: 100 }),
        body.time_limit_sec === '' || body.time_limit_sec == null ? null : int(body.time_limit_sec, 'Had masa', { min: 5, max: 600 }), body.bonus_points === '' || body.bonus_points == null ? null : int(body.bonus_points, 'Mata bonus', { min: 0, max: 5000 }), boss, active);
    audit(db, user, 'level.create', Number(r.lastInsertRowid));
    return { id: Number(r.lastInsertRowid) };
  });
  // struktur tahap (kongsi): pentadbir platform sahaja
  router.put('/api/admin/levels/:id', P, ({ db, user, params, body }) => {
    const [title, difficulty, generators, boss, active] = structure(body);
    const r = db.prepare('UPDATE game_levels SET level_no=?, title=?, difficulty=?, generators=?, is_boss=?, active=? WHERE id=?')
      .run(int(body.level_no, 'No. tahap', { min: 1, max: 99 }), title, difficulty, generators, boss, active, id(params.id));
    if (!r.changes) throw new AppError(404, 'Tahap tidak dijumpai.');
    audit(db, user, 'level.update', params.id);
    return { ok: true };
  });
  // tetapan sekolah sendiri: peratus lulus, bilangan soalan, had masa, mata bonus (semua pentadbir)
  router.put('/api/admin/levels/:id/settings', A, ({ db, user, params, body }) => {
    upsertLevelSettings(db, user.school_id, id(params.id), body);
    audit(db, user, 'level.settings', params.id, { pass_percent: body.pass_percent, num_questions: body.num_questions, time_limit_sec: body.time_limit_sec, bonus_points: body.bonus_points });
    return { ok: true };
  });
  router.delete('/api/admin/levels/:id', P, ({ db, user, params }) => {
    const used = db.prepare('SELECT COUNT(*) c FROM student_progress WHERE level_id = ?').get(id(params.id)).c;
    if (used) { db.prepare('UPDATE game_levels SET active = 0 WHERE id = ?').run(id(params.id)); audit(db, user, 'level.deactivate', params.id); return { deleted: false, deactivated: true }; }
    db.prepare('DELETE FROM game_levels WHERE id = ?').run(id(params.id));
    audit(db, user, 'level.delete', params.id);
    return { deleted: true };
  });

  /* ---------------------------------------------------------- rewards & redemptions */
  router.get('/api/admin/rewards', A, ({ db, user }) => ({
    rewards: db.prepare(`SELECT c.*, i.stock, i.reserved, (i.stock - i.reserved) AS available FROM reward_catalog c JOIN reward_inventory i ON i.reward_id = c.id WHERE c.school_id = ? ORDER BY c.points_cost`).all(user.school_id)
      .map((r) => ({ ...r, image: r.image_path ? `/uploads/${r.image_path}` : null })),
  }));
  router.post('/api/admin/rewards', A, ({ db, user, body }) => ({ id: saveReward(db, user, body) }));
  router.put('/api/admin/rewards/:id', A, ({ db, user, params, body }) => ({ id: saveReward(db, user, body, id(params.id)) }));
  router.delete('/api/admin/rewards/:id', A, ({ db, user, params }) => deleteReward(db, user, id(params.id)));
  router.post('/api/admin/rewards/:id/image', A, ({ db, user, params, body }) => saveRewardImage(db, user, id(params.id), body.data));
  router.put('/api/admin/rewards/:id/stock', A, ({ db, user, params, body }) => {
    if (!db.prepare('SELECT 1 FROM reward_catalog WHERE id = ? AND school_id = ?').get(id(params.id), user.school_id)) throw new AppError(404, 'Hadiah tidak dijumpai.');
    return setStock(db, user, id(params.id), body.stock);
  });

  router.get('/api/admin/redemptions', A, ({ db, user, query }) => {
    const where = ['u.school_id = ?'];
    const args = [user.school_id];
    if (query.status) { where.push('d.status = ?'); args.push(String(query.status)); }
    const rows = db.prepare(`SELECT d.id, d.reference_no, d.status, d.points_spent, d.note, d.created_at, d.updated_at, u.username, u.display_name, c.name AS class_name, r.name AS reward_name, r.emoji
      FROM reward_redemptions d JOIN users u ON u.id = d.student_id JOIN students s ON s.user_id = u.id LEFT JOIN classes c ON c.id = s.class_id JOIN reward_catalog r ON r.id = d.reward_id
      WHERE ${where.join(' AND ')} ORDER BY CASE d.status WHEN 'menunggu' THEN 0 WHEN 'diluluskan' THEN 1 WHEN 'sedia' THEN 2 ELSE 3 END, d.id DESC LIMIT 300`).all(...args);
    return { redemptions: rows.map((r) => ({ ...r, status_label: STATUS_LABEL[r.status] })) };
  });
  router.post('/api/admin/redemptions/:id/:action', A, ({ db, user, params, body }) => {
    const own = db.prepare('SELECT 1 FROM reward_redemptions d JOIN users u ON u.id = d.student_id WHERE d.id = ? AND u.school_id = ?').get(id(params.id), user.school_id);
    if (!own) throw new AppError(404, 'Tebusan tidak dijumpai.');
    return transitionRedemption(db, user, id(params.id), params.action, body.note);
  });

  /* ---------------------------------------------------------- classes, teachers, students */
  router.get('/api/admin/classes', A, ({ db, user }) => ({ classes: classSummary(db, user.school_id) }));
  router.post('/api/admin/classes', A, ({ db, user, body }) => {
    const r = db.prepare('INSERT INTO classes(school_id, name, year) VALUES (?,?,?)').run(user.school_id, str(body.name, 'Nama kelas', { max: 30 }), int(body.year, 'Tahun', { min: 1, max: 6 }));
    audit(db, user, 'class.create', body.name);
    return { id: Number(r.lastInsertRowid) };
  });
  router.put('/api/admin/classes/:id', A, ({ db, user, params, body }) => {
    const r = db.prepare('UPDATE classes SET name = ?, year = ? WHERE id = ? AND school_id = ?').run(str(body.name, 'Nama kelas', { max: 30 }), int(body.year, 'Tahun', { min: 1, max: 6 }), id(params.id), user.school_id);
    if (!r.changes) throw new AppError(404, 'Kelas tidak dijumpai.');
    audit(db, user, 'class.update', params.id);
    return { ok: true };
  });
  router.delete('/api/admin/classes/:id', A, ({ db, user, params }) => {
    db.prepare('DELETE FROM classes WHERE id = ? AND school_id = ?').run(id(params.id), user.school_id);
    audit(db, user, 'class.delete', params.id);
    return { ok: true };
  });

  router.get('/api/admin/teachers', A, ({ db, user }) => ({
    teachers: db.prepare(`SELECT u.id, u.username, u.display_name, u.active FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.school_id = ? ORDER BY u.display_name`).all(user.school_id)
      .map((t) => ({ ...t, class_ids: db.prepare('SELECT class_id FROM teacher_classes WHERE teacher_id = ?').all(t.id).map((c) => c.class_id) })),
  }));
  const setTeacherClasses = (db, admin, tid, classIds) => {
    const ids = (Array.isArray(classIds) ? classIds : []).map((x) => id(x, 'Kelas'));
    db.prepare('DELETE FROM teacher_classes WHERE teacher_id = ?').run(tid);
    for (const c of ids) {
      if (!db.prepare('SELECT 1 FROM classes WHERE id = ? AND school_id = ?').get(c, admin.school_id)) throw new AppError(400, 'Kelas tidak sah.');
      db.prepare('INSERT INTO teacher_classes(teacher_id, class_id) VALUES (?,?)').run(tid, c);
    }
  };
  router.post('/api/admin/teachers', A, ({ db, user, body }) => tx(db, () => {
    const password = body.password || `${randomPassword()}A`;
    const uid = createUserAccount(db, user, { username: str(body.username, 'ID guru', { max: 30 }), password, role: 'guru', displayName: body.display_name, schoolId: user.school_id });
    db.prepare('INSERT INTO teachers(user_id) VALUES (?)').run(uid);
    setTeacherClasses(db, user, uid, body.class_ids);
    return { id: uid, temp_password: password };
  }));
  router.put('/api/admin/teachers/:id', A, ({ db, user, params, body }) => tx(db, () => {
    const tid = id(params.id);
    if (!db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'guru' AND school_id = ?").get(tid, user.school_id)) throw new AppError(404, 'Guru tidak dijumpai.');
    db.prepare('UPDATE users SET display_name = ?, active = ? WHERE id = ?').run(validateNickname(body.display_name), bool(body.active ?? 1), tid);
    setTeacherClasses(db, user, tid, body.class_ids);
    audit(db, user, 'teacher.update', tid);
    return { ok: true };
  }));

  router.get('/api/admin/students', A, ({ db, user, query }) => {
    const where = ["u.school_id = ?"];
    const args = [user.school_id];
    if (query.class_id) { where.push('s.class_id = ?'); args.push(id(query.class_id)); }
    if (query.q) { where.push('(u.username LIKE ? OR u.display_name LIKE ?)'); args.push(`%${String(query.q).slice(0, 30)}%`, `%${String(query.q).slice(0, 30)}%`); }
    return { students: db.prepare(`SELECT u.id, u.username, u.display_name, u.active, u.must_change_password, s.year, s.class_id, c.name AS class_name, s.points_balance, s.points_lifetime
      FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN classes c ON c.id = s.class_id WHERE ${where.join(' AND ')} ORDER BY c.name, u.display_name LIMIT 500`).all(...args) };
  });
  router.post('/api/admin/students', A, ({ db, user, body }) => createStudent(db, user, body));
  router.post('/api/admin/students/import', A, ({ db, user, body }) => importStudentsCsv(db, user, body.csv));
  router.put('/api/admin/students/:id', A, ({ db, user, params, body }) => tx(db, () => {
    const sid = id(params.id);
    if (!db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'murid' AND school_id = ?").get(sid, user.school_id)) throw new AppError(404, 'Murid tidak dijumpai.');
    const classId = body.class_id ? id(body.class_id, 'Kelas') : null;
    if (classId && !db.prepare('SELECT 1 FROM classes WHERE id = ? AND school_id = ?').get(classId, user.school_id)) throw new AppError(400, 'Kelas tidak sah.');
    db.prepare('UPDATE users SET display_name = ?, active = ? WHERE id = ?').run(validateNickname(body.display_name), bool(body.active ?? 1), sid);
    db.prepare('UPDATE students SET class_id = ?, year = ? WHERE user_id = ?').run(classId, int(body.year, 'Tahun', { min: 1, max: 6 }), sid);
    audit(db, user, 'student.update', sid);
    return { ok: true };
  }));
  router.delete('/api/admin/students/:id', A, ({ db, user, params }) => { deleteStudent(db, user, id(params.id)); return { ok: true }; });
  router.post('/api/admin/users/:id/reset-password', A, ({ db, user, params, body }) => {
    const target = db.prepare('SELECT id FROM users WHERE id = ? AND school_id = ?').get(id(params.id), user.school_id);
    if (!target) throw new AppError(404, 'Pengguna tidak dijumpai.');
    const pw = body.password || `${randomPassword()}A`;
    resetPassword(db, user, target.id, pw);
    return { temp_password: pw };
  });
  router.get('/api/admin/students/:id', A, ({ db, user, params }) => {
    const sid = id(params.id);
    const info = db.prepare(`SELECT u.id, u.username, u.display_name, u.active, s.year, s.class_id, s.points_balance, s.points_lifetime FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id = ? AND u.school_id = ?`).get(sid, user.school_id);
    if (!info) throw new AppError(404, 'Murid tidak dijumpai.');
    const levels = db.prepare(`SELECT w.name AS world, l.level_no, l.title, p.best_percent, p.stars, p.passed, p.attempts FROM student_progress p JOIN game_levels l ON l.id = p.level_id JOIN game_worlds w ON w.id = l.world_id WHERE p.student_id = ? ORDER BY w.sort_order, l.level_no`).all(sid);
    return { student: info, ledger: ledger(db, sid, 100), levels, topics: topicAccuracy(db, { studentId: sid, schoolId: user.school_id }) };
  });
  router.post('/api/admin/students/:id/adjust-points', A, ({ db, user, params, body }) => {
    const sid = id(params.id);
    if (!db.prepare('SELECT 1 FROM users WHERE id = ? AND school_id = ?').get(sid, user.school_id)) throw new AppError(404, 'Murid tidak dijumpai.');
    const r = adjustBalance(db, user, sid, int(body.delta, 'Jumlah pelarasan', { min: -100000, max: 100000 }), body.reason);
    audit(db, user, 'points.adjust', sid, { delta: body.delta, reason: body.reason });
    return r;
  });

  /* ---------------------------------------------------------- reports, audit, maintenance */
  router.get('/api/admin/reports/overview', A, ({ db, user }) => ({
    classes: classSummary(db, user.school_id), topics: topicAccuracy(db, { schoolId: user.school_id }), trends: trends(db, { schoolId: user.school_id }),
  }));
  router.get('/api/admin/reports/export', A, ({ db, user, query, raw }) => {
    const kind = oneOf(query.kind, 'Jenis laporan', ['students', 'redemptions', 'points', 'topics']);
    audit(db, user, 'report.export', kind);
    if (kind === 'students') {
      const h = ['id_murid', 'nama_paparan', 'kelas', 'tahun', 'mata_seumur_hidup', 'baki_mata', 'tahap_lulus', 'bintang', 'soalan_dijawab', 'ketepatan_peratus', 'aktiviti_terakhir'];
      return raw('text/csv; charset=utf-8', csv(studentRows(db, { schoolId: user.school_id }), h), 'prestasi-murid.csv');
    }
    if (kind === 'redemptions') {
      const h = ['rujukan', 'id_murid', 'nama_paparan', 'kelas', 'hadiah', 'mata', 'status', 'tarikh_mohon', 'tarikh_kemaskini', 'catatan'];
      return raw('text/csv; charset=utf-8', csv(redemptionRows(db, { schoolId: user.school_id }), h), 'tebusan-hadiah.csv');
    }
    if (kind === 'topics') return raw('text/csv; charset=utf-8', csv(topicAccuracy(db, { schoolId: user.school_id }), ['code', 'name', 'answered', 'correct', 'accuracy']), 'topik-sukar.csv');
    const rows = db.prepare(`SELECT p.tx_uid, u.username AS id_murid, p.type, p.balance_delta, p.lifetime_delta, p.balance_after, p.reason, p.created_at
      FROM point_transactions p JOIN users u ON u.id = p.student_id WHERE u.school_id = ? ORDER BY p.id DESC LIMIT 20000`).all(user.school_id);
    return raw('text/csv; charset=utf-8', csv(rows, ['tx_uid', 'id_murid', 'type', 'balance_delta', 'lifetime_delta', 'balance_after', 'reason', 'created_at']), 'lejar-mata.csv');
  });
  router.get('/api/admin/audit', A, ({ db, user }) => ({
    logs: db.prepare(`SELECT a.id, a.created_at, a.action, a.target, a.detail, a.role, u.username FROM administrator_audit_logs a JOIN users u ON u.id = a.user_id WHERE u.school_id = ? ORDER BY a.id DESC LIMIT 200`).all(user.school_id),
  }));
  router.post('/api/admin/purge', A, ({ db, user }) => purgeExpired(db, user.school_id, user));
}
