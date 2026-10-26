import { useEffect } from 'react';

// JSON helpers for localStorage. Both fail quietly when storage is unavailable.
export const readStore = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStore = (key, value) => {
  try {
    const json = JSON.stringify(value);
    // Skipping identical writes also stops two tabs echoing the same change forever.
    if (localStorage.getItem(key) !== json) localStorage.setItem(key, json);
  } catch {
    /* storage unavailable (private mode) */
  }
};

// Keeps `key` in localStorage and takes changes made in other tabs (guest carts in two
// tabs no longer overwrite each other).
export function useStoredState(key, value, setValue, fallback) {
  useEffect(() => writeStore(key, value), [key, value]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== key) return;
      setValue(readStore(key, fallback));
    };
    globalThis.addEventListener('storage', onStorage);
    return () => globalThis.removeEventListener('storage', onStorage);
    // `fallback` is a constant default; listing it would re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setValue]);
}
