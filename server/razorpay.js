// Razorpay orders, payment verification and order history. Every order belongs
// to a logged-in user and is recorded in MongoDB.
//
// Flow (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/):
//   1. POST /api/razorpay/order  -> { items: [{ slug, qty }], customer }. Prices come from the
//      products collection, so the browser can't change them. Creates a Razorpay order with
//      the SECRET key and stores ours as 'created'.
//   2. Browser opens Razorpay Checkout with the public key id + order id.
//   3. POST /api/razorpay/verify -> checks the HMAC signature, marks the order 'paid',
//      reduces stock and emails the invoice (customer) + new-order alert (admin).
import crypto from 'node:crypto';
import { getDb } from './db.js';
import { HttpError } from './http.js';
import { saveCustomerDetails } from './auth.js';
import { clientIp } from './http.js';
import { createLimiter } from './rateLimit.js';
import { newGuestToken, guestTokenMatches } from './guestOrders.js';
import { ObjectId } from 'mongodb';
import { removePurchased } from './savedItems.js';
import { catalogChanged, savedItemsChanged } from './events.js';
import { createShipment } from './delivery/shipments.js';
import { INDIAN_STATES } from '../src/data/states.js';
import { isBuyable } from './products.js';
import { sendOrderEmails, invoiceNumber } from './mailer.js';

const MAX_QTY = 10;

// Placeholder keys ship in .env so the site runs out of the box. While they are in
// place the API reports `configured: false` and the frontend uses its demo checkout.
const isPlaceholder = (v) => !v || /dummy|replace|x{6,}/i.test(v);

export function razorpayConfig(env) {
  const keyId = env.RAZORPAY_KEY_ID || '';
  const keySecret = env.RAZORPAY_KEY_SECRET || '';
  return { keyId, keySecret, configured: !isPlaceholder(keyId) && !isPlaceholder(keySecret) };
}

const clip = (v, n = 250) => String(v ?? '').trim().slice(0, n);

// Merges duplicate cart lines into slug -> total quantity.
function readCartLines(rawItems) {
  const wanted = new Map();
  for (const it of Array.isArray(rawItems) ? rawItems : []) {
    const qty = Number(it?.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'Invalid quantity.');
    const slug = clip(it.slug, 80);
    wanted.set(slug, (wanted.get(slug) || 0) + qty);
  }
  if (!wanted.size) throw new HttpError(400, 'Your cart is empty.');
  if (wanted.size > 20) throw new HttpError(400, 'Too many different items.');
  return wanted;
}

// Prices one line from the database product, checking availability and stock.
function priceLine(p, slug, qty) {
  if (!isBuyable(p)) throw new HttpError(400, 'An item in your cart is no longer available. Please refresh.');
  if (qty > MAX_QTY) throw new HttpError(400, `You can buy at most ${MAX_QTY} of ${p.name}.`);
  const limited = p.stock !== null && p.stock !== undefined;
  if (limited && p.stock < qty) {
    throw new HttpError(409, p.stock === 0 ? `${p.name} is out of stock.` : `Only ${p.stock} of ${p.name} left.`);
  }
  return { slug, name: p.name, price: p.price, qty };
}

// Guest checkout: an order without an account gets a private token (only its hash is
// stored). The buyer's tracking link carries the token; it can also attach the order to
// an account created afterwards.
const guestOrdersByIp = createLimiter({ windowMs: 60 * 60 * 1000, max: 20, message: 'Too many orders from this network. Please try again later.' });
const EMAIL_RE = /^[^\s@]{1,64}@(?:[^\s@.]{1,63}\.)+[^\s@.]{2,63}$/;

function guestFields(user, req) {
  if (user) return { fields: { userId: user._id }, token: null };
  guestOrdersByIp.take(clientIp(req));
  const { token, hash } = newGuestToken();
  return { fields: { userId: null, guest: true, guestTokenHash: hash }, token };
}


async function validateCheckout(env, user, body) {
  const wanted = readCartLines(body.items);
  const db = await getDb(env);
  const docs = await db.collection('products').find({ slug: { $in: [...wanted.keys()] } }).toArray();
  const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]));
  const items = [...wanted].map(([slug, qty]) => priceLine(bySlug[slug], slug, qty));

  const c = body.customer || {};
  const customer = {
    name: clip(c.name, 80),
    email: clip(c.email, 254).toLowerCase() || user?.email || '',
    phone: clip(c.phone, 20),
    addr: clip(c.addr),
    city: clip(c.city, 80),
    state: clip(c.state, 60),
    pin: clip(c.pin, 6),
    gift: c.isgift ? clip(c.gift, 200) : ''
  };
  if (!customer.name || !customer.addr || !customer.city || !/^\d{6}$/.test(customer.pin)) {
    throw new HttpError(400, 'Delivery details are incomplete.');
  }
  if (!INDIAN_STATES.includes(customer.state)) throw new HttpError(400, 'Please choose the delivery state.');
  if (!EMAIL_RE.test(customer.email)) throw new HttpError(400, 'Please enter a valid email address for your invoice.');
  const amount = items.reduce((sum, it) => sum + it.price * it.qty, 0) * 100; // paise
  return { items, customer, amount };
}

// Reduce stock for limited items (unlimited = null is left alone).
async function takeStock(db, items) {
  for (const it of items) {
    await db.collection('products').updateOne({ slug: it.slug, stock: { $ne: null } }, [
      { $set: { stock: { $max: [0, { $subtract: ['$stock', it.qty] }] } } }
    ]);
  }
}

// Link to the order's tracking page for the invoice email (needs PUBLIC_URL, the store's
// public address). Guests' links carry their private token.
function trackingUrl(env, order, guestToken) {
  let base = String(env.PUBLIC_URL || '');
  if (!base) return null;
  while (base.endsWith('/')) base = base.slice(0, -1);
  const query = guestToken ? '?t=' + encodeURIComponent(guestToken) : '';
  return `${base}/track/${order._id}${query}`;
}

