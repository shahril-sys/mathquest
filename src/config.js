import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader (no dependencies). Real environment variables win.
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const dataDir = path.resolve(ROOT, process.env.DATA_DIR || './data');

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  dataDir,
  dbFile: path.join(dataDir, 'mathquest.db'),
  uploadDir: path.join(dataDir, 'uploads'),
  publicDir: path.join(ROOT, 'public'),
  migrationsDir: path.join(ROOT, 'migrations'),
  secureCookies: process.env.SECURE_COOKIES === 'true',
  // Bilangan proksi dipercayai di hadapan aplikasi (0 = tiada). Ditentukan oleh pemasang; X-Forwarded-For tidak dipercayai jika 0.
  trustProxy: Math.max(0, Math.min(5, Number(process.env.TRUST_PROXY || 0))),
  sessionHours: Number(process.env.SESSION_HOURS || 12),
  demoPassword: process.env.DEMO_PASSWORD || 'MathQuest#2026',
};
