// Production server: serves the built site from dist/ and the API (auth, Razorpay, orders).
// Usage: npm run build && npm start   (reads keys from .env or the environment)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { apiMiddleware } from './api.js';
import { loadEnv } from './env.js';
import { safeDecode, securityHeaders, isHttps } from './http.js';
import { renderPage } from './pages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const env = loadEnv(root);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2'
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml']);

// Compressed copies of static files, made once per file version.
const compressed = new Map(); // `${file}|${mtime}|${encoding}` -> Buffer

function pickEncoding(req) {
  const accept = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(accept)) return 'br';
  if (/\bgzip\b/.test(accept)) return 'gzip';
  return null;
}

function compress(buffer, encoding) {
  return encoding === 'br'
    ? zlib.brotliCompressSync(buffer, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })
    : zlib.gzipSync(buffer, { level: 9 });
}

function sendBody(req, res, body, ext, cacheKey) {
  const encoding = COMPRESSIBLE.has(ext) && body.length > 1024 ? pickEncoding(req) : null;
  if (!encoding) return res.end(body);
  const key = cacheKey && `${cacheKey}|${encoding}`;
  let out = key && compressed.get(key);
  if (!out) {
    out = compress(body, encoding);
    if (key) compressed.set(key, out);
  }
  res.setHeader('Content-Encoding', encoding);
  res.setHeader('Vary', 'Accept-Encoding');
  res.end(out);
}

// A built file under dist/, or null. The trailing separator stops "/dist-other" lookalikes.
function staticFile(urlPath) {
  const file = path.join(dist, urlPath);
  if (!file.startsWith(dist + path.sep)) return null;
  try {
    const stat = fs.statSync(file);
    return stat.isFile() ? { file, stat } : null;
  } catch {
    return null;
  }
}

async function serve(req, res) {
  const urlPath = safeDecode((req.url || '/').split('?')[0]);
  const https = isHttps(req);
  if (urlPath === null) {
    securityHeaders(res, { https });
    res.statusCode = 400;
    return res.end('Bad request');
  }
  const found = urlPath === '/' ? null : staticFile(urlPath);
  if (found) {
    const ext = path.extname(found.file);
    securityHeaders(res, { csp: ext === '.html', https });
    res.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream');
    // Vite fingerprints everything in /assets/, so those never change.
    res.setHeader('Cache-Control', urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    const body = await fs.promises.readFile(found.file);
    return sendBody(req, res, body, ext, `${found.file}|${found.stat.mtimeMs}`);
  }
  // Everything else is a page of the store or the admin app (rendered with the right
  // title, description, share preview and status code).
  const page = await renderPage(env, dist, urlPath, req);
  securityHeaders(res, { csp: true, https });
  res.statusCode = page.status;
  res.setHeader('Content-Type', TYPES['.html']);
  res.setHeader('Cache-Control', 'no-cache');
  return sendBody(req, res, Buffer.from(page.html), '.html', null);
}

const api = apiMiddleware(env);

http
  .createServer((req, res) => {
    api(req, res, () =>
      serve(req, res).catch((err) => {
        console.error('[server]', err);
        if (res.headersSent) return res.end();
        res.statusCode = 500;
        return res.end('Something went wrong.');
      })
    );
  })
  .listen(env.PORT || 3000, () => {
    console.log(`Quirky Camel running on http://localhost:${env.PORT || 3000}`);
  });

// A bug in one request must never take the whole store offline.
process.on('unhandledRejection', (err) => console.error('[server] unhandled rejection:', err));
