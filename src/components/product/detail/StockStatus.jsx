import React from 'react';
import PropTypes from 'prop-types';

const LOW_STOCK = 10;

// What the shopper sees about availability. `stock` null means unlimited.
function stockState(stock) {
  if (stock === null || stock === undefined) return { level: 'ok', text: 'In stock · ready to ship' };
  if (stock === 0) return { level: 'out', text: 'Out of stock right now' };
  if (stock <= LOW_STOCK) return { level: 'low', text: `Only ${stock} left in stock · order soon` };
  return { level: 'ok', text: `In stock · ${stock} available` };
}

// Availability line under the price. On a fragrance page it describes the kit,
// because that's what the buttons buy.
export default function StockStatus({ stock, kitName }) {
  const { level, text } = stockState(stock);
  return (
    <p className={`pd-stock ${level}`} role="status">
      <span className="pd-stock-dot" aria-hidden="true" />
      {kitName ? `${kitName}: ${text.charAt(0).toLowerCase()}${text.slice(1)}` : text}
    </p>
  );
}

StockStatus.propTypes = {
  stock: PropTypes.number,
  kitName: PropTypes.string
};
