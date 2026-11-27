import React from 'react';

/**
 * Top application header component.
 * Features app branding, privacy tagline, and a 100% client-side security badge.
 *
 * @returns {React.ReactElement} The Header component.
 */
export default function Header() {
  return (
    <header className="app-header" role="banner">
      <div className="header-container">
        <div className="brand-group">
          <div className="brand-logo" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shield-icon"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">RedactIQ</h1>
              <span className="version-pill">v1.0 MVP</span>
            </div>
            <p className="brand-tagline">Redact PII. Nothing leaves your browser.</p>
          </div>
        </div>

        <div className="header-badges">
          <div
            className="client-side-badge"
            title="All detection and redaction executes strictly inside your browser memory."
          >
            <span className="pulsing-dot" aria-hidden="true"></span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="badge-text">100% Client-Side</span>
          </div>
        </div>
      </div>
    </header>
  );
}
