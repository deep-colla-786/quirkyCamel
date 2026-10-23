import React from 'react';
import PropTypes from 'prop-types';
import HeroSection from '../components/home/HeroSection';
import MarqueeTicker from '../components/home/MarqueeTicker';
import SachetRitual from '../components/home/SachetRitual';
import DiscoverySection from '../components/home/DiscoverySection';
import SlotMachine from '../components/home/SlotMachine';
import CompareSection from '../components/home/CompareSection';
import BuyBoxSection from '../components/home/BuyBoxSection';
import ManifestoSection from '../components/home/ManifestoSection';
import FaqSection from '../components/home/FaqSection';

export default function HomePage({
  activeEpisodeId,
  onAddToCart,
  onBuyNow,
  onSelectEpisode,
  onNavigate,
  onOpenProduct
}) {
  return (
    <div className="view home-view">
      {/* Hero with 3D Kit */}
      <HeroSection onAddToCart={onAddToCart} onNavigate={onNavigate} onOpenProduct={onOpenProduct} />

      {/* Marquee */}
      <MarqueeTicker />

      {/* Sachet Ritual Stage ("Collect, Snap, Wear") */}
      <SachetRitual
        currentEpisodeId={activeEpisodeId}
        onSelectEpisode={onSelectEpisode}
      />

      {/* Discovery & Episode Cards Filter */}
      <DiscoverySection onSelectEpisode={onSelectEpisode} />

      {/* Spin a Situation Minigame */}
      <SlotMachine onSelectEpisode={onSelectEpisode} />

      {/* Bottle vs Kit Comparison */}
      <CompareSection
        onAddToCart={onAddToCart}
        onNavigateToProduct={() => onNavigate('product-kit')}
      />

      {/* Complete Kit Buy Box */}
      <BuyBoxSection
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        onSelectEpisode={onSelectEpisode}
      />

      {/* Manifesto / Boop The Camel */}
      <ManifestoSection
        onExploreEpisodes={() => onNavigate('home', 'episodes')}
        onShopKit={() => onNavigate('home', 'kit')}
      />

      {/* FAQ Accordion with Search */}
      <FaqSection
        onSpinClick={() => {
          const el = document.querySelector('.spin');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onShopKit={() => onNavigate('home', 'kit')}
      />
    </div>
  );
}

HomePage.propTypes = {
  activeEpisodeId: PropTypes.string.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
  onSelectEpisode: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onOpenProduct: PropTypes.func.isRequired
};
