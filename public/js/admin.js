import { api, h, clear, toast, modal, confirmBox, fmt, DIFF, statusBadge, fmtDate, progressBar, card, stat, field, select, table, bars } from './core.js';
import { trendChart } from './staff.js';

const A = ['pentadbir'];
export const routes = [
  { path: '/admin', roles: A, render: dashboard }, { path: '/admin/soalan', roles: A, render: questions }, { path: '/admin/tahap', roles: A, render: levels },
  { path: '/admin/mata', roles: A, render: pointsConfig }, { path: '/admin/hadiah', roles: A, render: rewardsPage }, { path: '/admin/tebusan', roles: A, render: approvals },
  { path: '/admin/pengguna', roles: A, render: users }, { path: '/admin/laporan', roles: A, render: reports }, { path: '/admin/tetapan', roles: A, render: settingsPage },
  { path: '/platform/sekolah', roles: A, render: schoolsPage },
];
const body = (o) => ({ method: o.method || 'POST', body: o.body ?? {} });
const act = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, 'err'); return null; } };
const csvLink = (kind, label) => h('a', { class: 'btn sm', href: `/api/admin/reports/export?kind=${kind}`, download: '' }, `⬇ ${label}`);

/* ------------------------------------------------------------------ 13. Administrator dashboard */
async function dashboard(el) {
  const d = await api('/api/admin/dashboard');
  clear(el).append(h('h1', {}, `📊 Papan Pemuka · ${d.settings.school_name}`),
    h('div', { class: 'grid g4' }, stat('🧒', 'Murid berdaftar', fmt(d.students)), stat('🟢', 'Murid aktif (7 hari)', fmt(d.active_students)), stat('❓', 'Jumlah soalan', fmt(d.questions)), stat('🚩', 'Tahap diselesaikan', fmt(d.levels_completed)),
      stat('🪙', 'Mata diberi', fmt(d.points_awarded)), stat('🎁', 'Mata ditebus', fmt(d.points_redeemed)), stat('⏳', 'Menunggu kelulusan', fmt(d.pending_redemptions), d.pending_redemptions ? 'warn' : ''), stat('📦', 'Inventori tersedia', fmt(d.inventory_available))),
    d.pending_redemptions ? h('p', {}, h('a', { class: 'btn warn', href: '#/admin/tebusan' }, `Semak ${d.pending_redemptions} permintaan tebusan`)) : null,
    h('div', { class: 'grid g2', style: 'margin-top:1rem' }, card('Topik Paling Sukar (ketepatan terendah)', d.topics.length ? bars(d.topics.map((t) => ({ label: t.name, value: t.accuracy, warn: t.weak })), { max: 100, unit: '%' }) : h('p', { class: 'muted' }, 'Tiada data.')), card('Penyertaan 14 Hari', trendChart(d.trends))));
}

