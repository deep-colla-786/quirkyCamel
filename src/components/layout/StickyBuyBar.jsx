import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PRICE, formatINR, EPISODES } from '../../data/episodes';
import { kitSVG } from '../../utils/svgGenerators';
import { Zap } from 'lucide-react';

export default function StickyBuyBar({ onAddToCart, onBuyNow, currentView }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (currentView === 'home') {
        // Show after scrolling past hero (~450px) and hide near buy box if needed
        setVisible(scrollY > 480);
      } else {
        // On episode or product details page, show after ~400px
        setVisible(scrollY > 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  return (
    <div className={`buybar ${visible ? 'on' : ''}`} aria-hidden={!visible}>
      <div className="wrap">
        <div
          className="bt"
          dangerouslySetInnerHTML={{ __html: kitSVG(EPISODES) }}
        />
        <div className="bx">
          <b>The Complete Kit</b>
          <small>Sachets of all six episodes · collector box · snap pouch</small>
        </div>
        <span className="pr">{formatINR(PRICE)}</span>
        <button
          className="btn lime"
          onClick={() => onAddToCart && onAddToCart(1)}
          tabIndex={visible ? 0 : -1}
        >
          Add to Cart
        </button>
        <button
          className="btn blue"
          style={{ padding: '12px 16px' }}
          onClick={() => onBuyNow && onBuyNow(1)}
          tabIndex={visible ? 0 : -1}
        >
          <Zap size={16} fill="currentColor" /> Buy with Razorpay
        </button>
      </div>
    </div>
  );
}

StickyBuyBar.propTypes = {
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
  currentView: PropTypes.string.isRequired
};
