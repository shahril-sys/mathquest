# MathQuest Adventure: Seni Bina Teknikal

## 1. Pilihan teknologi dan sebabnya

Spesifikasi mencadangkan React, Phaser, NestJS/Express, PostgreSQL dan Prisma. Persekitaran pembangunan ini menyekat pendaftar npm (HTTP 403), jadi pakej luar tidak dapat dipasang. Aplikasi dibina **tanpa sebarang kebergantungan luaran**:

| Lapisan | Cadangan asal | Yang digunakan | Catatan migrasi |
|---|---|---|---|
| Frontend | React + TS + Tailwind + Framer Motion + Phaser | SPA modul ES (vanilla JS), SVG/CSS untuk peta, animasi dan visual soalan | Setiap halaman ialah fungsi `render(el)`; mudah dipindahkan ke komponen React |
| Backend | Express/NestJS | `node:http` + penghala kecil (`src/http.js`) | Pengendali menerima konteks `{db,user,params,body}`; mudah dipetakan ke Express |
| Pangkalan data | PostgreSQL + Prisma | SQLite (`node:sqlite`), mod WAL, kunci asing aktif | SQL piawai; tukar `INTEGER PRIMARY KEY`→`SERIAL`, `datetime('now')`→`now()`. Semua operasi wang/mata di belakang `tx()` |
| Auth | Sesi/JWT | Sesi pelayan, token rawak 256-bit (hash SHA-256 disimpan), kuki `HttpOnly; SameSite=Strict` | |
| Kata laluan | | scrypt (N=16384) + garam rawak | |
| Ujian | | `node:test` | |

Import soalan menerima **.xlsx** melalui pembaca zip/SpreadsheetML tulisan sendiri (`src/lib/xlsx.js`, berasaskan `node:zlib`, dengan had saiz terhadap bom zip) dan CSV. Pembaca belum diuji dengan fail daripada Excel sebenar. SQLite sesuai untuk satu sekolah atau beberapa sekolah kecil pada satu pelayan; untuk berpuluh sekolah, pindahkan ke PostgreSQL.

## 2. Struktur folder

```
migrations/001_init.sql      skema (migrasi berversi; jadual schema_migrations)
src/
  server.js app.js http.js   permulaan, penghantar permintaan, penghala, fail statik, CSV
  auth.js db.js config.js    log masuk/sesi, transaksi/audit/tetapan, persekitaran
  engine/                    generators.js (≈50 templat soalan), check.js, plans.js (10 dunia × 10 tahap), random.js
  services/                  game.js, points.js, rewards.js, questions.js, reports.js, admin.js
  routes/                    auth.js student.js teacher.js admin.js platform.js
  lib/                       security.js constants.js validate.js xlsx.js
  seed.js                    data demo (pemain bot melalui servis sebenar)
public/                      index.html, css/app.css, js/{core,main,student,game,staff,admin}.js
scripts/                     migrate seed backup restore purge ui-smoke docker-smoke curriculum-review
test/                        engine, game, rewards, schools, xlsx (40 ujian)
```

## 3. Skema pangkalan data

Jadual mengikut cadangan: `users`, `roles`, `students`, `teachers`, `classes`, `mathematics_topics`, `questions`, `question_options`, `game_worlds`, `game_levels`, `game_sessions`, `student_answers`, `student_progress`, `point_transactions`, `reward_catalog`, `reward_inventory`, `reward_redemptions`, `achievement_badges`, `student_achievements`, `administrator_audit_logs`, `system_settings`.

Tambahan: `schools` (sedia berbilang sekolah; `school_id` pada pengguna, kelas, hadiah, tetapan), `teacher_classes`, `assignments` (cabaran guru), `session_questions` (soalan yang dijana + jawapan di pelayan), `auth_sessions`, `schema_migrations`.

Kekangan penting:
- `students.points_balance >= 0` dan `reward_inventory CHECK (reserved <= stock)`.
- `point_transactions.idempotency_key UNIQUE` dan `tx_uid UNIQUE`.
- `reward_redemptions.reference_no UNIQUE`, `request_id UNIQUE`.
- Indeks pada pelajar/masa, status tebusan, soalan (topik, tahun, kesukaran).

## 4. Mekanik permainan

