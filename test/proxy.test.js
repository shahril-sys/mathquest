import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { freshDb } from './helpers.js';
import { createApp, clientIp } from '../src/app.js';

test('clientIp: tanpa proksi dipercayai, X-Forwarded-For diabaikan (tidak boleh dipalsukan)', () => {
  const req = (xff) => ({ socket: { remoteAddress: '10.0.0.9' }, headers: xff ? { 'x-forwarded-for': xff } : {} });
  assert.equal(clientIp(req('1.2.3.4'), 0), '10.0.0.9');
  assert.equal(clientIp(req('6.6.6.6, 1.2.3.4'), 1), '1.2.3.4', 'ambil entri dari kanan, bukan entri kiri yang dipalsukan');
  assert.equal(clientIp(req('6.6.6.6, 1.2.3.4, 10.1.1.1'), 2), '1.2.3.4');
  assert.equal(clientIp(req(undefined), 1), '10.0.0.9', 'tiada pengepala: guna sambungan langsung');
  assert.equal(clientIp(req('1.2.3.4'), 3), '10.0.0.9', 'rantai lebih pendek daripada jangkaan: guna sambungan langsung');
});

async function loginAttempts(trustProxy, headersFor) {
  const db = freshDb();
  const server = http.createServer(createApp(db, { rateLimit: true, trustProxy }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const codes = [];
  try {
    for (let i = 0; i < 40; i++) {
      const r = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'mathquest', ...headersFor(i) }, body: JSON.stringify({ username: `tiada${i}`, password: 'salah-salah' }) });
      codes.push(r.status);
    }
  } finally { await new Promise((r) => server.close(r)); }
  return codes;
}

test('had kadar log masuk: pengguna berbeza di belakang proksi tidak menyekat satu sama lain', async () => {
  const distinct = await loginAttempts(1, (i) => ({ 'X-Forwarded-For': `203.0.113.${i + 1}` }));
  assert.equal(distinct.filter((c) => c === 429).length, 0, 'setiap IP klien mempunyai kuota sendiri');
  const same = await loginAttempts(1, () => ({ 'X-Forwarded-For': '203.0.113.7' }));
  assert.ok(same.filter((c) => c === 429).length > 0, 'IP yang sama tetap dihadkan');
});

test('had kadar: klien tidak boleh memintas dengan memalsukan X-Forwarded-For apabila tiada proksi dipercayai', async () => {
  const spoof = await loginAttempts(0, (i) => ({ 'X-Forwarded-For': `198.51.100.${i + 1}` }));
  assert.ok(spoof.filter((c) => c === 429).length > 0);
});
