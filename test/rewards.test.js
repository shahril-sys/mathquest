import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { freshDb, uid, student, setBalance, startServer } from './helpers.js';
import * as rewards from '../src/services/rewards.js';
import { adjustBalance } from '../src/services/points.js';

const admin = (db) => db.prepare("SELECT id, role, school_id FROM users WHERE username = 'admin'").get();
const rewardId = (db, name) => db.prepare('SELECT id FROM reward_catalog WHERE name = ?').get(name).id;
const inv = (db, rid) => db.prepare('SELECT stock, reserved FROM reward_inventory WHERE reward_id = ?').get(rid);
const fail = (fn, re) => assert.throws(fn, re);

test('tebus hadiah: mata baki ditolak, mata seumur hidup kekal, stok ditempah, rujukan unik, status menunggu', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 1000);
  const rid = rewardId(db, 'Pensel');
  const r = rewards.redeem(db, sid, rid, randomUUID());
  assert.match(r.reference_no, /^MQ-\d{8}-[0-9A-F]{6}$/);
  assert.equal(r.status, 'menunggu');
  const st = student(db, 'M26006');
  assert.equal(st.points_balance, 700);
  assert.equal(st.points_lifetime, 1000);
  assert.equal(inv(db, rid).reserved, 1);
  const tx = db.prepare("SELECT * FROM point_transactions WHERE student_id = ? AND type = 'redeem'").get(sid);
  assert.equal(tx.balance_delta, -300);
  assert.equal(tx.lifetime_delta, 0);
});

test('tebus dua kali dengan ID permintaan sama (klik dua kali) hanya menolak mata sekali', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 1000);
  const rid = rewardId(db, 'Pensel');
  const req = randomUUID();
  const a = rewards.redeem(db, sid, rid, req);
  const b = rewards.redeem(db, sid, rid, req);
  assert.equal(a.id, b.id);
  assert.equal(b.duplicate, true);
  assert.equal(student(db, 'M26006').points_balance, 700);
  assert.equal(inv(db, rid).reserved, 1);
});

test('mata tidak mencukupi: ditolak dan tiada perubahan', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 299);
  const rid = rewardId(db, 'Pensel');
  fail(() => rewards.redeem(db, sid, rid, randomUUID()), /Kurang 1 mata/);
  assert.equal(student(db, 'M26006').points_balance, 299);
  assert.equal(inv(db, rid).reserved, 0);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM reward_redemptions').get().c, 0);
});

test('hadiah kehabisan stok: tebusan ditolak dan mata tidak ditolak', () => {
  const db = freshDb();
  const rid = rewardId(db, 'Pensel');
  db.prepare('UPDATE reward_inventory SET stock = 1 WHERE reward_id = ?').run(rid);
  const a = uid(db, 'M26006'); const b = uid(db, 'M26007');
  setBalance(db, a, 500); setBalance(db, b, 500);
  rewards.redeem(db, a, rid, randomUUID());
  fail(() => rewards.redeem(db, b, rid, randomUUID()), /Stok habis/);
  assert.equal(student(db, 'M26007').points_balance, 500);
});

test('kelayakan: tahun minimum dan had setiap murid', () => {
  const db = freshDb();
  const y1 = uid(db, 'M26001');
  setBalance(db, y1, 5000);
  fail(() => rewards.redeem(db, y1, rewardId(db, 'Hadiah Misteri Istimewa'), randomUUID()), /Tahun 3/);
  const y4 = uid(db, 'M26016');
  setBalance(db, y4, 5000);
  const cert = rewardId(db, 'Sijil Pencapaian'); // had 1 setiap murid
  rewards.redeem(db, y4, cert, randomUUID());
  fail(() => rewards.redeem(db, y4, cert, randomUUID()), /Had tebusan/);
});

