// PropTypes shapes for the data the admin API returns.
import PropTypes from 'prop-types';

export const emailResultShape = PropTypes.shape({
  status: PropTypes.string,
  to: PropTypes.string,
  error: PropTypes.string,
  file: PropTypes.string
});

export const orderShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  invoice: PropTypes.string,
  account: PropTypes.string,
  customer: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
    addr: PropTypes.string,
    city: PropTypes.string,
    pin: PropTypes.string,
    gift: PropTypes.string
  }).isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, qty: PropTypes.number })).isRequired,
  amount: PropTypes.number.isRequired,
  status: PropTypes.string,
  mode: PropTypes.string,
  paymentId: PropTypes.string,
  emails: PropTypes.shape({ customer: emailResultShape, admin: emailResultShape }),
  delivery: PropTypes.shape({ stage: PropTypes.string, state: PropTypes.string, awb: PropTypes.string }),
  createdAt: PropTypes.string
});

export const productShape = PropTypes.shape({
  slug: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  price: PropTypes.number,
  mrp: PropTypes.number,
  stock: PropTypes.number,
  active: PropTypes.bool,
  image: PropTypes.string,
  builtIn: PropTypes.bool,
  unitsSold: PropTypes.number,
  eyebrow: PropTypes.string,
  inside: PropTypes.arrayOf(PropTypes.shape({ title: PropTypes.string, detail: PropTypes.string })),
  specs: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })),
  packs: PropTypes.arrayOf(PropTypes.shape({ qty: PropTypes.number, label: PropTypes.string, note: PropTypes.string })),
  scent: PropTypes.string,
  scentTags: PropTypes.arrayOf(PropTypes.string)
});

export const statsShape = PropTypes.shape({
  users: PropTypes.number,
  orders: PropTypes.number,
  revenue: PropTypes.number,
  days: PropTypes.arrayOf(PropTypes.object)
});
