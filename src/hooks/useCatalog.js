import { useState, useEffect, useCallback } from 'react';
import { initialCatalog, fetchCatalog } from '../lib/catalog';

// Product catalog: starts from the copy embedded in the page (or the last one seen), then
// loads live data (prices, stock) from the API.
export default function useCatalog() {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const loadCatalog = useCallback(() => {
    fetchCatalog().then((c) => {
      if (c) setCatalog(c);
      setCatalogLoaded(true);
    });
  }, []);
  useEffect(loadCatalog, [loadCatalog]);

  return { catalog, catalogLoaded, loadCatalog };
}
