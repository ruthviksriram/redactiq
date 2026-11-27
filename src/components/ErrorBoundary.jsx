import React from 'react';

/**
 * @file ErrorBoundary component providing a graceful, privacy-respecting fallback UI
 * in the rare event of an unhandled runtime error.
 */

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children - Child components to render within boundary.
 */

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - Whether an error was caught.
 * @property {Error|null} error - The caught error instance if any.
 */

/**
 * React ErrorBoundary component that catches JavaScript errors anywhere in their child
 * component tree, logs them safely without telemetry, and displays a friendly fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  /**
   * @param {ErrorBoundaryProps} props
   */
  constructor(props) {
    super(props);
    /** @type {ErrorBoundaryState} */
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates state so the next render will show the fallback UI.
   *
   * @param {Error} error - The unhandled error.
   * @returns {ErrorBoundaryState}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Safely captures error diagnostics in memory without external telemetry.
   *
   * @param {Error} _error - The error that occurred.
   * @param {React.ErrorInfo} _errorInfo - Stack trace information.
   * @returns {void}
   */
  componentDidCatch(_error, _errorInfo) {
    // In-memory capture only. Never send diagnostics or sensitive state across network.
  }

  /**
   * Resets error state to attempt re-rendering children.
   *
   * @returns {void}
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * Renders the child components or the error fallback UI.
   *
   * @returns {React.ReactNode}
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div
            className="tilt-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '2.5rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
              textAlign: 'center',
            }}
            role="alert"
            aria-live="assertive"
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }} aria-hidden="true">
              🛡️
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              An unexpected client-side error occurred. Your raw text and sensitive data remain strictly in your local browser memory and were not leaked.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-3d btn-primary"
                style={{ padding: '0.65rem 1.4rem' }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-3d btn-secondary"
                style={{ padding: '0.65rem 1.4rem' }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
