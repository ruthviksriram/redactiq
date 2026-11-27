import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import InputSection from './components/InputSection.jsx';
import ControlsBar from './components/ControlsBar.jsx';
import SummaryBar from './components/SummaryBar.jsx';
import AuditView from './components/AuditView.jsx';
import { detectEntities } from './lib/detectors.js';
import { redactText } from './lib/redact.js';
import { ENTITY_TYPES, REDACTION_MODES } from './lib/constants.js';

/**
 * Main application coordinator component for RedactIQ.
 * Seamlessly manages raw input, 200ms debounce, entity filters, redaction mode,
 * detection computation, and live side-by-side audit view.
 *
 * @returns {React.ReactElement} The main App view.
 */
export default function App() {
  const [rawText, setRawText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [fileName, setFileName] = useState(null);
  const [mode, setMode] = useState(REDACTION_MODES.FULL);
  const [enabledTypes, setEnabledTypes] = useState({
    [ENTITY_TYPES.EMAIL]: true,
    [ENTITY_TYPES.PHONE]: true,
    [ENTITY_TYPES.IP]: true,
    [ENTITY_TYPES.PAN]: true,
    [ENTITY_TYPES.AADHAAR]: true,
    [ENTITY_TYPES.CREDIT_CARD]: true,
  });

  // Debounce input by 200 ms to preserve high-framerate rendering during typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(rawText);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [rawText]);

  // Toggle individual entity types
  const handleToggleType = (type) => {
    setEnabledTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Pure memoized entity detection
  const detectionResult = useMemo(() => {
    if (!debouncedText) {
      return { matches: [], luhnFailedCount: 0 };
    }
    return detectEntities(debouncedText, enabledTypes);
  }, [debouncedText, enabledTypes]);

  // Pure memoized redaction transformation
  const redactionResult = useMemo(() => {
    if (!debouncedText) {
      return { sanitizedText: '', replacements: [], mapping: [] };
    }
    return redactText(debouncedText, detectionResult.matches, mode);
  }, [debouncedText, detectionResult.matches, mode]);

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

        <ControlsBar
          mode={mode}
          onModeChange={setMode}
          enabledTypes={enabledTypes}
          onToggleType={handleToggleType}
        />

        <SummaryBar
          matches={detectionResult.matches}
          luhnFailedCount={detectionResult.luhnFailedCount}
          enabledTypes={enabledTypes}
        />

        <AuditView
          originalText={debouncedText}
          matches={detectionResult.matches}
          sanitizedText={redactionResult.sanitizedText}
          replacements={redactionResult.replacements}
          mode={mode}
        />
      </main>
    </div>
  );
}