test('tolak: mata dipulangkan penuh dan stok dilepaskan sekali sahaja (idempoten)', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 1000);
  const rid = rewardId(db, 'Pensel');
  const r = rewards.redeem(db, sid, rid, randomUUID());
  fail(() => rewards.transitionRedemption(db, admin(db), r.id, 'reject', ''), /sebab/);
  const out = rewards.transitionRedemption(db, admin(db), r.id, 'reject', 'Stok rosak');
  assert.equal(out.status, 'ditolak');
  assert.equal(student(db, 'M26006').points_balance, 1000);
  assert.equal(inv(db, rid).reserved, 0);
  fail(() => rewards.transitionRedemption(db, admin(db), r.id, 'reject', 'sekali lagi'), /tidak membenarkan/);
  fail(() => rewards.transitionRedemption(db, admin(db), r.id, 'cancel', 'sekali lagi'), /tidak membenarkan/);
  assert.equal(student(db, 'M26006').points_balance, 1000);
  assert.equal(db.prepare("SELECT COUNT(*) c FROM point_transactions WHERE type = 'refund' AND student_id = ?").get(sid).c, 1);
  assert.equal(student(db, 'M26006').points_lifetime, 1000);
});

test('batal oleh murid hanya semasa menunggu; murid lain tidak boleh membatalkan', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006'); const other = uid(db, 'M26007');
  setBalance(db, sid, 1000);
  const r = rewards.redeem(db, sid, rewardId(db, 'Pensel'), randomUUID());
  fail(() => rewards.transitionRedemption(db, { id: other, role: 'murid' }, r.id, 'cancel'), /hanya boleh membatalkan/);
  rewards.transitionRedemption(db, admin(db), r.id, 'approve');
  fail(() => rewards.transitionRedemption(db, { id: sid, role: 'murid' }, r.id, 'cancel'), /hanya boleh membatalkan/);
  const r2 = rewards.redeem(db, sid, rewardId(db, 'Pemadam'), randomUUID());
  const c = rewards.transitionRedemption(db, { id: sid, role: 'murid' }, r2.id, 'cancel');
  assert.equal(c.status, 'dibatalkan');
  assert.equal(student(db, 'M26006').points_balance, 1000 - 300);
});

test('kitaran penuh: lulus -> sedia dituntut -> telah dituntut menolak stok fizikal; guru/murid tidak boleh', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 1000);
  const rid = rewardId(db, 'Pensel');
  const before = inv(db, rid);
  const r = rewards.redeem(db, sid, rid, randomUUID());
  fail(() => rewards.transitionRedemption(db, admin(db), r.id, 'collect'), /tidak membenarkan/); // belum diluluskan
  assert.equal(rewards.transitionRedemption(db, admin(db), r.id, 'approve').status, 'diluluskan');
  assert.equal(rewards.transitionRedemption(db, admin(db), r.id, 'ready').status, 'sedia');
  fail(() => rewards.transitionRedemption(db, { id: uid(db, 'guru1'), role: 'guru' }, r.id, 'collect'), /Tidak dibenarkan/);
  assert.equal(rewards.transitionRedemption(db, admin(db), r.id, 'collect').status, 'dituntut');
  const after = inv(db, rid);
  assert.equal(after.stock, before.stock - 1);
  assert.equal(after.reserved, 0);
  assert.equal(student(db, 'M26006').points_balance, 700); // tiada tolakan kali kedua
  assert.ok(db.prepare("SELECT COUNT(*) c FROM administrator_audit_logs WHERE action LIKE 'redemption.%'").get().c >= 3);
});

test('pelarasan mata: perlu sebab, direkod, tidak boleh jadikan baki negatif, tidak ubah mata seumur hidup', () => {
  const db = freshDb();
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 100);
  fail(() => adjustBalance(db, admin(db), sid, 50, ''), /Sebab/);
  fail(() => adjustBalance(db, admin(db), sid, -500, 'pembetulan salah rekod'), /tidak mencukupi/);
  adjustBalance(db, admin(db), sid, -40, 'pembetulan salah rekod');
  const st = student(db, 'M26006');
  assert.equal(st.points_balance, 60);
  assert.equal(st.points_lifetime, 100);
  assert.throws(() => db.prepare('UPDATE students SET points_balance = -1 WHERE user_id = ?').run(sid), /CHECK/);
});

