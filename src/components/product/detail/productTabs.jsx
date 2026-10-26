import React from 'react';
import HowToUse from './HowToUse';
import ShippingReturns from './ShippingReturns';
import { InsideList, SpecsTable, FragranceList } from './TabContent';

// Optional tabs, shown only when the product has that content (set in the dashboard
// or built in).
const insideTab = (p) => (p.inside?.length ? [{ id: 'inside', label: 'What’s inside', body: <InsideList items={p.inside} /> }] : []);
const specsTab = (p) => (p.specs?.length ? [{ id: 'specs', label: 'Specifications', body: <SpecsTable specs={p.specs} /> }] : []);

const useTab = { id: 'use', label: 'How to use', body: <HowToUse /> };
const shippingTab = { id: 'shipping', label: 'Shipping & returns', body: <ShippingReturns /> };

function fragranceTabs(product) {
  const ep = product.episode;
  return [
    {
      id: 'overview',
      label: 'The episode',
      body: (
        <div className="pd-episode">
          <p className="pd-world">{ep.world}</p>
          <p>{product.description}</p>
          <p><b>The scene:</b> {ep.look}</p>
          <a className="pd-story-link" href={`/episodes/${ep.id}`}>Read the full episode story →</a>
        </div>
      )
    },
    {
      id: 'scent',
      label: 'Scent profile',
      body: (
        <div className="pd-scent">
          <p>{ep.scent}</p>
          <div className="pd-chips">
            {ep.scentTags.map((t) => <span key={t}>{t}</span>)}
          </div>
          {ep.note && <p className="pd-note">{ep.note}</p>}
        </div>
      )
    },
    useTab,
    ...specsTab(product),
    shippingTab
  ];
}

// Information tabs for a product page: different sets for extras, the kit and each fragrance.
export function buildTabs(product) {
  if (product.type === 'product') {
    return [
      { id: 'overview', label: 'Overview', body: <p className="pd-lede">{product.description || product.tagline}</p> },
      ...insideTab(product),
      ...specsTab(product),
      shippingTab
    ];
  }
  if (product.type === 'kit') {
    return [
      { id: 'overview', label: 'Overview', body: <p className="pd-lede">{product.description}</p> },
      ...insideTab(product),
      { id: 'fragrances', label: 'The six fragrances', body: <FragranceList /> },
      useTab,
      ...specsTab(product),
      shippingTab
    ];
  }
  return fragranceTabs(product);
}
