import { useState, useCallback } from 'react';
import { readStore, useStoredState } from '../lib/storage';

// Wishlist ("saved") and recently viewed products, persisted per browser.
export default function useSavedItems({ catalog, showToast }) {
  const [wishlist, setWishlist] = useState(() => readStore('qc-wishlist', []));
  const [recentlyViewed, setRecentlyViewed] = useState(() => readStore('qc-recent', []));

  useStoredState('qc-wishlist', wishlist, setWishlist, []);
  useStoredState('qc-recent', recentlyViewed, setRecentlyViewed, []);

  const toggleWishlist = (slug) => {
    const adding = !wishlist.includes(slug);
    setWishlist((w) => (adding ? [...w, slug] : w.filter((s) => s !== slug)));
    showToast(adding ? `Saved ${catalog.bySlug[slug]?.name || 'item'}` : 'Removed from saved');
  };

  // Called by the router whenever a product page opens.
  const markViewed = useCallback(
    (slug) => setRecentlyViewed((r) => [slug, ...r.filter((x) => x !== slug)].slice(0, 8)),
    []
  );

  return { wishlist, setWishlist, toggleWishlist, recentlyViewed, markViewed };
}
