import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LogOut, UserX } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { fmtDateTime } from '../utils/format';
import LoadError from '../components/LoadError';

const AREAS = { store: ['info', 'Store'], admin: ['ok', 'Admin'] };
const FILTERS = [
  ['all', 'All'],
  ['store', 'Store'],
  ['admin', 'Admin']
];

const sessionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  scope: PropTypes.oneOf(['store', 'admin']).isRequired,
  userId: PropTypes.string.isRequired,
  name: PropTypes.string,
  email: PropTypes.string,
  device: PropTypes.string,
  ip: PropTypes.string,
  createdAt: PropTypes.string,
  lastSeenAt: PropTypes.string,
  expiresAt: PropTypes.string,
  current: PropTypes.bool
});

function SessionRow({ session: s, busy, onEnd, onEndUser }) {
  const [cls, label] = AREAS[s.scope];
  return (
    <tr>
      <td>
        <b>{s.name}</b>
        <small>{s.email}</small>
      </td>
      <td>
        <span className={`ad-badge ${cls}`}>{label}</span>
        {s.current && <small>This session</small>}
      </td>
      <td>
        {s.device}
        <small className="mono">{s.ip}</small>
      </td>
      <td>{fmtDateTime(s.createdAt)}</td>
      <td>{fmtDateTime(s.lastSeenAt)}</td>
      <td>{fmtDateTime(s.expiresAt)}</td>
      <td>
        {!s.current && (
          <button className="ad-link danger" disabled={busy} onClick={() => onEnd(s)}>
            <LogOut size={13} /> End session
          </button>
        )}
        <button className="ad-link danger" disabled={busy} onClick={() => onEndUser(s)}>
          <UserX size={13} /> End all for this user
        </button>
      </td>
    </tr>
  );
}

SessionRow.propTypes = {
  session: sessionShape.isRequired,
  busy: PropTypes.bool.isRequired,
  onEnd: PropTypes.func.isRequired,
  onEndUser: PropTypes.func.isRequired
};

// Everyone signed in right now, in the store and the admin panel, with the option to
// sign a session (or every session of a user) out.
export default function Sessions({ onFlash }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [area, setArea] = useState('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminApi.sessions();
    if (res.ok) {
      setRows(res.data.sessions);
      setError('');
    } else if (res.status !== 401) setError(res.data.error || 'Couldn’t load sessions.');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (request, success) => {
    setBusy(true);
    const res = await request();
    setBusy(false);
    onFlash(res.ok ? success(res.data) : res.data.error || 'Could not end the session.');
    load();
  };

  const endOne = (s) => run(() => adminApi.endSession(s.id), () => `Signed ${s.name} out of that ${s.scope} session.`);
  const endUser = (s) =>
    run(
      () => adminApi.endUserSessions(s.userId),
      (d) => `Ended ${d.ended} session${d.ended === 1 ? '' : 's'} for ${s.name}${s.current ? ' (kept yours)' : ''}.`
    );

  if (error && !rows) return <LoadError message={error} onRetry={load} />;
  if (!rows) return <p className="ad-muted">Loading…</p>;
  const list = area === 'all' ? rows : rows.filter((r) => r.scope === area);

  return (
    <section className="ad-card">
      <header className="ad-card-head">
        <div>
          <h2>Active sessions</h2>
          <p>Store sessions last 30 days · admin sessions end after 30 minutes idle or 8 hours</p>
        </div>
        <div className="ad-chips" role="group" aria-label="Filter by area">
          {FILTERS.map(([id, label]) => (
            <button key={id} aria-pressed={area === id} onClick={() => setArea(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>
      {list.length ? (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Area</th>
                <th>Device</th>
                <th>Signed in</th>
                <th>Last active</th>
                <th>Expires</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <SessionRow key={s.id} session={s} busy={busy} onEnd={endOne} onEndUser={endUser} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ad-muted">Nobody is signed in here right now.</p>
      )}
    </section>
  );
}

Sessions.propTypes = {
  onFlash: PropTypes.func.isRequired
};
