import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { SAMPLE_TEXT } from '../lib/sampleData.js';
import { sanitizeFileName } from '../lib/validators.js';
import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_EXTENSIONS } from '../lib/constants.js';

/**
 * Input section component handling text pasting, drag-and-drop, file upload,
 * size checks, and sample data loading.
 *
 * @param {Object} props
 * @param {string} props.text - Current raw text input.
 * @param {function(string): void} props.onTextChange - Callback when text changes.
 * @param {string|null} props.fileName - Current active file name or null if pasted.
 * @param {function(string|null): void} props.onFileNameChange - Callback to update active file name.
 * @returns {React.ReactElement} The InputSection component.
 */
export default function InputSection({ text, onTextChange, fileName, onFileNameChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const fileInputRef = useRef(null);

  /**
   * Validates and reads an uploaded file.
   *
   * @param {File} file - The file to process.
   */
  const handleProcessFile = (file) => {
    setErrorMessage('');
    setWarningMessage('');

    if (!file) return;

    // Check extension
    const nameLower = file.name.toLowerCase();
    const hasValidExt = ALLOWED_FILE_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
    if (!hasValidExt) {
      setErrorMessage(`Unsupported file format. Please upload a .txt or .csv file.`);
      return;
    }

    // Check size (> 5 MB warning)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setWarningMessage(
        `File size is ${sizeMb} MB (above 5 MB). Detection may take a few seconds.`
      );
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onTextChange(content);
        onFileNameChange(sanitizeFileName(file.name));
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please check permissions and try again.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
    // Reset file input so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = () => {
    setErrorMessage('');
    setWarningMessage('');
    onTextChange(SAMPLE_TEXT);
    onFileNameChange('sample_support_ticket.txt');
  };

  const handleClear = () => {
    setErrorMessage('');
    setWarningMessage('');
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
          {fileName && (
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
                onClick={handleClear}
                className="file-badge-remove"
                aria-label={`Remove file ${fileName}`}
              >
                ×
              </button>
            </div>
          )}
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
              <polyline points="17 8 12 3 7 8" />
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

      {/* Error and Warning Live Alerts */}
      <div aria-live="polite">
        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {warningMessage && (
          <div className="alert alert-warning" role="status">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{warningMessage}</span>
          </div>
        )}
      </div>

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
        {isDragging && (
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
        )}
      </div>

      <div className="input-stats-bar">
        <span className="stats-text">
          {text.length.toLocaleString()} characters ·{' '}
          {text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : 0} words
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
    </section>
  );
}

InputSection.propTypes = {
  text: PropTypes.string.isRequired,
  onTextChange: PropTypes.func.isRequired,
  fileName: PropTypes.string,
  onFileNameChange: PropTypes.func.isRequired,
};

InputSection.defaultProps = {
  fileName: null,
};
