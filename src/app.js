import fs from 'node:fs';
import { AppError, getSettings } from './db.js';
import { config } from './config.js';
import { Router, securityHeaders, sendJson, sendText, readBody, parseCookies, serveStatic } from './http.js';
import { RateLimiter } from './lib/security.js';
import { userFromCookie, cookieHeader, clearCookieHeader } from './auth.js';
import registerAuth from './routes/auth.js';
import registerStudent from './routes/student.js';
import registerTeacher from './routes/teacher.js';
import registerAdmin from './routes/admin.js';
import registerPlatform from './routes/platform.js';

/** IP klien: dengan N proksi dipercayai, ambil entri ke-N dari kanan X-Forwarded-For (entri kiri boleh dipalsukan klien). */
export function clientIp(req, trust = config.trustProxy) {
  const direct = req.socket.remoteAddress || 'ip';
  if (!trust) return direct;
  const parts = String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean);
  return parts[parts.length - trust] || direct;
}

export function createApp(db, { rateLimit = true, trustProxy } = {}) {
  const router = new Router();
  registerAuth(router);
  registerStudent(router);
  registerTeacher(router);
  registerAdmin(router);
  registerPlatform(router);

  const general = new RateLimiter(900, 60_000);
  const loginLimiter = new RateLimiter(25, 60_000);
  fs.mkdirSync(config.uploadDir, { recursive: true });

  async function api(req, res, url) {
    const ip = clientIp(req, trustProxy ?? config.trustProxy);
    if (rateLimit && !general.check(ip)) throw new AppError(429, 'Terlalu banyak permintaan. Cuba sebentar lagi.');
    const m = router.match(req.method, url.pathname);
    if (!m) throw new AppError(404, 'Laluan tidak dijumpai.');
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.headers['x-requested-with'] !== 'mathquest') throw new AppError(403, 'Permintaan tidak sah.');
      const origin = req.headers.origin;
      if (origin) { let host; try { host = new URL(origin).host; } catch { host = ''; } if (host !== req.headers.host) throw new AppError(403, 'Asal permintaan tidak dibenarkan.'); }
    }
    if (rateLimit && url.pathname === '/api/auth/login' && !loginLimiter.check(ip)) throw new AppError(429, 'Terlalu banyak cubaan log masuk. Tunggu seminit.');
    const cookies = parseCookies(req.headers.cookie);
    const user = userFromCookie(db, cookies);
    const { route, params } = m;
    if (!route.public) {
      if (!user) throw new AppError(401, 'Sila log masuk.', 'perlu_log_masuk');
      if (route.roles && !route.roles.includes(user.role)) throw new AppError(403, 'Anda tidak dibenarkan mengakses fungsi ini.', 'dilarang');
      if (route.platform && !user.is_platform_admin) throw new AppError(403, 'Hanya pentadbir platform dibenarkan.', 'dilarang');
      if (user.must_change_password && !route.allowPending) throw new AppError(403, 'Sila tetapkan kata laluan baharu dahulu.', 'tukar_kata_laluan');
    }
    const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : {};
    const query = Object.fromEntries(url.searchParams);
    const out = await route.handler({
      db, user, params, query, body, cookies, req, ip,
      raw: (type, text, filename) => ({ __raw: { type, text, filename } }),
      setCookie: (token, maxAge) => res.setHeader('Set-Cookie', token ? cookieHeader(token, maxAge) : clearCookieHeader()),
    });
    if (out && out.__raw) {
      const h = out.__raw.filename ? { 'Content-Disposition': `attachment; filename="${out.__raw.filename}"` } : {};
      return sendText(res, 200, out.__raw.text, out.__raw.type, h);
    }
    sendJson(res, 200, out ?? { ok: true });
  }

  return async function handle(req, res) {
    securityHeaders(res);
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/healthz') { db.prepare('SELECT 1').get(); return sendJson(res, 200, { ok: true }); }
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (!['GET', 'HEAD'].includes(req.method)) throw new AppError(405, 'Kaedah tidak dibenarkan.');
      if (url.pathname.startsWith('/uploads/')) {
        if (serveStatic(req, res, config.uploadDir, url.pathname.slice('/uploads'.length), { cache: true })) return;
        throw new AppError(404, 'Fail tidak dijumpai.');
      }
      if (serveStatic(req, res, config.publicDir, url.pathname === '/' ? '/index.html' : url.pathname)) return;
      throw new AppError(404, 'Halaman tidak dijumpai.');
    } catch (e) {
      if (e instanceof AppError) return sendJson(res, e.status, { error: e.message, code: e.code });
      if (e && /UNIQUE constraint/.test(e.message || '')) return sendJson(res, 409, { error: 'Data sudah wujud.', code: 'duplikasi' });
      if (e && /CHECK constraint|FOREIGN KEY|NOT NULL/.test(e.message || '')) return sendJson(res, 400, { error: 'Data tidak sah atau bercanggah dengan data sedia ada.', code: 'data_tidak_sah' });
      console.error('[ralat]', e);
      return sendJson(res, 500, { error: 'Ralat dalaman pelayan.', code: 'ralat_pelayan' });
    }
  };
}

export { getSettings };
