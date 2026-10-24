// Rendered with key={slug}, so all local state resets when the product changes.
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Heart, Share2 } from 'lucide-react';
import { EPISODES, formatINR } from '../../data/episodes';
import { REVIEWS } from '../../data/products';
import { inStock, soldInKitOnly } from '../../lib/catalog';
import Gallery from './detail/Gallery';
import BuyPanel from './detail/BuyPanel';
import StockStatus from './detail/StockStatus';
import Tabs from './detail/Tabs';
import Reviews from './detail/Reviews';
import RelatedProducts from './detail/RelatedProducts';
import RecentlyViewed from './detail/RecentlyViewed';
import { buildTabs } from './detail/productTabs';
import { productShape, catalogShape } from '../../lib/propShapes';

// Per-type copy: page modifier class, breadcrumb label and the related-products heading.
const KIND_COPY = {
  kit: { pageClass: 'pd-is-kit', crumb: 'Kits', relatedTitle: 'The six fragrances inside' },
  extra: { pageClass: 'pd-is-extra', crumb: 'Extras', relatedTitle: 'You might also like' },
  frag: { pageClass: 'pd-is-frag', crumb: 'Fragrances', relatedTitle: 'Also in the kit' }
};

function productKind(product) {
  if (product.type === 'kit') return 'kit';
  if (product.type === 'product') return 'extra';
  return 'frag';
}

function relatedFor(kind, product, catalog) {
  if (kind === 'kit') return catalog.fragrances;
  if (kind === 'extra') return [catalog.kit, ...catalog.extras.filter((p) => p.slug !== product.slug)];
  return [catalog.kit, ...catalog.fragrances.filter((f) => f.slug !== product.slug)];
}

function priceNote(isKit, buysKit, target) {
  if (isKit) return `Inclusive of all taxes · about ${formatINR(Math.round(target.price / 6))} per fragrance`;
  if (buysKit) return 'Price of The Complete Kit · inclusive of all taxes';
  return 'Inclusive of all taxes';
}

// Kit: links to the six fragrances; fragrance: quick facts; extras show neither.
function renderHighlights(kind, product) {
  if (kind === 'extra') return null;
  if (kind === 'kit') {
    return (
      <div className="pd-swatch-row" aria-label="Fragrances included">
        {EPISODES.map((e) => (
          <a key={e.id} href={`#product/${e.id}`} style={{ background: e.pal.bg }} title={e.name}>
            <span className="sr">{e.name}</span>
          </a>
        ))}
        <span>6 fragrance sachets inside</span>
      </div>
    );
  }
  const ep = product.episode;
  return (
    <dl className="pd-facts">
      <div>
        <dt>Smells</dt>
        <dd>{ep.scentTags.join(' · ')}</dd>
      </div>
      <div>
        <dt>Mood</dt>
        <dd>{product.moods.join(' · ')}</dd>
      </div>
      <div>
        <dt>Wear it for</dt>
        <dd>{ep.occasions.slice(0, 3).join(' · ')}</dd>
      </div>
      {ep.audience && (
        <div>
          <dt>Made for</dt>
          <dd>{ep.audience}</dd>
        </div>
      )}
    </dl>
  );
}

export default function ProductDetail({
  product,
  catalog,
  saved,
  onToggleSaved,
  onAddToCart,
  onBuyNow,
  wishlist,
  recentlyViewed,
  showToast
}) {
  const isKit = product.type === 'kit';
  const ep = product.episode;
  const KIT = catalog.kit; // null if the kit is hidden in the admin panel
  // What the buttons actually buy: the product itself, or the kit for a fragrance page.
  const target = soldInKitOnly(product) ? KIT : product;
  const buysKit = target !== product;
  const available = !!target && inStock(target);
  const reviews = REVIEWS[product.slug] || [];
  const kind = productKind(product);
  const copy = KIND_COPY[kind];

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${product.name} · Quirky Camel`, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied');
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const tabs = useMemo(() => buildTabs(product), [product]);

  const related = relatedFor(kind, product, catalog).filter(Boolean);
  const recent = recentlyViewed
    .filter((s) => s !== product.slug)
    .map((s) => catalog.bySlug[s])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div
      className={`pd-page ${copy.pageClass}`}
      style={ep ? { '--pd-bg': ep.pal.bg, '--pd-soft': ep.pal.soft, '--pd-deep': ep.pal.deep } : undefined}
    >
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#top">Home</a>
          <span>/</span>
          <a href="#shop">Shop</a>
          <span>/</span>
          <span>{copy.crumb}</span>
          <span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd-main">
          <Gallery product={product} />

          <div className="pd-info">
            <div className="pd-top">
              <span className="pd-eyebrow">{product.eyebrow}</span>
              <div className="pd-icons">
                <button
                  className={`pd-icon ${saved ? 'on' : ''}`}
                  onClick={() => onToggleSaved(product.slug)}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from saved' : 'Save for later'}
                >
                  <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
                </button>
                <button className="pd-icon" onClick={share} aria-label="Share">
                  <Share2 size={19} />
                </button>
              </div>
            </div>
            <h1 className="pd-title">{product.name}</h1>
            {product.tagline && <p className="pd-tagline">{ep ? `“${product.tagline}”` : product.tagline}</p>}

            {target && (
              <>
                <div className="pd-price">
                  <b>{formatINR(target.price)}</b>
                  {target.mrp > target.price && <s>{formatINR(target.mrp)}</s>}
                  {target.discountPct > 0 && <span className="pd-save">Save {target.discountPct}%</span>}
                  {!available && <span className="pd-out">Out of stock</span>}
                </div>
                <p className="pd-price-note">{priceNote(isKit, buysKit, target)}</p>
                <StockStatus stock={target.stock} kitName={buysKit ? target.name : undefined} />
              </>
            )}

            {renderHighlights(kind, product)}

            <BuyPanel
              product={product}
              kit={KIT}
              target={target}
              available={available}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
            />
          </div>
        </div>

        <Tabs tabs={tabs} />

        <Reviews reviews={reviews} />

        <RelatedProducts
          title={copy.relatedTitle}
          products={related}
          wishlist={wishlist}
          onToggleSaved={onToggleSaved}
          onAddToCart={onAddToCart}
        />

        {recent.length > 0 && <RecentlyViewed products={recent} />}
      </div>
    </div>
  );
}

ProductDetail.propTypes = {
  product: productShape.isRequired,
  catalog: catalogShape.isRequired,
  saved: PropTypes.bool.isRequired,
  onToggleSaved: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
  wishlist: PropTypes.arrayOf(PropTypes.string).isRequired,
  recentlyViewed: PropTypes.arrayOf(PropTypes.string).isRequired,
  showToast: PropTypes.func.isRequired
};
