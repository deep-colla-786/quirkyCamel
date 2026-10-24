import PropTypes from 'prop-types';

// Delivery data as the API returns it (order summary or full tracking).
export const shipmentSummaryShape = PropTypes.shape({
  awb: PropTypes.string,
  courierName: PropTypes.string,
  stage: PropTypes.string,
  state: PropTypes.string,
  etd: PropTypes.string,
  deliveredAt: PropTypes.string
});

export const scanShape = PropTypes.shape({
  at: PropTypes.string,
  activity: PropTypes.string,
  location: PropTypes.string,
  label: PropTypes.string,
  stage: PropTypes.string
});

export const stopShape = PropTypes.shape({
  location: PropTypes.string.isRequired,
  firstAt: PropTypes.string,
  lastAt: PropTypes.string,
  destination: PropTypes.bool,
  reached: PropTypes.bool
});

export const shipmentShape = PropTypes.shape({
  orderId: PropTypes.string,
  invoiceNumber: PropTypes.string,
  mode: PropTypes.string,
  courierName: PropTypes.string,
  awb: PropTypes.string,
  currentStatus: PropTypes.string,
  stage: PropTypes.string,
  state: PropTypes.string,
  etd: PropTypes.string,
  pickupScheduledDate: PropTypes.string,
  deliveredAt: PropTypes.string,
  origin: PropTypes.string,
  currentLocation: PropTypes.string,
  route: PropTypes.arrayOf(stopShape),
  scans: PropTypes.arrayOf(scanShape),
  error: PropTypes.string
});
