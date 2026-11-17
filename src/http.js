import fs from 'node:fs';
import path from 'node:path';
import { AppError } from './db.js';
import { config } from './config.js';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

export class Router {
  constructor() { this.routes = []; }
  add(method, pattern, opts, handler) {
    if (typeof opts === 'function') { handler = opts; opts = {}; }
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:([a-z_]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    this.routes.push({ method, re, keys, roles: opts.roles || null, public: !!opts.public, allowPending: !!opts.allowPending, platform: !!opts.platform, handler });
  }
  get(p, o, h) { this.add('GET', p, o, h); }
  post(p, o, h) { this.add('POST', p, o, h); }
  put(p, o, h) { this.add('PUT', p, o, h); }
  patch(p, o, h) { this.add('PATCH', p, o, h); }
  delete(p, o, h) { this.add('DELETE', p, o, h); }
  match(method, pathname) {
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(pathname);
      if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
    }
    return null;
  }
}

export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (config.secureCookies) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

export function sendJson(res, status, body, extraHeaders = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(data);
}

export function sendText(res, status, text, type, extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(text);
}

export async function readBody(req, limit = 1_500_000) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new AppError(413, 'Permintaan terlalu besar.');
    chunks.push(c);
  }
  if (!size) return {};
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) throw new AppError(415, 'Jenis kandungan mesti application/json.');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError(400, 'JSON tidak sah.'); }
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function serveStatic(req, res, baseDir, urlPath, { cache = false } = {}) {
  let rel = decodeURIComponent(urlPath);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(baseDir, '.' + rel);
  if (!file.startsWith(path.resolve(baseDir) + path.sep)) return false;
  let stat;
  try { stat = fs.statSync(file); } catch { return false; }
  if (!stat.isFile()) return false;
  const ext = path.extname(file).toLowerCase();
  if (!MIME[ext]) return false;
  res.writeHead(200, { 'Content-Type': MIME[ext], 'Content-Length': stat.size, 'Cache-Control': cache ? 'public, max-age=3600' : 'no-cache' });
  fs.createReadStream(file).pipe(res);
  return true;
}

export function csv(rows, headers) {
  const esc = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\ufeff' + [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\r\n') + '\r\n';
}

/** RFC4180-ish CSV parser (quoted fields, escaped quotes, CRLF). Returns array of arrays. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  const s = text.replace(/^\ufeff/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}
