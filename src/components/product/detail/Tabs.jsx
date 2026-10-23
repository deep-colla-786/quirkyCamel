import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Accessible tab strip; each tab is { id, label, body }.
export default function Tabs({ tabs }) {
  const [active, setActive] = useState(tabs[0].id);
  const cur = tabs.find((t) => t.id === active) || tabs[0];
  return (
    <section className="pd-tabs">
      <div className="pd-tablist" role="tablist" aria-label="Product information">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === cur.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pd-panel" role="tabpanel" id={`panel-${cur.id}`} aria-labelledby={`tab-${cur.id}`}>
        {cur.body}
      </div>
    </section>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      body: PropTypes.node
    })
  ).isRequired
};
