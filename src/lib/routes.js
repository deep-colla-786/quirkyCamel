// Every store address in one place. Pages use normal paths (/shop, /product/<slug>), so
// search engines and share previews see each one; sections of the home page keep their
// #anchors (/#kit). Shared by the browser router and the server (titles, 404s, sitemap),
// so it must not touch browser globals.
import { EPISODES_BY_ID } from '../data/episodes.js';

export const paths = {
  home: '/',
  shop: '/shop',
  saved: '/shop/saved',
  product: (slug) => `/product/${encodeURIComponent(slug)}`,
  episode: (id) => `/episodes/${encodeURIComponent(id)}`,
  account: '/account',
  track: (orderId) => `/track/${encodeURIComponent(orderId)}`,
  reset: (token) => `/reset/${encodeURIComponent(token)}`,
  section: (id) => `/#${id}`,
  privacy: '/privacy',
  terms: '/terms',
  refunds: '/refunds',
  shipping: '/shipping',
  contact: '/contact'
};

// Information pages (policies + contact), in footer order.
export const INFO_PAGES = ['shipping', 'refunds', 'privacy', 'terms', 'contact'];

function decodePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// What a path shows: { view, ...params }. Unknown paths are { view: 'notfound' }.
export function matchPath(pathname) {
  let clean = String(pathname || '/');
  while (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
  if (clean === '/') return { view: 'home' };
  if (clean === '/shop') return { view: 'shop', saved: false };
  if (clean === '/shop/saved') return { view: 'shop', saved: true };
  if (clean === '/account') return { view: 'account' };
  const page = clean.slice(1);
  if (INFO_PAGES.includes(page)) return { view: 'info', page };
  const [, kind, raw, extra] = clean.split('/');
  const value = raw ? decodePart(raw) : null;
  if (!value || extra !== undefined) return { view: 'notfound' };
  if (kind === 'product') return { view: 'product', slug: value };
  if (kind === 'episodes' && EPISODES_BY_ID[value]) return { view: 'episode', episodeId: value };
  if (kind === 'track') return { view: 'track', orderId: value };
  if (kind === 'reset') return { view: 'reset', token: value };
  return { view: 'notfound' };
}

// Old #-style addresses (#product/x, #shop, #<episode-id> …) and where they live now.
// Section anchors such as #kit are not legacy and return null.
export function legacyHashTarget(hash) {
  const h = decodePart(String(hash || '').replace(/^#/, '')) ?? '';
  if (h === 'top') return paths.home;
  if (h === 'shop' || h === 'shop/saved' || h === 'account') return `/${h}`;
  if (h === 'product-kit' || h === 'kit-details') return paths.product('the-complete-kit');
  const [kind, value] = h.split('/');
  if (value && ['product', 'track', 'reset'].includes(kind)) return `/${kind}/${encodeURIComponent(value)}`;
  if (EPISODES_BY_ID[h]) return paths.episode(h);
  return null;
}
