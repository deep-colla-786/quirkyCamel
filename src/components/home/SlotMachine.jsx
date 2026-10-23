import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { EPISODES } from '../../data/episodes';
import { SCENES } from '../../utils/svgGenerators';

export default function SlotMachine({ onSelectEpisode }) {
  const [spinning, setSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [flashing, setFlashing] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 300);

    // eslint-disable-next-line sonarjs/pseudo-random -- cosmetic only, not security-sensitive
    const targetIndex = Math.floor(Math.random() * 6);
    const totalTicks = 16 + targetIndex;
    let tickCount = 0;

    const step = () => {
      setCurrentIndex((prev) => (prev + 1) % 6);
      tickCount++;

      if (tickCount < totalTicks) {
        const delay = 50 + Math.pow(tickCount / totalTicks, 3) * 350;
        setTimeout(step, delay);
      } else {
        const finalEpisode = EPISODES[targetIndex];
        setCurrentIndex(targetIndex);
        setSelectedEpisode(finalEpisode);
        setSpinning(false);
        setFlashing(true);
        setTimeout(() => setFlashing(false), 600);
      }
    };

    step();
  };

  const currentEp = EPISODES[currentIndex];

  return (
    <section className="band spin squig">
      <div className="wrap">
        <div>
          <span className="eyebrow" style={{ color: 'var(--lime)' }}>
            Can’t Decide?
          </span>
          <h2 className="bubble b-lime">
            <span className="w">Spin</span> <span className="w">a</span> <span className="w">situation</span>
          </h2>
          <p>Pull the lever and let the desert decide which camel you’re being today.</p>

          <div className="cta-row">
            <button className="btn lime" onClick={handleSpin} disabled={spinning}>
              {spinning ? 'Deciding…' : 'Spin the reel'}
            </button>
            {selectedEpisode && (
              <button
                className="btn ghost"
                onClick={() => onSelectEpisode && onSelectEpisode(selectedEpisode.id)}
              >
                Open {selectedEpisode.name} →
              </button>
            )}
          </div>
        </div>

        <div className={`reel ${leverPulled ? 'pull' : ''}`} id="reel">
          <div
            className="win"
            dangerouslySetInnerHTML={{ __html: SCENES[currentEp.id]() }}
          />
          <div className={`flash ${flashing ? 'flash-active' : ''}`} />

          <div className="cap">
            <div>
              <b>{spinning ? '…' : currentEp.name}</b>
              <span>{spinning ? 'Six camels are waiting.' : `“${currentEp.headline}”`}</span>
            </div>
          </div>

          <div className="lever" aria-hidden="true" onClick={handleSpin} title="Pull the lever!" />
        </div>
      </div>
    </section>
  );
}

SlotMachine.propTypes = {
  onSelectEpisode: PropTypes.func.isRequired
};
