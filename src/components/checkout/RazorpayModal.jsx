import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatINR } from '../../data/episodes';
import { Shield, Smartphone, CreditCard, Landmark, Wallet, X } from 'lucide-react';
import { customerShape } from '../../lib/propShapes';
import useDialog from '../../hooks/useDialog';

export default function RazorpayModal({
  isOpen,
  onClose,
  amount,
  customerDetails,
  onPaymentSuccess,
  onPaymentFailure
}) {
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [upiApp, setUpiApp] = useState('gpay');
  const [customUpi, setCustomUpi] = useState('');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [isProcessing, setIsProcessing] = useState(false);
  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleSimulatePayment = (success = true) => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (success) {
        // eslint-disable-next-line sonarjs/pseudo-random -- cosmetic only, not security-sensitive (demo id, replaced by the server order)
        const paymentId = 'pay_' + Math.random().toString(36).substring(2, 11).toUpperCase();
        const orderId = 'order_QC_' + Date.now().toString().slice(-6);
        onPaymentSuccess({
          paymentId,
          orderId,
          method: selectedMethod,
          amount,
          date: new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      } else {
        onPaymentFailure('Payment was cancelled or rejected by user/bank.');
      }
    }, 1200);
  };

  return (
    <div ref={dialogRef} className="razorpay-scrim" role="dialog" aria-modal="true" aria-label="Payment">
      <div className="razorpay-modal">
        {/* Header */}
        <div className="rzp-header">
          <div className="rzp-brand-info">
            <span className="rzp-logo-badge">QC</span>
            <div>
              <h3>Quirky Camel</h3>
              <p>The Complete Kit · 6 Attar Sachets</p>
            </div>
          </div>
          <div className="rzp-amount-badge">
            <span>Amount to Pay</span>
            <b>{formatINR(amount)}</b>
          </div>
          <button className="rzp-close" onClick={onClose} aria-label="Close payment modal">
            <X size={20} />
          </button>
        </div>

        {/* Test Mode Banner */}
        <div className="rzp-test-banner">
          <Shield size={16} />
          <span><b>Demo checkout</b> · Razorpay keys in .env are still placeholders, so no real payment is made. Add your test keys to use live Razorpay Checkout.</span>
        </div>

        {/* Customer Prefill Summary */}
        <div className="rzp-customer-bar">
          <span>Paying as: <b>{customerDetails?.name || 'Fragrance Enthusiast'}</b> ({customerDetails?.phone || '+91 98765 43210'})</span>
        </div>

        {/* Body Split */}
        <div className="rzp-body">
          {/* Methods sidebar */}
          <div className="rzp-methods-nav">
            <button
              className={`rzp-method-btn ${selectedMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('upi')}
            >
              <Smartphone size={18} />
              <span>UPI / QR</span>
            </button>
            <button
              className={`rzp-method-btn ${selectedMethod === 'card' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('card')}
            >
              <CreditCard size={18} />
              <span>Cards</span>
            </button>
            <button
              className={`rzp-method-btn ${selectedMethod === 'netbanking' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('netbanking')}
            >
              <Landmark size={18} />
              <span>Netbanking</span>
            </button>
            <button
              className={`rzp-method-btn ${selectedMethod === 'wallet' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('wallet')}
            >
              <Wallet size={18} />
              <span>Wallets</span>
            </button>
          </div>

          {/* Method Content */}
          <div className="rzp-method-content">
            {selectedMethod === 'upi' && (
              <div className="rzp-upi-view">
                <span className="rzp-section-title">Select your UPI App:</span>
                <div className="upi-app-options">
                  {[
                    { id: 'gpay', label: 'Google Pay', icon: '🟢' },
                    { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                    { id: 'paytm', label: 'Paytm UPI', icon: '🔵' },
                    { id: 'bhim', label: 'BHIM UPI', icon: '🟠' }
                  ].map((app) => (
                    <button
                      key={app.id}
                      className={`upi-app-btn ${upiApp === app.id ? 'selected' : ''}`}
                      onClick={() => setUpiApp(app.id)}
                    >
                      <span>{app.icon}</span>
                      <span>{app.label}</span>
                    </button>
                  ))}
                </div>

                <div className="rzp-divider">
                  <span>OR ENTER UPI ID</span>
                </div>

                <div className="upi-id-input-group">
                  <input
                    type="text"
                    placeholder="example@upi or mobile@okhdfcbank"
                    value={customUpi}
                    onChange={(e) => setCustomUpi(e.target.value)}
                  />
                  <span className="upi-verify-tag">Verified ✓</span>
                </div>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="rzp-card-view">
                <span className="rzp-section-title">Test Card Details (Pre-filled):</span>
                <div className="rzp-form-group">
                  <label htmlFor="rzp-card-number">Card Number</label>
                  <input
                    id="rzp-card-number"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="rzp-form-row">
                  <div className="rzp-form-group">
                    <label htmlFor="rzp-card-expiry">Valid Thru</label>
                    <input
                      id="rzp-card-expiry"
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="rzp-form-group">
                    <label htmlFor="rzp-card-cvv">CVV</label>
                    <input
                      id="rzp-card-cvv"
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="rzp-netbanking-view">
                <span className="rzp-section-title">Popular Banks:</span>
                <div className="banks-grid">
                  {['HDFC', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank'].map((bank) => (
                    <button
                      key={bank}
                      className={`bank-pill ${selectedBank === bank ? 'selected' : ''}`}
                      onClick={() => setSelectedBank(bank)}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="rzp-wallet-view">
                <span className="rzp-section-title">Select Wallet:</span>
                <div className="banks-grid">
                  {['Paytm Wallet', 'Amazon Pay', 'MobiKwik', 'Freecharge'].map((w) => (
                    <button key={w} className="bank-pill selected">
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="rzp-footer">
          <div className="rzp-security-note">
            <Shield size={14} /> Secured by 256-bit Razorpay encryption
          </div>

          <div className="rzp-action-buttons">
            <button
              className="rzp-fail-btn"
              onClick={() => handleSimulatePayment(false)}
              disabled={isProcessing}
            >
              Simulate Failure
            </button>
            <button
              className="rzp-pay-btn"
              onClick={() => handleSimulatePayment(true)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Authorizing with Bank…' : `Pay ${formatINR(amount)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

RazorpayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  amount: PropTypes.number.isRequired,
  customerDetails: customerShape,
  onPaymentSuccess: PropTypes.func.isRequired,
  onPaymentFailure: PropTypes.func.isRequired
};
