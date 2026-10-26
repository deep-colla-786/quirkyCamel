// Title and description for each page, used by the browser (document.title) and by the
// server (so search engines and share previews see them without running JavaScript).
import { POLICIES } from '../data/policies.js';

const SITE = 'Quirky Camel';
const DEFAULT_DESCRIPTION =
  'Six fragrances, six strange little worlds, each sealed in a pocket-sized attar sachet. Explore the episodes and take the whole collection home in the complete kit.';

const clip = (text, max = 160) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

// { view, product?, episode?, page? } -> { title, description, noindex }
export function pageMeta({ view, product, episode, page }) {
  switch (view) {
    case 'home':
      return { title: `${SITE} — Attar, Reimagined`, description: DEFAULT_DESCRIPTION };
    case 'shop':
      return { title: `Shop all fragrances · ${SITE}`, description: 'The Complete Kit with all six attar sachets, plus extras. Free shipping across India.' };
    case 'product':
      return product
        ? { title: `${product.name} · ${SITE}`, description: clip(product.description || product.tagline || DEFAULT_DESCRIPTION) }
        : { title: `Product not found · ${SITE}`, description: DEFAULT_DESCRIPTION, noindex: true };
    case 'episode':
      return { title: `${episode.name} · Episode 0${episode.n} · ${SITE}`, description: clip(`${episode.headline} ${episode.body}`) };
    case 'info':
      return { title: `${POLICIES[page].title} · ${SITE}`, description: POLICIES[page].description };
    case 'account':
      return { title: `Your account · ${SITE}`, description: DEFAULT_DESCRIPTION, noindex: true };
    case 'track':
      return { title: `Track your order · ${SITE}`, description: DEFAULT_DESCRIPTION, noindex: true };
    case 'reset':
      return { title: `Reset your password · ${SITE}`, description: DEFAULT_DESCRIPTION, noindex: true };
    default:
      return { title: `Page not found · ${SITE}`, description: DEFAULT_DESCRIPTION, noindex: true };
  }
}
