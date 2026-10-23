import React from 'react';
import PropTypes from 'prop-types';
import { productShape } from '../../../lib/propShapes';

export default function RecentlyViewed({ products }) {
  return (
    <section className="pd-related">
      <h2>Recently viewed</h2>
      <div className="recent-row">
        {products.map((p) => (
          <a key={p.slug} href={`#product/${p.slug}`} className="recent-item">
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
  products: PropTypes.arrayOf(productShape).isRequired
};
