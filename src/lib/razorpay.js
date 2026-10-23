import { api } from './api';

// Client side of Razorpay Standard Checkout. The server (server/razorpay.js)
// creates the order and verifies the signature; this file only opens the popup.
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise;
export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = CHECKOUT_SRC;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        scriptPromise = null; // allow a retry
        resolve(false);
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

const postJson = (path, body) => api(path, { method: 'POST', body });

/**
 * Opens Razorpay Checkout for the cart `items` ([{ slug, qty }]).
 * Resolves to one of:
 *   { status: 'paid', orderId, paymentId, method, amount }
 *   { status: 'auth' }  -> session missing or expired; caller asks the shopper to log in
 *   { status: 'dismissed' }
 *   { status: 'failed', error }
 *   { status: 'demo' }  -> keys are still the dummy placeholders; caller shows the demo checkout
 */
export async function startRazorpayCheckout({ items, customer }) {
  const order = await postJson('/razorpay/order', { items, customer });
  if (order.status === 401) return { status: 'auth' };
  if (order.data.configured === false) return { status: 'demo' };
  if (!order.ok) return { status: 'failed', error: order.data.error || 'Could not start payment.' };

  if (!(await loadRazorpayScript())) {
    return { status: 'failed', error: 'Could not load Razorpay. Check your connection and try again.' };
  }

  const { keyId, orderId, amount, currency } = order.data;

  return new Promise((resolve) => {
    let settled = false;
    const done = (result) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    // On 'payment.failed' Razorpay keeps the popup open with a retry option, so the
    // error is only reported if the shopper then closes the popup without paying.
    let lastError;

    const rzp = new window.Razorpay({
      key: keyId,
      order_id: orderId,
      amount,
      currency,
      name: 'Quirky Camel',
      description: `${items.reduce((n, i) => n + i.qty, 0)} item(s) from Quirky Camel`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      notes: { address: `${customer.addr}, ${customer.city} ${customer.pin}` },
      theme: { color: '#2259B2' },
      handler: async (response) => {
        const v = await postJson('/razorpay/verify', response);
        if (v.ok && v.data.verified) {
          done({ status: 'paid', orderId, paymentId: response.razorpay_payment_id, method: 'Razorpay', amount: amount / 100 });
        } else {
          done({
            status: 'failed',
            error: v.data.error || `Payment received but not verified. Contact us with payment ID ${response.razorpay_payment_id}.`
          });
        }
      },
      modal: {
        ondismiss: () => done(lastError ? { status: 'failed', error: lastError } : { status: 'dismissed' })
      }
    });
    rzp.on('payment.failed', (resp) => {
      lastError = resp?.error?.description || 'Payment failed.';
    });
    rzp.open();
  });
}
