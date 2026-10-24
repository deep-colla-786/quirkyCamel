import React, { useCallback, useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import StickyBuyBar from './components/layout/StickyBuyBar';
import Toast from './components/layout/Toast';
import UpdateBanner from './components/layout/UpdateBanner';
import CartDrawer from './components/cart/CartDrawer';
import RazorpayModal from './components/checkout/RazorpayModal';
import OrderSuccessModal from './components/checkout/OrderSuccessModal';
import AuthModal from './components/auth/AuthModal';
import HomePage from './pages/HomePage';
import EpisodePage from './pages/EpisodePage';
import AccountPage from './pages/AccountPage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import TrackingPage from './pages/TrackingPage';
import useToast from './hooks/useToast';
import useCatalog from './hooks/useCatalog';
import useCart from './hooks/useCart';
import useSavedItems from './hooks/useSavedItems';
import useAuth from './hooks/useAuth';
import useHashRouter from './hooks/useHashRouter';
import useCheckout from './hooks/useCheckout';
import useAccountSync from './hooks/useAccountSync';
import useLiveUpdates from './hooks/useLiveUpdates';
import { authApi } from './lib/api';
import { EPISODES, EPISODES_BY_ID, PRICE } from './data/episodes';
import { KIT_SLUG, productHash } from './data/products';

export default function App() {
  const { toastMessage, showToast } = useToast();
  const { catalog, catalogLoaded, loadCatalog } = useCatalog();
  const { user, setUser, authChecked, auth, openAuth, closeAuth, requireLogin, handleAuthed } = useAuth({ showToast });
  const cart = useCart({ catalog, showToast, requireLogin });
  const { wishlist, setWishlist, toggleWishlist, recentlyViewed, markViewed } = useSavedItems({ catalog, showToast });
  const account = useAccountSync({
    user,
    authChecked,
    cart: cart.cart,
    setCart: cart.setCart,
    wishlist,
    setWishlist,
    showToast
  });
  // Bumped on every live delivery update, so order and tracking pages re-fetch.
  const [shipmentTick, setShipmentTick] = useState(0);
  const onShipment = useCallback(() => setShipmentTick((n) => n + 1), []);
  useLiveUpdates({ userId: user?.id, onCatalog: loadCatalog, onSaved: account.reload, onShipment });
  const { currentView, productSlug, shopSaved, activeEpisodeId, trackOrderId, goTo, handleNavigate } = useHashRouter({
    onViewProduct: markViewed
  });
  const checkout = useCheckout({
    setUser,
    requireLogin,
    showToast,
    setCart: cart.setCart,
    setIsCartOpen: cart.setIsCartOpen,
    openCartAt: cart.openCartAt,
    loadCatalog
  });

  const signedOut = (message) => {
    setUser(null);
    cart.setIsCartOpen(false);
    showToast(message);
    goTo('#top');
  };

  const handleLogout = async () => {
    await account.flush();
    await authApi.logout();
    signedOut('You have been logged out.');
  };

  const handleLogoutAll = async () => {
    await account.flush();
    const res = await authApi.logoutAll();
    if (!res.ok) return showToast(res.data.error || 'Could not log out of your other devices.');
    signedOut('Logged out on all your devices.');
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
          <AccountPage
            user={user}
            onLogin={(mode) => openAuth(mode)}
            onLogout={handleLogout}
            onLogoutAll={handleLogoutAll}
            refreshKey={shipmentTick}
          />
        )}

        {currentView === 'track' && (
          <TrackingPage orderId={trackOrderId} user={user} authChecked={authChecked} onLogin={() => openAuth('login')} refreshKey={shipmentTick} />
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
        serverError={checkout.checkoutError}
        giftNote={cart.giftNote}
        user={user}
        onRequireLogin={(action) => requireLogin(action)}
      />

      {/* Demo Razorpay checkout (used while the Razorpay keys are placeholders) */}
      <RazorpayModal
        isOpen={checkout.isRazorpayOpen}
        onClose={checkout.closeRazorpay}
        amount={checkout.pendingCheckout?.amount || PRICE}
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
      <UpdateBanner />
    </div>
  );
}
