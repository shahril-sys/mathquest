# MathQuest Adventure – Misi Matematik & Ganjaran

Permainan matematik pengembaraan untuk murid sekolah rendah Malaysia (Tahun 1-6), lengkap dengan mata, lencana, papan pendahulu, Kedai Ganjaran dan papan pemuka pentadbir. Semua antara muka, soalan dan penjelasan dalam Bahasa Melayu.

Tiada kebergantungan npm. Hanya perlu **Node.js 22.5+** (menggunakan `node:sqlite`, `node:http`, `node:crypto`). Lihat [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) untuk sebab pilihan teknologi dan reka bentuk lengkap.

## Mula pantas (tempatan)

```bash
cp .env.example .env        # pilihan
npm run migrate             # cipta/kemas kini pangkalan data (data/mathquest.db)
npm run seed                # data demo (sekali sahaja, ±10 saat)
npm start                   # http://localhost:3000
npm test                    # 40 ujian automatik
```

Akaun demo (kata laluan `MathQuest#2026`, ubah melalui `DEMO_PASSWORD`):

| Peranan | ID |
|---|---|
| Pentadbir | `admin` |
| Guru | `guru1` (Tahun 1-3), `guru2` (Tahun 4-6) |
| Murid | `M26001` … `M26030` (5 murid setiap tahun; `M26030` belum disediakan, untuk menunjukkan skrin setup akaun) |

Data demo (semua rekaan): 1 pentadbir, 2 guru, 30 murid, 6 kelas, 10 dunia × 10 tahap, 400 soalan bank, 10 hadiah, lebih 2 000 transaksi mata dan beberapa tebusan.

## Berbilang sekolah

Pentadbir pertama (`admin`) ialah **pentadbir platform**. Menu **🏫 Sekolah** membolehkan beliau mendaftar sekolah baharu bersama pentadbir pertamanya (kata laluan sementara dipaparkan sekali), menambah pentadbir, dan menyahaktifkan/mengaktifkan sekolah (pengguna dilog keluar serta-merta; data kekal).

- Setiap sekolah mempunyai murid, guru, kelas, hadiah, stok, tebusan, mata, tetapan dan log audit yang terasing. Semua pertanyaan pentadbir/guru/murid ditapis mengikut sekolah, dan akses melalui ID sekolah lain dijawab 404.
- **Dikongsi** semua sekolah: topik, dunia, struktur tahap (tajuk, kesukaran, templat soalan), lencana dan bank soalan asal. Hanya pentadbir platform boleh mengubahnya.
- **Mengikut sekolah**: peratus lulus, bilangan soalan, had masa dan mata bonus setiap tahap (Konfigurasi Tahap, atau guru melalui Ambang Lulus), semua nilai mata, soalan tambahan milik sekolah, dan tetapan privasi.
- ID pengguna unik merentasi semua sekolah; awali dengan kod sekolah (cth `SKB01-M001`).

## Import soalan dan murid

Import soalan menerima **Excel (.xlsx)** atau CSV. Muat turun templat daripada dialog Import (atau `GET /api/admin/questions/template.xlsx`). Lembaran pertama sahaja dibaca; fail maksimum 1 MB. Penjelasan lajur ada dalam dialog. Murid diimport melalui CSV (`id,nama,tahun,kelas`).

## Konfigurasi (`.env`)

| Pembolehubah | Lalai | Keterangan |
|---|---|---|
| `PORT`, `HOST` | 3000, 0.0.0.0 | alamat pelayan |
| `DATA_DIR` | `./data` | pangkalan data dan imej muat naik |
| `SECURE_COOKIES` | false | **true** apabila di belakang HTTPS |
| `SESSION_HOURS` | 12 | tempoh sesi log masuk |
| `DEMO_PASSWORD` | `MathQuest#2026` | hanya untuk `npm run seed` |

## Pangkalan data

- Migrasi: fail `migrations/*.sql` dijalankan mengikut nama; `npm run migrate` (juga automatik semasa `npm start`).
- Sandaran: `npm run backup [direktori]` (pangkalan data + imej). Pulihkan: hentikan pelayan, `npm run restore -- <direktori-sandaran>`.
- Pembersihan data tamat tempoh (privasi): `npm run purge`, atau butang dalam Tetapan Sistem.