/* ------------------------------------------------------------------ 14. Question management */
async function questions(el) {
  const topics = (await api('/api/admin/topics')).topics;
  const f = { year: '', topic: '', difficulty: '', q: '', page: 1 };
  const listBox = h('div');
  const filters = h('div', { class: 'formgrid' },
    field('Tahun', select([['', 'Semua'], ...[1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}`])], '', { onchange: (e) => { f.year = e.target.value; f.page = 1; load(); } })),
    field('Topik', select([['', 'Semua'], ...topics.map((t) => [t.code, t.name])], '', { onchange: (e) => { f.topic = e.target.value; f.page = 1; load(); } })),
    field('Kesukaran', select([['', 'Semua'], ...Object.entries(DIFF)], '', { onchange: (e) => { f.difficulty = e.target.value; f.page = 1; load(); } })),
    field('Cari', h('input', { placeholder: 'kata kunci', oninput: (e) => { f.q = e.target.value; f.page = 1; clearTimeout(f.t); f.t = setTimeout(load, 300); } })));
  async function load() {
    const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v !== '' && k !== 't')).toString();
    const d = await api(`/api/admin/questions?${qs}`);
    clear(listBox).append(h('p', { class: 'muted' }, `${fmt(d.total)} soalan · halaman ${d.page}/${d.pages}`), table(['ID', 'Tahun', 'Topik', 'Kesukaran', 'Jenis', 'Soalan', 'Aktif', ''], d.questions.map((q) => [q.id, q.year, q.topic_name, DIFF[q.difficulty], q.qtype, q.text.slice(0, 70) + (q.text.length > 70 ? '…' : ''), q.active ? '✓' : '—',
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => questionForm(topics, q.id, load) }, 'Edit'), h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox('Padam soalan?', 'Soalan ini akan dipadam kekal.')) { await act(() => api(`/api/admin/questions/${q.id}`, body({ method: 'DELETE' })), 'Dipadam.'); load(); } } }, 'Padam'))])),
    h('div', { class: 'row' }, h('button', { class: 'btn sm', disabled: d.page <= 1, onclick: () => { f.page--; load(); } }, '← Sebelum'), h('button', { class: 'btn sm', disabled: d.page >= d.pages, onclick: () => { f.page++; load(); } }, 'Seterusnya →')));
  }
  clear(el).append(h('div', { class: 'row between' }, h('h1', {}, '❓ Pengurusan Soalan'), h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => questionForm(topics, null, load) }, '+ Soalan Baharu'), h('button', { class: 'btn', onclick: () => importDialog(load) }, '⬆ Import CSV'))), card('Tapis', filters), card('', listBox));
  await load();
}

async function questionForm(topics, id, reload) {
  const q = id ? await api(`/api/admin/questions/${id}`) : { topic: topics[0].code, year: 1, difficulty: 'mudah', qtype: 'numeric', text: '', explanation: '', hint: '', options: [], correct: 0, pairs: [], answer: '', unit: '', visual: null, time_limit_sec: null, active: 1 };
  const i = {
    topic: select(topics.map((t) => [t.code, t.name]), q.topic), year: select([1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}`]), q.year), difficulty: select(Object.entries(DIFF), q.difficulty),
    qtype: select([['mcq', 'Pilihan jawapan'], ['numeric', 'Jawapan nombor'], ['fill', 'Isi tempat kosong'], ['word', 'Soalan cerita'], ['visual', 'Visual'], ['count', 'Mengira objek'], ['match', 'Padanan (seret & lepas)']], q.qtype),
    text: h('textarea', { maxlength: 500 }, q.text), answer: h('input', { value: q.answer, inputmode: 'decimal' }), unit: h('input', { value: q.unit, maxlength: 8 }),
    options: h('textarea', { placeholder: 'Satu pilihan setiap baris (2-6). Biarkan kosong untuk jawapan nombor.' }, (q.options || []).join('\n')), correct: h('input', { type: 'number', min: 1, max: 6, value: (q.correct >= 0 ? q.correct : 0) + 1 }),
    pairs: h('textarea', { placeholder: 'kiri=kanan (satu pasangan setiap baris)' }, (q.pairs || []).map((p) => p.join('=')).join('\n')),
    explanation: h('textarea', { maxlength: 800 }, q.explanation), hint: h('input', { value: q.hint, maxlength: 300 }), time: h('input', { type: 'number', min: 5, max: 600, value: q.time_limit_sec ?? '' }),
    visual: h('textarea', { placeholder: 'Pilihan, JSON cth: {"kind":"pie","parts":4,"shaded":3}' }, q.visual ? JSON.stringify(q.visual) : ''), active: h('input', { type: 'checkbox', checked: !!q.active }),
  };
  modal({ title: id ? `Edit Soalan #${id}` : 'Soalan Baharu', wide: true, body: h('div', {}, h('div', { class: 'formgrid' }, field('Topik', i.topic), field('Tahun', i.year), field('Kesukaran', i.difficulty), field('Jenis', i.qtype)), field('Soalan', i.text),
    h('div', { class: 'formgrid' }, field('Pilihan jawapan', i.options), h('div', {}, field('Nombor pilihan betul (1-6)', i.correct), field('Atau jawapan nombor', i.answer), field('Unit (cth cm)', i.unit))), field('Padanan', i.pairs), field('Penjelasan langkah penyelesaian (wajib)', i.explanation),
    h('div', { class: 'formgrid' }, field('Petunjuk', i.hint), field('Had masa (saat)', i.time)), field('Visual (JSON)', i.visual), h('label', { class: 'row' }, i.active, 'Aktif')),
  actions: [{ label: 'Batal', class: 'ghost' }, { label: 'Simpan', class: 'primary', onClick: async () => {
    let visual = null;
    if (i.visual.value.trim()) { try { visual = JSON.parse(i.visual.value); } catch { throw new Error('JSON visual tidak sah.'); } }
    const options = i.options.value.split('\n').map((x) => x.trim()).filter(Boolean);
    const payload = { topic: i.topic.value, year: Number(i.year.value), difficulty: i.difficulty.value, qtype: i.qtype.value, text: i.text.value, explanation: i.explanation.value, hint: i.hint.value, unit: i.unit.value, visual,
      time_limit_sec: i.time.value, active: i.active.checked ? 1 : 0, options, correct: Number(i.correct.value) - 1, answer: i.answer.value, pairs: i.pairs.value.split('\n').filter((x) => x.includes('=')).map((x) => x.split('=').map((s) => s.trim())) };
    await api(id ? `/api/admin/questions/${id}` : '/api/admin/questions', { method: id ? 'PUT' : 'POST', body: payload });
    toast('Soalan disimpan.'); reload();
  } }] });
}

function importDialog(reload) {
  const ta = h('textarea', { style: 'min-height:160px', placeholder: 'tahun,topik,kesukaran,jenis,soalan,jawapan,pilihan1,pilihan2,pilihan3,pilihan4,padanan,penjelasan,petunjuk,masa' });
  let xlsx = null;
  const info = h('p', { class: 'ok' });
  const file = h('input', { type: 'file', accept: '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', onchange: async (e) => {
    const f = e.target.files[0]; xlsx = null; info.textContent = '';
    if (!f) return;
    if (f.size > 1_000_000) { toast('Fail terlalu besar (maksimum 1 MB).', 'err'); e.target.value = ''; return; }
    if (/\.xlsx$/i.test(f.name)) {
      const bytes = new Uint8Array(await f.arrayBuffer()); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      xlsx = btoa(bin); ta.value = ''; info.textContent = `Fail Excel dimuatkan: ${f.name}`;
    } else ta.value = await f.text();
  } });
  modal({ title: 'Import Soalan (Excel atau CSV)', wide: true, body: h('div', {}, h('p', { class: 'muted' }, 'Lajur wajib: tahun, topik (kod, cth tambah_tolak), kesukaran (mudah/sederhana/sukar/pakar), jenis, soalan, penjelasan. Untuk pilihan jawapan isi pilihan1-4 dan letakkan teks jawapan betul dalam "jawapan". Padanan: kiri=kanan;kiri=kanan. Lembaran pertama sahaja dibaca.'),
    h('p', {}, h('a', { class: 'btn sm', href: '/api/admin/questions/template.xlsx', download: '' }, '⬇ Muat turun templat Excel')), file, info, h('p', { class: 'muted' }, 'atau tampal CSV:'), ta),
  actions: [{ label: 'Tutup', class: 'ghost' }, { label: 'Import', class: 'primary', onClick: async () => {
    const r = await api('/api/admin/questions/import', { method: 'POST', body: xlsx ? { xlsx } : { csv: ta.value } });
    toast(`${r.imported} soalan diimport${r.error_count ? `, ${r.error_count} ralat` : ''}.`, r.error_count ? 'err' : 'ok');
    if (r.errors.length) { modal({ title: 'Ralat Import', body: h('ul', {}, r.errors.map((x) => h('li', {}, `Baris ${x.row}: ${x.message}`))), actions: [{ label: 'Tutup' }] }); }
    reload();
  } }] });
}

