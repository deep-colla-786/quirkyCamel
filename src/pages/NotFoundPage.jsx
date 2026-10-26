import React from 'react';
import { paths } from '../lib/routes';

// Any address the store doesn't know (the server also answers these with status 404).
export default function NotFoundPage() {
  return (
    <div className="account-page">
      <div className="wrap account-gate">
        <span className="icon" />
        <h1>Page not found</h1>
        <p>This camel wandered off. The page may have moved, or the link is mistyped.</p>
        <div className="cta-row">
          <a className="btn blue" href={paths.shop}>
            Go to the shop
          </a>
          <a className="btn ghost-dark" href={paths.home}>
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
