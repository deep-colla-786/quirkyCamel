import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import CartStep from './CartStep';
import ShippingStep from './ShippingStep';
import ReviewStep from './ReviewStep';
import { cartLineShape, productShape, userShape } from '../../lib/propShapes';
import { isValidEmail } from '../../lib/validation';
import useDialog from '../../hooks/useDialog';

const EMPTY_FORM = { name: '', email: '', phone: '', addr: '', city: '', state: '', pin: '', isgift: false, gift: '' };

// Cart drawer with a three-step checkout: cart → delivery address → review & pay.
export default function CartDrawer({
  isOpen,
  onClose,
  lines = [],
  total = 0,
  kit = null,
  onSetQty,
  onAddKit,
  onTriggerRazorpay,
  startStep = 'cart',
  serverError = '',
  isPaying = false,
  giftNote = null,
  user = null,
  onRequireLogin = (action) => action()
}) {
  const [step, setStep] = useState('cart'); // 'cart' | 'shipping' | 'review'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // A gift note entered on a product page carries into the delivery form.
  useEffect(() => {
    if (giftNote !== null) setFormData((d) => ({ ...d, isgift: true, gift: giftNote || d.gift }));
  }, [giftNote]);

  // Fill empty delivery fields from the account (saved at the previous checkout). When a
  // different account signs in (or the current one signs out), the previous person's
  // details are cleared first; details typed as a guest are kept when they log in.
  const formOwner = useRef(user?.id ?? null);
  useEffect(() => {
    const id = user?.id ?? null;
    if (formOwner.current !== null && formOwner.current !== id) {
      setFormData(EMPTY_FORM);
      setFormError('');
    }
    formOwner.current = id;
    if (!user) return;
    setFormData((d) => ({
      ...d,
      name: d.name || user.name || '',
      email: d.email || user.email || '',
      phone: d.phone || user.phone || '',
      addr: d.addr || user.address?.addr || '',
      city: d.city || user.address?.city || '',
      state: d.state || user.address?.state || '',
      pin: d.pin || user.address?.pin || ''
    }));
  }, [user]);

  // The server refused the delivery details: show why on the delivery form.
  useEffect(() => {
    if (serverError) setFormError(serverError);
  }, [serverError]);

  // Each time the drawer opens, start at the requested step ('Buy now' skips the cart).
  useEffect(() => {
    if (isOpen) setStep(lines.length > 0 ? startStep : 'cart');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startStep]);

  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  const subtotal = total;
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const required = ['name', 'email', 'phone', 'addr', 'city', 'state', 'pin'];
    const missing = required.filter((k) => !String(formData[k] || '').trim());

    if (missing.length > 0) {
      setFormError('Please fill out all delivery fields so we can dispatch your kit.');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setFormError('Please enter a valid email address for your order invoice.');
      return;
    }
    const phoneDigits = formData.phone.replace(/[\s+-]/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(formData.pin.trim())) {
      setFormError('PIN code must be a 6-digit number.');
      return;
    }

    setFormError('');
    setStep('review');
  };

  const handlePayNow = () => {
    if (onTriggerRazorpay) {
      onTriggerRazorpay({
        amount: subtotal,
        customer: formData,
        items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty }))
      });
    }
  };

  return (
    <>
      <div className="scrim on" onClick={onClose} aria-hidden="true" />

      <aside ref={dialogRef} className="drawer open" role="dialog" aria-modal="true" aria-label="Shopping Cart">
        <header>
          <h3>
            {step === 'cart' && 'Your Cart'}
            {step === 'shipping' && 'Delivery Address'}
            {step === 'review' && 'Order Review'}
          </h3>
          <button className="xbtn" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </header>

        <div className="dbody">
          {/* Step 1: Cart View */}
          {step === 'cart' && (
            <CartStep
              lines={lines}
              kit={kit}
              subtotal={subtotal}
              onSetQty={onSetQty}
              onAddKit={onAddKit}
              onClose={onClose}
              onCheckout={() => onRequireLogin(() => setStep('shipping'))}
            />
          )}

          {/* Step 2: Shipping Details Form */}
          {step === 'shipping' && (
            <ShippingStep
              formData={formData}
              formError={formError}
              onChange={handleInputChange}
              onSubmit={handleShippingSubmit}
              onBack={() => setStep('cart')}
            />
          )}

          {/* Step 3: Review & Pay via Razorpay */}
          {step === 'review' && (
            <ReviewStep
              lines={lines}
              itemCount={itemCount}
              formData={formData}
              subtotal={subtotal}
              isPaying={isPaying}
              onPay={handlePayNow}
              onBack={() => setStep('shipping')}
            />
          )}
        </div>
      </aside>
    </>
  );
}

CartDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lines: PropTypes.arrayOf(cartLineShape),
  total: PropTypes.number,
  kit: productShape,
  onSetQty: PropTypes.func.isRequired,
  onAddKit: PropTypes.func.isRequired,
  onTriggerRazorpay: PropTypes.func,
  startStep: PropTypes.oneOf(['cart', 'shipping', 'review']),
  serverError: PropTypes.string,
  isPaying: PropTypes.bool,
  giftNote: PropTypes.string,
  user: userShape,
  onRequireLogin: PropTypes.func
};
