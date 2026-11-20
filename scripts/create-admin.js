// Sediakan pemasangan produksi pada pangkalan data kosong: kandungan asas + sekolah pertama + pentadbir platform.
// Guna: npm run create-admin -- --school "SK Taman Bahagia" --code SKTB01 --user SKTB01-admin --name "Pentadbir TB"
// Kata laluan sementara dijana dan dipaparkan sekali; pentadbir mesti menukarnya semasa log masuk pertama.
import { openDb, migrate, tx, saveSettings, DEFAULT_SETTINGS } from '../src/db.js';
import { seedContent } from '../src/seed.js';
import { createUserAccount } from '../src/auth.js';
import { randomPassword } from '../src/lib/security.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, x, i, all) => (x.startsWith('--') ? [...acc, [x.slice(2), all[i + 1]]] : acc), []));
const need = ['school', 'code', 'user', 'name'].filter((k) => !args[k] || args[k].startsWith('--'));
if (need.length) { console.error(`Hujah tiada: ${need.map((k) => `--${k}`).join(', ')}\nGuna: npm run create-admin -- --school "Nama Sekolah" --code SEK001 --user SEK001-admin --name "Pentadbir"`); process.exit(2); }
if (!/^[A-Z0-9]{3,12}$/.test(args.code.toUpperCase())) { console.error('Kod sekolah: 3-12 huruf besar/nombor.'); process.exit(2); }

const db = openDb();
migrate(db);
if (db.prepare('SELECT 1 FROM schools LIMIT 1').get()) { console.error('Pangkalan data sudah mempunyai sekolah. Guna menu Sekolah dalam aplikasi untuk menambah sekolah lain.'); process.exit(1); }
const password = `${randomPassword()}A`;
try {
  tx(db, () => {
    seedContent(db);
    const sid = Number(db.prepare('INSERT INTO schools(id, name, code) VALUES (1, ?, ?)').run(args.school, args.code.toUpperCase()).lastInsertRowid);
    saveSettings(db, sid, DEFAULT_SETTINGS);
    const uid = createUserAccount(db, null, { username: args.user, password, role: 'pentadbir', displayName: args.name, schoolId: sid });
    db.prepare('UPDATE users SET is_platform_admin = 1 WHERE id = ?').run(uid);
  });
} catch (e) { console.error(`Gagal: ${e.message}`); process.exit(1); }
console.log(`Sekolah "${args.school}" dan pentadbir platform dicipta.\nID: ${args.user}\nKata laluan sementara: ${password}\n(Tukar semasa log masuk pertama. Kata laluan ini tidak dipaparkan lagi.)`);
