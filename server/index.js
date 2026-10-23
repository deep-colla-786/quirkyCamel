// Production server: serves the built site from dist/ and the API (auth, Razorpay, orders).
// Usage: npm run build && npm start   (reads keys from .env or the environment)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiMiddleware } from './api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

// Minimal .env loader (no extra dependency); real environment variables win.
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

const api = apiMiddleware(process.env);

http
  .createServer((req, res) => {
    api(req, res, () => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let file = path.join(dist, urlPath);
      if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        // /admin (and anything under it) is the admin app; everything else is the store.
        const isAdmin = urlPath === '/admin' || urlPath.startsWith('/admin/');
        file = isAdmin ? path.join(dist, 'admin', 'index.html') : path.join(dist, 'index.html');
      }
      res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(process.env.PORT || 3000, () => {
    console.log(`Quirky Camel running on http://localhost:${process.env.PORT || 3000}`);
  });
