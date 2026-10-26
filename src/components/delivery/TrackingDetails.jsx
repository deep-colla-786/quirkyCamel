import React from 'react';
import PropTypes from 'prop-types';
import { Truck, MapPin, CalendarClock, AlertTriangle } from 'lucide-react';
import DeliveryProgress from './DeliveryProgress';
import RouteView from './RouteView';
import ScanTimeline from './ScanTimeline';
import { arrivalText, fmtWhen, placeName } from './deliveryFormat';
import { shipmentShape } from './shapes';
import { paths } from '../../lib/routes';

function ProblemNote({ shipment }) {
  if (shipment.state === 'active' || shipment.state === 'delivered') return null;
  const text = {
    exception: shipment.awb
      ? 'The courier reported a problem with this delivery. We’re on it and will update you here.'
      : 'We couldn’t book the courier for this order yet. We’ll try again shortly.',
    cancelled: (
      <>
        This shipment was cancelled. If you didn’t expect this, please <a href={paths.contact}>contact us</a>.
      </>
    ),
    returned: 'This shipment is on its way back to us. We’ll get in touch about a re-delivery or refund.'
  }[shipment.state];
  return (
    <p className="dl-problem" role="status">
      <AlertTriangle size={16} /> {text}
    </p>
  );
}

ProblemNote.propTypes = { shipment: shipmentShape.isRequired };

// Full delivery picture for one order: arrival date, courier, progress, route and
// every tracking event. Used on the store's tracking page and in the admin panel.
export default function TrackingDetails({ shipment, showInternal = false }) {
  return (
    <div className="dl-details">
      <div className="dl-hero">
        <div>
          <span className="dl-eyebrow">
            <CalendarClock size={15} /> Delivery
          </span>
          <h2>{arrivalText(shipment)}</h2>
          {shipment.currentLocation && shipment.stage !== 'delivered' && (
            <p className="dl-where">
              <MapPin size={15} /> Now at <b>{placeName(shipment.currentLocation)}</b>
            </p>
          )}
        </div>
        <dl className="dl-facts">
          <div>
            <dt>
              <Truck size={14} /> Courier
            </dt>
            <dd>{shipment.courierName || 'Being assigned'}</dd>
          </div>
          <div>
            <dt>Tracking no. (AWB)</dt>
            <dd className="mono">{shipment.awb || '—'}</dd>
          </div>
          {shipment.pickupScheduledDate && shipment.stage === 'ready' && (
            <div>
              <dt>Pickup scheduled</dt>
              <dd>{fmtWhen(shipment.pickupScheduledDate)}</dd>
            </div>
          )}
          {showInternal && (
            <div>
              <dt>Courier status</dt>
              <dd>{shipment.currentStatus}</dd>
            </div>
          )}
        </dl>
      </div>

      <ProblemNote shipment={shipment} />
      {showInternal && shipment.error && <p className="dl-problem">Booking error: {shipment.error}</p>}

      <DeliveryProgress stage={shipment.stage} state={shipment.state} />

      <div className="dl-columns">
        <section className="dl-panel">
          <h3>Route</h3>
          <RouteView route={shipment.route} currentLocation={shipment.currentLocation} />
        </section>
        <section className="dl-panel">
          <h3>Tracking history</h3>
          <ScanTimeline scans={shipment.scans} />
        </section>
      </div>
      {shipment.mode === 'demo' && (
        <p className="dl-demo-note">Demo courier: tracking updates are simulated until Shiprocket is connected.</p>
      )}
    </div>
  );
}

TrackingDetails.propTypes = {
  shipment: shipmentShape.isRequired,
  showInternal: PropTypes.bool
};
