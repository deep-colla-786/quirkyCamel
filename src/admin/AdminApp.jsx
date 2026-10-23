import React, { useCallback, useEffect, useState } from 'react';
import { authApi } from '../lib/api';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

// Shows the admin login until an admin session exists, then the dashboard.
export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    authApi.me().then((res) => {
      const u = res.ok ? res.data.user : null;
      if (u && u.role !== 'admin') setNotice(`You’re signed in as ${u.email}, which isn’t an admin account.`);
      setUser(u && u.role === 'admin' ? u : null);
      setChecked(true);
    });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setNotice('');
  }, []);

  if (!checked) return <div className="ad-gate">Loading…</div>;
  if (!user) return <AdminLogin notice={notice} onLoggedIn={setUser} />;
  return <AdminDashboard user={user} onLogout={logout} />;
}
