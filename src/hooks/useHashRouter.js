import { useState, useEffect, useCallback } from 'react';
import { EPISODES_BY_ID } from '../data/episodes';
import { KIT_SLUG, productHash } from '../data/products';

// Hash router. Routes: #top, #shop, #shop/saved, #product/<slug>, #account, #track/<order-id>,
// #<episode-id>, and #<section-id> for sections on the home page.
export default function useHashRouter({ onViewProduct }) {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'episode' | 'shop' | 'product' | 'account' | 'track'
  const [productSlug, setProductSlug] = useState(KIT_SLUG);
  const [shopSaved, setShopSaved] = useState(false);
  const [activeEpisodeId, setActiveEpisodeId] = useState('trouble-in-oasis');
  const [trackOrderId, setTrackOrderId] = useState('');

  const route = useCallback(() => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

    if (hash === 'product-kit' || hash === 'kit-details') {
      window.location.replace(productHash(KIT_SLUG));
      return;
    }
    if (hash.startsWith('product/')) {
      const slug = hash.slice('product/'.length);
      setProductSlug(slug);
      setCurrentView('product');
      onViewProduct(slug);
      toTop();
    } else if (hash.startsWith('track/')) {
      setTrackOrderId(hash.slice('track/'.length));
      setCurrentView('track');
      toTop();
    } else if (hash === 'account') {
      setCurrentView('account');
      toTop();
    } else if (hash === 'shop' || hash === 'shop/saved') {
      setShopSaved(hash === 'shop/saved');
      setCurrentView('shop');
      toTop();
    } else if (EPISODES_BY_ID[hash]) {
      setActiveEpisodeId(hash);
      setCurrentView('episode');
      toTop();
    } else {
      setCurrentView('home');
      if (!hash || hash === 'top') {
        toTop();
      } else {
        // Wait for the home view to render before scrolling to the section
        requestAnimationFrame(() =>
          requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }))
        );
      }
    }
  }, [onViewProduct]);

  useEffect(() => {
    window.addEventListener('hashchange', route);
    route();
    return () => window.removeEventListener('hashchange', route);
  }, [route]);

  const goTo = (hash) => {
    if (window.location.hash === hash) route();
    else window.location.hash = hash;
  };

  // Kept for components that navigate by view name.
  const handleNavigate = (view, targetId = null) => {
    if (view === 'product-kit') goTo(productHash(KIT_SLUG));
    else if (view === 'shop') goTo('#shop');
    else goTo(targetId ? `#${targetId}` : '#top');
  };

  return { currentView, productSlug, shopSaved, activeEpisodeId, trackOrderId, goTo, handleNavigate };
}