- **Dunia → tahap**: 10 dunia, setiap satu 10 tahap lalai (boleh disunting pentadbir: tambah, ubah, nyahaktif). Tahap menyimpan senarai penjana soalan, kesukaran, bilangan soalan, peratus lulus, had masa dan bonus.
- **Tahun**: dunia mempunyai `min_year`. Penjana membesarkan julat nombor mengikut tahun (cth. tambah: T1 ≤ 20, T2 ≤ 100, T3 ≤ 1000 …). Tahun 1 tidak pernah mendapat darab, perpuluhan atau peratus.
- **Soalan**: gabungan bank soalan (disunting pentadbir, ~35% jika ada) dan templat berparameter. Soalan dari bank yang dijawab baru-baru ini dielakkan. Setiap soalan dijana dengan jawapan, penjelasan langkah, petunjuk dan penarik pilihan (mcq).
- **Jenis input**: pilihan, nombor, mengira objek (sentuh), padanan seret-lepas (dengan sentuh-untuk-pilih), isi tempat kosong, visual (jam, pai pecahan, pembaris, bentuk), cerita, bermasa.
- **Sesi**: soalan dan jawapan disimpan di pelayan (`session_questions.secret`). Klien hanya menerima bahagian awam. Jawapan mesti berturutan; jam soalan bermasa bermula di pelayan apabila klien memanggil `/begin`; soalan bermasa tanpa jam sah dikira tamat masa.
- **Bintang**: lulus = 1, ≥90% = 2, 100% = 3.

## 5. Sistem mata

`applyPoints()` ialah satu-satunya pintu masuk ke buku lejar. Ia berjalan dalam `BEGIN IMMEDIATE`, menyemak kunci idempotensi, menolak baki negatif dan mengemas kini `points_balance` serta `points_lifetime`.

| Jenis | Kunci idempotensi | Kesan |
|---|---|---|
| Jawapan betul | `q:lv{level}:{murid}:{idx}` | baki + seumur hidup |
| Tamat tahap | `done:lv{level}:{murid}` | baki + seumur hidup |
| Markah penuh | `perfect:lv{level}:{murid}` | baki + seumur hidup |
| Tamat dunia | `world:{dunia}:{murid}` | baki + seumur hidup |
| Harian | `daily:{tarikh}:{murid}` | baki + seumur hidup |
| Tebus | `redeem:{tebusan}` | baki sahaja |
| Bayaran balik | `refund:{tebusan}` | baki sahaja |
| Pelarasan | UUID | baki sahaja, wajib sebab, direkod audit |

Mata dikira hanya apabila sesi ditamatkan di pelayan; `finishSession` menyimpan keputusan dan mengembalikannya semula jika dipanggil lagi. Papan pendahulu menggunakan `points_lifetime` atau jumlah `lifetime_delta > 0` dalam tempoh, tidak pernah baki tebus. Pentadbir boleh menghidupkan `repeat_rewards` (kunci menggunakan ID sesi) tetapi ia dimatikan secara lalai.

## 6. Tebusan hadiah

`redeem()` dalam satu transaksi: semak ID permintaan (klik dua kali tidak menggandakan), akaun aktif, hadiah aktif, tahun minimum, had setiap murid, stok tersedia (`stock - reserved`) dan baki; kemudian cipta tebusan `menunggu`, `reserved + 1`, tolak mata, jana nombor rujukan `MQ-YYYYMMDD-XXXXXX`.

```
menunggu ─approve→ diluluskan ─ready→ sedia ─collect→ dituntut   (stok fizikal -1, reserved -1)
   │                   │                │
   └──── reject / cancel (+ bayaran balik, reserved -1, sekali sahaja) ────→ ditolak / dibatalkan
```
Peralihan menggunakan `UPDATE … WHERE status = ?` dan kunci `refund:{id}`, jadi permintaan berulang tidak memulangkan dua kali. Murid hanya boleh membatalkan permintaan sendiri semasa `menunggu`. Hanya pentadbir boleh meluluskan, menolak dan merekod penuntutan.

## 7. API (ringkasan)

Semua laluan `/api/*` JSON; kaedah menulis memerlukan `X-Requested-With: mathquest` dan, jika ada, `Origin` sama hos.

