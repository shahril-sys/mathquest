import { openDb, migrate } from '../src/db.js';
const db = openDb();
const applied = migrate(db);
console.log(applied.length ? `Migrasi dijalankan: ${applied.join(', ')}` : 'Pangkalan data sudah terkini.');
