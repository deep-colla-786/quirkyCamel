import React from 'react';
import PropTypes from 'prop-types';
import ProductCard from '../ProductCard';
import { productShape } from '../../../lib/propShapes';

export default function RelatedProducts({ title, products, wishlist, onToggleSaved, onAddToCart }) {
  return (
    <section className="pd-related">
      <h2>{title}</h2>
      <div className="pd-related-grid">
        {products.map((p) => (
          <ProductCard
            key={p.slug}
            product={p}
            saved={wishlist.includes(p.slug)}
            onToggleSaved={onToggleSaved}
            onAddToCart={(q) => onAddToCart(q)}
          />
        ))}
      </div>
    </section>
  );
}

RelatedProducts.propTypes = {
  title: PropTypes.string.isRequired,
  products: PropTypes.arrayOf(productShape).isRequired,
  wishlist: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSaved: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired
};