/* ------------------------------------------------------------------ 15. Level configuration */
async function levels(el) {
  const [{ worlds, can_edit_structure: canStruct }, { generators }] = await Promise.all([api('/api/admin/worlds'), api('/api/admin/generators')]);
  clear(el).append(h('h1', {}, '🎚️ Konfigurasi Dunia & Tahap'), h('p', { class: 'muted' }, canStruct ? 'Anda pentadbir platform: boleh mengubah struktur kongsi (tajuk, kesukaran, jenis soalan) dan tetapan sekolah ini.' : 'Struktur dunia dan tahap dikongsi semua sekolah dan diurus oleh pentadbir platform. Anda boleh melaraskan peratus lulus, bilangan soalan, had masa dan mata bonus untuk sekolah anda. Perubahan berkuat kuasa pada sesi baharu.'),
    ...worlds.map((w) => card('', h('div', { class: 'row between' }, h('h2', {}, `${w.icon} ${w.name}`), h('div', { class: 'row' }, h('span', { class: 'muted' }, `Tahun ${w.min_year}+ · ${w.active ? 'Aktif' : 'Tidak aktif'}`), canStruct ? h('button', { class: 'btn sm', onclick: () => worldForm(w, () => levels(el)) }, 'Edit Dunia') : null, canStruct ? h('button', { class: 'btn sm primary', onclick: () => levelForm(w, null, generators, () => levels(el), canStruct) }, '+ Tahap') : null)),
      table(['No.', 'Tajuk', 'Kesukaran', 'Soalan', 'Lulus', 'Masa', 'Bonus', 'Aktif', ''], w.levels.map((l) => [l.level_no, l.title + (l.is_boss ? ' 👹' : ''), DIFF[l.difficulty], l.num_questions, `${l.pass_percent}%`, l.time_limit_sec ? `${l.time_limit_sec}s` : '-', l.bonus_points ?? 'lalai', l.active ? '✓' : '—', h('button', { class: 'btn sm', onclick: () => levelForm(w, l, generators, () => levels(el), canStruct) }, 'Edit')])))));
}

