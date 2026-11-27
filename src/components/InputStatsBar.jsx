import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders the character/word statistics and privacy reassurance badge for input text.
 *
 * @param {Object} props
 * @param {string} props.text - Current raw input text.
 * @returns {React.ReactElement}
 */
export default function InputStatsBar({ text }) {
  const charCount = text.length.toLocaleString();
  const wordCount = text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : 0;

  return (
    <div className="input-stats-bar">
      <span className="stats-text">
        {charCount} characters · {wordCount} words
      </span>
      <span className="stats-privacy-hint">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Processed locally in your browser · No network calls
      </span>
    </div>
  );
}

InputStatsBar.propTypes = {
  text: PropTypes.string.isRequired,
};
