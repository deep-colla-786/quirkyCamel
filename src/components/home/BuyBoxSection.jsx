import React, { useState } from 'react';
import { EPISODES, PRICE, ORIGINAL_PRICE, formatINR, RITUAL_STEPS } from '../../data/episodes';
import { kitSVG, sachetSVG } from '../../utils/svgGenerators';
import { Info, Gift, Check, ShieldCheck, Zap } from 'lucide-react';

export default function BuyBoxSection({ onAddToCart, onBuyNow, onSelectEpisode, onNavigateToProduct }) {
  const [quantity, setQuantity] = useState(1);
  const perEp = Math.round(PRICE / 6);

  const handleQtyChange = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  return (
    <section className="band kit" id="kit">
      <div className="wrap">
        <div>
          <figure id="kitFig" dangerouslySetInnerHTML={{ __html: kitSVG(EPISODES) }} />

          <div className="thumbs" aria-label="Fragrances in the kit">
            {EPISODES.map((e) => (
              <button
                key={e.id}
                className="thumb-btn"
                onClick={() => onSelectEpisode && onSelectEpisode(e.id)}
                aria-label={`View ${e.name} episode`}
                title={e.name}
                dangerouslySetInnerHTML={{ __html: sachetSVG(e) }}
              />
            ))}
          </div>

          <div className="how">
            {RITUAL_STEPS.map((r) => (
              <div key={r.k}>
                <b>{r.k}</b>
                <small>{r.d}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="buy" id="buyBox">
          <div className="buy-header-row">
            <span className="eyebrow">The Flagship Experience</span>
            <span className="discount-badge">Save 33% (₹750 Off)</span>
          </div>

          <h2 className="bubble b-blue">The Complete Kit</h2>

          <div className="price-container">
            <div className="price">
              <b>{formatINR(PRICE)}</b>
              <span className="original-price">{formatINR(ORIGINAL_PRICE)}</span>
              <small>inclusive of all taxes</small>
            </div>
            <p className="perep">That’s only {formatINR(perEp)} per fragrance episode.</p>
          </div>

          <p>
            The entire Quirky Camel collection in one collector box: sealed attar sachets of all six episodes, plus a vegan leather snap pouch to carry today’s pick wherever life takes you.
          </p>

          <ul className="inc" id="incList">
            {EPISODES.map((e) => (
              <li key={e.id}>
                <span className="sw" style={{ background: e.pal.bg }} />
                <button
                  className="inc-link"
                  onClick={() => onSelectEpisode && onSelectEpisode(e.id)}
                >
                  Episode 0{e.n}: {e.name}
                </button>
                <span className="ck">
                  <Check size={14} style={{ display: 'inline', marginRight: 4 }} />
                  SACHET INCLUDED
                </span>
              </li>
            ))}
          </ul>

          <div className="giftnote">
            <Gift size={20} />
            <span>
              <b>Gifting?</b> Arrives in a luxe collector gift box with magnetic closure. You can add a personalized gift message at checkout.
            </span>
          </div>

          <div className="inbox">
            <span>6 Sealed Attar Sachets</span>
            <span>Magnetic Collector Box</span>
            <span>Snap Pouch + Carabiner</span>
            <span>Drawstring Travel Bag</span>
            <span>100% Alcohol-Free</span>
          </div>

          <div className="qty-row">
            <div className="qty" aria-label="Quantity">
              <button
                onClick={() => handleQtyChange(-1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <output>{quantity}</output>
              <button
                onClick={() => handleQtyChange(1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              className="btn blue"
              onClick={() => onAddToCart && onAddToCart(quantity)}
            >
              Add kit to cart · {formatINR(PRICE * quantity)}
            </button>
          </div>

          <button
            className="btn lime wide"
            style={{ marginTop: '10px' }}
            onClick={() => onBuyNow && onBuyNow(quantity)}
          >
            <Zap size={18} fill="currentColor" /> Instant Buy with Razorpay
          </button>

          <div className="only-kit">
            <Info size={18} />
            <span>
              Sachets aren’t sold individually. Every episode lives together in the complete kit, so you get the full story and can switch whenever your situation changes.
            </span>
          </div>

          <div className="trust-row">
            <span><ShieldCheck size={16} /> 100% Pure Perfume Oil</span>
            <span>Free Shipping Across India</span>
            <span>Cash on Delivery Available</span>
          </div>
        </div>
      </div>
    </section>
  );
}
