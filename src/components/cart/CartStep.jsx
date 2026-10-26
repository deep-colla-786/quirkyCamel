import React from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, Trash2 } from 'lucide-react';
import { formatINR, EPISODES } from '../../data/episodes';
import { MAX_QTY } from '../../data/products';
import LineThumb from './LineThumb';
import { cartLineShape, productShape } from '../../lib/propShapes';

// Step 1: cart lines, kit upsell and totals (or the empty state).
export default function CartStep({ lines, kit, subtotal, onSetQty, onAddKit, onClose, onCheckout }) {
  return lines.length > 0 ? (
    <>
      {lines.map(({ product, qty }) => {
        const capped = product.stock !== null && product.stock !== undefined ? Math.min(MAX_QTY, product.stock) : MAX_QTY;
        return (
          <div className="line" key={product.slug}>
            <LineThumb product={product} />
            <div>
              <b>
                <a href={`/product/${product.slug}`} onClick={onClose}>
                  {product.name}
                </a>
              </b>
              {product.type === 'kit' ? (
                <>
                  <div className="mini-six">
                    {EPISODES.map((e) => (
                      <i key={e.id} style={{ background: e.pal.bg }} title={e.name} />
                    ))}
                  </div>
                  <small>6 sealed attar sachets, collector box, snap pouch, carabiner and drawstring bag.</small>
                </>
              ) : (
                <small>{product.tagline}</small>
              )}
              <div className="row">
                <div className="qty">
                  <button
                    onClick={() => onSetQty(product.slug, Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    aria-label={`Decrease ${product.name}`}
                  >
                    −
                  </button>
                  <output aria-live="polite">{qty}</output>
                  <button
                    onClick={() => onSetQty(product.slug, Math.min(capped, qty + 1))}
                    disabled={qty >= capped}
                    aria-label={`Increase ${product.name}`}
                  >
                    +
                  </button>
                </div>
                <span className="line-price">{formatINR(product.price * qty)}</span>
              </div>
              <button className="rm" onClick={() => onSetQty(product.slug, 0)}>
                <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {kit && !lines.some((l) => l.product.type === 'kit') && (
        <div className="upsell">
          <span>
            <b>Add the Complete Kit?</b> All six fragrance episodes in one box.
          </span>
          <button onClick={onAddKit}>Add to cart</button>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div className="totals">
        <div>
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <div>
          <span>Shipping</span>
          <span className="free-ship">FREE</span>
        </div>
        <div className="grand">
          <span>Total Amount</span>
          <span>{formatINR(subtotal)}</span>
        </div>
      </div>

      <div className="dfoot">
        <button
          className="btn blue wide"
          onClick={onCheckout}
        >
          Proceed to checkout <ArrowRight size={18} />
        </button>
        <button className="btn ghost-dark wide" onClick={onClose}>
          Continue browsing
        </button>
      </div>
    </>
  ) : (
    <div className="empty-cart">
      <span className="icon" style={{ height: 70, color: 'var(--lime)', margin: '0 auto 12px' }} />
      <p>
        <b>Your cart is currently empty.</b>
        <br />
        The complete kit contains sachets of all six fragrance episodes.
      </p>
      {kit && (
        <button className="btn blue" style={{ marginTop: 12 }} onClick={onAddKit}>
          Add the kit to cart · {formatINR(kit.price)}
        </button>
      )}
      <a className="btn ghost-dark" style={{ marginTop: 10 }} href="/shop" onClick={onClose}>
        Browse the shop
      </a>
    </div>
  );
}

CartStep.propTypes = {
  lines: PropTypes.arrayOf(cartLineShape).isRequired,
  kit: productShape,
  subtotal: PropTypes.number.isRequired,
  onSetQty: PropTypes.func.isRequired,
  onAddKit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired
};
