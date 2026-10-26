// Delivery-time check for the PIN code box on product pages. With Shiprocket connected
// it asks which couriers serve that PIN and how long they take; otherwise it returns
// the store's typical delivery time, clearly labelled as typical.
import { HttpError, clientIp } from '../http.js';
import { createLimiter } from '../rateLimit.js';
import { STORE_POLICY } from '../../src/data/products.js';
import { deliveryConfig } from './config.js';
import { serviceability } from './shiprocket.js';
import { parseIst } from './status.js';

const PIN_RE = /^[1-9]\d{5}$/;
const checksByIp = createLimiter({ windowMs: 60 * 1000, max: 20, message: 'Too many checks. Please wait a moment.' });
const cache = new Map(); // pin -> { at, result }
const CACHE_MS = 6 * 60 * 60 * 1000;

const typical = (pin) => ({ pin, kind: 'typical', estimate: STORE_POLICY.deliveryEstimate, dispatch: STORE_POLICY.dispatch, freeShipping: STORE_POLICY.freeShipping });

// Earliest delivery date among the couriers Shiprocket offers for this PIN.
function fastest(couriers) {
  let best = null;
  for (const c of couriers) {
    const etd = parseIst(c.etd) || (Number(c.estimated_delivery_days) > 0 ? new Date(Date.now() + Number(c.estimated_delivery_days) * 864e5) : null);
    if (etd && (!best || etd < best.etd)) best = { etd, courier: c.courier_name };
  }
  return best;
}

export async function deliveryEstimate(env, req, rawPin) {
  checksByIp.take(clientIp(req));
  const pin = String(rawPin || '').trim();
  if (!PIN_RE.test(pin)) throw new HttpError(400, 'Enter a valid 6-digit PIN code.');
  const config = deliveryConfig(env);
  if (!config.live || !config.pickupPin) return typical(pin);
  const hit = cache.get(pin);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;
  let result;
  try {
    const data = await serviceability(config, pin, Math.max(0.5, config.weightPerItemKg));
    const couriers = data?.data?.available_courier_companies || [];
    const best = fastest(couriers);
    result = couriers.length
      ? { pin, kind: 'live', serviceable: true, etd: best?.etd || null, courier: best?.courier || null, freeShipping: STORE_POLICY.freeShipping }
      : { pin, kind: 'live', serviceable: false };
  } catch (err) {
    console.error('[delivery] serviceability check failed:', err.message);
    return typical(pin);
  }
  cache.set(pin, { at: Date.now(), result });
  return result;
}
