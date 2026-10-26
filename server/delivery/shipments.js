// Shipments: one per paid order, stored in the `shipments` collection with the customer,
// courier, AWB, estimated delivery and every tracking scan. A short summary is copied
// onto the order (`orders.delivery`) so order lists show the status without a join.
//
// Lifecycle: payment confirmed -> createShipment (Shiprocket order + AWB + pickup, or the
// demo courier) -> tracking updates arrive by webhook, by the periodic sync, or (demo)
// from the simulated route -> the customer's open pages are told to refresh.
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { HttpError } from '../http.js';
import { invoiceNumber } from '../mailer.js';
import { guestTokenMatches } from '../guestOrders.js';
import { shipmentChanged } from '../events.js';
import { deliveryConfig } from './config.js';
import { MIN_WEBHOOK_TOKEN } from '../config.js';
import * as shiprocket from './shiprocket.js';
import { planRoute, demoBooking, istString } from './demo.js';
import { normalizeScan, mergeScans, stageFrom, parseIst } from './status.js';

const SYNC_EVERY_MS = 30 * 1000;
const LIVE_POLL_EVERY_MS = 30 * 60 * 1000; // webhooks are the main source; polling is the fallback

const shipments = (db) => db.collection('shipments');

// ---------- creating ----------

function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') };
}

// Shiprocket wants a numeric-looking order id; derived from our order id so it's unique.
const channelOrderId = (order) => {
  const ymd = new Date(order.paidAt || order.createdAt).toISOString().slice(0, 10).replaceAll('-', '');
  return `${ymd}-${Number.parseInt(String(order._id).slice(-8), 16)}`;
};

function adhocPayload(config, order) {
  const c = order.customer;
  if (!c.state) throw new HttpError(400, 'This order has no delivery state, which Shiprocket requires.');
  const { first, last } = splitName(c.name);
  const units = order.items.reduce((n, it) => n + it.qty, 0);
  return {
    order_id: channelOrderId(order),
    order_date: istString(new Date(order.paidAt || order.createdAt)).slice(0, 16),
    pickup_location: config.pickupLocation,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: c.addr,
    billing_city: c.city,
    billing_pincode: c.pin,
    billing_state: c.state,
    billing_country: 'India',
    billing_email: c.email,
    billing_phone: String(c.phone).replaceAll(/\D/g, '').slice(-10),
    shipping_is_billing: true,
    order_items: order.items.map((it) => ({ name: it.name, sku: it.slug, units: it.qty, selling_price: it.price })),
    payment_method: 'Prepaid',
    sub_total: order.amount / 100,
    length: config.box.length,
    breadth: config.box.breadth,
    height: config.box.height,
    weight: Math.max(0.5, Math.round(units * config.weightPerItemKg * 100) / 100),
    invoice_number: invoiceNumber(order)
  };
}

// Shiprocket: create the order, assign a courier + AWB, and book the pickup.
async function bookWithShiprocket(config, order) {
  const created = await shiprocket.createAdhocOrder(config, adhocPayload(config, order));
  const awbRes = await shiprocket.assignAwb(config, created.shipment_id);
  const awb = awbRes?.response?.data;
  if (!awb?.awb_code) throw new HttpError(502, `Shiprocket couldn't assign a courier: ${awbRes?.message || 'no AWB returned'}`);
  let pickupScheduledDate = parseIst(awb.pickup_scheduled_date);
  try {
    const pickup = await shiprocket.requestPickup(config, created.shipment_id);
    pickupScheduledDate = parseIst(pickup?.response?.pickup_scheduled_date) || pickupScheduledDate;
  } catch (err) {
    console.error('[delivery] pickup request failed (can be retried in Shiprocket):', err.message);
  }
  return {
    awb: awb.awb_code,
    courierName: awb.courier_name,
    srOrderId: created.order_id,
    shipmentId: created.shipment_id,
    pickupScheduledDate,
    etd: null
  };
}

function orderSummary(s) {
  return {
    awb: s.awb,
    courierName: s.courierName,
    status: s.currentStatus,
    stage: s.stage,
    state: s.state,
    etd: s.etd,
    updatedAt: s.updatedAt
  };
}

