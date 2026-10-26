// Date and order-item formatting shared by the admin tables.

export { fmtDate } from '../../lib/format';
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const itemsText = (items) => items.map((it) => `${it.name} × ${it.qty}`).join(', ');
