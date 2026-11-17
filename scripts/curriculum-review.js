// Hasilkan docs/KURIKULUM-REVIEW.md: senarai jenis soalan mengikut tahun dan topik untuk semakan guru.
// Guna: node scripts/curriculum-review.js
import fs from 'node:fs';
import { GENERATORS, generate, DIFFICULTIES } from '../src/engine/generators.js';
import { TOPICS, WORLDS, levelPlan } from '../src/engine/plans.js';
import { makeRng } from '../src/engine/random.js';

const r = makeRng(2026);
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ⏎ ').replace(/\u00a0/g, ' ');
const nums = (t) => (String(t).replace(/\u00a0/g, '').match(/\d+(?:\.\d+)?/g) || []).map(Number);

function describe(q) {
  const v = q.visual ? ` [visual: ${q.visual.kind}]` : '';
  if (q.input === 'match') return `${q.text} (${q.lefts.join('; ')})`;
  if (q.input === 'mcq') return `${q.text}${v} — pilihan: ${q.options.join(' / ')}`;
  return `${q.text}${v}${q.unit ? ` (${q.unit})` : ''}`;
}

const TYPE = { mcq: 'pilihan jawapan', numeric: 'jawapan nombor', fill: 'isi tempat kosong', word: 'soalan cerita', visual: 'visual', match: 'padanan seret-lepas', count: 'mengira objek' };

const out = [];
out.push('# Semakan Penjajaran Kurikulum (KSSR/DSKP)\n');
out.push('Dokumen ini dijana secara automatik oleh `node scripts/curriculum-review.js` daripada penjana soalan sebenar. Ia membantu guru mengesahkan bahawa kandungan sesuai dengan tahap murid. **Penjajaran dengan DSKP ialah anggaran pembangun dan belum disahkan oleh guru atau pegawai kurikulum.** Sila tandakan lajur "Semak" dan catat pindaan.\n');
out.push('Cara membaca: setiap baris ialah satu templat soalan. "Julat" ialah nombor terkecil dan terbesar yang muncul dalam soalan daripada 200 contoh rawak merentasi semua kesukaran. Contoh Mudah dan Contoh Pakar ialah contoh sebenar yang dijana, dengan jawapan betul.\n');
out.push('Penentu perlu disemak guru: (1) julat nombor sesuai untuk tahun itu, (2) istilah dan konteks (wang, masa, ukuran) sesuai, (3) topik tidak melebihi DSKP tahun itu, (4) penjelasan langkah mudah difahami.\n');

for (let y = 1; y <= 6; y++) {
  out.push(`\n## Tahun ${y}\n`);
  const worlds = WORLDS.filter((w) => w.min_year <= y);
  const locked = WORLDS.filter((w) => w.min_year > y);
  out.push(`Dunia tersedia: ${worlds.map((w) => w.name).join(', ')}.`);
  if (locked.length) out.push(`  \nDunia berkunci (bermula Tahun ${[...new Set(locked.map((w) => w.min_year))].join('/')}): ${locked.map((w) => `${w.name} (T${w.min_year})`).join(', ')}.`);
  out.push('');
  for (const [code, name] of TOPICS) {
    const gens = Object.values(GENERATORS).filter((g) => g.topic === code && g.minYear <= y && y <= g.maxYear);
    if (!gens.length) continue;
    out.push(`\n### ${name}\n`);
    out.push('| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |');
    out.push('|---|---|---|---|---|---|---|');
    for (const g of gens) {
      let lo = Infinity; let hi = -Infinity;
      const types = new Set();
      for (let i = 0; i < 200; i++) {
        const q = generate(g.key, r, y, i % 4);
        types.add(TYPE[q.type] || q.type);
        for (const n of nums(q.text)) { lo = Math.min(lo, n); hi = Math.max(hi, n); }
      }
      const easy = generate(g.key, r, y, 0);
      const hard = generate(g.key, r, y, 3);
      out.push(`| \`${g.key}\` (T${g.minYear}-${g.maxYear}) | ${cell([...types].join(', '))} | ${Number.isFinite(lo) ? `${lo} – ${hi}` : '-'} | ${cell(describe(easy))} | ${cell(describe(hard))} | ${cell(easy.answerText)} / ${cell(hard.answerText)} | ☐ |`);
    }
  }
}

out.push('\n## Struktur 10 tahap bagi setiap dunia\n');
out.push('Setiap tahap menggunakan templat yang disenaraikan; templat yang tidak sesuai untuk tahun murid ditapis secara automatik. Pentadbir boleh mengubah struktur ini dalam Konfigurasi Tahap.\n');
for (const w of WORLDS) {
  out.push(`\n**${w.name}** (Tahun ${w.min_year}+)\n`);
  out.push('| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |');
  out.push('|---|---|---|---|---|---|');
  for (const l of levelPlan(w.topic)) out.push(`| ${l.level_no}${l.is_boss ? ' 👹' : ''} | ${l.title} | ${l.difficulty} | ${l.generators.map((g) => `\`${g}\``).join(', ')} | ${l.pass_percent}% | ${l.time_limit_sec ? `${l.time_limit_sec}s` : '-'} |`);
}

out.push('\n## Perkara yang diketahui untuk disemak\n');
out.push('- Pembundaran (`round`, `dec_round`) menggunakan konvensyen "5 ke atas dibundarkan ke atas".');
out.push('- Pecahan ditulis `a/b` dalam teks biasa; pecahan bercampur dan pecahan tak wajar belum dijana.');
out.push('- Wang menggunakan nilai sen gandaan 5 (Tahun 2 ke atas) dan syiling 5/10/20/50 sen (Tahun 1).');
out.push('- Masa 24 jam hanya untuk Tahun 4 ke atas; selang masa tidak melintasi tengah hari.');
out.push('- Peratus dan purata hanya muncul dari Tahun 4/5; semak kesesuaian dengan DSKP sekolah anda.');
out.push('- Soalan daripada bank pentadbir (CSV/Excel) tidak termasuk dalam dokumen ini kerana ditulis oleh sekolah.');
out.push(`\n_Dijana: ${new Date().toISOString().slice(0, 10)}. Jumlah templat: ${Object.keys(GENERATORS).length}. Tahap kesukaran: ${DIFFICULTIES.join(', ')}._\n`);

fs.writeFileSync(new URL('../docs/KURIKULUM-REVIEW.md', import.meta.url), out.join('\n'));
console.log(`docs/KURIKULUM-REVIEW.md dijana (${out.length} baris).`);
