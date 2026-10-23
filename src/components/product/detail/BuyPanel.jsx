import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ShoppingBag, Zap, Truck, ShieldCheck, Gift, Package } from 'lucide-react';
import { EPISODES, formatINR } from '../../../data/episodes';
import { KIT_SLUG, STORE_POLICY, MAX_QTY } from '../../../data/products';
import { kitSVG } from '../../../utils/svgGenerators';
import { productShape } from '../../../lib/propShapes';

// Buy box: pack / quantity, gift note, add-to-cart / buy-now and the delivery PIN check.
// `target` is what the buttons actually buy: the product itself, or the kit for a fragrance page.
export default function BuyPanel({ product, kit, target, available, onAddToCart, onBuyNow }) {
  const isKit = product.type === 'kit';
  const isExtra = product.type === 'product';
  const ep = product.episode;
  const KIT = kit; // null if the kit is hidden in the admin panel
  const maxQty =
    target && target.stock !== null && target.stock !== undefined ? Math.max(1, Math.min(MAX_QTY, target.stock)) : MAX_QTY;
  const [qty, setQty] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftMsg, setGiftMsg] = useState('');
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState(null);

  const opts = () => ({ slug: target?.slug || KIT_SLUG, ...(isGift ? { gift: giftMsg.trim() } : {}) });

  const checkPin = (e) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin.trim())) {
      setPinResult({ ok: false, msg: 'Enter a valid 6-digit PIN code.' });
      return;
    }
    setPinResult({
      ok: true,
      msg: `Estimated delivery to ${pin.trim()}: ${STORE_POLICY.deliveryEstimate}.${STORE_POLICY.freeShipping ? ' Free shipping.' : ''}`
    });
  };

  return (
    <div className="pd-buy">
      {isKit ? (
        <>
          <fieldset className="pd-packs">
            <legend>Choose your pack</legend>
            <div className="pd-pack-row">
              {product.packs.map((p) => (
                <label key={p.qty} className={`pd-pack ${qty === p.qty ? 'on' : ''}`}>
                  <input type="radio" name="pack" checked={qty === p.qty} onChange={() => setQty(p.qty)} />
                  <b>{p.label}</b>
                  <small>{p.note}</small>
                  <span>{formatINR(product.price * p.qty)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}
      {(isKit || isExtra) && (
        <div className="pd-qty-row">
          <span>
            Quantity
            {target.stock !== null && target.stock !== undefined && target.stock > 0 && target.stock <= 10 && (
              <em className="pd-stock-low"> · only {target.stock} left</em>
            )}
          </span>
          <div className="qty-selector">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity">+</button>
          </div>
        </div>
      )}
      {ep && (
        <div className="pd-incl">
          <div className="pd-incl-art" dangerouslySetInnerHTML={{ __html: kitSVG(EPISODES) }} />
          <div>
            <b>Sold in The Complete Kit</b>
            <p>
              {product.name} comes as a sealed sachet alongside the other five episodes. Sachets aren’t sold one by one.
            </p>
            {KIT ? <a href={`#product/${KIT.slug}`}>View the kit →</a> : <p>The kit is currently unavailable.</p>}
          </div>
        </div>
      )}

      <label className="pd-gift">
        <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
        <Gift size={18} /> This is a gift: add a free note
      </label>
      {isGift && (
        <textarea
          className="pd-gift-msg"
          value={giftMsg}
          onChange={(e) => setGiftMsg(e.target.value)}
          maxLength={200}
          placeholder="Wear your weird. Happy birthday!"
          aria-label="Gift message"
        />
      )}

      {available ? (
        <div className="pd-ctas">
          <button className="btn blue" onClick={() => onAddToCart(qty, opts())}>
            <ShoppingBag size={19} /> {ep ? 'Add the kit to cart' : 'Add to cart'} · {formatINR(target.price * qty)}
          </button>
          <button className="btn lime" onClick={() => onBuyNow(qty, opts())}>
            <Zap size={19} fill="currentColor" /> Buy now
          </button>
        </div>
      ) : (
        <p className="pd-soldout">Currently out of stock. Save it with the heart and check back soon.</p>
      )}

      <form className="pd-pin" onSubmit={checkPin}>
        <Truck size={18} />
        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter PIN code for delivery estimate"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          aria-label="Delivery PIN code"
        />
        <button type="submit">Check</button>
      </form>
      {pinResult && <p className={`pd-pin-msg ${pinResult.ok ? 'ok' : 'err'}`}>{pinResult.msg}</p>}

      <ul className="pd-assure">
        <li><ShieldCheck size={17} /> Secure Razorpay checkout</li>
        <li><Truck size={17} /> {STORE_POLICY.freeShipping ? 'Free shipping' : STORE_POLICY.dispatch}</li>
        <li><Package size={17} /> Sealed, spill-free sachets</li>
      </ul>
    </div>
  );
}

BuyPanel.propTypes = {
  product: productShape.isRequired,
  kit: productShape,
  target: productShape,
  available: PropTypes.bool.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired
};
