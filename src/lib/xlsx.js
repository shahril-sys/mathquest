/**
 * Minimal, dependency-free .xlsx reader and writer (zip + SpreadsheetML) built on node:zlib.
 * Reader: first worksheet only, values as strings. Writer: one sheet of inline strings/numbers.
 * Defensive limits guard against zip bombs and malformed archives.
 */
import zlib from 'node:zlib';
import { AppError } from '../db.js';

const MAX_ENTRIES = 500;
const MAX_ENTRY_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;
const bad = (m) => { throw new AppError(400, `Fail Excel tidak sah: ${m}`); };

/* ------------------------------------------------------------------ zip reader */
export function readZip(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) bad('terlalu kecil');
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) bad('bukan fail zip');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (count > MAX_ENTRIES || count === 0xffff) bad('terlalu banyak entri');
  const files = new Map();
  let total = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) bad('direktori pusat rosak');
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28); const extraLen = buf.readUInt16LE(p + 30); const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue;
    if (flags & 1) bad('fail disulitkan tidak disokong');
    if (usize > MAX_ENTRY_BYTES) bad(`entri ${name} terlalu besar`);
    total += usize;
    if (total > MAX_TOTAL_BYTES) bad('saiz tidak dimampatkan terlalu besar');
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) bad('pengepala tempatan rosak');
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    if (start + csize > buf.length) bad('data melebihi saiz fail');
    const raw = buf.subarray(start, start + csize);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) { try { data = zlib.inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES }); } catch { bad(`entri ${name} rosak`); } } else bad('kaedah mampatan tidak disokong');
    files.set(name, data);
  }
  return files;
}

/* ------------------------------------------------------------------ xml helpers */
const decode = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e) => {
  if (e[0] === '#') { const cp = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(cp); } catch { return ''; } }
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e];
});
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const textOf = (xml) => [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g)].map((m) => decode(m[1] || '')).join('');
const colIndex = (ref) => { const m = /^([A-Z]+)/.exec(ref); if (!m) return -1; let n = 0; for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

/* ------------------------------------------------------------------ xlsx reader */
export function readXlsx(buf) {
  const files = readZip(buf);
  const get = (n) => files.get(n)?.toString('utf8');
  if (!files.has('[Content_Types].xml') || !files.has('xl/workbook.xml')) bad('struktur buku kerja tiada');
  const shared = [];
  const sst = get('xl/sharedStrings.xml');
  if (sst) for (const m of sst.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)) shared.push(textOf(m[1] || ''));

  let sheetPath = 'xl/worksheets/sheet1.xml';
  const wb = get('xl/workbook.xml');
  const rels = get('xl/_rels/workbook.xml.rels');
  const first = /<sheet\b[^>]*?r:id="([^"]+)"/.exec(wb);
  if (first && rels) {
    const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((t) => new RegExp(`Id="${first[1]}"`).test(t));
    const target = rel && /Target="([^"]+)"/.exec(rel)?.[1];
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
  }
  const sheet = get(sheetPath) ?? get('xl/worksheets/sheet1.xml');
  if (!sheet) bad('lembaran pertama tiada');

  const rows = [];
  for (const rm of sheet.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const cells = [];
    for (const cm of (rm[1] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const idx = colIndex(/\br="([A-Z]+\d+)"/.exec(attrs)?.[1] || '');
      if (idx < 0 || idx > 60) continue;
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
      const inner = cm[2] || '';
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let val = '';
      if (type === 's') val = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') val = textOf(inner);
      else if (v != null) val = decode(v);
      if (type === 'b') val = v === '1' ? 'benar' : 'palsu';
      while (cells.length < idx) cells.push('');
      cells[idx] = String(val);
    }
    rows.push(cells);
    if (rows.length > 5001) bad('terlalu banyak baris');
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

/* ------------------------------------------------------------------ xlsx writer */
const crcTable = zlib.crc32 ? null : (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { if (zlib.crc32) return zlib.crc32(b); let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export function writeZip(entries) {
  const locals = []; const centrals = []; let offset = 0;
  for (const [name, content] of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const comp = zlib.deflateRawSync(data);
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nameBuf, comp); centrals.push(ch, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const colName = (i) => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };

export function writeXlsx(rows, sheetName = 'Soalan') {
  const sheetRows = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
    const ref = `${colName(ci)}${ri + 1}`;
    if (v == null || v === '') return '';
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  }).join('')}</row>`).join('');
  return writeZip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
    ['xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`],
  ]);
}
