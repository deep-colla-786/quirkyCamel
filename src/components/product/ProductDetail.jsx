// Rendered with key={slug}, so all local state resets when the product changes.
import React, { useMemo } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { EPISODES, formatINR } from '../../data/episodes';
import { REVIEWS } from '../../data/products';
import { inStock } from '../../lib/catalog';
import Gallery from './detail/Gallery';
import BuyPanel from './detail/BuyPanel';
import Tabs from './detail/Tabs';
import Reviews from './detail/Reviews';
import RelatedProducts from './detail/RelatedProducts';
import RecentlyViewed from './detail/RecentlyViewed';
import { buildTabs } from './detail/productTabs';

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
  const isExtra = product.type === 'product';
  const ep = product.episode;
  const KIT = catalog.kit; // null if the kit is hidden in the admin panel
  // What the buttons actually buy: the product itself, or the kit for a fragrance page.
  const target = ep ? KIT : product;
  const available = !!target && inStock(target);
  const reviews = REVIEWS[product.slug] || [];

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabs = useMemo(() => buildTabs(product), [isKit, isExtra, ep]);

  const related = (
    isKit
      ? catalog.fragrances
      : isExtra
        ? [KIT, ...catalog.extras.filter((p) => p.slug !== product.slug)]
        : [KIT, ...catalog.fragrances.filter((f) => f.slug !== product.slug)]
  ).filter(Boolean);
  const recent = recentlyViewed
    .filter((s) => s !== product.slug)
    .map((s) => catalog.bySlug[s])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div
      className={`pd-page ${isKit ? 'pd-is-kit' : isExtra ? 'pd-is-extra' : 'pd-is-frag'}`}
      style={ep ? { '--pd-bg': ep.pal.bg, '--pd-soft': ep.pal.soft, '--pd-deep': ep.pal.deep } : undefined}
    >
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#top">Home</a>
          <span>/</span>
          <a href="#shop">Shop</a>
          <span>/</span>
          <span>{isKit ? 'Kits' : isExtra ? 'Extras' : 'Fragrances'}</span>
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
                <p className="pd-price-note">
                  {isKit
                    ? `Inclusive of all taxes · about ${formatINR(Math.round(target.price / 6))} per fragrance`
                    : ep
                      ? 'Price of The Complete Kit · inclusive of all taxes'
                      : 'Inclusive of all taxes'}
                </p>
              </>
            )}

            {isExtra ? null : isKit ? (
              <div className="pd-swatch-row" aria-label="Fragrances included">
                {EPISODES.map((e) => (
                  <a key={e.id} href={`#product/${e.id}`} style={{ background: e.pal.bg }} title={e.name}>
                    <span className="sr">{e.name}</span>
                  </a>
                ))}
                <span>6 fragrance sachets inside</span>
              </div>
            ) : (
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
            )}

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
          title={isKit ? 'The six fragrances inside' : isExtra ? 'You might also like' : 'Also in the kit'}
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
