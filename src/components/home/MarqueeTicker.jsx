import React from 'react';
import { EPISODES } from '../../data/episodes';

export default function MarqueeTicker() {
  const items = [...EPISODES, ...EPISODES, ...EPISODES];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {items.map((ep, idx) => (
          <span key={`${ep.id}-${idx}`}>
            {ep.name}
            <span className="icon" />
          </span>
        ))}
      </div>
    </div>
  );
}
