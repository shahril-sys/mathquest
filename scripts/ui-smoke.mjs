// End-to-end UI smoke test using a local headless Chrome via the DevTools protocol (no dependencies).
// Usage: node scripts/ui-smoke.mjs   (needs `chrome` on PATH and a seeded database)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from '../src/lib/security.js';

const PORT = 3111;
const BASE = `http://localhost:${PORT}`;
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
const finish = (code) => { procs.forEach((p) => p.kill('SIGKILL')); process.exit(code); };

const server = spawn('node', ['--disable-warning=ExperimentalWarning', 'src/server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'inherit' });
procs.push(server);
const chrome = spawn(process.env.CHROME || 'chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-breakpad', '--disable-dev-shm-usage', '--no-zygote', '--remote-debugging-port=9333', '--user-data-dir=/tmp/mq-chrome', '--window-size=1100,820', 'about:blank'], { stdio: 'ignore', env: { ...process.env, HOME: '/tmp/mq-home' } });
procs.push(chrome);

let tab;
for (let i = 0; i < 60 && !tab; i++) { await sleep(300); try { tab = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((t) => t.type === 'page'); } catch { /* retry */ } }
if (!tab) { console.error('Chrome tidak bermula'); finish(2); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let seq = 0; const pend = new Map(); const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errors.push(`EXC ${d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text}`);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(`CONSOLE ${d.params.args.map((a) => a.value || a.description).join(' ')}`);
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon|401|403|409/.test(d.params.entry.text + d.params.entry.url)) errors.push(`LOG ${d.params.entry.text} ${d.params.entry.url || ''}`);
};
const cdp = (method, params = {}) => new Promise((res) => { const id = ++seq; pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
for (const d of ['Page', 'Runtime', 'Log']) await cdp(`${d}.enable`);
const js = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error'); return r.result.result.value; };
const waitFor = async (sel, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(`!!document.querySelector(${JSON.stringify(sel)})`)) return; await sleep(100); } throw new Error(`Menunggu ${sel} tamat masa. Halaman: ${(await js('document.body.innerText')).slice(0, 1500)}`); };
const click = (sel) => js(`document.querySelector(${JSON.stringify(sel)}).click()`);
const setVal = (sel, v) => js(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const shot = async (name) => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}${name}.png`, Buffer.from(r.result.data, 'base64')); };
const go = async (hash, sel) => { await js(`location.hash=${JSON.stringify(hash)}`); await sleep(150); await waitFor(sel); };
const device = (w, h, mobile) => cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
const login = async (u) => { await js('fetch("/api/auth/logout",{method:"POST",headers:{"X-Requested-With":"mathquest","Content-Type":"application/json"},body:"{}"})'); await cdp('Page.navigate', { url: `${BASE}/` }); await waitFor('#username'); await setVal('#username', u); await setVal('#password', process.env.DEMO_PASSWORD || 'MathQuest#2026'); await click('button[type=submit]'); };

const results = [];
const step = async (name, fn) => { try { await fn(); results.push(['OK', name]); console.log('OK  ', name); } catch (e) { results.push(['GAGAL', name, e.message]); console.log('GAGAL', name, '-', e.message, '\n', e.stack?.split('\n').slice(1, 3).join(' | ')); try { await shot('gagal'); console.log((await js('location.hash + " :: " + document.body.innerText')).slice(0, 500)); } catch { /* ignore */ } } };

await sleep(800);
await cdp('Page.navigate', { url: `${BASE}/` });
await waitFor('#username');
await device(1100, 820, false);
await shot('01-login');

const db = new DatabaseSync(new URL('../data/mathquest.db', import.meta.url).pathname, { readOnly: true });
const studentId = db.prepare("SELECT id FROM users WHERE username = 'M26002'").get().id;

await step('Murid: log masuk dan papan utama', async () => { await login('M26002'); await waitFor('.hero'); await shot('02-murid-utama'); });
await step('Murid: peta dunia', async () => { await go('#/peta', '.world'); await shot('03-peta-dunia'); });
await step('Murid: laluan tahap dunia', async () => { await go('#/peta/pulau_tambah_tolak', '.node'); await shot('04-laluan-dunia'); });

const overlaps = () => js(`(()=>{const r=[...document.querySelectorAll('.node')].map(n=>({t:n.textContent.trim().slice(0,18),...n.getBoundingClientRect().toJSON()}));const st=document.querySelector('.path-stage').getBoundingClientRect();const out=[];for(let i=0;i<r.length;i++){if(r[i].top<st.top||r[i].bottom>st.bottom||r[i].left<st.left||r[i].right>st.right)out.push('luar '+r[i].t);for(let j=i+1;j<r.length;j++){const a=r[i],b=r[j];if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)out.push(a.t+' x '+b.t)}}return out})()`);
await step('Peta laluan: tiada nod bertindih (desktop dan telefon)', async () => {
  for (const [w, hgt, mob] of [[1100, 820, false], [390, 800, true]]) {
    await device(w, hgt, mob);
    for (const code of ['pulau_tambah_tolak', 'dunia_nombor', 'cabaran_masalah']) { await go(`#/peta/${code}`, '.node'); const o = await overlaps(); if (o.length) throw new Error(`${w}px ${code}: ${o.join('; ')}`); }
  }
  await device(1100, 820, false);
});
await step('Murid: main satu tahap penuh melalui UI dan lulus', async () => {
  const before = db.prepare('SELECT points_balance FROM students WHERE user_id = ?').get(studentId).points_balance;
  for (const w of ['pulau_tambah_tolak', 'dunia_nombor', 'bandar_wang', 'dunia_masa', 'alam_ukuran', 'cabaran_masalah']) {
    await go(`#/peta/${w}`, '.node');
    if (await js("!!document.querySelector('.node:not(.locked):not(.done)')")) break;
  }
  await click('.node:not(.locked):not(.done) .disc');
  await waitFor('.dialog');
  await js("[...document.querySelectorAll('.dialog button')].find(b=>/Mula|Main Semula/.test(b.textContent)).click()");
  await waitFor('.qcard');
  const sid = Number((await js('location.hash')).split('/').pop());
  const done = db.prepare('SELECT COUNT(*) c FROM student_answers WHERE session_id = ?').get(sid).c; // sesi disambung semula
  const rows = db.prepare('SELECT idx, secret, payload FROM session_questions WHERE session_id = ? AND idx >= ? ORDER BY idx').all(sid, done);
  for (const r of rows) {
    const s = JSON.parse(r.secret);
    const want = JSON.parse(r.payload).text;
    let text = '';
    for (let i = 0; i < 60 && text !== want; i++) { await sleep(100); text = await js("document.querySelector('.qtext')?.textContent || ''"); }
    if (text !== want) throw new Error(`Soalan tidak sepadan: ${text} != ${want}`);
    if (rows.indexOf(r) === 1) await shot('05-soalan');
    try {
    if (s.input === 'mcq') await js(`document.querySelectorAll('.opt')[${s.answer}].click()`);
    else if (s.input === 'match') {
      for (let i = 0; i < s.answer.length; i++) await js(`(()=>{const chips=[...document.querySelectorAll('.chipd')];chips[${s.answer[i]}].click();document.querySelectorAll('.slot')[${i}].click();})()`);
      await click('.match + * button.btn, .qcard .btn.primary.big');
    } else {
      if (s.input === 'count') await js("document.querySelectorAll('.objs button').forEach(b=>b.click())");
      await setVal('.numin input', String(s.answer)); await click('.numin .btn.primary');
    }
    } catch (e) { throw new Error(`${s.input} "${want}": ${e.message}`); }
    await waitFor('.feedback.good');
    if (rows.indexOf(r) === 0) await shot('06-feedback');
    await click('[aria-live=polite] > .btn');
    await sleep(120);
  }
  await waitFor('.result', 10000);
  await shot('07-hasil-tahap');
  const after = db.prepare('SELECT points_balance FROM students WHERE user_id = ?').get(studentId).points_balance;
  const text = await js("document.querySelector('.result').innerText");
  if (!/lulus|Sempurna/i.test(text)) throw new Error(`Tidak lulus: ${text.slice(0, 200)}`);
  if (!(after > before)) throw new Error(`Mata tidak bertambah (${before} -> ${after})`);
  await js("document.querySelector('.celebrate button')?.click()");
});

