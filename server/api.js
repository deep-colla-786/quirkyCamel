// API router, mounted as Connect-style middleware by vite.config.js (dev/preview)
// and server/index.js (production). Also serves uploaded product images (/uploads/*).
//
// The store and the admin panel use separate sessions (see sessions.js).
//
//   GET    /api/auth/me                     current store user or null
//   POST   /api/auth/signup                 { name, email, phone?, password }
//   POST   /api/auth/login                  { email, password }
//   POST   /api/auth/logout
//   POST   /api/auth/logout-all             (login) end the user's store sessions on every device
//   GET    /api/products                    active products (public)
//   GET    /api/razorpay/config
//   POST   /api/razorpay/order              (login) { items: [{ slug, qty }], customer }
//   POST   /api/razorpay/verify             (login) Razorpay handler response
//   POST   /api/orders/demo                 (login, only while Razorpay keys are placeholders)
//   GET    /api/orders                      (login) the user's orders
//
//   GET    /api/admin/auth/me               current admin or null
//   POST   /api/admin/auth/login            { email, password } (admin accounts only)
//   POST   /api/admin/auth/logout
//   GET    /api/admin/stats                 (admin)
//   GET    /api/admin/users?q=              (admin)
//   GET    /api/admin/logins                (admin)
//   GET    /api/admin/sessions              (admin) active store + admin sessions
//   DELETE /api/admin/sessions/:id          (admin) end one session
//   DELETE /api/admin/users/:id/sessions    (admin) end every session of a user
//   GET    /api/admin/orders                (admin)
//   GET    /api/admin/orders/:id/invoice    (admin) { invoiceNumber, html }
//   POST   /api/admin/orders/:id/resend     (admin) re-send the invoice + admin alert
//   GET    /api/admin/mail-status           (admin) is SMTP configured?
//   POST   /api/admin/test-email            (admin) { to? } send a test email
//   GET    /api/admin/products              (admin) incl. hidden products + units sold
//   POST   /api/admin/products              (admin) create
//   PUT    /api/admin/products/:slug        (admin) update
//   DELETE /api/admin/products/:slug        (admin) delete (custom products only)
//   POST   /api/admin/upload                (admin) { dataUrl } -> { url }
import { ObjectId } from 'mongodb';
import { HttpError, readJson, sendJson } from './http.js';
import {
  getStoreUser,
  requireUser,
  requireAdmin,
  getAdminUser,
  signup,
  login,
  logout,
  logoutEverywhere,
  adminLogin,
  adminLogout,
  publicUser
} from './auth.js';
import { endSessionById, endUserSessions } from './sessions.js';
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
import { mailStatus, sendTestEmail, resendOrderEmails, orderInvoice } from './mailer.js';

const DB_DOWN_RE = /ECONNREFUSED|Server selection timed out|MongoServerSelectionError/i;

