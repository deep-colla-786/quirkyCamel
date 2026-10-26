// Fixed-window rate limiter kept in memory (per process). Old entries are cleared
// regularly so the map can't grow without bound. With several server processes, use a
// shared store such as Redis instead.
import { HttpError } from './http.js';

const PRUNE_EVERY_MS = 60 * 1000;
const limiters = new Set();

export function createLimiter({ windowMs, max, message = 'Too many attempts. Please wait a few minutes and try again.' }) {
  const hits = new Map(); // key -> { first, count }
  const live = (entry, now) => entry && now - entry.first < windowMs;

  const limiter = {
    // Throws 429 once `key` has used up its attempts in the current window.
    check(key) {
      const entry = hits.get(key);
      if (live(entry, Date.now()) && entry.count >= max) throw new HttpError(429, message);
    },
    hit(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (live(entry, now)) entry.count += 1;
      else hits.set(key, { first: now, count: 1 });
    },
    // check + hit in one step, for limits on every attempt (not only failures).
    take(key) {
      limiter.check(key);
      limiter.hit(key);
    },
    reset(key) {
      hits.delete(key);
    },
    prune(now = Date.now()) {
      for (const [key, entry] of hits) if (!live(entry, now)) hits.delete(key);
    },
    size: () => hits.size
  };
  limiters.add(limiter);
  return limiter;
}

clearInterval(globalThis.__qcLimiterPrune);
globalThis.__qcLimiterPrune = setInterval(() => {
  for (const l of limiters) l.prune();
}, PRUNE_EVERY_MS);
globalThis.__qcLimiterPrune.unref?.();
