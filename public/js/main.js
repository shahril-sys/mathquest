import { api, h, clear, toast, modal, prefs, sound, avatar, fmt, field } from './core.js';
import * as student from './student.js';
import * as game from './game.js';
import * as staff from './staff.js';
import * as admin from './admin.js';

const routes = [...student.routes, ...game.routes, ...staff.routes, ...admin.routes];
const root = document.getElementById('app');
const ctx = { user: null, info: null, points: null, setPoints(b, l) { this.points = { balance: b, lifetime: l }; const el = document.getElementById('chip-points'); if (el) el.textContent = `🪙 ${fmt(b)}`; } };

const NAV = {
  murid: [['#/', '🏠 Utama'], ['#/peta', '🗺️ Peta Dunia'], ['#/kedai', '🛍️ Kedai Ganjaran'], ['#/papan', '🏆 Papan Pendahulu'], ['#/lencana', '🎖️ Lencana'], ['#/tebusan', '📦 Tebusan Saya'], ['#/profil', '🧑 Profil']],
  guru: [['#/guru', '📊 Papan Pemuka'], ['#/guru/cabaran', '📝 Cabaran'], ['#/guru/tahap', '🎚️ Ambang Lulus'], ['#/guru/tebusan', '📦 Tebusan'], ['#/papan', '🏆 Papan Pendahulu'], ['#/akaun', '🔑 Akaun']],
  pentadbir: [['#/admin', '📊 Papan Pemuka'], ['#/admin/soalan', '❓ Soalan'], ['#/admin/tahap', '🎚️ Tahap'], ['#/admin/mata', '🪙 Mata'], ['#/admin/hadiah', '🎁 Hadiah'], ['#/admin/tebusan', '✅ Kelulusan'], ['#/admin/pengguna', '👥 Pengguna'], ['#/admin/laporan', '📈 Laporan'], ['#/admin/tetapan', '⚙️ Tetapan'], ['#/papan', '🏆 Papan']],
};
const HOME = { murid: '#/', guru: '#/guru', pentadbir: '#/admin' };

