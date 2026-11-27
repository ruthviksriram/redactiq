import React, { useState } from 'react';

/**
 * @file Export bar component providing 1-click download and clipboard copying.
 * Guarantees that exported content is pure sanitized text without any UI labels or badges.
 */

/**
 * @param {object} props
 * @param {string} props.sanitizedText - Plain sanitized text from redaction engine.
 * @param {string} [props.fileName] - Original uploaded filename if any.
 * @returns {React.JSX.Element}
 */
export default function ExportBar({ sanitizedText, fileName = '' }) {
  const [copied, setCopied] = useState(false);

  const hasContent = Boolean(sanitizedText && sanitizedText.trim().length > 0);

  // Compute clean output filename preserving original extension
  const cleanOriginalName = fileName ? fileName.trim() : '';
  const isCsv = cleanOriginalName.toLowerCase().endsWith('.csv');
  const exportFileName = cleanOriginalName
    ? `sanitized_${cleanOriginalName}`
    : 'sanitized_output.txt';

  /**
   * Downloads the sanitized text as a pure text or CSV file.
   */
  const handleDownload = () => {
    if (!hasContent) return;

    const mimeType = isCsv
      ? 'text/csv;charset=utf-8'
      : 'text/plain;charset=utf-8';

    const blob = new Blob([sanitizedText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  /**
   * Copies the pure sanitized text to user clipboard with temporary feedback.
   */
  const handleCopy = async () => {
    if (!hasContent) return;

    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback for environments with strict clipboard permissions
      const textArea = document.createElement('textarea');
      textArea.value = sanitizedText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        /* copy failure silent fallback */
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <section className="export-bar-card card-3d" aria-label="Export Actions">
      <div className="export-info">
        <div className="export-title-row">
          <span className="export-icon" aria-hidden="true">💾</span>
          <div>
            <h2 className="export-title">Export Sanitized Output</h2>
            <p className="export-subtitle">
              Pure redacted text only &mdash; entity badges, labels, and original sensitive mappings are never included in exports.
            </p>
          </div>
        </div>
        {cleanOriginalName && (
          <div className="export-file-badge">
            <span className="export-badge-label">Target file:</span>
            <code className="export-badge-filename">{exportFileName}</code>
          </div>
        )}
      </div>

      <div className="export-actions">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasContent}
          className={`btn btn-3d btn-secondary copy-btn ${copied ? 'btn-copied' : ''}`}
          aria-label={copied ? 'Copied to clipboard' : 'Copy sanitized text to clipboard'}
        >
          {copied ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy to clipboard</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasContent}
          className="btn btn-3d btn-primary download-btn"
          aria-label={`Download sanitized file as ${exportFileName}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download sanitized file</span>
        </button>
      </div>
    </section>
  );
}