## Penggunaan Docker / produksi

```bash
docker compose up -d --build
docker compose exec mathquest node --disable-warning=ExperimentalWarning scripts/seed.js   # pilihan: data demo
```

Data disimpan dalam volum `mathquest-data` (`/data`). Untuk produksi:
1. Letakkan di belakang proksi terbalik HTTPS (Caddy/Nginx) dan tetapkan `SECURE_COOKIES=true`.
2. Jangan jalankan seed demo; cipta akaun pentadbir pertama dengan skrip di bawah, kemudian tukar kata laluan semasa log masuk pertama.
3. Jadualkan `npm run backup` harian (cron) dan simpan salinan di luar pelayan.
4. Satu proses sahaja boleh menulis ke SQLite; jangan jalankan beberapa replika pada volum sama.

Cipta pentadbir pertama pada pangkalan data kosong:

```bash
node --disable-warning=ExperimentalWarning -e "
import('./src/db.js').then(async (d) => { const { hashPassword } = await import('./src/lib/security.js');
const db = d.openDb(); d.migrate(db);
db.prepare(\"INSERT INTO schools(id,name,code) VALUES (1,'Nama Sekolah','SEK001')\").run();
db.prepare(\"INSERT INTO users(school_id,username,password_hash,role,display_name,must_change_password) VALUES (1,'admin',?, 'pentadbir','Pentadbir',1)\").run(hashPassword('KataLaluanSementara1'));
console.log('Pentadbir dicipta'); })"
```
Kemudian tambah topik, dunia dan tahap melalui `seedDemo` (rujuk `src/seed.js`) atau salin bahagian dunia/tahap/lencana daripadanya. Tandakan pentadbir itu sebagai pentadbir platform: `UPDATE users SET is_platform_admin = 1 WHERE username = 'admin';`

## Ujian

- `npm test` (40 ujian): jana soalan (semua penjana × tahun × kesukaran, jawapan disemak semula secara bebas), pengesahan jawapan, pembukaan tahap, pengiraan mata, pencegahan ganjaran pendua dan penternakan, tebusan, mata tidak cukup, stok habis, tolak/batal dengan bayaran balik idempoten, kebenaran peranan, CSRF, kunci akaun, muat naik imej, import CSV, **tebusan serentak** melalui HTTP, pengasingan data antara sekolah, tetapan tahap setiap sekolah, dan import/eksport Excel.
- `bash scripts/docker-smoke.sh`: bina imej, jalankan, seed, log masuk dan semak kesihatan. Jika Docker tidak tersedia, skrip menyalin hanya fail yang disalin oleh Dockerfile dan menjalankan aplikasi dari susun atur itu.
- `node scripts/curriculum-review.js`: menjana `docs/KURIKULUM-REVIEW.md` (templat soalan mengikut tahun, julat nombor, contoh dan lajur semakan guru).
- `node scripts/ui-smoke.mjs`: ujian hujung-ke-hujung UI dengan Chrome tanpa kepala (perlu `chrome` dalam PATH). Murid bermain satu tahap penuh melalui UI, kemudian halaman murid/guru/pentadbir disemak untuk ralat konsol; tangkapan skrin disimpan di `docs/screenshots/`.

## Had yang diketahui

- Pembaca/penulis .xlsx ditulis tanpa pustaka dan diuji dengan fail buatan sendiri, struktur zip disahkan dengan Python, tetapi **belum dibuka dalam Excel/LibreOffice sebenar**. Jika fail anda ditolak, simpan semula sebagai CSV UTF-8.
- Skrip `docker-smoke.sh` belum dijalankan dalam mod Docker sebenar (Docker tiada dalam persekitaran pembangunan).
- Peta dunia menggunakan SVG/CSS, bukan enjin Phaser; bunyi dijana melalui Web Audio.
- Kesepadanan KSSR/DSKP ialah anggaran berdasarkan topik dan julat nombor mengikut tahun. **Guru/pentadbir perlu mengesahkan** kandungan sebelum digunakan di bilik darjah.
- Pematuhan PDPA dan dasar sekolah perlu disahkan oleh pihak sekolah.
