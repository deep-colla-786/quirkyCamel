import { useEffect, useRef } from 'react';
import { CLIENT_ID } from '../lib/api';

// Listens for live changes from the server (Server-Sent Events) so the page updates
// without a refresh:
//   catalog -> products, prices, stock or visibility changed in the dashboard
//   saved   -> this user's cart or wishlist changed in another tab or device
//   shipment -> a delivery update for one of this user's orders
// Reconnects when the signed-in user changes (the stream is tied to the session).
// Coming back to the tab also re-checks the catalog, in case events were missed.
export default function useLiveUpdates({ userId, onCatalog, onSaved, onShipment }) {
  const handlers = useRef({ onCatalog, onSaved, onShipment });
  useEffect(() => {
    handlers.current = { onCatalog, onSaved, onShipment };
  }, [onCatalog, onSaved, onShipment]);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const source = new EventSource(`/api/events?client=${encodeURIComponent(CLIENT_ID)}`);
    const catalog = () => handlers.current.onCatalog();
    const saved = () => handlers.current.onSaved();
    source.addEventListener('catalog', catalog);
    source.addEventListener('saved', saved);
    source.addEventListener('shipment', () => handlers.current.onShipment());
    return () => source.close();
  }, [userId]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && handlers.current.onCatalog();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
}
