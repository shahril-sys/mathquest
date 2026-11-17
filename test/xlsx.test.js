import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { readXlsx, writeXlsx, writeZip, readZip } from '../src/lib/xlsx.js';
import { freshDb, startServer } from './helpers.js';

test('xlsx: tulis kemudian baca semula mengekalkan teks Unicode, entiti XML dan nombor', () => {
  const rows = [['tahun', 'soalan', 'nota'], [1, 'Berapakah 2 × 3 < 7 & "betul"?', 'Ayat dengan émoji 🎉 dan\nbaris baharu'], [2, 0.5, '']];
  const back = readXlsx(writeXlsx(rows));
  assert.deepEqual(back, [['tahun', 'soalan', 'nota'], ['1', 'Berapakah 2 × 3 < 7 & "betul"?', 'Ayat dengan émoji 🎉 dan\nbaris baharu'], ['2', '0.5']]);
});

test('xlsx gaya Excel: rentetan kongsi, sel dilangkau, hubungan lembaran tersuai dan sel kosong', () => {
  const ct = '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>';
  const wb = '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="3" r:id="rId9"/><sheet name="Lain" sheetId="4" r:id="rId10"/></sheets></workbook>';
  const rels = '<Relationships><Relationship Id="rId10" Target="worksheets/sheet2.xml" Type="x"/><Relationship Id="rId9" Target="worksheets/data.xml" Type="x"/></Relationships>';
  const sst = '<sst><si><t>tahun</t></si><si><r><t>sol</t></r><r><t xml:space="preserve">an &amp; lain</t></r></si><si><t>Cikgu</t><rPh><t>abaikan</t></rPh></si></sst>';
  const data = '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row><row r="2"><c r="A2"><v>3</v></c><c r="B2" s="4"/><c r="C2" t="s"><v>2</v></c><c r="E2" t="b"><v>1</v></c></row><row r="3"/></sheetData></worksheet>';
  const other = '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>SALAH</t></is></c></row></sheetData></worksheet>';
  const buf = writeZip([['[Content_Types].xml', ct], ['xl/workbook.xml', wb], ['xl/_rels/workbook.xml.rels', rels], ['xl/sharedStrings.xml', sst], ['xl/worksheets/data.xml', data], ['xl/worksheets/sheet2.xml', other]]);
  assert.deepEqual(readXlsx(buf), [['tahun', '', 'solan & lain'], ['3', '', 'Cikgu', '', 'benar']]);
});

test('xlsx: fail rosak, bukan zip, dan bom zip ditolak dengan ralat 400', () => {
  const expect400 = (fn) => assert.throws(fn, (e) => e.status === 400 && /Fail Excel tidak sah/.test(e.message));
  expect400(() => readXlsx(Buffer.from('ini bukan fail excel sama sekali, hanya teks biasa.')));
  expect400(() => readXlsx(Buffer.alloc(10)));
  const good = writeXlsx([['a'], ['b']]);
  expect400(() => readXlsx(good.subarray(0, good.length - 30))); // dipotong: EOCD hilang
  const noBook = writeZip([['hello.txt', 'hai']]);
  expect400(() => readXlsx(noBook));
  // entri yang diisytiharkan 11 MB selepas dinyahmampat (had 10 MB)
  const bomb = writeZip([['[Content_Types].xml', '<a/>'], ['xl/workbook.xml', 'x'.repeat(11 * 1024 * 1024)]]);
  expect400(() => readXlsx(bomb));
  // saiz sebenar melebihi saiz diisytihar -> inflate dihadkan
  const tamper = Buffer.from(writeZip([['[Content_Types].xml', '<a/>'], ['xl/workbook.xml', 'y'.repeat(20 * 1024 * 1024)]]));
  const cd = tamper.lastIndexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  tamper.writeUInt32LE(100, cd + 24); // dakwa 100 bait sahaja
  assert.throws(() => readXlsx(tamper), (e) => e.status === 400);
  assert.equal(readZip(writeZip([['a.txt', 'abc']])).get('a.txt').toString(), 'abc');
  assert.equal(zlib.crc32 ? true : true, true);
});

test('import soalan melalui HTTP dengan Excel: templat boleh dimuat turun dan diimport semula; baris salah dilaporkan', async () => {
  const db = freshDb();
  const srv = await startServer(db);
  try {
    const ad = srv.client(); await ad.login('admin');
    const tpl = await fetch(`${srv.base}/api/admin/questions/template.xlsx`, { headers: { Cookie: (await ad.call('GET', '/api/auth/me')) && '' } });
    assert.equal(tpl.status, 401); // tanpa kuki ditolak

    // muat turun dengan sesi sebenar melalui klien
    const dl = await (async () => { const c = ad; const r = await c.call('GET', '/api/admin/questions/template.xlsx'); return r; })();
    assert.equal(dl.status, 200);
    assert.match(dl.headers.get('content-type'), /spreadsheetml/);
    assert.match(dl.headers.get('content-disposition'), /templat-soalan\.xlsx/);

    const before = db.prepare('SELECT COUNT(*) c FROM questions').get().c;
    const file = writeXlsx([
      ['tahun', 'topik', 'kesukaran', 'jenis', 'soalan', 'jawapan', 'pilihan1', 'pilihan2', 'pilihan3', 'pilihan4', 'padanan', 'penjelasan', 'petunjuk', 'masa'],
      [1, 'tambah_tolak', 'mudah', 'numeric', 'Berapakah 6 + 3?', 9, '', '', '', '', '', '6 tambah 3 ialah 9.', '', ''],
      [1, 'tambah_tolak', 'mudah', 'mcq', 'Berapakah 8 − 5?', '3', 2, 3, 4, 5, '', '8 tolak 5 ialah 3.', 'Kira ke belakang.', 20],
      [2, 'darab', 'sederhana', 'match', 'Padankan darab dengan hasil.', '', '', '', '', '', '2 × 3=6;4 × 5=20;3 × 3=9', 'Guna sifir.', '', ''],
      [7, 'tambah_tolak', 'mudah', 'numeric', 'Tahun tidak sah', 1, '', '', '', '', '', 'penjelasan sah', '', ''],
      [1, 'topik_tiada', 'mudah', 'numeric', 'Topik tidak sah', 1, '', '', '', '', '', 'penjelasan sah', '', ''],
    ]);
    const r = await ad.call('POST', '/api/admin/questions/import', { xlsx: file.toString('base64') });
    assert.equal(r.status, 200);
    assert.equal(r.json.imported, 3);
    assert.equal(r.json.error_count, 2);
    assert.deepEqual(r.json.errors.map((e) => e.row), [5, 6]);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM questions').get().c, before + 3);
    const mc = db.prepare("SELECT q.id, (SELECT text FROM question_options o WHERE o.question_id = q.id AND o.is_correct = 1) AS ok FROM questions q WHERE q.text = 'Berapakah 8 − 5?'").get();
    assert.equal(mc.ok, '3');
    const bad = await ad.call('POST', '/api/admin/questions/import', { xlsx: Buffer.from('bukan zip').toString('base64') });
    assert.equal(bad.status, 400);
    // murid tidak dibenarkan
    const kid = srv.client(); await kid.login('M26006');
    assert.equal((await kid.call('POST', '/api/admin/questions/import', { xlsx: file.toString('base64') })).status, 403);
  } finally { await srv.close(); }
});
