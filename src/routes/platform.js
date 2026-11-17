import { AppError, tx, audit } from '../db.js';
import { id, str, bool } from '../lib/validate.js';
import { randomPassword } from '../lib/security.js';
import { createUserAccount } from '../auth.js';

const P = { roles: ['pentadbir'], platform: true };

function schoolRow(db, schoolId) {
  const s = db.prepare('SELECT id, name, code, active, created_at FROM schools WHERE id = ?').get(schoolId);
  if (!s) throw new AppError(404, 'Sekolah tidak dijumpai.');
  const n = (sql) => db.prepare(sql).get(schoolId).c;
  return {
    ...s,
    students: n("SELECT COUNT(*) c FROM users WHERE school_id = ? AND role = 'murid'"),
    teachers: n("SELECT COUNT(*) c FROM users WHERE school_id = ? AND role = 'guru'"),
    admins: n("SELECT COUNT(*) c FROM users WHERE school_id = ? AND role = 'pentadbir'"),
    pending: n("SELECT COUNT(*) c FROM reward_redemptions d JOIN users u ON u.id = d.student_id WHERE u.school_id = ? AND d.status = 'menunggu'"),
  };
}

export default function register(router) {
  router.get('/api/platform/schools', P, ({ db }) => ({
    schools: db.prepare('SELECT id FROM schools ORDER BY id').all().map((s) => schoolRow(db, s.id)),
  }));

  // Cipta sekolah baharu bersama pentadbir pertamanya. Dunia, tahap, topik dan bank soalan kongsi tersedia serta-merta;
  // hadiah, kelas, guru dan murid dikendalikan oleh pentadbir sekolah itu.
  router.post('/api/platform/schools', P, ({ db, user, body }) => {
    const name = str(body.name, 'Nama sekolah', { min: 3, max: 80 });
    const code = str(body.code, 'Kod sekolah', { min: 3, max: 12 }).toUpperCase();
    if (!/^[A-Z0-9]+$/.test(code)) throw new AppError(400, 'Kod sekolah hanya huruf besar dan nombor (3-12 aksara).');
    const adminName = str(body.admin_display_name, 'Nama pentadbir', { min: 2, max: 24 });
    const adminUser = str(body.admin_username, 'ID pentadbir', { min: 3, max: 30 });
    const password = `${randomPassword()}A`;
    return tx(db, () => {
      if (db.prepare('SELECT 1 FROM schools WHERE code = ?').get(code)) throw new AppError(409, 'Kod sekolah sudah digunakan.');
      const sid = Number(db.prepare('INSERT INTO schools(name, code) VALUES (?,?)').run(name, code).lastInsertRowid);
      const uid = createUserAccount(db, null, { username: adminUser, password, role: 'pentadbir', displayName: adminName, schoolId: sid });
      audit(db, user, 'school.create', code, { school_id: sid, admin: adminUser, admin_id: uid });
      return { school: schoolRow(db, sid), admin: { username: adminUser, temp_password: password } };
    });
  });

  router.put('/api/platform/schools/:id', P, ({ db, user, params, body }) => {
    const sid = id(params.id);
    const cur = db.prepare('SELECT * FROM schools WHERE id = ?').get(sid);
    if (!cur) throw new AppError(404, 'Sekolah tidak dijumpai.');
    const name = body.name == null ? cur.name : str(body.name, 'Nama sekolah', { min: 3, max: 80 });
    const active = body.active == null ? cur.active : bool(body.active);
    if (!active && sid === user.school_id) throw new AppError(400, 'Anda tidak boleh menyahaktifkan sekolah sendiri.');
    tx(db, () => {
      db.prepare('UPDATE schools SET name = ?, active = ? WHERE id = ?').run(name, active, sid);
      if (!active) db.prepare('DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM users WHERE school_id = ?)').run(sid); // log keluar semua pengguna
      audit(db, user, active ? 'school.update' : 'school.deactivate', cur.code, { name, active });
    });
    return { school: schoolRow(db, sid) };
  });

  router.post('/api/platform/schools/:id/admins', P, ({ db, user, params, body }) => {
    const sid = id(params.id);
    if (!db.prepare('SELECT 1 FROM schools WHERE id = ?').get(sid)) throw new AppError(404, 'Sekolah tidak dijumpai.');
    const password = `${randomPassword()}A`;
    const username = str(body.username, 'ID pentadbir', { min: 3, max: 30 });
    tx(db, () => {
      createUserAccount(db, null, { username, password, role: 'pentadbir', displayName: str(body.display_name, 'Nama pentadbir', { min: 2, max: 24 }), schoolId: sid });
      audit(db, user, 'school.add_admin', username, { school_id: sid });
    });
    return { username, temp_password: password };
  });
}