// Turns '/api/admin/orders/:id/invoice' into a regex plus its parameter names.
function compileRoute([method, pattern, handler]) {
  const keys = [];
  const source = pattern.replaceAll(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { method, re: new RegExp(`^${source}$`), keys, handler };
}

function storeRoutes(env) {
  return [
    ['GET', '/api/auth/me', async (req, res) => {
      const user = await getStoreUser(req, res, env);
      return { user: user ? publicUser(user) : null };
    }],
    ['POST', '/api/auth/signup', async (req, res) => ({ user: await signup(req, res, env, await readJson(req)) })],
    ['POST', '/api/auth/login', async (req, res) => ({ user: await login(req, res, env, await readJson(req)) })],
    ['POST', '/api/auth/logout', async (req, res) => {
      await readJson(req);
      await logout(req, res, env);
      return { ok: true };
    }],
    ['POST', '/api/auth/logout-all', async (req, res) => {
      await readJson(req);
      return { ended: await logoutEverywhere(req, res, env) };
    }],

    ['GET', '/api/products', () => listPublicProducts(env)],

    ['GET', '/api/razorpay/config', async () => {
      const { keyId, configured } = razorpayConfig(env);
      return { configured, keyId: configured ? keyId : null };
    }],
    ['POST', '/api/razorpay/order', async (req, res) => createOrder(env, await requireUser(req, res, env), await readJson(req))],
    ['POST', '/api/razorpay/verify', async (req, res) => verifyPayment(env, await requireUser(req, res, env), await readJson(req))],
    ['POST', '/api/orders/demo', async (req, res) => createDemoOrder(env, await requireUser(req, res, env), await readJson(req))],
    ['GET', '/api/orders', async (req, res) => listOrders(env, await requireUser(req, res, env))]
  ];
}

function adminRoutes(env) {
  // Wraps a handler so it only runs for a signed-in admin; it receives the auth context.
  const guarded = (handler) => async (req, res, params, query) => {
    const auth = await requireAdmin(req, res, env);
    return handler({ req, params, query, auth });
  };

  return [
    ['GET', '/api/admin/auth/me', async (req, res) => {
      const user = await getAdminUser(req, res, env);
      return { user: user ? publicUser(user) : null };
    }],
    ['POST', '/api/admin/auth/login', async (req, res) => ({ user: await adminLogin(req, res, env, await readJson(req)) })],
    ['POST', '/api/admin/auth/logout', async (req, res) => {
      await readJson(req);
      await adminLogout(req, res, env);
      return { ok: true };
    }],

    ['GET', '/api/admin/stats', guarded(() => admin.stats(env))],
    ['GET', '/api/admin/users', guarded(({ query }) => admin.listUsers(env, query.get('q') || ''))],
    ['GET', '/api/admin/logins', guarded(() => admin.listLogins(env))],
    ['GET', '/api/admin/sessions', guarded(({ auth }) => admin.listSessions(env, auth.session._id))],
    ['DELETE', '/api/admin/sessions/:id', guarded(async ({ params, auth }) => {
      await endSessionById(env, params.id, auth.session._id);
      return { ok: true };
    })],
    ['DELETE', '/api/admin/users/:id/sessions', guarded(async ({ params, auth }) => {
      if (!ObjectId.isValid(params.id)) throw new HttpError(404, 'User not found.');
      return { ended: await endUserSessions(env, params.id, { keepId: auth.session._id }) };
    })],
    ['GET', '/api/admin/orders', guarded(() => admin.listOrders(env))],
    ['GET', '/api/admin/orders/:id/invoice', guarded(({ params }) => orderInvoice(env, params.id))],
    ['POST', '/api/admin/orders/:id/resend', guarded(async ({ req, params }) => {
      await readJson(req);
      return { emails: await resendOrderEmails(env, params.id) };
    })],
    ['GET', '/api/admin/mail-status', guarded(() => mailStatus(env))],
    ['POST', '/api/admin/test-email', guarded(async ({ req, auth }) => {
      const body = await readJson(req);
      return sendTestEmail(env, String(body.to || auth.user.email).trim().slice(0, 254));
    })],
    ['GET', '/api/admin/products', guarded(() => listAllProducts(env))],
    ['POST', '/api/admin/products', guarded(async ({ req }) => createProduct(env, await readJson(req)))],
    ['PUT', '/api/admin/products/:slug', guarded(async ({ req, params }) => updateProduct(env, params.slug, await readJson(req)))],
    ['DELETE', '/api/admin/products/:slug', guarded(({ params }) => deleteProduct(env, params.slug))],
    ['POST', '/api/admin/upload', guarded(async ({ req }) =>
      uploadImage(await readJson(req, { limit: Math.ceil(MAX_UPLOAD_BYTES * 1.4) + 1000 }))
    )]
  ];
}

function sendError(res, err) {
  if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message, ...err.extra });
  const dbDown = DB_DOWN_RE.test(`${err.name} ${err.message}`);
  console.error('[api]', err);
  return sendJson(res, dbDown ? 503 : 500, {
    error: dbDown ? 'The database is unavailable. Is MongoDB running?' : 'Something went wrong. Please try again.'
  });
}

export function apiMiddleware(env) {
  const routes = [...storeRoutes(env), ...adminRoutes(env)].map(compileRoute);

  return async (req, res, next) => {
    const [path, qs = ''] = (req.url || '').split('?');
    if (req.method === 'GET' && path.startsWith('/uploads/') && (await serveUpload(req, res))) return;
    if (!path.startsWith('/api/')) return next();

    let match = null;
    const route = routes.find((r) => r.method === req.method && (match = r.re.exec(path)));
    if (!route) return sendJson(res, 404, { error: 'Not found' });
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
    try {
      sendJson(res, 200, await route.handler(req, res, params, new URLSearchParams(qs)));
    } catch (err) {
      sendError(res, err);
    }
  };
}
