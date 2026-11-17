# Semakan Penjajaran Kurikulum (KSSR/DSKP)

Dokumen ini dijana secara automatik oleh `node scripts/curriculum-review.js` daripada penjana soalan sebenar. Ia membantu guru mengesahkan bahawa kandungan sesuai dengan tahap murid. **Penjajaran dengan DSKP ialah anggaran pembangun dan belum disahkan oleh guru atau pegawai kurikulum.** Sila tandakan lajur "Semak" dan catat pindaan.

Cara membaca: setiap baris ialah satu templat soalan. "Julat" ialah nombor terkecil dan terbesar yang muncul dalam soalan daripada 200 contoh rawak merentasi semua kesukaran. Contoh Mudah dan Contoh Pakar ialah contoh sebenar yang dijana, dengan jawapan betul.

Penentu perlu disemak guru: (1) julat nombor sesuai untuk tahun itu, (2) istilah dan konteks (wang, masa, ukuran) sesuai, (3) topik tidak melebihi DSKP tahun itu, (4) penjelasan langkah mudah difahami.


## Tahun 1

Dunia tersedia: Dunia Nombor, Pulau Tambah dan Tolak, Bandar Wang, Dunia Masa dan Waktu, Alam Ukuran, Cabaran Penyelesaian Masalah.
  
Dunia berkunci (bermula Tahun 2/3): Hutan Darab (T2), Gunung Bahagi (T2), Istana Pecahan (T2), Planet Perpuluhan (T3).


### Nombor dan Nilai Tempat

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `count` (T1-2) | mengira objek | - | Sentuh setiap 🍎 untuk mengira. Berapakah jumlahnya? [visual: objects] | Sentuh setiap 🍎 untuk mengira. Berapakah jumlahnya? [visual: objects] | 2 / 15 | ☐ |
| `compare` (T1-6) | pilihan jawapan | - | Nombor yang manakah paling besar? — pilihan: 3 / 4 / 7 / 6 | Nombor yang manakah paling kecil? — pilihan: 6 / 8 / 11 / 19 | 7 / 6 | ☐ |
| `skip` (T1-6) | isi tempat kosong | 0 – 50 | Lengkapkan urutan nombor: 0, 2, 4, ___, 8 | Lengkapkan urutan nombor: 0, ___, 4, 6, 8 | 6 / 2 | ☐ |
| `evenodd` (T1-3) | pilihan jawapan | 1 – 20 | Nombor 2 ialah nombor ... — pilihan: Genap / Ganjil | Nombor 20 ialah nombor ... — pilihan: Genap / Ganjil | Genap / Genap | ☐ |

