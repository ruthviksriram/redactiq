import React from 'react';

/**
 * Visual drag-and-drop overlay displayed when dragging files over the dropzone.
 *
 * @returns {React.ReactElement}
 */
export default function DragOverlay() {
  return (
    <div className="drag-overlay" aria-hidden="true">
      <div className="drag-overlay-content">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p>Drop .txt or .csv file here to redact</p>
      </div>
    </div>
  );
}
