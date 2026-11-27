import { useState, useEffect, useMemo } from 'react';
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
 * detection computation, live side-by-side audit view, and theme toggle.
 *
 * @returns {JSX.Element} The main App view.
 */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('redactiq-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        return 'light';
      }
    } catch {
      // Fallback if storage access is blocked
    }
    return 'dark';
  });

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

  // Keep document attribute and localStorage in sync with theme state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('redactiq-theme', theme);
    } catch {
      // Ignore storage write issues
    }
  }, [theme]);

  // Debounce input by 200 ms to preserve high-framerate rendering during typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(rawText);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [rawText]);

  /**
   * Toggles active UI theme between dark and light modes.
   */
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  /**
   * Toggles detection for a specific entity type.
   * @param {string} type - Entity type key from ENTITY_TYPES.
   */
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
      <Header theme={theme} onToggleTheme={handleToggleTheme} />
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
