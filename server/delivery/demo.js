// Demo courier, used until Shiprocket credentials are configured. It plans a realistic
// route from the pickup city to the customer's city and reveals one tracking event every
// `demoStepMinutes`, in the same shape Shiprocket's webhook sends.
import crypto from 'node:crypto';

const COURIER = 'Delhivery Surface (demo)';
const hub = (city, state, kind = 'Hub') => `${city}_${kind} (${state})`;

// The events the parcel will go through, in order (no dates yet).
export function planRoute({ pickupCity, pickupState = 'Maharashtra', city, state }) {
  const origin = hub(pickupCity, pickupState);
  const gateway = hub(pickupCity, pickupState, 'Mega_GW');
  const destination = hub(city, state || '');
  const sameCity = city.trim().toLowerCase() === pickupCity.trim().toLowerCase();
  const steps = [
    ['X-UCI', 'Manifested - Manifest uploaded', origin, '5', 'MANIFEST GENERATED'],
    ['X-PPOM', 'In Transit - Shipment picked up', origin, '42', 'PICKED UP'],
    ['X-PIOM', 'In Transit - Shipment Received at Origin Center', origin, '6', 'SHIPPED'],
    ['X-DLL2F', 'In Transit - Bag Added To Trip', origin, '18', 'IN TRANSIT']
  ];
  if (!sameCity) {
    steps.push(
      ['X-ILL2F', 'In Transit - Trip Arrived', gateway, '18', 'IN TRANSIT'],
      ['X-DLL2F', 'In Transit - Bag Added To Trip', gateway, '18', 'IN TRANSIT']
    );
  }
  steps.push(
    ['X-ILL1F', 'In Transit - Bag Received at Facility', destination, '38', 'REACHED AT DESTINATION HUB'],
    ['X-DDO', 'Out for Delivery - Shipment out for delivery', destination, '17', 'OUT FOR DELIVERY'],
    ['X-DDD', 'Delivered - Shipment delivered', destination, '7', 'DELIVERED']
  );
  return steps.map(([status, activity, location, srStatus, label]) => ({
    status,
    activity,
    location,
    'sr-status': srStatus,
    'sr-status-label': label
  }));
}

// What Shiprocket returns when an AWB is assigned, for the demo courier.
export function demoBooking(now, plan, stepMinutes) {
  const awb = `DEMO${crypto.randomInt(1e9, 1e10)}`;
  return {
    awb,
    courierName: COURIER,
    srOrderId: null,
    shipmentId: null,
    pickupScheduledDate: new Date(now.getTime() + stepMinutes * 60e3),
    etd: new Date(now.getTime() + (plan.length + 1) * stepMinutes * 60e3)
  };
}

// Formats a Date as Shiprocket does ("2023-05-19 11:59:16", Indian time).
export function istString(date) {
  const ist = new Date(date.getTime() + 330 * 60e3);
  return ist.toISOString().slice(0, 19).replace('T', ' ');
}
