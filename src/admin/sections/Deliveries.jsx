import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, X, RotateCcw } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { fmtDateTime } from '../utils/format';
import DeliveryBar from '../components/DeliveryBar';
import DeliveryBadge from '../../components/delivery/DeliveryBadge';
import TrackingDetails from '../../components/delivery/TrackingDetails';
import { fmtDay, placeName } from '../../components/delivery/deliveryFormat';

const POLL_MS = 20_000; // the list refreshes itself while the tab is open
const FILTERS = [
  ['all', 'All'],
  ['active', 'On the way'],
  ['delivered', 'Delivered'],
  ['problem', 'Needs attention']
];

const matchesFilter = (s, filter) => {
  if (filter === 'all') return true;
  if (filter === 'problem') return s.state !== 'active' && s.state !== 'delivered';
  return s.state === filter;
};

function DeliveryDetail({ orderId, onClose, onChanged }) {
  const [shipment, setShipment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await adminApi.delivery(orderId);
    if (res.ok) setShipment(res.data.shipment);
    else setMessage(res.data.error || 'Could not load this shipment.');
  }, [orderId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = async (request, done) => {
    setBusy(true);
    setMessage('');
    const res = await request(orderId);
    setBusy(false);
    if (res.ok) {
      setShipment(res.data.shipment);
      setMessage(done);
      onChanged();
    } else setMessage(res.data.error || 'Something went wrong.');
  };

  const isDemo = shipment?.mode === 'demo';
  return (
    <div className="ad-modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal ad-delivery-modal" role="dialog" aria-modal="true" aria-labelledby="dl-title">
        <header>
          <div>
            <h2 id="dl-title">Delivery · {shipment?.invoiceNumber || '…'}</h2>
            {shipment && (
              <small className="ad-muted">
                {shipment.customerName} · {shipment.email}
              </small>
            )}
          </div>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="ad-form">
          {shipment && <TrackingDetails shipment={shipment} showInternal />}
          {message && <p className="ad-muted">{message}</p>}
        </div>
        <footer>
          {shipment?.awb ? (
            <button className="btn ghost-dark ad-btn-sm" disabled={busy} onClick={() => run(adminApi.refreshDelivery, 'Tracking updated.')}>
              <RefreshCw size={15} /> {isDemo ? 'Next demo update' : 'Refresh tracking'}
            </button>
          ) : (
            <button className="btn blue ad-btn-sm" disabled={busy} onClick={() => run(adminApi.retryDelivery, 'Shipment booked.')}>
              <RotateCcw size={15} /> Book shipment
            </button>
          )}
          <span className="ad-spacer" />
          <button className="btn ghost-dark ad-btn-sm" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

DeliveryDetail.propTypes = {
  orderId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onChanged: PropTypes.func.isRequired
};

// Every order's shipment: courier, AWB, where it is and when it arrives.
export default function Deliveries({ openOrderId, onOpen }) {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(openOrderId || null);

  const load = useCallback(async () => {
    const res = await adminApi.deliveries();
    if (res.ok) setRows(res.data.shipments);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const close = useCallback(() => {
    setViewing(null);
    onOpen?.(null);
  }, [onOpen]);

  if (!rows) return <p className="ad-muted">Loading…</p>;
  const list = rows.filter((s) => matchesFilter(s, filter));

  return (
    <>
      <DeliveryBar />
      <section className="ad-card">
        <header className="ad-card-head">
          <div>
            <h2>Deliveries</h2>
            <p>{rows.length} shipments · updates arrive automatically</p>
          </div>
          <div className="ad-chips" role="group" aria-label="Filter deliveries">
            {FILTERS.map(([id, label]) => (
              <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
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
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Courier · AWB</th>
                  <th>Status</th>
                  <th>Latest update</th>
                  <th>Arriving by</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.orderId}>
                    <td>
                      <button className="ad-link" onClick={() => setViewing(s.orderId)}>
                        <b className="mono">{s.invoiceNumber}</b>
                      </button>
                    </td>
                    <td>
                      <b>{s.customerName}</b>
                      <small>
                        {s.destination?.city}
                        {s.destination?.state ? `, ${s.destination.state}` : ''} {s.destination?.pin}
                      </small>
                    </td>
                    <td>
                      {s.courierName || '—'}
                      <small className="mono">{s.awb || s.error || ''}</small>
                    </td>
                    <td>
                      <DeliveryBadge shipment={s} />
                    </td>
                    <td>
                      {s.lastScan?.activity || '—'}
                      <small>
                        {placeName(s.lastScan?.location)} {s.lastScan ? `· ${fmtDateTime(s.lastScan.at)}` : ''}
                      </small>
                    </td>
                    <td>{s.deliveredAt ? `Delivered ${fmtDay(s.deliveredAt)}` : fmtDay(s.etd) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ad-muted">{rows.length ? 'No shipments match this filter.' : 'No shipments yet. They’re created when an order is paid.'}</p>
        )}
      </section>
      {viewing && <DeliveryDetail orderId={viewing} onClose={close} onChanged={load} />}
    </>
  );
}

Deliveries.propTypes = {
  openOrderId: PropTypes.string,
  onOpen: PropTypes.func
};
