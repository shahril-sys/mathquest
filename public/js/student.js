import { api, h, clear, toast, modal, confirmBox, sound, confetti, fmt, avatar, AV, DIFF, statusBadge, fmtDate, progressBar, stars, card, stat, field, table, bars } from './core.js';

const S = ['murid'];
const ALL = ['murid', 'guru', 'pentadbir'];
const THEME_DECOR = { meadow: '🌼', island: '🌴', forest: '🍃', mountain: '❄️', castle: '✨', space: '🌟', city: '🏙️', clock: '🕒', lab: '🔬', volcano: '🔥' };

export const routes = [
  { path: '/', roles: S, render: home },
  { path: '/peta', roles: S, render: worldList },
  { path: '/peta/:code', roles: S, render: worldPath },
  { path: '/kedai', roles: S, render: shop },
  { path: '/tebusan', roles: S, render: history },
  { path: '/lencana', roles: S, render: badges },
  { path: '/profil', roles: S, render: profile },
  { path: '/papan', roles: ALL, render: leaderboard },
  { path: '/akaun', roles: ALL, render: account },
];

async function startAndGo(path) {
  try { const s = await api(path, { method: 'POST', body: {} }); sound('click'); location.hash = `#/main/${s.id}`; } catch (e) { toast(e.message, 'err'); }
}

/* ------------------------------------------------------------------ 4. Student dashboard */
async function home(el, _p, ctx) {
  const d = await api('/api/student/home');
  ctx.setPoints(d.points.balance, d.points.lifetime);
  const daily = d.daily;
  const dailyBtn = daily.done ? h('span', { class: 'badge st-dituntut' }, daily.passed ? '✅ Selesai hari ini!' : 'Sudah dimainkan hari ini') : h('button', { class: 'btn warn', onclick: () => startAndGo('/api/student/daily/start') }, daily.active ? 'Sambung Cabaran Harian' : 'Mula Cabaran Harian ⚡');
  clear(el).append(
    h('section', { class: 'card hero' }, h('div', { class: 'big-av', 'aria-hidden': 'true' }, avatar(d.profile.avatar)),
      h('div', { style: 'flex:1;min-width:220px' }, h('h1', {}, `Hai, ${d.profile.display_name}!`), h('p', {}, `Tahun ${d.profile.year}${d.profile.class_name ? ` · ${d.profile.class_name}` : ''} · Tahap Pahlawan ${d.player.level}`),
        progressBar(d.player.progress, 'Kemajuan ke tahap pahlawan seterusnya'), h('small', {}, d.player.next_at ? `${fmt(d.points.lifetime)} / ${fmt(d.player.next_at)} mata seumur hidup` : 'Tahap tertinggi dicapai!')),
      h('a', { class: 'btn good big', href: '#/peta' }, 'Teruskan Pengembaraan 🗺️')),
    h('div', { class: 'grid g4', style: 'margin-bottom:1rem' }, stat('🪙', 'Mata boleh tebus', fmt(d.points.balance)), stat('🏅', 'Mata seumur hidup', fmt(d.points.lifetime)), stat('⭐', 'Bintang', fmt(d.stars)), stat('🚩', 'Tahap lulus', `${d.progress.passed}/${d.progress.total}`)),
    h('div', { class: 'grid g2' },
      card('⚡ Cabaran Harian', h('p', {}, `${5} soalan campuran. Selesaikan sekali sehari untuk mata bonus!`), dailyBtn),
      card('🎯 Seterusnya untuk anda', d.next_levels.length ? h('div', { class: 'grid' }, d.next_levels.map((l) => h('div', { class: 'row between' }, h('span', {}, `${l.world_icon} ${l.world_name} · Tahap ${l.level_no}: ${l.title}`), h('button', { class: 'btn sm primary', onclick: () => startAndGo(`/api/student/levels/${l.id}/start`) }, 'Main')))) : h('p', { class: 'muted' }, 'Buka peta dunia untuk mula bermain!'))),
    d.assignments.length ? card('📝 Cabaran daripada Guru', table(['Cabaran', 'Tahap', 'Tarikh akhir', 'Status', ''], d.assignments.map((a) => [a.title, `${a.world_name}: ${a.level_title}`, a.due_date || '-', a.done ? h('span', { class: 'ok' }, 'Siap ✓') : 'Belum', a.done ? '' : h('button', { class: 'btn sm primary', onclick: () => startAndGo(`/api/student/levels/${a.level_id}/start`) }, 'Main')]))) : null,
    card('🎖️ Lencana Terkini', d.badges.length ? h('div', { class: 'row' }, d.badges.map((b) => h('span', { class: 'badge', style: 'font-size:1rem' }, `${b.icon} ${b.name}`))) : h('p', { class: 'muted' }, 'Belum ada lencana. Lulus tahap pertama anda untuk mendapatkannya!')));
}

