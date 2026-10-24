// Minimal Shiprocket API client (https://apidocs.shiprocket.in). Logs in with the API
// user's email + password; the token is valid for 10 days, so it's cached for 9 and
// renewed on a 401.
import { HttpError } from '../http.js';

const BASE = 'https://apiv2.shiprocket.in/v1/external';
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;
let cached = { key: '', token: '', expires: 0 };

async function login(config) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: config.email, password: config.password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new HttpError(502, `Shiprocket login failed: ${data.message || res.status}. Check SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD.`);
  }
  cached = { key: config.email, token: data.token, expires: Date.now() + TOKEN_TTL_MS };
  return data.token;
}

async function token(config) {
  if (cached.key === config.email && cached.expires > Date.now()) return cached.token;
  return login(config);
}

function errorText(data, status) {
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return `HTTP ${status}`;
}

export async function request(config, method, path, body, retried = false) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token(config)}` },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (res.status === 401 && !retried) {
    cached.expires = 0;
    return request(config, method, path, body, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, `Shiprocket: ${errorText(data, res.status)}`);
  return data;
}

export const createAdhocOrder = (config, payload) => request(config, 'POST', '/orders/create/adhoc', payload);
export const assignAwb = (config, shipmentId) => request(config, 'POST', '/courier/assign/awb', { shipment_id: shipmentId });
export const requestPickup = (config, shipmentId) => request(config, 'POST', '/courier/generate/pickup', { shipment_id: [shipmentId] });
export const trackAwb = (config, awb) => request(config, 'GET', `/courier/track/awb/${encodeURIComponent(awb)}`);
