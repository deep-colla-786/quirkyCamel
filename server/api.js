// API router, mounted as Connect-style middleware by vite.config.js (dev/preview)
// and server/index.js (production). Also serves uploaded product images (/uploads/*).
//
//   GET    /api/auth/me                 current user or null
//   POST   /api/auth/signup             { name, email, phone?, password }
//   POST   /api/auth/login              { email, password }
//   POST   /api/auth/logout
//   GET    /api/products                active products (public)
//   GET    /api/razorpay/config
//   POST   /api/razorpay/order          (login) { items: [{ slug, qty }], customer }
//   POST   /api/razorpay/verify         (login) Razorpay handler response
//   POST   /api/orders/demo             (login, only while Razorpay keys are placeholders)
//   GET    /api/orders                  (login) the user's orders
//   GET    /api/admin/stats             (admin)
//   GET    /api/admin/users?q=          (admin)
//   GET    /api/admin/logins            (admin)
//   GET    /api/admin/orders            (admin)
//   POST   /api/admin/orders/:id/resend (admin) re-send the invoice + admin alert
//   GET    /api/admin/mail-status       (admin) is SMTP configured?
//   POST   /api/admin/test-email        (admin) { to? } send a test email
//   GET    /api/admin/products          (admin) incl. hidden products + units sold
//   POST   /api/admin/products          (admin) create
//   PUT    /api/admin/products/:slug    (admin) update
//   DELETE /api/admin/products/:slug    (admin) delete (custom products only)
//   POST   /api/admin/upload            (admin) { dataUrl } -> { url }
import { HttpError, readJson, sendJson } from './http.js';
import { getSessionUser, requireUser, requireAdmin, signup, login, logout, publicUser } from './auth.js';
import { razorpayConfig, createOrder, verifyPayment, createDemoOrder, listOrders } from './razorpay.js';
import {
  listPublicProducts,
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  serveUpload,
  MAX_UPLOAD_BYTES
} from './products.js';
import * as admin from './admin.js';
import { mailStatus, sendTestEmail, resendOrderEmails } from './mailer.js';

export function apiMiddleware(env) {
  const routes = [
    ['GET', '/api/auth/me', async (req) => {
      const user = await getSessionUser(req, env);
      return { user: user ? publicUser(user) : null };
    }],
    ['POST', '/api/auth/signup', async (req, res) => ({ user: await signup(req, res, env, await readJson(req)) })],
    ['POST', '/api/auth/login', async (req, res) => ({ user: await login(req, res, env, await readJson(req)) })],
    ['POST', '/api/auth/logout', async (req, res) => {
      await readJson(req);
      await logout(req, res, env);
      return { ok: true };
    }],

    ['GET', '/api/products', () => listPublicProducts(env)],

    ['GET', '/api/razorpay/config', async () => {
      const { keyId, configured } = razorpayConfig(env);
      return { configured, keyId: configured ? keyId : null };
    }],
    ['POST', '/api/razorpay/order', async (req) => createOrder(env, await requireUser(req, env), await readJson(req))],
    ['POST', '/api/razorpay/verify', async (req) => verifyPayment(env, await requireUser(req, env), await readJson(req))],
    ['POST', '/api/orders/demo', async (req) => createDemoOrder(env, await requireUser(req, env), await readJson(req))],
    ['GET', '/api/orders', async (req) => listOrders(env, await requireUser(req, env))],

    ['GET', '/api/admin/stats', async (req) => (await requireAdmin(req, env), admin.stats(env))],
    ['GET', '/api/admin/users', async (req, res, p, query) => (await requireAdmin(req, env), admin.listUsers(env, query.get('q') || ''))],
    ['GET', '/api/admin/logins', async (req) => (await requireAdmin(req, env), admin.listLogins(env))],
    ['GET', '/api/admin/orders', async (req) => (await requireAdmin(req, env), admin.listOrders(env))],
    ['POST', '/api/admin/orders/:id/resend', async (req, res, p) => {
      await requireAdmin(req, env);
      await readJson(req);
      return { emails: await resendOrderEmails(env, p.id) };
    }],
    ['GET', '/api/admin/mail-status', async (req) => (await requireAdmin(req, env), mailStatus(env))],
    ['POST', '/api/admin/test-email', async (req) => {
      const user = await requireAdmin(req, env);
      const body = await readJson(req);
      return sendTestEmail(env, String(body.to || user.email).trim().slice(0, 254));
    }],
    ['GET', '/api/admin/products', async (req) => (await requireAdmin(req, env), listAllProducts(env))],
    ['POST', '/api/admin/products', async (req) => (await requireAdmin(req, env), createProduct(env, await readJson(req)))],
    ['PUT', '/api/admin/products/:slug', async (req, res, p) => (await requireAdmin(req, env), updateProduct(env, p.slug, await readJson(req)))],
    ['DELETE', '/api/admin/products/:slug', async (req, res, p) => (await requireAdmin(req, env), deleteProduct(env, p.slug))],
    ['POST', '/api/admin/upload', async (req) => {
      await requireAdmin(req, env);
      return uploadImage(await readJson(req, { limit: Math.ceil(MAX_UPLOAD_BYTES * 1.4) + 1000 }));
    }]
  ].map(([method, pattern, handler]) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
    return { method, re, keys, handler };
  });

  return async (req, res, next) => {
    const [path, qs = ''] = (req.url || '').split('?');
    if (req.method === 'GET' && path.startsWith('/uploads/')) {
      if (await serveUpload(req, res)) return;
    }
    if (!path.startsWith('/api/')) return next();

    let match;
    const route = routes.find((r) => r.method === req.method && (match = r.re.exec(path)));
    if (!route) return sendJson(res, 404, { error: 'Not found' });
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
    try {
      sendJson(res, 200, await route.handler(req, res, params, new URLSearchParams(qs)));
    } catch (err) {
      if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message, ...err.extra });
      const dbDown = /ECONNREFUSED|Server selection timed out|MongoServerSelectionError/i.test(`${err.name} ${err.message}`);
      console.error('[api]', err);
      sendJson(res, dbDown ? 503 : 500, {
        error: dbDown ? 'The database is unavailable. Is MongoDB running?' : 'Something went wrong. Please try again.'
      });
    }
  };
}
