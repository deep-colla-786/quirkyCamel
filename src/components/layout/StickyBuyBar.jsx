import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PRICE, formatINR, EPISODES } from '../../data/episodes';
import { kitSVG } from '../../utils/svgGenerators';
import { Zap } from 'lucide-react';
import { KIT_SLUG } from '../../data/products';

export default function StickyBuyBar({ onAddToCart, onBuyNow, currentView, productSlug }) {
  const [visible, setVisible] = useState(false);
  // The bar sells the kit, so it only belongs on the home page and the kit's own page.
  const isKitPage = currentView === 'product' && productSlug === KIT_SLUG;
  const enabled = currentView === 'home' || isKitPage;

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return undefined;
    }
    // Room at the bottom of the page so the bar never covers the footer.
    document.body.classList.add('has-buybar');
    const showAfter = currentView === 'home' ? 480 : 400;
    const handleScroll = () => setVisible(window.scrollY > showAfter);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('has-buybar');
    };
  }, [enabled, currentView]);

  return (
    <div className={`buybar ${visible ? 'on' : ''}`} aria-hidden={!visible}>
      <div className="wrap">
        <div
          className="bt"
          dangerouslySetInnerHTML={{ __html: kitSVG(EPISODES) }}
        />
        <div className="bx">
          <b>The Complete Kit</b>
          <small>All six sachets · collector box · snap pouch</small>
        </div>
        <span className="pr">{formatINR(PRICE)}</span>
        <button
          className="btn lime"
          onClick={() => onAddToCart && onAddToCart(1)}
          tabIndex={visible ? 0 : -1}
        >
          Add to cart
        </button>
        <button
          className="btn blue"
          onClick={() => onBuyNow && onBuyNow(1)}
          tabIndex={visible ? 0 : -1}
        >
          <Zap size={16} fill="currentColor" /> Buy now
        </button>
      </div>
    </div>
  );
}

StickyBuyBar.propTypes = {
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
  currentView: PropTypes.string.isRequired,
  productSlug: PropTypes.string
};
