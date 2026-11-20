import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (dir, ...args) => spawnSync('node', ['--disable-warning=ExperimentalWarning', 'scripts/create-admin.js', ...args], { cwd: root, env: { ...process.env, DATA_DIR: dir }, encoding: 'utf8' });

test('create-admin: pemasangan produksi pada pangkalan data kosong, log masuk berjaya, tiada data demo, hanya sekali', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-ca-'));
  try {
    const bad = run(dir, '--school', 'SK Ujian');
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /--code/);
    const ok = run(dir, '--school', 'SK Taman Bahagia', '--code', 'sktb01', '--user', 'SKTB01-admin', '--name', 'Pentadbir TB');
    assert.equal(ok.status, 0, ok.stderr);
    const pw = /Kata laluan sementara: (\S+)/.exec(ok.stdout)[1];
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path.join(dir, 'mathquest.db'));
    assert.equal(db.prepare('SELECT COUNT(*) c FROM users').get().c, 1);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM students').get().c, 0);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM game_levels').get().c, 100);
    assert.ok(db.prepare('SELECT COUNT(*) c FROM questions').get().c >= 100);
    assert.equal(db.prepare('SELECT code FROM schools').get().code, 'SKTB01');
    const u = db.prepare('SELECT is_platform_admin, must_change_password FROM users').get();
    assert.deepEqual({ ...u }, { is_platform_admin: 1, must_change_password: 1 });
    db.close();
    // log masuk sebenar dengan kata laluan sementara
    const { openDb, migrate } = await import('../src/db.js');
    const { createApp } = await import('../src/app.js');
    const http = await import('node:http');
    const d2 = openDb(path.join(dir, 'mathquest.db')); migrate(d2);
    const srv = http.createServer(createApp(d2, { rateLimit: false }));
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const res = await fetch(`http://127.0.0.1:${srv.address().port}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'mathquest' }, body: JSON.stringify({ username: 'SKTB01-admin', password: pw }) });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).user.must_change_password, 1);
    await new Promise((r) => srv.close(r)); d2.close();
    const again = run(dir, '--school', 'Lain', '--code', 'LAIN01', '--user', 'x-admin', '--name', 'Xx');
    assert.equal(again.status, 1);
    assert.match(again.stderr, /sudah mempunyai sekolah/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
