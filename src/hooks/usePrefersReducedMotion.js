import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const getMql = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null);

const subscribe = (cb) => {
  const mql = getMql();
  if (!mql) return () => {};
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
};

export const prefersReducedMotion = () => Boolean(getMql()?.matches);

// True when the visitor has asked the system to reduce motion; updates live.
export default function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
