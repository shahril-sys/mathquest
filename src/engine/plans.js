/** Default world and level structure (seeded into the database; administrators can edit it afterwards). */

export const TOPICS = [
  ['nombor', 'Nombor dan Nilai Tempat'], ['tambah_tolak', 'Tambah dan Tolak'], ['darab', 'Darab'], ['bahagi', 'Bahagi'],
  ['pecahan', 'Pecahan'], ['perpuluhan', 'Perpuluhan'], ['wang', 'Wang'], ['masa', 'Masa dan Waktu'],
  ['ukuran', 'Ukuran dan Geometri'], ['masalah', 'Penyelesaian Masalah'],
];

export const WORLDS = [
  { code: 'dunia_nombor', name: 'Dunia Nombor', topic: 'nombor', min_year: 1, theme: 'meadow', icon: '🔢', description: 'Kira, bandingkan dan fahami nilai tempat.' },
  { code: 'pulau_tambah_tolak', name: 'Pulau Tambah dan Tolak', topic: 'tambah_tolak', min_year: 1, theme: 'island', icon: '🏝️', description: 'Belayar mengumpul harta dengan tambah dan tolak.' },
  { code: 'hutan_darab', name: 'Hutan Darab', topic: 'darab', min_year: 2, theme: 'forest', icon: '🌳', description: 'Jelajah hutan ajaib dengan sifir darab.' },
  { code: 'gunung_bahagi', name: 'Gunung Bahagi', topic: 'bahagi', min_year: 2, theme: 'mountain', icon: '⛰️', description: 'Daki gunung dengan membahagi sama banyak.' },
  { code: 'istana_pecahan', name: 'Istana Pecahan', topic: 'pecahan', min_year: 2, theme: 'castle', icon: '🏰', description: 'Buka pintu istana dengan pecahan.' },
  { code: 'planet_perpuluhan', name: 'Planet Perpuluhan', topic: 'perpuluhan', min_year: 3, theme: 'space', icon: '🪐', description: 'Terbang ke angkasa dengan nombor perpuluhan.' },
  { code: 'bandar_wang', name: 'Bandar Wang', topic: 'wang', min_year: 1, theme: 'city', icon: '💰', description: 'Berbelanja dan kira baki di bandar.' },
  { code: 'dunia_masa', name: 'Dunia Masa dan Waktu', topic: 'masa', min_year: 1, theme: 'clock', icon: '⏰', description: 'Baca jam dan kira tempoh masa.' },
  { code: 'alam_ukuran', name: 'Alam Ukuran', topic: 'ukuran', min_year: 1, theme: 'lab', icon: '📏', description: 'Ukur panjang, jisim, isi padu dan bentuk.' },
  { code: 'cabaran_masalah', name: 'Cabaran Penyelesaian Masalah', topic: 'masalah', min_year: 1, theme: 'volcano', icon: '🧩', description: 'Selesaikan masalah cerita berlangkah-langkah.' },
];

const DIFF = ['mudah', 'mudah', 'sederhana', 'sederhana', 'sederhana', 'sederhana', 'sukar', 'sukar', 'pakar', 'pakar'];

