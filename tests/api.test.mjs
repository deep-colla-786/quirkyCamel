// API tests against a throwaway MongoDB database (quirkycamel_apitest): npm test
// Skipped when MongoDB isn't running.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readdir, stat, unlink } from 'node:fs/promises';
import { MongoClient } from 'mongodb';

const startedAt = Date.now();

const DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/quirkycamel_apitest';
const WEBHOOK_TOKEN = 'test-webhook-token-0123456789-abcdef';
const env = {
  MONGODB_URI: DB_URI,
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'Desert-Caravan-2026!',
  SHIPROCKET_WEBHOOK_TOKEN: WEBHOOK_TOKEN,
  TRUST_PROXY: '1',
  SMTP_USER: '',
  SMTP_PASS: ''
};

let server;
let base;
let mongo;
let closeDb;
let mongoUp = true;

before(async () => {
  try {
    mongo = await MongoClient.connect(DB_URI, { serverSelectionTimeoutMS: 2000 });
    await mongo.db().dropDatabase();
  } catch {
    mongoUp = false;
    return;
  }
  ({ closeDb } = await import('../server/db.js'));
  const { apiMiddleware } = await import('../server/api.js');
  const api = apiMiddleware(env);
  server = http.createServer((req, res) => api(req, res, () => ((res.statusCode = 404), res.end())));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  clearInterval(globalThis.__qcDeliverySync);
  clearInterval(globalThis.__qcLimiterPrune);
  server?.closeAllConnections?.();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await closeDb?.();
  if (mongo) {
    await mongo.db().dropDatabase();
    await mongo.close();
  }
  // Emails from these tests land in outbox/ (SMTP is off); remove them.
  const outbox = new URL('../outbox/', import.meta.url);
  for (const name of await readdir(outbox).catch(() => [])) {
    if (name.endsWith('@example.com.html') && (await stat(new URL(name, outbox))).mtimeMs >= startedAt) {
      await unlink(new URL(name, outbox));
    }
  }
});

// fetch helper with a cookie jar and an optional forwarded IP
function client(ip = '1.1.1.1') {
  const jar = {};
  return async (path, { method = 'GET', body, headers = {} } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'X-Forwarded-For': ip,
        Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const [k, v] = pair.split('=');
      if (v) jar[k] = v;
      else delete jar[k];
    }
    return { status: res.status, data: await res.json().catch(() => ({})) };
  };
}

const skip = () => !mongoUp && 'MongoDB is not running';

test('a malformed URL gets 400 and the server keeps running', { skip: skip() }, async () => {
  const c = client();
  assert.equal((await c('/api/admin/products/%E0%A4%A', { method: 'PUT', body: {} })).status, 400);
  assert.equal((await c('/api/orders/%E0%A4%A/tracking')).status, 400);
  assert.equal((await c('/api/products')).status, 200);
});

test('sign-up refuses weak passwords', { skip: skip() }, async () => {
  const r = await client('2.2.2.2')('/api/auth/signup', { method: 'POST', body: { name: 'Weak', email: 'weak@example.com', password: '12345678' } });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /common/);
});

test('login: 8 failures lock the email + IP, and changing IP does not get round the per-email limit', { skip: skip() }, async () => {
  const signup = await client('3.3.3.3')('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Lock Test', email: 'lock@example.com', password: 'desert-rose-7' }
  });
  assert.equal(signup.status, 200);
  const sameIp = client('4.4.4.4');
  for (let i = 0; i < 8; i++) {
    const r = await sameIp('/api/auth/login', { method: 'POST', body: { email: 'lock@example.com', password: 'wrong-pass-1' } });
    assert.equal(r.status, 401);
  }
  assert.equal((await sameIp('/api/auth/login', { method: 'POST', body: { email: 'lock@example.com', password: 'desert-rose-7' } })).status, 429);
  // A new IP for every guess: blocked once the email has 20 failures.
  let blocked = false;
  for (let i = 0; i < 14 && !blocked; i++) {
    const r = await client(`5.5.5.${i}`)('/api/auth/login', { method: 'POST', body: { email: 'lock@example.com', password: 'wrong-pass-1' } });
    blocked = r.status === 429;
  }
  assert.equal(blocked, true);
});

