import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { pageMeta } from '../../lib/pageMeta';
import { catalogShape, episodeShape } from '../../lib/propShapes';

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, name] = /\[(name|property)="([^"]+)"\]/.exec(selector);
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

// Keeps the tab title, description and share tags in step with the page being viewed.
export default function PageMeta({ view, catalog, productSlug, episode, infoPage }) {
  const product = view === 'product' ? catalog.bySlug[productSlug] : null;
  const { title, description, noindex } = pageMeta({ view, product, episode, page: infoPage });
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex' : 'index, follow');
  }, [title, description, noindex]);
  return null;
}

PageMeta.propTypes = {
  view: PropTypes.string.isRequired,
  catalog: catalogShape.isRequired,
  productSlug: PropTypes.string,
  episode: episodeShape,
  infoPage: PropTypes.string
};
