import React from 'react';
import ProductCard from '../ProductCard';

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