test('tebusan serentak (HTTP): stok 1 dan 6 murid -> tepat satu berjaya', async () => {
  const db = freshDb();
  const rid = rewardId(db, 'Pensel');
  db.prepare('UPDATE reward_inventory SET stock = 1 WHERE reward_id = ?').run(rid);
  const names = ['M26006', 'M26007', 'M26008', 'M26009', 'M26010', 'M26011'];
  names.forEach((n) => setBalance(db, uid(db, n), 500));
  const srv = await startServer(db);
  try {
    const clients = await Promise.all(names.map(async (n) => { const c = srv.client(); await c.login(n); return c; }));
    const res = await Promise.all(clients.map((c) => c.call('POST', `/api/rewards/${rid}/redeem`, { request_id: randomUUID() })));
    assert.equal(res.filter((r) => r.status === 200).length, 1);
    assert.equal(res.filter((r) => r.status === 409).length, 5);
    assert.equal(inv(db, rid).reserved, 1);
    const total = names.reduce((s, n) => s + student(db, n).points_balance, 0);
    assert.equal(total, 6 * 500 - 300);
  } finally { await srv.close(); }
});

test('tebusan serentak (HTTP): satu murid, baki untuk satu hadiah, 5 permintaan -> mata tidak negatif', async () => {
  const db = freshDb();
  const rid = rewardId(db, 'Pensel');
  const sid = uid(db, 'M26006');
  setBalance(db, sid, 350);
  const srv = await startServer(db);
  try {
    const c = srv.client(); await c.login('M26006');
    const res = await Promise.all(Array.from({ length: 5 }, () => c.call('POST', `/api/rewards/${rid}/redeem`, { request_id: randomUUID() })));
    assert.equal(res.filter((r) => r.status === 200).length, 1);
    assert.equal(student(db, 'M26006').points_balance, 50);
    assert.equal(inv(db, rid).reserved, 1);
  } finally { await srv.close(); }
});

