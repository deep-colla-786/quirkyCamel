import React from 'react';
import PropTypes from 'prop-types';
import { PRICE, formatINR } from '../../data/episodes';

export default function CompareSection({ onAddToCart, onNavigateToProduct }) {
  const perEp = Math.round(PRICE / 6);

  return (
    <section className="band compare" id="why">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow" style={{ color: 'var(--purple)' }}>
            Why the Kit
          </span>
          <h2 className="bubble b-blue">
            <span className="w">One</span> <span className="w">bottle</span> <span className="w">is</span>{' '}
            <span className="w">one</span> <span className="w">mood.</span> <span className="w">This</span>{' '}
            <span className="w">is</span> <span className="w">six.</span>
          </h2>
          <p>Your day changes situation every few hours. Your fragrance should keep up.</p>
        </div>

        <div className="vs">
          <div className="col bottle">
            <h3>A Regular Bottle</h3>
            <ul>
              <li>
                <span className="mk">1</span>
                <span>
                  <small>CHOICE</small>One fragrance for every single situation
                </span>
              </li>
              <li>
                <span className="mk">×</span>
                <span>
                  <small>FORMAT</small>Fragile glass bottle that can break or leak in bags
                </span>
              </li>
              <li>
                <span className="mk">×</span>
                <span>
                  <small>CARRY</small>Bulky and usually stays stuck at home on the dresser
                </span>
              </li>
              <li>
                <span className="mk">?</span>
                <span>
                  <small>GIFTING</small>Guessing someone&apos;s exact signature scent is high-risk
                </span>
              </li>
            </ul>
          </div>

          <div className="vsdot" aria-hidden="true">
            VS
          </div>

          <div className="col kitc">
            <span className="badge">THE SMART PICK</span>
            <h3>The Quirky Camel Kit</h3>
            <ul>
              <li>
                <span className="mk">6</span>
                <span>
                  <small>CHOICE</small>
                  <b>Six distinct episodes</b>, from desert oasis to after-dark nightlife
                </span>
              </li>
              <li>
                <span className="mk">✓</span>
                <span>
                  <small>FORMAT</small>
                  <b>Sealed attar sachets</b>, zero alcohol, zero glass, zero leaks
                </span>
              </li>
              <li>
                <span className="mk">✓</span>
                <span>
                  <small>CARRY</small>
                  <b>Pocket, wallet, or snap pouch</b> clipped to your daily carry
                </span>
              </li>
              <li>
                <span className="mk">✓</span>
                <span>
                  <small>GIFTING</small>
                  <b>Six moods in one collector box</b> — a gift they’ll never forget
                </span>
              </li>
            </ul>

            <div className="cta-row" style={{ marginTop: '22px' }}>
              <button className="btn lime" onClick={() => onAddToCart && onAddToCart(1)}>
                Add the kit to cart · {formatINR(PRICE)}
              </button>
              <button
                className="btn-text"
                onClick={onNavigateToProduct}
                style={{ color: '#c8d6f4', textDecoration: 'underline', fontSize: '13.5px' }}
              >
                View full product specs →
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#c8d6f4', marginTop: '8px' }}>
              That’s about {formatINR(perEp)} per fragrance episode.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

CompareSection.propTypes = {
  onAddToCart: PropTypes.func.isRequired,
  onNavigateToProduct: PropTypes.func.isRequired
};
