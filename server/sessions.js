// Login sessions. The store and the admin panel are separate "scopes": each has its own
// cookie, lifetime and session records, so signing in or out of one never affects the other.
//
// - The token is 32 random bytes in an HttpOnly cookie; only its SHA-256 hash is stored,
//   so a leaked database can't be replayed as live sessions.
// - Store sessions end after 7 days without activity and 30 days at most. Admin sessions
//   end after 30 minutes without activity and 8 hours at most, and their cookie is only sent to /api/admin.
// - Signing in replaces the session the browser already had (no session fixation), and
//   each user keeps at most MAX_PER_USER sessions per scope (the oldest are ended).
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';
import { HttpError, parseCookies, setCookie, clientIp, isHttps, isLocalRequest } from './http.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MAX_PER_USER = 10;
const TOUCH_EVERY_MS = MINUTE; // how often lastSeenAt is written back

export const SCOPES = {
  store: { cookie: 'qc_session', path: '/', sameSite: 'Lax', lifetimeMs: 30 * DAY, idleMs: 7 * DAY },
  admin: { cookie: 'qc_admin_session', path: '/api/admin', sameSite: 'Strict', lifetimeMs: 8 * HOUR, idleMs: 30 * MINUTE }
};

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
// Secure (HTTPS-only) everywhere except local development on localhost / the LAN.
const isSecure = (req, env) => env.NODE_ENV === 'production' || isHttps(req) || !isLocalRequest(req);
const userAgent = (req) => String(req.headers['user-agent'] || '').slice(0, 300);
// Sessions saved before scopes existed belong to the store.
const scopeFilter = (scope) => (scope === 'store' ? { scope: { $in: ['store', null] } } : { scope });

function writeCookie(req, res, env, scope, token, maxAgeMs) {
  const s = SCOPES[scope];
  setCookie(res, s.cookie, token, {
    maxAge: Math.round(maxAgeMs / 1000),
    secure: isSecure(req, env),
    path: s.path,
    sameSite: s.sameSite
  });
}

const readToken = (req, scope) => parseCookies(req)[SCOPES[scope].cookie] || null;

function isExpired(session, scope, now) {
  if (session.expiresAt <= now) return true;
  const { idleMs } = SCOPES[scope];
  return Boolean(idleMs) && now - (session.lastSeenAt || session.createdAt) > idleMs;
}

// Keeps the newest MAX_PER_USER sessions of a user in one scope.
async function pruneOldSessions(db, userId, scope) {
  const extra = await db
    .collection('sessions')
    .find({ userId, ...scopeFilter(scope) }, { projection: { _id: 1 } })
    .sort({ createdAt: -1 })
    .skip(MAX_PER_USER)
    .toArray();
  if (extra.length) await db.collection('sessions').deleteMany({ _id: { $in: extra.map((s) => s._id) } });
}

export async function startSession(req, res, env, scope, userId) {
  const db = await getDb(env);
  const previous = readToken(req, scope);
  if (previous) await db.collection('sessions').deleteOne({ tokenHash: sha256(previous) });

  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  const { lifetimeMs } = SCOPES[scope];
  await db.collection('sessions').insertOne({
    tokenHash: sha256(token),
    userId,
    scope,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + lifetimeMs),
    ip: clientIp(req),
    userAgent: userAgent(req)
  });
  await pruneOldSessions(db, userId, scope);
  writeCookie(req, res, env, scope, token, lifetimeMs);
}

// Returns { session, user } for the request's session in `scope`, or null.
// Expired admin sessions are deleted and their cookie cleared.
export async function getSession(req, res, env, scope) {
  const token = readToken(req, scope);
  if (!token) return null;
  const db = await getDb(env);
  const session = await db.collection('sessions').findOne({ tokenHash: sha256(token), ...scopeFilter(scope) });
  const now = new Date();
  if (!session || isExpired(session, scope, now)) {
    if (session) await db.collection('sessions').deleteOne({ _id: session._id });
    if (res) clearCookie(req, res, env, scope);
    return null;
  }
  const user = await db.collection('users').findOne({ _id: session.userId });
  if (!user) return null;
  if (now - (session.lastSeenAt || session.createdAt) > TOUCH_EVERY_MS) {
    await db.collection('sessions').updateOne({ _id: session._id }, { $set: { lastSeenAt: now } });
  }
  return { session, user };
}

export function clearCookie(req, res, env, scope) {
  writeCookie(req, res, env, scope, '', 0);
}

// Ends the request's session in `scope`; returns the ended session (or null).
export async function endSession(req, res, env, scope) {
  const token = readToken(req, scope);
  clearCookie(req, res, env, scope);
  if (!token) return null;
  const db = await getDb(env);
  return db.collection('sessions').findOneAndDelete({ tokenHash: sha256(token) });
}

// Ends every session of a user. `scope` limits it to one scope; `keepId` spares one session.
export async function endUserSessions(env, userId, { scope, keepId } = {}) {
  const db = await getDb(env);
  const filter = { userId: new ObjectId(String(userId)) };
  if (scope) Object.assign(filter, scopeFilter(scope));
  if (keepId) filter._id = { $ne: keepId };
  const { deletedCount } = await db.collection('sessions').deleteMany(filter);
  return deletedCount;
}

// Admin panel: active sessions with their user.
export async function listActiveSessions(env, currentSessionId) {
  const db = await getDb(env);
  const now = new Date();
  const rows = await db
    .collection('sessions')
    .aggregate([
      { $match: { expiresAt: { $gt: now } } },
      { $sort: { lastSeenAt: -1, createdAt: -1 } },
      { $limit: 500 },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ])
    .toArray();
  return rows
    .map((s) => ({ ...s, scope: s.scope || 'store' }))
    .filter((s) => !isExpired(s, s.scope, now))
    .map((s) => ({
      id: String(s._id),
      scope: s.scope,
      userId: String(s.userId),
      name: s.user?.name || '(deleted user)',
      email: s.user?.email || '',
      ip: s.ip || '',
      userAgent: s.userAgent || '',
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt || s.createdAt,
      expiresAt: s.expiresAt,
      current: currentSessionId ? String(s._id) === String(currentSessionId) : false
    }));
}

export async function endSessionById(env, id, currentSessionId) {
  if (!ObjectId.isValid(id)) throw new HttpError(404, 'Session not found.');
  if (String(currentSessionId) === id) throw new HttpError(400, 'Use “Log out” to end your own session.');
  const db = await getDb(env);
  const { deletedCount } = await db.collection('sessions').deleteOne({ _id: new ObjectId(id) });
  if (!deletedCount) throw new HttpError(404, 'Session not found.');
}
