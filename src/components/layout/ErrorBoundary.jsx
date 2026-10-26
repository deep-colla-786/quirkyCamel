import React from 'react';
import PropTypes from 'prop-types';

// Catches any rendering error so the page shows a way out instead of going blank.
// Used around the whole store and the whole admin panel.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('[app] page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="error-screen" role="alert">
        <span className="icon" />
        <h1>Something went wrong</h1>
        <p>Sorry, this page hit a problem. Reloading usually fixes it; your cart is saved.</p>
        <div className="error-actions">
          <button type="button" className="btn blue" onClick={() => globalThis.location.reload()}>
            Reload
          </button>
          <a className="btn ghost-dark" href={this.props.homeHref}>
            Go to the home page
          </a>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  homeHref: PropTypes.string
};

ErrorBoundary.defaultProps = { homeHref: '/' };
