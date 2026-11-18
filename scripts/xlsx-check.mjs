// Mengesahkan pembaca .xlsx dengan fail sebenar yang dihasilkan oleh aplikasi lain (cth LibreOffice).
// Guna: node scripts/xlsx-check.mjs <fail.xlsx>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { readXlsx } from '../src/lib/xlsx.js';

const file = process.argv[2];
if (!file) { console.error('Guna: node scripts/xlsx-check.mjs <fail.xlsx>'); process.exit(2); }
const rows = readXlsx(fs.readFileSync(file));
console.log(JSON.stringify(rows));
assert.deepEqual(rows, [
  ['tahun', 'topik', 'soalan', 'jawapan', 'penjelasan'],
  ['1', 'tambah_tolak', 'Berapakah 3 + 4, kira "dengan jari"?', '7', 'Tiga tambah empat ialah tujuh. Émoji 🎉 & <tag>'],
  ['2', 'pecahan', 'Berapakah 1/2 + 1/4?', '0.75', ''],
]);
console.log('Fail Excel sebenar dibaca dengan betul.');
