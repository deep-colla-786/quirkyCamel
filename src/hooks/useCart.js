import { useState, useEffect } from 'react';
import { readStore, writeStore } from '../lib/storage';
import { KIT_SLUG, MAX_QTY } from '../data/products';
import { isBuyable, inStock } from '../lib/catalog';

// Most of one product a cart may hold: the per-line cap, or less when stock is limited.
const maxFor = (product) => (product.stock === null || product.stock === undefined ? MAX_QTY : Math.min(MAX_QTY, product.stock));

// Why a product can't be added right now, or '' if it can.
function unavailableReason(product) {
  if (!isBuyable(product)) return 'This product is currently unavailable.';
  return inStock(product) ? '' : `${product.name} is out of stock right now.`;
}

// Cart contents (persisted per browser) and the cart drawer.
export default function useCart({ catalog, showToast, requireLogin }) {
  // Cart: { [slug]: qty }. Older visits stored only a kit count, so migrate that.
  const [cart, setCart] = useState(() => {
    const saved = readStore('qc-cart', null);
    if (saved && typeof saved === 'object') return saved;
    const kits = Math.max(0, Math.min(MAX_QTY, Number(readStore('qc-kit-qty', 0)) || 0));
    return kits ? { [KIT_SLUG]: kits } : {};
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStartStep, setCartStartStep] = useState('cart');
  const [giftNote, setGiftNote] = useState(null);

  useEffect(() => writeStore('qc-cart', cart), [cart]);

  // Cart lines resolved against the catalog; unavailable products drop out.
  const cartLines = Object.entries(cart)
    .map(([slug, qty]) => ({ product: catalog.bySlug[slug], qty }))
    .filter((l) => isBuyable(l.product) && l.qty > 0);
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cartLines.reduce((n, l) => n + l.qty * l.product.price, 0);
  const setLineQty = (slug, qty) =>
    setCart((c) => {
      const next = { ...c };
      if (qty > 0) next[slug] = Math.min(MAX_QTY, qty);
      else delete next[slug];
      return next;
    });

  const openCart = () => {
    setCartStartStep('cart');
    setIsCartOpen(true);
  };

  // Opens the drawer at a given checkout step ('cart' | 'shipping' | 'review').
  const openCartAt = (step) => {
    setCartStartStep(step);
    setIsCartOpen(true);
  };

  const handleAddToCart = (qty = 1, opts = {}) => {
    const slug = opts.slug || KIT_SLUG;
    const product = catalog.bySlug[slug];
    const problem = unavailableReason(product);
    if (problem) return showToast(problem);
    if (opts.gift !== undefined) setGiftNote(opts.gift);
    setCart((c) => ({ ...c, [slug]: Math.min(maxFor(product), (c[slug] || 0) + qty) }));
    const qtyNote = qty > 1 ? ` (×${qty})` : '';
    showToast(`${product.name} added to cart${qtyNote}`);
    setCartStartStep('cart');
    setIsCartOpen(true);
  };

  // 'Buy now' goes straight to the delivery step of the cart drawer.
  const handleInstantBuyNow = (qty = 1, opts = {}) => {
    const slug = opts.slug || KIT_SLUG;
    const product = catalog.bySlug[slug];
    const problem = unavailableReason(product);
    if (problem) return showToast(problem);
    if (opts.gift !== undefined) setGiftNote(opts.gift);
    setCart((c) => ({ ...c, [slug]: Math.max(c[slug] || 0, Math.min(maxFor(product), qty)) }));
    requireLogin(() => {
      setCartStartStep('shipping');
      setIsCartOpen(true);
    });
  };

  return {
    cart,
    setCart,
    cartLines,
    cartCount,
    cartTotal,
    setLineQty,
    isCartOpen,
    setIsCartOpen,
    openCart,
    openCartAt,
    cartStartStep,
    giftNote,
    handleAddToCart,
    handleInstantBuyNow
  };
}
