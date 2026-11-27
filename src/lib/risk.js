/**
 * @file Pure risk assessment, compliance rule mapping, and audit report generator.
 * Zero external calls, zero telemetry, purely deterministic mathematical scoring.
 */

import { ENTITY_TYPES, ENTITY_WEIGHTS, REDACTION_MODES } from './constants.js';

/**
 * Calculates a 0-100 privacy risk exposure score and risk level.
 * Weights: CREDIT_CARD (30), AADHAAR (25), PAN (20), PHONE (15), EMAIL (10), IP (5).
 * Follows toggles and exclusions ("Don't redact").
 *
 * @param {Array<{ type: string, normalized: string }>} matches
 * @param {Record<string, string>} [overrides]
 * @param {Record<string, boolean>} [enabledTypes]
 * @returns {{ score: number, level: 'Low' | 'Medium' | 'High' | 'Critical', activeCount: number, countsByType: Record<string, number> }}
 */
export function calculateRiskScore(matches = [], overrides = {}, enabledTypes = {}) {
  // Filter out disabled entity types and items overridden with 'NONE' ("Don't redact")
  const activeMatches = matches.filter((m) => {
    if (enabledTypes && enabledTypes[m.type] === false) return false;
    const itemKey = `${m.type}::${m.normalized}`;
    const override = overrides[itemKey] || overrides[m.normalized];
    return override !== 'NONE';
  });

  const countsByType = {};
  for (const m of activeMatches) {
    countsByType[m.type] = (countsByType[m.type] || 0) + 1;
  }

  if (activeMatches.length === 0) {
    return {
      score: 0,
      level: 'Low',
      activeCount: 0,
      countsByType: {},
    };
  }

  let totalScore = 0;
  for (const [type, count] of Object.entries(countsByType)) {
    const weight = ENTITY_WEIGHTS[type] || 10;
    // Diminishing returns on identical entity types (base weight + small increment for repeats)
    const typeScore = weight + Math.min(weight * 3, (count - 1) * Math.ceil(weight * 0.3));
    totalScore += typeScore;
  }

  const score = Math.min(100, Math.max(0, Math.round(totalScore)));

  let level = 'Low';
  if (score >= 80) {
    level = 'Critical';
  } else if (score >= 50) {
    level = 'High';
  } else if (score >= 20) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return {
    score,
    level,
    activeCount: activeMatches.length,
    countsByType,
  };
}

/**
 * Auto-generates an accessible, non-AI plain text assessment summary and redaction recommendation.
 *
 * @param {Array<{ type: string }>} matches
 * @param {{ score: number, level: string, activeCount: number }} scoreResult
 * @param {string} [mode=REDACTION_MODES.FULL]
 * @param {{ luhnFailedCount?: number, verhoeffFailedCount?: number, strict?: boolean }} [validationStats={}]
 * @returns {{ title: string, details: string, recommendation: string }}
 */
export function generateRiskSummary(
  matches = [],
  scoreResult,
  mode = REDACTION_MODES.FULL,
  validationStats = {}
) {
  const { score, level, activeCount } = scoreResult;
  const luhnFailed = validationStats.luhnFailedCount || 0;
  const verhoeffFailed = validationStats.verhoeffFailedCount || 0;
  const checksumFailedTotal = luhnFailed + verhoeffFailed;
  const isStrict = validationStats.strict !== false;

  const checksumNotice =
    isStrict && checksumFailedTotal > 0
      ? ` ${checksumFailedTotal} number(s) look like IDs but failed validation — review them or turn off strict validation.`
      : '';

  if (activeCount === 0) {
    return {
      title: 'Low Risk Exposure (0/100)',
      details: 'No personal data detected by the active rules or all items are excluded.',
      recommendation: `No PII detected by the active rules. Review the text before sharing.${checksumNotice}`,
    };
  }

  const typesPresent = [...new Set(matches.map((m) => m.type))];
  const hasFinancial = typesPresent.includes(ENTITY_TYPES.CREDIT_CARD) || typesPresent.includes(ENTITY_TYPES.PAN);
  const hasNationalId = typesPresent.includes(ENTITY_TYPES.AADHAAR);
  const hasContact = typesPresent.includes(ENTITY_TYPES.EMAIL) || typesPresent.includes(ENTITY_TYPES.PHONE);

  let recommendation = 'Consistent Pseudonymization';
  if (level === 'Critical' || hasFinancial) {
    recommendation = 'Full Mask ([REDACTED]) to eliminate all payment & financial liabilities';
  } else if (level === 'High' || hasNationalId) {
    recommendation = 'Consistent Pseudonymization (safely masks citizen IDs while retaining correlation)';
  } else if (mode === REDACTION_MODES.CUSTOM) {
    recommendation = 'Custom per-type strategy active';
  } else {
    recommendation = 'Partial Mask (preserves debugging context while concealing sensitive tails)';
  }

  const categories = [];
  if (hasFinancial) categories.push('financial records (Cards/PAN)');
  if (hasNationalId) categories.push('national ID identifiers (Aadhaar)');
  if (hasContact) categories.push('direct contact points (Email/Phone)');
  if (typesPresent.includes(ENTITY_TYPES.IP)) categories.push('network addresses (IPs)');

  return {
    title: `${level} Risk Exposure (${score}/100)`,
    details: `Identified ${activeCount} active entities across ${categories.join(', ')}.`,
    recommendation: `Recommended strategy: ${recommendation}.${checksumNotice}`,
  };
}