function worldForm(w, reload) {
  const i = { name: h('input', { value: w.name, maxlength: 60 }), desc: h('input', { value: w.description, maxlength: 200 }), year: select([1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}`]), w.min_year), icon: h('input', { value: w.icon, maxlength: 4 }), active: h('input', { type: 'checkbox', checked: !!w.active }) };
  modal({ title: `Edit ${w.name}`, body: h('div', {}, field('Nama', i.name), field('Penerangan', i.desc), field('Tahun minimum', i.year), field('Ikon', i.icon), h('label', { class: 'row' }, i.active, 'Aktif')),
    actions: [{ label: 'Batal', class: 'ghost' }, { label: 'Simpan', class: 'primary', onClick: async () => { await api(`/api/admin/worlds/${w.id}`, { method: 'PUT', body: { name: i.name.value, description: i.desc.value, min_year: Number(i.year.value), icon: i.icon.value, active: i.active.checked } }); toast('Disimpan.'); reload(); } }] });
}

function levelForm(w, l, generators, reload, canStruct) {
  const cur = l || { level_no: (w.levels.at(-1)?.level_no || 0) + 1, title: '', difficulty: 'mudah', generators: [], num_questions: 10, pass_percent: 70, time_limit_sec: null, bonus_points: null, is_boss: 0, active: 1 };
  const topicGens = generators.filter((g) => g.topic === w.topic_code || ['prob_two', 'word_addsub'].includes(g.key));
  const checks = topicGens.map((g) => ({ g, c: h('input', { type: 'checkbox', checked: cur.generators.includes(g.key) }) }));
  const i = { no: h('input', { type: 'number', min: 1, value: cur.level_no }), title: h('input', { value: cur.title, maxlength: 60 }), diff: select(Object.entries(DIFF), cur.difficulty), n: h('input', { type: 'number', min: 3, max: 30, value: cur.num_questions }),
    pass: h('input', { type: 'number', min: 40, max: 100, value: cur.pass_percent }), time: h('input', { type: 'number', min: 5, max: 600, value: cur.time_limit_sec ?? '' }), bonus: h('input', { type: 'number', min: 0, value: cur.bonus_points ?? '' }),
    boss: h('input', { type: 'checkbox', checked: !!cur.is_boss }), active: h('input', { type: 'checkbox', checked: !!cur.active }) };
  const acts = [{ label: 'Batal', class: 'ghost' }];
  if (l && canStruct) acts.push({ label: 'Padam/Nyahaktif', class: 'danger', onClick: async () => { if (!await confirmBox('Padam tahap?', 'Tahap yang sudah dimainkan hanya dinyahaktifkan.')) return false; const r = await api(`/api/admin/levels/${l.id}`, body({ method: 'DELETE' })); toast(r.deleted ? 'Dipadam.' : 'Dinyahaktifkan.'); reload(); } });
  acts.push({ label: 'Simpan', class: 'primary', onClick: async () => {
    const settings = { pass_percent: Number(i.pass.value), num_questions: Number(i.n.value), time_limit_sec: i.time.value, bonus_points: i.bonus.value };
    let lid = l?.id;
    if (canStruct) {
      const payload = { level_no: Number(i.no.value), title: i.title.value, difficulty: i.diff.value, generators: checks.filter((x) => x.c.checked).map((x) => x.g.key), is_boss: i.boss.checked, active: i.active.checked, ...settings };
      const res = await api(l ? `/api/admin/levels/${l.id}` : `/api/admin/worlds/${w.id}/levels`, { method: l ? 'PUT' : 'POST', body: payload });
      lid = l ? l.id : res.id;
    }
    await api(`/api/admin/levels/${lid}/settings`, { method: 'PUT', body: settings });
    toast('Disimpan.'); reload();
  } });
  const structure = canStruct ? [h('div', { class: 'formgrid' }, field('No. tahap', i.no), field('Tajuk', i.title), field('Kesukaran', i.diff)),
    h('p', { style: 'font-weight:700' }, 'Jenis soalan dalam tahap ini (templat, dikongsi semua sekolah):'), h('div', { class: 'row' }, checks.map((x) => h('label', { class: 'row badge' }, x.c, `${x.g.key} (T${x.g.min_year}-${x.g.max_year})`))), h('div', { class: 'row', style: 'margin:.6rem 0' }, h('label', { class: 'row' }, i.boss, 'Bos akhir'), h('label', { class: 'row' }, i.active, 'Aktif'))]
    : [h('p', {}, h('b', {}, `${cur.title} · ${DIFF[cur.difficulty]}`)), h('p', { class: 'muted' }, `Templat: ${cur.generators.join(', ')}`)];
  modal({ title: l ? `Tetapan Tahap ${l.level_no}` : `Tahap Baharu · ${w.name}`, wide: true, body: h('div', {}, structure, h('h3', {}, 'Tetapan sekolah ini'),
    h('div', { class: 'formgrid' }, field('Bilangan soalan', i.n), field('Peratus lulus', i.pass), field('Had masa/soalan (saat, kosong = tiada)', i.time), field('Mata bonus tamat (kosong = lalai sistem)', i.bonus))), actions: acts });
}

/* ------------------------------------------------------------------ platform: school management */
async function schoolsPage(el, _p, ctx) {
  if (!ctx.user.is_platform_admin) { location.hash = '#/admin'; return; }
  const { schools } = await api('/api/platform/schools');
  const name = h('input', { maxlength: 80, placeholder: 'cth SK Taman Bahagia' });
  const code = h('input', { maxlength: 12, placeholder: 'cth SKTB01', style: 'text-transform:uppercase' });
  const adm = h('input', { maxlength: 30, placeholder: 'cth SKTB01-admin' });
  const admName = h('input', { maxlength: 24, placeholder: 'cth Pentadbir TB' });
  const creds = (title, lines) => modal({ title, body: h('div', {}, h('p', { class: 'err' }, 'Serahkan maklumat ini kepada pentadbir sekolah. Kata laluan tidak akan dipaparkan lagi.'), h('pre', { style: 'background:#f3f7fe;padding:1rem;border-radius:12px;white-space:pre-wrap' }, lines.join('\n'))), actions: [{ label: 'Selesai', class: 'primary' }] });
  clear(el).append(h('h1', {}, '🏫 Pengurusan Sekolah'), h('p', { class: 'muted' }, 'Setiap sekolah mempunyai murid, guru, kelas, hadiah, mata dan tetapan yang terasing. Dunia, topik dan bank soalan kongsi dikawal oleh pentadbir platform. ID pengguna mesti unik merentasi sekolah.'),
    card('Daftar Sekolah Baharu', h('div', { class: 'formgrid' }, field('Nama sekolah', name), field('Kod sekolah', code, '3-12 huruf besar/nombor'), field('ID pentadbir sekolah', adm), field('Nama pentadbir', admName)),
      h('button', { class: 'btn primary', onclick: async () => { const r = await act(() => api('/api/platform/schools', body({ body: { name: name.value, code: code.value, admin_username: adm.value, admin_display_name: admName.value } })), null); if (r) { creds('Sekolah Didaftarkan', [`Sekolah: ${r.school.name} (${r.school.code})`, `ID pentadbir: ${r.admin.username}`, `Kata laluan sementara: ${r.admin.temp_password}`]); schoolsPage(el, _p, ctx); } } }, 'Daftar Sekolah')),
    card('Senarai Sekolah', table(['Kod', 'Nama', 'Murid', 'Guru', 'Pentadbir', 'Menunggu', 'Status', ''], schools.map((s) => [s.code, s.name, s.students, s.teachers, s.admins, s.pending, s.active ? h('span', { class: 'ok' }, 'Aktif') : h('span', { class: 'err' }, 'Dinyahaktif'),
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => { const u = prompt('ID pentadbir baharu:'); if (!u) return; const n = prompt('Nama pentadbir:'); if (!n) return; act(() => api(`/api/platform/schools/${s.id}/admins`, body({ body: { username: u, display_name: n } }))).then((r) => r && creds('Pentadbir Ditambah', [`ID: ${r.username}`, `Kata laluan sementara: ${r.temp_password}`])); } }, '+ Pentadbir'),
        h('button', { class: `btn sm ${s.active ? 'danger' : 'good'}`, onclick: async () => { if (!await confirmBox(s.active ? 'Nyahaktifkan sekolah?' : 'Aktifkan sekolah?', s.active ? 'Semua pengguna sekolah ini dilog keluar dan tidak boleh log masuk. Data kekal.' : s.name)) return; await act(() => api(`/api/platform/schools/${s.id}`, { method: 'PUT', body: { active: s.active ? 0 : 1 } }), 'Dikemas kini.'); schoolsPage(el, _p, ctx); } }, s.active ? 'Nyahaktif' : 'Aktifkan'))]))));
}

/* ------------------------------------------------------------------ 16. Points configuration */
async function pointsConfig(el) {
  const { settings: s } = await api('/api/admin/settings');
  const defs = [['points_correct', 'Jawapan betul', 'Diberi sekali bagi setiap soalan setiap tahap'], ['points_level_complete', 'Bonus tamat tahap', 'Boleh diganti pada setiap tahap'], ['points_perfect', 'Bonus markah penuh', ''], ['points_world_complete', 'Bonus tamat dunia (kali pertama)', ''], ['points_daily', 'Bonus cabaran harian', ''], ['default_pass_percent', 'Peratus lulus lalai (tahap baharu)', '40-100'], ['default_num_questions', 'Bilangan soalan lalai', '3-30'], ['daily_questions', 'Soalan cabaran harian', '3-20']];
  const inputs = Object.fromEntries(defs.map(([k]) => [k, h('input', { type: 'number', min: 0, value: s[k] })]));
  const repeat = h('input', { type: 'checkbox', checked: s.repeat_rewards === 1 });
  clear(el).append(h('h1', {}, '🪙 Konfigurasi Mata'), card('Nilai Mata', h('div', { class: 'formgrid' }, defs.map(([k, l, hint]) => field(l, inputs[k], hint))),
    h('label', { class: 'row' }, repeat, h('span', {}, 'Benarkan ganjaran berulang (setiap main semula diberi mata penuh). ', h('b', { class: 'err' }, 'Tidak disyorkan: membuka ruang kepada penternakan mata.'))),
    h('button', { class: 'btn primary', style: 'margin-top:1rem', onclick: () => act(async () => { const body2 = Object.fromEntries(defs.map(([k]) => [k, Number(inputs[k].value)])); body2.repeat_rewards = repeat.checked ? 1 : 0; await api('/api/admin/settings', { method: 'PUT', body: body2 }); }, 'Tetapan mata disimpan dan direkodkan dalam log audit.') }, 'Simpan')),
  card('Peraturan Anti-Penyalahgunaan (automatik)', h('ul', {}, ['Mata dikira di pelayan dan diberi hanya selepas semua soalan dijawab.', 'Setiap mata mempunyai kunci unik: muat semula/hantar dua kali tidak menggandakan mata.', 'Soalan dan bonus tahap hanya diberi sekali bagi setiap murid, kecuali ganjaran berulang dihidupkan.', 'Baki tidak boleh negatif. Tebus hanya menolak baki, bukan mata seumur hidup.'].map((t) => h('li', {}, t)))));
}

/* ------------------------------------------------------------------ 17. Reward management */
async function rewardsPage(el) {
  const { rewards } = await api('/api/admin/rewards');
  clear(el).append(h('div', { class: 'row between' }, h('h1', {}, '🎁 Pengurusan Hadiah'), h('button', { class: 'btn primary', onclick: () => rewardForm(null, () => rewardsPage(el)) }, '+ Hadiah Baharu')),
    card('', table(['', 'Hadiah', 'Mata', 'Stok', 'Ditempah', 'Tersedia', 'Tahun', 'Had/murid', 'Aktif', ''], rewards.map((r) => [r.image ? h('img', { src: r.image, alt: '', width: 40, height: 40, style: 'border-radius:8px;object-fit:cover' }) : r.emoji, r.name, fmt(r.points_cost), r.stock, r.reserved, r.available, `${r.min_year}+`, r.limit_per_student ?? '-', r.active ? '✓' : '—',
      h('button', { class: 'btn sm', onclick: () => rewardForm(r, () => rewardsPage(el)) }, 'Edit')]))));
}

function rewardForm(r, reload) {
  const c = r || { name: '', description: '', emoji: '🎁', points_cost: 300, stock: 10, min_year: 1, limit_per_student: '', active: 1 };
  const i = { name: h('input', { value: c.name, maxlength: 80 }), desc: h('textarea', { maxlength: 300 }, c.description), emoji: h('input', { value: c.emoji, maxlength: 4 }), cost: h('input', { type: 'number', min: 1, value: c.points_cost }),
    stock: h('input', { type: 'number', min: 0, value: c.stock }), year: select([1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}+`]), c.min_year), limit: h('input', { type: 'number', min: 1, value: c.limit_per_student ?? '', placeholder: 'tiada had' }), active: h('input', { type: 'checkbox', checked: !!c.active }),
    file: h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif' }) };
  modal({ title: r ? `Edit ${r.name}` : 'Hadiah Baharu', wide: true, body: h('div', {}, h('div', { class: 'formgrid' }, field('Nama', i.name), field('Emoji (jika tiada imej)', i.emoji), field('Mata diperlukan', i.cost), field('Kuantiti stok', i.stock, r ? `Ditempah: ${r.reserved}` : ''), field('Tahun minimum', i.year), field('Had tebusan setiap murid', i.limit)),
    field('Penerangan', i.desc), field('Imej (PNG/JPEG/WebP/GIF, maks 600 KB)', i.file), h('label', { class: 'row' }, i.active, 'Tersedia untuk ditebus')),
  actions: [{ label: 'Batal', class: 'ghost' }, ...(r ? [{ label: 'Padam', class: 'danger', onClick: async () => { if (!await confirmBox('Padam hadiah?', 'Jika sudah ada tebusan, hadiah hanya dinyahaktifkan.')) return false; const x = await api(`/api/admin/rewards/${r.id}`, body({ method: 'DELETE' })); toast(x.deleted ? 'Dipadam.' : 'Dinyahaktifkan.'); reload(); } }] : []),
    { label: 'Simpan', class: 'primary', onClick: async () => {
      const payload = { name: i.name.value, description: i.desc.value, emoji: i.emoji.value, points_cost: Number(i.cost.value), stock: Number(i.stock.value), min_year: Number(i.year.value), limit_per_student: i.limit.value, active: i.active.checked };
      const res = await api(r ? `/api/admin/rewards/${r.id}` : '/api/admin/rewards', { method: r ? 'PUT' : 'POST', body: payload });
      const f = i.file.files[0];
      if (f) {
        if (f.size > 600_000) throw new Error('Imej melebihi 600 KB.');
        const data = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = no; fr.readAsDataURL(f); });
        await api(`/api/admin/rewards/${res.id}/image`, { method: 'POST', body: { data } });
      }
      toast('Hadiah disimpan.'); reload();
    } }] });
}

