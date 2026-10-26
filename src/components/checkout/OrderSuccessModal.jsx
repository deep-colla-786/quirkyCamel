import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { formatINR, EPISODES } from '../../data/episodes';
import PropTypes from 'prop-types';
import { CheckCircle2, ArrowRight, X, Truck } from 'lucide-react';
import { catalogShape, customerShape } from '../../lib/propShapes';
import { STORE_POLICY } from '../../data/products';
import useDialog from '../../hooks/useDialog';

// A guest's tracking link carries the order's private token.
function trackHref({ trackId, trackToken }) {
  const query = trackToken ? '?t=' + encodeURIComponent(trackToken) : '';
  return `/track/${trackId}${query}`;
}

export default function OrderSuccessModal({
  isOpen,
  onClose,
  paymentData,
  customerData,
  items = [],
  catalog,
  onCreateAccount
}) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      } catch {
        // Confetti is decorative only; if it fails the confirmation still shows.
      }
    }
  }, [isOpen]);

  const dialogRef = useDialog(isOpen && Boolean(paymentData), onClose);

  if (!isOpen || !paymentData) return null;

  return (
    <div ref={dialogRef} className="order-success-scrim" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
      <div className="order-success-card">
        <button className="success-close-btn" onClick={onClose} aria-label="Close confirmation">
          <X size={20} />
        </button>

        <div className="success-header">
          <div className="success-icon-wrap">
            <CheckCircle2 size={48} color="#C4E539" />
          </div>
          <span className="success-tag">PAYMENT CONFIRMED VIA RAZORPAY</span>
          <h2 id="order-success-title">Your Quirky Camels are on the way!</h2>
          <p>We’ve received your order and are packing your sealed attar sachets in the collector box.</p>
        </div>

        {/* Order Metadata Box */}
        <div className="order-receipt-box">
          <div className="receipt-row">
            <div>
              <span className="r-label">Order Number</span>
              <b className="r-val">{paymentData.orderId}</b>
            </div>
            <div>
              <span className="r-label">Razorpay Payment ID</span>
              <b className="r-val r-code">{paymentData.paymentId}</b>
            </div>
          </div>

          <div className="receipt-row">
            <div>
              <span className="r-label">Total Amount Paid</span>
              <b className="r-val" style={{ color: 'var(--blue)' }}>{formatINR(paymentData.amount)}</b>
            </div>
            <div>
              <span className="r-label">Estimated Delivery</span>
              <b className="r-val">{STORE_POLICY.deliveryEstimate}</b>
            </div>
          </div>

          <div className="shipping-summary-box">
            <span className="r-label">Shipping To</span>
            <p className="shipping-address-text">
              <b>{customerData?.name}</b> · {customerData?.phone}<br />
              {customerData?.addr}, {customerData?.city} {customerData?.pin}
            </p>
            {customerData?.isgift && customerData?.gift && (
              <div className="receipt-gift-note">
                <span>Gift note attached:</span> “{customerData.gift}”
              </div>
            )}
          </div>

          {/* Sachets in package */}
          <div className="receipt-items-list">
            <span className="r-label">Items ordered:</span>
            <ul className="receipt-lines">
              {items.map((it) => {
                const p = catalog?.bySlug[it.slug];
                return (
                  <li key={it.slug}>
                    <span>{p?.name || it.slug} × {it.qty}</span>
                    {p?.price ? <b>{formatINR(p.price * it.qty)}</b> : null}
                  </li>
                );
              })}
            </ul>
            {items.some((it) => catalog?.bySlug[it.slug]?.type === 'kit') && (
              <div className="mini-sachets-row">
                {EPISODES.map((ep) => (
                  <div key={ep.id} className="mini-sachet-chip" style={{ borderColor: ep.pal.bg }}>
                    <span className="mini-dot" style={{ background: ep.pal.bg }} />
                    <span>{ep.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="receipt-mail">Your invoice will be emailed to {customerData?.email || 'you'}.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="success-actions">
          {paymentData.trackId && (
            <a className="btn ghost-dark" href={trackHref(paymentData)} onClick={onClose}>
              <Truck size={16} /> Track your order
            </a>
          )}
          <button className="btn blue" onClick={onClose}>
            Continue Exploring <ArrowRight size={16} />
          </button>
        </div>
        {onCreateAccount && paymentData.trackToken && (
          <p className="success-guest">
            Checked out as a guest? Your tracking link is above.{' '}
            <button type="button" onClick={() => onCreateAccount(paymentData)}>
              Create an account
            </button>{' '}
            to keep this order and see it any time.
          </p>
        )}
      </div>
    </div>
  );
}

OrderSuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  paymentData: PropTypes.shape({
    orderId: PropTypes.string,
    paymentId: PropTypes.string,
    amount: PropTypes.number,
    trackId: PropTypes.string,
    trackToken: PropTypes.string
  }),
  onCreateAccount: PropTypes.func,
  customerData: customerShape,
  items: PropTypes.arrayOf(PropTypes.shape({
    slug: PropTypes.string.isRequired,
    qty: PropTypes.number.isRequired
  })),
  catalog: catalogShape
};
