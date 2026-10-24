// Labels and date formatting shared by the store's tracking page and the admin panel.
export const STEPS = [
  ['placed', 'Order placed'],
  ['ready', 'Packed & ready'],
  ['picked', 'Picked up'],
  ['transit', 'In transit'],
  ['out', 'Out for delivery'],
  ['delivered', 'Delivered']
];

export const stepIndex = (stage) => STEPS.findIndex(([id]) => id === stage);

// Short status for badges: problems first, then the step reached.
export function statusLabel(shipment) {
  if (!shipment) return 'Preparing shipment';
  if (shipment.state === 'cancelled') return 'Cancelled';
  if (shipment.state === 'returned') return 'Returning to sender';
  if (shipment.state === 'exception') return shipment.awb ? 'Delivery issue' : 'Booking failed';
  return STEPS[stepIndex(shipment.stage)]?.[1] || 'Processing';
}

export function statusTone(shipment) {
  if (!shipment) return 'muted';
  if (shipment.state === 'delivered' || shipment.stage === 'delivered') return 'ok';
  if (shipment.state === 'active') return 'info';
  return 'bad';
}

const IN = 'en-IN';
export const fmtDay = (d) => (d ? new Date(d).toLocaleDateString(IN, { weekday: 'short', day: 'numeric', month: 'short' }) : '');
export const fmtDayLong = (d) =>
  d ? new Date(d).toLocaleDateString(IN, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString(IN, { hour: '2-digit', minute: '2-digit' }) : '');
export const fmtWhen = (d) => (d ? `${fmtDay(d)}, ${fmtTime(d)}` : '');

// "Mumbai_MiraRdIndEstate_I (Maharashtra)" -> "Mumbai MiraRdIndEstate I (Maharashtra)"
export const placeName = (location) => String(location || '').replaceAll('_', ' ');

// Headline for the delivery date.
export function arrivalText(shipment) {
  if (!shipment) return 'We’re preparing your shipment';
  if (shipment.deliveredAt) return `Delivered on ${fmtDayLong(shipment.deliveredAt)}`;
  if (shipment.state === 'cancelled') return 'This shipment was cancelled';
  if (shipment.state === 'returned') return 'This shipment is returning to us';
  if (shipment.etd) return `Arriving by ${fmtDayLong(shipment.etd)}`;
  return 'Delivery date will appear once the courier confirms pickup';
}
