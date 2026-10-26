import React from 'react';
import PropTypes from 'prop-types';
import { paths } from '../../lib/routes';
import { BUSINESS } from '../../data/business';

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

        <nav aria-label="Store policies">
          <a href={paths.shipping}>Shipping policy</a>
          <a href={paths.refunds}>Returns &amp; refunds</a>
          <a href={paths.privacy}>Privacy policy</a>
          <a href={paths.terms}>Terms of use</a>
          <a href={paths.contact}>Contact us</a>
        </nav>

        <small className="foot-contact">
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          {BUSINESS.phone && (
            <>
              {' · '}
              <a href={`tel:${BUSINESS.phone.replaceAll(' ', '')}`}>{BUSINESS.phone}</a>
            </>
          )}
          {BUSINESS.address && <> · {BUSINESS.address}</>}
        </small>

        <small>Smell different. Everywhere. · © 2026 Quirky Camel. All rights reserved.</small>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  onNavigate: PropTypes.func.isRequired
};
