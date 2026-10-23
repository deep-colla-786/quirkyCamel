// Builds the storefront catalog from /api/products, merged with the built-in data
// (artwork, episode stories) for the kit and the six fragrances. Products added in the
// admin panel come only from the API. Until the API answers, the built-in data is used.
import { applyKitPricing } from '../data/episodes';
import { KIT, FRAGRANCES, KIT_SLUG } from '../data/products';
import { api } from './api';

const discount = (price, mrp) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const isBuyable = (p) => !!p && (p.type === 'kit' || p.type === 'product') && p.price > 0;
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

export function buildCatalog(apiProducts) {
  const out = [];
  const staticBySlug = Object.fromEntries([KIT, ...FRAGRANCES].map((p) => [p.slug, p]));
  for (const p of apiProducts) {
    const base = staticBySlug[p.slug];
    const text = {
      name: p.name || base?.name,
      tagline: p.tagline || base?.tagline || '',
      description: p.description || base?.description || ''
    };
    if (p.slug === KIT_SLUG) {
      applyKitPricing(p.price, p.mrp);
      out.push({ ...KIT, ...text, stock: p.stock ?? null });
    } else if (base) {
      out.push({ ...base, ...text });
    } else if (p.type === 'product') {
      out.push({
        slug: p.slug,
        type: 'product',
        eyebrow: 'Quirky Camel extra',
        ...text,
        price: p.price,
        mrp: p.mrp || p.price,
        discountPct: discount(p.price, p.mrp),
        stock: p.stock ?? null,
        image: p.image || null
      });
    }
  }
  // Keep a stable order: kit, fragrances by episode, then extras as added.
  const rank = (p) => {
    if (p.type === 'kit') return 0;
    if (p.type === 'fragrance') return p.episode.n;
    return 100;
  };
  return index(out.sort((a, b) => rank(a) - rank(b)));
}

export async function fetchCatalog() {
  const res = await api('/products');
  return res.ok && Array.isArray(res.data.products) ? buildCatalog(res.data.products) : null;
}
