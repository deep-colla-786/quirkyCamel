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
//   POST   /api/auth/forgot                 { email } email a password reset link (same answer either way)
//   POST   /api/auth/reset                  { token, password } set a new password from the link
//   DELETE /api/auth/account                (login) { password } delete the account
//   GET    /api/account/saved               (login) the user's saved cart + wishlist
//   POST   /api/account/saved/merge         (login) { cart, wishlist } add guest picks on login
//   PUT    /api/account/cart/:slug          (login) { qty } set one cart line (0 removes it)
//   PUT    /api/account/wishlist/:slug      (login) save an item
//   DELETE /api/account/wishlist/:slug      (login) unsave an item
//   GET    /api/events                      live "catalog" / "saved" change events (SSE)
//   GET    /api/products                    active products (public)
//   GET    /api/version                     changes whenever the server restarts with new code
//   GET    /robots.txt, /sitemap.xml        for search engines (sitemap built from the live catalog)
//   GET    /api/razorpay/config
//   POST   /api/razorpay/order              (login or guest) { items: [{ slug, qty }], customer }
//   POST   /api/razorpay/verify             (login or guest) Razorpay handler response
//   POST   /api/orders/demo                 (login or guest; only while Razorpay keys are placeholders)
//   POST   /api/orders/claim                (login) { orderId, token } attach a guest order to the account
//   GET    /api/orders                      (login) the user's orders (with a delivery summary)
//   GET    /api/orders/:id/tracking?t=      full delivery tracking (the order's owner, or a guest's token)
//   GET    /api/delivery/estimate?pin=      delivery time for a PIN code (Shiprocket, or the typical time)
//   POST   /api/delivery/updates            Shiprocket tracking webhook (x-api-key = SHIPROCKET_WEBHOOK_TOKEN)
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
//   GET    /api/admin/deliveries            (admin) every shipment with its status
//   GET    /api/admin/deliveries/:id        (admin) full tracking for an order's shipment
//   POST   /api/admin/deliveries/:id/refresh (admin) fetch tracking now (demo: next event)
//   POST   /api/admin/deliveries/:id/retry  (admin) book a shipment that is missing or failed
//   GET    /api/admin/delivery-status       (admin) Shiprocket or demo, pickup location, webhook
//   POST   /api/admin/orders/:id/resend     (admin) re-send the invoice + admin alert
//   GET    /api/admin/mail-status           (admin) is SMTP configured?
//   POST   /api/admin/test-email            (admin) { to? } send a test email
//   GET    /api/admin/products              (admin) incl. hidden products + units sold
//   POST   /api/admin/products              (admin) create
//   PUT    /api/admin/products/:slug        (admin) update
//   DELETE /api/admin/products/:slug        (admin) delete (custom products only)
//   POST   /api/admin/upload                (admin) { dataUrl } -> { url }
import { ObjectId } from 'mongodb';
import { HttpError, readJson, sendJson, safeDecode, securityHeaders, setTrustedProxies, clientIp, isHttps } from './http.js';
import { assertSafeConfig } from './config.js';
import { forgotPassword, resetPassword, deleteAccount } from './account.js';
import { robotsTxt, sitemapXml } from './pages.js';
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
import { getSaved, setCartQty, setWishlisted, mergeSaved } from './savedItems.js';
import { openStream, catalogChanged, savedItemsChanged } from './events.js';
import {
  handleWebhook,
  trackingForUser,
  listShipments,
  shipmentDetail,
  refreshShipment,
  retryShipment,
  deliveryStatus,
  startDeliverySync
} from './delivery/shipments.js';
import { WEBHOOK_PATH } from './delivery/config.js';
import { deliveryEstimate } from './delivery/estimate.js';
import { razorpayConfig, createOrder, verifyPayment, createDemoOrder, listOrders, claimGuestOrder } from './razorpay.js';
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