/* ------------------------------------------------------------------ 5. World map */
async function worldList(el) {
  const { worlds } = await api('/api/student/worlds');
  clear(el).append(h('h1', {}, '🗺️ Peta Dunia Matematik'), h('p', { class: 'muted' }, 'Pilih dunia untuk meneruskan pengembaraan. Dunia berkunci akan terbuka apabila anda berada dalam tahun yang sesuai.'),
    h('div', { class: 'worlds' }, worlds.map((w) => h('button', { class: `world th-${w.theme}${w.year_locked ? ' locked' : ''}`, disabled: w.year_locked, 'aria-label': `${w.name}, ${w.passed} daripada ${w.total} tahap lulus`, onclick: () => { sound('click'); location.hash = `#/peta/${w.code}`; } },
      h('span', { class: 'deco', 'aria-hidden': 'true' }, THEME_DECOR[w.theme]),
      h('div', {}, h('span', { class: 'w-ico', 'aria-hidden': 'true' }, w.icon), h('h3', {}, w.name), h('small', {}, w.year_locked ? `🔒 Untuk Tahun ${w.min_year} ke atas` : w.description)),
      h('div', {}, progressBar(w.total ? (w.passed / w.total) * 100 : 0, `Kemajuan ${w.name}`), h('div', { class: 'row between' }, h('small', {}, `${w.passed}/${w.total} tahap`), h('small', {}, `⭐ ${w.stars}`), w.completed ? h('small', {}, '🏆 Tamat!') : null))))));
}

