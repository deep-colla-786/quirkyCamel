import React from 'react';
import PropTypes from 'prop-types';
import { Heart, ShoppingBag } from 'lucide-react';
import { EPISODES, formatINR } from '../../data/episodes';
import { KIT, productHash } from '../../data/products';
import { inStock, soldInKitOnly } from '../../lib/catalog';
import { productArt } from './productArt';
import { productShape } from '../../lib/propShapes';

// Image for products added in the admin panel (no generated artwork).
export function ProductImage({ product, className = '' }) {
  return (
    <div className={`pc-photo ${className}`}>
      {product.image ? <img src={product.image} alt="" loading="lazy" /> : <span className="icon" />}
    </div>
  );
}

ProductImage.propTypes = {
  product: productShape.isRequired,
  className: PropTypes.string
};

// Corner badge: stock / discount for anything sold on its own, else the episode number.
function cardBadge(product, available) {
  if (soldInKitOnly(product)) return `Episode 0${product.episode.n}`;
  if (!available) return 'Out of stock';
  if (product.discountPct > 0) return `Save ${product.discountPct}%`;
  if (product.type === 'product') return 'Extra';
  return product.episode ? `Episode 0${product.episode.n}` : null;
}

export default function ProductCard({ product, featured = false, saved, onToggleSaved, onAddToCart }) {
  const isKit = product.type === 'kit';
  const isExtra = product.type === 'product';
  const ep = product.episode;
  const href = productHash(product.slug);
  const available = inStock(product);

  const badge = cardBadge(product, available);

  return (
    <article
      className={`pc ${featured ? 'pc-featured' : ''} ${isKit ? 'pc-kit' : ''} ${isExtra ? 'pc-extra' : ''}`}
      style={ep ? { '--pc-bg': ep.pal.bg, '--pc-deep': ep.pal.deep, '--pc-soft': ep.pal.soft } : undefined}
    >
      <a className="pc-media" href={href} aria-label={`View ${product.name}`}>
        {isExtra ? (
          <ProductImage product={product} className="pc-art" />
        ) : (
          <>
            <div className="pc-art" dangerouslySetInnerHTML={{ __html: productArt(product) }} />
            <div className="pc-art pc-art-alt" aria-hidden="true">
              <div className="pc-alt-sachet" dangerouslySetInnerHTML={{ __html: productArt(product, 'alt') }} />
            </div>
          </>
        )}
        {badge && <span className={`pc-badge ${available ? '' : 'is-out'}`}>{badge}</span>}
      </a>

      <button
        className={`pc-save ${saved ? 'on' : ''}`}
        onClick={() => onToggleSaved(product.slug)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
      >
        <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="pc-body">
        <span className="pc-eyebrow">{product.eyebrow}</span>
        <h3 className="pc-name">
          <a href={href}>{product.name}</a>
        </h3>
        {product.tagline && <p className="pc-tagline">{ep ? `“${product.tagline}”` : product.tagline}</p>}

        {isKit && (
          <div className="pc-swatches" aria-label="Fragrances included">
            {EPISODES.map((e) => (
              <i key={e.id} style={{ background: e.pal.bg }} title={e.name} />
            ))}
            <span>All 6 fragrances</span>
          </div>
        )}
        {ep && (
          <div className="pc-tags">
            {ep.scentTags.slice(0, 3).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}

        <div className="pc-foot">
          {soldInKitOnly(product) ? (
            <>
              <div className="pc-price pc-price-incl">
                <small>In the Complete Kit</small>
                <b>{formatINR(KIT.price)}</b>
              </div>
              <a className="btn ghost-dark pc-cta" href={href}>
                View details
              </a>
            </>
          ) : (
            <>
              <div className="pc-price">
                <b>{formatINR(product.price)}</b>
                {product.mrp > product.price && <s>{formatINR(product.mrp)}</s>}
              </div>
              <button
                className="btn blue pc-cta"
                onClick={() => onAddToCart(1, { slug: product.slug })}
                disabled={!available}
              >
                <ShoppingBag size={16} /> {available ? 'Add to cart' : 'Sold out'}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  product: productShape.isRequired,
  featured: PropTypes.bool,
  saved: PropTypes.bool.isRequired,
  onToggleSaved: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired
};
