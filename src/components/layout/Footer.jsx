import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="band foot squig">
      <div className="wrap">
        <h2 className="bubble b-lime">
          <span className="w">Wear</span>
          <span className="your">YOUR</span>
          <span className="w">Weird</span>
        </h2>

        <span className="logo footer-logo" role="img" aria-label="Quirky Camel" />

        <nav aria-label="Footer Navigation">
          <button onClick={() => onNavigate('shop')}>Shop</button>
          <button onClick={() => onNavigate('home', 'sachet')}>The Sachet</button>
          <button onClick={() => onNavigate('home', 'episodes')}>The Episodes</button>
          <button onClick={() => onNavigate('product-kit')}>Complete Kit</button>
          <button onClick={() => onNavigate('home', 'discover')}>Discover</button>
          <button onClick={() => onNavigate('home', 'story')}>Our Story</button>
          <button onClick={() => onNavigate('home', 'faq')}>FAQ</button>
        </nav>

        <small>Smell different. Everywhere. · © 2026 Quirky Camel. All rights reserved.</small>
      </div>
    </footer>
  );
}
