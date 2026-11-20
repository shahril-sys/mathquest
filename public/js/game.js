import { api, h, clear, toast, sound, confetti, fmt, visual, stars, card, prefs } from './core.js';

export const routes = [
  { path: '/main/:id', roles: ['murid'], render: play },
  { path: '/hasil/:id', roles: ['murid'], render: result },
];

let timerHandle = null;
const stopTimer = () => { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } };
window.addEventListener('hashchange', stopTimer);
const PRAISE = ['Hebat! 🎉', 'Betul! ⭐', 'Bagus sekali! 👏', 'Tepat sekali! 🚀', 'Pandai! 🌟', 'Syabas! 🏅'];
const TRY = ['Tidak mengapa, cuba lagi! 💪', 'Hampir betul! Mari lihat caranya. 🔍', 'Belajar daripada kesilapan membuatkan kita lebih pandai! 📚'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ------------------------------------------------------------------ 5. Mathematics challenge page */
async function play(el, params, ctx) {
  stopTimer();
  const sid = Number(params.id);
  const st = await api(`/api/sessions/${sid}`);
  if (st.status === 'finished') { location.hash = `#/hasil/${sid}`; return; }
  if (st.status !== 'active') { toast('Sesi ini sudah tamat.', 'err'); location.hash = '#/peta'; return; }
  const results = [...st.answered];
  const streak = () => { let n = 0; for (let i = results.length - 1; i >= 0 && results[i]; i--) n++; return n; };
  let idx = st.current;
  const title = st.kind === 'daily' ? '⚡ Cabaran Harian' : `${st.level.world_name} · Tahap ${st.level.level_no}: ${st.level.title}`;
  const wrap = h('div', { class: 'game' });
  clear(el).append(wrap);

  const dots = () => h('div', { class: 'dots', 'aria-hidden': 'true' }, Array.from({ length: st.total }, (_, i) => h('i', { class: i < results.length ? (results[i] ? 't' : 'f') : i === idx ? 'c' : '' })));

  async function show() {
    stopTimer();
    if (idx >= st.total) return finish();
    const q = st.questions[idx];
    let remainingMs = null;
    try { remainingMs = (await api(`/api/sessions/${sid}/begin`, { method: 'POST', body: { idx } })).remaining_ms; } catch (e) { toast(e.message, 'err'); }
    let locked = false;
    const feedback = h('div', { 'aria-live': 'polite' });
    const hintBox = h('div', { class: 'muted', style: 'margin:.5rem 0;font-weight:700' });
    const body = h('div');
    const timerBar = q.time_limit_sec ? h('span', { style: 'width:100%' }) : null;

    const submit = async (response, controls) => {
      if (locked) return;
      locked = true; stopTimer();
      controls.forEach((c) => { c.disabled = true; });
      let r;
      try { r = await api(`/api/sessions/${sid}/answer`, { method: 'POST', body: { idx, response } }); } catch (e) { toast(e.message, 'err'); locked = false; controls.forEach((c) => { c.disabled = false; }); return; }
      results.push(r.correct);
      sound(r.correct ? 'ok' : 'bad');
      if (r.correct) { feedback.append(h('div', { class: 'feedback good' }, h('b', {}, pick(PRAISE)))); } else {
        feedback.append(h('div', { class: 'feedback bad' }, h('b', {}, r.timed_out ? '⏰ Masa tamat! ' : '', pick(TRY)), h('p', {}, 'Jawapan betul: ', h('b', {}, r.answer_text)), h('b', {}, 'Langkah penyelesaian:'), h('pre', {}, r.explanation)));
      }
      feedback.append(h('button', { class: `btn ${r.correct ? 'good' : 'primary'} big`, style: 'margin-top:.8rem', autofocus: true, onclick: () => { idx++; show(); } }, idx + 1 >= st.total ? 'Lihat Keputusan 🏁' : 'Soalan Seterusnya ➜'));
      feedback.querySelector('button').focus();
      return r;
    };

    // input widgets by question input kind
    if (q.input === 'mcq') {
      const btns = q.options.map((o, i) => h('button', { class: 'opt', onclick: async (ev) => { ev.currentTarget.classList.add('pick'); await submit({ choice: i }, btns); } }, o));
      body.append(h('div', { class: 'opts' }, btns));
    } else if (q.input === 'number' || q.input === 'count') {
      const input = h('input', { inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Jawapan anda', maxlength: 20, placeholder: '?' });
      const go = h('button', { class: 'btn primary big', onclick: () => { if (input.value.trim() === '') { toast('Taip jawapan anda dahulu.', 'err'); return; } submit({ value: input.value }, [go, input]); } }, 'Semak ✔');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); });
      if (q.input === 'count') {
        let counted = 0;
        const objs = h('div', { class: 'objs', role: 'group', 'aria-label': 'Sentuh setiap objek untuk mengira' }, Array.from({ length: q.visual.count }, () => {
          const b = h('button', { type: 'button', onclick: () => { if (b.classList.contains('counted') || locked) return; counted++; b.classList.add('counted'); b.append(h('b', {}, counted)); input.value = counted; sound('click'); } }, q.visual.emoji);
          return b;
        }));
        body.append(objs);
      }
      body.append(h('div', { class: 'numin', style: 'margin-top:1rem' }, input, q.unit ? h('b', {}, q.unit) : null, go));
      setTimeout(() => (q.input === 'count' ? null : input.focus()), 50);
    } else if (q.input === 'match') body.append(matchUI(q, (order, ctl) => submit({ order }, ctl)));

    let hintBtn = h('button', { class: 'btn ghost sm', onclick: async () => { try { const hnt = await api(`/api/sessions/${sid}/hint`, { method: 'POST', body: { idx } }); hintBox.textContent = `💡 ${hnt.hint}`; hintBtn.disabled = true; } catch (e) { toast(e.message, 'err'); } } }, '💡 Petunjuk');

    clear(wrap).append(h('div', { class: 'row between' }, h('a', { href: st.level ? `#/peta/${st.level.world_code}` : '#/' }, '✕ Keluar (kemajuan sesi disimpan)'), h('b', { 'aria-live': 'polite' }, `✔ ${results.filter(Boolean).length}`, streak() >= 3 ? ` · 🔥 ×${streak()}` : '')), h('h2', { style: 'margin-top:.5rem' }, title), dots(),
      h('div', { class: 'qcard' }, h('div', { class: 'qmeta' }, h('span', {}, `Soalan ${idx + 1} / ${st.total}`), h('span', {}, q.time_limit_sec ? `⏱️ ${q.time_limit_sec}s` : ' ')),
        timerBar ? h('div', { class: 'timer', role: 'timer', 'aria-label': 'Baki masa' }, timerBar) : null,
        h('div', { class: 'qtext' }, q.text), q.input === 'count' ? null : visual(q.visual), hintBox, body, h('div', { style: 'margin-top:1rem' }, hintBtn), feedback));

    if (timerBar && remainingMs != null) {
      const end = performance.now() + remainingMs;
      timerHandle = setInterval(() => {
        const left = Math.max(0, end - performance.now());
        timerBar.style.width = `${(left / (q.time_limit_sec * 1000)) * 100}%`;
        if (left <= 0 && !locked) {
          const ctl = [...wrap.querySelectorAll('button.opt, .numin button, .numin input, .match button')];
          submit(q.input === 'mcq' ? { choice: -1 } : q.input === 'match' ? { order: [] } : { value: '' }, ctl);
        }
      }, 200);
    }
  }

  async function finish() {
    clear(wrap).append(h('div', { class: 'card center' }, h('div', { class: 'chest' }, '🎁'), h('p', {}, 'Mengira mata anda...')));
    try { await api(`/api/sessions/${sid}/finish`, { method: 'POST', body: {} }); location.hash = `#/hasil/${sid}`; } catch (e) { toast(e.message, 'err'); location.hash = '#/peta'; }
  }
  void ctx; void prefs;
  await show();
}

