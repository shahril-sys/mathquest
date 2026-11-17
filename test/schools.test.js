import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { freshDb, uid, levelId, startServer, playLevel, setBalance } from './helpers.js';
import * as game from '../src/services/game.js';

/** Dua sekolah: sekolah 1 (demo, admin = pentadbir platform) dan sekolah baharu "SKB" dengan pentadbirnya sendiri. */
async function twoSchools() {
  const db = freshDb();
  const srv = await startServer(db);
  const platform = srv.client(); await platform.login('admin');
  const created = await platform.call('POST', '/api/platform/schools', { name: 'SK Baharu Bestari', code: 'skb01', admin_username: 'SKB01-admin', admin_display_name: 'Pentadbir SKB' });
  assert.equal(created.status, 200, JSON.stringify(created.json));
  const adminB = srv.client();
  assert.equal((await adminB.login('SKB01-admin', created.json.admin.temp_password)).status, 200);
  assert.equal((await adminB.call('POST', '/api/auth/change-password', { old_password: created.json.admin.temp_password, new_password: 'KataBaharu123' })).status, 200);
  const adminB2 = srv.client(); await adminB2.login('SKB01-admin', 'KataBaharu123');
  return { db, srv, platform, adminB: adminB2, school: created.json.school };
}

test('pendaftaran sekolah: hanya pentadbir platform; kod dan ID pentadbir mesti unik; kod dinormalkan', async () => {
  const { db, srv, platform, adminB } = await twoSchools();
  try {
    assert.equal(db.prepare("SELECT code FROM schools WHERE name = 'SK Baharu Bestari'").get().code, 'SKB01');
    assert.equal((await adminB.call('GET', '/api/platform/schools')).status, 403); // pentadbir sekolah biasa
    assert.equal((await adminB.call('POST', '/api/platform/schools', { name: 'Lain', code: 'LAIN01', admin_username: 'lain-admin', admin_display_name: 'Lain' })).status, 403);
    const t = srv.client(); await t.login('guru1');
    assert.equal((await t.call('GET', '/api/platform/schools')).status, 403);
    const kid = srv.client(); await kid.login('M26006');
    assert.equal((await kid.call('GET', '/api/platform/schools')).status, 403);
    assert.equal((await srv.client().call('GET', '/api/platform/schools')).status, 401);
    const dupCode = await platform.call('POST', '/api/platform/schools', { name: 'Salinan', code: 'SKB01', admin_username: 'x-admin', admin_display_name: 'Xx' });
    assert.equal(dupCode.status, 409);
    const dupUser = await platform.call('POST', '/api/platform/schools', { name: 'Salinan Dua', code: 'SKB02', admin_username: 'SKB01-admin', admin_display_name: 'Xx' });
    assert.equal(dupUser.status, 409);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM schools WHERE code = 'SKB02'").get().c, 0, 'transaksi dibatalkan');
    assert.equal((await platform.call('POST', '/api/platform/schools', { name: 'Kod Salah', code: 'a b!', admin_username: 'kk-admin', admin_display_name: 'Kk' })).status, 400);
    const list = (await platform.call('GET', '/api/platform/schools')).json.schools;
    assert.deepEqual(list.map((s) => s.code), ['DEMO001', 'SKB01']);
    assert.equal(list[1].admins, 1);
  } finally { await srv.close(); }
});

