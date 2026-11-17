import http from 'node:http';
import { config } from './config.js';
import { openDb, migrate } from './db.js';
import { createApp } from './app.js';

const db = openDb();
const applied = migrate(db);
if (applied.length) console.log('Migrasi dijalankan:', applied.join(', '));
if (!db.prepare('SELECT 1 FROM schools LIMIT 1').get()) console.warn('Pangkalan data kosong. Jalankan "npm run seed" untuk data demo.');

const server = http.createServer(createApp(db));
server.listen(config.port, config.host, () => console.log(`MathQuest berjalan di http://${config.host}:${config.port}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => { db.close(); process.exit(0); }));
