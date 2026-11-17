import { openDb, migrate } from '../src/db.js';
import { purgeExpired } from '../src/services/admin.js';
const db = openDb();
migrate(db);
console.log('Pembersihan data tamat tempoh:', purgeExpired(db, 1));
