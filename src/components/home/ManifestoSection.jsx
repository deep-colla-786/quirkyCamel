import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { MANIFESTO_QUOTES } from '../../data/episodes';
import { CAMEL_MASCOT_WEBP } from '../../utils/svgGenerators';

export default function ManifestoSection({ onExploreEpisodes, onShopKit }) {
  const [speechIndex, setSpeechIndex] = useState(0);
  const [showSpeech, setShowSpeech] = useState(false);
  const [wiggling, setWiggling] = useState(false);

  const handleBoop = () => {
    setSpeechIndex((prev) => (prev + 1) % MANIFESTO_QUOTES.length);
    setShowSpeech(true);
    setWiggling(true);

    try {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C4E539', '#7616C1', '#FF9100', '#2259B2']
      });
    } catch (e) {
      // safe fallback
    }

    setTimeout(() => setWiggling(false), 600);
    setTimeout(() => setShowSpeech(false), 2600);
  };

  return (
    <section className="band mani squig" id="story">
      <div className="wrap">
        <div className="camel">
          <div className="arch">
            <img
              src={CAMEL_MASCOT_WEBP}
              id="camelImg"
              className={wiggling ? 'camel-wiggle' : ''}
              alt="A camel wearing orange sunglasses with purple lenses"
              width="520"
              height="839"
              loading="lazy"
            />
          </div>

          <svg className="spk a" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 0C21.5 13 27 18.5 40 20 27 21.5 21.5 27 20 40 18.5 27 13 21.5 0 20 13 18.5 18.5 13 20 0Z" fill="currentColor" />
          </svg>
          <svg className="spk b" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 0C21.5 13 27 18.5 40 20 27 21.5 21.5 27 20 40 18.5 27 13 21.5 0 20 13 18.5 18.5 13 20 0Z" fill="currentColor" />
          </svg>
          <svg className="spk c" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 0C21.5 13 27 18.5 40 20 27 21.5 21.5 27 20 40 18.5 27 13 21.5 0 20 13 18.5 18.5 13 20 0Z" fill="currentColor" />
          </svg>

          <div className={`speech ${showSpeech ? 'on' : ''}`}>
            {MANIFESTO_QUOTES[speechIndex]}
          </div>

          <button className="boop" onClick={handleBoop}>
            BOOP THE CAMEL
          </button>
        </div>

        <div>
          <span className="eyebrow" style={{ color: 'var(--purple-deep)' }}>
            Our Story
          </span>
          <h2 className="bubble b-purple">
            <span className="w">Wonderfully</span> <span className="w">strange</span> <span className="w">world</span>{' '}
            <span className="w">of</span> <span className="w">scent</span>
          </h2>
          <p>
            Here, fragrance isn’t just something you wear. It’s something you become. Quirky Camel reimagines the timeless art of attar through curiosity, creativity, and character.
          </p>
          <p>
            Attar carries centuries of artisanal craftsmanship, yet its presentation often feels far from today’s adventurous audience. So we gave it a protagonist and sealed it in a sachet you can carry anywhere. The camel stays the same. The situation changes, the world changes, and so does the scent.
          </p>

          <div className="pillars">
            <div>
              <b>Rooted in attar</b>
              <small>A timeless craft, given a vibrant, modern voice.</small>
            </div>
            <div>
              <b>Told in episodes</b>
              <small>Six camels, six situations, one continuous world.</small>
            </div>
            <div>
              <b>Made to carry</b>
              <small>Sealed in sachets for pocket, purse, or snap pouch.</small>
            </div>
          </div>

          <div className="cta-row">
            <button className="btn blue" onClick={onExploreEpisodes}>
              Meet the six camels
            </button>
            <button className="btn ghost-dark" onClick={onShopKit}>
              Shop the complete kit
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