test('pengasingan: pentadbir sekolah B tidak boleh melihat atau mengubah data sekolah A', async () => {
  const { db, srv, platform, adminB } = await twoSchools();
  try {
    const sA = uid(db, 'M26006');
    const rewardA = db.prepare("SELECT id FROM reward_catalog WHERE name = 'Pensel'").get().id;
    const classA = db.prepare('SELECT id FROM classes LIMIT 1').get().id;
    const teacherA = uid(db, 'guru1');
    setBalance(db, sA, 1000);
    const nameA = db.prepare('SELECT display_name FROM users WHERE id = ?').get(sA).display_name;
    const { default: _unused } = { default: null }; void _unused;
    const redA = (await (async () => { const c = srv.client(); await c.login('M26006'); return c.call('POST', `/api/rewards/${rewardA}/redeem`, { request_id: randomUUID() }); })()).json;

    // senarai milik sendiri sahaja
    assert.equal((await adminB.call('GET', '/api/admin/students')).json.students.length, 0);
    assert.equal((await adminB.call('GET', '/api/admin/rewards')).json.rewards.length, 0);
    assert.equal((await adminB.call('GET', '/api/admin/redemptions')).json.redemptions.length, 0);
    assert.equal((await adminB.call('GET', '/api/admin/classes')).json.classes.length, 0);
    assert.equal((await adminB.call('GET', '/api/admin/teachers')).json.teachers.length, 0);
    assert.equal((await adminB.call('GET', '/api/admin/dashboard')).json.students, 0);
    assert.equal((await adminB.call('GET', '/api/admin/dashboard')).json.points_awarded, 0);
    for (const kind of ['students', 'redemptions', 'points']) {
      const csv = (await adminB.call('GET', `/api/admin/reports/export?kind=${kind}`)).text;
      assert.ok(!csv.includes('M26'), `eksport ${kind} tidak mengandungi murid sekolah A`);
    }

    // akses terus melalui ID sekolah A ditolak
    const probes = [
      ['GET', `/api/admin/students/${sA}`], ['PUT', `/api/admin/students/${sA}`, { display_name: 'Dirampas', year: 1 }], ['DELETE', `/api/admin/students/${sA}`, {}],
      ['POST', `/api/admin/students/${sA}/adjust-points`, { delta: 999, reason: 'cubaan merentas sekolah' }], ['POST', `/api/admin/users/${sA}/reset-password`, {}],
      ['POST', `/api/admin/redemptions/${redA.id}/approve`, {}], ['POST', `/api/admin/redemptions/${redA.id}/reject`, { note: 'x' }],
      ['PUT', `/api/admin/rewards/${rewardA}/stock`, { stock: 0 }], ['PUT', `/api/admin/rewards/${rewardA}`, { name: 'Dirampas', points_cost: 1, stock: 1 }],
      ['DELETE', `/api/admin/rewards/${rewardA}`, {}], ['POST', `/api/admin/rewards/${rewardA}/image`, { data: 'AAAA' }],
      ['PUT', `/api/admin/classes/${classA}`, { name: 'Dirampas', year: 1 }], ['PUT', `/api/admin/teachers/${teacherA}`, { display_name: 'Dirampas', class_ids: [] }],
      ['POST', `/api/admin/users/${teacherA}/reset-password`, {}],
    ];
    for (const [m, p, b] of probes) assert.equal((await adminB.call(m, p, b)).status, 404, `${m} ${p}`);

    // tiada perubahan berlaku pada sekolah A
    assert.equal(db.prepare('SELECT points_balance FROM students WHERE user_id = ?').get(sA).points_balance, 700);
    assert.equal(db.prepare('SELECT display_name FROM users WHERE id = ?').get(sA).display_name, nameA);
    assert.equal(db.prepare('SELECT status FROM reward_redemptions WHERE id = ?').get(redA.id).status, 'menunggu');
    assert.equal(db.prepare('SELECT name FROM reward_catalog WHERE id = ?').get(rewardA).name, 'Pensel');

    // murid tidak boleh tebus hadiah sekolah lain dan sebaliknya
    assert.equal((await adminB.call('POST', '/api/admin/redemptions/1/approve', {})).status, 404);

    // log audit hanya sekolah sendiri
    await platform.call('POST', `/api/admin/students/${sA}/adjust-points`, { delta: 5, reason: 'pelarasan sekolah A sahaja' });
    const logsB = (await adminB.call('GET', '/api/admin/audit')).json.logs;
    assert.ok(logsB.every((l) => l.username === 'SKB01-admin'), 'log audit B tiada entri A');
    assert.ok((await platform.call('GET', '/api/admin/audit')).json.logs.some((l) => l.action === 'points.adjust'));
  } finally { await srv.close(); }
});

