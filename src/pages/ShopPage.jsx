import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, X, ShieldCheck, Gift, Package, Truck, Heart } from 'lucide-react';
import { ROUTES } from '../data/episodes';
import { STORE_POLICY } from '../data/products';
import ProductCard from '../components/product/ProductCard';

const SORTS = {
  featured: { label: 'Featured', fn: (a, b) => a.episode.n - b.episode.n },
  az: { label: 'Name: A to Z', fn: (a, b) => a.name.localeCompare(b.name) },
  za: { label: 'Name: Z to A', fn: (a, b) => b.name.localeCompare(a.name) }
};
const GROUPS = ['mood', 'occ', 'scent'];
const emptyFilters = () => ({ mood: [], occ: [], scent: [] });

export default function ShopPage({ catalog, savedOnly, wishlist, onToggleSaved, onAddToCart, recentlyViewed }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { kit: KIT, fragrances: FRAGRANCES, extras, bySlug } = catalog;
  const activeCount = GROUPS.reduce((n, g) => n + filters[g].length, 0);

  // Within a group values are OR-ed; across groups they're AND-ed.
  const matches = (p, f = filters) =>
    GROUPS.every((g) => !f[g].length || f[g].some((k) => p.episode.f[g].includes(k)));

  const fragrances = useMemo(() => {
    let list = FRAGRANCES.filter((p) => matches(p));
    if (savedOnly) list = list.filter((p) => wishlist.includes(p.slug));
    return [...list].sort(SORTS[sort].fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, savedOnly, wishlist, FRAGRANCES]);

  const showKit = !!KIT && (!savedOnly || wishlist.includes(KIT.slug));
  // Extras (added in the admin panel) aren't fragrances, so the scent filters don't apply.
  const shownExtras = [...(savedOnly ? extras.filter((p) => wishlist.includes(p.slug)) : extras)].sort(
    sort === 'featured' ? () => 0 : (a, b) => (sort === 'za' ? -1 : 1) * a.name.localeCompare(b.name)
  );
  const total = fragrances.length + (showKit ? 1 : 0) + shownExtras.length;

  const toggle = (group, key) =>
    setFilters((f) => ({
      ...f,
      [group]: f[group].includes(key) ? f[group].filter((k) => k !== key) : [...f[group], key]
    }));

  const recent = recentlyViewed.map((s) => bySlug[s]).filter(Boolean).slice(0, 4);

  return (
    <div className="shop-page">
      <section className="shop-hero squig">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="#top">Home</a>
            <span>/</span>
            {savedOnly ? (
              <>
                <a href="#shop">Shop</a>
                <span>/</span>
                <span aria-current="page">Saved</span>
              </>
            ) : (
              <span aria-current="page">Shop</span>
            )}
          </nav>
          <h1 className="bubble b-lime">{savedOnly ? 'Your saved camels' : 'Shop the camel'}</h1>
          <p>
            {savedOnly
              ? 'Everything you’ve hearted, in one place.'
              : 'Six fragrance episodes, sealed in pocket-sized attar sachets, plus the extras to carry them. The fragrances come together in one box: the Complete Kit.'}
          </p>
          <div className="shop-tabs" role="tablist" aria-label="Shop view">
            <a role="tab" aria-selected={!savedOnly} href="#shop">
              All products
            </a>
            <a role="tab" aria-selected={savedOnly} href="#shop/saved">
              <Heart size={15} fill={savedOnly ? 'currentColor' : 'none'} /> Saved ({wishlist.length})
            </a>
          </div>
        </div>
      </section>

      <div className="wrap shop-layout">
        <aside className={`shop-filters ${filtersOpen ? 'open' : ''}`} aria-label="Filters">
          <div className="sf-head">
            <b>Filter fragrances</b>
            {activeCount > 0 && (
              <button className="sf-clear" onClick={() => setFilters(emptyFilters())}>
                Clear all
              </button>
            )}
            <button className="sf-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X size={20} />
            </button>
          </div>
          {GROUPS.map((g) => (
            <fieldset key={g} className="sf-group">
              <legend>{ROUTES[g].label.replace('By ', '')}</legend>
              {ROUTES[g].opts.map(([key, label]) => {
                const count = FRAGRANCES.filter((p) => p.episode.f[g].includes(key)).length;
                return (
                  <label key={key} className={`sf-opt ${count ? '' : 'off'}`}>
                    <input
                      type="checkbox"
                      checked={filters[g].includes(key)}
                      disabled={!count}
                      onChange={() => toggle(g, key)}
                    />
                    <span>{label}</span>
                    <em>{count}</em>
                  </label>
                );
              })}
            </fieldset>
          ))}
          <button className="btn blue wide sf-apply" onClick={() => setFiltersOpen(false)}>
            Show {total} {total === 1 ? 'product' : 'products'}
          </button>
        </aside>
        {filtersOpen && <div className="sf-scrim" onClick={() => setFiltersOpen(false)} />}

        <div className="shop-main">
          <div className="shop-toolbar">
            <button className="sf-toggle" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} /> Filters{activeCount ? ` (${activeCount})` : ''}
            </button>
            <span className="shop-count">
              <b>{total}</b> {total === 1 ? 'product' : 'products'}
            </span>
            <label className="shop-sort">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeCount > 0 && (
            <div className="shop-active">
              {GROUPS.flatMap((g) =>
                filters[g].map((k) => (
                  <button key={g + k} onClick={() => toggle(g, k)}>
                    {Object.fromEntries(ROUTES[g].opts)[k]} <X size={13} />
                  </button>
                ))
              )}
            </div>
          )}

          <div className="shop-grid">
            {showKit && (
              <ProductCard
                product={KIT}
                featured
                saved={wishlist.includes(KIT.slug)}
                onToggleSaved={onToggleSaved}
                onAddToCart={onAddToCart}
              />
            )}
            {[...fragrances, ...shownExtras].map((p) => (
              <ProductCard
                key={p.slug}
                product={p}
                saved={wishlist.includes(p.slug)}
                onToggleSaved={onToggleSaved}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>

          {total === 0 || (!fragrances.length && activeCount > 0) ? (
            <div className="shop-empty">
              <span className="icon" />
              {savedOnly && !wishlist.length ? (
                <>
                  <b>Nothing saved yet.</b>
                  <p>Tap the heart on any product to keep it here.</p>
                  <a className="btn blue" href="#shop">Browse the shop</a>
                </>
              ) : (
                <>
                  <b>No fragrance matches those filters.</b>
                  <p>Try removing a filter. Every fragrance is in the Complete Kit anyway.</p>
                  <button className="btn blue" onClick={() => setFilters(emptyFilters())}>
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : null}

          <ul className="shop-assure">
            <li>
              <ShieldCheck size={22} />
              <span><b>Secure checkout</b>{STORE_POLICY.payments}</span>
            </li>
            <li>
              <Truck size={22} />
              <span><b>{STORE_POLICY.freeShipping ? 'Free shipping' : 'Shipping'}</b>{STORE_POLICY.dispatch}</span>
            </li>
            <li>
              <Package size={22} />
              <span><b>Sealed sachets</b>No glass, no spills, pocket-sized</span>
            </li>
            <li>
              <Gift size={22} />
              <span><b>Gift-ready</b>Collector box with an optional gift note</span>
            </li>
          </ul>

          {recent.length > 0 && !savedOnly && (
            <section className="shop-recent">
              <h2>Recently viewed</h2>
              <div className="recent-row">
                {recent.map((p) => (
                  <a key={p.slug} href={`#product/${p.slug}`} className="recent-item">
                    <span
                      className="recent-swatch"
                      style={{ background: p.episode ? p.episode.pal.bg : 'var(--blue)' }}
                    >
                      <span className="icon" />
                    </span>
                    <span>{p.name}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
