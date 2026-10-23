import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { adminApi } from '../../lib/api';

// Shows an order's invoice exactly as it was emailed to the customer. The HTML is
// rendered in a sandboxed frame, so it can't run scripts or touch the dashboard.
export default function InvoiceModal({ order, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const closeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    adminApi.invoice(order.id).then((res) => {
      if (cancelled) return;
      if (res.ok) setInvoice(res.data);
      else setError(res.data.error || 'Could not load the invoice.');
    });
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = `Invoice ${invoice?.invoiceNumber || order.invoice || ''}`.trim();

  return (
    <div className="ad-modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal ad-invoice-modal" role="dialog" aria-modal="true" aria-labelledby="inv-title">
        <header>
          <div>
            <h2 id="inv-title">{title}</h2>
            <small className="ad-muted">
              {order.customer.name} · {order.account}
            </small>
          </div>
          <button ref={closeRef} type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close invoice">
            <X size={18} />
          </button>
        </header>
        {error && <p className="ad-error ad-invoice-msg">{error}</p>}
        {!error && !invoice && <p className="ad-muted ad-invoice-msg">Loading invoice…</p>}
        {invoice && <iframe className="ad-invoice-frame" title={title} sandbox="" srcDoc={invoice.html} />}
      </div>
    </div>
  );
}

InvoiceModal.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    invoice: PropTypes.string,
    account: PropTypes.string,
    customer: PropTypes.shape({ name: PropTypes.string }).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};