async function saveShipment(db, shipment) {
  const { _id, ...fields } = shipment;
  const doc = { ...fields, updatedAt: new Date() };
  await shipments(db).updateOne({ orderId: doc.orderId }, { $set: doc }, { upsert: true });
  await db.collection('orders').updateOne({ _id: doc.orderId }, { $set: { delivery: orderSummary(doc) } });
  shipmentChanged(doc.userId);
  return doc;
}

// Called once an order is paid. Safe to call again for an order whose booking failed.
export async function createShipment(env, order) {
  const config = deliveryConfig(env);
  const db = await getDb(env);
  const existing = await shipments(db).findOne({ orderId: order._id });
  if (existing?.awb) return existing;
  const now = new Date();
  const c = order.customer;
  const base = {
    orderId: order._id,
    userId: order.userId,
    email: c.email,
    customerName: c.name,
    invoiceNumber: invoiceNumber(order),
    mode: config.live ? 'shiprocket' : 'demo',
    origin: `${config.pickupCity}, ${config.pickupState}`,
    destination: { address: c.addr, city: c.city, state: c.state || '', pin: c.pin },
    stage: 'placed',
    state: 'active',
    currentStatus: 'ORDER PLACED',
    scans: existing?.scans || [
      { at: order.paidAt || now, status: 'NEW', activity: 'Order placed and payment confirmed', location: '', srStatusLabel: 'ORDER PLACED', stage: 'placed' }
    ],
    createdAt: existing?.createdAt || now,
    error: null
  };
  try {
    let booking;
    if (config.live) {
      booking = await bookWithShiprocket(config, order);
    } else {
      const plan = planRoute({ pickupCity: config.pickupCity, pickupState: config.pickupState, city: c.city, state: c.state });
      booking = { ...demoBooking(now, plan, config.demoStepMinutes), demoPlan: plan, demoNextAt: new Date(now.getTime() + config.demoStepMinutes * 60e3) };
    }
    const scans = mergeScans(base.scans, [
      { at: now, status: 'AWB', activity: `Courier assigned: ${booking.courierName} (AWB ${booking.awb})`, location: '', srStatusLabel: 'AWB ASSIGNED', stage: 'ready' }
    ]);
    return await saveShipment(db, { ...base, ...booking, scans, stage: 'ready', currentStatus: 'AWB ASSIGNED', awbAssignedAt: now });
  } catch (err) {
    console.error('[delivery] could not create shipment for', base.invoiceNumber, err.message);
    return saveShipment(db, { ...base, currentStatus: 'SHIPMENT NOT CREATED', state: 'exception', error: err.message });
  }
}

// ---------- tracking updates ----------

// Applies a tracking update in Shiprocket's webhook shape (also used for polling + demo).
async function applyUpdate(db, shipment, update) {
  const scans = mergeScans(shipment.scans || [], (update.scans || []).map(normalizeScan));
  const currentStatus = String(update.current_status || update.shipment_status || shipment.currentStatus || '').toUpperCase();
  const { stage, state } = stageFrom(currentStatus, scans, shipment.stage);
  const delivered = stage === 'delivered' ? scans.findLast((s) => s.stage === 'delivered')?.at || new Date() : null;
  return saveShipment(db, {
    ...shipment,
    scans,
    currentStatus,
    stage,
    state,
    courierName: update.courier_name || shipment.courierName,
    etd: parseIst(update.etd) || shipment.etd,
    deliveredAt: delivered || shipment.deliveredAt || null,
    podStatus: update.pod_status || shipment.podStatus || null,
    isReturn: Boolean(update.is_return) || Boolean(shipment.isReturn),
    lastEventAt: parseIst(update.current_timestamp) || new Date()
  });
}

