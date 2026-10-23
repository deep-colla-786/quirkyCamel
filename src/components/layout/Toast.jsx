import React from 'react';
import PropTypes from 'prop-types';

export default function Toast({ message }) {
  return (
    <div className={`toast ${message ? 'on' : ''}`} role="status">
      {message}
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string
};
