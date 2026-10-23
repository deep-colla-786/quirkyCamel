import React from 'react';

export default function Stat({ label, value, sub }) {
  return (
    <div className="ad-stat">
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}
