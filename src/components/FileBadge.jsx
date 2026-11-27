import React from 'react';
import PropTypes from 'prop-types';

/**
 * File badge indicator showing active file name and a 1-click removal action.
 *
 * @param {Object} props
 * @param {string|null} props.fileName - Current active file name.
 * @param {function(): void} props.onClear - Clear action handler.
 * @returns {React.ReactElement|null}
 */
export default function FileBadge({ fileName, onClear }) {
  if (!fileName) return null;

  return (
    <div className="file-badge" title="Active source file">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="file-badge-name">{fileName}</span>
      <button
        type="button"
        onClick={onClear}
        className="file-badge-remove"
        aria-label={`Remove file ${fileName}`}
      >
        ×
      </button>
    </div>
  );
}

FileBadge.propTypes = {
  fileName: PropTypes.string,
  onClear: PropTypes.func.isRequired,
};

FileBadge.defaultProps = {
  fileName: null,
};
