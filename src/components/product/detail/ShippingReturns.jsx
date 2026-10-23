import React from 'react';
import { Truck, ShieldCheck, Package } from 'lucide-react';
import { STORE_POLICY } from '../../../data/products';

const ShippingReturns = () => (
  <dl className="pd-policy">
    <div>
      <dt><Truck size={18} /> Shipping</dt>
      <dd>
        {STORE_POLICY.freeShipping && 'Free shipping on every order. '}
        {STORE_POLICY.dispatch}; delivery usually takes {STORE_POLICY.deliveryEstimate}.
      </dd>
    </div>
    <div>
      <dt><ShieldCheck size={18} /> Payments</dt>
      <dd>Pay securely with {STORE_POLICY.payments}. Card details are handled by Razorpay and never touch our servers.</dd>
    </div>
    <div>
      <dt><Package size={18} /> Returns</dt>
      <dd>{STORE_POLICY.returns}</dd>
    </div>
  </dl>
);

export default ShippingReturns;
