import React from 'react';
import PropTypes from 'prop-types';

/**
 * Top application header component.
 * Features branding, privacy tagline, "100% Client-Side" badge, and theme switcher.
 *
 * @param {Object} props
 * @param {'dark'|'light'} props.theme - Active UI theme ('dark' or 'light').
 * @param {function(): void} props.onToggleTheme - Theme toggle handler.
 * @returns {React.ReactElement} The Header component.
 */
export default function Header({ theme = 'dark', onToggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <header className="app-header" role="banner">
      <div className="header-glow" aria-hidden="true"></div>
      <div className="header-container">
        <div className="brand-group">
          <div className="brand-logo" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
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

        <div className="header-actions">
          {/* 100% Client-side Security Badge */}
          <div
            className="client-side-badge"
            title="All detection and redaction executes strictly inside your browser memory."
          >
            <span className="pulsing-dot" aria-hidden="true"></span>
            <svg
              width="13"
              height="13"
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

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle-btn btn btn-icon"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? (
              // Sun icon for switching to light mode
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // Moon icon for switching to dark mode
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light']),
  onToggleTheme: PropTypes.func.isRequired,
};
