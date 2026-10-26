import React, { useRef } from 'react';
import { EPISODES } from '../../data/episodes';
import useOffscreenPause from '../../hooks/useOffscreenPause';

export default function MarqueeTicker() {
  const pauseRef = useRef(null);
  useOffscreenPause(pauseRef); // pause its animations while scrolled away

  const items = [...EPISODES, ...EPISODES, ...EPISODES];

  return (
    <div className="marquee" aria-hidden="true" ref={pauseRef}>
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
