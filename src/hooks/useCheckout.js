import { useState } from 'react';
import { authApi, ordersApi } from '../lib/api';
import { startRazorpayCheckout } from '../lib/razorpay';

// Payment flow: real Razorpay checkout, the demo checkout (placeholder keys) and the confirmation.
export default function useCheckout({ setUser, requireLogin, showToast, setCart, setIsCartOpen, openCartAt, loadCatalog }) {
  const [isPaying, setIsPaying] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState(null);
  const [confirmedCustomer, setConfirmedCustomer] = useState(null);
  // The server rejected the delivery details: shown on the delivery form, which reopens.
  const [checkoutError, setCheckoutError] = useState('');

  const backToDelivery = (message) => {
    setIsRazorpayOpen(false);
    setCheckoutError(message);
    openCartAt('shipping');
  };

  const handleCheckout = async (checkoutData) => {
    setPendingCheckout(checkoutData);
    setCheckoutError('');
    setIsPaying(true);
    const result = await startRazorpayCheckout({
      items: checkoutData.items,
      customer: checkoutData.customer
    });
    setIsPaying(false);

    if (result.status === 'auth') {
      // Session expired mid-checkout: log in again, then retry the payment.
      setUser(null);
      requireLogin(() => handleCheckout(checkoutData), 'Your session expired. Log in again to finish your order.');
    } else if (result.status === 'paid') {
      handlePaymentSuccess(
        { ...result, date: new Date().toLocaleString('en-IN') },
        checkoutData.customer
      );
    } else if (result.status === 'demo') {
      // Dummy keys in .env: fall back to the built-in demo checkout.
      setIsCartOpen(false);
      setIsRazorpayOpen(true);
    } else if (result.status === 'failed' && result.invalid) {
      backToDelivery(result.error);
    } else if (result.status === 'failed') {
      handlePaymentFailure(result.error);
    } else {
      showToast('Payment window closed. Your cart is saved.');
    }
  };

  const handlePaymentSuccess = (paymentResult, customer = pendingCheckout?.customer) => {
    setIsRazorpayOpen(false);
    setIsCartOpen(false);
    setConfirmedPayment(paymentResult);
    setConfirmedCustomer(customer);
    setCart({}); // clear cart on success
    loadCatalog(); // stock may have changed
    // Checkout saves the delivery address to the profile; pull the fresh copy.
    authApi.me().then((res) => res.ok && res.data.user && setUser(res.data.user));
    setIsSuccessModalOpen(true);
  };

  // Demo checkout (placeholder Razorpay keys): record the order in the database.
  const handleDemoPaymentSuccess = async (paymentResult) => {
    const res = await ordersApi.createDemo(pendingCheckout.items, pendingCheckout.customer);
    if (!res.ok) {
      setIsRazorpayOpen(false);
      if (res.status === 401) {
        setUser(null);
        requireLogin(() => setIsRazorpayOpen(true), 'Your session expired. Log in again to finish your order.');
      } else if (res.status === 400) {
        backToDelivery(res.data.error || 'Please check your delivery details.');
      } else showToast(res.data.error || 'Could not save your order.');
      return;
    }
    const order = res.data.order;
    handlePaymentSuccess({
      ...paymentResult,
      orderId: order.invoiceNumber,
      paymentId: 'Demo payment (no charge)',
      trackId: order.id
    });
  };

  const handlePaymentFailure = (errorMsg) => {
    setIsRazorpayOpen(false);
    showToast(`Payment failed: ${errorMsg || 'Please try another payment method'}`);
  };

  return {
    isPaying,
    isRazorpayOpen,
    closeRazorpay: () => setIsRazorpayOpen(false),
    pendingCheckout,
    checkoutError,
    isSuccessModalOpen,
    closeSuccess: () => setIsSuccessModalOpen(false),
    confirmedPayment,
    confirmedCustomer,
    handleCheckout,
    handleDemoPaymentSuccess,
    handlePaymentFailure
  };
}
