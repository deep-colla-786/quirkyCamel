import React from 'react';
import PropTypes from 'prop-types';
import { formatINR } from '../../data/episodes';
import { fmtDateTime, itemsText } from '../utils/format';
import Stat from '../components/Stat';
import RevenueChart from '../components/RevenueChart';
import { orderShape, statsShape } from '../utils/shapes';

function revenueNote(revenue, demoShare) {
  if (revenue === 0) return 'No sales yet';
  return demoShare > 0 ? `${formatINR(demoShare)} from demo orders` : 'All paid via Razorpay';
}

export default function Overview({ stats, orders, onGo }) {
  if (!stats) return <p className="ad-muted">Loading…</p>;
  const demoShare = stats.revenue - stats.liveRevenue;
  return (
    <>
      <div className="ad-stats">
        <Stat
          label="Revenue"
          value={formatINR(stats.revenue)}
          sub={revenueNote(stats.revenue, demoShare)}
        />
        <Stat label="Orders" value={stats.orders} sub={`${stats.unitsSold} items sold`} />
        <Stat label="Customers" value={stats.users} sub={`${stats.newUsers7d} new in the last 7 days`} />
        <Stat label="Products" value={stats.activeProducts} sub={`${stats.products - stats.activeProducts} hidden`} />
        <Stat label="Logins" value={stats.logins7d} sub="Last 7 days" />
      </div>

      <section className="ad-card">
        <header className="ad-card-head">
          <div>
            <h2>Revenue, last 30 days</h2>
            <p>{formatINR(stats.days.reduce((s, d) => s + d.revenue, 0))} from {stats.days.reduce((s, d) => s + d.orders, 0)} orders</p>
          </div>
        </header>
        <RevenueChart days={stats.days} />
      </section>

      <div className="ad-two">
        <section className="ad-card">
          <header className="ad-card-head">
            <h2>Recent orders</h2>
            <button className="ad-link" onClick={() => onGo('orders')}>
              View all
            </button>
          </header>
          {orders?.length ? (
            <ul className="ad-list">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <div>
                    <b>{o.customer.name}</b>
                    <small>{itemsText(o.items)}</small>
                  </div>
                  <div className="ad-right">
                    <b>{formatINR(o.amount)}</b>
                    <small>{fmtDateTime(o.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ad-muted">No orders yet.</p>
          )}
        </section>
        <section className="ad-card">
          <header className="ad-card-head">
            <h2>Best sellers</h2>
            <button className="ad-link" onClick={() => onGo('products')}>
              Products
            </button>
          </header>
          {stats.topProducts.length ? (
            <ul className="ad-list">
              {stats.topProducts.map((p) => (
                <li key={p.slug}>
                  <b>{p.name}</b>
                  <span className="ad-right">{p.units} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ad-muted">Nothing sold yet.</p>
          )}
        </section>
      </div>
    </>
  );
}

Overview.propTypes = {
  stats: statsShape,
  orders: PropTypes.arrayOf(orderShape),
  onGo: PropTypes.func.isRequired
};
