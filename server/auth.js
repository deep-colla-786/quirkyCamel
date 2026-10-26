// Accounts: sign-up, store login/logout, admin login/logout and the guards used by the API.
// Passwords use scrypt with a per-user random salt (node:crypto, no extra dependency).
// Session handling (cookies, lifetimes, scopes) lives in sessions.js.
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';
import { HttpError, clientIp } from './http.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { startSession, getSession, endSession, endUserSessions } from './sessions.js';
import { createLimiter } from './rateLimit.js';
import { passwordProblem } from './passwordPolicy.js';

// Compared against when the email doesn't exist, so response time doesn't reveal it.
const DUMMY_HASH = hashPassword('not-a-real-password');

// Brute-force and flood guards (in memory, per process):
// - failed logins: 8 per email+IP and 20 per email from any IP, per 15 minutes (the
//   per-email limit can't be dodged by changing IP);
// - any login attempt: 30 per IP per 15 minutes; sign-ups: 10 per IP per hour (each one
//   runs the deliberately slow password hash).
const MINUTE = 60 * 1000;
const failedByEmailIp = createLimiter({ windowMs: 15 * MINUTE, max: 8 });
const failedByEmail = createLimiter({ windowMs: 15 * MINUTE, max: 20 });
const attemptsByIp = createLimiter({ windowMs: 15 * MINUTE, max: 30 });
const signupsByIp = createLimiter({ windowMs: 60 * MINUTE, max: 10, message: 'Too many sign-ups from this network. Please try again later.' });

const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]{1,64}@(?:[^\s@.]{1,63}\.)+[^\s@.]{2,63}$/;
const PHONE_RE = /^(?:\+?91)?[6-9]\d{9}$/;

export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  role: u.role === 'admin' ? 'admin' : 'customer',
  address: u.address || null
});

// Login activity for the admin panel. `scope` is 'store' or 'admin'.
async function logEvent(req, env, { type, scope, email, userId = null }) {
  try {
    const db = await getDb(env);
    await db.collection('logins').insertOne({
      userId,
      email,
      type,
      scope,
      ip: clientIp(req),
      userAgent: clean(req.headers['user-agent'], 300),
      at: new Date()
    });
  } catch (err) {
    console.error('[auth] could not log event', err.message);
  }
}

function validateSignup(body) {
  const name = clean(body.name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 20).replaceAll(/[\s-]/g, '');
  const password = String(body.password || '');
  if (name.length < 2) throw new HttpError(400, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (phone && !PHONE_RE.test(phone)) throw new HttpError(400, 'Please enter a valid 10-digit mobile number.');
  const weak = passwordProblem(password, { email, name });
  if (weak) throw new HttpError(400, weak);
  return { name, email, phone, password };
}

// Checks email + password (rate limited); returns the user or throws 401.
async function verifyCredentials(req, env, body, scope) {
  const email = clean(body.email, 254).toLowerCase();
  const password = String(body.password || '');
  const ip = clientIp(req);
  const key = `${email}|${ip}`;
  attemptsByIp.take(ip);
  failedByEmailIp.check(key);
  failedByEmail.check(email);

  const db = await getDb(env);
  const user = await db.collection('users').findOne({ email });
  const ok = await verifyPassword(password, user ? user.passwordHash : await DUMMY_HASH);
  if (!user || !ok) {
    failedByEmailIp.hit(key);
    failedByEmail.hit(email);
    await logEvent(req, env, { type: 'failed', scope, email, userId: user?._id ?? null });
    throw new HttpError(401, 'Incorrect email or password.');
  }
  failedByEmailIp.reset(key);
  return user;
}

async function finishLogin(req, res, env, user, scope) {
  const db = await getDb(env);
  await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  await startSession(req, res, env, scope, user._id);
  await logEvent(req, env, { type: 'login', scope, email: user.email, userId: user._id });
  return publicUser(user);
}

// ---------- Store ----------

export async function getStoreUser(req, res, env) {
  const auth = await getSession(req, res, env, 'store');
  return auth ? auth.user : null;
}

export async function requireUser(req, res, env) {
  const user = await getStoreUser(req, res, env);
  if (!user) throw new HttpError(401, 'Please log in to continue.', { code: 'AUTH_REQUIRED' });
  return user;
}

export async function signup(req, res, env, body) {
  signupsByIp.take(clientIp(req));
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
    // Same wording whether or not the address is taken, as far as possible without email verification.
    if (err.code === 11000) throw new HttpError(409, 'We couldn’t create an account with these details. If you already have one, log in or reset your password.');
    throw err;
  }
  await startSession(req, res, env, 'store', result.insertedId);
  await logEvent(req, env, { type: 'signup', scope: 'store', email, userId: result.insertedId });
  return publicUser({ _id: result.insertedId, name, email, phone, role: 'customer' });
}

export async function login(req, res, env, body) {
  const user = await verifyCredentials(req, env, body, 'store');
  return finishLogin(req, res, env, user, 'store');
}

async function logoutScope(req, res, env, scope) {
  const session = await endSession(req, res, env, scope);
  if (!session) return;
  const db = await getDb(env);
  const user = await db.collection('users').findOne({ _id: session.userId }, { projection: { email: 1 } });
  await logEvent(req, env, { type: 'logout', scope, email: user?.email || '', userId: session.userId });
}

export const logout = (req, res, env) => logoutScope(req, res, env, 'store');

// "Log out of all devices": ends every store session of the signed-in user.
export async function logoutEverywhere(req, res, env) {
  const user = await requireUser(req, res, env);
  await endSession(req, res, env, 'store');
  const ended = await endUserSessions(env, user._id, { scope: 'store' });
  await logEvent(req, env, { type: 'logout', scope: 'store', email: user.email, userId: user._id });
  return ended + 1;
}

// ---------- Admin ----------

// Returns { user, session } for a valid admin session. A session whose user is no
// longer an admin is ended.
export async function requireAdmin(req, res, env) {
  const auth = await getSession(req, res, env, 'admin');
  if (!auth) throw new HttpError(401, 'Your admin session has ended. Please sign in again.', { code: 'AUTH_REQUIRED' });
  if (auth.user.role !== 'admin') {
    await endSession(req, res, env, 'admin');
    throw new HttpError(403, 'Admins only.');
  }
  return auth;
}

export async function getAdminUser(req, res, env) {
  const auth = await getSession(req, res, env, 'admin');
  return auth?.user.role === 'admin' ? auth.user : null;
}

export async function adminLogin(req, res, env, body) {
  const user = await verifyCredentials(req, env, body, 'admin');
  if (user.role !== 'admin') {
    await logEvent(req, env, { type: 'failed', scope: 'admin', email: user.email, userId: user._id });
    throw new HttpError(403, 'This account doesn’t have admin access.');
  }
  return finishLogin(req, res, env, user, 'admin');
}

export const adminLogout = (req, res, env) => logoutScope(req, res, env, 'admin');

// ---------- Profile ----------

// Remember the latest delivery details on the user's profile for next time.
export async function saveCustomerDetails(env, userId, c) {
  const db = await getDb(env);
  const update = { updatedAt: new Date() };
  if (c.phone) update.phone = clean(c.phone, 20);
  if (c.addr && c.city && c.pin) {
    update.address = { addr: clean(c.addr), city: clean(c.city, 80), state: clean(c.state, 60), pin: clean(c.pin, 6) };
  }
  await db.collection('users').updateOne({ _id: new ObjectId(String(userId)) }, { $set: update });
}