// `guestToken` (guest orders) goes into the tracking link in the invoice email.
async function afterPaid(env, db, order, user, guestToken = null) {
  await takeStock(db, order.items);
  catalogChanged(); // stock went down
  if (order.userId) {
    await removePurchased(db, order.userId, order.items);
    savedItemsChanged(order.userId); // the buyer's other open pages drop the bought items
  }
  // Don't make the shopper wait for SMTP or the courier; results are recorded on the order.
  sendOrderEmails(env, order, user, { trackUrl: trackingUrl(env, order, guestToken) }).catch((err) => console.error('[mail]', err));
  createShipment(env, order).catch((err) => console.error('[delivery]', err));
}

const publicOrder = (o) => ({
  id: String(o._id),
  razorpayOrderId: o.razorpayOrderId || null,
  paymentId: o.razorpayPaymentId || null,
  status: o.status,
  mode: o.mode,
  items: o.items || [{ slug: 'the-complete-kit', name: 'The Complete Kit', price: o.amount / 100 / (o.quantity || 1), qty: o.quantity || 1 }],
  invoiceNumber: o.status === 'paid' ? invoiceNumber(o) : null,
  amount: o.amount / 100,
  currency: o.currency,
  shipTo: { name: o.customer.name, city: o.customer.city, pin: o.customer.pin },
  delivery: o.delivery || null,
  createdAt: o.createdAt,
  paidAt: o.paidAt || null
});

export async function createOrder(env, user, body, req) {
  const { keyId, keySecret, configured } = razorpayConfig(env);
  if (!configured) return { configured: false };
  const { items, customer, amount } = await validateCheckout(env, user, body);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: 'qc_' + Date.now(),
      notes: {
        items: clip(items.map((it) => `${it.name} x${it.qty}`).join(', ')),
        user_id: user ? String(user._id) : 'guest',
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: clip(`${customer.addr}, ${customer.city} ${customer.pin}`),
        gift_message: customer.gift
      }
    })
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { configured: false };
  if (!res.ok) throw new HttpError(502, data?.error?.description || 'Could not create the Razorpay order.');

  const db = await getDb(env);
  const guest = guestFields(user, req);
  await db.collection('orders').insertOne({
    ...guest.fields,
    razorpayOrderId: data.id,
    status: 'created',
    mode: 'razorpay',
    items,
    amount: data.amount,
    currency: data.currency,
    customer,
    createdAt: new Date()
  });
  if (user) await saveCustomerDetails(env, user._id, customer);
  return { configured: true, keyId, orderId: data.id, amount: data.amount, currency: data.currency };
}

export async function verifyPayment(env, user, body) {
  const { keySecret, configured } = razorpayConfig(env);
  if (!configured) throw new HttpError(503, 'Razorpay keys are not configured.');

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (!orderId || !paymentId || !signature) throw new HttpError(400, 'Missing payment fields.');

  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(400, 'Payment signature mismatch.');
  }

  const db = await getDb(env);
  const order = await db.collection('orders').findOneAndUpdate(
    { razorpayOrderId: orderId, userId: user ? user._id : null },
    { $set: { status: 'paid', razorpayPaymentId: paymentId, paidAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!order) throw new HttpError(404, 'Order not found for this account.');
  // A guest's tracking token is issued now that the order is paid (only its hash is kept).
  let guestToken = null;
  if (order.guest) {
    const fresh = newGuestToken();
    guestToken = fresh.token;
    await db.collection('orders').updateOne({ _id: order._id }, { $set: { guestTokenHash: fresh.hash } });
  }
  await afterPaid(env, db, order, user, guestToken);
  return { verified: true, order: publicOrder(order), guestToken };
}

// Used only while Razorpay keys are placeholders, so the full flow (and the
// database records) can be tried end to end without a payment gateway.
export async function createDemoOrder(env, user, body, req) {
  if (razorpayConfig(env).configured) throw new HttpError(403, 'Demo orders are disabled once Razorpay is configured.');
  const { items, customer, amount } = await validateCheckout(env, user, body);
  const db = await getDb(env);
  const guest = guestFields(user, req);
  const doc = {
    ...guest.fields,
    status: 'paid',
    mode: 'demo',
    items,
    amount,
    currency: 'INR',
    customer,
    createdAt: new Date(),
    paidAt: new Date()
  };
  const { insertedId } = await db.collection('orders').insertOne(doc);
  if (user) await saveCustomerDetails(env, user._id, customer);
  const order = { ...doc, _id: insertedId };
  await afterPaid(env, db, order, user, guest.token);
  return { order: publicOrder(order), guestToken: guest.token };
}

export async function listOrders(env, user) {
  const db = await getDb(env);
  const orders = await db
    .collection('orders')
    .find({ userId: user._id, status: { $ne: 'created' } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return { orders: orders.map(publicOrder) };
}

// After a guest order, the buyer can create an account and adopt the order with its token.
export async function claimGuestOrder(env, user, body) {
  if (!ObjectId.isValid(String(body.orderId || ''))) throw new HttpError(404, 'Order not found.');
  const db = await getDb(env);
  const order = await db.collection('orders').findOne({ _id: new ObjectId(String(body.orderId)), userId: null });
  if (!order || !guestTokenMatches(order, body.token)) throw new HttpError(404, 'Order not found.');
  await db.collection('orders').updateOne({ _id: order._id }, { $set: { userId: user._id }, $unset: { guestTokenHash: '' } });
  await db.collection('shipments').updateOne({ orderId: order._id }, { $set: { userId: user._id } });
  return { ok: true };
}