test('data sekolah B dipisahkan: murid, hadiah, papan pendahulu dan kebenaran guru', async () => {
  const { db, srv, adminB } = await twoSchools();
  try {
    const cls = (await adminB.call('POST', '/api/admin/classes', { name: '3 Bestari', year: 3 })).json.id;
    const stu = (await adminB.call('POST', '/api/admin/students', { username: 'SKB01-M001', display_name: 'Anak Bestari', year: 3, class_id: cls })).json;
    assert.ok(stu.temp_password);
    const reward = (await adminB.call('POST', '/api/admin/rewards', { name: 'Pensel B', points_cost: 100, stock: 3, min_year: 1 })).json.id;
    const teacher = (await adminB.call('POST', '/api/admin/teachers', { username: 'SKB01-guru', display_name: 'Cikgu Bestari', class_ids: [cls] })).json;
    // pentadbir B tidak boleh menetapkan kelas sekolah A kepada gurunya
    const classA = db.prepare('SELECT id FROM classes WHERE school_id = 1 LIMIT 1').get().id;
    assert.equal((await adminB.call('POST', '/api/admin/teachers', { username: 'SKB01-guru2', display_name: 'Cikgu Dua', class_ids: [classA] })).status, 400);
    assert.equal((await adminB.call('POST', '/api/admin/students', { username: 'SKB01-M009', display_name: 'Salah Kelas', year: 3, class_id: classA })).status, 400);

    // murid B bermain dunia kongsi, mata hanya dalam sekolah B
    const r = playLevel(db, 'SKB01-M001', levelId(db, 'dunia_nombor', 1), 10, 3);
    assert.equal(r.passed, true);
    const kidB = srv.client();
    const me = await kidB.login('SKB01-M001', stu.temp_password);
    assert.equal(me.json.user.must_change_password, 1);
    assert.equal((await kidB.call('POST', '/api/auth/setup', { old_password: stu.temp_password, new_password: 'RahsiaBaru99', nickname: 'Anak Bestari', avatar: 'owl' })).status, 200);
    const lb = (await kidB.call('GET', '/api/leaderboard?type=individual')).json;
    assert.deepEqual(lb.rows.map((x) => x.label), ['Anak Bestari']); // tiada murid sekolah A
    assert.deepEqual((await kidB.call('GET', '/api/leaderboard?type=class')).json.rows.map((x) => x.label), ['3 Bestari']);
    const shop = (await kidB.call('GET', '/api/rewards')).json;
    assert.deepEqual(shop.rewards.map((x) => x.name), ['Pensel B']);
    assert.equal((await kidB.call('POST', `/api/rewards/${db.prepare("SELECT id FROM reward_catalog WHERE name = 'Pensel'").get().id}/redeem`, { request_id: randomUUID() })).status, 404);

    // guru B hanya melihat murid B
    const tB = srv.client(); await tB.login('SKB01-guru', teacher.temp_password);
    await tB.call('POST', '/api/auth/change-password', { old_password: teacher.temp_password, new_password: 'GuruBaru12345' });
    const tB2 = srv.client(); await tB2.login('SKB01-guru', 'GuruBaru12345');
    assert.deepEqual((await tB2.call('GET', '/api/teacher/students')).json.students.map((s) => s.id_murid), ['SKB01-M001']);
    assert.equal((await tB2.call('GET', `/api/teacher/students/${uid(db, 'M26006')}`)).status, 403);

    // dashboard sekolah B mengira sendiri
    const dash = (await adminB.call('GET', '/api/admin/dashboard')).json;
    assert.equal(dash.students, 1);
    assert.equal(dash.points_awarded, 250);
    assert.equal(dash.settings.school_name, 'SK Baharu Bestari');
    assert.ok(reward);
  } finally { await srv.close(); }
});