/* ------------------------------------------------------------------ 18. Redemption approval */
async function approvals(el) {
  let status = '';
  const box = h('div');
  const tabs = h('div', { class: 'tabs' });
  const defs = [['', 'Semua'], ['menunggu', 'Menunggu'], ['diluluskan', 'Diluluskan'], ['sedia', 'Sedia Dituntut'], ['dituntut', 'Dituntut'], ['ditolak', 'Ditolak'], ['dibatalkan', 'Dibatalkan']];
  async function load() {
    [...tabs.children].forEach((b, i) => b.classList.toggle('on', defs[i][0] === status));
    const { redemptions } = await api(`/api/admin/redemptions${status ? `?status=${status}` : ''}`);
    const doAct = (r, action, label, needNote, cls) => h('button', { class: `btn sm ${cls || ''}`, onclick: async () => {
      let note;
      if (needNote) { note = prompt(`Sebab ${label.toLowerCase()} (wajib):`); if (!note) return; } else if (!await confirmBox(`${label}?`, `${r.reference_no} · ${r.display_name} · ${r.reward_name}`)) return;
      await act(() => api(`/api/admin/redemptions/${r.id}/${action}`, body({ body: { note } })), `${label} berjaya.`); load();
    } }, label);
    clear(box).append(table(['Rujukan', 'Murid', 'Kelas', 'Hadiah', 'Mata', 'Status', 'Tarikh', 'Tindakan'], redemptions.map((r) => [r.reference_no, `${r.display_name} (${r.username})`, r.class_name || '-', `${r.emoji} ${r.reward_name}`, fmt(r.points_spent), h('div', {}, statusBadge(r.status), r.note ? h('div', { class: 'muted', style: 'font-size:.8rem' }, r.note) : null), fmtDate(r.created_at),
      h('div', { class: 'row' }, r.status === 'menunggu' ? [doAct(r, 'approve', 'Luluskan', false, 'good'), doAct(r, 'reject', 'Tolak', true, 'danger')] : null, r.status === 'diluluskan' ? [doAct(r, 'ready', 'Sedia Dituntut', false, 'primary'), doAct(r, 'cancel', 'Batal', true, 'danger')] : null, r.status === 'sedia' ? [doAct(r, 'collect', 'Rekod Dituntut', false, 'good'), doAct(r, 'cancel', 'Batal', true, 'danger')] : null)]), 'Tiada tebusan.'));
  }
  defs.forEach(([v, l]) => tabs.append(h('button', { onclick: () => { status = v; load(); } }, l)));
  clear(el).append(h('div', { class: 'row between' }, h('h1', {}, '✅ Kelulusan Tebusan'), csvLink('redemptions', 'Eksport CSV')), h('p', { class: 'muted' }, 'Tolak atau batal akan memulangkan mata murid dan melepaskan stok secara automatik (sekali sahaja).'), tabs, card('', box));
  await load();
}

