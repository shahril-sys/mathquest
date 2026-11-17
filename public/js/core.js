/* Shared helpers: API client, safe DOM builder, dialogs, sound, effects, SVG visuals. No innerHTML with data anywhere. */

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method, credentials: 'same-origin',
    headers: { 'X-Requested-With': 'mathquest', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error(data?.error || 'Ralat tidak diketahui.');
    err.status = res.status; err.code = data?.code;
    if (res.status === 401 && path !== '/api/auth/login') window.dispatchEvent(new Event('mq:unauth'));
    if (res.status === 403 && data?.code === 'tukar_kata_laluan') window.dispatchEvent(new Event('mq:setup'));
    throw err;
  }
  return data;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function h(tag, attrs, ...children) {
  const svg = ['svg', 'path', 'circle', 'rect', 'line', 'g', 'text', 'polygon', 'ellipse', 'polyline'].includes(tag);
  const el = svg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.setAttribute('class', v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'value' && !svg) el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected') { if (v) el.setAttribute(k, ''); if (k === 'checked') el.checked = !!v; }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('en-US').replace(/,/g, '\u00a0'));
export const AV = { fox: '🦊', panda: '🐼', lion: '🦁', rabbit: '🐰', tiger: '🐯', owl: '🦉', dino: '🦖', robot: '🤖', unicorn: '🦄', koala: '🐨' };
export const avatar = (a) => AV[a] || '🙂';
export const DIFF = { mudah: 'Mudah', sederhana: 'Sederhana', sukar: 'Sukar', pakar: 'Pakar' };
export const STATUS = { menunggu: 'Menunggu Kelulusan', diluluskan: 'Diluluskan', sedia: 'Sedia Dituntut', dituntut: 'Telah Dituntut', ditolak: 'Ditolak', dibatalkan: 'Dibatalkan' };
export const statusBadge = (s) => h('span', { class: `badge st-${s}` }, STATUS[s] || s);
export const fmtDate = (s) => (s ? new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

/* ------------------------------------------------------------ toast & modal */
export function toast(msg, type = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: `toast ${type}`, role: type === 'err' ? 'alert' : 'status' }, msg);
  box.append(t);
  setTimeout(() => t.remove(), type === 'err' ? 6000 : 3500);
}

