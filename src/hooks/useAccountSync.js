import { useCallback, useEffect, useRef } from 'react';
import { accountApi } from '../lib/api';

const SAVE_DELAY_MS = 300;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const countItems = (cart) => Object.values(cart).reduce((n, q) => n + q, 0);

function restoredMessage(name, cartItems, savedItems) {
  const parts = [];
  if (cartItems) parts.push(`${plural(cartItems, 'item')} in your cart`);
  if (savedItems) parts.push(plural(savedItems, 'saved item'));
  return `Welcome back, ${name.split(' ')[0]}! You have ${parts.join(' and ')}.`;
}

// The requests that turn the account's copy (`from`) into this page's copy (`to`).
// Only what changed is sent, so other tabs' changes are never overwritten.
function changes(from, to) {
  const requests = [];
  const slugs = new Set([...Object.keys(from.cart), ...Object.keys(to.cart)]);
  for (const slug of slugs) {
    const qty = to.cart[slug] || 0;
    if (qty !== (from.cart[slug] || 0)) requests.push(() => accountApi.setQty(slug, qty));
  }
  for (const slug of to.wishlist) if (!from.wishlist.includes(slug)) requests.push(() => accountApi.save(slug));
  for (const slug of from.wishlist) if (!to.wishlist.includes(slug)) requests.push(() => accountApi.unsave(slug));
  return requests;
}

// Keeps a signed-in customer's cart and wishlist on their account (the `cart` and
// `wishlist` lists on their document in MongoDB `users`):
// - on login, the account's items come back, merged with anything picked as a guest;
// - while signed in, each change is saved; changes made in another tab or device
//   arrive through `reload` (called on a live "saved" event);
// - on logout, they're cleared from this device; they return on the next login.
export default function useAccountSync({ user, authChecked, cart, setCart, wishlist, setWishlist, showToast }) {
  const loadedFor = useRef(null); // id of the user whose items are loaded
  const known = useRef(null); // the account's copy, as last seen by this page
  const sawGuest = useRef(false); // the page was used signed out, so a login is "fresh"
  const previousUser = useRef(null);
  const latest = useRef({ cart, wishlist });

  useEffect(() => {
    latest.current = { cart, wishlist };
  }, [cart, wishlist]);

  useEffect(() => {
    if (authChecked && !user) sawGuest.current = true;
  }, [authChecked, user]);

  const adopt = useCallback(
    (saved) => {
      known.current = saved;
      latest.current = saved;
      setCart(saved.cart);
      setWishlist(saved.wishlist);
    },
    [setCart, setWishlist]
  );

  // Login: load (and merge guest picks on a fresh login). Logout: clear this device.
  useEffect(() => {
    const prev = previousUser.current;
    previousUser.current = user;
    if (!user) {
      loadedFor.current = null;
      if (prev) adopt({ cart: {}, wishlist: [] });
      known.current = null;
      return;
    }
    if (loadedFor.current === user.id) return;
    let cancelled = false;
    (async () => {
      const res = await accountApi.saved();
      if (cancelled || !res.ok) return;
      const fresh = sawGuest.current;
      const { cart: guestCart, wishlist: guestList } = latest.current;
      const hasGuestPicks = Object.keys(guestCart).length > 0 || guestList.length > 0;
      // A page loaded with an existing session trusts the account; a fresh login adds the guest picks.
      const merged = fresh && hasGuestPicks ? await accountApi.merge(guestCart, guestList) : res;
      if (cancelled || !merged.ok) return;
      loadedFor.current = user.id;
      adopt(merged.data);
      const restoredCart = countItems(res.data.cart);
      if (fresh && (restoredCart || res.data.wishlist.length)) {
        showToast(restoredMessage(user.name, restoredCart, res.data.wishlist.length));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, adopt, showToast]);

  // Sends whatever changed since the account's copy was last seen.
  const sendChanges = useCallback(() => {
    if (!known.current) return Promise.resolve();
    const now = latest.current;
    const requests = changes(known.current, now);
    known.current = now;
    return Promise.all(requests.map((send) => send()));
  }, []);

  // Save each change shortly after it happens.
  useEffect(() => {
    if (!user || loadedFor.current !== user.id) return;
    const timer = setTimeout(sendChanges, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, cart, wishlist, sendChanges]);

  // Another tab or device changed the cart or wishlist: take the account's copy.
  const reload = useCallback(async () => {
    if (!loadedFor.current) return;
    await sendChanges();
    const res = await accountApi.saved();
    if (res.ok && loadedFor.current) adopt(res.data);
  }, [adopt, sendChanges]);

  // flush saves right away (used before logging out, so the last change isn't lost).
  return { flush: sendChanges, reload };
}