/* ------------------------------------------------------------------ 19. Student, teacher & class management */
async function users(el) {
  let tab = 'murid';
  const box = h('div');
  const tabs = h('div', { class: 'tabs' }, [['murid', 'Murid'], ['guru', 'Guru'], ['kelas', 'Kelas']].map(([k, l]) => h('button', { onclick: () => { tab = k; load(); } }, l)));
  const labels = ['murid', 'guru', 'kelas'];
  async function load() {
    [...tabs.children].forEach((b, i) => b.classList.toggle('on', labels[i] === tab));
    if (tab === 'murid') await studentsTab(box, load);
    else if (tab === 'guru') await teachersTab(box, load);
    else await classesTab(box, load);
  }
  clear(el).append(h('h1', {}, '👥 Pengurusan Pengguna'), tabs, box);
  await load();
}

function showCredentials(title, lines) {
  modal({ title, body: h('div', {}, h('p', { class: 'err' }, 'Salin dan serahkan kepada pengguna. Kata laluan ini tidak akan dipaparkan lagi.'), h('pre', { style: 'background:#f3f7fe;padding:1rem;border-radius:12px;white-space:pre-wrap' }, lines.join('\n'))), actions: [{ label: 'Selesai', class: 'primary' }] });
}

async function studentsTab(box, reload) {
  const [{ students }, { classes }] = await Promise.all([api('/api/admin/students'), api('/api/admin/classes')]);
  const q = h('input', { placeholder: 'Cari ID / nama…' });
  const rows = h('div');
  const draw = () => clear(rows).append(table(['ID', 'Nama samaran', 'Kelas', 'Thn', 'Mata tebus', 'Seumur hidup', 'Status', ''], students.filter((s) => !q.value || `${s.username} ${s.display_name}`.toLowerCase().includes(q.value.toLowerCase())).map((s) => [s.username, s.display_name, s.class_name || '-', s.year, fmt(s.points_balance), fmt(s.points_lifetime), s.active ? (s.must_change_password ? 'Belum setup' : 'Aktif') : 'Tidak aktif', h('button', { class: 'btn sm', onclick: () => studentDetail(s, classes, reload) }, 'Urus')])));
  q.addEventListener('input', draw);
  clear(box).append(h('div', { class: 'row between' }, q, h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => newStudent(classes, reload) }, '+ Murid Baharu'), h('button', { class: 'btn', onclick: () => importStudents(reload) }, '⬆ Import CSV'), csvLink('students', 'Prestasi'))), card('', rows));
  draw();
}

