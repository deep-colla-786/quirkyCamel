// Accounts and sessions.
// - Passwords: scrypt with a per-user random salt (node:crypto, no extra dependency).
// - Sessions: random 32-byte token in an HttpOnly cookie; only its SHA-256 hash is
//   stored in MongoDB, so a leaked database can't be replayed as live sessions.
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';
import { HttpError, parseCookies, setCookie, clientIp } from './http.js';
import { hashPassword, verifyPassword } from './passwords.js';

const COOKIE = 'qc_session';
const SESSION_DAYS = 30;

// Compared against when the email doesn't exist, so response time doesn't reveal it.
const DUMMY_HASH = hashPassword('not-a-real-password');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const isSecure = (req, env) => env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';

// Brute-force guard: at most 8 failed logins per email+IP in 15 minutes (in memory,
// per process; use a shared store such as Redis if you run several servers).
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
function checkRateLimit(key) {
  const now = Date.now();
  const entry = failures.get(key);
  if (entry && now - entry.first < WINDOW_MS && entry.count >= 8) {
    throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
  }
}
function recordFailure(key) {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now - entry.first >= WINDOW_MS) failures.set(key, { first: now, count: 1 });
  else entry.count += 1;
}

export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  role: u.role === 'admin' ? 'admin' : 'customer',
  address: u.address || null
});

// Login activity for the admin panel.
async function logEvent(req, env, type, email, userId = null) {
  try {
    const db = await getDb(env);
    await db.collection('logins').insertOne({
      userId,
      email,
      type,
      ip: clientIp(req),
      userAgent: clean(req.headers['user-agent'], 300),
      at: new Date()
    });
  } catch (err) {
    console.error('[auth] could not log event', err.message);
  }
}

const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateSignup(body) {
  const name = clean(body.name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 20).replace(/[\s-]/g, '');
  const password = String(body.password || '');
  if (name.length < 2) throw new HttpError(400, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (phone && !/^(\+?91)?[6-9]\d{9}$/.test(phone)) throw new HttpError(400, 'Please enter a valid 10-digit mobile number.');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (password.length > 200) throw new HttpError(400, 'Password is too long.');
  return { name, email, phone, password };
}

async function startSession(req, res, env, userId) {
  const db = await getDb(env);
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  await db.collection('sessions').insertOne({
    tokenHash: sha256(token),
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_DAYS * 864e5),
    userAgent: clean(req.headers['user-agent'], 300)
  });
  setCookie(res, COOKIE, token, { maxAge: SESSION_DAYS * 86400, secure: isSecure(req, env) });
}

// Returns the logged-in user document, or null.
export async function getSessionUser(req, env) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const db = await getDb(env);
  const session = await db.collection('sessions').findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return db.collection('users').findOne({ _id: session.userId });
}

export async function requireAdmin(req, env) {
  const user = await requireUser(req, env);
  if (user.role !== 'admin') throw new HttpError(403, 'Admins only.');
  return user;
}

export async function requireUser(req, env) {
  const user = await getSessionUser(req, env);
  if (!user) throw new HttpError(401, 'Please log in to continue.', { code: 'AUTH_REQUIRED' });
  return user;
}

export async function signup(req, res, env, body) {
  const { name, email, phone, password } = validateSignup(body);
  const db = await getDb(env);
  const now = new Date();
  let result;
  try {
    result = await db.collection('users').insertOne({
      name,
      email,
      phone,
      role: 'customer',
      passwordHash: await hashPassword(password),
      address: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'An account with this email already exists. Try logging in.');
    throw err;
  }
  await startSession(req, res, env, result.insertedId);
  await logEvent(req, env, 'signup', email, result.insertedId);
  return publicUser({ _id: result.insertedId, name, email, phone, role: 'customer' });
}

export async function login(req, res, env, body) {
  const email = clean(body.email, 254).toLowerCase();
  const password = String(body.password || '');
  const key = `${email}|${clientIp(req)}`;
  checkRateLimit(key);

  const db = await getDb(env);
  const user = await db.collection('users').findOne({ email });
  const ok = await verifyPassword(password, user ? user.passwordHash : await DUMMY_HASH);
  if (!user || !ok) {
    recordFailure(key);
    await logEvent(req, env, 'failed', email, user ? user._id : null);
    throw new HttpError(401, 'Incorrect email or password.');
  }
  failures.delete(key);
  await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  await startSession(req, res, env, user._id);
  await logEvent(req, env, 'login', email, user._id);
  return publicUser(user);
}

export async function logout(req, res, env) {
  const token = parseCookies(req)[COOKIE];
  if (token) {
    const db = await getDb(env);
    const session = await db.collection('sessions').findOneAndDelete({ tokenHash: sha256(token) });
    if (session) {
      const user = await db.collection('users').findOne({ _id: session.userId }, { projection: { email: 1 } });
      await logEvent(req, env, 'logout', user?.email || '', session.userId);
    }
  }
  setCookie(res, COOKIE, '', { maxAge: 0, secure: isSecure(req, env) });
}

// Remember the latest delivery details on the user's profile for next time.
export async function saveCustomerDetails(env, userId, c) {
  const db = await getDb(env);
  const update = { updatedAt: new Date() };
  if (c.phone) update.phone = clean(c.phone, 20);
  if (c.addr && c.city && c.pin) {
    update.address = { addr: clean(c.addr), city: clean(c.city, 80), pin: clean(c.pin, 6) };
  }
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: update });
}
