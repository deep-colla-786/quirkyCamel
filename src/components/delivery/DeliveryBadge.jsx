import React from 'react';
import { statusLabel, statusTone } from './deliveryFormat';
import { shipmentSummaryShape } from './shapes';

// Small status pill for order lists.
export default function DeliveryBadge({ shipment }) {
  return <span className={`dl-badge ${statusTone(shipment)}`}>{statusLabel(shipment)}</span>;
}

DeliveryBadge.propTypes = { shipment: shipmentSummaryShape };