function newStudent(classes, reload) {
  const i = { id: h('input', { maxlength: 30, placeholder: 'cth M26031' }), nick: h('input', { maxlength: 24, placeholder: 'Nama samaran' }), year: select([1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}`]), 1), cls: select([['', '— tiada —'], ...classes.map((c) => [c.id, c.name])], '') };
  modal({ title: 'Murid Baharu', body: h('div', {}, h('p', { class: 'muted' }, 'Gunakan ID murid sekolah. Jangan masukkan nombor kad pengenalan atau nama penuh.'), field('ID Murid', i.id), field('Nama samaran', i.nick), field('Tahun', i.year), field('Kelas', i.cls)),
    actions: [{ label: 'Batal', class: 'ghost' }, { label: 'Cipta', class: 'primary', onClick: async () => { const r = await api('/api/admin/students', { method: 'POST', body: { username: i.id.value, display_name: i.nick.value, year: Number(i.year.value), class_id: i.cls.value || null } }); showCredentials('Akaun Dicipta', [`ID: ${r.username}`, `Kata laluan sementara: ${r.temp_password}`]); reload(); } }] });
}

function importStudents(reload) {
  const ta = h('textarea', { style: 'min-height:160px', placeholder: 'id,nama,tahun,kelas\nM26031,Bintang Biru,2,2 Gemilang' });
  modal({ title: 'Import Murid (CSV)', wide: true, body: h('div', {}, h('p', { class: 'muted' }, 'Lajur: id, nama (nama samaran), tahun, kelas. Kata laluan sementara dijana untuk setiap murid.'), ta),
    actions: [{ label: 'Tutup', class: 'ghost' }, { label: 'Import', class: 'primary', onClick: async () => { const r = await api('/api/admin/students/import', { method: 'POST', body: { csv: ta.value } }); showCredentials(`${r.created.length} akaun dicipta${r.errors.length ? `, ${r.errors.length} ralat` : ''}`, [...r.created.map((c) => `${c.username}\t${c.temp_password}`), ...r.errors.map((e) => `Baris ${e.row}: ${e.message}`)]); reload(); } }] });
}

async function studentDetail(s, classes, reload) {
  const d = await api(`/api/admin/students/${s.id}`);
  const i = { nick: h('input', { value: s.display_name, maxlength: 24 }), year: select([1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}`]), s.year), cls: select([['', '— tiada —'], ...classes.map((c) => [c.id, c.name])], s.class_id ?? ''), active: h('input', { type: 'checkbox', checked: !!s.active }),
    delta: h('input', { type: 'number', placeholder: '+/- mata' }), reason: h('input', { placeholder: 'Sebab pelarasan (wajib)' }) };
  const TYPE = { correct_answer: 'Jawapan betul', level_complete: 'Tamat tahap', perfect_score: 'Markah penuh', world_complete: 'Tamat dunia', daily: 'Harian', redeem: 'Tebus', refund: 'Bayaran balik', adjustment: 'Pelarasan' };
  modal({ title: `${s.display_name} (${s.username})`, wide: true, body: h('div', {}, h('div', { class: 'formgrid' }, field('Nama samaran', i.nick), field('Tahun', i.year), field('Kelas', i.cls), h('label', { class: 'row' }, i.active, 'Akaun aktif')),
    h('div', { class: 'row' }, h('button', { class: 'btn sm primary', onclick: async () => { await act(() => api(`/api/admin/students/${s.id}`, { method: 'PUT', body: { display_name: i.nick.value, year: Number(i.year.value), class_id: i.cls.value || null, active: i.active.checked } }), 'Disimpan.'); reload(); } }, 'Simpan Perubahan'),
      h('button', { class: 'btn sm warn', onclick: async () => { if (!await confirmBox('Tetap semula kata laluan?', 'Murid akan dilog keluar dan perlu menetapkan kata laluan baharu.')) return; const r = await act(() => api(`/api/admin/users/${s.id}/reset-password`, body({})) ); if (r) showCredentials('Kata Laluan Ditetapkan Semula', [`ID: ${s.username}`, `Kata laluan sementara: ${r.temp_password}`]); } }, 'Reset Kata Laluan'),
      h('button', { class: 'btn sm danger', onclick: async () => { if (!await confirmBox('Padam murid?', 'Semua data murid dipadam kekal (hak privasi).')) return; await act(() => api(`/api/admin/students/${s.id}`, body({ method: 'DELETE' })), 'Murid dipadam.'); reload(); } }, 'Padam Data')),
    h('h3', { style: 'margin-top:1rem' }, `Pelarasan Mata (baki semasa ${fmt(d.student.points_balance)})`), h('div', { class: 'row' }, i.delta, i.reason, h('button', { class: 'btn sm primary', onclick: async () => { const r = await act(() => api(`/api/admin/students/${s.id}/adjust-points`, body({ body: { delta: Number(i.delta.value), reason: i.reason.value } })), 'Pelarasan direkodkan.'); if (r) reload(); } }, 'Laras')),
    h('h3', { style: 'margin-top:1rem' }, 'Lejar Mata Terkini'), table(['Tarikh', 'Jenis', 'Perubahan', 'Baki', 'Butiran'], d.ledger.slice(0, 15).map((t) => [fmtDate(t.created_at), TYPE[t.type] || t.type, (t.balance_delta > 0 ? '+' : '') + t.balance_delta, t.balance_after, t.reason || ''])),
    h('h3', { style: 'margin-top:1rem' }, 'Kemajuan'), h('p', {}, `${d.levels.filter((l) => l.passed).length} tahap lulus. ` + (d.topics.length ? d.topics.map((t) => `${t.name} ${t.accuracy}%`).join(' · ') : ''))), actions: [{ label: 'Tutup' }] });
}

async function teachersTab(box, reload) {
  const [{ teachers }, { classes }] = await Promise.all([api('/api/admin/teachers'), api('/api/admin/classes')]);
  clear(box).append(h('div', { class: 'row between' }, h('span'), h('button', { class: 'btn primary', onclick: () => teacherForm(null, classes, reload) }, '+ Guru Baharu')),
    card('', table(['ID', 'Nama', 'Kelas diselia', 'Status', ''], teachers.map((t) => [t.username, t.display_name, classes.filter((c) => t.class_ids.includes(c.id)).map((c) => c.name).join(', ') || '-', t.active ? 'Aktif' : 'Tidak aktif',
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => teacherForm(t, classes, reload) }, 'Edit'), h('button', { class: 'btn sm warn', onclick: async () => { if (!await confirmBox('Reset kata laluan?', t.display_name)) return; const r = await act(() => api(`/api/admin/users/${t.id}/reset-password`, body({}))); if (r) showCredentials('Kata Laluan Ditetapkan Semula', [`ID: ${t.username}`, `Kata laluan sementara: ${r.temp_password}`]); } }, 'Reset'))]))));
}

