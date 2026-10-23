import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { formatINR } from '../../data/episodes';
import { fmtDateTime, itemsText } from '../utils/format';
import downloadCsv from '../utils/downloadCsv';
import EmailBadge from '../components/EmailBadge';
import MailBar from '../components/MailBar';
import ResendButton from '../components/ResendButton';

export default function Orders({ orders, onChanged }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || !orders) return orders;
    return orders.filter((o) =>
      [o.invoice, o.account, o.customer.name, o.customer.phone, o.customer.city, itemsText(o.items)].join(' ').toLowerCase().includes(s)
    );
  }, [orders, q]);
  if (!orders) return <p className="ad-muted">Loading…</p>;
  return (
    <>
    <MailBar />
    <section className="ad-card">
      <header className="ad-card-head">
        <div>
          <h2>Orders</h2>
          <p>{orders.length} total · emails show where each invoice went</p>
        </div>
        <div className="ad-tools">
          <label className="ad-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders" aria-label="Search orders" />
          </label>
          <button
            className="btn ghost-dark ad-btn-sm"
            onClick={() =>
              downloadCsv('orders.csv', [
                ['Invoice', 'Date', 'Account', 'Name', 'Phone', 'Address', 'City', 'PIN', 'Items', 'Amount', 'Status', 'Mode', 'Razorpay order', 'Payment ID'],
                ...orders.map((o) => [
                  o.invoice, new Date(o.createdAt).toISOString(), o.account, o.customer.name, o.customer.phone,
                  o.customer.addr, o.customer.city, o.customer.pin, itemsText(o.items), o.amount, o.status, o.mode,
                  o.razorpayOrderId, o.paymentId
                ])
              ])
            }
          >
            <Download size={15} /> CSV
          </button>
        </div>
      </header>
      {list.length ? (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Invoice email</th>
                <th>Admin email</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
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
                    <span className={`ad-badge ${o.mode === 'demo' ? 'info' : 'ok'}`}>{o.mode === 'demo' ? 'Demo' : 'Paid'}</span>
                    {o.paymentId && <small className="mono">{o.paymentId}</small>}
                  </td>
                  <td>
                    <EmailBadge e={o.emails?.customer} />
                  </td>
                  <td>
                    <EmailBadge e={o.emails?.admin} />
                    {o.status === 'paid' && <ResendButton orderId={o.id} onDone={onChanged} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ad-muted">{orders.length ? 'No orders match your search.' : 'No orders yet.'}</p>
      )}
    </section>
    </>
  );
}
