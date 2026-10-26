import { EPISODES } from '../../data/episodes';
import { SCENES, kitSVG, sachetSVG } from '../../utils/svgGenerators';

// Artwork is generated SVG markup; memoised per product so re-renders are cheap.
const artCache = new Map();
export function productArt(product, variant = 'main') {
  const key = `${product.slug}:${variant}`;
  if (!artCache.has(key)) {
    let html;
    if (product.type === 'kit') html = variant === 'alt' ? sachetSVG(EPISODES[0], {}, `card-${key}`) : kitSVG(EPISODES, `card-${key}`);
    else html = variant === 'alt' ? sachetSVG(product.episode, {}, `card-${key}`) : SCENES[product.slug](`card-${key}`);
    artCache.set(key, html);
  }
  return artCache.get(key);
}
