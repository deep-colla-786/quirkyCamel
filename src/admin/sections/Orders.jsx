import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Download, Search, FileText } from 'lucide-react';
import { formatINR } from '../../data/episodes';
import { fmtDateTime, itemsText } from '../utils/format';
import downloadCsv from '../utils/downloadCsv';
import { orderShape } from '../utils/shapes';
import EmailBadge from '../components/EmailBadge';
import MailBar from '../components/MailBar';
import ResendButton from '../components/ResendButton';
import InvoiceModal from '../components/InvoiceModal';

const CSV_HEADER = ['Invoice', 'Date', 'Account', 'Name', 'Phone', 'Address', 'City', 'PIN', 'Items', 'Amount', 'Status', 'Mode', 'Razorpay order', 'Payment ID'];

const csvRow = (o) => [
  o.invoice, new Date(o.createdAt).toISOString(), o.account, o.customer.name, o.customer.phone,
  o.customer.addr, o.customer.city, o.customer.pin, itemsText(o.items), o.amount, o.status, o.mode,
  o.razorpayOrderId, o.paymentId
];

const matches = (o, s) =>
  [o.invoice, o.account, o.customer.name, o.customer.phone, o.customer.city, itemsText(o.items)].join(' ').toLowerCase().includes(s);

function OrderRow({ order: o, onChanged, onViewInvoice }) {
  const isDemo = o.mode === 'demo';
  const isPaid = o.status === 'paid';
  return (
    <tr>
      <td>
        <b className="mono">{o.invoice || '—'}</b>
        <small>{fmtDateTime(o.createdAt)}</small>
      </td>
      <td>
        <b>{o.customer.name}</b>
        <small>
          {o.account} · {o.customer.phone}
        </small>
        <small>
          {o.customer.addr}, {o.customer.city} {o.customer.pin}
        </small>
      </td>
      <td>
        {itemsText(o.items)}
        {o.customer.gift && <small>Gift note: “{o.customer.gift}”</small>}
      </td>
      <td className="num">
        <b>{formatINR(o.amount)}</b>
      </td>
      <td>
        <span className={`ad-badge ${isDemo ? 'info' : 'ok'}`}>{isDemo ? 'Demo' : 'Paid'}</span>
        {o.paymentId && <small className="mono">{o.paymentId}</small>}
      </td>
      <td>
        {isPaid ? (
          <button className="ad-link" onClick={() => onViewInvoice(o)}>
            <FileText size={14} /> View invoice
          </button>
        ) : (
          '—'
        )}
      </td>
      <td>
        <EmailBadge e={o.emails?.customer} />
      </td>
      <td>
        <EmailBadge e={o.emails?.admin} />
        {isPaid && <ResendButton orderId={o.id} onDone={onChanged} />}
      </td>
    </tr>
  );
}

OrderRow.propTypes = {
  order: orderShape.isRequired,
  onChanged: PropTypes.func.isRequired,
  onViewInvoice: PropTypes.func.isRequired
};

export default function Orders({ orders, onChanged }) {
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const closeInvoice = useCallback(() => setViewing(null), []);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || !orders) return orders;
    return orders.filter((o) => matches(o, s));
  }, [orders, q]);

  if (!orders) return <p className="ad-muted">Loading…</p>;
  const emptyText = orders.length ? 'No orders match your search.' : 'No orders yet.';

  return (
    <>
      <MailBar />
      <section className="ad-card">
        <header className="ad-card-head">
          <div>
            <h2>Orders</h2>
            <p>{orders.length} total · open any invoice, or see where each email went</p>
          </div>
          <div className="ad-tools">
            <label className="ad-search">
              <Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders" aria-label="Search orders" />
            </label>
            <button className="btn ghost-dark ad-btn-sm" onClick={() => downloadCsv('orders.csv', [CSV_HEADER, ...orders.map(csvRow)])}>
              <Download size={15} /> CSV
            </button>
          </div>
        </header>
        {list.length ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                  <th>Invoice email</th>
                  <th>Admin email</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <OrderRow key={o.id} order={o} onChanged={onChanged} onViewInvoice={setViewing} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ad-muted">{emptyText}</p>
        )}
      </section>
      {viewing && <InvoiceModal order={viewing} onClose={closeInvoice} />}
    </>
  );
}

Orders.propTypes = {
  orders: PropTypes.arrayOf(orderShape),
  onChanged: PropTypes.func.isRequired
};