test('tetapan tahap setiap sekolah: pass mark B tidak menjejaskan sekolah A; struktur kongsi hanya pentadbir platform', async () => {
  const { db, srv, platform, adminB } = await twoSchools();
  try {
    const lvl = levelId(db, 'pulau_tambah_tolak', 1);
    const base = { title: 'Dirampas', difficulty: 'sukar', generators: ['add'], level_no: 1 };
    // struktur kongsi ditolak untuk pentadbir sekolah biasa
    assert.equal((await adminB.call('PUT', `/api/admin/levels/${lvl}`, base)).status, 403);
    assert.equal((await adminB.call('POST', `/api/admin/worlds/${db.prepare('SELECT id FROM game_worlds LIMIT 1').get().id}/levels`, base)).status, 403);
    assert.equal((await adminB.call('DELETE', `/api/admin/levels/${lvl}`, {})).status, 403);
    assert.equal((await adminB.call('PUT', '/api/admin/worlds/1', { name: 'Dirampas', min_year: 1, active: 1 })).status, 403);
    assert.equal(db.prepare('SELECT title FROM game_levels WHERE id = ?').get(lvl).title, 'Tambah Asas');

    // tetapan sekolah B
    const set = await adminB.call('PUT', `/api/admin/levels/${lvl}/settings`, { pass_percent: 90, num_questions: 5, time_limit_sec: 20, bonus_points: 7 });
    assert.equal(set.status, 200);
    assert.equal((await adminB.call('PUT', `/api/admin/levels/${lvl}/settings`, { pass_percent: 10, num_questions: 5 })).status, 400);
    assert.equal((await adminB.call('PUT', `/api/admin/levels/${lvl}/settings`, { pass_percent: 80, num_questions: 99 })).status, 400);

    await adminB.call('POST', '/api/admin/students', { username: 'SKB01-M002', display_name: 'Murid Dua', year: 1 });
    const stuB = uid(db, 'SKB01-M002'); const stuA = uid(db, 'M26001');
    const lvB = game.listWorlds(db, stuB).find((w) => w.code === 'pulau_tambah_tolak').levels[0];
    const lvA = game.listWorlds(db, stuA).find((w) => w.code === 'pulau_tambah_tolak').levels[0];
    assert.deepEqual([lvB.pass_percent, lvB.num_questions, lvB.time_limit_sec], [90, 5, 20]);
    assert.deepEqual([lvA.pass_percent, lvA.num_questions, lvA.time_limit_sec], [70, 10, null]);
    // sesi bermain menggunakan nilai sekolah masing-masing
    assert.equal(game.startLevel(db, stuB, lvl).total, 5);
    assert.equal(game.startLevel(db, stuA, lvl).total, 10);
    const rB = playLevel(db, 'SKB01-M002', lvl, 5, 8);
    assert.equal(rB.pass_percent, 90);
    assert.equal(rB.awards.find((a) => a.type === 'level_complete').points, 7);
    assert.equal(rB.awards.find((a) => a.type === 'perfect_score').points, 100);

    // pentadbir platform melihat nilai lalai sendiri
    const worldsA = (await platform.call('GET', '/api/admin/worlds')).json;
    assert.equal(worldsA.can_edit_structure, true);
    assert.equal(worldsA.worlds.find((w) => w.code === 'pulau_tambah_tolak').levels[0].pass_percent, 70);
    assert.equal((await adminB.call('GET', '/api/admin/worlds')).json.worlds.find((w) => w.code === 'pulau_tambah_tolak').levels[0].pass_percent, 90);
    assert.equal((await adminB.call('GET', '/api/admin/worlds')).json.can_edit_structure, false);
    // pentadbir platform boleh mengubah struktur kongsi
    assert.equal((await platform.call('PUT', `/api/admin/levels/${lvl}`, { ...base, title: 'Tambah Asas Baharu', difficulty: 'mudah', generators: ['add'] })).status, 200);
    assert.equal(db.prepare('SELECT title FROM game_levels WHERE id = ?').get(lvl).title, 'Tambah Asas Baharu');
  } finally { await srv.close(); }
});

test('guru sekolah B mengubah pass mark hanya untuk sekolah B', async () => {
  const { db, srv, adminB } = await twoSchools();
  try {
    const cls = (await adminB.call('POST', '/api/admin/classes', { name: '2 B', year: 2 })).json.id;
    const t = (await adminB.call('POST', '/api/admin/teachers', { username: 'SKB01-g', display_name: 'Guru B', class_ids: [cls] })).json;
    const tc = srv.client(); await tc.login('SKB01-g', t.temp_password);
    await tc.call('POST', '/api/auth/change-password', { old_password: t.temp_password, new_password: 'GuruBaru12345' });
    const tb = srv.client(); await tb.login('SKB01-g', 'GuruBaru12345');
    const lvl = levelId(db, 'pulau_tambah_tolak', 2);
    assert.equal((await tb.call('PATCH', `/api/teacher/levels/${lvl}`, { pass_percent: 85 })).status, 200);
    assert.equal(db.prepare('SELECT pass_percent FROM game_levels WHERE id = ?').get(lvl).pass_percent, 70, 'nilai kongsi tidak berubah');
    assert.equal(db.prepare('SELECT pass_percent FROM school_level_settings WHERE level_id = ?').get(lvl).pass_percent, 85);
    assert.equal((await tb.call('GET', '/api/teacher/levels')).json.levels.find((l) => l.id === lvl).pass_percent, 85);
    const ta = srv.client(); await ta.login('guru1');
    assert.equal((await ta.call('GET', '/api/teacher/levels')).json.levels.find((l) => l.id === lvl).pass_percent, 70);
  } finally { await srv.close(); }
});