/**
 * Evaluates applicable regulatory compliance frameworks based on active detected entities.
 *
 * @param {Array<{ type: string, normalized: string }>} matches
 * @param {Record<string, string>} [overrides]
 * @param {Record<string, boolean>} [enabledTypes]
 * @returns {Array<{ id: string, name: string, description: string, color: string }>}
 */
export function evaluateComplianceTags(matches = [], overrides = {}, enabledTypes = {}) {
  const activeMatches = matches.filter((m) => {
    if (enabledTypes && enabledTypes[m.type] === false) return false;
    const itemKey = `${m.type}::${m.normalized}`;
    const override = overrides[itemKey] || overrides[m.normalized];
    return override !== 'NONE';
  });

  const types = new Set(activeMatches.map((m) => m.type));
  const tags = [];

  // PCI-DSS v4.0: Payment Card Numbers
  if (types.has(ENTITY_TYPES.CREDIT_CARD)) {
    tags.push({
      id: 'PCI-DSS',
      name: 'PCI-DSS v4.0',
      description: 'Payment Card Industry Data Security Standard',
      color: '#F43F5E',
    });
  }

  // India DPDP Act 2023: Any identifiable personal data (PAN, Aadhaar, Phone, Email, etc.)
  if (
    types.has(ENTITY_TYPES.AADHAAR) ||
    types.has(ENTITY_TYPES.PAN) ||
    types.has(ENTITY_TYPES.PHONE) ||
    types.has(ENTITY_TYPES.EMAIL)
  ) {
    tags.push({
      id: 'DPDP',
      name: 'India DPDP Act 2023',
      description: 'Digital Personal Data Protection Act compliance',
      color: '#10B981',
    });
  }

  // EU GDPR: Personal and online identifiers (Emails, IPs, Phones)
  if (
    types.has(ENTITY_TYPES.EMAIL) ||
    types.has(ENTITY_TYPES.IP) ||
    types.has(ENTITY_TYPES.PHONE)
  ) {
    tags.push({
      id: 'GDPR',
      name: 'EU GDPR Art. 4',
      description: 'General Data Protection Regulation standards',
      color: '#3B82F6',
    });
  }

  return tags;
}

/**
 * Generates a clean JSON audit report object.
 * CRITICAL PRIVACY RULE: NEVER contains any original or unmasked PII values!
 *
 * @param {Object} params
 * @param {string} params.mode - Active redaction mode.
 * @param {Array<{ type: string }>} params.matches - Detected entity matches.
 * @param {number} params.luhnFailedCount - Count of failed Luhn numbers.
 * @param {number} [params.verhoeffFailedCount] - Count of failed Verhoeff checks.
 * @param {number} params.excludedCount - Excluded items count.
 * @param {{ score: number, level: string }} params.riskScore - Risk assessment score.
 * @param {Array<{ id: string, name: string }>} params.complianceTags - Regulatory compliance tags.
 * @returns {Object} Clean audit report object.
 */
export function generateAuditReport({
  mode,
  matches = [],
  luhnFailedCount = 0,
  verhoeffFailedCount = 0,
  excludedCount = 0,
  riskScore,
  complianceTags = [],
}) {
  const countsByType = {};
  for (const m of matches) {
    countsByType[m.type] = (countsByType[m.type] || 0) + 1;
  }

  return {
    reportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    environment: 'Client-Side In-Memory (Zero Network Calls)',
    redactionStrategy: {
      mode,
    },
    statistics: {
      totalEntitiesDetected: matches.length,
      activeSanitizedCount: Math.max(0, matches.length - excludedCount),
      excludedCount,
      luhnValidationFailures: luhnFailedCount,
      verhoeffValidationFailures: verhoeffFailedCount,
      luhnFailedCount,
      verhoeffFailedCount,
      countsByType,
    },
    privacyRiskAssessment: {
      score: riskScore?.score || 0,
      level: riskScore?.level || 'Low',
    },
    complianceFrameworks: complianceTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
    })),
  };
}
