import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import { userShape } from '../../lib/propShapes';
import { paths } from '../../lib/routes';
import useDialog from '../../hooks/useDialog';

// Links in the phone/tablet menu: the same as the desktop header, plus Account.
const MENU_LINKS = [
  { label: 'Shop', view: 'shop' },
  { label: 'The Episodes', view: 'home', target: 'episodes' },
  { label: 'Complete Kit', view: 'product-kit' },
  { label: 'Our Story', view: 'home', target: 'story' },
  { label: 'FAQ', view: 'home', target: 'faq' }
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  // Escape closes, Tab stays inside, focus goes back to the menu button on close.
  const menuPanelRef = useDialog(menuOpen, closeMenu);

  const goFromMenu = (view, target) => {
    closeMenu();
    onNavigate(view, target);
  };

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
                  href="/account"
                  title="Your account"
                  aria-label={`${user.name.split(' ')[0]}, your account`}
                >
                  <span className="account-avatar" aria-hidden="true">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="account-name">{user.name.split(' ')[0]}</span>
                </a>
              ) : (
                <button className="account-btn" onClick={onLogin} aria-label="Log in">
                  <User size={18} />
                  <span className="account-name">Log in</span>
                </button>
              ))}

            <button
              className="cart-btn"
              id="cartBtn"
              onClick={onOpenCart}
            >
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Cart</span>
              <span className="n" id="cartN">{cartCount}</span>
              <span className="sr"> items</span>
            </button>

            <button
              className="menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && <div className="menu-scrim" onClick={closeMenu} aria-hidden="true" />}
      <div
        id="site-menu"
        ref={menuPanelRef}
        className={`menu-panel ${menuOpen ? 'open' : ''}`}
        aria-label="Menu"
        role="dialog"
        aria-modal="true"
      >
        <div className="menu-head">
          <b>Menu</b>
          <button className="menu-close" onClick={closeMenu} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {MENU_LINKS.map(({ label, view, target }) => (
            <button key={label} className="menu-link" onClick={() => goFromMenu(view, target)}>
              {label}
            </button>
          ))}
          <a
            className={`menu-link ${currentView === 'account' ? 'active' : ''}`}
            href={paths.account}
            onClick={closeMenu}
          >
            Account
          </a>
        </nav>
      </div>
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
