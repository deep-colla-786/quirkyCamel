import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../lib/api';

// Account. Browsing and the cart are open to everyone; checkout needs a login.
export default function useAuth({ showToast }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [auth, setAuth] = useState({ open: false, mode: 'login', reason: '' });
  const afterLogin = useRef(null); // action to resume once the shopper logs in

  useEffect(() => {
    authApi.me().then((res) => {
      if (res.ok) setUser(res.data.user);
      setAuthChecked(true);
    });
  }, []);

  const openAuth = useCallback((mode = 'login', reason = '') => setAuth({ open: true, mode, reason }), []);
  const closeAuth = useCallback(() => {
    afterLogin.current = null;
    setAuth((a) => ({ ...a, open: false }));
  }, []);

  // Runs `action` now if logged in, otherwise after a successful login/sign-up.
  const requireLogin = (action, reason = 'Log in or create an account to place your order.') => {
    if (user) return action(user);
    afterLogin.current = action;
    openAuth('login', reason);
  };

  const handleAuthed = (u, isNew) => {
    setUser(u);
    setAuth((a) => ({ ...a, open: false }));
    showToast(isNew ? `Welcome to the caravan, ${u.name.split(' ')[0]}!` : `Welcome back, ${u.name.split(' ')[0]}!`);
    const next = afterLogin.current;
    afterLogin.current = null;
    if (next) next(u);
  };

  return { user, setUser, authChecked, auth, openAuth, closeAuth, requireLogin, handleAuthed };
}
