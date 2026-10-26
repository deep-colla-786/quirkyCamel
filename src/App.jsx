import React, { Suspense, lazy, useCallback, useState } from 'react';
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
import PageMeta from './components/layout/PageMeta';
// Pages other than home load on first visit, so the home page downloads less.
const EpisodePage = lazy(() => import('./pages/EpisodePage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import useToast from './hooks/useToast';
import useCatalog from './hooks/useCatalog';
import useCart from './hooks/useCart';
import useSavedItems from './hooks/useSavedItems';
import useAuth from './hooks/useAuth';
import useRouter from './hooks/useRouter';
import useCheckout from './hooks/useCheckout';
import useAccountSync from './hooks/useAccountSync';
import useLiveUpdates from './hooks/useLiveUpdates';
import { authApi, ordersApi } from './lib/api';
import { EPISODES, EPISODES_BY_ID, PRICE } from './data/episodes';
import { KIT_SLUG, productPath } from './data/products';
import { paths } from './lib/routes';

export default function App() {
  const { toastMessage, showToast } = useToast();
  const { catalog, catalogLoaded, loadCatalog } = useCatalog();
  const { user, setUser, authChecked, auth, openAuth, closeAuth, requireLogin, continueAsGuest, signUpThen, handleAuthed } = useAuth({
    showToast
  });
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
  const { currentView, productSlug, shopSaved, activeEpisodeId, trackOrderId, resetToken, infoPage, goTo, handleNavigate } = useRouter({
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
    goTo(paths.home);
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

  const handleSelectEpisode = (epId) => goTo(paths.episode(epId));

  // After a guest checkout: create an account and adopt that order.
  const createAccountForOrder = ({ trackId, trackToken }) => {
    checkout.closeSuccess();
    signUpThen(async () => {
      const res = await ordersApi.claim(trackId, trackToken);
      showToast(res.ok ? 'Your order is now saved in your account.' : res.data.error || 'Could not add the order to your account.');
    }, 'Create an account to keep this order and track future ones.');
  };

  const currentEpisode = EPISODES_BY_ID[activeEpisodeId] || EPISODES[0];

  return (
    <div className="app-root">
      <Navbar
        cartCount={cart.cartCount}
        onOpenCart={cart.openCart}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => goTo(paths.saved)}
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        authChecked={authChecked}
        onLogin={() => openAuth('login')}
      />

      <PageMeta view={currentView} catalog={catalog} productSlug={productSlug} episode={currentEpisode} infoPage={infoPage} />
      <main>
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
        {currentView === 'home' && (
          <HomePage
            activeEpisodeId={activeEpisodeId}
            onAddToCart={cart.handleAddToCart}
            onBuyNow={cart.handleInstantBuyNow}
            onSelectEpisode={handleSelectEpisode}
            onNavigate={handleNavigate}
            onOpenProduct={(id) => goTo(productPath(id))}
          />
        )}

        {currentView === 'episode' && (
          <EpisodePage
            key={currentEpisode.id}
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
            onDeleted={() => signedOut('Your account has been deleted.')}
            refreshKey={shipmentTick}
          />
        )}

        {currentView === 'track' && (
          <TrackingPage key={trackOrderId} orderId={trackOrderId} user={user} authChecked={authChecked} onLogin={() => openAuth('login')} refreshKey={shipmentTick} />
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

        {currentView === 'info' && <InfoPage page={infoPage} />}

        {currentView === 'reset' && <ResetPasswordPage token={resetToken} onLogin={() => openAuth('login')} />}

        {currentView === 'notfound' && <NotFoundPage />}
        </Suspense>
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
        onRequireLogin={(action) => requireLogin(action, undefined, { allowGuest: true })}
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
        onCreateAccount={user ? undefined : createAccountForOrder}
      />

      <StickyBuyBar
        onAddToCart={cart.handleAddToCart}
        onBuyNow={cart.handleInstantBuyNow}
        currentView={currentView}
        productSlug={productSlug}
      />

      <AuthModal
        isOpen={auth.open}
        initialMode={auth.mode}
        reason={auth.reason}
        onClose={closeAuth}
        onAuthed={handleAuthed}
        allowGuest={auth.allowGuest}
        onGuest={continueAsGuest}
      />

      <Toast message={toastMessage} />
      <UpdateBanner />
    </div>
  );
}
