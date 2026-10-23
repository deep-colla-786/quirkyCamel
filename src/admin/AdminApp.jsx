import React, { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, SESSION_ENDED_EVENT } from '../lib/api';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const ENDED_NOTICE = 'Your admin session has ended (30 minutes without activity, or it was ended elsewhere). Please sign in again.';

// Shows the admin login until an admin session exists, then the dashboard.
// The admin session is separate from any store login in the same browser.
export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState('');
  // Whether an admin is signed in, readable from event listeners without re-subscribing.
  const signedIn = useRef(false);
  useEffect(() => {
    signedIn.current = Boolean(user);
  }, [user]);

  useEffect(() => {
    adminApi.me().then((res) => {
      setUser(res.ok ? res.data.user : null);
      setChecked(true);
    });
  }, []);

  // Any admin request refused with 401 means the session is gone: back to the login.
  useEffect(() => {
    const sessionEnded = () => {
      if (!signedIn.current) return;
      setUser(null);
      setNotice(ENDED_NOTICE);
    };
    const onEnded = (e) => e.detail.area === 'admin' && sessionEnded();
    // Back on the tab after a while: the session may have timed out in the background.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      adminApi.me().then((res) => {
        if (res.ok && !res.data.user) sessionEnded();
      });
    };
    globalThis.addEventListener(SESSION_ENDED_EVENT, onEnded);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      globalThis.removeEventListener(SESSION_ENDED_EVENT, onEnded);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const login = useCallback((u) => {
    setNotice('');
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await adminApi.logout();
    setUser(null);
    setNotice('');
  }, []);

  if (!checked) return <div className="ad-gate">Loading…</div>;
  if (!user) return <AdminLogin key={notice} notice={notice} onLoggedIn={login} />;
  return <AdminDashboard user={user} onLogout={logout} />;
}