await step('Murid: kedai ganjaran', async () => { await go('#/kedai', '.prize'); await shot('08-kedai'); });
await step('Murid: tebusan saya', async () => { await go('#/tebusan', 'table, p.card, .card'); });
await step('Murid: papan pendahulu', async () => { await go('#/papan', '.lb-row'); await shot('09-papan'); });
await step('Murid: lencana', async () => { await go('#/lencana', '.bdg'); await shot('10-lencana'); });
await step('Murid: profil', async () => { await go('#/profil', '.hbars, .card'); await shot('11-profil'); });
await step('Murid: paparan telefon', async () => { await device(390, 800, true); await go('#/peta/pulau_tambah_tolak', '.node'); await shot('12-mobile-laluan'); await go('#/kedai', '.prize'); await shot('13-mobile-kedai'); await device(1100, 820, false); });
await step('Murid ditolak daripada API pentadbir', async () => { const s = await js('fetch("/api/admin/dashboard").then(r=>r.status)'); if (s !== 403) throw new Error(`status ${s}`); });

await step('Murid baharu: skrin setup akaun', async () => { await login('M26030'); await waitFor('.mascot + h1'); await sleep(300); const t = await js('document.body.innerText'); if (!/Sediakan Akaun/.test(t)) throw new Error(t.slice(0, 200)); await shot('14-setup-akaun'); });

