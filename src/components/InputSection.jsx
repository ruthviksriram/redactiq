import React from 'react';
import PropTypes from 'prop-types';
import { SAMPLE_TEXT } from '../lib/sampleData.js';
import { useFileUpload } from '../hooks/useFileUpload.js';
import DragOverlay from './DragOverlay.jsx';
import FileBadge from './FileBadge.jsx';
import InputAlerts from './InputAlerts.jsx';
import InputStatsBar from './InputStatsBar.jsx';

/**
 * Input section component handling text pasting, drag-and-drop, file upload,
 * size checks, and sample data loading.
 *
 * @param {Object} props
 * @param {string} props.text - Current raw text input.
 * @param {function(string): void} props.onTextChange - Callback when text changes.
 * @param {string|null} [props.fileName] - Current active file name or null if pasted.
 * @param {function(string|null): void} props.onFileNameChange - Callback to update active file name.
 * @returns {React.ReactElement} The InputSection component.
 */
export default function InputSection({ text, onTextChange, fileName = null, onFileNameChange }) {
  const {
    isDragging,
    errorMessage,
    warningMessage,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    clearMessages,
  } = useFileUpload({ onTextChange, onFileNameChange });

  const handleLoadSample = () => {
    clearMessages();
    onTextChange(SAMPLE_TEXT);
    onFileNameChange('sample_support_ticket.txt');
  };

  const handleClear = () => {
    clearMessages();
    onTextChange('');
    onFileNameChange(null);
  };

  return (
    <section className="input-section tilt-card" aria-labelledby="input-section-heading">
      <div className="section-toolbar">
        <div className="toolbar-left">
          <h2 id="input-section-heading" className="section-title">
            Source Data
          </h2>
          <FileBadge fileName={fileName} onClear={handleClear} />
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            onClick={handleLoadSample}
            className="btn btn-primary btn-sm btn-3d"
            aria-label="Load pre-built realistic noisy sample with valid and invalid PII"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Load Sample
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-sm btn-3d"
            aria-label="Upload a .txt or .csv file"
          >
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload File
          </button>
          <label htmlFor="file-upload-input" className="visually-hidden">
            Upload file (.txt or .csv)
          </label>
          <input
            ref={fileInputRef}
            id="file-upload-input"
            name="file-upload-input"
            type="file"
            accept=".txt,.csv"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          {text && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-ghost btn-sm"
              aria-label="Clear all input text"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <InputAlerts errorMessage={errorMessage} warningMessage={warningMessage} />

      {/* Drag-and-drop Dropzone wrapping Textarea */}
      <div
        className={`dropzone-wrapper ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="raw-text-input" className="visually-hidden">
          Paste text or drop a file containing logs, tickets, or CSV data
        </label>
        <textarea
          id="raw-text-input"
          name="raw-text-input"
          className="text-input-area"
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value);
            if (fileName && !e.target.value) {
              onFileNameChange(null);
            }
          }}
          placeholder="Paste text, log entries, tickets, or CSV rows here, or drag & drop a .txt / .csv file..."
          rows={9}
          spellCheck={false}
        />
        {isDragging && <DragOverlay />}
      </div>

      <InputStatsBar text={text} />
    </section>
  );
}

InputSection.propTypes = {
  text: PropTypes.string.isRequired,
  onTextChange: PropTypes.func.isRequired,
  fileName: PropTypes.string,
  onFileNameChange: PropTypes.func.isRequired,
};