function matchRoute(path) {
  for (const r of routes) {
    const names = [];
    const re = new RegExp('^' + r.path.replace(/:([a-z]+)/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '$');
    const m = re.exec(path);
    if (m) return { r, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

function layout() {
  const u = ctx.user;
  const content = h('main', { id: 'content', tabindex: '-1' });
  const muteBtn = h('button', { class: 'iconbtn', title: 'Bunyi', 'aria-label': 'Hidup atau matikan bunyi', 'aria-pressed': String(!prefs.muted), onclick: () => { prefs.muted = !prefs.muted; muteBtn.textContent = prefs.muted ? '🔇' : '🔊'; muteBtn.setAttribute('aria-pressed', String(!prefs.muted)); sound('click'); } }, prefs.muted ? '🔇' : '🔊');
  const calmBtn = h('button', { class: 'iconbtn', title: 'Kurangkan animasi', 'aria-label': 'Kurangkan animasi', 'aria-pressed': String(prefs.calm), onclick: () => { prefs.calm = !prefs.calm; calmBtn.setAttribute('aria-pressed', String(prefs.calm)); toast(prefs.calm ? 'Animasi dikurangkan.' : 'Animasi dihidupkan.'); } }, '🐢');
  const links = [...NAV[u.role], ...(u.role === 'pentadbir' && u.is_platform_admin ? [['#/platform/sekolah', '🏫 Sekolah']] : [])];
  const nav = h('nav', { class: 'nav', 'aria-label': 'Menu utama' }, links.map(([href, label]) => h('a', { href }, label)));
  clear(root).append(
    h('header', { class: 'topbar' }, h('div', { class: 'topbar-in' },
      h('a', { class: 'logo', href: HOME[u.role] }, '🧭 MathQuest ', h('span', {}, 'Adventure')), nav,
      h('div', { class: 'chips' }, u.role === 'murid' ? h('span', { class: 'chip', id: 'chip-points', title: 'Mata boleh tebus' }, '🪙 …') : h('span', { class: 'chip' }, u.display_name), muteBtn, calmBtn,
        h('button', { class: 'iconbtn', title: 'Log keluar', 'aria-label': 'Log keluar', onclick: async () => { await api('/api/auth/logout', { method: 'POST', body: {} }); ctx.user = null; location.hash = ''; render(); } }, '🚪')))),
    content);
  if (ctx.points) ctx.setPoints(ctx.points.balance, ctx.points.lifetime);
  return content;
}

async function render() {
  window.scrollTo(0, 0);
  if (!ctx.user) {
    try { ctx.user = (await api('/api/auth/me')).user; } catch { ctx.user = null; }
  }
  if (!ctx.user) return loginPage();
  if (ctx.user.must_change_password) return setupPage();
  const path = location.hash.replace(/^#/, '') || '/';
  const m = matchRoute(path);
  if (!m || (m.r.roles && !m.r.roles.includes(ctx.user.role))) { location.hash = HOME[ctx.user.role]; if (path !== '/' || ctx.user.role !== 'murid') return; }
  const content = layout();
  const here = location.hash || '#/';
  content.parentElement.querySelectorAll('.nav a').forEach((a) => { const hr = a.getAttribute('href'); a.classList.toggle('active', hr === here || (hr !== '#/' && hr !== '#/guru' && hr !== '#/admin' && here.startsWith(hr))); });
  if (ctx.user.role === 'murid' && !ctx.points) api('/api/student/home').then((d) => ctx.setPoints(d.points.balance, d.points.lifetime)).catch(() => {});
  try { await (m ? m.r : routes[0]).render(content, m?.params || {}, ctx); } catch (e) {
    if (e.status === 401) return;
    clear(content).append(h('div', { class: 'card' }, h('h2', {}, 'Alamak! Ada masalah'), h('p', { class: 'err' }, e.message), h('a', { class: 'btn primary', href: HOME[ctx.user.role] }, 'Kembali')));
  }
  content.focus({ preventScroll: true });
}

function loginPage() {
  const err = h('p', { class: 'err', role: 'alert' });
  const user = h('input', { id: 'username', autocomplete: 'username', required: true, maxlength: 40, autocapitalize: 'off', placeholder: 'cth: M26001' });
  const pass = h('input', { id: 'password', type: 'password', autocomplete: 'current-password', required: true, maxlength: 100 });
  const btn = h('button', { class: 'btn primary big', type: 'submit', style: 'width:100%' }, 'Mulakan Pengembaraan 🚀');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true;
    try { ctx.user = (await api('/api/auth/login', { method: 'POST', body: { username: user.value, password: pass.value } })).user; ctx.points = null; location.hash = HOME[ctx.user.role]; render(); } catch (x) { err.textContent = x.message; btn.disabled = false; pass.value = ''; pass.focus(); }
  } }, h('label', { class: 'field' }, h('span', {}, 'ID Murid / Pengguna'), user), h('label', { class: 'field' }, h('span', {}, 'Kata Laluan'), pass), err, btn);
  clear(root).append(h('div', { class: 'login-wrap' }, h('div', { class: 'login-card' }, h('div', { class: 'mascot' }, '🦊'), h('h1', {}, 'MathQuest Adventure'), h('p', { class: 'muted' }, 'Misi Matematik & Ganjaran'), form,
    h('p', { class: 'muted', style: 'font-size:.85rem' }, 'Tiada akaun? Minta guru atau pentadbir sekolah mendaftarkan anda. Kami tidak meminta nombor kad pengenalan.'))));
  user.focus();
}

function setupPage() {
  const u = ctx.user;
  const isStudent = u.role === 'murid';
  let chosen = u.avatar || 'fox';
  const err = h('p', { class: 'err', role: 'alert' });
  const old = h('input', { type: 'password', autocomplete: 'current-password', required: true });
  const nw = h('input', { type: 'password', autocomplete: 'new-password', required: true, minlength: 8 });
  const nick = h('input', { value: u.display_name, maxlength: 24, required: true });
  const avs = h('div', { class: 'avatars', role: 'radiogroup', 'aria-label': 'Pilih avatar' });
  const drawAv = () => {
    clear(avs).append(...['fox', 'panda', 'lion', 'rabbit', 'tiger', 'owl', 'dino', 'robot', 'unicorn', 'koala'].map((a) => h('button', {
      type: 'button', class: a === chosen ? 'on' : '', 'aria-label': a, role: 'radio', 'aria-checked': String(a === chosen), onclick: () => { chosen = a; drawAv(); sound('click'); },
    }, avatar(a))));
  };
  drawAv();
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault(); err.textContent = '';
    try {
      const body = { old_password: old.value, new_password: nw.value };
      if (isStudent) await api('/api/auth/setup', { method: 'POST', body: { ...body, nickname: nick.value, avatar: chosen } });
      else await api('/api/auth/change-password', { method: 'POST', body });
      ctx.user = (await api('/api/auth/me')).user; toast('Akaun siap disediakan!'); location.hash = HOME[ctx.user.role]; render();
    } catch (x) { err.textContent = x.message; }
  } },
  field('Kata laluan sementara (daripada guru)', old), field('Kata laluan baharu', nw, 'Sekurang-kurangnya 8 aksara, mengandungi huruf dan nombor.'),
  isStudent ? [field('Nama samaran (dipaparkan pada papan pendahulu)', nick, 'Jangan guna nama penuh, nombor telefon atau maklumat peribadi.'), h('p', { style: 'font-weight:700' }, 'Pilih avatar anda:'), avs] : null,
  err, h('button', { class: 'btn primary big', type: 'submit', style: 'width:100%;margin-top:1rem' }, 'Simpan & Mula'));
  clear(root).append(h('div', { class: 'login-wrap' }, h('div', { class: 'login-card' }, h('div', { class: 'mascot' }, '🎒'), h('h1', {}, 'Sediakan Akaun Anda'), h('p', { class: 'muted' }, `Selamat datang, ${u.display_name}!`), form,
    h('button', { class: 'btn ghost sm', onclick: async () => { await api('/api/auth/logout', { method: 'POST', body: {} }); ctx.user = null; render(); } }, 'Log keluar'))));
}

window.addEventListener('hashchange', render);
window.addEventListener('mq:unauth', () => { ctx.user = null; render(); });
window.addEventListener('mq:setup', () => { if (ctx.user) { ctx.user.must_change_password = 1; render(); } });
render();
void modal;
