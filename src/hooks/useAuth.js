import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi, SESSION_ENDED_EVENT } from '../lib/api';

// Account. Browsing and the cart are open to everyone; checkout works signed in or as a guest.
export default function useAuth({ showToast }) {
  const [user, setUserState] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [auth, setAuth] = useState({ open: false, mode: 'login', reason: '', allowGuest: false });
  const afterLogin = useRef(null); // action to resume once the shopper logs in
  // The latest user, so callbacks created before a login/logout never act on a stale value.
  const userRef = useRef(null);

  const setUser = useCallback((u) => {
    userRef.current = u;
    setUserState(u);
  }, []);

  useEffect(() => {
    authApi.me().then((res) => {
      if (res.ok) setUser(res.data.user);
      setAuthChecked(true);
    });
  }, [setUser]);

  // The server refused a request: the session expired or was ended on another device.
  useEffect(() => {
    const onEnded = (e) => {
      if (e.detail.area !== 'store' || !userRef.current) return;
      setUser(null);
      showToast('Your session has ended. Please log in again.');
    };
    // Coming back to the tab: confirm the session is still valid (it may have been
    // ended from another device or by an admin while the tab sat in the background).
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !userRef.current) return;
      authApi.me().then((res) => {
        if (res.ok && !res.data.user && userRef.current) onEnded({ detail: { area: 'store' } });
      });
    };
    globalThis.addEventListener(SESSION_ENDED_EVENT, onEnded);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      globalThis.removeEventListener(SESSION_ENDED_EVENT, onEnded);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [setUser, showToast]);

  const openAuth = useCallback(
    (mode = 'login', reason = '', allowGuest = false) => setAuth({ open: true, mode, reason, allowGuest }),
    []
  );
  const closeAuth = useCallback(() => {
    afterLogin.current = null;
    setAuth((a) => ({ ...a, open: false }));
  }, []);

  // Runs `action` now if logged in, otherwise after a successful login/sign-up. With
  // `allowGuest` (checkout), the shopper may also continue without an account; the
  // action then runs with no user.
  const requireLogin = (action, reason = 'Log in or create an account to place your order.', { allowGuest = false } = {}) => {
    if (userRef.current) return action(userRef.current);
    afterLogin.current = action;
    openAuth('login', reason, allowGuest);
  };

  // Checkout as a guest: close the login and carry on with the pending action.
  const continueAsGuest = () => {
    const next = afterLogin.current;
    afterLogin.current = null;
    setAuth((a) => ({ ...a, open: false }));
    if (next) next(null);
  };

  // Opens sign-up and runs `action` once the account exists (e.g. adopt a guest order).
  const signUpThen = (action, reason) => {
    afterLogin.current = action;
    openAuth('signup', reason);
  };

  const handleAuthed = (u, isNew) => {
    setUser(u);
    setAuth((a) => ({ ...a, open: false }));
    const first = u.name.split(' ')[0];
    showToast(isNew ? `Welcome to the caravan, ${first}!` : `Welcome back, ${first}!`);
    const next = afterLogin.current;
    afterLogin.current = null;
    if (next) next(u);
  };

  return { user, setUser, authChecked, auth, openAuth, closeAuth, requireLogin, continueAsGuest, signUpThen, handleAuthed };
}
