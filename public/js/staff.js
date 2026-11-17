import { api, h, clear, toast, fmt, DIFF, statusBadge, fmtDate, progressBar, stars, card, stat, field, select, table, bars } from './core.js';

const T = ['guru'];
export const routes = [
  { path: '/guru', roles: T, render: dashboard },
  { path: '/guru/murid/:id', roles: T, render: studentDetail },
  { path: '/guru/cabaran', roles: T, render: assignments },
  { path: '/guru/tahap', roles: T, render: thresholds },
  { path: '/guru/tebusan', roles: T, render: redemptions },
];

export function trendChart(trends) {
  const days = trends.daily;
  if (!days.length) return h('p', { class: 'muted' }, 'Belum ada aktiviti dalam 14 hari lepas.');
  return bars(days.map((d) => ({ label: d.day.slice(5), value: d.sessions })), { unit: ' sesi' });
}

/* ------------------------------------------------------------------ 12. Teacher dashboard */
async function dashboard(el, _p, ctx) {
  const d = await api('/api/teacher/overview');
  const students = (await api('/api/teacher/students')).students;
  const totalStudents = d.classes.reduce((s, c) => s + c.students, 0);
  clear(el).append(h('h1', {}, `Selamat datang, ${ctx.user.display_name}`),
    h('div', { class: 'grid g4', style: 'margin-bottom:1rem' }, stat('👧', 'Murid diselia', totalStudents), stat('🏫', 'Kelas', d.classes.length), stat('⚠️', 'Topik lemah', d.weak_topics.length, d.weak_topics.length ? 'warn' : ''), stat('🚩', 'Tahap lulus (kelas)', fmt(d.classes.reduce((s, c) => s + c.levels_passed, 0)))),
    card('Kelas Saya', table(['Kelas', 'Murid', 'Purata mata', 'Tahap lulus', 'Ketepatan', 'Laporan'], d.classes.map((c) => [c.name, c.students, fmt(c.avg_points), c.levels_passed, c.accuracy != null ? `${c.accuracy}%` : '-', h('a', { class: 'btn sm', href: `/api/teacher/classes/${c.id}/report?format=csv` }, '⬇ CSV')]))),
    h('div', { class: 'grid g2' }, card('Ketepatan Mengikut Topik (merah = perlu bantuan < 70%)', d.topics.length ? bars(d.topics.map((t) => ({ label: t.name, value: t.accuracy, warn: t.weak })), { max: 100, unit: '%' }) : h('p', { class: 'muted' }, 'Belum ada data jawapan.')), card('Aktiviti 14 Hari', trendChart(d.trends))),
    card('Murid', table(['Nama samaran', 'ID', 'Kelas', 'Mata', 'Tahap lulus', 'Ketepatan', 'Aktiviti terakhir', ''], students.map((s) => [s.nama_paparan, s.id_murid, s.kelas, fmt(s.mata_seumur_hidup), s.tahap_lulus, s.ketepatan_peratus != null ? `${s.ketepatan_peratus}%` : '-', s.aktiviti_terakhir ? fmtDate(s.aktiviti_terakhir) : '-', h('a', { class: 'btn sm primary', href: `#/guru/murid/${s.id}` }, 'Butiran')]))));
}

async function studentDetail(el, params) {
  const d = await api(`/api/teacher/students/${params.id}`);
  const s = d.student;
  clear(el).append(h('a', { href: '#/guru' }, '← Kembali'), h('h1', {}, `${s.display_name} (${s.username})`), h('p', { class: 'muted' }, `Tahun ${s.year} · ${s.class_name} · 🏅 ${fmt(s.points_lifetime)} mata`),
    h('div', { class: 'grid g2' }, card('Prestasi Mengikut Topik', d.topics.length ? bars(d.topics.map((t) => ({ label: t.name, value: t.accuracy, warn: t.weak })), { max: 100, unit: '%' }) : h('p', { class: 'muted' }, 'Belum ada jawapan.')),
      card('Sesi Terkini', table(['Tarikh', 'Jenis', 'Tahap', 'Skor', 'Lulus'], d.sessions.map((x) => [fmtDate(x.finished_at), x.kind === 'daily' ? 'Harian' : 'Tahap', x.title || '-', `${x.percent}%`, x.passed ? '✓' : '✗']))))
    , card('Kemajuan Tahap', table(['Dunia', 'Tahap', 'Terbaik', 'Bintang', 'Percubaan', 'Lulus'], d.levels.map((l) => [l.world, `${l.level_no}. ${l.title}`, `${l.best_percent}%`, stars(l.stars), l.attempts, l.passed ? '✓' : '—']))));
}