// Open pages compare this to notice that the site was updated while they were open.
const SERVER_VERSION = Date.now().toString(36);

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
  // A change to the signed-in user's cart/wishlist; their other open pages are told to reload.
  const savedChange = (handler) => async (req, res, params) => {
    const user = await requireUser(req, res, env);
    const result = await handler(user, req, params);
    savedItemsChanged(user._id, clientIdOf(req));
    return result;
  };

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
    ['POST', '/api/auth/forgot', async (req) => forgotPassword(req, env, await readJson(req))],
    ['POST', '/api/auth/reset', async (req) => resetPassword(req, env, await readJson(req))],
    ['DELETE', '/api/auth/account', async (req, res) => deleteAccount(req, res, env, await requireUser(req, res, env), await readJson(req))],
    ['POST', '/api/auth/logout-all', async (req, res) => {
      await readJson(req);
      return { ended: await logoutEverywhere(req, res, env) };
    }],

    ['GET', '/api/account/saved', async (req, res) => getSaved(env, await requireUser(req, res, env))],
    ['POST', '/api/account/saved/merge', savedChange(async (user, req) => mergeSaved(env, user, await readJson(req)))],
    ['PUT', '/api/account/cart/:slug', savedChange(async (user, req, params) => {
      const { qty } = await readJson(req);
      await setCartQty(env, user, params.slug, qty);
      return { ok: true };
    })],
    ['PUT', '/api/account/wishlist/:slug', savedChange(async (user, req, params) => {
      await readJson(req);
      await setWishlisted(env, user, params.slug, true);
      return { ok: true };
    })],
    ['DELETE', '/api/account/wishlist/:slug', savedChange(async (user, req, params) => {
      await setWishlisted(env, user, params.slug, false);
      return { ok: true };
    })],

    ['GET', '/api/products', () => listPublicProducts(env)],
    ['GET', '/api/version', () => ({ version: SERVER_VERSION })],

    ['GET', '/api/razorpay/config', async () => {
      const { keyId, configured } = razorpayConfig(env);
      return { configured, keyId: configured ? keyId : null };
    }],
    // Checkout works signed in or as a guest.
    ['POST', '/api/razorpay/order', async (req, res) => createOrder(env, await getStoreUser(req, res, env), await readJson(req), req)],
    ['POST', '/api/razorpay/verify', async (req, res) => verifyPayment(env, await getStoreUser(req, res, env), await readJson(req))],
    ['POST', '/api/orders/demo', async (req, res) => createDemoOrder(env, await getStoreUser(req, res, env), await readJson(req), req)],
    ['POST', '/api/orders/claim', async (req, res) => claimGuestOrder(env, await requireUser(req, res, env), await readJson(req))],
    ['GET', '/api/orders', async (req, res) => listOrders(env, await requireUser(req, res, env))],
    ['GET', '/api/orders/:id/tracking', async (req, res, params, query) =>
      trackingForUser(env, await getStoreUser(req, res, env), params.id, query.get('t'))],
    ['GET', '/api/delivery/estimate', (req, res, params, query) => deliveryEstimate(env, req, query.get('pin'))],
    ['POST', WEBHOOK_PATH, async (req) => handleWebhook(env, req, await readJson(req, { limit: 5e5 }))]
  ];
}

// Runs a product change, then tells every open store page to reload the catalog.
const catalogChange = (handler) => async (ctx) => {
  const result = await handler(ctx);
  catalogChanged();
  return result;
};

const clientIdOf = (req) => String(req.headers['x-client-id'] || '').slice(0, 64);

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
    ['GET', '/api/admin/deliveries', guarded(() => listShipments(env))],
    ['GET', '/api/admin/deliveries/:id', guarded(({ params }) => shipmentDetail(env, params.id))],
    ['POST', '/api/admin/deliveries/:id/refresh', guarded(async ({ req, params }) => (await readJson(req), refreshShipment(env, params.id)))],
    ['POST', '/api/admin/deliveries/:id/retry', guarded(async ({ req, params }) => (await readJson(req), retryShipment(env, params.id)))],
    ['GET', '/api/admin/delivery-status', guarded(() => deliveryStatus(env))],
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
    ['POST', '/api/admin/products', guarded(catalogChange(async ({ req }) => createProduct(env, await readJson(req))))],
    ['PUT', '/api/admin/products/:slug', guarded(catalogChange(async ({ req, params }) => updateProduct(env, params.slug, await readJson(req))))],
    ['DELETE', '/api/admin/products/:slug', guarded(catalogChange(({ params }) => deleteProduct(env, params.slug)))],
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

// Route parameters from the URL; null if any is malformed (e.g. a stray "%").
function decodeParams(keys, match) {
  const params = {};
  for (const [i, key] of keys.entries()) {
    const value = safeDecode(match[i + 1]);
    if (value === null) return null;
    params[key] = value;
  }
  return params;
}

export function apiMiddleware(env) {
  assertSafeConfig(env);
  setTrustedProxies(env.TRUST_PROXY);
  startDeliverySync(env);
  // Live updates; signed-in shoppers also get their own cart/wishlist events.
  const streamEvents = async (req, res, qs) => {
    const user = await getStoreUser(req, null, env);
    const opened = openStream(req, res, { userId: user?._id, clientId: new URLSearchParams(qs).get('client') || '', ip: clientIp(req) });
    if (!opened) sendJson(res, 429, { error: 'Too many open connections.' });
  };

  const routes = [...storeRoutes(env), ...adminRoutes(env)].map(compileRoute);

  const sendSeoFile = async (req, res, path) => {
    securityHeaders(res, { https: isHttps(req) });
    const robots = path === '/robots.txt';
    res.setHeader('Content-Type', robots ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(robots ? robotsTxt(env, req) : await sitemapXml(env, req));
  };

  const handle = async (req, res, next) => {
    const [path, qs = ''] = (req.url || '').split('?');
    const isApi = path.startsWith('/api/');
    if (isApi || path.startsWith('/uploads/')) securityHeaders(res, { https: isHttps(req) });
    if (req.method === 'GET' && (path === '/robots.txt' || path === '/sitemap.xml')) return sendSeoFile(req, res, path);
    if (req.method === 'GET' && path.startsWith('/uploads/') && (await serveUpload(req, res))) return;
    if (!isApi) return next();
    if (req.method === 'GET' && path === '/api/events') return streamEvents(req, res, qs);

    let match = null;
    const route = routes.find((r) => r.method === req.method && (match = r.re.exec(path)));
    if (!route) return sendJson(res, 404, { error: 'Not found' });
    const params = decodeParams(route.keys, match);
    if (!params) return sendJson(res, 400, { error: 'Bad request' });
    sendJson(res, 200, await route.handler(req, res, params, new URLSearchParams(qs)));
  };

  // Any error ends in a JSON answer; nothing can escape and stop the server.
  return (req, res, next) =>
    handle(req, res, next).catch((err) => {
      if (res.headersSent) return res.end();
      return sendError(res, err);
    });
}
