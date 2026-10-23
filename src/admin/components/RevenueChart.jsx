import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatINR } from '../../data/episodes';

// Daily revenue, last 30 days. Single series, so no legend: the card title names it.
const W = 760;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 30, left: 52 };

// Axis labels in Indian units: 1.5L (lakh), 2.3K.
function compact(n) {
  if (n >= 1e5) return `${+(n / 1e5).toFixed(1)}L`;
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}K`;
  return String(n);
}
const dayLabel = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function niceMax(v) {
  if (v <= 0) return 1000;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v / 4) * mag;
  return Math.ceil(v / step) * step;
}

export default function RevenueChart({ days }) {
  const [hover, setHover] = useState(null);
  const max = useMemo(() => niceMax(Math.max(...days.map((d) => d.revenue))), [days]);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / days.length;
  const barW = Math.min(24, slot - 2); // 2px surface gap between neighbours
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const total = days.reduce((s, d) => s + d.revenue, 0);

  // Rounded 4px data-end (top), square at the baseline.
  const barPath = (x, top, w, base) => {
    const h = base - top;
    if (h <= 0) return '';
    const r = Math.min(4, w / 2, h);
    return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`;
  };

  const hd = hover !== null ? days[hover] : null;

  return (
    <figure className="ad-chart">
      <div className="ad-chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily revenue for the last 30 days, ${formatINR(total)} in total`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="ad-grid" />
              <text x={PAD.left - 8} y={y(t)} className="ad-tick" textAnchor="end" dominantBaseline="middle">
                ₹{compact(t)}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const x = PAD.left + i * slot + (slot - barW) / 2;
            return (
              <g key={d.date}>
                {d.revenue > 0 && <path d={barPath(x, y(d.revenue), barW, y(0))} className={`ad-bar ${hover === i ? 'on' : ''}`} />}
                {/* Hit target spans the full slot and plot height, bigger than the mark */}
                <rect
                  x={PAD.left + i * slot}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${dayLabel(d.date)}: ${formatINR(d.revenue)}, ${d.orders} orders`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
                {/* weekly labels, anchored on the most recent day so they never collide */}
                {(days.length - 1 - i) % 7 === 0 && (
                  <text x={PAD.left + i * slot + slot / 2} y={H - 10} className="ad-tick" textAnchor="middle">
                    {dayLabel(d.date)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="ad-axis" />
        </svg>
        {hd && (
          <div
            className="ad-tip"
            style={{
              left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`,
              top: `${(y(hd.revenue) / H) * 100}%`
            }}
          >
            <b>{formatINR(hd.revenue)}</b>
            <span>
              {dayLabel(hd.date)} · {hd.orders} {hd.orders === 1 ? 'order' : 'orders'}
            </span>
          </div>
        )}
      </div>
      {/* Table view of the same data for screen readers */}
      <table className="sr">
        <caption>Daily revenue, last 30 days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Orders</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{dayLabel(d.date)}</td>
              <td>{d.orders}</td>
              <td>{formatINR(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

RevenueChart.propTypes = {
  days: PropTypes.arrayOf(
    PropTypes.shape({ date: PropTypes.string.isRequired, orders: PropTypes.number.isRequired, revenue: PropTypes.number.isRequired })
  ).isRequired
};