/* drag-and-drop matching with tap-to-select fallback (touch / keyboard friendly) */
function matchUI(q, onSubmit) {
  const assign = Array(q.lefts.length).fill(null);
  let selected = null;
  const box = h('div');
  const check = h('button', { class: 'btn primary big', disabled: true, style: 'margin-top:1rem', onclick: () => onSubmit(assign.slice(), [check, ...box.querySelectorAll('button')]) }, 'Semak ✔');
  const place = (chipIdx, slotIdx) => { const prev = assign.indexOf(chipIdx); if (prev >= 0) assign[prev] = null; assign[slotIdx] = chipIdx; selected = null; draw(); };
  function draw() {
    clear(box).append(
      h('div', { class: 'match' }, q.lefts.map((l, i) => h('div', { class: 'match-row' }, h('div', { class: 'mlabel' }, l),
        h('button', { class: `slot${assign[i] != null ? ' filled' : ''}`, 'aria-label': `Padankan ${l}`, ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('over'); }, ondragleave: (e) => e.currentTarget.classList.remove('over'),
          ondrop: (e) => { e.preventDefault(); const c = Number(e.dataTransfer.getData('text/plain')); if (Number.isInteger(c)) place(c, i); },
          onclick: () => { if (selected != null) place(selected, i); else if (assign[i] != null) { assign[i] = null; draw(); } } }, assign[i] != null ? q.rights[assign[i]] : 'Letak di sini')))),
      h('div', { class: 'tray' }, q.rights.map((r, c) => h('button', { type: 'button', class: `chipd${assign.includes(c) ? ' used' : ''}${selected === c ? ' sel' : ''}`, draggable: 'true', ondragstart: (e) => { e.dataTransfer.setData('text/plain', String(c)); }, onclick: () => { selected = selected === c ? null : c; draw(); } }, r))),
      h('p', { class: 'muted center' }, 'Seret jawapan ke petak, atau sentuh jawapan dahulu kemudian sentuh petak.'), check);
    check.disabled = assign.some((a) => a == null);
  }
  draw();
  return box;
}

