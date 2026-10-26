import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { INDIAN_STATES } from '../../data/states';
import { customerShape } from '../../lib/propShapes';

// Step 2: delivery address form.
export default function ShippingStep({ formData, formError, onChange, onSubmit, onBack }) {
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="steps">
        <i className="on" />
        <i className="on" />
        <i />
      </div>

      <label htmlFor="co-name">
        FULL NAME
        <input
          id="co-name"
          name="name"
          autoComplete="name"
          value={formData.name}
          onChange={onChange}
          required
        />
      </label>

      <div className="two">
        <label htmlFor="co-email">
          EMAIL ADDRESS
          <input
            id="co-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={onChange}
            required
          />
        </label>
        <label htmlFor="co-phone">
          PHONE NUMBER
          <input
            id="co-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={onChange}
            required
          />
        </label>
      </div>

      <label htmlFor="co-addr">
        DELIVERY ADDRESS
        <input
          id="co-addr"
          name="addr"
          autoComplete="street-address"
          value={formData.addr}
          onChange={onChange}
          required
        />
      </label>

      <div className="two">
        <label htmlFor="co-city">
          CITY
          <input
            id="co-city"
            name="city"
            autoComplete="address-level2"
            value={formData.city}
            onChange={onChange}
            required
          />
        </label>
        <label htmlFor="co-pin">
          PIN CODE
          <input
            id="co-pin"
            name="pin"
            autoComplete="postal-code"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.pin}
            onChange={onChange}
            maxLength={6}
            required
          />
        </label>
      </div>

      <label htmlFor="co-state">
        STATE
        <select id="co-state" name="state" autoComplete="address-level1" value={formData.state} onChange={onChange} required>
          <option value="">Choose your state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="check" htmlFor="co-isgift">
        <input
          type="checkbox"
          id="co-isgift"
          name="isgift"
          checked={formData.isgift}
          onChange={onChange}
        />
        This is a gift order (add a free gift note)
      </label>

      {formData.isgift && (
        <label htmlFor="co-gift">
          GIFT NOTE
          <textarea
            id="co-gift"
            name="gift"
            value={formData.gift}
            onChange={onChange}
            maxLength={200}
            placeholder="Enter your message here..."
          />
        </label>
      )}

      {formError && <p className="err">{formError}</p>}

      <div className="dfoot" style={{ marginTop: 16 }}>
        <button className="btn blue wide" type="submit">
          Review & Choose Payment <ArrowRight size={18} />
        </button>
        <button
          className="btn ghost-dark wide"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={16} /> Back to Cart
        </button>
      </div>
    </form>
  );
}

ShippingStep.propTypes = {
  formData: customerShape.isRequired,
  formError: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};
