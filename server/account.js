// Account self-service: password reset by email, and deleting an account.
import crypto from 'node:crypto';
import { getDb } from './db.js';
import { HttpError, clientIp, isLocalRequest } from './http.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { endUserSessions, endSession } from './sessions.js';
import { createLimiter } from './rateLimit.js';
import { passwordProblem } from './passwordPolicy.js';
import { sendPasswordResetEmail } from './mailer.js';

const RESET_TTL_MS = 60 * 60 * 1000;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const clean = (v, max = 254) => String(v ?? '').trim().slice(0, max);

const resetsByIp = createLimiter({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many reset requests. Please try again later.' });
const resetsByEmail = createLimiter({ windowMs: 60 * 60 * 1000, max: 3 });

// Where links in emails point. PUBLIC_URL is required outside local development, so a
// forged Host header can't make us email a link to someone else's site.
function publicBase(req, env) {
  if (env.PUBLIC_URL) {
    let base = String(env.PUBLIC_URL);
    while (base.endsWith('/')) base = base.slice(0, -1);
    return base;
  }
  if (isLocalRequest(req)) return `http://${req.headers.host}`;
  return null;
}

const FORGOT_ANSWER = { ok: true, message: 'If an account exists for that email, we’ve sent a link to reset the password.' };

// POST /api/auth/forgot — always gives the same answer, so it doesn't reveal which
// emails have accounts. The email (if any) is sent in the background.
export async function forgotPassword(req, env, body) {
  resetsByIp.take(clientIp(req));
  await emailResetLinkIfAccountExists(req, env, clean(body.email).toLowerCase());
  return FORGOT_ANSWER;
}

async function emailResetLinkIfAccountExists(req, env, email) {
  if (!email) return;
  try {
    resetsByEmail.take(email);
  } catch {
    return; // quietly stop repeated emails to one address
  }
  const db = await getDb(env);
  const user = await db.collection('users').findOne({ email }, { projection: { name: 1, email: 1 } });
  if (!user) return;
  const base = publicBase(req, env);
  if (!base) {
    console.error('[account] set PUBLIC_URL in .env to send password reset emails');
    return;
  }
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  await db.collection('passwordResets').insertOne({
    userId: user._id,
    tokenHash: sha256(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + RESET_TTL_MS),
    ip: clientIp(req)
  });
  sendPasswordResetEmail(env, user.email, user.name, `${base}/reset/${token}`).catch((err) =>
    console.error('[account] reset email failed:', err.message)
  );
}

// POST /api/auth/reset — { token, password }. Ends every store session of the account.
export async function resetPassword(req, env, body) {
  resetsByIp.take(clientIp(req));
  const token = clean(body.token, 200);
  const db = await getDb(env);
  const reset = token
    ? await db.collection('passwordResets').findOneAndDelete({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } })
    : null;
  if (!reset) throw new HttpError(400, 'This reset link has expired or was already used. Please request a new one.');
  const user = await db.collection('users').findOne({ _id: reset.userId });
  if (!user) throw new HttpError(400, 'This reset link is no longer valid.');
  const weak = passwordProblem(body.password, { email: user.email, name: user.name });
  if (weak) {
    // Put the token back so the shopper can try another password with the same link.
    await db.collection('passwordResets').insertOne(reset);
    throw new HttpError(400, weak);
  }
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { passwordHash: await hashPassword(String(body.password)), updatedAt: new Date() } }
  );
  await db.collection('passwordResets').deleteMany({ userId: user._id });
  await endUserSessions(env, user._id, { scope: 'store' });
  return { ok: true };
}

// DELETE /api/auth/account — { password }. Removes the account, its sessions, saved
// cart/wishlist and address. Orders are kept (invoices must be retained by law) but no
// longer linked to a login.
export async function deleteAccount(req, res, env, user, body) {
  if (user.role === 'admin') throw new HttpError(400, 'The admin account can’t be deleted here.');
  if (!(await verifyPassword(String(body.password || ''), user.passwordHash))) {
    throw new HttpError(401, 'That password isn’t right.');
  }
  const db = await getDb(env);
  await endSession(req, res, env, 'store');
  await endUserSessions(env, user._id);
  await db.collection('passwordResets').deleteMany({ userId: user._id });
  await db.collection('logins').updateMany({ userId: user._id }, { $set: { email: '(deleted account)', userId: null } });
  await db.collection('orders').updateMany({ userId: user._id }, { $set: { accountDeletedAt: new Date() } });
  await db.collection('users').deleteOne({ _id: user._id });
  return { ok: true };
}