// A/B basic, C missing/fill, D match/visual, W word, X advanced
const GENS = {
  nombor: { A: ['count', 'compare'], B: ['skip', 'evenodd'], C: ['placevalue', 'skip'], D: ['compare', 'count'], W: ['skip', 'round'], X: ['round', 'placevalue'] },
  tambah_tolak: { A: ['add', 'add_visual'], B: ['sub'], C: ['addmissing', 'submissing'], D: ['add_match'], W: ['word_addsub'], X: ['mixed3', 'prob_two'] },
  darab: { A: ['mul', 'mul_groups'], B: ['mul_fill'], C: ['mul_fill', 'mul'], D: ['mul_match'], W: ['word_mul'], X: ['mul', 'prob_two'] },
  bahagi: { A: ['div'], B: ['div_fill'], C: ['div_fill', 'div'], D: ['div_match'], W: ['word_div'], X: ['div_rem', 'prob_two'] },
  pecahan: { A: ['frac_visual', 'frac_of'], B: ['frac_visual', 'frac_compare'], C: ['frac_equiv', 'frac_of'], D: ['frac_compare', 'frac_visual'], W: ['frac_of', 'prob_frac'], X: ['frac_add', 'frac_equiv', 'prob_frac'] },
  perpuluhan: { A: ['dec_add'], B: ['dec_sub'], C: ['dec_compare', 'dec_frac'], D: ['dec_compare', 'dec_add'], W: ['dec_word'], X: ['dec_round', 'dec_mul', 'dec_word'] },
  wang: { A: ['money_add'], B: ['money_change'], C: ['money_add', 'money_change'], D: ['money_match'], W: ['money_buy', 'money_change'], X: ['money_buy', 'money_change', 'prob_two'] },
  masa: { A: ['clock'], B: ['clock', 'days_months'], C: ['convert_time'], D: ['clock', 'convert_time'], W: ['duration'], X: ['duration', 'time24', 'convert_time'] },
  ukuran: { A: ['ruler', 'measure_diff'], B: ['measure_diff', 'measure_convert'], C: ['measure_convert', 'perimeter'], D: ['perimeter', 'area', 'measure_convert'], W: ['measure_diff', 'perimeter'], X: ['area', 'volume', 'perimeter'] },
  masalah: { A: ['word_addsub', 'prob_two'], B: ['prob_two'], C: ['prob_two', 'prob_frac'], D: ['prob_two', 'prob_average'], W: ['prob_two', 'prob_frac', 'prob_percent'], X: ['prob_frac', 'prob_percent', 'prob_average', 'prob_two'] },
};

const TITLES = {
  nombor: ['Mengira Objek', 'Urutan Nombor', 'Nilai Tempat', 'Nombor Hilang', 'Banding Nombor', 'Soalan Pantas Nombor', 'Nombor Bercampur', 'Cabaran Masa Nombor', 'Nombor Lanjutan', 'Bos Akhir: Raja Nombor'],
  tambah_tolak: ['Tambah Asas', 'Tolak Asas', 'Tambah dan Tolak', 'Nombor Hilang', 'Padanan Pantas', 'Soalan Cerita', 'Operasi Bercampur', 'Cabaran Masa', 'Penyelesaian Lanjutan', 'Bos Akhir: Raja Tambah Tolak'],
  darab: ['Sifir Asas', 'Sifir Lengkap', 'Darab Hilang', 'Darab Pantas', 'Padanan Darab', 'Soalan Cerita Darab', 'Darab Bercampur', 'Cabaran Masa Darab', 'Darab Lanjutan', 'Bos Akhir: Juara Darab'],
  bahagi: ['Bahagi Asas', 'Bahagi Hilang', 'Bahagi Sama Banyak', 'Bahagi Pantas', 'Padanan Bahagi', 'Soalan Cerita Bahagi', 'Bahagi Bercampur', 'Cabaran Masa Bahagi', 'Bahagi Lanjutan', 'Bos Akhir: Wira Bahagi'],
  pecahan: ['Kenal Pecahan', 'Pecahan Berwarna', 'Pecahan Setara', 'Banding Pecahan', 'Pecahan Pantas', 'Pecahan Cerita', 'Tambah Pecahan', 'Cabaran Masa Pecahan', 'Pecahan Lanjutan', 'Bos Akhir: Penjaga Istana'],
  perpuluhan: ['Tambah Perpuluhan', 'Tolak Perpuluhan', 'Banding Perpuluhan', 'Perpuluhan dan Pecahan', 'Perpuluhan Pantas', 'Cerita Perpuluhan', 'Perpuluhan Bercampur', 'Cabaran Masa Perpuluhan', 'Perpuluhan Lanjutan', 'Bos Akhir: Kapten Angkasa'],
  wang: ['Kira Wang', 'Kira Baki', 'Wang Bercampur', 'Padanan Wang', 'Wang Pantas', 'Beli Barang', 'Belanjawan', 'Cabaran Masa Wang', 'Wang Lanjutan', 'Bos Akhir: Raja Saudagar'],
  masa: ['Baca Jam', 'Jam dan Kalendar', 'Tukar Unit Masa', 'Jam Pantas', 'Padanan Masa', 'Tempoh Masa', 'Masa Bercampur', 'Cabaran Masa Jam', 'Masa Lanjutan', 'Bos Akhir: Penjaga Masa'],
  ukuran: ['Ukur Panjang', 'Beza dan Jumlah', 'Tukar Unit', 'Perimeter', 'Bentuk dan Ukuran', 'Cerita Ukuran', 'Luas dan Isi Padu', 'Cabaran Masa Ukuran', 'Ukuran Lanjutan', 'Bos Akhir: Pakar Ukuran'],
  masalah: ['Cerita Mudah', 'Cerita Dua Langkah', 'Cerita Pecahan', 'Cerita Purata', 'Cerita Campuran', 'Cerita Lanjutan', 'Cerita Peratus', 'Cabaran Masa Cerita', 'Masalah Sukar', 'Bos Akhir: Juara Masalah'],
};

