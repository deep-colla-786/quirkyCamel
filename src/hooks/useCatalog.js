import { useState, useEffect, useCallback } from 'react';
import { STATIC_CATALOG, fetchCatalog } from '../lib/catalog';

// Product catalog: starts from the built-in copy, then loads live data (prices, stock) from the API.
export default function useCatalog() {
  const [catalog, setCatalog] = useState(STATIC_CATALOG);
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
