import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Package, LogOut, MapPin, Mail, Phone, MonitorSmartphone } from 'lucide-react';
import { ordersApi } from '../lib/api';
import { formatINR } from '../data/episodes';
import { userShape } from '../lib/propShapes';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const orderStatusLabel = (o) => {
  if (o.mode === 'demo') return 'Demo order';
  if (o.status === 'paid') return 'Paid';
  return o.status;
};

export default function AccountPage({ user, onLogin, onLogout, onLogoutAll }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ordersApi.list().then((res) => {
      if (cancelled) return;
      if (res.ok) setOrders(res.data.orders);
      else setError(res.data.error || 'Could not load your orders.');
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="account-page">
        <div className="wrap account-gate">
          <span className="icon" />
          <h1>Your account</h1>
          <p>Log in to see your orders and saved delivery details.</p>
          <div className="cta-row">
            <button className="btn blue" onClick={() => onLogin('login')}>
              Log in
            </button>
            <button className="btn ghost-dark" onClick={() => onLogin('signup')}>
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#top">Home</a>
          <span>/</span>
          <span aria-current="page">Account</span>
        </nav>
        <div className="account-head">
          <div>
            <span className="pd-eyebrow">Your account</span>
            <h1>Hi, {user.name.split(' ')[0]}</h1>
          </div>
          <div className="account-actions">
            <button className="btn ghost-dark" onClick={onLogout}>
              <LogOut size={17} /> Log out
            </button>
            <button className="btn ghost-dark" onClick={onLogoutAll} title="End your sessions on every device">
              <MonitorSmartphone size={17} /> Log out everywhere
            </button>
          </div>
        </div>

        <div className="account-grid">
          <section className="account-card">
            <h2>Profile</h2>
            <ul className="account-facts">
              <li>
                <Mail size={17} /> {user.email}
              </li>
              <li>
                <Phone size={17} /> {user.phone || 'No phone saved yet'}
              </li>
              <li>
                <MapPin size={17} />
                {user.address
                  ? `${user.address.addr}, ${user.address.city} ${user.address.pin}`
                  : 'Your delivery address is saved at your first checkout'}
              </li>
            </ul>
          </section>

          <section className="account-card account-orders">
            <h2>Orders</h2>
            {error && <p className="err">{error}</p>}
            {!orders && !error && <p className="account-muted">Loading…</p>}
            {orders && orders.length === 0 && (
              <div className="account-empty">
                <Package size={28} />
                <p>No orders yet.</p>
                <a className="btn blue" href="#shop">
                  Shop the kit
                </a>
              </div>
            )}
            {orders && orders.length > 0 && (
              <ul className="order-list">
                {orders.map((o) => (
                  <li key={o.id}>
                    <div>
                      <b>{o.items.map((it) => `${it.name} × ${it.qty}`).join(', ')}</b>
                      <small>
                        {fmtDate(o.createdAt)} · Ship to {o.shipTo.name}, {o.shipTo.city} {o.shipTo.pin}
                      </small>
                      <code>{o.invoiceNumber || o.razorpayOrderId || `#${o.id.slice(-8).toUpperCase()}`}</code>
                    </div>
                    <div className="order-right">
                      <b>{formatINR(o.amount)}</b>
                      <span className={`order-status ${o.status}`}>
                        {orderStatusLabel(o)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

AccountPage.propTypes = {
  user: userShape,
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onLogoutAll: PropTypes.func.isRequired
};
