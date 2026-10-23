import React from 'react';
import { emailResultShape } from '../utils/shapes';
import { Mail, CheckCircle2, AlertTriangle, Inbox } from 'lucide-react';

// Delivery status of an order email: sent, saved to outbox, failed or pending.
export default function EmailBadge({ e }) {
  if (!e) return <span className="ad-badge muted">Pending</span>;
  const map = {
    sent: ['ok', CheckCircle2, 'Sent'],
    outbox: ['info', Inbox, 'Outbox'],
    failed: ['bad', AlertTriangle, 'Failed']
  };
  const [cls, Icon, label] = map[e.status] || ['muted', Mail, e.status];
  return (
    <span className={`ad-badge ${cls}`} title={e.error || e.file || e.to}>
      <Icon size={12} /> {label}
    </span>
  );
}

EmailBadge.propTypes = {
  e: emailResultShape
};