await step('Guru: papan pemuka', async () => { await login('guru1'); await waitFor('.stat'); await shot('15-guru'); });
await step('Guru: cabaran & ambang & tebusan', async () => { await go('#/guru/cabaran', 'h1'); await go('#/guru/tahap', 'table'); await go('#/guru/tebusan', 'h1'); });
await step('Guru ditolak daripada API pentadbir', async () => { const s = await js('fetch("/api/admin/students").then(r=>r.status)'); if (s !== 403) throw new Error(`status ${s}`); });

await step('Pentadbir: papan pemuka', async () => { await login('admin'); await waitFor('.stat'); await shot('16-admin'); });
for (const [hash, sel, name] of [['#/admin/soalan', 'table', '17-admin-soalan'], ['#/admin/tahap', 'table', '18-admin-tahap'], ['#/admin/mata', '.formgrid input', '19-admin-mata'], ['#/admin/hadiah', 'table', '20-admin-hadiah'], ['#/admin/tebusan', 'table, .card', '21-admin-tebusan'], ['#/admin/pengguna', 'table', '22-admin-pengguna'], ['#/admin/laporan', '.hbars', '23-admin-laporan'], ['#/admin/tetapan', '.card table', '24-admin-tetapan'], ['#/platform/sekolah', '.card table', '26-platform-sekolah']]) {
  await step(`Pentadbir: ${hash}`, async () => { await go(hash, sel); await shot(name); });
}
await step('Pentadbir platform: dialog tetapan tahap dibuka dan boleh disimpan', async () => {
  await go('#/admin/tahap', 'table');
  await js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Edit').click()");
  await waitFor('.dialog input[type=number]');
  await shot('27-admin-tetapan-tahap');
  await js("[...document.querySelectorAll('.dialog-actions button')].find(b=>b.textContent==='Simpan').click()");
  await waitFor('.toast.ok');
});
await step('Pentadbir sekolah lain: tiada menu Sekolah, dialog tahap hanya tetapan sekolah', async () => {
  const w = new DatabaseSync(new URL('../data/mathquest.db', import.meta.url).pathname);
  w.exec('PRAGMA busy_timeout = 5000');
  if (!w.prepare("SELECT 1 FROM schools WHERE code = 'UI01'").get()) {
    const sid = Number(w.prepare("INSERT INTO schools(name, code) VALUES ('SK Ujian UI', 'UI01')").run().lastInsertRowid);
    w.prepare("INSERT INTO users(school_id, username, password_hash, role, display_name) VALUES (?, 'UI01-admin', ?, 'pentadbir', 'Pentadbir UI')").run(sid, hashPassword('UjianUI#2026'));
  }
  w.close();
  process.env.DEMO_PASSWORD = 'UjianUI#2026';
  await login('UI01-admin');
  await waitFor('.stat');
  if (await js("[...document.querySelectorAll('.nav a')].some(a => /Sekolah/.test(a.textContent))")) throw new Error('menu Sekolah tidak sepatutnya kelihatan');
  await go('#/admin/tahap', 'table');
  if (await js("[...document.querySelectorAll('button')].some(b => /Edit Dunia|\\+ Tahap/.test(b.textContent))")) throw new Error('butang struktur kongsi tidak sepatutnya kelihatan');
  await js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Edit').click()");
  await waitFor('.dialog input[type=number]');
  if (await js("!!document.querySelector('.dialog input[type=checkbox]')")) throw new Error('kotak templat tidak sepatutnya kelihatan');
  await shot('28-admin-sekolah-lain-tetapan-tahap');
  await js("document.querySelectorAll('.dialog input[type=number]')[1].value = '85'");
  await js("[...document.querySelectorAll('.dialog-actions button')].find(b=>b.textContent==='Simpan').click()");
  await waitFor('.toast.ok');
  const row = await js("[...document.querySelectorAll('tbody tr')][0].innerText");
  if (!/85%/.test(row)) throw new Error('peratus lulus 85% tidak dipaparkan: ' + row);
  const s2 = await js('fetch("/api/platform/schools").then(r=>r.status)');
  if (s2 !== 403) throw new Error(`API platform status ${s2}`);
  process.env.DEMO_PASSWORD = '';
});
await step('Pentadbir: borang soalan dibuka', async () => { await login('admin'); await waitFor('.stat'); await go('#/admin/soalan', 'table'); await js("[...document.querySelectorAll('button')].find(b=>/Soalan Baharu/.test(b.textContent)).click()"); await waitFor('.dialog textarea'); await shot('25-admin-borang-soalan'); await js("document.querySelector('.dialog-actions .ghost').click()"); });

const failed = results.filter((r) => r[0] !== 'OK');
console.log(`\n${results.length - failed.length}/${results.length} langkah lulus. Ralat konsol: ${errors.length}`);
errors.slice(0, 10).forEach((e) => console.log('  ', e));
finish(failed.length || errors.length ? 1 : 0);
