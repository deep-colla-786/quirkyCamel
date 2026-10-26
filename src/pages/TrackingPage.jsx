import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ordersApi } from '../lib/api';
import { formatINR } from '../data/episodes';
import TrackingDetails from '../components/delivery/TrackingDetails';
import { userShape } from '../lib/propShapes';

const GUEST_POLL_MS = 60 * 1000;

// /track/<order-id>: where the customer's parcel is, when it arrives, and every step so
// far. Signed-in customers get live updates (refreshKey changes); a guest's link carries
// the order's private token (?t=…) and the page checks for updates every minute.
export default function TrackingPage({ orderId, user, authChecked, onLogin, refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [guestToken] = useState(() => new URLSearchParams(globalThis.location.search).get('t'));
  const canLoad = Boolean(user || guestToken);

  useEffect(() => {
    if (!canLoad) return;
    let cancelled = false;
    const load = () =>
      ordersApi.tracking(orderId, guestToken).then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setData(res.data);
          setError('');
        } else setError(res.data.error || 'Could not load tracking for this order.');
      });
    load();
    const timer = user ? null : setInterval(load, GUEST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId, user, canLoad, guestToken, refreshKey]);

  let body;
  if (!canLoad) {
    body = authChecked ? (
      <div className="track-empty">
        <p>Log in to see where your order is.</p>
        <button className="btn blue" onClick={onLogin}>
          Log in
        </button>
      </div>
    ) : (
      <p>Loading…</p>
    );
  } else if (error) {
    body = <p className="err">{error}</p>;
  } else if (!data) {
    body = <p>Loading…</p>;
  } else if (data.shipment) {
    body = <TrackingDetails shipment={data.shipment} />;
  } else {
    body = (
      <div className="track-empty">
        <b>We’re packing your order.</b>
        <p>Courier and tracking details will appear here as soon as your parcel is booked.</p>
      </div>
    );
  }

  return (
    <div className="track-page">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/account">Account</a>
          <span>/</span>
          <span aria-current="page">Track order</span>
        </nav>
        <div className="track-head">
          <div>
            <span className="pd-eyebrow">Track your order</span>
            <h1>{data?.order.invoiceNumber || 'Your order'}</h1>
            {data && (
              <p>
                {data.order.items.map((it) => `${it.name} × ${it.qty}`).join(', ')} · {formatINR(data.order.amount)}
              </p>
            )}
          </div>
        </div>
        {body}
      </div>
    </div>
  );
}

TrackingPage.propTypes = {
  orderId: PropTypes.string.isRequired,
  user: userShape,
  authChecked: PropTypes.bool.isRequired,
  onLogin: PropTypes.func.isRequired,
  refreshKey: PropTypes.number.isRequired
};