test('cart lines are capped at 10 and saved on the account', { skip: skip() }, async () => {
  const c = client('6.6.6.6');
  await c('/api/auth/signup', { method: 'POST', body: { name: 'Cart Test', email: 'cart@example.com', password: 'desert-rose-7' } });
  assert.equal((await c('/api/account/cart/the-complete-kit', { method: 'PUT', body: { qty: 50 } })).status, 200);
  const saved = await c('/api/account/saved');
  assert.deepEqual(saved.data.cart, { 'the-complete-kit': 10 });
  assert.equal((await c('/api/account/cart/no-such-product', { method: 'PUT', body: { qty: 1 } })).status, 404);
});

test('delivery webhook: token required (constant-time check), bad payloads ignored, scans stored', { skip: skip() }, async () => {
  const db = mongo.db();
  const { insertedId } = await db.collection('orders').insertOne({ status: 'paid', userId: null, items: [], amount: 100, customer: {} });
  await db.collection('shipments').insertOne({ orderId: insertedId, userId: null, awb: 'TESTAWB1', mode: 'shiprocket', stage: 'ready', state: 'active', scans: [] });
  const c = client('7.7.7.7');
  const payload = {
    awb: 'TESTAWB1',
    current_status: 'IN TRANSIT',
    scans: [{ date: '2023-05-20 12:23:44', activity: 'Trip Arrived', location: 'Jaipur_GW', 'sr-status-label': 'IN TRANSIT' }]
  };
  assert.equal((await c('/api/delivery/updates', { method: 'POST', body: payload })).status, 401);
  assert.equal((await c('/api/delivery/updates', { method: 'POST', body: payload, headers: { 'x-api-key': 'wrong' } })).status, 401);
  assert.equal((await c('/api/delivery/updates', { method: 'POST', body: { ...payload, scans: 'not-a-list' }, headers: { 'x-api-key': WEBHOOK_TOKEN } })).status, 200);
  assert.equal((await c('/api/delivery/updates', { method: 'POST', body: payload, headers: { 'x-api-key': WEBHOOK_TOKEN } })).status, 200);
  const shipment = await db.collection('shipments').findOne({ awb: 'TESTAWB1' });
  assert.equal(shipment.stage, 'transit');
  assert.equal(shipment.scans.length, 1);
});

test('guest checkout: order without an account, tracking only with its token', { skip: skip() }, async () => {
  const guest = client('8.8.8.8');
  const customer = { name: 'Guest Camel', email: 'guest@example.com', phone: '9876543210', addr: '1 Road', city: 'Pune', state: 'Maharashtra', pin: '411001' };
  const order = await guest('/api/orders/demo', { method: 'POST', body: { items: [{ slug: 'the-complete-kit', qty: 1 }], customer } });
  assert.equal(order.status, 200);
  assert.ok(order.data.guestToken);
  const id = order.data.order.id;
  assert.equal((await guest(`/api/orders/${id}/tracking`)).status, 404);
  assert.equal((await guest(`/api/orders/${id}/tracking?t=wrong`)).status, 404);
  assert.equal((await guest(`/api/orders/${id}/tracking?t=${order.data.guestToken}`)).status, 200);
});

test('live-updates stream is capped per IP', { skip: skip() }, async () => {
  const opened = [];
  let refused = 0;
  for (let i = 0; i < 6; i++) {
    const ctrl = new AbortController();
    const res = await fetch(`${base}/api/events`, { headers: { 'X-Forwarded-For': '9.9.9.9' }, signal: ctrl.signal });
    if (res.status === 429) refused++;
    else opened.push(ctrl);
  }
  opened.forEach((c) => c.abort());
  assert.equal(opened.length, 5);
  assert.equal(refused, 1);
});
