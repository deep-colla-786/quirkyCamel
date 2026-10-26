import React from 'react';
import PropTypes from 'prop-types';
import { RefreshCw } from 'lucide-react';

// Shown instead of an endless "Loading…" when a request fails.
export default function LoadError({ message, onRetry }) {
  return (
    <div className="ad-load-error" role="alert">
      <span>{message || 'Couldn’t load this. Check your connection and that the server is running.'}</span>
      <button type="button" className="btn ghost-dark ad-btn-sm" onClick={onRetry}>
        <RefreshCw size={15} /> Retry
      </button>
    </div>
  );
}

LoadError.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func.isRequired
};
