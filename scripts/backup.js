// Sandaran konsisten (VACUUM INTO) + salinan imej muat naik. Guna: npm run backup [direktori]
import fs from 'node:fs';
import path from 'node:path';
import { openDb } from '../src/db.js';
import { config } from '../src/config.js';
const dir = path.resolve(process.argv[2] || path.join(config.dataDir, 'backups'));
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(dir, `mathquest-${stamp}`);
fs.mkdirSync(target, { recursive: true });
const db = openDb();
db.exec(`VACUUM INTO '${path.join(target, 'mathquest.db').replace(/'/g, "''")}'`);
if (fs.existsSync(config.uploadDir)) fs.cpSync(config.uploadDir, path.join(target, 'uploads'), { recursive: true });
db.close();
console.log(`Sandaran disimpan di ${target}`);
