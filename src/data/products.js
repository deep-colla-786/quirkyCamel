// Store catalog: one buyable product (the Complete Kit) plus a product page for
// each of the six fragrances, which are sold only inside the kit.
// Shipping/returns copy and spec claims live here so they can be edited in one place.
import { EPISODES, PRICE, ORIGINAL_PRICE, KIT_SPECIFICATIONS, OCC_LABELS, MOOD_LABELS } from './episodes.js';

export const KIT_SLUG = 'the-complete-kit';
export const MAX_QTY = 10;

export const STORE_POLICY = {
  freeShipping: true,
  dispatch: 'Dispatched within 1–2 business days',
  deliveryEstimate: '3–7 business days after dispatch',
  payments: 'UPI, cards, net banking and wallets via Razorpay',
  returns:
    'Sachets are sealed personal-care items, so opened kits can’t be returned. If your kit arrives damaged or something is missing, write to us within 48 hours of delivery with a photo and we’ll replace it.'
};

export const KIT = {
  slug: KIT_SLUG,
  type: 'kit',
  name: 'The Complete Kit',
  eyebrow: 'All six episodes · One box',
  tagline: 'Every situation, ready for whatever your day turns into.',
  description:
    'The whole Quirky Camel series in one collector box: sealed attar sachets of all six fragrance episodes, plus a snap pouch and carabiner to carry today’s pick. Lost in an oasis, out after dark, fresh from the shower: switch situations whenever your day does.',
  // Getters read the live kit pricing (see applyKitPricing in episodes.js).
  get price() {
    return PRICE;
  },
  get mrp() {
    return ORIGINAL_PRICE;
  },
  get discountPct() {
    return ORIGINAL_PRICE > PRICE ? Math.round(((ORIGINAL_PRICE - PRICE) / ORIGINAL_PRICE) * 100) : 0;
  },
  stock: null,
  inStock: true,
  inside: [
    ['6 sealed attar sachets', 'One for each episode, from Trouble in Oasis to Oud But Different.'],
    ['Collector box', 'Gift-ready packaging that holds the whole series.'],
    ['Snap pouch', 'Carries today’s sachet in your pocket or bag.'],
    ['Carabiner', 'Clips the pouch to a backpack, belt loop or tote.'],
    ['Drawstring bag', 'A soft travel bag for the box or spare sachets.']
  ],
  specs: KIT_SPECIFICATIONS,
  packs: [
    { qty: 1, label: '1 Kit', note: 'For you' },
    { qty: 2, label: '2 Kits', note: 'One to gift' },
    { qty: 3, label: '3 Kits', note: 'Share the series' }
  ]
};

export const FRAGRANCES = EPISODES.map((e) => ({
  slug: e.id,
  type: 'fragrance',
  name: e.name,
  eyebrow: `Episode 0${e.n} · Attar sachet`,
  tagline: e.headline,
  description: e.body,
  episode: e,
  moods: e.f.mood.map((m) => MOOD_LABELS[m]),
  occasionTags: e.f.occ.map((o) => OCC_LABELS[o])
}));

export const PRODUCTS = [KIT, ...FRAGRANCES];
export const PRODUCTS_BY_SLUG = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));

// Customer reviews per product slug. Empty until real orders ship; the product
// page shows an empty state rather than placeholder ratings.
export const REVIEWS = {};

export const productHash = (slug) => `#product/${slug}`;
