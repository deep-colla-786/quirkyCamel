import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
            value={formData.pin}
            onChange={onChange}
            maxLength={6}
            required
          />
        </label>
      </div>

      <label className="check" htmlFor="co-isgift">
        <input
          type="checkbox"
          id="co-isgift"
          name="isgift"
          checked={formData.isgift}
          onChange={onChange}
        />
        This is a gift order (Include complimentary handwritten note)
      </label>

      {formData.isgift && (
        <label htmlFor="co-gift">
          GIFT MESSAGE
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
