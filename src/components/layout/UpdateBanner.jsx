import React from 'react';
import { RefreshCw } from 'lucide-react';
import useVersionCheck from '../../hooks/useVersionCheck';

// Shown when the site was updated after this page was opened.
export default function UpdateBanner() {
  const updateAvailable = useVersionCheck();
  if (!updateAvailable) return null;
  return (
    <div className="update-banner" role="status">
      <span>A newer version of this page is available.</span>
      <button type="button" onClick={() => globalThis.location.reload()}>
        <RefreshCw size={15} /> Refresh
      </button>
    </div>
  );
}