- Auth: `POST /auth/login|logout|setup|change-password`, `GET /auth/me`
- Murid: `GET /student/home|worlds|badges|profile|points|redemptions`, `PATCH /student/profile`, `POST /student/levels/:id/start`, `POST /student/daily/start`, `GET /sessions/:id`, `POST /sessions/:id/begin|answer|hint|finish`, `GET /rewards`, `POST /rewards/:id/redeem`, `POST /student/redemptions/:id/cancel`, `GET /leaderboard?type=individual|class|weekly|monthly`
- Guru: `GET /teacher/overview|students|students/:id|classes/:id/report(.csv)|levels|assignments|redemptions`, `POST/DELETE /teacher/assignments`, `PATCH /teacher/levels/:id` (hanya peratus lulus)
- Platform (`/platform/schools`): `GET`, `POST` (sekolah + pentadbir pertama), `PUT /:id` (nama, aktif), `POST /:id/admins`
- Pentadbir (`/admin/*`): `dashboard`, `settings`, `questions` (CRUD + `import`), `worlds`, `levels`, `rewards` (+ `image`, `stock`), `redemptions` (+ `:id/:action`), `students`, `teachers`, `classes`, `users/:id/reset-password`, `students/:id/adjust-points`, `reports/overview|export`, `audit`, `purge`

## 7b. Berbilang sekolah

`schools(active)`, `users.is_platform_admin`, `school_level_settings(school_id, level_id, pass_percent, num_questions, time_limit_sec, bonus_points)` (migrasi 002).

- Data operasi mempunyai `school_id` (terus atau melalui `users`): pengguna, kelas, hadiah, tetapan; setiap laluan pentadbir/guru menapis mengikut sekolah pengguna dan mengembalikan 404 untuk ID sekolah lain.
- Dikongsi: `mathematics_topics`, `game_worlds`/`game_levels` (struktur), `achievement_badges`, soalan bank dengan `school_id IS NULL`. Hanya `is_platform_admin` boleh mengubahnya (pilihan laluan `platform: true` disemak sebelum pengendali).
- Nilai tahap berkesan = lalai tahap ditindih oleh `school_level_settings` (`applyLevelSettings`). Sesi menyimpan `pass_percent` semasa dimulakan.
- Sekolah dinyahaktifkan: `userFromCookie` menolak sesi, `login` memulangkan 403, sesi sedia ada dipadam.
- Had: dunia dan struktur tahap tidak boleh berbeza antara sekolah; satu pangkalan data SQLite untuk semua sekolah.

## 8. Keselamatan dan keselamatan kanak-kanak

- Kata laluan scrypt; kunci akaun 5 minit selepas 5 percubaan gagal; had kadar IP (log masuk 25/min, umum 900/min); masa semakan malar apabila pengguna tiada.
- Kuki `HttpOnly`, `SameSite=Strict`, `Secure` apabila `SECURE_COOKIES=true`; HSTS; CSP `script-src 'self'`; `X-Frame-Options: DENY`.
- Semua paparan data dibina dengan `textContent` (tiada `innerHTML`), eksport CSV menetralkan formula (`= + - @`).
- Muat naik imej disahkan melalui bait ajaib (SVG ditolak), maks 600 KB, nama fail rawak, disimpan di luar folder `public`.
- Pengesahan input di setiap sempadan (`lib/validate.js`, `normalizeQuestion`, `saveSettings`); SQL berparameter sepenuhnya.
- Privasi: tiada nombor kad pengenalan, tiada e-mel/telefon; nama paparan ialah nama samaran yang ditapis; papan pendahulu tidak menunjukkan ID; boleh dimatikan oleh sekolah; tiada iklan, tiada pesanan antara murid, tiada pembayaran wang sebenar.
- Pengekalan data: `retention_days` memadam sesi/jawapan lama dan akaun tidak aktif; `audit_retention_days` untuk log audit; `npm run purge` atau butang dalam Tetapan. Pentadbir boleh memadam semua data seorang murid.
- Peranan: murid / guru (hanya kelas diselia, tebusan baca sahaja) / pentadbir. Semakan peranan di penghala sebelum pengendali dijalankan.

Pematuhan PDPA 2010 dan garis panduan KPM perlu disahkan oleh pihak sekolah. Ini bukan nasihat undang-undang.

## 9. Sandaran dan pemulihan

`npm run backup [dir]` menghasilkan salinan konsisten (`VACUUM INTO`) bersama imej. `npm run restore -- <dir>` memulihkan (hentikan pelayan dahulu; salinan lama disimpan sebagai `.sebelum-pulih`). Jadualkan sandaran harian dengan cron dan simpan di luar pelayan.
