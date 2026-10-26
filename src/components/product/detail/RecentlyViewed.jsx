import React from 'react';
import PropTypes from 'prop-types';
import { productShape } from '../../../lib/propShapes';
import { productPath } from '../../../data/products';

// Shared by the product page and the shop page (which passes its own section class).

export default function RecentlyViewed({ products, className = 'pd-related' }) {
  return (
    <section className={className}>
      <h2>Recently viewed</h2>
      <div className="recent-row">
        {products.map((p) => (
          <a key={p.slug} href={productPath(p.slug)} className="recent-item">
            <span className="recent-swatch" style={{ background: p.episode ? p.episode.pal.bg : 'var(--blue)' }}>
              <span className="icon" />
            </span>
            <span>{p.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

RecentlyViewed.propTypes = {
  products: PropTypes.arrayOf(productShape).isRequired,
  className: PropTypes.string
};