function teacherForm(t, classes, reload) {
  const i = { id: h('input', { value: t?.username || '', disabled: !!t, maxlength: 30 }), nick: h('input', { value: t?.display_name || '', maxlength: 24 }), active: h('input', { type: 'checkbox', checked: t ? !!t.active : true }) };
  const checks = classes.map((c) => ({ c, i: h('input', { type: 'checkbox', checked: t?.class_ids.includes(c.id) }) }));
  modal({ title: t ? 'Edit Guru' : 'Guru Baharu', body: h('div', {}, field('ID Guru', i.id), field('Nama paparan', i.nick), h('p', { style: 'font-weight:700' }, 'Kelas diselia:'), h('div', { class: 'row' }, checks.map((x) => h('label', { class: 'row badge' }, x.i, x.c.name))), h('label', { class: 'row', style: 'margin-top:.6rem' }, i.active, 'Aktif')),
    actions: [{ label: 'Batal', class: 'ghost' }, { label: 'Simpan', class: 'primary', onClick: async () => {
      const class_ids = checks.filter((x) => x.i.checked).map((x) => x.c.id);
      if (t) { await api(`/api/admin/teachers/${t.id}`, { method: 'PUT', body: { display_name: i.nick.value, active: i.active.checked, class_ids } }); toast('Disimpan.'); } else { const r = await api('/api/admin/teachers', { method: 'POST', body: { username: i.id.value, display_name: i.nick.value, class_ids } }); showCredentials('Akaun Guru Dicipta', [`ID: ${i.id.value}`, `Kata laluan sementara: ${r.temp_password}`]); }
      reload();
    } }] });
}

async function classesTab(box, reload) {
  const { classes } = await api('/api/admin/classes');
  const name = h('input', { placeholder: 'cth 4 Bestari', maxlength: 30 });
  const year = select([1, 2, 3, 4, 5, 6].map((y) => [y, `Tahun ${y}`]), 1);
  clear(box).append(card('Kelas Baharu', h('div', { class: 'row' }, name, year, h('button', { class: 'btn primary', onclick: async () => { await act(() => api('/api/admin/classes', body({ body: { name: name.value, year: Number(year.value) } })), 'Kelas dicipta.'); reload(); } }, 'Tambah'))),
    card('', table(['Kelas', 'Tahun', 'Murid', 'Purata mata', ''], classes.map((c) => [c.name, c.year, c.students, fmt(c.avg_points), h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox('Padam kelas?', 'Murid dalam kelas ini akan menjadi tanpa kelas.')) { await act(() => api(`/api/admin/classes/${c.id}`, body({ method: 'DELETE' })), 'Dipadam.'); reload(); } } }, 'Padam')]))));
}

/* ------------------------------------------------------------------ 20. Analytics and reports */
async function reports(el) {
  const d = await api('/api/admin/reports/overview');
  clear(el).append(h('div', { class: 'row between' }, h('h1', {}, '📈 Analitik & Laporan'), h('div', { class: 'row' }, csvLink('students', 'Prestasi Murid'), csvLink('redemptions', 'Tebusan'), csvLink('points', 'Lejar Mata'), csvLink('topics', 'Topik'))),
    h('div', { class: 'grid g2' }, card('Topik Sukar (ketepatan terendah dahulu)', d.topics.length ? bars(d.topics.map((t) => ({ label: `${t.name} (${t.answered})`, value: t.accuracy, warn: t.weak })), { max: 100, unit: '%' }) : h('p', { class: 'muted' }, 'Tiada data.')), card('Penyertaan: Sesi Setiap Hari', trendChart(d.trends))),
    card('Mata Diperoleh Mingguan', d.trends.weekly.length ? bars(d.trends.weekly.map((w) => ({ label: w.week, value: w.points }))) : h('p', { class: 'muted' }, 'Tiada data.')),
    card('Analitik Kelas', table(['Kelas', 'Tahun', 'Murid', 'Purata mata', 'Tahap lulus', 'Ketepatan'], d.classes.map((c) => [c.name, c.year, c.students, fmt(c.avg_points), c.levels_passed, c.accuracy != null ? `${c.accuracy}%` : '-']))));
}

/* ------------------------------------------------------------------ 21. System settings */
async function settingsPage(el) {
  const [{ settings: s }, { logs }] = await Promise.all([api('/api/admin/settings'), api('/api/admin/audit')]);
  const i = { name: h('input', { value: s.school_name, maxlength: 80 }), lb: h('input', { type: 'checkbox', checked: s.leaderboard_public === 1 }), ret: h('input', { type: 'number', min: 30, value: s.retention_days }), aret: h('input', { type: 'number', min: 30, value: s.audit_retention_days }) };
  clear(el).append(h('h1', {}, '⚙️ Tetapan Sistem'),
    card('Sekolah & Privasi', field('Nama sekolah', i.name), h('label', { class: 'row' }, i.lb, 'Papan pendahulu awam untuk murid (nama samaran sahaja)'),
      h('div', { class: 'formgrid', style: 'margin-top:1rem' }, field('Simpan sejarah jawapan (hari)', i.ret, 'Selepas tempoh ini sesi lama dipadam; mata & kemajuan kekal.'), field('Simpan log audit (hari)', i.aret)),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => act(() => api('/api/admin/settings', { method: 'PUT', body: { school_name: i.name.value, leaderboard_public: i.lb.checked ? 1 : 0, retention_days: Number(i.ret.value), audit_retention_days: Number(i.aret.value) } }), 'Tetapan disimpan.') }, 'Simpan'),
        h('button', { class: 'btn warn', onclick: async () => { if (await confirmBox('Jalankan pembersihan data?', 'Data melepasi tempoh simpanan akan dipadam.')) { const r = await act(() => api('/api/admin/purge', body({}))); if (r) toast(`Dibersihkan: ${r.game_sessions} sesi, ${r.audit_logs} log, ${r.inactive_students} akaun tidak aktif.`); } } }, 'Bersihkan Data Tamat Tempoh'))),
    card('Sandaran', h('p', {}, 'Jalankan di pelayan: ', h('code', {}, 'npm run backup'), ' (pangkalan data + imej). Pulihkan dengan ', h('code', {}, 'npm run restore -- <direktori>'), '.')),
    card('Log Audit Pentadbir (200 terkini)', table(['Masa', 'Pengguna', 'Tindakan', 'Sasaran', 'Butiran'], logs.map((l) => [fmtDate(l.created_at), `${l.username || '-'} (${l.role || '-'})`, l.action, l.target || '', (l.detail || '').slice(0, 90)]))));
}
void progressBar;