test('soalan: bank kongsi hanya diubah pentadbir platform; soalan sekolah B milik B sahaja', async () => {
  const { db, srv, platform, adminB } = await twoSchools();
  try {
    const shared = db.prepare('SELECT id FROM questions WHERE school_id IS NULL LIMIT 1').get().id;
    assert.equal((await adminB.call('GET', `/api/admin/questions/${shared}`)).status, 200);
    assert.equal((await adminB.call('PUT', `/api/admin/questions/${shared}`, { topic: 'tambah_tolak' })).status, 403);
    assert.equal((await adminB.call('DELETE', `/api/admin/questions/${shared}`, {})).status, 403);
    const q = { topic: 'tambah_tolak', year: 1, difficulty: 'mudah', qtype: 'numeric', text: 'Berapakah 1 + 1?', answer: '2', explanation: '1 tambah 1 ialah 2.' };
    const mine = (await adminB.call('POST', '/api/admin/questions', q)).json.id;
    assert.equal(db.prepare('SELECT school_id FROM questions WHERE id = ?').get(mine).school_id, db.prepare("SELECT id FROM schools WHERE code = 'SKB01'").get().id);
    assert.equal((await adminB.call('PUT', `/api/admin/questions/${mine}`, { ...q, text: 'Berapakah 1 + 1 kuantum?' })).status, 200);
    // pentadbir platform sekolah A tidak boleh mengubah soalan peribadi sekolah B, tetapi boleh mengubah bank kongsi
    assert.equal((await platform.call('PUT', `/api/admin/questions/${mine}`, q)).status, 403);
    assert.equal((await platform.call('GET', `/api/admin/questions/${mine}`)).status, 403);
    assert.equal((await platform.call('PUT', `/api/admin/questions/${shared}`, { ...(await platform.call('GET', `/api/admin/questions/${shared}`)).json, options: undefined })).status !== 403, true);
    // senarai soalan: B melihat kongsi + miliknya; A tidak melihat soalan B
    const listA = (await platform.call('GET', '/api/admin/questions?q=kuantum')).json;
    assert.equal(listA.total, 0);
    assert.equal((await adminB.call('GET', '/api/admin/questions?q=kuantum')).json.total, 1);
  } finally { await srv.close(); }
});

test('nyahaktif sekolah: pengguna dilog keluar serta-merta, tidak boleh log masuk; boleh diaktifkan semula', async () => {
  const { db, srv, platform, adminB, school } = await twoSchools();
  try {
    assert.equal((await adminB.call('GET', '/api/admin/dashboard')).status, 200);
    assert.equal((await platform.call('PUT', '/api/platform/schools/1', { active: 0 })).status, 400, 'tidak boleh nyahaktif sekolah sendiri');
    assert.equal((await adminB.call('PUT', `/api/platform/schools/${school.id}`, { active: 0 })).status, 403);
    const off = await platform.call('PUT', `/api/platform/schools/${school.id}`, { active: 0 });
    assert.equal(off.status, 200);
    assert.equal(off.json.school.active, 0);
    assert.equal((await adminB.call('GET', '/api/admin/dashboard')).status, 401);
    const again = srv.client();
    const res = await again.login('SKB01-admin', 'KataBaharu123');
    assert.equal(res.status, 403);
    assert.equal(res.json.code, 'sekolah_tidak_aktif');
    // data kekal
    assert.equal(db.prepare('SELECT COUNT(*) c FROM users WHERE school_id = ?').get(school.id).c, 1);
    assert.equal((await platform.call('PUT', `/api/platform/schools/${school.id}`, { active: 1, name: 'SK Bestari Jaya' })).status, 200);
    assert.equal((await again.login('SKB01-admin', 'KataBaharu123')).status, 200);
    assert.equal((await again.call('GET', '/api/admin/dashboard')).json.settings.school_name, 'SK Bestari Jaya');
    // pentadbir tambahan
    const extra = await platform.call('POST', `/api/platform/schools/${school.id}/admins`, { username: 'SKB01-admin2', display_name: 'Pentadbir Dua' });
    assert.equal(extra.status, 200);
    assert.equal(db.prepare("SELECT school_id, is_platform_admin FROM users WHERE username = 'SKB01-admin2'").get().is_platform_admin, 0);
    assert.ok((await platform.call('GET', '/api/admin/audit')).json.logs.some((l) => l.action === 'school.deactivate'));
  } finally { await srv.close(); }
});
