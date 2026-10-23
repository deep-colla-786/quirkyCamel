import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Send } from 'lucide-react';
import { adminApi } from '../../lib/api';

export default function ResendButton({ orderId, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <>
      <button
        className="ad-link"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr('');
          const r = await adminApi.resendEmails(orderId);
          setBusy(false);
          if (!r.ok) setErr(r.data.error || 'Could not resend.');
          onDone();
        }}
      >
        <Send size={13} /> {busy ? 'Sending…' : 'Resend emails'}
      </button>
      {err && <small className="ad-bad-text">{err}</small>}
    </>
  );
}

ResendButton.propTypes = {
  orderId: PropTypes.string.isRequired,
  onDone: PropTypes.func.isRequired
};
