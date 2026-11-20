# Panduan Penggunaan Produksi

Dua cara: **Docker** (disyorkan) atau **systemd** tanpa Docker. Keduanya diletakkan di belakang proksi terbalik HTTPS.

## 1. Sebelum bermula
- Pelayan Linux dengan Docker, atau Node.js 22.5+.
- Nama domain yang menuju ke pelayan (cth `mathquest.sekolah.edu.my`).
- Jangan jalankan `npm run seed` (data demo). Gunakan `create-admin` di bawah.

## 2. Docker
```bash
git clone https://github.com/shahril-sys/mathquest.git && cd mathquest
cp .env.example .env     # tetapkan SECURE_COOKIES=true dan TRUST_PROXY=1
docker compose up -d --build
docker compose exec mathquest node --disable-warning=ExperimentalWarning scripts/create-admin.js \
  --school "SK Taman Bahagia" --code SKTB01 --user SKTB01-admin --name "Pentadbir TB"
```
Kata laluan sementara dipaparkan sekali. Salin dan simpan; pentadbir menukarnya semasa log masuk pertama.
Pastikan `docker-compose.yml` hanya mendedahkan port ke `127.0.0.1` jika proksi di mesin sama: tukar `"3000:3000"` kepada `"127.0.0.1:3000:3000"`.

## 3. systemd (tanpa Docker)
```bash
sudo useradd -r -m -d /opt/mathquest mathquest
sudo -u mathquest git clone https://github.com/shahril-sys/mathquest.git /opt/mathquest
sudo -u mathquest cp /opt/mathquest/.env.example /opt/mathquest/.env     # edit: SECURE_COOKIES=true, TRUST_PROXY=1
sudo -u mathquest bash -c 'cd /opt/mathquest && npm run create-admin -- --school "SK Taman Bahagia" --code SKTB01 --user SKTB01-admin --name "Pentadbir TB"'
sudo cp /opt/mathquest/deploy/mathquest.service /etc/systemd/system/ && sudo systemctl enable --now mathquest
```

## 4. HTTPS dan proksi terbalik
Pilih satu: `deploy/Caddyfile` (HTTPS automatik, paling mudah) atau `deploy/nginx.conf` (sijil melalui certbot). Tukar nama domain di dalamnya.

**TRUST_PROXY** mesti sepadan dengan bilangan proksi di hadapan aplikasi (satu proksi = `1`). Jika `0` di belakang proksi, semua pengguna kelihatan datang dari satu IP dan had kadar menyekat seluruh sekolah. Jika terlalu besar atau aplikasi didedahkan terus, klien boleh memalsukan IP dan memintas had kadar. Aplikasi membaca entri `X-Forwarded-For` dari kanan, jadi entri palsu di kiri diabaikan.

## 5. Sandaran
```bash
sudo crontab -u mathquest -e
30 2 * * * BACKUP_DIR=/var/backups/mathquest /opt/mathquest/deploy/backup-harian.sh
```
Skrip menyimpan 14 salinan terkini. **Salin folder sandaran ke luar pelayan** (rclone/rsync); sandaran pada cakera yang sama tidak melindungi daripada kegagalan cakera. Dalam Docker: `docker compose exec mathquest node --disable-warning=ExperimentalWarning scripts/backup.js /data/backups`.

Pulihkan: hentikan aplikasi, `npm run restore -- <direktori-sandaran>`, mulakan semula. **Uji pemulihan sekurang-kurangnya sekali sebelum dipercayai.**

## 6. Senarai semak sebelum dibuka kepada murid
- [ ] HTTPS berfungsi dan `http://` dialihkan; `SECURE_COOKIES=true`.
- [ ] `TRUST_PROXY` betul (uji dengan dua peranti berbeza log masuk salah berulang kali: peranti kedua tidak disekat).
- [ ] Tiada akaun demo (`M26001`, `guru1`, kata laluan `MathQuest#2026`).
- [ ] Sandaran harian berjalan dan salinan dihantar keluar pelayan.
- [ ] Guru menyemak `docs/KURIKULUM-REVIEW.md`.
- [ ] Kebenaran ibu bapa/sekolah dan dasar privasi mengikut PDPA diselesaikan oleh pihak sekolah.
- [ ] Tetapan Sistem: tempoh simpanan data dan papan pendahulu awam dikonfigurasi.

## 7. Naik taraf
`git pull`, `docker compose up -d --build` (atau `systemctl restart mathquest`). Migrasi dijalankan automatik semasa permulaan. Ambil sandaran sebelum naik taraf.
