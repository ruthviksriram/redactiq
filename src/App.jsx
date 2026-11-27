import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import InputSection from './components/InputSection.jsx';
import { detectEntities } from './lib/detectors.js';

/**
 * Main application coordinator component for RedactIQ.
 * Manages raw input text, 200ms debounce cycle, file metadata, and detection state.
 *
 * @returns {React.ReactElement} The main App view.
 */
export default function App() {
  const [rawText, setRawText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [fileName, setFileName] = useState(null);

  // 200 ms debounce to prevent UI freezes on rapid keystrokes or large text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(rawText);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [rawText]);

  // Run entity detection with useMemo on debounced input
  const detectionResult = useMemo(() => {
    if (!debouncedText) {
      return { matches: [], luhnFailedCount: 0 };
    }
    return detectEntities(debouncedText);
  }, [debouncedText]);

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content" id="main-content">
        <InputSection
          text={rawText}
          onTextChange={setRawText}
          fileName={fileName}
          onFileNameChange={setFileName}
        />

        {/* Phase 2 preview status */}
        <div className="phase-status-card" role="region" aria-label="Detection Engine Status">
          <div className="status-header">
            <span className="status-indicator"></span>
            <span className="status-title">Detection Engine Live</span>
            {debouncedText && (
              <span className="status-badge">
                {detectionResult.matches.length} entities detected · {detectionResult.luhnFailedCount} Luhn-failed numbers filtered
              </span>
            )}
          </div>
          <p className="status-description">
            {debouncedText
              ? `Client-side detector parsed ${debouncedText.length.toLocaleString()} characters in memory without network transmission.`
              : 'Paste text or load sample above to detect and classify PII.'}
          </p>
        </div>
      </main>
    </div>
  );
}
