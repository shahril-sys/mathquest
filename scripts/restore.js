// Pulihkan dari sandaran. Guna: npm run restore -- <direktori-sandaran>   (hentikan pelayan dahulu)
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config.js';
const src = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(src, 'mathquest.db'))) { console.error('Guna: npm run restore -- <direktori-sandaran>'); process.exit(1); }
fs.mkdirSync(config.dataDir, { recursive: true });
if (fs.existsSync(config.dbFile)) fs.copyFileSync(config.dbFile, `${config.dbFile}.sebelum-pulih`);
for (const ext of ['-wal', '-shm']) fs.rmSync(config.dbFile + ext, { force: true });
fs.copyFileSync(path.join(src, 'mathquest.db'), config.dbFile);
if (fs.existsSync(path.join(src, 'uploads'))) fs.cpSync(path.join(src, 'uploads'), config.uploadDir, { recursive: true });
console.log('Pemulihan selesai. Salinan lama disimpan sebagai mathquest.db.sebelum-pulih');
