// Small HTTP helpers shared by the API routes (no framework).

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Decodes a URL component; null instead of throwing on a malformed one (e.g. "%E0%A4%A").
export function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// Content-Security-Policy for the HTML pages: our own files, Google Fonts, and Razorpay's
// checkout (script, iframe and API). Inline styles are needed for React style props and
// the generated SVG artwork.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.razorpay.com",
  "frame-src https://*.razorpay.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

// Security headers for every response. `csp` is for HTML pages (the dev server's own
// pages skip it, because Vite injects inline scripts for hot reload).
export function securityHeaders(res, { csp = false, https = false } = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (https) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (csp) res.setHeader('Content-Security-Policy', CSP);
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function readJson(req, { limit = 1e5 } = {}) {
  // Requiring a JSON content type means a plain cross-site HTML form can't hit
  // these endpoints (forms can't send application/json), which blocks CSRF.
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) {
    return Promise.reject(new HttpError(415, 'Expected application/json'));
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new HttpError(413, 'Request too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new HttpError(400, 'Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    const value = i > 0 ? safeDecode(part.slice(i + 1).trim()) : null;
    if (value !== null) out[part.slice(0, i).trim()] = value;
  }
  return out;
}

export function setCookie(res, name, value, { maxAge, secure, path = '/', sameSite = 'Lax' }) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'HttpOnly', `SameSite=${sameSite}`];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (secure) parts.push('Secure');
  const prev = res.getHeader('Set-Cookie') ?? [];
  res.setHeader('Set-Cookie', [...[prev].flat(), parts.join('; ')]);
}

// How many reverse proxies sit in front of the server (TRUST_PROXY in .env, default 0).
// X-Forwarded-For / X-Forwarded-Proto are written by the visitor unless a proxy we trust
// sets them, so they're ignored when there is none.
let trustedProxies = 0;
export function setTrustedProxies(count) {
  trustedProxies = Math.max(0, Math.floor(Number(count) || 0));
}

export function clientIp(req) {
  const socketIp = req.socket?.remoteAddress || 'unknown';
  if (!trustedProxies) return socketIp;
  // Each trusted proxy appends the address it received from, so the client is the
  // entry `trustedProxies` places from the right.
  const chain = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return chain.at(-trustedProxies) || socketIp;
}

// Whether the visitor reached us over HTTPS (directly, or through a trusted proxy).
export function isHttps(req) {
  if (req.socket?.encrypted) return true;
  return trustedProxies > 0 && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

// localhost and private network addresses (development, LAN testing).
function isPrivateIpv4(host) {
  const parts = host.split('.');
  if (parts.length !== 4 || !parts.every((p) => /^\d{1,3}$/.test(p))) return false;
  const [a, b] = parts.map(Number);
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

export function isLocalRequest(req) {
  const host = String(req.headers.host || '')
    .toLowerCase()
    .replace(/:\d+$/, '');
  return host === 'localhost' || host === '[::1]' || host.endsWith('.local') || isPrivateIpv4(host);
}
