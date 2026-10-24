import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ordersApi } from '../lib/api';
import { formatINR } from '../data/episodes';
import TrackingDetails from '../components/delivery/TrackingDetails';
import { userShape } from '../lib/propShapes';

// #track/<order-id>: where the customer's parcel is, when it arrives, and every step so
// far. Refreshes live when the courier sends an update (refreshKey changes).
export default function TrackingPage({ orderId, user, authChecked, onLogin, refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ordersApi.tracking(orderId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setData(res.data);
        setError('');
      } else setError(res.data.error || 'Could not load tracking for this order.');
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, user, refreshKey]);

  let body;
  if (!user) {
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
          <a href="#top">Home</a>
          <span>/</span>
          <a href="#account">Account</a>
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
