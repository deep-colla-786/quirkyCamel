// Builds the storefront catalog from /api/products, merged with the built-in data
// (artwork, episode stories) for the kit and the six fragrances. Products added in the
// admin panel come only from the API. Until the API answers, the built-in data is used.
import { applyKitPricing } from '../data/episodes';
import { KIT, FRAGRANCES, KIT_SLUG } from '../data/products';
import { api } from './api';

const discount = (price, mrp) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

// Any product with a price can be bought; a fragrance without one is sold only in the kit.
export const isBuyable = (p) => !!p && p.price > 0;
export const soldInKitOnly = (p) => p.type === 'fragrance' && !isBuyable(p);
export const inStock = (p) => !!p && (p.stock === null || p.stock === undefined || p.stock > 0);

function index(products) {
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  return {
    products,
    bySlug,
    kit: bySlug[KIT_SLUG] || null,
    fragrances: products.filter((p) => p.type === 'fragrance'),
    extras: products.filter((p) => p.type === 'product')
  };
}

export const STATIC_CATALOG = index([{ ...KIT }, ...FRAGRANCES]);

// Dashboard-edited details; anything not set falls back to `base` (the built-in copy).
function details(p, base) {
  return {
    name: p.name || base?.name,
    eyebrow: p.eyebrow || base?.eyebrow || '',
    tagline: p.tagline || base?.tagline || '',
    description: p.description || base?.description || '',
    // The API sends { title, detail } rows; the product page renders [title, detail] pairs.
    inside: p.inside ? p.inside.map((r) => [r.title, r.detail]) : base?.inside,
    specs: p.specs || base?.specs
  };
}

function kitProduct(p) {
  applyKitPricing(p.price, p.mrp);
  return { ...KIT, ...details(p, KIT), packs: p.packs || KIT.packs, stock: p.stock ?? null, image: p.image || null };
}

// A fragrance's scent overrides apply to its product page; the episode story pages
// keep the built-in copy.
function fragranceProduct(p, base) {
  const episode = { ...base.episode, scent: p.scent || base.episode.scent, scentTags: p.scentTags || base.episode.scentTags };
  return { ...base, ...details(p, base), episode, ...pricing(p), image: p.image || null };
}

// Price fields from the dashboard (a fragrance without a price has price null).
function pricing(p) {
  return { price: p.price ?? null, mrp: p.mrp || p.price, discountPct: discount(p.price, p.mrp), stock: p.stock ?? null };
}

function extraProduct(p) {
  return {
    slug: p.slug,
    type: 'product',
    ...details(p, { eyebrow: 'Quirky Camel extra' }),
    ...pricing(p),
    image: p.image || null
  };
}

function toProduct(p, base) {
  if (p.slug === KIT_SLUG) return kitProduct(p);
  if (base) return fragranceProduct(p, base);
  return p.type === 'product' ? extraProduct(p) : null;
}

export function buildCatalog(apiProducts) {
  const staticBySlug = Object.fromEntries(FRAGRANCES.map((p) => [p.slug, p]));
  const out = apiProducts.map((p) => toProduct(p, staticBySlug[p.slug])).filter(Boolean);
  // Keep a stable order: kit, fragrances by episode, then extras as added.
  const rank = (p) => {
    if (p.type === 'kit') return 0;
    if (p.type === 'fragrance') return p.episode.n;
    return 100;
  };
  return index(out.sort((a, b) => rank(a) - rank(b)));
}

const CACHE_KEY = 'qc-catalog';

// The catalog to show before the API answers, so prices never flash the built-in
// values: the copy the server put in the page, else the last one this browser saw.
export function initialCatalog() {
  try {
    const embedded = document.getElementById('qc-catalog')?.textContent;
    const products = embedded ? JSON.parse(embedded) : JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (Array.isArray(products) && products.length) return buildCatalog(products);
  } catch {
    // unreadable copy: fall back to the built-in catalog
  }
  return STATIC_CATALOG;
}

export async function fetchCatalog() {
  const res = await api('/products');
  if (!res.ok || !Array.isArray(res.data.products)) return null;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(res.data.products));
  } catch {
    // storage unavailable (private mode): nothing to cache
  }
  return buildCatalog(res.data.products);
}
