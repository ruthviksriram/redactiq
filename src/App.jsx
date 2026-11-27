import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import InputSection from './components/InputSection.jsx';
import ControlsBar from './components/ControlsBar.jsx';
import SummaryBar from './components/SummaryBar.jsx';
import AuditView from './components/AuditView.jsx';
import ExportBar from './components/ExportBar.jsx';
import MappingTable from './components/MappingTable.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import CustomRulesSection from './components/CustomRulesSection.jsx';
import { useCardTilt, useButtonGlow } from './lib/useEffects3D.js';
import { detectEntities } from './lib/detectors.js';
import { redactText } from './lib/redact.js';
import {
  calculateRiskScore,
  generateRiskSummary,
  evaluateComplianceTags,
  generateAuditReport,
} from './lib/risk.js';
import {
  ENTITY_TYPES,
  REDACTION_MODES,
  OVERRIDE_OPTIONS,
  DEFAULT_CUSTOM_TYPE_MODES,
  DEBOUNCE_DELAY_MS,
} from './lib/constants.js';

/**
 * Main application coordinator component for RedactIQ.
 * Seamlessly manages raw input, 200ms debounce, entity filters, redaction mode,
 * detection computation, live side-by-side audit view, theme toggle, and 3D visual effects.
 *
 * @returns {JSX.Element} The main App view.
 */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('redactiq-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Fallback if storage access is blocked
    }
    return 'light';
  });

  const [rawText, setRawText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [fileName, setFileName] = useState(null);
  const [mode, setMode] = useState(REDACTION_MODES.FULL);
  const [typeModes, setTypeModes] = useState(DEFAULT_CUSTOM_TYPE_MODES);
  const [overrides, setOverrides] = useState({});
  const [customRules, setCustomRules] = useState([]);
  const [strictChecksum, setStrictChecksum] = useState(true);
  const [enabledTypes, setEnabledTypes] = useState({
    [ENTITY_TYPES.EMAIL]: true,
    [ENTITY_TYPES.PHONE]: true,
    [ENTITY_TYPES.IP]: true,
    [ENTITY_TYPES.PAN]: true,
    [ENTITY_TYPES.AADHAAR]: true,
    [ENTITY_TYPES.CREDIT_CARD]: true,
    [ENTITY_TYPES.CUSTOM_RULE]: true,
  });

  // Enable subtle 3D card tilt and button interactive glows
  useCardTilt();
  useButtonGlow();

  // Keep document attribute and localStorage in sync with theme state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('redactiq-theme', theme);
    } catch {
      // Ignore storage write issues
    }
  }, [theme]);

  // Debounce input to preserve high-framerate rendering during typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(rawText);
    }, DEBOUNCE_DELAY_MS);

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

  /**
   * Changes default redaction mode for a specific entity type in Custom mode.
   * @param {string} type - Entity type.
   * @param {string} newMode - Redaction mode.
   */
  const handleTypeModeChange = (type, newMode) => {
    setTypeModes((prev) => ({
      ...prev,
      [type]: newMode,
    }));
  };

  /**
   * Updates or clears a per-item override for a normalized entity.
   * @param {string} key - Composite key (e.g. EMAIL::test@example.com).
   * @param {string} option - Selected option from OVERRIDE_OPTIONS.
   */
  const handleOverrideChange = (key, option) => {
    setOverrides((prev) => {
      if (option === OVERRIDE_OPTIONS.DEFAULT) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: option,
      };
    });
  };

  /**
   * Resets all per-item overrides back to defaults.
   */
  const handleResetOverrides = () => {
    setOverrides({});
  };

  // Pure memoized entity detection
  const detectionResult = useMemo(() => {
    if (!debouncedText) {
      return { matches: [], luhnFailedCount: 0, verhoeffFailedCount: 0 };
    }
    return detectEntities(debouncedText, enabledTypes, customRules, { strict: strictChecksum });
  }, [debouncedText, enabledTypes, customRules, strictChecksum]);

  // Pure memoized redaction transformation
  const redactionResult = useMemo(() => {
    if (!debouncedText) {
      return { sanitizedText: '', replacements: [], mapping: [], excludedCount: 0 };
    }
    return redactText(debouncedText, detectionResult.matches, {
      mode,
      typeModes,
      overrides,
    });
  }, [debouncedText, detectionResult.matches, mode, typeModes, overrides]);

  // Pure memoized risk score computation
  const riskScore = useMemo(() => {
    return calculateRiskScore(detectionResult.matches, overrides, enabledTypes);
  }, [detectionResult.matches, overrides, enabledTypes]);

  // Auto-generated plain English risk summary
  const riskSummary = useMemo(() => {
    return generateRiskSummary(detectionResult.matches, riskScore, mode, {
      luhnFailedCount: detectionResult.luhnFailedCount || 0,
      verhoeffFailedCount: detectionResult.verhoeffFailedCount || 0,
      strict: strictChecksum,
    });
  }, [
    detectionResult.matches,
    detectionResult.luhnFailedCount,
    detectionResult.verhoeffFailedCount,
    riskScore,
    mode,
    strictChecksum,
  ]);

  // Regulatory compliance framework mapping (PCI-DSS, DPDP Act 2023, GDPR)
  const complianceTags = useMemo(() => {
    return evaluateComplianceTags(detectionResult.matches, overrides, enabledTypes);
  }, [detectionResult.matches, overrides, enabledTypes]);

  // Pure zero-PII audit report data object
  const auditReportData = useMemo(() => {
    return generateAuditReport({
      mode,
      matches: detectionResult.matches,
      luhnFailedCount: detectionResult.luhnFailedCount,
      verhoeffFailedCount: detectionResult.verhoeffFailedCount || 0,
      excludedCount: redactionResult.excludedCount || 0,
      riskScore,
      complianceTags,
    });
  }, [mode, detectionResult, redactionResult.excludedCount, riskScore, complianceTags]);

  return (
    <div className="app-shell">
      <CustomCursor />
      <Header theme={theme} onToggleTheme={handleToggleTheme} />
      <main className="main-content" id="main-content">
        <InputSection
          text={rawText}
          onTextChange={setRawText}
          fileName={fileName}
          onFileNameChange={setFileName}
        />

        <CustomRulesSection
          rules={customRules}
          onRulesChange={setCustomRules}
        />

        <ControlsBar
          mode={mode}
          onModeChange={setMode}
          typeModes={typeModes}
          onTypeModeChange={handleTypeModeChange}
          enabledTypes={enabledTypes}
          onToggleType={handleToggleType}
          strictChecksum={strictChecksum}
          onStrictChecksumChange={setStrictChecksum}
        />

        <SummaryBar
          matches={detectionResult.matches}
          luhnFailedCount={detectionResult.luhnFailedCount}
          verhoeffFailedCount={detectionResult.verhoeffFailedCount || 0}
          enabledTypes={enabledTypes}
          excludedCount={redactionResult.excludedCount || 0}
          riskScore={riskScore}
          riskSummary={riskSummary}
          complianceTags={complianceTags}
          strictChecksum={strictChecksum}
        />

        <AuditView
          originalText={debouncedText}
          matches={detectionResult.matches}
          sanitizedText={redactionResult.sanitizedText}
          replacements={redactionResult.replacements}
          mode={mode}
          overrides={overrides}
          onOverrideChange={handleOverrideChange}
          onResetOverrides={handleResetOverrides}
        />

        <ExportBar
          sanitizedText={redactionResult.sanitizedText}
          fileName={fileName}
          auditReportData={auditReportData}
        />

        {redactionResult.mapping && redactionResult.mapping.length > 0 && (
          <MappingTable mapping={redactionResult.mapping} />
        )}
      </main>
    </div>
  );
}
