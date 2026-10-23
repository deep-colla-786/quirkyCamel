import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { fmtDateTime } from '../utils/format';

const LOGIN_TYPES = { login: ['ok', 'Login'], signup: ['info', 'Sign-up'], failed: ['bad', 'Failed login'], logout: ['muted', 'Logout'] };

export default function Logins() {
  const [rows, setRows] = useState(null);
  const [type, setType] = useState('all');
  useEffect(() => {
    adminApi.logins().then((res) => res.ok && setRows(res.data.logins));
  }, []);
  const list = rows && (type === 'all' ? rows : rows.filter((r) => r.type === type));
  return (
    <section className="ad-card">
      <header className="ad-card-head">
        <div>
          <h2>Login activity</h2>
          <p>The latest 200 sign-ups, logins, failed attempts and logouts</p>
        </div>
        <div className="ad-chips" role="group" aria-label="Filter by event">
          {['all', 'login', 'signup', 'failed', 'logout'].map((t) => (
            <button key={t} aria-pressed={type === t} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : LOGIN_TYPES[t][1]}
            </button>
          ))}
        </div>
      </header>
      {!list ? (
        <p className="ad-muted">Loading…</p>
      ) : list.length ? (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Email</th>
                <th>Device</th>
                <th>IP address</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.at)}</td>
                  <td>
                    <span className={`ad-badge ${LOGIN_TYPES[r.type]?.[0] || 'muted'}`}>{LOGIN_TYPES[r.type]?.[1] || r.type}</span>
                  </td>
                  <td>{r.email || '—'}</td>
                  <td>{r.device}</td>
                  <td className="mono">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ad-muted">No activity yet.</p>
      )}
    </section>
  );
}
