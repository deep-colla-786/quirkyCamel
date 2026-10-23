import React, { useEffect, useState } from 'react';
import { Mail, Inbox, Send } from 'lucide-react';
import { adminApi } from '../../lib/api';

export default function MailBar() {
  const [status, setStatus] = useState(null);
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminApi.mailStatus().then((r) => r.ok && setStatus(r.data));
  }, []);
  if (!status) return null;

  const test = async () => {
    setBusy(true);
    setResult(null);
    const r = await adminApi.testEmail(to.trim() || undefined);
    setBusy(false);
    setResult(r.ok ? { ok: true, msg: `Test email sent to ${r.data.to}. Check its inbox and spam folder.` } : { ok: false, msg: r.data.error });
  };

  if (!status.configured) {
    return (
      <div className="ad-mailbar warn" role="status">
        <Inbox size={18} />
        <div>
          <b>Email isn’t set up yet, so invoices are saved to the outbox folder instead of being sent.</b>
          <span>
            Add a Gmail App Password to <code>.env</code> (SMTP_USER and SMTP_PASS, steps are in the file), restart the server,
            then use “Resend emails” on these orders.
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="ad-mailbar ok">
      <Mail size={18} />
      <div>
        <b>Emails are sent from {status.from}</b>
        {result && <span className={result.ok ? 'ad-ok-text' : 'ad-bad-text'}>{result.msg}</span>}
      </div>
      <div className="ad-mailbar-test">
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Send test to (defaults to you)" aria-label="Test email recipient" />
        <button className="btn ghost-dark ad-btn-sm" onClick={test} disabled={busy}>
          <Send size={14} /> {busy ? 'Sending…' : 'Send test'}
        </button>
      </div>
    </div>
  );
}