/* ------------------------------------------------------------------ 6. Level completion page */
async function result(el, params, ctx) {
  const st = await api(`/api/sessions/${params.id}`);
  const r = st.result;
  if (!r) { location.hash = `#/main/${params.id}`; return; }
  ctx.setPoints(r.balance, r.lifetime);
  const isLevel = r.kind === 'level';
  const back = isLevel ? `#/peta/${st.level.world_code}` : '#/';
  clear(el).append(h('div', { class: 'game' }, h('section', { class: 'card result' },
    h('div', { class: 'chest', 'aria-hidden': 'true' }, r.passed ? '🏆' : '💪'), h('h1', {}, r.passed ? (r.percent === 100 ? 'Sempurna! Luar biasa!' : 'Tahniah! Anda lulus!') : 'Hampir berjaya! Cuba lagi!'),
    h('div', { class: 'big-stars' }, stars(r.stars)), h('p', { style: 'font-size:1.3rem' }, `Skor: ${r.correct}/${r.total} (${r.percent}%) · Perlu ${r.pass_percent}% untuk lulus`),
    r.world_completed ? h('p', { class: 'ok', style: 'font-size:1.2rem' }, `🌍 Anda menamatkan dunia ${r.level.world_name}!`) : null,
    h('div', { style: 'max-width:420px;margin:1rem auto;text-align:left' }, r.awards.length ? r.awards.map((a) => h('div', { class: 'award' }, h('span', {}, a.label), h('span', {}, `+${a.points} 🪙`))) : h('p', { class: 'muted center' }, r.passed ? 'Tiada mata baharu. Mata hanya diberi sekali bagi setiap soalan/tahap yang telah dicapai.' : 'Lulus tahap ini untuk mendapat bonus mata.'),
      h('div', { class: 'award', style: 'background:#e6f6ff' }, h('b', {}, 'Jumlah mata baharu'), h('b', {}, `+${r.points_earned} 🪙`))),
    h('p', { class: 'muted' }, `Baki mata boleh tebus: ${fmt(r.balance)} · Mata seumur hidup: ${fmt(r.lifetime)}`),
    h('div', { class: 'row', style: 'justify-content:center;margin-top:1rem' },
      r.passed && r.next_level ? h('button', { class: 'btn good big', onclick: async () => { try { const s = await api(`/api/student/levels/${r.next_level.id}/start`, { method: 'POST', body: {} }); location.hash = `#/main/${s.id}`; } catch (e) { toast(e.message, 'err'); } } }, `Tahap Seterusnya ➜`) : null,
      isLevel ? h('button', { class: 'btn primary', onclick: async () => { try { const s = await api(`/api/student/levels/${r.level.id}/start`, { method: 'POST', body: {} }); location.hash = `#/main/${s.id}`; } catch (e) { toast(e.message, 'err'); } } }, r.passed ? 'Main Semula' : 'Cuba Lagi 🔁') : null,
      h('a', { class: 'btn', href: back }, isLevel ? 'Peta Dunia' : 'Utama')))));
  if (r.passed) { sound('win'); confetti(); } else sound('bad');
  celebrateBadges(r.new_badges || []);
}

function celebrateBadges(list) {
  const next = () => {
    const b = list.shift();
    if (!b) return;
    sound('win'); confetti();
    const ov = h('div', { class: 'celebrate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Lencana baharu' }, h('div', { class: 'box' }, h('div', { class: 'ic' }, b.icon), h('h2', {}, 'Lencana Baharu!'), h('h1', {}, b.name), h('p', {}, b.description),
      h('button', { class: 'btn primary big', onclick: () => { ov.remove(); next(); } }, 'Hebat! 🎉')));
    document.body.append(ov);
    ov.querySelector('button').focus();
  };
  setTimeout(next, 900);
}
