import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import StickyBuyBar from './components/layout/StickyBuyBar';
import Toast from './components/layout/Toast';
import CartDrawer from './components/cart/CartDrawer';
import RazorpayModal from './components/checkout/RazorpayModal';
import OrderSuccessModal from './components/checkout/OrderSuccessModal';
import AuthModal from './components/auth/AuthModal';
import HomePage from './pages/HomePage';
import EpisodePage from './pages/EpisodePage';
import AccountPage from './pages/AccountPage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import useToast from './hooks/useToast';
import useCatalog from './hooks/useCatalog';
import useCart from './hooks/useCart';
import useSavedItems from './hooks/useSavedItems';
import useAuth from './hooks/useAuth';
import useHashRouter from './hooks/useHashRouter';
import useCheckout from './hooks/useCheckout';
import { authApi } from './lib/api';
import { EPISODES, EPISODES_BY_ID, PRICE } from './data/episodes';
import { KIT_SLUG, productHash } from './data/products';

export default function App() {
  const { toastMessage, showToast } = useToast();
  const { catalog, catalogLoaded, loadCatalog } = useCatalog();
  const { user, setUser, authChecked, auth, openAuth, closeAuth, requireLogin, handleAuthed } = useAuth({ showToast });
  const cart = useCart({ catalog, showToast, requireLogin });
  const { wishlist, toggleWishlist, recentlyViewed, markViewed } = useSavedItems({ catalog, showToast });
  const { currentView, productSlug, shopSaved, activeEpisodeId, goTo, handleNavigate } = useHashRouter({
    onViewProduct: markViewed
  });
  const checkout = useCheckout({
    setUser,
    requireLogin,
    showToast,
    setCart: cart.setCart,
    setIsCartOpen: cart.setIsCartOpen,
    loadCatalog
  });

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    cart.setIsCartOpen(false);
    showToast('You have been logged out.');
    goTo('#top');
  };

  const handleSelectEpisode = (epId) => goTo(`#${epId}`);

  const currentEpisode = EPISODES_BY_ID[activeEpisodeId] || EPISODES[0];

  return (
    <div className="app-root">
      <Navbar
        cartCount={cart.cartCount}
        onOpenCart={cart.openCart}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => goTo('#shop/saved')}
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        authChecked={authChecked}
        onLogin={() => openAuth('login')}
        onLogout={handleLogout}
      />

      <main>
        {currentView === 'home' && (
          <HomePage
            activeEpisodeId={activeEpisodeId}
            onAddToCart={cart.handleAddToCart}
            onBuyNow={cart.handleInstantBuyNow}
            onSelectEpisode={handleSelectEpisode}
            onNavigate={handleNavigate}
            onOpenProduct={(id) => goTo(productHash(id))}
          />
        )}

        {currentView === 'episode' && (
          <EpisodePage
            episode={currentEpisode}
            onAddToCart={cart.handleAddToCart}
            onSelectEpisode={handleSelectEpisode}
            onBackHome={() => handleNavigate('home', 'episodes')}
          />
        )}

        {currentView === 'account' && (
          <AccountPage user={user} onLogin={(mode) => openAuth(mode)} onLogout={handleLogout} />
        )}

        {currentView === 'shop' && (
          <ShopPage
            catalog={catalog}
            savedOnly={shopSaved}
            wishlist={wishlist}
            onToggleSaved={toggleWishlist}
            onAddToCart={cart.handleAddToCart}
            recentlyViewed={recentlyViewed}
          />
        )}

        {currentView === 'product' && (
          <ProductPage
            slug={productSlug}
            catalog={catalog}
            catalogLoaded={catalogLoaded}
            wishlist={wishlist}
            onToggleSaved={toggleWishlist}
            onAddToCart={cart.handleAddToCart}
            onBuyNow={cart.handleInstantBuyNow}
            recentlyViewed={recentlyViewed}
            showToast={showToast}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <CartDrawer
        isOpen={cart.isCartOpen}
        onClose={() => cart.setIsCartOpen(false)}
        lines={cart.cartLines}
        total={cart.cartTotal}
        kit={catalog.kit}
        onSetQty={cart.setLineQty}
        onAddKit={() => cart.setLineQty(KIT_SLUG, 1)}
        onTriggerRazorpay={checkout.handleCheckout}
        startStep={cart.cartStartStep}
        isPaying={checkout.isPaying}
        giftNote={cart.giftNote}
        user={user}
        onRequireLogin={(action) => requireLogin(action)}
        onSelectEpisode={handleSelectEpisode}
      />

      {/* Demo Razorpay checkout (used while the Razorpay keys are placeholders) */}
      <RazorpayModal
        isOpen={checkout.isRazorpayOpen}
        onClose={checkout.closeRazorpay}
        amount={checkout.pendingCheckout?.amount || PRICE}
        orderDetails={checkout.pendingCheckout}
        customerDetails={checkout.pendingCheckout?.customer}
        onPaymentSuccess={checkout.handleDemoPaymentSuccess}
        onPaymentFailure={checkout.handlePaymentFailure}
      />

      <OrderSuccessModal
        isOpen={checkout.isSuccessModalOpen}
        onClose={checkout.closeSuccess}
        paymentData={checkout.confirmedPayment}
        customerData={checkout.confirmedCustomer}
        items={checkout.pendingCheckout?.items || []}
        catalog={catalog}
      />

      <StickyBuyBar
        onAddToCart={cart.handleAddToCart}
        onBuyNow={cart.handleInstantBuyNow}
        currentView={currentView}
      />

      <AuthModal
        isOpen={auth.open}
        initialMode={auth.mode}
        reason={auth.reason}
        onClose={closeAuth}
        onAuthed={handleAuthed}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
