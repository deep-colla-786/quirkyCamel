// PropTypes shapes for the storefront's shared data, so every component validates
// products, episodes, the catalog and the user the same way.
import PropTypes from 'prop-types';

export const paletteShape = PropTypes.shape({
  bg: PropTypes.string,
  soft: PropTypes.string,
  deep: PropTypes.string,
  ink: PropTypes.string,
  title: PropTypes.string,
  accent: PropTypes.string,
  accent2: PropTypes.string,
  btnBg: PropTypes.string,
  btnInk: PropTypes.string,
  hl: PropTypes.string,
  heroInk: PropTypes.string
});

export const episodeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  n: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  headline: PropTypes.string,
  world: PropTypes.string,
  body: PropTypes.string,
  scent: PropTypes.string,
  scentTags: PropTypes.arrayOf(PropTypes.string),
  occasions: PropTypes.arrayOf(PropTypes.string),
  traits: PropTypes.arrayOf(PropTypes.string),
  persona: PropTypes.string,
  f: PropTypes.shape({
    mood: PropTypes.arrayOf(PropTypes.string),
    occ: PropTypes.arrayOf(PropTypes.string),
    scent: PropTypes.arrayOf(PropTypes.string)
  }),
  look: PropTypes.string,
  audience: PropTypes.string,
  note: PropTypes.string,
  pending: PropTypes.bool,
  pal: paletteShape.isRequired
});

export const productShape = PropTypes.shape({
  slug: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['kit', 'fragrance', 'product']).isRequired,
  name: PropTypes.string.isRequired,
  eyebrow: PropTypes.string,
  tagline: PropTypes.string,
  description: PropTypes.string,
  price: PropTypes.number,
  mrp: PropTypes.number,
  discountPct: PropTypes.number,
  stock: PropTypes.number,
  image: PropTypes.string,
  episode: episodeShape,
  moods: PropTypes.arrayOf(PropTypes.string),
  inside: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  specs: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })),
  packs: PropTypes.arrayOf(PropTypes.shape({ qty: PropTypes.number, label: PropTypes.string, note: PropTypes.string }))
});

export const catalogShape = PropTypes.shape({
  products: PropTypes.arrayOf(productShape).isRequired,
  bySlug: PropTypes.objectOf(productShape).isRequired,
  kit: productShape,
  fragrances: PropTypes.arrayOf(productShape).isRequired,
  extras: PropTypes.arrayOf(productShape).isRequired
});

export const cartLineShape = PropTypes.shape({
  product: productShape.isRequired,
  qty: PropTypes.number.isRequired
});

export const addressShape = PropTypes.shape({
  addr: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  pin: PropTypes.string
});

export const userShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string,
  role: PropTypes.string,
  address: addressShape
});

// Delivery details collected at checkout.
export const customerShape = PropTypes.shape({
  name: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  addr: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  pin: PropTypes.string,
  isgift: PropTypes.bool,
  gift: PropTypes.string
});