### Tambah dan Tolak

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `add` (T1-6) | jawapan nombor, pilihan jawapan | 1 – 18 | 6 + 4 = ? — pilihan: 13 / 5 / 12 / 10 | 7 + 8 = ? — pilihan: 15 / 17 / 18 / 20 | 10 / 15 | ☐ |
| `sub` (T1-6) | jawapan nombor, pilihan jawapan | 1 – 20 | 10 − 5 = ? | 16 − 9 = ? | 5 / 7 | ☐ |
| `addmissing` (T1-6) | isi tempat kosong | 1 – 20 | ___ + 1 = 9 | 16 + ___ = 20 | 8 / 4 | ☐ |
| `submissing` (T1-6) | isi tempat kosong | 1 – 20 | 3 − ___ = 2 | 17 − ___ = 10 | 1 / 7 | ☐ |
| `word_addsub` (T1-6) | soalan cerita | 1 – 20 | Kumar ada 7 biji belon. Dia memberikan 5 biji belon kepada Wei Jie. Berapakah baki belon Kumar? | Nurul ada 19 ekor ikan. Dia memberikan 6 ekor ikan kepada Aisyah. Berapakah baki ikan Nurul? | 2 / 13 | ☐ |
| `add_match` (T1-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (1 + 2; 4 + 1; 3 + 4; 3 + 6) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (15 + 4; 13 + 5; 10 + 3; 13 + 7) | 1 + 2 → 3; 4 + 1 → 5; 3 + 4 → 7; 3 + 6 → 9 / 15 + 4 → 19; 13 + 5 → 18; 10 + 3 → 13; 13 + 7 → 20 | ☐ |
| `add_visual` (T1-2) | visual | - | Berapakah jumlah semua objek? [visual: groups] | Berapakah jumlah semua objek? [visual: groups] — pilihan: 8 / 9 / 16 / 11 | 5 / 11 | ☐ |

### Wang

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `money_add` (T1-6) | pilihan jawapan, jawapan nombor | 5 – 50 | 50 sen + 50 sen = ? — pilihan: 0 / 80 / 100 / 110 | 10 sen + 5 sen = ? (sen) | 100 / 15 sen | ☐ |
| `money_match` (T1-6) | padanan seret-lepas | - | Padankan jumlah wang dengan jawapan yang betul. (5 sen + 5 sen; 5 sen + 20 sen; 10 sen + 20 sen; 50 sen + 50 sen) | Padankan jumlah wang dengan jawapan yang betul. (50 sen + 10 sen; 20 sen + 10 sen; 20 sen + 5 sen; 20 sen + 50 sen) | 5 sen + 5 sen → 10 sen; 5 sen + 20 sen → 25 sen; 10 sen + 20 sen → 30 sen; 50 sen + 50 sen → 100 sen / 50 sen + 10 sen → 60 sen; 20 sen + 10 sen → 30 sen; 20 sen + 5 sen → 25 sen; 20 sen + 50 sen → 70 sen | ☐ |
| `money_change` (T1-6) | soalan cerita | 10 – 100 | Aisyah membayar 100 sen untuk sebuah kotak pensel berharga 30 sen. Berapakah baki (dalam sen)? (sen) | Adam membayar 100 sen untuk sebuah mainan berharga 50 sen. Berapakah baki (dalam sen)? — pilihan: 10 / 50 / 150 / 0 | 70 sen / 50 | ☐ |

### Masa dan Waktu

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `clock` (T1-6) | visual | - | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 3:30 / 4:45 / 4:30 / 5:30 | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 12:20 / 4:15 / 3:00 / 4:00 | 4:30 / 4:00 | ☐ |
| `days_months` (T1-2) | pilihan jawapan | - | Bulan sebelum Disember ialah ... — pilihan: Disember / Mac / Julai / November | Bulan sebelum Ogos ialah ... — pilihan: Mac / Disember / Julai / Februari | November / Julai | ☐ |

### Ukuran dan Geometri

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `ruler` (T1-2) | visual | - | Berapakah panjang pensel itu dalam cm? [visual: ruler] — pilihan: 6 / 4 / 7 / 5 | Berapakah panjang pensel itu dalam cm? [visual: ruler] (cm) | 4 / 5 cm | ☐ |

## Tahun 2

Dunia tersedia: Dunia Nombor, Pulau Tambah dan Tolak, Hutan Darab, Gunung Bahagi, Istana Pecahan, Bandar Wang, Dunia Masa dan Waktu, Alam Ukuran, Cabaran Penyelesaian Masalah.
  
Dunia berkunci (bermula Tahun 3): Planet Perpuluhan (T3).


### Nombor dan Nilai Tempat

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `count` (T1-2) | mengira objek | - | Sentuh setiap 🐟 untuk mengira. Berapakah jumlahnya? [visual: objects] | Sentuh setiap 🐟 untuk mengira. Berapakah jumlahnya? [visual: objects] | 2 / 20 | ☐ |
| `compare` (T1-6) | pilihan jawapan | - | Nombor yang manakah paling besar? — pilihan: 20 / 19 / 10 / 3 | Nombor yang manakah paling besar? — pilihan: 41 / 62 / 70 / 21 | 20 / 70 | ☐ |
| `placevalue` (T2-6) | isi tempat kosong | 1 – 98 | Nilai digit 8 dalam nombor 89 ialah ___ | Nilai digit 5 dalam nombor 53 ialah ___ | 80 / 50 | ☐ |
| `skip` (T1-6) | isi tempat kosong | 0 – 180 | Lengkapkan urutan nombor: 0, 10, ___, 30, 40 | Lengkapkan urutan nombor: 30, 40, ___, 60, 70 | 20 / 50 | ☐ |
| `evenodd` (T1-3) | pilihan jawapan | 1 – 99 | Nombor 3 ialah nombor ... — pilihan: Ganjil / Genap | Nombor 48 ialah nombor ... — pilihan: Genap / Ganjil | Ganjil / Genap | ☐ |

### Tambah dan Tolak

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `add` (T1-6) | pilihan jawapan, jawapan nombor | 2 – 90 | 2 + 2 = ? — pilihan: 3 / 9 / 4 / 8 | 47 + 24 = ? | 4 / 71 | ☐ |
| `sub` (T1-6) | jawapan nombor, pilihan jawapan | 2 – 100 | 17 − 2 = ? | 74 − 46 = ? | 15 / 28 | ☐ |
| `addmissing` (T1-6) | isi tempat kosong | 2 – 100 | 16 + ___ = 19 | ___ + 77 = 94 | 3 / 17 | ☐ |
| `submissing` (T1-6) | isi tempat kosong | 1 – 98 | 18 − ___ = 9 | 43 − ___ = 2 | 9 / 41 | ☐ |
| `word_addsub` (T1-6) | soalan cerita | 2 – 100 | Mei Ling ada 10 kuntum bunga. Siti memberinya 5 kuntum bunga lagi. Berapakah jumlah bunga Mei Ling sekarang? | Aminah ada 95 biji gula-gula. Dia memberikan 56 biji gula-gula kepada Balqis. Berapakah baki gula-gula Aminah? — pilihan: 46 / 37 / 36 / 39 | 15 / 39 | ☐ |
| `mixed3` (T2-6) | jawapan nombor, pilihan jawapan | 1 – 100 | 9 + 7 − 14 = ? | 27 + 11 − 36 = ? | 2 / 2 | ☐ |
| `add_match` (T1-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (5 + 12; 16 + 2; 8 + 8; 14 + 5) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (43 + 36; 30 + 33; 29 + 49; 11 + 58) | 5 + 12 → 17; 16 + 2 → 18; 8 + 8 → 16; 14 + 5 → 19 / 43 + 36 → 79; 30 + 33 → 63; 29 + 49 → 78; 11 + 58 → 69 | ☐ |
| `add_visual` (T1-2) | visual | - | Berapakah jumlah semua objek? [visual: groups] — pilihan: 15 / 12 / 14 / 11 | Berapakah jumlah semua objek? [visual: groups] — pilihan: 19 / 11 / 14 / 9 | 14 / 14 | ☐ |

### Darab

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `mul` (T2-6) | pilihan jawapan, jawapan nombor | 1 – 10 | 5 × 5 = ? — pilihan: 24 / 27 / 23 / 25 | 5 × 4 = ? | 25 / 20 | ☐ |
| `mul_fill` (T2-6) | isi tempat kosong | 1 – 100 | 2 × ___ = 10 | 5 × ___ = 5 | 5 / 1 | ☐ |
| `word_mul` (T2-6) | soalan cerita | 1 – 10 | Aisyah mempunyai 5 kotak. Setiap kotak mengandungi 1 kuntum bunga. Berapakah jumlah bunga semuanya? | Mei Ling mempunyai 4 kotak. Setiap kotak mengandungi 1 biji epal. Berapakah jumlah epal semuanya? — pilihan: 4 / 3 / 7 / 0 | 5 / 4 | ☐ |
| `mul_groups` (T2-3) | visual | 2 – 5 | Ada 4 kumpulan. Setiap kumpulan ada 2 ✏️. Berapakah jumlah semuanya? [visual: groups] | Ada 3 kumpulan. Setiap kumpulan ada 4 🌸. Berapakah jumlah semuanya? [visual: groups] | 8 / 12 | ☐ |
| `mul_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (2 × 4; 10 × 4; 2 × 1; 10 × 5) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (10 × 7; 4 × 1; 5 × 6; 3 × 2) | 2 × 4 → 8; 10 × 4 → 40; 2 × 1 → 2; 10 × 5 → 50 / 10 × 7 → 70; 4 × 1 → 4; 5 × 6 → 30; 3 × 2 → 6 | ☐ |

### Bahagi

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `div` (T2-6) | pilihan jawapan, jawapan nombor | 2 – 100 | 10 ÷ 10 = ? — pilihan: 1 / 4 / 3 / 2 | 24 ÷ 4 = ? | 1 / 6 | ☐ |
| `div_fill` (T2-6) | isi tempat kosong | 1 – 100 | ___ ÷ 5 = 10 | 20 ÷ ___ = 5 | 50 / 4 | ☐ |
| `word_div` (T2-6) | soalan cerita | 2 – 100 | Devi ada 4 biji belon. Dia membahagikan sama banyak kepada 2 orang kawan. Berapakah belon yang diterima oleh seorang kawan? | Balqis ada 10 buah buku. Dia membahagikan sama banyak kepada 2 orang kawan. Berapakah buku yang diterima oleh seorang kawan? — pilihan: 3 / 2 / 10 / 5 | 2 / 5 | ☐ |
| `div_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (30 ÷ 3; 25 ÷ 5; 10 ÷ 10; 6 ÷ 2) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (36 ÷ 4; 2 ÷ 2; 20 ÷ 2; 18 ÷ 3) | 30 ÷ 3 → 10; 25 ÷ 5 → 5; 10 ÷ 10 → 1; 6 ÷ 2 → 3 / 36 ÷ 4 → 9; 2 ÷ 2 → 1; 20 ÷ 2 → 10; 18 ÷ 3 → 6 | ☐ |

### Pecahan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `frac_visual` (T2-6) | visual | - | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 1/3 / 1/2 / 2/3 / 1/4 | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 2/3 / 1/3 / 1/5 / 1/4 | 1/2 / 1/3 | ☐ |
| `frac_of` (T2-6) | isi tempat kosong, soalan cerita | 1 – 40 | Kumar mempunyai 16 biji bola. Dia memberi 1/2 daripadanya kepada Adam. Berapakah bola yang diberi? | Hafiz mempunyai 18 keping biskut. Dia memberi 1/2 daripadanya kepada Farid. Berapakah biskut yang diberi? — pilihan: 10 / 5 / 9 / 6 | 8 / 9 | ☐ |

### Wang

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `money_add` (T1-6) | pilihan jawapan, jawapan nombor | 2 – 412.85 | RM16.90 + RM2.25 = ___ (dalam RM) | RM273.50 + RM56.05 = ___ (dalam RM) — pilihan: RM330.55 / RM329.55 / RM329.80 / RM329.20 | RM19.15 / RM329.55 | ☐ |
| `money_match` (T1-6) | padanan seret-lepas | - | Padankan jumlah wang dengan jawapan yang betul. (RM15.95 + RM2.85; RM13.00 + RM2.85; RM5.30 + RM7.95; RM16.15 + RM3.10) | Padankan jumlah wang dengan jawapan yang betul. (RM360.20 + RM65.70; RM313.85 + RM162.85; RM102.60 + RM136.50; RM138.95 + RM51.80) | RM15.95 + RM2.85 → RM18.80; RM13.00 + RM2.85 → RM15.85; RM5.30 + RM7.95 → RM13.25; RM16.15 + RM3.10 → RM19.25 / RM360.20 + RM65.70 → RM425.90; RM313.85 + RM162.85 → RM476.70; RM102.60 + RM136.50 → RM239.10; RM138.95 + RM51.80 → RM190.75 | ☐ |
| `money_change` (T1-6) | soalan cerita | 0.4 – 500 | Hafiz membeli sebuah topi berharga RM13.40. Dia membayar RM50. Berapakah baki yang diterima? | Nurul membeli sebuah mainan berharga RM318.35. Dia membayar RM500. Berapakah baki yang diterima? | RM36.60 / RM181.65 | ☐ |
| `money_buy` (T2-6) | soalan cerita | 0.5 – 5 | Farid membeli 5 topi dengan harga RM1.00 sebuah. Berapakah jumlah yang perlu dibayar? — pilihan: RM6.00 / RM4.50 / RM3.50 / RM5.00 | Raju membeli 5 mainan dengan harga RM1.00 sebuah. Berapakah jumlah yang perlu dibayar? — pilihan: RM5.00 / RM2.50 / RM7.50 / RM4.50 | RM5.00 / RM5.00 | ☐ |

### Masa dan Waktu

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `clock` (T1-6) | visual | - | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 2:00 / 1:00 / 1:30 / 12:00 | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 7:45 / 6:45 / 8:45 / 9:35 | 1:00 / 7:45 | ☐ |
| `days_months` (T1-2) | pilihan jawapan | - | Bulan selepas Februari ialah ... — pilihan: Februari / Mac / Julai / September | Bulan sebelum September ialah ... — pilihan: Mac / Disember / Januari / Ogos | Mac / Ogos | ☐ |
| `convert_time` (T2-6) | isi tempat kosong | 2 – 540 | 9 jam = ___ minit | 8 jam = ___ minit | 540 / 480 | ☐ |
| `duration` (T2-6) | soalan cerita | 0 – 10 | Filem bermula pada pukul 3:00 petang dan tamat pada pukul 4:00 petang. Berapa jamkah filem itu? (jam) | Filem bermula pada pukul 5:00 petang dan tamat pada pukul 8:00 petang. Berapa jamkah filem itu? (jam) | 1 jam / 3 jam | ☐ |

### Ukuran dan Geometri

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `ruler` (T1-2) | visual | - | Berapakah panjang pensel itu dalam cm? [visual: ruler] — pilihan: 2 / 0 / 3 / 4 | Berapakah panjang pensel itu dalam cm? [visual: ruler] (cm) | 3 / 11 cm | ☐ |
| `measure_diff` (T2-6) | soalan cerita | 2 – 87 | Panjang kain A ialah 11 m dan kain B ialah 4 m. Berapakah bezanya (dalam m)? (m) | Jisim guni beras A ialah 42 kg dan guni beras B ialah 41 kg. Berapakah bezanya (dalam kg)? (kg) | 7 m / 1 kg | ☐ |

### Penyelesaian Masalah

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `prob_two` (T2-6) | soalan cerita | 1 – 99 | Aminah mempunyai 9 kuntum bunga. Mei Ling mempunyai 3 kuntum lebih banyak daripada Aminah. Berapakah jumlah bunga mereka berdua? | Balqis ada 2 kotak. Setiap kotak mengandungi 3 biji epal. Dia memberikan 2 biji epal kepada Hafiz. Berapakah baki epal Balqis? | 21 / 4 | ☐ |

## Tahun 3

Dunia tersedia: Dunia Nombor, Pulau Tambah dan Tolak, Hutan Darab, Gunung Bahagi, Istana Pecahan, Planet Perpuluhan, Bandar Wang, Dunia Masa dan Waktu, Alam Ukuran, Cabaran Penyelesaian Masalah.


### Nombor dan Nilai Tempat

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `compare` (T1-6) | pilihan jawapan | - | Nombor yang manakah paling kecil? — pilihan: 99 / 41 / 39 / 69 | Nombor yang manakah paling kecil? — pilihan: 467 / 745 / 572 / 974 | 39 / 467 | ☐ |
| `placevalue` (T2-6) | isi tempat kosong | 1 – 987 | Nilai digit 9 dalam nombor 94 ialah ___ | Nilai digit 6 dalam nombor 694 ialah ___ | 90 / 600 | ☐ |
| `skip` (T1-6) | isi tempat kosong | 0 – 900 | Lengkapkan urutan nombor: 40, 50, 60, ___, 80 | Lengkapkan urutan nombor: 200, 250, ___, 350, 400 | 70 / 300 | ☐ |
| `evenodd` (T1-3) | pilihan jawapan | 5 – 975 | Nombor 40 ialah nombor ... — pilihan: Genap / Ganjil | Nombor 881 ialah nombor ... — pilihan: Genap / Ganjil | Genap / Ganjil | ☐ |
| `round` (T3-6) | jawapan nombor | 25 – 1000 | Bundarkan 580 kepada ratus yang terdekat. — pilihan: 700 / 1300 / 600 / 500 | Bundarkan 189 kepada puluh yang terdekat. | 600 / 190 | ☐ |

### Tambah dan Tolak

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `add` (T1-6) | pilihan jawapan, jawapan nombor | 10 – 883 | 62 + 21 = ? — pilihan: 73 / 83 / 84 / 86 | 485 + 207 = ? | 83 / 692 | ☐ |
| `sub` (T1-6) | jawapan nombor, pilihan jawapan | 10 – 999 | 68 − 28 = ? | 578 − 236 = ? | 40 / 342 | ☐ |
| `addmissing` (T1-6) | isi tempat kosong | 10 – 999 | ___ + 41 = 83 | ___ + 128 = 801 | 42 / 673 | ☐ |
| `submissing` (T1-6) | isi tempat kosong | 1 – 997 | 43 − ___ = 17 | ___ − 87 = 301 | 26 / 388 | ☐ |
| `word_addsub` (T1-6) | soalan cerita | 10 – 993 | Aisyah ada 91 keping kad. Dia memberikan 20 keping kad kepada Balqis. Berapakah baki kad Aisyah? — pilihan: 66 / 65 / 75 / 71 | Raju ada 164 batang pensel. Devi memberinya 448 batang pensel lagi. Berapakah jumlah pensel Raju sekarang? — pilihan: 609 / 612 / 607 / 512 | 71 / 612 | ☐ |
| `mixed3` (T2-6) | jawapan nombor, pilihan jawapan | 1 – 1000 | 71 + 26 − 71 = ? | 970 − 965 + 142 = ? | 26 / 147 | ☐ |
| `add_match` (T1-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (88 + 11; 59 + 20; 11 + 40; 77 + 11) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (764 + 187; 265 + 130; 342 + 657; 550 + 146) | 88 + 11 → 99; 59 + 20 → 79; 11 + 40 → 51; 77 + 11 → 88 / 764 + 187 → 951; 265 + 130 → 395; 342 + 657 → 999; 550 + 146 → 696 | ☐ |

### Darab

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `mul` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 10 | 5 × 7 = ? | 4 × 6 = ? — pilihan: 29 / 21 / 27 / 24 | 35 / 24 | ☐ |
| `mul_fill` (T2-6) | isi tempat kosong | 2 – 90 | ___ × 5 = 10 | 6 × ___ = 60 | 2 / 10 | ☐ |
| `word_mul` (T2-6) | soalan cerita | 2 – 10 | Nurul mempunyai 5 kotak. Setiap kotak mengandungi 10 biji bola. Berapakah jumlah bola semuanya? | Hafiz mempunyai 8 kotak. Setiap kotak mengandungi 3 keping kad. Berapakah jumlah kad semuanya? | 50 / 24 | ☐ |
| `mul_groups` (T2-3) | visual | 2 – 5 | Ada 5 kumpulan. Setiap kumpulan ada 2 🍎. Berapakah jumlah semuanya? [visual: groups] | Ada 4 kumpulan. Setiap kumpulan ada 2 🍎. Berapakah jumlah semuanya? [visual: groups] — pilihan: 3 / 13 / 8 / 12 | 10 / 8 | ☐ |
| `mul_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (4 × 10; 5 × 10; 2 × 2; 3 × 2) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (5 × 3; 8 × 4; 5 × 2; 9 × 4) | 4 × 10 → 40; 5 × 10 → 50; 2 × 2 → 4; 3 × 2 → 6 / 5 × 3 → 15; 8 × 4 → 32; 5 × 2 → 10; 9 × 4 → 36 | ☐ |

### Bahagi

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `div` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 90 | 25 ÷ 5 = ? — pilihan: 7 / 5 / 3 / 8 | 63 ÷ 7 = ? | 5 / 9 | ☐ |
| `div_fill` (T2-6) | isi tempat kosong | 2 – 90 | 15 ÷ ___ = 5 | 36 ÷ ___ = 6 | 3 / 6 | ☐ |
| `word_div` (T2-6) | soalan cerita | 2 – 81 | Nurul ada 18 batang pensel. Dia membahagikan sama banyak kepada 2 orang kawan. Berapakah pensel yang diterima oleh seorang kawan? | Nurul ada 21 biji gula-gula. Dia membahagikan sama banyak kepada 3 orang kawan. Berapakah gula-gula yang diterima oleh seorang kawan? | 9 / 7 | ☐ |
| `div_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (20 ÷ 4; 40 ÷ 4; 21 ÷ 3; 12 ÷ 3) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (16 ÷ 2; 6 ÷ 2; 70 ÷ 7; 27 ÷ 3) | 20 ÷ 4 → 5; 40 ÷ 4 → 10; 21 ÷ 3 → 7; 12 ÷ 3 → 4 / 16 ÷ 2 → 8; 6 ÷ 2 → 3; 70 ÷ 7 → 10; 27 ÷ 3 → 9 | ☐ |

### Pecahan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `frac_visual` (T2-6) | visual | - | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 6/7 / 4/6 / 1/7 / 4/7 | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 1/3 / 1/2 / 1/4 / 2/2 | 4/6 / 1/2 | ☐ |
| `frac_of` (T2-6) | isi tempat kosong, soalan cerita | 1 – 100 | Farid mempunyai 30 buah buku. Dia memberi 1/10 daripadanya kepada Siti. Berapakah buku yang diberi? | Kumar mempunyai 40 biji belon. Dia memberi 2/10 daripadanya kepada Aisyah. Berapakah belon yang diberi? | 3 / 8 | ☐ |
| `frac_add` (T3-6) | pilihan jawapan | 1 – 10 | 5/8 + 1/8 = ? — pilihan: 7/8 / 4/8 / 6/16 / 6/8 | 2/5 + 1/5 = ? — pilihan: 3/10 / 1/5 / 3/5 / 4/5 | 6/8 / 3/5 | ☐ |
| `frac_equiv` (T3-6) | isi tempat kosong | 1 – 60 | 1/2 = ___/10 | 1/2 = ___/18 | 5 / 9 | ☐ |
| `frac_compare` (T3-6) | pilihan jawapan | - | Pecahan manakah yang paling kecil? — pilihan: 6/8 / 2/8 / 4/8 / 1/8 | Pecahan manakah yang paling kecil? — pilihan: 2/5 / 1/5 / 3/5 / 4/5 | 1/8 / 1/5 | ☐ |

### Perpuluhan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `dec_add` (T3-6) | jawapan nombor, pilihan jawapan | 0.2 – 9.9 | 7.9 + 5.8 = ? | 3.8 + 5.5 = ? | 13.7 / 9.3 | ☐ |
| `dec_sub` (T3-6) | jawapan nombor, pilihan jawapan | 0.2 – 9.9 | 5.4 − 2.2 = ? | 8.5 − 6.4 = ? | 3.2 / 2.1 | ☐ |
| `dec_compare` (T3-6) | pilihan jawapan | - | Nombor perpuluhan yang manakah paling kecil? — pilihan: 4.4 / 8.4 / 9.5 / 5.1 | Nombor perpuluhan yang manakah paling besar? — pilihan: 0.2 / 4.3 / 4.8 / 3.4 | 4.4 / 4.8 | ☐ |
| `dec_frac` (T3-6) | isi tempat kosong | 0.1 – 10 | 0.3 = ___/10 — pilihan: 3 / 1 / 4 / 0 | 0.2 = ___/10 | 3 / 2 | ☐ |

### Wang

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `money_add` (T1-6) | jawapan nombor, pilihan jawapan | 10.05 – 4483.5 | RM83.30 + RM12.40 = ___ (dalam RM) | RM1714.75 + RM3234.00 = ___ (dalam RM) | RM95.70 / RM4948.75 | ☐ |
| `money_match` (T1-6) | padanan seret-lepas | - | Padankan jumlah wang dengan jawapan yang betul. (RM38.70 + RM24.60; RM78.65 + RM20.80; RM57.75 + RM29.00; RM12.90 + RM79.50) | Padankan jumlah wang dengan jawapan yang betul. (RM3323.80 + RM1242.60; RM3038.80 + RM1687.95; RM1092.75 + RM2616.25; RM3726.90 + RM723.35) | RM38.70 + RM24.60 → RM63.30; RM78.65 + RM20.80 → RM99.45; RM57.75 + RM29.00 → RM86.75; RM12.90 + RM79.50 → RM92.40 / RM3323.80 + RM1242.60 → RM4566.40; RM3038.80 + RM1687.95 → RM4726.75; RM1092.75 + RM2616.25 → RM3709.00; RM3726.90 + RM723.35 → RM4450.25 | ☐ |
| `money_change` (T1-6) | soalan cerita | 0.75 – 1000 | Raju membeli sebuah kasut berharga RM96.45. Dia membayar RM100. Berapakah baki yang diterima? | Balqis membeli sebuah buku cerita berharga RM609.45. Dia membayar RM1000. Berapakah baki yang diterima? | RM3.55 / RM390.55 | ☐ |
| `money_buy` (T2-6) | soalan cerita | 0.5 – 12 | Aisyah membeli 12 kasut dengan harga RM4.00 sebuah. Berapakah jumlah yang perlu dibayar? | Devi membeli 3 kasut dengan harga RM1.00 sebuah. Berapakah jumlah yang perlu dibayar? | RM48.00 / RM3.00 | ☐ |

### Masa dan Waktu

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `clock` (T1-6) | visual | - | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 1:00 / 1:15 / 1:45 / 9:05 | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 11:20 / 11:05 / 1:55 / 10:05 | 1:45 / 11:05 | ☐ |
| `convert_time` (T2-6) | isi tempat kosong | 2 – 540 | 8 minit = ___ saat | 28 hari = ___ minggu | 480 / 4 | ☐ |
| `duration` (T2-6) | soalan cerita | 0 – 45 | Latihan bermula pada pukul 2:00 petang dan tamat pada pukul 3:45 petang. Berapa minitkah tempoh latihan itu? — pilihan: 205 / 105 / 5 / 60 | Latihan bermula pada pukul 1:45 petang dan tamat pada pukul 3:30 petang. Berapa minitkah tempoh latihan itu? — pilihan: 105 / 5 / 135 / 255 | 105 / 105 | ☐ |

### Ukuran dan Geometri

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `measure_diff` (T2-6) | soalan cerita | 10 – 892 | Panjang kain A ialah 62 m dan kain B ialah 23 m. Berapakah bezanya (dalam m)? (m) | Panjang tali A ialah 700 cm dan tali B ialah 107 cm. Berapakah bezanya (dalam cm)? (cm) | 39 m / 593 cm | ☐ |
| `measure_convert` (T3-6) | isi tempat kosong | 1 – 9000 | 4 kg = ___ g | 5 l = ___ ml | 4000 / 5000 | ☐ |
| `perimeter` (T3-6) | visual | - | Berapakah perimeter segi empat tepat ini (cm)? [visual: rect] (cm) | Berapakah perimeter segi empat tepat ini (cm)? [visual: rect] — pilihan: 36 / 22 / 24 / 26 | 16 cm / 26 | ☐ |

### Penyelesaian Masalah

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `prob_two` (T2-6) | soalan cerita | 1 – 500 | Ibu membeli 7 beg sekolah dengan harga RM5 sebuah. Ibu membayar RM50. Berapakah baki wang Ibu (RM)? | Raju ada 3 kotak. Setiap kotak mengandungi 11 batang pensel. Dia memberikan 23 batang pensel kepada Adam. Berapakah baki pensel Raju? | RM15 / 10 | ☐ |

## Tahun 4

Dunia tersedia: Dunia Nombor, Pulau Tambah dan Tolak, Hutan Darab, Gunung Bahagi, Istana Pecahan, Planet Perpuluhan, Bandar Wang, Dunia Masa dan Waktu, Alam Ukuran, Cabaran Penyelesaian Masalah.


### Nombor dan Nilai Tempat

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `compare` (T1-6) | pilihan jawapan | - | Nombor yang manakah paling besar? — pilihan: 302 / 505 / 894 / 666 | Nombor yang manakah paling kecil? — pilihan: 9091 / 2200 / 5058 / 1010 | 894 / 1010 | ☐ |
| `placevalue` (T2-6) | isi tempat kosong | 1 – 9852 | Nilai digit 3 dalam nombor 387 ialah ___ | Nilai digit 8 dalam nombor 5918 ialah ___ | 300 / 8 | ☐ |
| `skip` (T1-6) | isi tempat kosong | 0 – 9000 | Lengkapkan urutan nombor: 100, ___, 300, 400, 500 | Lengkapkan urutan nombor: 25, ___, 75, 100, 125 | 200 / 50 | ☐ |
| `round` (T3-6) | jawapan nombor | 24 – 9804 | Bundarkan 418 kepada puluh yang terdekat. — pilihan: 420 / 1420 / 220 / 400 | Bundarkan 3278 kepada ratus yang terdekat. | 420 / 3300 | ☐ |

### Tambah dan Tolak

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `add` (T1-6) | jawapan nombor, pilihan jawapan | 104 – 8947 | 864 + 103 = ? | 3585 + 2264 = ? — pilihan: 5846 / 5749 / 5949 / 5849 | 967 / 5849 | ☐ |
| `sub` (T1-6) | jawapan nombor, pilihan jawapan | 104 – 9691 | 782 − 574 = ? — pilihan: 208 / 212 / 108 / 211 | 9620 − 2690 = ? | 208 / 6930 | ☐ |
| `addmissing` (T1-6) | isi tempat kosong | 103 – 9990 | 395 + ___ = 665 | ___ + 2149 = 7080 | 270 / 4931 | ☐ |
| `submissing` (T1-6) | isi tempat kosong | 2 – 9880 | 371 − ___ = 181 | ___ − 4874 = 1433 | 190 / 6307 | ☐ |
| `word_addsub` (T1-6) | soalan cerita | 103 – 9960 | Adam ada 994 kuntum bunga. Dia memberikan 133 kuntum bunga kepada Ali. Berapakah baki bunga Adam? | Ali ada 8537 biji belon. Dia memberikan 3071 biji belon kepada Kumar. Berapakah baki belon Ali? | 861 / 5466 | ☐ |
| `mixed3` (T2-6) | pilihan jawapan, jawapan nombor | 14 – 9998 | 886 − 9 + 769 = ? | 5806 + 1988 − 3806 = ? | 1646 / 3988 | ☐ |
| `add_match` (T1-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (381 + 394; 370 + 340; 646 + 333; 159 + 721) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (1127 + 8596; 4680 + 2895; 8262 + 1297; 1572 + 5757) | 381 + 394 → 775; 370 + 340 → 710; 646 + 333 → 979; 159 + 721 → 880 / 1127 + 8596 → 9723; 4680 + 2895 → 7575; 8262 + 1297 → 9559; 1572 + 5757 → 7329 | ☐ |

### Darab

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `mul` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 98 | 2 × 2 = ? | 68 × 6 = ? | 4 / 408 | ☐ |
| `mul_fill` (T2-6) | isi tempat kosong | 2 – 783 | ___ × 5 = 45 | 11 × ___ = 55 | 9 / 5 | ☐ |
| `word_mul` (T2-6) | soalan cerita | 2 – 95 | Balqis mempunyai 9 kotak. Setiap kotak mengandungi 2 biji belon. Berapakah jumlah belon semuanya? | Ali mempunyai 79 kotak. Setiap kotak mengandungi 3 biji epal. Berapakah jumlah epal semuanya? | 18 / 237 | ☐ |
| `mul_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (3 × 3; 5 × 3; 6 × 8; 4 × 9) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (59 × 4; 74 × 7; 45 × 2; 47 × 6) | 3 × 3 → 9; 5 × 3 → 15; 6 × 8 → 48; 4 × 9 → 36 / 59 × 4 → 236; 74 × 7 → 518; 45 × 2 → 90; 47 × 6 → 282 | ☐ |

### Bahagi

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `div` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 729 | 18 ÷ 3 = ? | 156 ÷ 2 = ? — pilihan: 78 / 75 / 77 / 71 | 6 / 78 | ☐ |
| `div_fill` (T2-6) | isi tempat kosong | 2 – 810 | 63 ÷ ___ = 9 | ___ ÷ 8 = 70 | 7 / 560 | ☐ |
| `word_div` (T2-6) | soalan cerita | 2 – 765 | Aminah ada 84 keping kad. Dia membahagikan sama banyak kepada 7 orang kawan. Berapakah kad yang diterima oleh seorang kawan? | Raju ada 440 biji belon. Dia membahagikan sama banyak kepada 8 orang kawan. Berapakah belon yang diterima oleh seorang kawan? | 12 / 55 | ☐ |
| `div_rem` (T4-6) | jawapan nombor | 3 – 791 | Berapakah baki apabila 31 dibahagi dengan 5? | Berapakah baki apabila 203 dibahagi dengan 6? | 1 / 5 | ☐ |
| `div_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (50 ÷ 5; 12 ÷ 3; 36 ÷ 6; 54 ÷ 6) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (162 ÷ 3; 413 ÷ 7; 208 ÷ 4; 828 ÷ 9) | 50 ÷ 5 → 10; 12 ÷ 3 → 4; 36 ÷ 6 → 6; 54 ÷ 6 → 9 / 162 ÷ 3 → 54; 413 ÷ 7 → 59; 208 ÷ 4 → 52; 828 ÷ 9 → 92 | ☐ |

### Pecahan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `frac_visual` (T2-6) | visual | - | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 5/6 / 2/5 / 1/5 / 4/5 | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 4/5 / 4/7 / 1/5 / 1/6 | 1/5 / 4/5 | ☐ |
| `frac_of` (T2-6) | isi tempat kosong, soalan cerita | 1 – 200 | Mei Ling mempunyai 16 buah buku. Dia memberi 2/4 daripadanya kepada Aisyah. Berapakah buku yang diberi? — pilihan: 8 / 9 / 6 / 12 | 1/4 daripada 28 = ___ | 8 / 7 | ☐ |
| `frac_add` (T3-6) | pilihan jawapan | 1 – 12 | 2/4 + 1/4 = ? — pilihan: 4/4 / 3/8 / 1/4 / 3/4 | 2/7 + 1/7 = ? — pilihan: 3/7 / 2/7 / 1/7 / 3/8 | 3/4 / 3/7 | ☐ |
| `frac_equiv` (T3-6) | isi tempat kosong | 1 – 60 | 1/2 = ___/6 | 2/3 = ___/21 | 3 / 14 | ☐ |
| `frac_compare` (T3-6) | pilihan jawapan | - | Pecahan manakah yang paling besar? — pilihan: 2/6 / 1/6 / 4/6 / 3/6 | Pecahan manakah yang paling besar? — pilihan: 10/11 / 6/11 / 3/11 / 1/11 | 4/6 / 10/11 | ☐ |

### Perpuluhan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `dec_add` (T3-6) | jawapan nombor, pilihan jawapan | 0.3 – 49.9 | 36.7 + 26.8 = ? — pilihan: 63.5 / 64.2 / 64.0 / 63.6 | 14.94 + 44.04 = ? — pilihan: 59.03 / 58.95 / 59.02 / 58.98 | 63.5 / 58.98 | ☐ |
| `dec_sub` (T3-6) | jawapan nombor, pilihan jawapan | 0.15 – 49.85 | 44.2 − 43.2 = ? | 37.60 − 1.24 = ? | 1.0 / 36.36 | ☐ |
| `dec_compare` (T3-6) | pilihan jawapan | - | Nombor perpuluhan yang manakah paling besar? — pilihan: 42.9 / 41.6 / 28.7 / 14.8 | Nombor perpuluhan yang manakah paling kecil? — pilihan: 46.25 / 1.58 / 16.87 / 43.17 | 42.9 / 1.58 | ☐ |
| `dec_frac` (T3-6) | isi tempat kosong | 0.02 – 100 | 99/100 = ___ (dalam perpuluhan) — pilihan: 0.99 / 1.03 / 0.94 / 0.95 | 91/100 = ___ (dalam perpuluhan) | 0.99 / 0.91 | ☐ |
| `dec_word` (T4-6) | soalan cerita | 0.57 – 10 | Devi mempunyai pita sepanjang 6.32 m. Dia memotong 5.76 m. Berapakah baki pita (dalam m)? — pilihan: 0.57 / 0.60 / 0.55 / 0.56 | Beg A berjisim 4.09 kg dan beg B berjisim 3.07 kg. Berapakah jumlah jisim kedua-dua beg (dalam kg)? (kg) | 0.56 / 7.16 kg | ☐ |

### Wang

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `money_add` (T1-6) | jawapan nombor, pilihan jawapan | 53.25 – 8915.15 | RM78.45 + RM363.05 = ___ (dalam RM) | RM8337.25 + RM1468.65 = ___ (dalam RM) | RM441.50 / RM9805.90 | ☐ |
| `money_match` (T1-6) | padanan seret-lepas | - | Padankan jumlah wang dengan jawapan yang betul. (RM116.20 + RM335.35; RM350.65 + RM114.80; RM444.25 + RM55.25; RM202.60 + RM165.70) | Padankan jumlah wang dengan jawapan yang betul. (RM4751.45 + RM3541.65; RM3745.60 + RM2465.75; RM5289.75 + RM1077.75; RM1911.10 + RM3103.05) | RM116.20 + RM335.35 → RM451.55; RM350.65 + RM114.80 → RM465.45; RM444.25 + RM55.25 → RM499.50; RM202.60 + RM165.70 → RM368.30 / RM4751.45 + RM3541.65 → RM8293.10; RM3745.60 + RM2465.75 → RM6211.35; RM5289.75 + RM1077.75 → RM6367.50; RM1911.10 + RM3103.05 → RM5014.15 | ☐ |
| `money_change` (T1-6) | soalan cerita | 2.3 – 1000 | Adam membeli sebuah beg sekolah berharga RM90.80. Dia membayar RM100. Berapakah baki yang diterima? | Devi membeli sebuah kotak pensel berharga RM628.05. Dia membayar RM1000. Berapakah baki yang diterima? | RM9.20 / RM371.95 | ☐ |
| `money_buy` (T2-6) | soalan cerita | 0.5 – 20 | Raju membeli 12 mainan dengan harga RM10.50 sebuah. Berapakah jumlah yang perlu dibayar? — pilihan: RM124.50 / RM116.00 / RM123.00 / RM126.00 | Adam membeli 6 kotak pensel dengan harga RM3.50 sebuah. Berapakah jumlah yang perlu dibayar? | RM126.00 / RM21.00 | ☐ |

### Masa dan Waktu

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `clock` (T1-6) | visual | - | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 1:15 / 12:30 / 11:15 / 12:15 | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 5:02 / 5:32 / 4:02 / 12:25 | 12:15 / 5:02 | ☐ |
| `convert_time` (T2-6) | isi tempat kosong | 2 – 900 | 6 hari = ___ jam | 60 tahun = ___ dekad | 144 / 6 | ☐ |
| `duration` (T2-6) | soalan cerita | 0 – 45 | Latihan bermula pada pukul 3:45 petang dan tamat pada pukul 6:30 petang. Berapa minitkah tempoh latihan itu? (minit) | Latihan bermula pada pukul 1:30 petang dan tamat pada pukul 2:30 petang. Berapa minitkah tempoh latihan itu? (minit) | 165 minit / 60 minit | ☐ |
| `time24` (T4-6) | pilihan jawapan | 0 – 55 | Tukarkan pukul 7:40 petang kepada sistem 24 jam. — pilihan: 19:40 / 18:40 / 19:10 / 17:40 | Tukarkan pukul 7:15 petang kepada sistem 24 jam. — pilihan: 07:15 / 19:15 / 17:15 / 19:45 | 19:40 / 19:15 | ☐ |

### Ukuran dan Geometri

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `measure_diff` (T2-6) | soalan cerita | 102 – 8984 | Jisim guni beras A ialah 717 kg dan guni beras B ialah 144 kg. Berapakah jumlahnya (dalam kg)? (kg) | Isi padu botol air A ialah 5332 ml dan botol air B ialah 2498 ml. Berapakah jumlahnya (dalam ml)? (ml) | 861 kg / 7830 ml | ☐ |
| `measure_convert` (T3-6) | isi tempat kosong | 1 – 9000 | 5 kg = ___ g | 800 cm = ___ m | 5000 / 8 | ☐ |
| `perimeter` (T3-6) | visual | 3 – 76 | Berapakah perimeter segi empat tepat ini (cm)? [visual: rect] — pilihan: 28 / 24 / 30 / 38 | Perimeter sebuah segi empat tepat ialah 52 cm. Panjangnya 12 cm. Berapakah lebarnya (cm)? [visual: rect] — pilihan: 14 / 9 / 15 / 16 | 28 / 14 | ☐ |
| `area` (T4-6) | visual | - | Berapakah luas segi empat tepat ini (cm²)? [visual: rect] (cm²) | Berapakah luas segi empat tepat ini (cm²)? [visual: rect] (cm²) | 72 cm² / 72 cm² | ☐ |

### Penyelesaian Masalah

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `prob_two` (T2-6) | soalan cerita | 1 – 500 | Farid mempunyai 469 keping kad. Wei Jie mempunyai 430 keping lebih banyak daripada Farid. Berapakah jumlah kad mereka berdua? | 125 buah buku dibahagi sama banyak kepada 5 bakul. Kemudian setiap bakul ditambah 10 buah. Berapakah bilangan buku dalam satu bakul sekarang? | 1368 / 35 | ☐ |
| `prob_frac` (T4-6) | soalan cerita | 1 – 280 | Devi ada RM66. Dia membelanjakan 3/6 daripada wang itu. Berapakah baki wang Devi (RM)? — pilihan: RM32 / RM29 / RM33 / RM39 | Raju ada RM36. Dia membelanjakan 4/6 daripada wang itu. Berapakah baki wang Raju (RM)? | RM33 / RM12 | ☐ |
| `prob_average` (T4-6) | soalan cerita | 2 – 90 | Markah 5 orang murid ialah 24, 16, 17, 33, 30. Berapakah purata markah mereka? | Markah 4 orang murid ialah 26, 18, 39, 29. Berapakah purata markah mereka? | 24 / 28 | ☐ |

## Tahun 5

Dunia tersedia: Dunia Nombor, Pulau Tambah dan Tolak, Hutan Darab, Gunung Bahagi, Istana Pecahan, Planet Perpuluhan, Bandar Wang, Dunia Masa dan Waktu, Alam Ukuran, Cabaran Penyelesaian Masalah.


### Nombor dan Nilai Tempat

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `compare` (T1-6) | pilihan jawapan | - | Nombor yang manakah paling kecil? — pilihan: 9463 / 2372 / 6460 / 7817 | Nombor yang manakah paling besar? — pilihan: 86 697 / 63 065 / 96 901 / 10 693 | 2372 / 96 901 | ☐ |
| `placevalue` (T2-6) | isi tempat kosong | 1 – 98325 | Nilai digit 6 dalam nombor 3867 ialah ___ | Nilai digit 5 dalam nombor 35 147 ialah ___ | 60 / 5000 | ☐ |
| `skip` (T1-6) | isi tempat kosong | 0 – 45000 | Lengkapkan urutan nombor: 1000, ___, 3000, 4000, 5000 | Lengkapkan urutan nombor: 0, 1000, ___, 3000, 4000 | 2000 / 2000 | ☐ |
| `round` (T3-6) | jawapan nombor | 364 – 99817 | Bundarkan 3513 kepada ribu yang terdekat. — pilihan: 9000 / 4000 / 4100 / 24 000 | Bundarkan 53 377 kepada puluh ribu yang terdekat. | 4000 / 50 000 | ☐ |

### Tambah dan Tolak

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `add` (T1-6) | jawapan nombor, pilihan jawapan | 1006 – 89407 | 1311 + 3172 = ? | 65 639 + 33 156 = ? | 4483 / 98 795 | ☐ |
| `sub` (T1-6) | jawapan nombor, pilihan jawapan | 1037 – 99841 | 8768 − 5286 = ? — pilihan: 3582 / 3488 / 3382 / 3482 | 44 858 − 30 778 = ? | 3482 / 14 080 | ☐ |
| `addmissing` (T1-6) | isi tempat kosong | 1020 – 99869 | 5808 + ___ = 9331 | ___ + 19 645 = 77 595 | 3523 / 57 950 | ☐ |
| `submissing` (T1-6) | isi tempat kosong | 57 – 99466 | 9460 − ___ = 8716 | 80 827 − ___ = 5449 | 744 / 75 378 | ☐ |
| `word_addsub` (T1-6) | soalan cerita | 1115 – 99889 | Aminah ada 8095 batang pensel. Ali memberinya 1605 batang pensel lagi. Berapakah jumlah pensel Aminah sekarang? | Siti ada 42 633 keping biskut. Farid memberinya 40 330 keping biskut lagi. Berapakah jumlah biskut Siti sekarang? — pilihan: 83 063 / 82 963 / 82 964 / 82 863 | 9700 / 82 963 | ☐ |
| `mixed3` (T2-6) | pilihan jawapan, jawapan nombor | 129 – 99905 | 5522 + 1135 − 6283 = ? | 34 244 − 21 829 + 17 520 = ? — pilihan: 29 945 / 29 935 / 30 035 / 30 935 | 374 / 29 935 | ☐ |
| `add_match` (T1-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (8019 + 1486; 5753 + 3723; 4946 + 2448; 2383 + 2822) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (63 360 + 14 911; 46 900 + 40 369; 42 525 + 15 358; 19 061 + 12 902) | 8019 + 1486 → 9505; 5753 + 3723 → 9476; 4946 + 2448 → 7394; 2383 + 2822 → 5205 / 63 360 + 14 911 → 78 271; 46 900 + 40 369 → 87 269; 42 525 + 15 358 → 57 883; 19 061 + 12 902 → 31 963 | ☐ |

### Darab

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `mul` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 971 | 31 × 3 = ? | 100 × 31 = ? — pilihan: 3200 / 3103 / 3100 / 4100 | 93 / 3100 | ☐ |
| `mul_fill` (T2-6) | isi tempat kosong | 2 – 81774 | 88 × ___ = 616 | ___ × 90 = 39 870 | 7 / 443 | ☐ |
| `word_mul` (T2-6) | soalan cerita | 2 – 994 | Aminah mempunyai 59 kotak. Setiap kotak mengandungi 5 kuntum bunga. Berapakah jumlah bunga semuanya? — pilihan: 295 / 300 / 1295 / 195 | Adam mempunyai 964 kotak. Setiap kotak mengandungi 22 buah buku. Berapakah jumlah buku semuanya? | 295 / 21 208 | ☐ |
| `mul_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (13 × 7; 71 × 6; 58 × 2; 76 × 8) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (934 × 89; 843 × 16; 491 × 19; 505 × 73) | 13 × 7 → 91; 71 × 6 → 426; 58 × 2 → 116; 76 × 8 → 608 / 934 × 89 → 83 126; 843 × 16 → 13 488; 491 × 19 → 9329; 505 × 73 → 36 865 | ☐ |

### Bahagi

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `div` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 82467 | 160 ÷ 2 = ? | 23 130 ÷ 45 = ? | 80 / 514 | ☐ |
| `div_fill` (T2-6) | isi tempat kosong | 2 – 69715 | 657 ÷ ___ = 73 | ___ ÷ 41 = 596 | 9 / 24 436 | ☐ |
| `word_div` (T2-6) | soalan cerita | 2 – 77283 | Devi ada 672 biji belon. Dia membahagikan sama banyak kepada 8 orang kawan. Berapakah belon yang diterima oleh seorang kawan? | Ali ada 8642 biji epal. Dia membahagikan sama banyak kepada 29 orang kawan. Berapakah epal yang diterima oleh seorang kawan? — pilihan: 288 / 296 / 1298 / 298 | 84 / 298 | ☐ |
| `div_rem` (T4-6) | jawapan nombor | 3 – 1154 | Berapakah baki apabila 85 dibahagi dengan 8? — pilihan: 9 / 5 / 8 / 4 | Berapakah baki apabila 464 dibahagi dengan 5? | 5 / 4 | ☐ |
| `div_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (567 ÷ 9; 648 ÷ 8; 384 ÷ 4; 336 ÷ 6) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (15 486 ÷ 58; 44 880 ÷ 60; 41 951 ÷ 91; 10 421 ÷ 17) | 567 ÷ 9 → 63; 648 ÷ 8 → 81; 384 ÷ 4 → 96; 336 ÷ 6 → 56 / 15 486 ÷ 58 → 267; 44 880 ÷ 60 → 748; 41 951 ÷ 91 → 461; 10 421 ÷ 17 → 613 | ☐ |

### Pecahan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `frac_visual` (T2-6) | visual | - | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 1/2 / 1/3 / 1/4 / 2/3 | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 2/8 / 2/7 / 2/6 / 1/7 | 1/2 / 2/6 | ☐ |
| `frac_of` (T2-6) | isi tempat kosong, soalan cerita | 1 – 500 | Farid mempunyai 240 keping biskut. Dia memberi 2/6 daripadanya kepada Kumar. Berapakah biskut yang diberi? | 2/5 daripada 40 = ___ | 80 / 16 | ☐ |
| `frac_add` (T3-6) | pilihan jawapan | 1 – 15 | 2/12 + 8/12 = ? — pilihan: 10/12 / 6/12 / 9/12 / 10/13 | 2/5 + 5/10 = ? — pilihan: 7/10 / 10/10 / 9/10 / 8/10 | 10/12 / 9/10 | ☐ |
| `frac_equiv` (T3-6) | isi tempat kosong | 1 – 60 | 4/6 = ___/12 — pilihan: 13 / 8 / 11 / 7 | 1/2 = ___/12 | 8 / 6 | ☐ |
| `frac_compare` (T3-6) | pilihan jawapan | - | Pecahan manakah yang paling kecil? — pilihan: 3/11 / 7/11 / 6/11 / 2/11 | Pecahan manakah yang paling kecil? — pilihan: 7/8 / 3/8 / 2/8 / 5/8 | 2/11 / 2/8 | ☐ |

### Perpuluhan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `dec_add` (T3-6) | jawapan nombor, pilihan jawapan | 0.14 – 99.97 | 38.31 + 1.52 = ? — pilihan: 39.84 / 39.82 / 39.78 / 39.83 | 69.68 + 95.98 = ? — pilihan: 165.56 / 165.59 / 165.66 / 165.73 | 39.83 / 165.66 | ☐ |
| `dec_sub` (T3-6) | jawapan nombor, pilihan jawapan | 0.25 – 99.56 | 53.39 − 23.41 = ? — pilihan: 29.97 / 29.92 / 30.04 / 29.98 | 42.83 − 34.36 = ? | 29.98 / 8.47 | ☐ |
| `dec_compare` (T3-6) | pilihan jawapan | - | Nombor perpuluhan yang manakah paling kecil? — pilihan: 54.97 / 56.95 / 64.42 / 19.73 | Nombor perpuluhan yang manakah paling besar? — pilihan: 47.67 / 73.52 / 35.42 / 39.69 | 19.73 / 73.52 | ☐ |
| `dec_frac` (T3-6) | isi tempat kosong | 0.02 – 100 | 26/100 = ___ (dalam perpuluhan) | 0.61 = ___/100 | 0.26 / 61 | ☐ |
| `dec_round` (T5-6) | jawapan nombor, pilihan jawapan | 1 – 99.59 | Bundarkan 7.41 kepada 1 tempat perpuluhan. | Bundarkan 77.91 kepada 1 tempat perpuluhan. — pilihan: 77.2 / 77.9 / 77.7 / 77.6 | 7.4 / 77.9 | ☐ |
| `dec_mul` (T5-6) | jawapan nombor, pilihan jawapan | 0.13 – 19.88 | 8.7 × 9 = ? | 1.58 × 5 = ? — pilihan: 7.90 / 7.93 / 7.86 / 7.89 | 78.3 / 7.90 | ☐ |
| `dec_word` (T4-6) | soalan cerita | 0.57 – 49.94 | Beg A berjisim 25.87 kg dan beg B berjisim 16.18 kg. Berapakah jumlah jisim kedua-dua beg (dalam kg)? (kg) | Beg A berjisim 4.93 kg dan beg B berjisim 0.66 kg. Berapakah jumlah jisim kedua-dua beg (dalam kg)? (kg) | 42.05 kg / 5.59 kg | ☐ |

### Wang

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `money_add` (T1-6) | pilihan jawapan, jawapan nombor | 101.55 – 44406.95 | RM122.60 + RM835.55 = ___ (dalam RM) — pilihan: RM958.30 / RM958.15 / RM958.35 / RM958.40 | RM22984.15 + RM14491.15 = ___ (dalam RM) | RM958.15 / RM37475.30 | ☐ |
| `money_match` (T1-6) | padanan seret-lepas | - | Padankan jumlah wang dengan jawapan yang betul. (RM369.35 + RM199.05; RM732.65 + RM100.15; RM220.70 + RM537.30; RM686.35 + RM115.65) | Padankan jumlah wang dengan jawapan yang betul. (RM9422.35 + RM5144.95; RM5169.40 + RM18731.30; RM6387.70 + RM20481.90; RM32996.35 + RM10961.80) | RM369.35 + RM199.05 → RM568.40; RM732.65 + RM100.15 → RM832.80; RM220.70 + RM537.30 → RM758.00; RM686.35 + RM115.65 → RM802.00 / RM9422.35 + RM5144.95 → RM14567.30; RM5169.40 + RM18731.30 → RM23900.70; RM6387.70 + RM20481.90 → RM26869.60; RM32996.35 + RM10961.80 → RM43958.15 | ☐ |
| `money_change` (T1-6) | soalan cerita | 0.2 – 1000 | Aminah membeli sebuah beg sekolah berharga RM561.60. Dia membayar RM1000. Berapakah baki yang diterima? | Aminah membeli sebuah topi berharga RM161.20. Dia membayar RM500. Berapakah baki yang diterima? — pilihan: RM338.30 / RM338.80 / RM338.90 / RM338.85 | RM438.40 / RM338.80 | ☐ |
| `money_buy` (T2-6) | soalan cerita | 0.5 – 20 | Wei Jie membeli 12 buku cerita dengan harga RM7.00 sebuah. Berapakah jumlah yang perlu dibayar? — pilihan: RM82.00 / RM84.00 / RM86.50 / RM89.00 | Aisyah membeli 2 kotak pensel dengan harga RM2.00 sebuah. Berapakah jumlah yang perlu dibayar? | RM84.00 / RM4.00 | ☐ |

### Masa dan Waktu

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `clock` (T1-6) | visual | - | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 10:15 / 8:15 / 9:15 / 9:30 | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 9:50 / 9:43 / 10:43 / 11:43 | 9:15 / 10:43 | ☐ |
| `convert_time` (T2-6) | isi tempat kosong | 2 – 900 | 2 abad = ___ tahun | 56 hari = ___ minggu | 200 / 8 | ☐ |
| `duration` (T2-6) | soalan cerita | 0 – 45 | Latihan bermula pada pukul 1:30 petang dan tamat pada pukul 6:15 petang. Berapa minitkah tempoh latihan itu? (minit) | Latihan bermula pada pukul 2:15 petang dan tamat pada pukul 3:00 petang. Berapa minitkah tempoh latihan itu? (minit) | 285 minit / 45 minit | ☐ |
| `time24` (T4-6) | pilihan jawapan | 0 – 55 | Tukarkan pukul 6:20 petang kepada sistem 24 jam. — pilihan: 16:20 / 18:20 / 17:20 / 06:20 | Tukarkan pukul 11:15 petang kepada sistem 24 jam. — pilihan: 22:15 / 23:15 / 23:45 / 21:15 | 18:20 / 23:15 | ☐ |

### Ukuran dan Geometri

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `measure_diff` (T2-6) | soalan cerita | 1000 – 8995 | Panjang tali A ialah 5010 cm dan tali B ialah 1974 cm. Berapakah jumlahnya (dalam cm)? (cm) | Jisim guni beras A ialah 5765 kg dan guni beras B ialah 1155 kg. Berapakah bezanya (dalam kg)? (kg) | 6984 cm / 4610 kg | ☐ |
| `measure_convert` (T3-6) | isi tempat kosong | 0.25 – 9000 | 2 kg = ___ g — pilihan: 4000 / 2000 / 1900 / 2100 | 30 mm = ___ cm | 2000 / 3 | ☐ |
| `perimeter` (T3-6) | visual | 4 – 156 | Berapakah perimeter segi empat tepat ini (cm)? [visual: rect] (cm) | Berapakah perimeter segi empat tepat ini (cm)? [visual: rect] (cm) | 60 cm / 108 cm | ☐ |
| `area` (T4-6) | visual | - | Berapakah luas segi empat tepat ini (cm²)? [visual: rect] (cm²) | Berapakah luas segi empat tepat ini (cm²)? [visual: rect] — pilihan: 236 / 336 / 311 / 286 | 480 cm² / 336 | ☐ |
| `volume` (T5-6) | visual | - | Berapakah isi padu kuboid ini (cm³)? [visual: cuboid] (cm³) | Berapakah isi padu kuboid ini (cm³)? [visual: cuboid] — pilihan: 189 / 289 / 129 / 89 | 180 cm³ / 189 | ☐ |

### Penyelesaian Masalah

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `prob_two` (T2-6) | soalan cerita | 1 – 1710 | Ibu membeli 4 kasut dengan harga RM8 sebuah. Ibu membayar RM50. Berapakah baki wang Ibu (RM)? | 693 batang pensel dibahagi sama banyak kepada 7 bakul. Kemudian setiap bakul ditambah 13 batang. Berapakah bilangan pensel dalam satu bakul sekarang? — pilihan: 105 / 212 / 1112 / 112 | RM18 / 112 | ☐ |
| `prob_frac` (T4-6) | soalan cerita | 1 – 990 | Devi ada RM100. Dia membelanjakan 3/4 daripada wang itu. Berapakah baki wang Devi (RM)? | Balqis ada RM375. Dia membelanjakan 4/5 daripada wang itu. Berapakah baki wang Balqis (RM)? | RM25 / RM75 | ☐ |
| `prob_average` (T4-6) | soalan cerita | 1 – 437 | Markah 5 orang murid ialah 154, 167, 102, 113, 39. Berapakah purata markah mereka? | Markah 4 orang murid ialah 43, 63, 82, 116. Berapakah purata markah mereka? | 115 / 76 | ☐ |
| `prob_percent` (T5-6) | soalan cerita | 2 – 400 | Berapakah 40% daripada 80? | Berapakah 20% daripada 20? | 32 / 4 | ☐ |

## Tahun 6

Dunia tersedia: Dunia Nombor, Pulau Tambah dan Tolak, Hutan Darab, Gunung Bahagi, Istana Pecahan, Planet Perpuluhan, Bandar Wang, Dunia Masa dan Waktu, Alam Ukuran, Cabaran Penyelesaian Masalah.


### Nombor dan Nilai Tempat

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `compare` (T1-6) | pilihan jawapan | - | Nombor yang manakah paling besar? — pilihan: 17 292 / 57 688 / 21 319 / 98 132 | Nombor yang manakah paling kecil? — pilihan: 494 657 / 183 814 / 814 813 / 880 398 | 98 132 / 183 814 | ☐ |
| `placevalue` (T2-6) | isi tempat kosong | 1 – 986251 | Nilai digit 7 dalam nombor 13 756 ialah ___ | Nilai digit 2 dalam nombor 234 675 ialah ___ | 700 / 200 000 | ☐ |
| `skip` (T1-6) | isi tempat kosong | 0 – 225000 | Lengkapkan urutan nombor: 30 000, ___, 50 000, 60 000, 70 000 | Lengkapkan urutan nombor: 7500, 10 000, ___, 15 000, 17 500 | 40 000 / 12 500 | ☐ |
| `round` (T3-6) | jawapan nombor | 3011 – 996514 | Bundarkan 68 373 kepada ratus yang terdekat. | Bundarkan 38 973 kepada ribu yang terdekat. | 68 400 / 39 000 | ☐ |

### Tambah dan Tolak

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `add` (T1-6) | pilihan jawapan, jawapan nombor | 10001 – 899639 | 69 852 + 21 223 = ? | 318 575 + 495 513 = ? | 91 075 / 814 088 | ☐ |
| `sub` (T1-6) | jawapan nombor, pilihan jawapan | 10197 – 988875 | 59 121 − 53 635 = ? | 510 369 − 413 531 = ? | 5486 / 96 838 | ☐ |
| `addmissing` (T1-6) | isi tempat kosong | 10440 – 998972 | ___ + 34 648 = 70 987 | 222 682 + ___ = 971 817 | 36 339 / 749 135 | ☐ |
| `submissing` (T1-6) | isi tempat kosong | 1005 – 976861 | 29 785 − ___ = 27 105 | 355 459 − ___ = 7308 | 2680 / 348 151 | ☐ |
| `word_addsub` (T1-6) | soalan cerita | 10795 – 999994 | Balqis ada 69 106 biji bola. Dia memberikan 14 262 biji bola kepada Adam. Berapakah baki bola Balqis? — pilihan: 55 844 / 54 842 / 54 944 / 54 844 | Adam ada 976 073 batang pensel. Dia memberikan 170 231 batang pensel kepada Balqis. Berapakah baki pensel Adam? | 54 844 / 805 842 | ☐ |
| `mixed3` (T2-6) | jawapan nombor, pilihan jawapan | 1001 – 999934 | 21 957 + 24 168 − 10 503 = ? | 945 791 − 122 177 + 354 322 = ? — pilihan: 1 177 916 / 1 177 836 / 1 177 936 / 1 178 036 | 35 622 / 1 177 936 | ☐ |
| `add_match` (T1-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (24 366 + 21 105; 45 153 + 23 715; 41 140 + 56 623; 78 836 + 18 975) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (828 983 + 157 855; 545 748 + 293 447; 294 322 + 638 148; 350 958 + 313 150) | 24 366 + 21 105 → 45 471; 45 153 + 23 715 → 68 868; 41 140 + 56 623 → 97 763; 78 836 + 18 975 → 97 811 / 828 983 + 157 855 → 986 838; 545 748 + 293 447 → 839 195; 294 322 + 638 148 → 932 470; 350 958 + 313 150 → 664 108 | ☐ |

### Darab

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `mul` (T2-6) | pilihan jawapan, jawapan nombor | 2 – 997 | 539 × 9 = ? — pilihan: 4857 / 4851 / 4854 / 4751 | 574 × 79 = ? | 4851 / 45 346 | ☐ |
| `mul_fill` (T2-6) | isi tempat kosong | 2 – 90992 | ___ × 2 = 462 | 292 × ___ = 14 600 | 231 / 50 | ☐ |
| `word_mul` (T2-6) | soalan cerita | 2 – 999 | Hafiz mempunyai 658 kotak. Setiap kotak mengandungi 3 biji belon. Berapakah jumlah belon semuanya? | Ali mempunyai 686 kotak. Setiap kotak mengandungi 64 ekor ikan. Berapakah jumlah ikan semuanya? — pilihan: 43 897 / 43 908 / 44 004 / 43 904 | 1974 / 43 904 | ☐ |
| `mul_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (784 × 7; 168 × 6; 300 × 4; 539 × 5) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (743 × 62; 401 × 24; 417 × 75; 378 × 78) | 784 × 7 → 5488; 168 × 6 → 1008; 300 × 4 → 1200; 539 × 5 → 2695 / 743 × 62 → 46 066; 401 × 24 → 9624; 417 × 75 → 31 275; 378 × 78 → 29 484 | ☐ |

### Bahagi

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `div` (T2-6) | jawapan nombor, pilihan jawapan | 2 – 91632 | 3952 ÷ 4 = ? — pilihan: 994 / 988 / 1988 / 984 | 5104 ÷ 16 = ? — pilihan: 312 / 339 / 419 / 319 | 988 / 319 | ☐ |
| `div_fill` (T2-6) | isi tempat kosong | 2 – 84768 | ___ ÷ 7 = 514 | ___ ÷ 72 = 891 | 3598 / 64 152 | ☐ |
| `word_div` (T2-6) | soalan cerita | 2 – 93555 | Wei Jie ada 4210 kuntum bunga. Dia membahagikan sama banyak kepada 5 orang kawan. Berapakah bunga yang diterima oleh seorang kawan? | Aminah ada 30 174 biji belon. Dia membahagikan sama banyak kepada 94 orang kawan. Berapakah belon yang diterima oleh seorang kawan? | 842 / 321 | ☐ |
| `div_rem` (T4-6) | jawapan nombor | 3 – 1076 | Berapakah baki apabila 122 dibahagi dengan 6? | Berapakah baki apabila 689 dibahagi dengan 12? | 2 / 5 | ☐ |
| `div_match` (T2-6) | padanan seret-lepas | - | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (4644 ÷ 6; 2988 ÷ 3; 3372 ÷ 4; 354 ÷ 2) | Seret dan padankan setiap ayat nombor dengan jawapan yang betul. (8645 ÷ 35; 51 040 ÷ 80; 27 720 ÷ 55; 30 176 ÷ 41) | 4644 ÷ 6 → 774; 2988 ÷ 3 → 996; 3372 ÷ 4 → 843; 354 ÷ 2 → 177 / 8645 ÷ 35 → 247; 51 040 ÷ 80 → 638; 27 720 ÷ 55 → 504; 30 176 ÷ 41 → 736 | ☐ |

### Pecahan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `frac_visual` (T2-6) | visual | - | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 1/5 / 1/6 / 5/6 / 2/5 | Pecahan manakah yang mewakili bahagian berwarna? [visual: pie] — pilihan: 2/6 / 4/7 / 5/6 / 4/6 | 1/5 / 4/6 | ☐ |
| `frac_of` (T2-6) | isi tempat kosong, soalan cerita | 1 – 480 | 4/8 daripada 104 = ___ | 2/10 daripada 330 = ___ | 52 / 66 | ☐ |
| `frac_add` (T3-6) | pilihan jawapan | 1 – 15 | 3/6 + 1/6 = ? — pilihan: 4/12 / 4/6 / 2/6 / 5/6 | 2/4 + 2/8 = ? — pilihan: 4/8 / 3/4 / 7/8 / 4/12 | 4/6 / 3/4 | ☐ |
| `frac_equiv` (T3-6) | isi tempat kosong | 1 – 60 | 2/4 = ___/12 | 1/6 = ___/36 | 6 / 6 | ☐ |
| `frac_compare` (T3-6) | pilihan jawapan | - | Pecahan manakah yang paling besar? — pilihan: 1/7 / 2/7 / 5/7 / 6/7 | Pecahan manakah yang paling besar? — pilihan: 5/7 / 1/7 / 4/7 / 6/7 | 6/7 / 6/7 | ☐ |

### Perpuluhan

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `dec_add` (T3-6) | jawapan nombor, pilihan jawapan | 0.12 – 999.35 | 667.35 + 931.53 = ? — pilihan: 1599.08 / 1598.81 / 1598.68 / 1598.88 | 630.33 + 18.82 = ? | 1598.88 / 649.15 | ☐ |
| `dec_sub` (T3-6) | jawapan nombor, pilihan jawapan | 1.69 – 995.14 | 786.18 − 293.76 = ? | 933.37 − 548.10 = ? | 492.42 / 385.27 | ☐ |
| `dec_compare` (T3-6) | pilihan jawapan | - | Nombor perpuluhan yang manakah paling besar? — pilihan: 226.18 / 337.18 / 619.10 / 28.77 | Nombor perpuluhan yang manakah paling besar? — pilihan: 385.03 / 239.98 / 595.90 / 104.15 | 619.10 / 595.90 | ☐ |
| `dec_frac` (T3-6) | isi tempat kosong | 0.02 – 100 | 70/100 = ___ (dalam perpuluhan) | 99/100 = ___ (dalam perpuluhan) — pilihan: 1.02 / 1.03 / 0.98 / 0.99 | 0.70 / 0.99 | ☐ |
| `dec_round` (T5-6) | jawapan nombor, pilihan jawapan | 1 – 99.11 | Bundarkan 6.78 kepada 1 tempat perpuluhan. | Bundarkan 55.15 kepada 1 tempat perpuluhan. | 6.8 / 55.2 | ☐ |
| `dec_mul` (T5-6) | jawapan nombor, pilihan jawapan | 0.49 – 99.81 | 3.7 × 3 = ? | 22.39 × 8 = ? | 11.1 / 179.12 | ☐ |
| `dec_word` (T4-6) | soalan cerita | 0.52 – 49.81 | Farid mempunyai pita sepanjang 16.04 m. Dia memotong 2.85 m. Berapakah baki pita (dalam m)? — pilihan: 13.23 / 13.22 / 13.16 / 13.19 | Beg A berjisim 18.99 kg dan beg B berjisim 5.46 kg. Berapakah jumlah jisim kedua-dua beg (dalam kg)? — pilihan: 24.50 / 24.45 / 24.47 / 24.40 | 13.19 / 24.45 | ☐ |

### Wang

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `money_add` (T1-6) | pilihan jawapan, jawapan nombor | 505.65 – 89824.55 | RM3470.25 + RM987.90 = ___ (dalam RM) | RM31010.10 + RM35587.15 = ___ (dalam RM) — pilihan: RM66596.25 / RM66597.25 / RM66597.10 / RM66597.60 | RM4458.15 / RM66597.25 | ☐ |
| `money_match` (T1-6) | padanan seret-lepas | - | Padankan jumlah wang dengan jawapan yang betul. (RM896.00 + RM1465.85; RM838.60 + RM2086.20; RM2847.80 + RM606.45; RM1247.70 + RM1174.65) | Padankan jumlah wang dengan jawapan yang betul. (RM65661.50 + RM17385.00; RM21127.40 + RM59712.95; RM33258.20 + RM12538.90; RM55569.70 + RM12028.55) | RM896.00 + RM1465.85 → RM2361.85; RM838.60 + RM2086.20 → RM2924.80; RM2847.80 + RM606.45 → RM3454.25; RM1247.70 + RM1174.65 → RM2422.35 / RM65661.50 + RM17385.00 → RM83046.50; RM21127.40 + RM59712.95 → RM80840.35; RM33258.20 + RM12538.90 → RM45797.10; RM55569.70 + RM12028.55 → RM67598.25 | ☐ |
| `money_change` (T1-6) | soalan cerita | 0.4 – 1000 | Wei Jie membeli sebuah kotak pensel berharga RM282.85. Dia membayar RM500. Berapakah baki yang diterima? | Devi membeli sebuah mainan berharga RM970.80. Dia membayar RM1000. Berapakah baki yang diterima? | RM217.15 / RM29.20 | ☐ |
| `money_buy` (T2-6) | soalan cerita | 0.5 – 18 | Farid membeli 2 topi dengan harga RM3.50 sebuah. Berapakah jumlah yang perlu dibayar? | Hafiz membeli 5 kotak pensel dengan harga RM4.50 sebuah. Berapakah jumlah yang perlu dibayar? | RM7.00 / RM22.50 | ☐ |

### Masa dan Waktu

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `clock` (T1-6) | visual | - | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 7:25 / 2:35 / 7:40 / 7:10 | Pukul berapakah yang ditunjukkan oleh jam? [visual: clock] — pilihan: 11:21 / 12:51 / 12:36 / 12:21 | 7:10 / 12:21 | ☐ |
| `convert_time` (T2-6) | isi tempat kosong | 2 – 900 | 5 abad = ___ tahun — pilihan: 500 / 400 / 1500 / 495 | 3 minggu = ___ hari | 500 / 21 | ☐ |
| `duration` (T2-6) | soalan cerita | 0 – 45 | Latihan bermula pada pukul 5:00 petang dan tamat pada pukul 10:00 petang. Berapa minitkah tempoh latihan itu? (minit) | Latihan bermula pada pukul 3:00 petang dan tamat pada pukul 7:45 petang. Berapa minitkah tempoh latihan itu? — pilihan: 210 / 1285 / 135 / 285 | 300 minit / 285 | ☐ |
| `time24` (T4-6) | pilihan jawapan | 0 – 55 | Tukarkan pukul 6:25 petang kepada sistem 24 jam. — pilihan: 16:25 / 18:25 / 17:25 / 06:25 | Tukarkan pukul 5:35 petang kepada sistem 24 jam. — pilihan: 17:35 / 05:35 / 17:05 / 15:35 | 18:25 / 17:35 | ☐ |

### Ukuran dan Geometri

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `measure_diff` (T2-6) | soalan cerita | 1000 – 8990 | Isi padu botol air A ialah 4789 ml dan botol air B ialah 1449 ml. Berapakah bezanya (dalam ml)? (ml) | Isi padu botol air A ialah 5840 ml dan botol air B ialah 3439 ml. Berapakah jumlahnya (dalam ml)? (ml) | 3340 ml / 9279 ml | ☐ |
| `measure_convert` (T3-6) | isi tempat kosong | 0.25 – 9000 | 8 cm = ___ mm | 7.5 mm = ___ cm | 80 / 0.75 | ☐ |
| `perimeter` (T3-6) | visual | 4 – 358 | Berapakah perimeter segi empat tepat ini (cm)? [visual: rect] (cm) | Perimeter sebuah segi empat tepat ialah 286 cm. Panjangnya 79 cm. Berapakah lebarnya (cm)? [visual: rect] (cm) | 176 cm / 64 cm | ☐ |
| `area` (T4-6) | visual | - | Berapakah luas segi empat tepat ini (cm²)? [visual: rect] (cm²) | Berapakah luas segi empat tepat ini (cm²)? [visual: rect] (cm²) | 207 cm² / 1160 cm² | ☐ |
| `volume` (T5-6) | visual | - | Berapakah isi padu kuboid ini (cm³)? [visual: cuboid] — pilihan: 2440 / 1380 / 1440 / 1400 | Berapakah isi padu kuboid ini (cm³)? [visual: cuboid] (cm³) | 1440 / 3600 cm³ | ☐ |

### Penyelesaian Masalah

| Templat | Jenis | Julat | Contoh Mudah | Contoh Pakar | Jawapan (Mudah / Pakar) | Semak |
|---|---|---|---|---|---|---|
| `prob_two` (T2-6) | soalan cerita | 1 – 1503 | Ibu membeli 6 kotak pensel dengan harga RM23 sebuah. Ibu membayar RM500. Berapakah baki wang Ibu (RM)? | Ibu membeli 2 kotak pensel dengan harga RM42 sebuah. Ibu membayar RM100. Berapakah baki wang Ibu (RM)? | RM362 / RM16 | ☐ |
| `prob_frac` (T4-6) | soalan cerita | 1 – 990 | Devi ada RM188. Dia membelanjakan 1/4 daripada wang itu. Berapakah baki wang Devi (RM)? | Aisyah ada RM220. Dia membelanjakan 3/5 daripada wang itu. Berapakah baki wang Aisyah (RM)? | RM141 / RM88 | ☐ |
| `prob_average` (T4-6) | soalan cerita | 2 – 372 | Markah 5 orang murid ialah 113, 140, 122, 177, 118. Berapakah purata markah mereka? | Markah 4 orang murid ialah 109, 89, 88, 10. Berapakah purata markah mereka? | 134 / 74 | ☐ |
| `prob_percent` (T5-6) | soalan cerita | 2 – 400 | Berapakah 10% daripada 50? | Harga sehelai baju ialah RM4. Kedai memberi diskaun 50%. Berapakah harga selepas diskaun (RM)? | 5 / RM2 | ☐ |

## Struktur 10 tahap bagi setiap dunia

Setiap tahap menggunakan templat yang disenaraikan; templat yang tidak sesuai untuk tahun murid ditapis secara automatik. Pentadbir boleh mengubah struktur ini dalam Konfigurasi Tahap.


**Dunia Nombor** (Tahun 1+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Mengira Objek | mudah | `count`, `compare` | 70% | - |
| 2 | Urutan Nombor | mudah | `skip`, `evenodd` | 70% | - |
| 3 | Nilai Tempat | sederhana | `count`, `compare`, `skip`, `evenodd` | 70% | - |
| 4 | Nombor Hilang | sederhana | `placevalue`, `skip` | 70% | - |
| 5 | Banding Nombor | sederhana | `compare`, `count` | 70% | - |
| 6 | Soalan Pantas Nombor | sederhana | `skip`, `round` | 70% | - |
| 7 | Nombor Bercampur | sukar | `count`, `compare`, `skip`, `evenodd`, `placevalue`, `round` | 70% | - |
| 8 | Cabaran Masa Nombor | sukar | `count`, `compare`, `skip`, `evenodd`, `placevalue`, `round` | 70% | 30s |
| 9 | Nombor Lanjutan | pakar | `round`, `placevalue`, `skip`, `round` | 70% | - |
| 10 👹 | Bos Akhir: Raja Nombor | pakar | `count`, `compare`, `skip`, `evenodd`, `placevalue`, `round` | 70% | - |

**Pulau Tambah dan Tolak** (Tahun 1+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Tambah Asas | mudah | `add`, `add_visual` | 70% | - |
| 2 | Tolak Asas | mudah | `sub` | 70% | - |
| 3 | Tambah dan Tolak | sederhana | `add`, `add_visual`, `sub` | 70% | - |
| 4 | Nombor Hilang | sederhana | `addmissing`, `submissing` | 70% | - |
| 5 | Padanan Pantas | sederhana | `add_match` | 70% | - |
| 6 | Soalan Cerita | sederhana | `word_addsub` | 70% | - |
| 7 | Operasi Bercampur | sukar | `add`, `add_visual`, `sub`, `addmissing`, `submissing`, `add_match`, `word_addsub`, `mixed3`, `prob_two` | 70% | - |
| 8 | Cabaran Masa | sukar | `add`, `add_visual`, `sub`, `addmissing`, `submissing`, `add_match`, `word_addsub`, `mixed3`, `prob_two` | 70% | 30s |
| 9 | Penyelesaian Lanjutan | pakar | `mixed3`, `prob_two`, `word_addsub` | 70% | - |
| 10 👹 | Bos Akhir: Raja Tambah Tolak | pakar | `add`, `add_visual`, `sub`, `addmissing`, `submissing`, `add_match`, `word_addsub`, `mixed3`, `prob_two` | 70% | - |

**Hutan Darab** (Tahun 2+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Sifir Asas | mudah | `mul`, `mul_groups` | 70% | - |
| 2 | Sifir Lengkap | mudah | `mul_fill` | 70% | - |
| 3 | Darab Hilang | sederhana | `mul`, `mul_groups`, `mul_fill` | 70% | - |
| 4 | Darab Pantas | sederhana | `mul_fill`, `mul` | 70% | - |
| 5 | Padanan Darab | sederhana | `mul_match` | 70% | - |
| 6 | Soalan Cerita Darab | sederhana | `word_mul` | 70% | - |
| 7 | Darab Bercampur | sukar | `mul`, `mul_groups`, `mul_fill`, `mul_match`, `word_mul`, `prob_two` | 70% | - |
| 8 | Cabaran Masa Darab | sukar | `mul`, `mul_groups`, `mul_fill`, `mul_match`, `word_mul`, `prob_two` | 70% | 30s |
| 9 | Darab Lanjutan | pakar | `mul`, `prob_two`, `word_mul` | 70% | - |
| 10 👹 | Bos Akhir: Juara Darab | pakar | `mul`, `mul_groups`, `mul_fill`, `mul_match`, `word_mul`, `prob_two` | 70% | - |

**Gunung Bahagi** (Tahun 2+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Bahagi Asas | mudah | `div` | 70% | - |
| 2 | Bahagi Hilang | mudah | `div_fill` | 70% | - |
| 3 | Bahagi Sama Banyak | sederhana | `div`, `div_fill` | 70% | - |
| 4 | Bahagi Pantas | sederhana | `div_fill`, `div` | 70% | - |
| 5 | Padanan Bahagi | sederhana | `div_match` | 70% | - |
| 6 | Soalan Cerita Bahagi | sederhana | `word_div` | 70% | - |
| 7 | Bahagi Bercampur | sukar | `div`, `div_fill`, `div_match`, `word_div`, `div_rem`, `prob_two` | 70% | - |
| 8 | Cabaran Masa Bahagi | sukar | `div`, `div_fill`, `div_match`, `word_div`, `div_rem`, `prob_two` | 70% | 30s |
| 9 | Bahagi Lanjutan | pakar | `div_rem`, `prob_two`, `word_div` | 70% | - |
| 10 👹 | Bos Akhir: Wira Bahagi | pakar | `div`, `div_fill`, `div_match`, `word_div`, `div_rem`, `prob_two` | 70% | - |

**Istana Pecahan** (Tahun 2+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Kenal Pecahan | mudah | `frac_visual`, `frac_of` | 70% | - |
| 2 | Pecahan Berwarna | mudah | `frac_visual`, `frac_compare` | 70% | - |
| 3 | Pecahan Setara | sederhana | `frac_visual`, `frac_of`, `frac_visual`, `frac_compare` | 70% | - |
| 4 | Banding Pecahan | sederhana | `frac_equiv`, `frac_of` | 70% | - |
| 5 | Pecahan Pantas | sederhana | `frac_compare`, `frac_visual` | 70% | - |
| 6 | Pecahan Cerita | sederhana | `frac_of`, `prob_frac` | 70% | - |
| 7 | Tambah Pecahan | sukar | `frac_visual`, `frac_of`, `frac_compare`, `frac_equiv`, `prob_frac`, `frac_add` | 70% | - |
| 8 | Cabaran Masa Pecahan | sukar | `frac_visual`, `frac_of`, `frac_compare`, `frac_equiv`, `prob_frac`, `frac_add` | 70% | 30s |
| 9 | Pecahan Lanjutan | pakar | `frac_add`, `frac_equiv`, `prob_frac`, `frac_of`, `prob_frac` | 70% | - |
| 10 👹 | Bos Akhir: Penjaga Istana | pakar | `frac_visual`, `frac_of`, `frac_compare`, `frac_equiv`, `prob_frac`, `frac_add` | 70% | - |

**Planet Perpuluhan** (Tahun 3+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Tambah Perpuluhan | mudah | `dec_add` | 70% | - |
| 2 | Tolak Perpuluhan | mudah | `dec_sub` | 70% | - |
| 3 | Banding Perpuluhan | sederhana | `dec_add`, `dec_sub` | 70% | - |
| 4 | Perpuluhan dan Pecahan | sederhana | `dec_compare`, `dec_frac` | 70% | - |
| 5 | Perpuluhan Pantas | sederhana | `dec_compare`, `dec_add` | 70% | - |
| 6 | Cerita Perpuluhan | sederhana | `dec_word` | 70% | - |
| 7 | Perpuluhan Bercampur | sukar | `dec_add`, `dec_sub`, `dec_compare`, `dec_frac`, `dec_word`, `dec_round`, `dec_mul` | 70% | - |
| 8 | Cabaran Masa Perpuluhan | sukar | `dec_add`, `dec_sub`, `dec_compare`, `dec_frac`, `dec_word`, `dec_round`, `dec_mul` | 70% | 30s |
| 9 | Perpuluhan Lanjutan | pakar | `dec_round`, `dec_mul`, `dec_word`, `dec_word` | 70% | - |
| 10 👹 | Bos Akhir: Kapten Angkasa | pakar | `dec_add`, `dec_sub`, `dec_compare`, `dec_frac`, `dec_word`, `dec_round`, `dec_mul` | 70% | - |

**Bandar Wang** (Tahun 1+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Kira Wang | mudah | `money_add` | 70% | - |
| 2 | Kira Baki | mudah | `money_change` | 70% | - |
| 3 | Wang Bercampur | sederhana | `money_add`, `money_change` | 70% | - |
| 4 | Padanan Wang | sederhana | `money_add`, `money_change` | 70% | - |
| 5 | Wang Pantas | sederhana | `money_match` | 70% | - |
| 6 | Beli Barang | sederhana | `money_buy`, `money_change` | 70% | - |
| 7 | Belanjawan | sukar | `money_add`, `money_change`, `money_match`, `money_buy`, `prob_two` | 70% | - |
| 8 | Cabaran Masa Wang | sukar | `money_add`, `money_change`, `money_match`, `money_buy`, `prob_two` | 70% | 30s |
| 9 | Wang Lanjutan | pakar | `money_buy`, `money_change`, `prob_two`, `money_buy`, `money_change` | 70% | - |
| 10 👹 | Bos Akhir: Raja Saudagar | pakar | `money_add`, `money_change`, `money_match`, `money_buy`, `prob_two` | 70% | - |

**Dunia Masa dan Waktu** (Tahun 1+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Baca Jam | mudah | `clock` | 70% | - |
| 2 | Jam dan Kalendar | mudah | `clock`, `days_months` | 70% | - |
| 3 | Tukar Unit Masa | sederhana | `clock`, `clock`, `days_months` | 70% | - |
| 4 | Jam Pantas | sederhana | `convert_time` | 70% | - |
| 5 | Padanan Masa | sederhana | `clock`, `convert_time` | 70% | - |
| 6 | Tempoh Masa | sederhana | `duration` | 70% | - |
| 7 | Masa Bercampur | sukar | `clock`, `days_months`, `convert_time`, `duration`, `time24` | 70% | - |
| 8 | Cabaran Masa Jam | sukar | `clock`, `days_months`, `convert_time`, `duration`, `time24` | 70% | 30s |
| 9 | Masa Lanjutan | pakar | `duration`, `time24`, `convert_time`, `duration` | 70% | - |
| 10 👹 | Bos Akhir: Penjaga Masa | pakar | `clock`, `days_months`, `convert_time`, `duration`, `time24` | 70% | - |

**Alam Ukuran** (Tahun 1+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Ukur Panjang | mudah | `ruler`, `measure_diff` | 70% | - |
| 2 | Beza dan Jumlah | mudah | `measure_diff`, `measure_convert` | 70% | - |
| 3 | Tukar Unit | sederhana | `ruler`, `measure_diff`, `measure_diff`, `measure_convert` | 70% | - |
| 4 | Perimeter | sederhana | `measure_convert`, `perimeter` | 70% | - |
| 5 | Bentuk dan Ukuran | sederhana | `perimeter`, `area`, `measure_convert` | 70% | - |
| 6 | Cerita Ukuran | sederhana | `measure_diff`, `perimeter` | 70% | - |
| 7 | Luas dan Isi Padu | sukar | `ruler`, `measure_diff`, `measure_convert`, `perimeter`, `area`, `volume` | 70% | - |
| 8 | Cabaran Masa Ukuran | sukar | `ruler`, `measure_diff`, `measure_convert`, `perimeter`, `area`, `volume` | 70% | 30s |
| 9 | Ukuran Lanjutan | pakar | `area`, `volume`, `perimeter`, `measure_diff`, `perimeter` | 70% | - |
| 10 👹 | Bos Akhir: Pakar Ukuran | pakar | `ruler`, `measure_diff`, `measure_convert`, `perimeter`, `area`, `volume` | 70% | - |

**Cabaran Penyelesaian Masalah** (Tahun 1+)

| Tahap | Tajuk | Kesukaran | Templat | Lulus | Masa |
|---|---|---|---|---|---|
| 1 | Cerita Mudah | mudah | `word_addsub`, `prob_two` | 70% | - |
| 2 | Cerita Dua Langkah | mudah | `prob_two` | 70% | - |
| 3 | Cerita Pecahan | sederhana | `word_addsub`, `prob_two`, `prob_two` | 70% | - |
| 4 | Cerita Purata | sederhana | `prob_two`, `prob_frac` | 70% | - |
| 5 | Cerita Campuran | sederhana | `prob_two`, `prob_average` | 70% | - |
| 6 | Cerita Lanjutan | sederhana | `prob_two`, `prob_frac`, `prob_percent` | 70% | - |
| 7 | Cerita Peratus | sukar | `word_addsub`, `prob_two`, `prob_frac`, `prob_average`, `prob_percent` | 70% | - |
| 8 | Cabaran Masa Cerita | sukar | `word_addsub`, `prob_two`, `prob_frac`, `prob_average`, `prob_percent` | 70% | 30s |
| 9 | Masalah Sukar | pakar | `prob_frac`, `prob_percent`, `prob_average`, `prob_two`, `prob_two`, `prob_frac`, `prob_percent` | 70% | - |
| 10 👹 | Bos Akhir: Juara Masalah | pakar | `word_addsub`, `prob_two`, `prob_frac`, `prob_average`, `prob_percent` | 70% | - |

## Perkara yang diketahui untuk disemak

- Pembundaran (`round`, `dec_round`) menggunakan konvensyen "5 ke atas dibundarkan ke atas".
- Pecahan ditulis `a/b` dalam teks biasa; pecahan bercampur dan pecahan tak wajar belum dijana.
- Wang menggunakan nilai sen gandaan 5 (Tahun 2 ke atas) dan syiling 5/10/20/50 sen (Tahun 1).
- Masa 24 jam hanya untuk Tahun 4 ke atas; selang masa tidak melintasi tengah hari.
- Peratus dan purata hanya muncul dari Tahun 4/5; semak kesesuaian dengan DSKP sekolah anda.
- Soalan daripada bank pentadbir (CSV/Excel) tidak termasuk dalam dokumen ini kerana ditulis oleh sekolah.

_Dijana: 2026-11-17. Jumlah templat: 55. Tahap kesukaran: mudah, sederhana, sukar, pakar._
