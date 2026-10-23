import { useState, useEffect, useCallback } from 'react';
import { readStore, writeStore } from '../lib/storage';

// Wishlist ("saved") and recently viewed products, persisted per browser.
export default function useSavedItems({ catalog, showToast }) {
  const [wishlist, setWishlist] = useState(() => readStore('qc-wishlist', []));
  const [recentlyViewed, setRecentlyViewed] = useState(() => readStore('qc-recent', []));

  useEffect(() => writeStore('qc-wishlist', wishlist), [wishlist]);
  useEffect(() => writeStore('qc-recent', recentlyViewed), [recentlyViewed]);

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

  return { wishlist, toggleWishlist, recentlyViewed, markViewed };
}