/* ------------------------------------------------------------------ assign challenges */
async function assignments(el) {
  const [a, lv] = await Promise.all([api('/api/teacher/assignments'), api('/api/teacher/levels')]);
  const cls = select(a.classes.map((c) => [c.id, c.name]), a.classes[0]?.id);
  const lvl = select(lv.levels.map((l) => [l.id, `${l.world} · T${l.level_no} ${l.title}`]), lv.levels[0]?.id);
  const title = h('input', { maxlength: 80, placeholder: 'cth: Latihan Tambah Minggu Ini' });
  const due = h('input', { type: 'date' });
  clear(el).append(h('h1', {}, '📝 Cabaran Kelas'), card('Beri Cabaran Baharu', h('div', { class: 'formgrid' }, field('Kelas', cls), field('Tahap', lvl), field('Tajuk', title), field('Tarikh akhir', due)),
    h('button', { class: 'btn primary', onclick: async () => { try { await api('/api/teacher/assignments', { method: 'POST', body: { class_id: Number(cls.value), level_id: Number(lvl.value), title: title.value, due_date: due.value || null } }); toast('Cabaran dihantar kepada kelas.'); assignments(el); } catch (e) { toast(e.message, 'err'); } } }, 'Hantar Cabaran')),
  card('Cabaran Aktif', table(['Tajuk', 'Kelas', 'Tahap', 'Tarikh akhir', 'Siap', ''], a.assignments.map((x) => [x.title, x.class_name, `${x.world_name}: ${x.level_title}`, x.due_date || '-', h('div', {}, `${x.completed}/${x.total_students}`, progressBar(x.total_students ? (x.completed / x.total_students) * 100 : 0)), h('button', { class: 'btn sm danger', onclick: async () => { await api(`/api/teacher/assignments/${x.id}`, { method: 'DELETE', body: {} }); assignments(el); } }, 'Padam')]), 'Belum ada cabaran.')));
}

/* ------------------------------------------------------------------ pass thresholds */
async function thresholds(el) {
  const { levels } = await api('/api/teacher/levels');
  clear(el).append(h('h1', {}, '🎚️ Ambang Lulus'), h('p', { class: 'muted' }, 'Laraskan peratus lulus (40-100%). Perubahan tertakluk kepada semua murid dan direkodkan dalam log audit.'),
    card('', table(['Dunia', 'Tahap', 'Kesukaran', 'Lulus (%)', ''], levels.map((l) => { const inp = h('input', { type: 'number', min: 40, max: 100, value: l.pass_percent, style: 'width:90px', 'aria-label': `Peratus lulus ${l.title}` }); return [l.world, `${l.level_no}. ${l.title}`, DIFF[l.difficulty], inp, h('button', { class: 'btn sm primary', onclick: async () => { try { await api(`/api/teacher/levels/${l.id}`, { method: 'PATCH', body: { pass_percent: Number(inp.value) } }); toast('Disimpan.'); } catch (e) { toast(e.message, 'err'); } } }, 'Simpan')]; }))));
}

async function redemptions(el) {
  const { redemptions: rows } = await api('/api/teacher/redemptions');
  clear(el).append(h('h1', {}, '📦 Tebusan Murid Saya'), h('p', { class: 'muted' }, 'Paparan sahaja. Kelulusan dan penuntutan dilakukan oleh pentadbir.'),
    card('', table(['Rujukan', 'Murid', 'Kelas', 'Hadiah', 'Mata', 'Status', 'Tarikh'], rows.map((r) => [r.rujukan, r.nama_paparan, r.kelas, r.hadiah, fmt(r.mata), statusBadge(r.status), fmtDate(r.tarikh_mohon)]), 'Tiada tebusan.')));
}