// POST /api/delivery/updates — Shiprocket's tracking webhook. Always answers 200 for
// unknown AWBs (Shiprocket expects 200); a wrong token is refused.
// Constant-time comparison, so response timing doesn't leak the token.
function sameToken(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function handleWebhook(env, req, body) {
  const config = deliveryConfig(env);
  // Without a strong token anyone could post fake tracking, so the webhook stays off.
  if (config.webhookToken.length < MIN_WEBHOOK_TOKEN) {
    throw new HttpError(503, `Webhook disabled: set SHIPROCKET_WEBHOOK_TOKEN (${MIN_WEBHOOK_TOKEN}+ characters).`);
  }
  if (!sameToken(req.headers['x-api-key'], config.webhookToken)) throw new HttpError(401, 'Invalid token.');
  const awb = String(body?.awb || '').slice(0, 40);
  if (!awb) return { ok: true };
  const update = { ...body, scans: Array.isArray(body.scans) ? body.scans.slice(0, 500).filter((s) => s && typeof s === 'object') : [] };
  const db = await getDb(env);
  const shipment = await shipments(db).findOne({ awb });
  if (shipment) await applyUpdate(db, shipment, update);
  return { ok: true };
}

// Shiprocket's track-by-AWB response, reshaped like the webhook payload.
function fromTrackResponse(data) {
  const t = data?.tracking_data || {};
  const first = t.shipment_track?.[0] || {};
  return {
    current_status: first.current_status,
    courier_name: first.courier_name,
    etd: t.etd || first.edd,
    pod_status: first.pod,
    scans: t.shipment_track_activities || []
  };
}

async function pollLive(config, db, shipment) {
  const data = await shiprocket.trackAwb(config, shipment.awb);
  return applyUpdate(db, { ...shipment, lastPolledAt: new Date() }, fromTrackResponse(data));
}

// Reveals the demo courier's next planned event.
async function advanceDemo(config, db, shipment) {
  const plan = shipment.demoPlan || [];
  const done = (shipment.scans || []).filter((s) => s.status?.startsWith('X-')).length;
  if (done >= plan.length) return shipment;
  const now = new Date();
  const next = { ...plan[done], date: istString(now) };
  const label = next['sr-status-label'];
  const finished = done + 1 >= plan.length;
  return applyUpdate(db, { ...shipment, demoNextAt: finished ? null : new Date(now.getTime() + config.demoStepMinutes * 60e3) }, {
    current_status: label,
    current_timestamp: istString(now),
    scans: [next]
  });
}

// Background sync: demo events that are due, and a polling fallback for live shipments.
export async function syncDue(env) {
  const config = deliveryConfig(env);
  const db = await getDb(env);
  const now = new Date();
  const due = await shipments(db)
    .find({ state: 'active', mode: 'demo', demoNextAt: { $lte: now } })
    .limit(100)
    .toArray();
  for (const s of due) await advanceDemo(config, db, s);
  if (!config.live) return;
  const stale = await shipments(db)
    .find({
      state: 'active',
      mode: 'shiprocket',
      awb: { $ne: null },
      $or: [{ lastPolledAt: { $exists: false } }, { lastPolledAt: { $lte: new Date(now - LIVE_POLL_EVERY_MS) } }]
    })
    .limit(50)
    .toArray();
  for (const s of stale) {
    await pollLive(config, db, s).catch((err) => console.error('[delivery] tracking poll failed for', s.awb, err.message));
  }
}

// Starts the sync loop once per process (dev-server restarts replace the old loop).
export function startDeliverySync(env) {
  clearInterval(globalThis.__qcDeliverySync);
  globalThis.__qcDeliverySync = setInterval(() => {
    syncDue(env).catch((err) => console.error('[delivery] sync failed:', err.message));
  }, SYNC_EVERY_MS);
  globalThis.__qcDeliverySync.unref?.();
}

// ---------- reading ----------

// The stops the parcel has passed through, oldest first, then the delivery address.
function routeOf(s) {
  const stops = [];
  for (const scan of s.scans || []) {
    if (!scan.location) continue;
    const last = stops.at(-1);
    if (last?.location === scan.location) last.lastAt = scan.at;
    else stops.push({ location: scan.location, firstAt: scan.at, lastAt: scan.at });
  }
  // Before the courier's first scan, the route starts from our pickup city.
  if (!stops.length && s.origin) stops.push({ location: s.origin, firstAt: null, lastAt: null });
  const d = s.destination || {};
  return [...stops,{ location: [d.city, d.state].filter(Boolean).join(', ') + (d.pin ? ` ${d.pin}` : ''), destination: true, reached: s.stage === 'delivered' }];
}

export function publicShipment(s) {
  if (!s) return null;
  const scans = (s.scans || []).map(({ at, activity, location, srStatusLabel, stage }) => ({ at, activity, location, label: srStatusLabel, stage }));
  return {
    orderId: String(s.orderId),
    invoiceNumber: s.invoiceNumber,
    mode: s.mode,
    courierName: s.courierName || null,
    awb: s.awb || null,
    currentStatus: s.currentStatus,
    stage: s.stage,
    state: s.state,
    etd: s.etd || null,
    pickupScheduledDate: s.pickupScheduledDate || null,
    deliveredAt: s.deliveredAt || null,
    origin: s.origin,
    destination: s.destination,
    currentLocation: [...(s.scans || [])].reverse().find((x) => x.location)?.location || null,
    route: routeOf(s),
    scans: scans.reverse(), // newest first
    error: s.error || null,
    updatedAt: s.updatedAt
  };
}

const toId = (id) => {
  if (!ObjectId.isValid(id)) throw new HttpError(404, 'Order not found.');
  return new ObjectId(String(id));
};

// The signed-in customer's tracking for one of their orders.
// Tracking for one order: its owner (signed in), or a guest holding the order's token.
export async function trackingForUser(env, user, orderId, token) {
  const db = await getDb(env);
  const order = await db.collection('orders').findOne({ _id: toId(orderId), status: 'paid' });
  const isOwner = Boolean(order && user && order.userId && String(order.userId) === String(user._id));
  if (!order || !(isOwner || guestTokenMatches(order, token))) throw new HttpError(404, 'Order not found.');
  const shipment = await shipments(db).findOne({ orderId: order._id });
  return {
    order: { id: String(order._id), invoiceNumber: invoiceNumber(order), items: order.items, amount: order.amount / 100, paidAt: order.paidAt },
    shipment: publicShipment(shipment)
  };
}

// ---------- admin ----------

export async function listShipments(env) {
  const db = await getDb(env);
  const rows = await shipments(db).find({}).sort({ createdAt: -1 }).limit(500).toArray();
  return {
    shipments: rows.map((s) => {
      const p = adminShipment(s);
      return { ...p, scans: undefined, route: undefined, lastScan: p.scans[0] || null };
    })
  };
}

// What the admin panel shows: the customer's view plus who it's for.
const adminShipment = (s) => ({ ...publicShipment(s), customerName: s.customerName, email: s.email });

export async function shipmentDetail(env, orderId) {
  const db = await getDb(env);
  const s = await shipments(db).findOne({ orderId: toId(orderId) });
  if (!s) throw new HttpError(404, 'No shipment for this order yet.');
  return { shipment: adminShipment(s) };
}

// Admin "Refresh": live -> fetch tracking now; demo -> reveal the next event now.
export async function refreshShipment(env, orderId) {
  const config = deliveryConfig(env);
  const db = await getDb(env);
  const s = await shipments(db).findOne({ orderId: toId(orderId) });
  if (!s?.awb) throw new HttpError(404, 'This order has no booked shipment yet.');
  const updated = s.mode === 'demo' ? await advanceDemo(config, db, s) : await pollLive(config, db, s);
  return { shipment: adminShipment(updated) };
}

// Admin "Create shipment": books orders that have none or whose booking failed.
export async function retryShipment(env, orderId) {
  const db = await getDb(env);
  const order = await db.collection('orders').findOne({ _id: toId(orderId), status: 'paid' });
  if (!order) throw new HttpError(404, 'Order not found.');
  if (!order.items) throw new HttpError(400, 'This order is from before itemised checkout and can’t be shipped automatically.');
  const s = await createShipment(env, order);
  if (s.error) throw new HttpError(502, s.error);
  return { shipment: adminShipment(s) };
}

export function deliveryStatus(env) {
  const config = deliveryConfig(env);
  return {
    mode: config.live ? 'shiprocket' : 'demo',
    email: config.email || null,
    passwordSet: Boolean(config.password),
    pickupLocation: config.pickupLocation,
    pickupCity: config.pickupCity,
    webhookTokenSet: Boolean(config.webhookToken),
    demoStepMinutes: config.demoStepMinutes
  };
}
