// Guest checkout tokens: an order placed without an account gets a random token; only
// its SHA-256 hash is stored. Holding the token proves you placed the order.
import crypto from 'node:crypto';

export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

export function newGuestToken() {
  const token = crypto.randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

export const guestTokenMatches = (order, token) => Boolean(order?.guestTokenHash && token && hashToken(token) === order.guestTokenHash);
