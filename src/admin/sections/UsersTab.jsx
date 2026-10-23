import React, { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { formatINR } from '../../data/episodes';
import { fmtDate, fmtDateTime } from '../utils/format';
import downloadCsv from '../utils/downloadCsv';

export default function UsersTab() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let off = false;
    const t = setTimeout(async () => {
      const res = await adminApi.users(q.trim());
      if (off) return;
      if (res.ok) setUsers(res.data.users);
      else setError(res.data.error || 'Could not load users.');
    }, q ? 250 : 0);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <section className="ad-card">
      <header className="ad-card-head">
        <div>
          <h2>Users</h2>
          <p>{users ? `${users.length} accounts` : 'Loading…'}</p>
        </div>
        <div className="ad-tools">
          <label className="ad-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" aria-label="Search users" />
          </label>
          {users && (
            <button
              className="btn ghost-dark ad-btn-sm"
              onClick={() =>
                downloadCsv('users.csv', [
                  ['Name', 'Email', 'Phone', 'Role', 'City', 'Joined', 'Last login', 'Orders', 'Spent'],
                  ...users.map((u) => [u.name, u.email, u.phone, u.role, u.city, u.createdAt, u.lastLoginAt, u.orders, u.spent])
                ])
              }
            >
              <Download size={15} /> CSV
            </button>
          )}
        </div>
      </header>
      {error && <p className="ad-error">{error}</p>}
      {users && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>City</th>
                <th>Joined</th>
                <th>Last login</th>
                <th className="num">Orders</th>
                <th className="num">Spent</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>
                      {u.name} {u.role === 'admin' && <span className="ad-badge info">Admin</span>}
                    </b>
                    <small>{u.email}</small>
                  </td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.city || '—'}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>{fmtDateTime(u.lastLoginAt)}</td>
                  <td className="num">{u.orders}</td>
                  <td className="num">{u.spent ? formatINR(u.spent) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
