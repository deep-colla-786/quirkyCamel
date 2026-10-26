import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ShoppingBag, Zap, Truck, ShieldCheck, Gift, Package } from 'lucide-react';
import { EPISODES, formatINR } from '../../../data/episodes';
import { KIT_SLUG, STORE_POLICY, MAX_QTY } from '../../../data/products';
import { kitSVG } from '../../../utils/svgGenerators';
import { productShape } from '../../../lib/propShapes';
import { deliveryApi } from '../../../lib/api';
import { fmtDay } from '../../delivery/deliveryFormat';

const PIN_RE = /^[1-9]\d{5}$/;

// Text for the delivery-time answer from /api/delivery/estimate.
function pinMessage(r) {
  const free = r.freeShipping ? ' Free shipping.' : '';
  if (r.kind === 'live' && !r.serviceable) return { ok: false, msg: `Sorry, our couriers don’t deliver to ${r.pin} yet.` };
  if (r.kind === 'live' && r.etd) return { ok: true, msg: `Delivers to ${r.pin} by ${fmtDay(r.etd)} if you order today.${free}` };
  if (r.kind === 'live') return { ok: true, msg: `We deliver to ${r.pin}.${free}` };
  return { ok: true, msg: `Typical delivery time to ${r.pin}: ${STORE_POLICY.dispatch.toLowerCase()}, then ${r.estimate}.${free}` };
}

// Buy box: pack / quantity, gift note, add-to-cart / buy-now and the delivery PIN check.
// `target` is what the buttons actually buy: the product itself, or the kit for a
// fragrance that has no price of its own.
export default function BuyPanel({ product, kit, target, available, onAddToCart, onBuyNow }) {
  const isKit = product.type === 'kit';
  const ep = product.episode;
  const KIT = kit; // null if the kit is hidden in the admin panel
  const buysKit = target !== product; // a fragrance without its own price
  const maxQty =
    target && target.stock !== null && target.stock !== undefined ? Math.max(1, Math.min(MAX_QTY, target.stock)) : MAX_QTY;
  const [qty, setQty] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftMsg, setGiftMsg] = useState('');
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState(null);

  const opts = () => ({ slug: target?.slug || KIT_SLUG, ...(isGift ? { gift: giftMsg.trim() } : {}) });

  // Asks the courier (when connected) whether this PIN is served and when; otherwise
  // shows the store's typical delivery time, labelled as typical.
  const checkPin = async (e) => {
    e.preventDefault();
    const code = pin.trim();
    if (!PIN_RE.test(code)) {
      setPinResult({ ok: false, msg: 'Enter a valid 6-digit PIN code.' });
      return;
    }
    setPinResult({ ok: true, msg: 'Checking…' });
    const res = await deliveryApi.estimate(code);
    setPinResult(res.ok ? pinMessage(res.data) : { ok: false, msg: res.data.error || 'Couldn’t check this PIN code right now.' });
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
      {!buysKit && (
        <div className="pd-qty-row">
          <span>
            Quantity
            {target.stock !== null && target.stock !== undefined && target.stock > 0 && target.stock <= 10 && (
              <em className="pd-stock-low"> · only {target.stock} left</em>
            )}
          </span>
          <div className="qty-selector">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
              −
            </button>
            <output aria-live="polite">{qty}</output>
            <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">
              +
            </button>
          </div>
        </div>
      )}
      {ep && buysKit && (
        <div className="pd-incl">
          <div className="pd-incl-art" dangerouslySetInnerHTML={{ __html: kitSVG(EPISODES, 'pdp-incl') }} />
          <div>
            <b>Sold in The Complete Kit</b>
            <p>
              {product.name} comes as a sealed sachet alongside the other five episodes. Sachets aren’t sold one by one.
            </p>
            {KIT ? <a href={`/product/${KIT.slug}`}>View the kit →</a> : <p>The kit is currently unavailable.</p>}
          </div>
        </div>
      )}
      {ep && !buysKit && KIT && (
        <p className="pd-also-kit">
          Also in <a href={`/product/${KIT.slug}`}>The Complete Kit</a>, with the other five episodes.
        </p>
      )}

      <label className="pd-gift">
        <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
        <Gift size={18} /> This is a gift: add a free gift note
      </label>
      {isGift && (
        <textarea
          className="pd-gift-msg"
          value={giftMsg}
          onChange={(e) => setGiftMsg(e.target.value)}
          maxLength={200}
          placeholder="Wear your weird. Happy birthday!"
          aria-label="Gift note"
        />
      )}

      {available ? (
        <div className="pd-ctas">
          <button className="btn blue" onClick={() => onAddToCart(qty, opts())}>
            <ShoppingBag size={19} /> {buysKit ? 'Add the kit to cart' : 'Add to cart'} · {formatINR(target.price * qty)}
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
