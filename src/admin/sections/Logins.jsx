import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { adminApi } from '../../lib/api';
import { fmtDateTime } from '../utils/format';
import LoadError from '../components/LoadError';

const LOGIN_TYPES = { login: ['ok', 'Login'], signup: ['info', 'Sign-up'], failed: ['bad', 'Failed login'], logout: ['muted', 'Logout'] };
const AREA_LABELS = { store: 'Store', admin: 'Admin' };
const FILTERS = ['all', 'login', 'signup', 'failed', 'logout'];

function EventBadge({ type }) {
  const [cls, label] = LOGIN_TYPES[type] || ['muted', type];
  return <span className={`ad-badge ${cls}`}>{label}</span>;
}

EventBadge.propTypes = { type: PropTypes.string.isRequired };

export default function Logins() {
  const [rows, setRows] = useState(null);
  const [type, setType] = useState('all');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    const res = await adminApi.logins();
    if (res.ok) setRows(res.data.logins);
    else if (res.status !== 401) setError(res.data.error || 'Couldn’t load login activity.');
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <LoadError message={error} onRetry={load} />;
  if (!rows) return <p className="ad-muted">Loading…</p>;
  const list = type === 'all' ? rows : rows.filter((r) => r.type === type);

  return (
    <section className="ad-card">
      <header className="ad-card-head">
        <div>
          <h2>Login activity</h2>
          <p>The latest 200 sign-ups, logins, failed attempts and logouts, in the store and the admin panel</p>
        </div>
        <div className="ad-chips" role="group" aria-label="Filter by event">
          {FILTERS.map((t) => (
            <button key={t} aria-pressed={type === t} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : LOGIN_TYPES[t][1]}
            </button>
          ))}
        </div>
      </header>
      {list.length ? (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Area</th>
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
                    <EventBadge type={r.type} />
                  </td>
                  <td>{AREA_LABELS[r.scope] || r.scope}</td>
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
