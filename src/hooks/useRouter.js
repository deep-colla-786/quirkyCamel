import { useState, useEffect, useCallback } from 'react';
import { matchPath, legacyHashTarget, paths } from '../lib/routes';
import { KIT_SLUG } from '../data/products';

const NAVIGATE_EVENT = 'qc:navigate';
const SKIP_PREFIX_RE = /^\/(?:admin|api|uploads)(?:\/|$)/;

// Moves to a store address ('/shop', '/product/x', '/#kit') without reloading the page.
export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, globalThis.location.href);
  const target = url.pathname + url.search + url.hash;
  const current = globalThis.location.pathname + globalThis.location.search + globalThis.location.hash;
  if (target !== current) globalThis.history[replace ? 'replaceState' : 'pushState']({}, '', target);
  globalThis.dispatchEvent(new Event(NAVIGATE_EVENT));
}

function scrollToSection(id) {
  // Wait for the home view to render before scrolling to the section.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))
  );
}

// Same-origin links (<a href="/shop">) become client-side navigations.
function interceptLinks(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = new URL(a.href, globalThis.location.href);
  if (url.origin !== globalThis.location.origin || SKIP_PREFIX_RE.test(url.pathname)) return;
  e.preventDefault();
  navigate(url.pathname + url.search + url.hash);
}

// Store router. Pages: / (home, with #section anchors), /shop, /shop/saved,
// /product/<slug>, /episodes/<id>, /account, /track/<order-id>, /reset/<token>,
// /shipping, /refunds, /privacy, /terms, /contact. Old #-style links are redirected.
export default function useRouter({ onViewProduct }) {
  const [location, setLocation] = useState(() => ({ ...matchPath(globalThis.location.pathname), key: 0 }));

  const route = useCallback(() => {
    const legacy = legacyHashTarget(globalThis.location.hash);
    if (legacy) {
      globalThis.history.replaceState({}, '', legacy);
    }
    const match = matchPath(globalThis.location.pathname);
    setLocation((prev) => ({ ...match, key: prev.key + 1 }));
    if (match.view === 'product') onViewProduct(match.slug);
    const section = globalThis.location.hash.slice(1);
    if (match.view === 'home' && section && section !== 'top') scrollToSection(section);
    else globalThis.scrollTo({ top: 0, behavior: 'instant' });
  }, [onViewProduct]);

  useEffect(() => {
    globalThis.addEventListener('popstate', route);
    globalThis.addEventListener('hashchange', route);
    globalThis.addEventListener(NAVIGATE_EVENT, route);
    document.addEventListener('click', interceptLinks);
    route();
    return () => {
      globalThis.removeEventListener('popstate', route);
      globalThis.removeEventListener('hashchange', route);
      globalThis.removeEventListener(NAVIGATE_EVENT, route);
      document.removeEventListener('click', interceptLinks);
    };
  }, [route]);

  const goTo = useCallback((to) => navigate(to), []);

  // Kept for components that navigate by view name.
  const handleNavigate = useCallback((view, targetId = null) => {
    if (view === 'product-kit') navigate(paths.product(KIT_SLUG));
    else if (view === 'shop') navigate(paths.shop);
    else navigate(targetId ? paths.section(targetId) : paths.home);
  }, []);

  return {
    currentView: location.view,
    productSlug: location.slug || KIT_SLUG,
    shopSaved: Boolean(location.saved),
    activeEpisodeId: location.episodeId || 'trouble-in-oasis',
    trackOrderId: location.orderId || '',
    resetToken: location.token || '',
    infoPage: location.page || '',
    goTo,
    handleNavigate
  };
}
