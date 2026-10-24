// Delivery settings from .env. With an API user's email + password, shipments go to
// Shiprocket; otherwise a built-in demo courier simulates the journey so the whole flow
// can be tried end to end (like the Razorpay demo checkout).
const num = (v, fallback) => (Number(v) > 0 ? Number(v) : fallback);

export function deliveryConfig(env) {
  const email = String(env.SHIPROCKET_EMAIL || '').trim();
  const password = String(env.SHIPROCKET_PASSWORD || '');
  return {
    live: Boolean(email && password),
    email,
    password,
    pickupLocation: String(env.SHIPROCKET_PICKUP_LOCATION || 'Primary').trim(),
    // Where parcels start (used for the demo route; live pickups use the Shiprocket location).
    pickupCity: String(env.SHIPROCKET_PICKUP_CITY || 'Mumbai').trim(),
    pickupState: String(env.SHIPROCKET_PICKUP_STATE || 'Maharashtra').trim(),
    webhookToken: String(env.SHIPROCKET_WEBHOOK_TOKEN || ''),
    // Parcel size for the kit-sized box (cm) and weight per item (kg).
    box: {
      length: num(env.SHIPROCKET_BOX_LENGTH_CM, 22),
      breadth: num(env.SHIPROCKET_BOX_BREADTH_CM, 16),
      height: num(env.SHIPROCKET_BOX_HEIGHT_CM, 8)
    },
    weightPerItemKg: num(env.SHIPROCKET_WEIGHT_PER_ITEM_KG, 0.3),
    // Demo courier: minutes between simulated tracking events.
    demoStepMinutes: num(env.SHIPROCKET_DEMO_STEP_MINUTES, 2)
  };
}

// Path Shiprocket posts tracking updates to. Shiprocket rejects webhook URLs containing
// "shiprocket", "kartrocket", "sr" or "kr", so the name avoids them.
export const WEBHOOK_PATH = '/api/delivery/updates';
