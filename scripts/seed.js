import { openDb, migrate } from '../src/db.js';
import { seedDemo } from '../src/seed.js';
import { config } from '../src/config.js';
const db = openDb();
migrate(db);
if (db.prepare('SELECT 1 FROM schools LIMIT 1').get()) { console.error('Pangkalan data sudah mempunyai data. Padam data/mathquest.db untuk seed semula.'); process.exit(1); }
seedDemo(db, { password: config.demoPassword });
const c = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
console.log(`Seed siap: ${c('users')} pengguna, ${c('questions')} soalan bank, ${c('game_levels')} tahap, ${c('point_transactions')} transaksi mata, ${c('reward_redemptions')} tebusan.`);
console.log(`Log masuk demo: admin / guru1 / guru2 / M26001..M26030  — kata laluan: ${config.demoPassword}`);
