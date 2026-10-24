import React from 'react';
import PropTypes from 'prop-types';
import { MapPin, Home, Warehouse } from 'lucide-react';
import { fmtWhen, placeName } from './deliveryFormat';
import { stopShape } from './shapes';

function stopIcon(stop, isFirst) {
  if (stop.destination) return <Home size={15} />;
  if (isFirst) return <Warehouse size={15} />;
  return <MapPin size={15} />;
}

// The parcel's route: every hub it has passed through, then the delivery address.
export default function RouteView({ route, currentLocation }) {
  return (
    <ol className="dl-route" aria-label="Route">
      {route.map((stop, i) => {
        const isCurrent = !stop.destination && stop.location === currentLocation;
        const reached = stop.destination ? stop.reached : true;
        let note = '';
        if (stop.destination) note = stop.reached ? 'Delivered here' : 'Your delivery address';
        else note = stop.firstAt ? fmtWhen(stop.firstAt) : 'Pickup point';
        return (
          <li
            key={`${stop.location}-${stop.firstAt || 'end'}`}
            className={`dl-stop ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''} ${stop.destination ? 'destination' : ''}`}
          >
            <span className="dl-stop-icon">{stopIcon(stop, i === 0)}</span>
            <span className="dl-stop-text">
              <b>{placeName(stop.location)}</b>
              <small>
                {isCurrent && <em>Package is here · </em>}
                {note}
              </small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

RouteView.propTypes = {
  route: PropTypes.arrayOf(stopShape).isRequired,
  currentLocation: PropTypes.string
};