export function levelPlan(topic) {
  const g = GENS[topic];
  const all = [...new Set(Object.values(g).flat())];
  const sets = [g.A, g.B, [...g.A, ...g.B], g.C, g.D, g.W, all, all, [...g.X, ...g.W], all];
  return sets.map((generators, i) => ({
    level_no: i + 1,
    title: TITLES[topic][i],
    difficulty: DIFF[i],
    generators,
    num_questions: 10,
    pass_percent: 70,
    time_limit_sec: i === 7 ? 30 : null,
    is_boss: i === 9 ? 1 : 0,
  }));
}

export const BADGES = [
  { code: 'raja_tambah', name: 'Raja Tambah', icon: '👑', description: 'Lulus Tahap 1 di Pulau Tambah dan Tolak.', criteria_type: 'level_pass', criteria: { world: 'pulau_tambah_tolak', level_no: 1 } },
  { code: 'pakar_tolak', name: 'Pakar Tolak', icon: '🎯', description: 'Lulus Tahap 2 di Pulau Tambah dan Tolak.', criteria_type: 'level_pass', criteria: { world: 'pulau_tambah_tolak', level_no: 2 } },
  { code: 'juara_darab', name: 'Juara Darab', icon: '🏆', description: 'Lulus Tahap 2 di Hutan Darab.', criteria_type: 'level_pass', criteria: { world: 'hutan_darab', level_no: 2 } },
  { code: 'wira_bahagi', name: 'Wira Bahagi', icon: '🛡️', description: 'Lulus Tahap 2 di Gunung Bahagi.', criteria_type: 'level_pass', criteria: { world: 'gunung_bahagi', level_no: 2 } },
  { code: 'bintang_pertama', name: 'Bintang Pertama', icon: '⭐', description: 'Lulus tahap pertama anda.', criteria_type: 'levels_passed', criteria: { count: 1 } },
  { code: 'pemburu_sempurna', name: 'Pemburu Sempurna', icon: '💎', description: 'Dapat markah penuh 3 kali.', criteria_type: 'perfect_scores', criteria: { count: 3 } },
  { code: 'penjelajah', name: 'Penjelajah Tahap', icon: '🧭', description: 'Lulus 10 tahap.', criteria_type: 'levels_passed', criteria: { count: 10 } },
  { code: 'master_matematik', name: 'Master Matematik', icon: '🎓', description: 'Tamatkan 3 dunia.', criteria_type: 'worlds_completed', criteria: { count: 3 } },
  { code: 'legenda_mathquest', name: 'Legenda MathQuest', icon: '🌟', description: 'Kumpul 5 000 mata seumur hidup.', criteria_type: 'lifetime_points', criteria: { count: 5000 } },
];