test('kebenaran: akses tanpa log masuk, murid, guru dan pentadbir; CSRF; kunci akaun', async () => {
  const db = freshDb();
  const srv = await startServer(db);
  try {
    const anon = srv.client();
    assert.equal((await anon.call('GET', '/api/admin/dashboard')).status, 401);
    assert.equal((await anon.call('GET', '/api/student/home')).status, 401);

    const kid = srv.client(); await kid.login('M26006');
    for (const [m, p] of [['GET', '/api/admin/dashboard'], ['GET', '/api/admin/students'], ['POST', '/api/admin/redemptions/1/approve'], ['GET', '/api/teacher/overview'], ['PUT', '/api/admin/settings'], ['POST', '/api/admin/students/1/adjust-points']]) {
      assert.equal((await kid.call(m, p, m === 'GET' ? undefined : {})).status, 403, `${m} ${p}`);
    }
    const t = srv.client(); await t.login('guru1');
    for (const [m, p] of [['GET', '/api/admin/dashboard'], ['POST', '/api/admin/questions'], ['POST', '/api/admin/redemptions/1/approve'], ['POST', '/api/admin/students/import'], ['GET', '/api/student/home']]) {
      assert.equal((await t.call(m, p, m === 'GET' ? undefined : {})).status, 403, `${m} ${p}`);
    }
    // guru hanya melihat murid kelas sendiri (guru1: Tahun 1-3; M26016 = Tahun 4)
    const own = uid(db, 'M26006'); const foreign = uid(db, 'M26016');
    assert.equal((await t.call('GET', `/api/teacher/students/${own}`)).status, 200);
    assert.equal((await t.call('GET', `/api/teacher/students/${foreign}`)).status, 403);
    const list = (await t.call('GET', '/api/teacher/students')).json.students;
    assert.equal(list.length, 15);

    const ad = srv.client(); await ad.login('admin');
    assert.equal((await ad.call('GET', '/api/admin/dashboard')).status, 200);
    assert.equal((await ad.call('GET', '/api/admin/dashboard')).json.students, 30);

    // CSRF: tanpa pengepala permintaan sama-asal ditolak
    const raw = await fetch(srv.base + '/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'x=1' }, body: '{}' });
    assert.equal(raw.status, 403);
    assert.equal((await fetch(srv.base + '/api/auth/me')).status, 200);

    // pelarasan mata melalui API perlu sebab
    const sid = uid(db, 'M26006');
    assert.equal((await ad.call('POST', `/api/admin/students/${sid}/adjust-points`, { delta: 10, reason: '' })).status, 400);
    assert.equal((await ad.call('POST', `/api/admin/students/${sid}/adjust-points`, { delta: 10, reason: 'Hadiah penyertaan pertandingan' })).status, 200);
    assert.equal((await ad.call('GET', '/api/admin/audit')).json.logs.some((l) => l.action === 'points.adjust'), true);

    // kunci akaun selepas 5 percubaan salah
    const bad = srv.client();
    for (let i = 0; i < 5; i++) assert.equal((await bad.login('M26009', 'salah')).status, 401);
    assert.equal((await bad.login('M26009')).status, 429);
  } finally { await srv.close(); }
});

test('murid tidak boleh melihat data murid lain dan kata laluan tidak bocor', async () => {
  const db = freshDb();
  const srv = await startServer(db);
  try {
    const kid = srv.client(); await kid.login('M26006');
    const me = (await kid.call('GET', '/api/auth/me')).json;
    assert.ok(!/password_hash|scrypt/.test(JSON.stringify(me)));
    const lb = (await kid.call('GET', '/api/leaderboard?type=individual')).json;
    assert.ok(!JSON.stringify(lb).includes('M26'), 'ID murid tidak didedahkan pada papan pendahulu');
    const ad = srv.client(); await ad.login('admin');
    await ad.call('PUT', '/api/admin/settings', { leaderboard_public: 0 });
    assert.equal((await kid.call('GET', '/api/leaderboard?type=individual')).json.disabled, true);
  } finally { await srv.close(); }
});

test('muat naik imej hadiah: hanya imej sebenar dibenarkan', async () => {
  const db = freshDb();
  const srv = await startServer(db);
  try {
    const ad = srv.client(); await ad.login('admin');
    const rid = rewardId(db, 'Pensel');
    const evil = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
    assert.equal((await ad.call('POST', `/api/admin/rewards/${rid}/image`, { data: evil })).status, 400);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64');
    const ok = await ad.call('POST', `/api/admin/rewards/${rid}/image`, { data: png });
    assert.equal(ok.status, 200);
    const img = await fetch(srv.base + ok.json.image);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get('content-type'), 'image/png');
  } finally { await srv.close(); }
});

test('import CSV soalan: baris sah diimport, baris tidak sah dilaporkan', async () => {
  const db = freshDb();
  const srv = await startServer(db);
  try {
    const ad = srv.client(); await ad.login('admin');
    const csv = 'tahun,topik,kesukaran,jenis,soalan,jawapan,pilihan1,pilihan2,pilihan3,pilihan4,penjelasan\n'
      + '1,tambah_tolak,mudah,numeric,"2 + 3 = ?",5,,,,,"2 tambah 3 ialah 5."\n'
      + '1,tambah_tolak,mudah,mcq,"Berapakah 4 + 4?",8,6,7,8,9,"4 tambah 4 ialah 8."\n'
      + '9,tambah_tolak,mudah,numeric,"Tahun salah",5,,,,,"x x x x x"\n';
    const before = db.prepare('SELECT COUNT(*) c FROM questions').get().c;
    const r = (await ad.call('POST', '/api/admin/questions/import', { csv })).json;
    assert.equal(r.imported, 2);
    assert.equal(r.error_count, 1);
    assert.equal(r.errors[0].row, 4);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM questions').get().c, before + 2);
  } finally { await srv.close(); }
});
