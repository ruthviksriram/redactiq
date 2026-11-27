/**
 * @file Redaction coordinator hook encapsulating all core business state,
 * debounced detection, memoized risk calculation, and redaction pipeline.
 */

import { useState, useEffect, useMemo } from 'react';
import { detectEntities } from '../lib/detectors.js';
import { redactText } from '../lib/redact.js';
import {
  calculateRiskScore,
  generateRiskSummary,
  evaluateComplianceTags,
  generateAuditReport,
} from '../lib/risk.js';
import {
  ENTITY_TYPES,
  REDACTION_MODES,
  OVERRIDE_OPTIONS,
  DEFAULT_CUSTOM_TYPE_MODES,
  DEBOUNCE_DELAY_MS,
} from '../lib/constants.js';

/**
 * Custom hook providing reactive state and memoized computation pipelines for RedactIQ.
 *
 * @returns {Object} Application state, event handlers, and computed results.
 */
export function useRedactionEngine() {
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

  return {
    theme,
    setTheme,
    handleToggleTheme,
    rawText,
    setRawText,
    debouncedText,
    fileName,
    setFileName,
    mode,
    setMode,
    typeModes,
    setTypeModes,
    handleTypeModeChange,
    overrides,
    setOverrides,
    handleOverrideChange,
    handleResetOverrides,
    customRules,
    setCustomRules,
    strictChecksum,
    setStrictChecksum,
    enabledTypes,
    setEnabledTypes,
    handleToggleType,
    detectionResult,
    redactionResult,
    riskScore,
    riskSummary,
    complianceTags,
    auditReportData,
  };
}
