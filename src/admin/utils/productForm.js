// Form state for the product editor: built-in defaults, the discount maths, and the
// conversion to the fields the API expects.
import { KIT, FRAGRANCES } from '../../data/products';
import { withKey, withoutKey } from './rowKeys';

const BUILT_IN = Object.fromEntries([KIT, ...FRAGRANCES].map((p) => [p.slug, p]));

// The copy the storefront shows for a built-in product until it's edited here.
function builtInDefaults(product) {
  const base = product && BUILT_IN[product.slug];
  if (!base) return { eyebrow: '', inside: [], specs: [], packs: [], scent: '', scentTags: [] };
  return {
    eyebrow: base.eyebrow || '',
    inside: (base.inside || []).map(([title, detail]) => ({ title, detail })),
    specs: base.specs || [],
    packs: base.packs || [],
    scent: base.episode?.scent || '',
    scentTags: base.episode?.scentTags || []
  };
}

// True for numbers above zero; false for '', 0, negatives and anything that isn't a number.
export const isPositive = (v) => Number(v) > 0;

const orBlank = (v) => (v === null || v === undefined ? '' : String(v));

// Whole-number discount for a price and MRP, or '' when there is none.
export function discountFrom(price, mrp) {
  const p = Number(price);
  const m = Number(mrp);
  if (!isPositive(p) || m <= p) return '';
  return String(Math.round(((m - p) / m) * 100));
}

// The selling price for an MRP and a discount percentage (0–99), or null if either is invalid.
export function priceFromDiscount(mrp, discount) {
  const m = Number(mrp);
  const d = Number(discount);
  const validDiscount = discount !== '' && d >= 0 && d < 100;
  if (!isPositive(m) || !validDiscount) return null;
  return String(Math.round(m * (1 - d / 100)));
}

export function initialForm(product) {
  const defaults = builtInDefaults(product);
  const price = orBlank(product?.price);
  const mrp = orBlank(product?.mrp);
  return {
    name: product?.name || '',
    eyebrow: product?.eyebrow || defaults.eyebrow,
    tagline: product?.tagline || '',
    description: product?.description || '',
    price,
    mrp,
    discount: discountFrom(price, mrp),
    stock: orBlank(product?.stock),
    active: product ? product.active : true,
    image: product?.image || null,
    inside: (product?.inside || defaults.inside).map(withKey),
    specs: (product?.specs || defaults.specs).map(withKey),
    packs: (product?.packs || defaults.packs).map((p) => withKey({ ...p, qty: String(p.qty) })),
    scent: product?.scent || defaults.scent,
    scentTags: (product?.scentTags || defaults.scentTags).join(', ')
  };
}

// Client-side checks before saving; returns an error message or ''.
// A fragrance may leave the price empty (then it's sold only inside the kit).
export function validate(form, { priceRequired }) {
  if (form.name.trim().length < 2) return 'Enter a product name.';
  if (form.price === '') {
    if (priceRequired) return 'Enter a selling price.';
    return form.mrp === '' ? '' : 'Enter a selling price, or clear the MRP.';
  }
  if (!isPositive(form.price)) return 'Enter a valid selling price.';
  if (form.mrp !== '' && Number(form.mrp) < Number(form.price)) return 'MRP must be at least the selling price.';
  return '';
}

const rows = (list) => list.map(withoutKey);
const blankToNull = (v) => (v === '' ? null : Number(v));

// The fields sent to the API for this product type.
export function toFields(form, product) {
  const type = product?.type || 'product';
  const fields = {
    name: form.name,
    eyebrow: form.eyebrow,
    tagline: form.tagline,
    description: form.description,
    stock: blankToNull(form.stock),
    active: form.active,
    price: blankToNull(form.price),
    mrp: blankToNull(form.mrp),
    specs: rows(form.specs)
  };
  if (type !== 'fragrance') fields.inside = rows(form.inside);
  if (type === 'kit') fields.packs = rows(form.packs).map((p) => ({ ...p, qty: Number(p.qty) }));
  if (type === 'fragrance') {
    fields.scent = form.scent;
    fields.scentTags = form.scentTags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (!product?.builtIn) fields.image = form.image;
  return fields;
}