export function modal({ title, body, actions = [], wide = false }) {
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const overlay = h('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) close(); } },
    h('div', { class: `dialog${wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', {}, title), h('div', { class: 'dialog-body' }, body),
      h('div', { class: 'dialog-actions' }, actions.map((a) => h('button', { class: `btn ${a.class || ''}`, onclick: async (ev) => {
        if (a.onClick) { ev.target.disabled = true; try { const keep = await a.onClick(); if (keep !== false) close(); } catch (e) { toast(e.message, 'err'); ev.target.disabled = false; } } else close();
      } }, a.label)))));
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  overlay.querySelector('button, input, select, textarea')?.focus();
  return close;
}

export const confirmBox = (title, text, okLabel = 'Ya, teruskan') => new Promise((resolve) => {
  modal({ title, body: h('p', {}, text), actions: [{ label: 'Batal', class: 'ghost', onClick: () => { resolve(false); } }, { label: okLabel, class: 'primary', onClick: () => { resolve(true); } }] });
});

/* ------------------------------------------------------------ preferences, sound, motion */
export const prefs = {
  get muted() { return localStorage.getItem('mq_muted') === '1'; },
  set muted(v) { localStorage.setItem('mq_muted', v ? '1' : '0'); },
  get calm() { return localStorage.getItem('mq_calm') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
  set calm(v) { localStorage.setItem('mq_calm', v ? '1' : '0'); document.documentElement.classList.toggle('calm', v); },
};
document.documentElement.classList.toggle('calm', prefs.calm);

let ctx;
export function sound(kind) {
  if (prefs.muted) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const seqs = { ok: [[660, 0.09], [880, 0.12]], bad: [[220, 0.18]], win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]], coin: [[988, 0.06], [1319, 0.14]], click: [[500, 0.04]] };
    let t = ctx.currentTime;
    for (const [f, d] of seqs[kind] || []) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = kind === 'bad' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d); t += d;
    }
  } catch { /* audio unavailable */ }
}

export function confetti() {
  if (prefs.calm) return;
  const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff'];
  for (let i = 0; i < 40; i++) layer.append(h('i', { style: `left:${Math.random() * 100}%;background:${colors[i % 5]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.6 + Math.random()}s` }));
  document.body.append(layer);
  setTimeout(() => layer.remove(), 3200);
}

/* ------------------------------------------------------------ small widgets */
export const progressBar = (pct, label) => h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label || 'Kemajuan' }, h('span', { style: `width:${Math.max(0, Math.min(100, pct))}%` }));
export const stars = (n, total = 3) => h('span', { class: 'stars', 'aria-label': `${n} daripada ${total} bintang` }, Array.from({ length: total }, (_, i) => h('span', { class: i < n ? 'on' : '' }, '★')));
export const card = (title, ...kids) => h('section', { class: 'card' }, title ? h('h2', {}, title) : null, ...kids);
export const stat = (icon, label, value, cls = '') => h('div', { class: `stat ${cls}` }, h('div', { class: 'stat-icon' }, icon), h('div', {}, h('div', { class: 'stat-val' }, value), h('div', { class: 'stat-lbl' }, label)));
export const field = (label, input, hint) => h('label', { class: 'field' }, h('span', {}, label), input, hint ? h('small', {}, hint) : null);
export const select = (opts, value, attrs = {}) => h('select', attrs, opts.map(([v, t]) => h('option', { value: v, selected: String(v) === String(value) }, t)));

export function table(headers, rows, empty = 'Tiada data.') {
  if (!rows.length) return h('p', { class: 'muted' }, empty);
  return h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, headers.map((x) => h('th', {}, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c)))))));
}

export function bars(items, { max, unit = '' } = {}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return h('div', { class: 'hbars' }, items.map((i) => h('div', { class: 'hbar' }, h('span', { class: 'hl' }, i.label), h('div', { class: 'hb' }, h('span', { class: i.warn ? 'warn' : '', style: `width:${Math.min(100, (i.value / top) * 100)}%` })), h('span', { class: 'hv' }, `${i.value}${unit}`))));
}

/* ------------------------------------------------------------ SVG / emoji visuals for questions */
export function visual(v) {
  if (!v) return null;
  if (v.kind === 'objects') return h('div', { class: 'objs' }, Array.from({ length: v.count }, () => h('span', {}, v.emoji)));
  if (v.kind === 'groups') return h('div', { class: 'groups' }, v.groups.map((g, i) => h('span', { class: 'grp-wrap' }, i > 0 ? h('b', { class: 'op' }, v.op || '+') : null, h('span', { class: 'grp' }, Array.from({ length: g.count }, () => h('span', {}, g.emoji))))));
  if (v.kind === 'pie') {
    const r = 70; const cx = 80; const cy = 80;
    const slices = Array.from({ length: v.parts }, (_, i) => {
      const a0 = (i / v.parts) * 2 * Math.PI - Math.PI / 2; const a1 = ((i + 1) / v.parts) * 2 * Math.PI - Math.PI / 2;
      const d = v.parts === 1 ? `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0` : `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
      return h('path', { d, fill: i < v.shaded ? '#ff8a3d' : '#fff7e6', stroke: '#7a4b12', 'stroke-width': 2 });
    });
    return h('svg', { viewBox: '0 0 160 160', class: 'vis', role: 'img', 'aria-label': `Bulatan dibahagi ${v.parts} bahagian, ${v.shaded} berwarna` }, slices);
  }
  if (v.kind === 'clock') {
    const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 2 * Math.PI; return h('line', { x1: 80 + 62 * Math.sin(a), y1: 80 - 62 * Math.cos(a), x2: 80 + 70 * Math.sin(a), y2: 80 - 70 * Math.cos(a), stroke: '#333', 'stroke-width': 3 }); });
    const nums = Array.from({ length: 12 }, (_, i) => { const n = i + 1; const a = (n / 12) * 2 * Math.PI; return h('text', { x: 80 + 52 * Math.sin(a), y: 80 - 52 * Math.cos(a) + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#333' }, n); });
    const hourA = (((v.h % 12) + v.m / 60) / 12) * 2 * Math.PI; const minA = (v.m / 60) * 2 * Math.PI;
    return h('svg', { viewBox: '0 0 160 160', class: 'vis', role: 'img', 'aria-label': 'Muka jam' }, h('circle', { cx: 80, cy: 80, r: 76, fill: '#fff', stroke: '#4d96ff', 'stroke-width': 5 }), ticks, nums,
      h('line', { x1: 80, y1: 80, x2: 80 + 34 * Math.sin(hourA), y2: 80 - 34 * Math.cos(hourA), stroke: '#222', 'stroke-width': 6, 'stroke-linecap': 'round' }),
      h('line', { x1: 80, y1: 80, x2: 80 + 54 * Math.sin(minA), y2: 80 - 54 * Math.cos(minA), stroke: '#e03131', 'stroke-width': 4, 'stroke-linecap': 'round' }), h('circle', { cx: 80, cy: 80, r: 5, fill: '#222' }));
  }
  if (v.kind === 'ruler') {
    const W = 300; const step = W / 16;
    const ticks = Array.from({ length: 17 }, (_, i) => h('g', {}, h('line', { x1: 10 + i * step, y1: 50, x2: 10 + i * step, y2: 66, stroke: '#333', 'stroke-width': 2 }), h('text', { x: 10 + i * step, y: 82, 'text-anchor': 'middle', 'font-size': 11, fill: '#333' }, i)));
    return h('svg', { viewBox: '0 0 320 100', class: 'vis wide', role: 'img', 'aria-label': `Pembaris dengan pensel sepanjang ${v.length} sentimeter` }, h('rect', { x: 4, y: 44, width: 312, height: 46, fill: '#ffe08a', stroke: '#b8860b', rx: 4 }), ticks,
      h('rect', { x: 10, y: 14, width: v.length * step, height: 20, fill: '#ffd43b', stroke: '#9c6b00' }), h('polygon', { points: `${10 + v.length * step},14 ${10 + v.length * step + 14},24 ${10 + v.length * step},34`, fill: '#f4a261', stroke: '#9c6b00' }));
  }
  if (v.kind === 'rect' || v.kind === 'tri' || v.kind === 'cuboid') {
    const w = v.w ?? v.b ?? v.l; const hh = v.h; const unit = v.unit || 'cm';
    if (v.kind === 'cuboid') return h('svg', { viewBox: '0 0 220 160', class: 'vis', role: 'img', 'aria-label': 'Kuboid' }, h('polygon', { points: '30,60 130,60 130,140 30,140', fill: '#a5d8ff', stroke: '#1c7ed6', 'stroke-width': 2 }), h('polygon', { points: '30,60 70,25 170,25 130,60', fill: '#d0ebff', stroke: '#1c7ed6', 'stroke-width': 2 }), h('polygon', { points: '130,60 170,25 170,105 130,140', fill: '#74c0fc', stroke: '#1c7ed6', 'stroke-width': 2 }),
      h('text', { x: 80, y: 158, 'text-anchor': 'middle', 'font-size': 13 }, `${v.l} ${unit}`), h('text', { x: 190, y: 70, 'font-size': 13 }, `${v.h} ${unit}`), h('text', { x: 62, y: 20, 'font-size': 13 }, `${v.w} ${unit}`));
    const base = Math.max(w, hh); const sw = 150 * (w / base) + 30; const sh = 90 * (hh / base) + 20;
    return h('svg', { viewBox: '0 0 220 160', class: 'vis', role: 'img', 'aria-label': v.kind === 'rect' ? 'Segi empat tepat' : 'Segi tiga' },
      v.kind === 'rect' ? h('rect', { x: 30, y: 20, width: sw, height: sh, fill: '#b2f2bb', stroke: '#2f9e44', 'stroke-width': 3 }) : h('polygon', { points: `30,${20 + sh} ${30 + sw},${20 + sh} ${30 + sw / 3},20`, fill: '#ffd8a8', stroke: '#e8590c', 'stroke-width': 3 }),
      h('text', { x: 30 + sw / 2, y: 40 + sh + 12, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700 }, `${w} ${unit}`),
      v.hideH ? h('text', { x: 36 + sw, y: 20 + sh / 2, 'font-size': 14, 'font-weight': 700 }, '? cm') : h('text', { x: 36 + sw, y: 20 + sh / 2, 'font-size': 14, 'font-weight': 700 }, `${hh} ${unit}`));
  }
  return null;
}