async function worldPath(el, params) {
  const { worlds } = await api('/api/student/worlds');
  const w = worlds.find((x) => x.code === params.code);
  if (!w || w.year_locked) { location.hash = '#/peta'; return; }
  const n = w.levels.length;
  // serpentine board-game layout: 4 nodes per row, direction alternates; row pitch is larger than a node, so nodes cannot overlap
  const PER = 4; const ROW = 150; const rows = Math.ceil(n / PER); const H = rows * ROW + 40;
  const XS = [14, 38, 62, 86];
  const pos = w.levels.map((_, i) => { const r = Math.floor(i / PER); const c = i % PER; return { x: XS[r % 2 === 0 ? c : PER - 1 - c], y: 30 + r * ROW + 55 }; });
  const current = w.levels.findIndex((l) => l.unlocked && !l.passed);
  const stage = h('div', { class: `path-stage th-${w.theme}`, style: `height:${H}px;min-height:0` },
    h('span', { class: 'cloud', style: 'top:6%', 'aria-hidden': 'true' }, '☁️'), h('span', { class: 'cloud', style: 'top:40%;animation-delay:-18s', 'aria-hidden': 'true' }, '☁️'),
    h('svg', { class: 'trail', viewBox: `0 0 100 ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, h('polyline', { points: pos.map((p) => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 3, 'stroke-dasharray': '2 2', 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' })),
    w.levels.map((l, i) => h('button', { class: `node${l.passed ? ' done' : ''}${!l.unlocked ? ' locked' : ''}${l.is_boss ? ' boss' : ''}${i === current ? ' current' : ''}`, style: `left:${pos[i].x}%;top:${pos[i].y}px`, 'aria-label': `Tahap ${l.level_no} ${l.title}${l.unlocked ? '' : ', berkunci'}`, onclick: () => levelDialog(w, l) },
      i === current ? h('span', { class: 'hero-pin', 'aria-hidden': 'true' }, '🧭') : null,
      h('div', { class: 'disc' }, !l.unlocked ? '🔒' : l.is_boss ? '👹' : l.level_no), h('div', { class: 'nl' }, l.title), l.passed ? stars(l.stars) : null, l.assigned ? h('div', { class: 'nl' }, '📝 Tugasan') : null)));
  clear(el).append(h('div', { class: 'row between' }, h('div', {}, h('a', { href: '#/peta' }, '← Semua dunia'), h('h1', {}, `${w.icon} ${w.name}`)), h('div', { style: 'min-width:220px' }, progressBar((w.passed / w.total) * 100), h('small', { class: 'muted' }, `${w.passed}/${w.total} tahap lulus · ⭐ ${w.stars}`))), stage);
}

function levelDialog(w, l) {
  if (!l.unlocked) { sound('bad'); toast('Lulus tahap sebelumnya dahulu untuk membuka tahap ini. 🔒', 'err'); return; }
  modal({ title: `${w.icon} Tahap ${l.level_no}: ${l.title}`, body: h('div', {}, h('p', {}, `${l.num_questions} soalan · Kesukaran: ${DIFF[l.difficulty]}`), h('p', {}, `Perlu ${l.pass_percent}% betul untuk lulus.`),
    l.time_limit_sec ? h('p', {}, `⏱️ Cabaran bermasa: ${l.time_limit_sec} saat setiap soalan.`) : null, l.passed ? h('p', {}, stars(l.stars), ` Terbaik: ${l.best_percent}% (mata hanya diberi sekali bagi setiap soalan/tahap yang sudah dicapai)`) : l.attempts ? h('p', { class: 'muted' }, `Percubaan: ${l.attempts}, terbaik ${l.best_percent}%`) : null),
  actions: [{ label: 'Tutup', class: 'ghost' }, { label: l.passed ? 'Main Semula' : 'Mula! 🚀', class: 'primary', onClick: async () => { await startAndGo(`/api/student/levels/${l.id}/start`); } }] });
}

/* ------------------------------------------------------------------ 10. Reward shop */
async function shop(el, _p, ctx) {
  const d = await api('/api/rewards');
  ctx.setPoints(d.balance, d.lifetime);
  clear(el).append(h('div', { class: 'row between' }, h('div', {}, h('h1', {}, '🛍️ Kedai Ganjaran MathQuest'), h('p', { class: 'muted' }, 'Tukar mata anda dengan hadiah. Permintaan akan disemak oleh guru/pentadbir.')), h('div', { class: 'stat' }, h('div', { class: 'stat-icon' }, '🪙'), h('div', {}, h('div', { class: 'stat-val' }, fmt(d.balance)), h('div', { class: 'stat-lbl' }, 'Mata boleh tebus')))),
    d.rewards.length ? h('div', { class: 'prizes' }, d.rewards.map((r) => h('article', { class: `prize${r.eligible ? '' : ' nope'}` },
      h('div', { class: 'pic' }, r.image ? h('img', { src: r.image, alt: r.name, loading: 'lazy' }) : h('span', { 'aria-hidden': 'true' }, r.emoji)), h('h3', {}, r.name), h('small', { class: 'muted' }, r.description),
      h('div', { class: 'cost' }, `🪙 ${fmt(r.points_cost)} mata`), h('small', {}, `Stok: ${r.available > 0 ? r.available : 'Habis'}`), progressBar(Math.min(100, (d.balance / r.points_cost) * 100), 'Mata dikumpul'),
      h('small', { class: r.eligible ? 'ok' : 'muted' }, r.eligibility), h('button', { class: 'btn good', disabled: !r.eligible, onclick: () => redeemDialog(r, d.balance, el, ctx) }, 'Tebus Hadiah')))) : h('p', { class: 'card' }, 'Belum ada hadiah tersedia.'));
}

function redeemDialog(r, balance, el, ctx) {
  const requestId = crypto.randomUUID();
  modal({ title: 'Sahkan Tebusan', body: h('div', {}, h('p', { style: 'font-size:1.2rem' }, `${r.emoji} ${r.name}`), h('p', {}, `Mata diperlukan: ${fmt(r.points_cost)}`), h('p', {}, `Baki selepas tebus: ${fmt(balance - r.points_cost)}`),
    h('p', { class: 'muted' }, 'Mata ditolak sekarang. Jika permintaan ditolak atau dibatalkan, mata dipulangkan automatik. Hadiah dituntut selepas diluluskan.')),
  actions: [{ label: 'Batal', class: 'ghost' }, { label: 'Ya, Tebus!', class: 'good', onClick: async () => {
    const res = await api(`/api/rewards/${r.id}/redeem`, { method: 'POST', body: { request_id: requestId } });
    sound('coin'); confetti();
    modal({ title: '🎉 Permintaan Dihantar!', body: h('div', { class: 'center' }, h('div', { class: 'chest' }, '🎁'), h('p', {}, 'Nombor rujukan anda:'), h('h2', {}, res.reference_no), statusBadge(res.status), h('p', { class: 'muted' }, 'Semak status di "Tebusan Saya".')), actions: [{ label: 'Tebusan Saya', class: 'primary', onClick: () => { location.hash = '#/tebusan'; } }, { label: 'Tutup', class: 'ghost' }] });
    await shop(el, {}, ctx);
  } }] });
}

/* ------------------------------------------------------------------ 11. Redemption history */
async function history(el, _p, ctx) {
  const { redemptions } = await api('/api/student/redemptions');
  clear(el).append(h('h1', {}, '📦 Tebusan Saya'), card('', table(['Rujukan', 'Hadiah', 'Mata', 'Status', 'Dimohon', 'Catatan', ''], redemptions.map((r) => [r.reference_no, `${r.emoji} ${r.reward_name}`, fmt(r.points_spent), statusBadge(r.status), fmtDate(r.created_at), r.note || '',
    r.status === 'menunggu' ? h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox('Batalkan permintaan?', 'Mata anda akan dipulangkan sepenuhnya.')) { try { await api(`/api/student/redemptions/${r.id}/cancel`, { method: 'POST', body: {} }); toast('Dibatalkan. Mata dipulangkan.'); history(el, {}, ctx); } catch (e) { toast(e.message, 'err'); } } } }, 'Batal') : ''])), 'Anda belum menebus sebarang hadiah.'));
}

/* ------------------------------------------------------------------ 8. Badges */
async function badges(el) {
  const { badges: list } = await api('/api/student/badges');
  clear(el).append(h('h1', {}, '🎖️ Lencana Pencapaian'), h('p', { class: 'muted' }, `${list.filter((b) => b.earned).length} daripada ${list.length} lencana diperoleh.`),
    h('div', { class: 'badges' }, list.map((b) => h('div', { class: `bdg${b.earned ? '' : ' locked'}` }, h('div', { class: 'ic', 'aria-hidden': 'true' }, b.icon), h('h3', {}, b.name), h('small', {}, b.description), b.earned ? h('div', { class: 'ok' }, '✓ Diperoleh') : h('div', { class: 'muted' }, '🔒 Belum')))));
}

/* ------------------------------------------------------------------ 9. Leaderboard (all roles) */
async function leaderboard(el) {
  const types = [['individual', 'Individu'], ['class', 'Kelas'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan']];
  const box = h('div');
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const load = async (t) => {
    [...tabs.children].forEach((b, i) => { b.classList.toggle('on', types[i][0] === t); b.setAttribute('aria-selected', String(types[i][0] === t)); });
    const d = await api(`/api/leaderboard?type=${t}`);
    if (d.disabled) { clear(box).append(card('', h('p', {}, '🔒 ' + d.message))); return; }
    clear(box).append(card(t === 'class' ? 'Purata mata seumur hidup setiap murid' : t === 'individual' ? 'Mata seumur hidup (bukan baki tebus)' : `Mata diperoleh ${t === 'weekly' ? '7 hari' : 'bulan ini'}`,
      d.rows.length ? d.rows.map((r) => h('div', { class: `lb-row${r.me ? ' me' : ''}` }, h('div', { class: 'rk' }, r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank), h('div', { class: 'lb-av' }, t === 'class' ? '🏫' : avatar(r.avatar)), h('div', {}, r.label, r.members ? h('small', { class: 'muted' }, ` · ${r.members} murid`) : null), h('b', {}, fmt(r.points)))) : h('p', { class: 'muted' }, 'Belum ada data. Jadilah yang pertama!'),
      d.me && !d.rows.some((r) => r.me) ? h('p', {}, `Kedudukan anda: #${d.me.rank} (${fmt(d.me.points)} mata)`) : null));
  };
  types.forEach(([t, l]) => tabs.append(h('button', { role: 'tab', onclick: () => load(t) }, l)));
  clear(el).append(h('h1', {}, '🏆 Papan Pendahulu'), h('p', { class: 'muted' }, 'Hanya nama samaran dipaparkan. Kedudukan berdasarkan mata seumur hidup.'), tabs, box);
  await load('individual');
}

/* ------------------------------------------------------------------ 7. Profile */
async function profile(el, _p, ctx) {
  const [p, pts] = await Promise.all([api('/api/student/profile'), api('/api/student/points')]);
  ctx.setPoints(p.points.balance, p.points.lifetime);
  let chosen = p.avatar;
  const nick = h('input', { value: p.display_name, maxlength: 24 });
  const avs = h('div', { class: 'avatars' });
  const draw = () => clear(avs).append(...p.avatars.map((a) => h('button', { type: 'button', class: a === chosen ? 'on' : '', 'aria-label': a, onclick: () => { chosen = a; draw(); } }, AV[a])));
  draw();
  const TYPE = { correct_answer: 'Jawapan betul', level_complete: 'Tamat tahap', perfect_score: 'Markah penuh', world_complete: 'Tamat dunia', daily: 'Cabaran harian', redeem: 'Tebus hadiah', refund: 'Bayaran balik', adjustment: 'Pelarasan' };
  clear(el).append(h('h1', {}, '🧑 Profil Saya'),
    h('div', { class: 'grid g2' }, card('Maklumat', h('p', {}, h('b', {}, 'ID: '), p.username), h('p', {}, h('b', {}, 'Tahun/Kelas: '), `${p.year} · ${p.class_name || '-'}`), h('p', {}, h('b', {}, 'Tahap Pahlawan: '), p.player.level), h('p', {}, `🪙 ${fmt(p.points.balance)} boleh tebus · 🏅 ${fmt(p.points.lifetime)} seumur hidup`),
      field('Nama samaran', nick), h('p', { style: 'font-weight:700' }, 'Avatar'), avs, h('button', { class: 'btn primary', style: 'margin-top:1rem', onclick: async () => { try { await api('/api/student/profile', { method: 'PATCH', body: { display_name: nick.value, avatar: chosen } }); toast('Profil dikemas kini!'); } catch (e) { toast(e.message, 'err'); } } }, 'Simpan')),
    card('Kemajuan Dunia', p.worlds.map((w) => h('div', { style: 'margin-bottom:.6rem' }, h('div', { class: 'row between' }, h('span', {}, `${w.icon} ${w.name}`), h('small', {}, `${w.passed}/${w.total} · ⭐${w.stars}`)), progressBar((w.passed / w.total) * 100))))),
    card('Ketepatan Mengikut Topik', p.accuracy.length ? bars(p.accuracy.map((a) => ({ label: a.name, value: a.accuracy, warn: a.weak })), { max: 100, unit: '%' }) : h('p', { class: 'muted' }, 'Main beberapa tahap untuk melihat prestasi anda.')),
    card('Sejarah Mata', table(['Tarikh', 'Jenis', 'Butiran', 'Mata tebus', 'Baki'], pts.transactions.map((t) => [fmtDate(t.created_at), TYPE[t.type] || t.type, t.reason || '', h('b', { class: t.balance_delta >= 0 ? 'ok' : 'err' }, (t.balance_delta > 0 ? '+' : '') + t.balance_delta), fmt(t.balance_after)]))));
}

/* ------------------------------------------------------------------ change password (all roles) */
async function account(el, _p, ctx) {
  const old = h('input', { type: 'password', autocomplete: 'current-password' });
  const nw = h('input', { type: 'password', autocomplete: 'new-password' });
  clear(el).append(h('h1', {}, '🔑 Akaun'), card('Tukar Kata Laluan', field('Kata laluan semasa', old), field('Kata laluan baharu', nw, 'Sekurang-kurangnya 8 aksara dengan huruf dan nombor.'),
    h('button', { class: 'btn primary', onclick: async () => { try { await api('/api/auth/change-password', { method: 'POST', body: { old_password: old.value, new_password: nw.value } }); toast('Kata laluan ditukar.'); old.value = nw.value = ''; } catch (e) { toast(e.message, 'err'); } } }, 'Simpan')));
  void ctx;
}
