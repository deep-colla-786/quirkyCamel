import React from 'react';
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import Hero3D from '../kit3d/Hero3D';
import { PRICE, formatINR } from '../../data/episodes';

// Home hero: headline, calls to action and the interactive 3D kit.
export default function HeroSection({ onAddToCart, onNavigate, onOpenProduct }) {
  return (
    <section className="band hero squig" id="top">
      <div className="wrap">
        <div>
          <p className="kicker">Attar, reimagined.</p>
          <h1 className="bubble b-lime">
            <span className="w">Every</span> <span className="w">camel</span>{' '}
            <span className="w">has</span> <span className="w">a</span>{' '}
            <span className="w">situation.</span>
          </h1>
          <p className="sub">
            Six fragrances, six strange little worlds, each sealed in a pocket-sized attar sachet. Lost in an oasis, out after dark, fresh from the shower. Meet the camel in each one, then take the whole series home in the complete kit.
          </p>
          <div className="cta-row">
            <button
              className="btn lime"
              onClick={() => onAddToCart(1)}
            >
              Add the complete kit · {formatINR(PRICE)}
            </button>
            <button
              className="btn ghost"
              onClick={() => onNavigate('home', 'sachet')}
            >
              How the sachet works
            </button>
            <button
              className="btn ghost"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={() => onNavigate('shop')}
            >
              Shop all →
            </button>
          </div>

          <div className="trust">
            <span>
              <Check size={16} strokeWidth={3} /> 6 fragrances, 1 box
            </span>
            <span>
              <Check size={16} strokeWidth={3} /> Sealed attar sachets
            </span>
            <span>
              <Check size={16} strokeWidth={3} /> Pocket-sized, no glass
            </span>
            <span>
              <Check size={16} strokeWidth={3} /> Gift-ready collector box
            </span>
          </div>
        </div>

        {/* Interactive Three.js 3D Stage */}
        <Hero3D onSelectEpisode={onOpenProduct} />
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  onAddToCart: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onOpenProduct: PropTypes.func.isRequired
};
