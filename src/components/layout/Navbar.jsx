import React from 'react';
import PropTypes from 'prop-types';
import { ShoppingBag, Heart, User } from 'lucide-react';
import { userShape } from '../../lib/propShapes';

export default function Navbar({
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  currentView,
  onNavigate,
  user,
  authChecked,
  onLogin
}) {
  return (
    <>
      <div className="announce">
        <div className="wrap">
          <span>Six fragrances, sealed in pocket-sized attar sachets. The complete kit is the only way in.</span>
        </div>
      </div>
      <header className="nav">
        <div className="wrap">
          <button
            className="home-btn"
            onClick={() => onNavigate('home')}
            aria-label="Quirky Camel Home"
          >
            <span className="logo nav-logo" role="img" aria-label="Quirky Camel" />
          </button>

          <nav aria-label="Main navigation">
            <button
              className={`nav-link ${currentView === 'shop' ? 'active' : ''}`}
              onClick={() => onNavigate('shop')}
            >
              Shop
            </button>
            <button
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home', 'episodes')}
            >
              The Episodes
            </button>
            <button
              className={`nav-link ${currentView === 'product' ? 'active' : ''}`}
              onClick={() => onNavigate('product-kit')}
            >
              Complete Kit <span className="nav-badge">Flagship</span>
            </button>
            <button
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home', 'story')}
            >
              Our Story
            </button>
            <button
              className="nav-link"
              onClick={() => onNavigate('home', 'faq')}
            >
              FAQ
            </button>
          </nav>

          <div className="nav-actions">
            {wishlistCount > 0 && (
              <button
                className="wishlist-btn"
                onClick={onOpenWishlist}
                title="Saved Episodes"
                aria-label="Wishlist"
              >
                <Heart size={18} fill="#ff5fa8" stroke="#ff5fa8" />
                <span className="n">{wishlistCount}</span>
              </button>
            )}

            {authChecked &&
              (user ? (
                <a
                  className={`account-btn ${currentView === 'account' ? 'active' : ''}`}
                  href="#account"
                  title="Your account"
                >
                  <span className="account-avatar" aria-hidden="true">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="account-name">{user.name.split(' ')[0]}</span>
                </a>
              ) : (
                <button className="account-btn" onClick={onLogin}>
                  <User size={18} />
                  <span className="account-name">Log in</span>
                </button>
              ))}

            <button
              className="cart-btn"
              id="cartBtn"
              onClick={onOpenCart}
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              <span className="n" id="cartN">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

Navbar.propTypes = {
  cartCount: PropTypes.number.isRequired,
  onOpenCart: PropTypes.func.isRequired,
  wishlistCount: PropTypes.number.isRequired,
  onOpenWishlist: PropTypes.func.isRequired,
  currentView: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  user: userShape,
  authChecked: PropTypes.bool.isRequired,
  onLogin: PropTypes.func.isRequired
};
