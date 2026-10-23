import React from 'react';
import ProductDetail from '../components/product/ProductDetail';

// #product/<slug>: the product detail view, or a not-found / loading message.
export default function ProductPage({ slug, catalog, catalogLoaded, wishlist, ...detailProps }) {
  const product = catalog.bySlug[slug];

  if (!product) {
    return (
      <div className="pd-missing wrap">
        {catalogLoaded ? (
          <>
            <h1>Product not found</h1>
            <p>It may have been removed or is no longer available.</p>
            <a className="btn blue" href="#shop">Back to the shop</a>
          </>
        ) : (
          <p>Loading…</p>
        )}
      </div>
    );
  }

  return (
    <ProductDetail
      key={slug}
      product={product}
      catalog={catalog}
      saved={wishlist.includes(slug)}
      wishlist={wishlist}
      {...detailProps}
    />
  );
}
