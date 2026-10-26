import React from 'react';
import PropTypes from 'prop-types';
import { Zap, ArrowLeft } from 'lucide-react';
import { formatINR } from '../../data/episodes';
import LineThumb from './LineThumb';
import { paths } from '../../lib/routes';
import { cartLineShape, customerShape } from '../../lib/propShapes';

// Step 3: order summary and the Razorpay pay button.
export default function ReviewStep({ lines, itemCount, formData, subtotal, isPaying, onPay, onBack }) {
  return (
    <div className="review-step-container">
      <div className="steps">
        <i className="on" />
        <i className="on" />
        <i className="on" />
      </div>

      {lines.map(({ product, qty }) => (
        <div className="line" key={product.slug}>
          <LineThumb product={product} />
          <div>
            <b>
              {product.name} × {qty}
            </b>
            <small>{formatINR(product.price)} each</small>
            <b>{formatINR(product.price * qty)}</b>
          </div>
        </div>
      ))}
      <p className="review-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>

      <div className="fact" style={{ padding: '14px 16px', fontSize: '13.5px', lineHeight: 1.5 }}>
        <b>Shipping To:</b>
        <br />
        {formData.name} · {formData.phone}
        <br />
        {formData.addr}, {formData.city}, {formData.state} - {formData.pin}
        {formData.isgift && formData.gift && (
          <>
            <br />
            <br />
            <b>Gift note:</b> “{formData.gift}”
          </>
        )}
      </div>

      <div className="gate" style={{ background: '#f5f7ff', borderColor: 'var(--blue)' }}>
        <Zap size={20} color="var(--blue)" style={{ margin: '0 auto 6px' }} />
        <b style={{ color: 'var(--blue)' }}>Instant Payment with Razorpay</b>
        <span>Supports UPI (Google Pay, PhonePe, Paytm), Cards, NetBanking, and Wallets.</span>
      </div>

      <div style={{ flex: 1 }} />

      <div className="totals">
        <div className="grand">
          <span>Grand Total</span>
          <span>{formatINR(subtotal)}</span>
        </div>
      </div>

      <p className="checkout-privacy">
        By placing this order you agree to our <a href={paths.terms}>Terms</a>,{' '}
        <a href={paths.refunds}>Refund policy</a> and <a href={paths.privacy}>Privacy policy</a>. Your address is shared
        only with our payment and delivery partners.
      </p>

      <div className="dfoot">
        <button className="btn lime wide" onClick={onPay} disabled={isPaying}>
          <Zap size={18} fill="currentColor" />{' '}
          {isPaying ? 'Opening Razorpay…' : `Pay with Razorpay · ${formatINR(subtotal)}`}
        </button>
        <button className="btn ghost-dark wide" onClick={onBack}>
          <ArrowLeft size={16} /> Edit Address
        </button>
      </div>
    </div>
  );
}

ReviewStep.propTypes = {
  lines: PropTypes.arrayOf(cartLineShape).isRequired,
  itemCount: PropTypes.number.isRequired,
  formData: customerShape.isRequired,
  subtotal: PropTypes.number.isRequired,
  isPaying: PropTypes.bool.isRequired,
  onPay: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};
