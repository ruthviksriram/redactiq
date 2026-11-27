/**
 * @file Redaction transformations and masking engines.
 * Supports Full Mask, Partial Mask, and Consistent Pseudonymization.
 */

import {
  ENTITY_TYPES,
  REDACTION_MODES,
  OVERRIDE_OPTIONS,
  DEFAULT_CUSTOM_TYPE_MODES,
} from './constants.js';

/**
 * Generates a partial mask string for a detected entity.
 * Keeps minimal context without leaking identity.
 *
 * @param {string} type - Entity type.
 * @param {string} value - Raw entity value.
 * @returns {string} Partially masked string.
 */
export function getPartialMask(type, value) {
  switch (type) {
    case ENTITY_TYPES.EMAIL: {
      const atIndex = value.indexOf('@');
      if (atIndex <= 0) return '***@***.***';
      const firstChar = value.charAt(0);
      const domain = value.slice(atIndex + 1);
      return `${firstChar}***@${domain}`;
    }

    case ENTITY_TYPES.PHONE: {
      const digits = value.replace(/\D/g, '');
      const lastFour = digits.length >= 4 ? digits.slice(-4) : digits;
      return `XXXXXX${lastFour}`;
    }

    case ENTITY_TYPES.CREDIT_CARD: {
      const digits = value.replace(/\D/g, '');
      const lastFour = digits.length >= 4 ? digits.slice(-4) : digits;
      return `XXXX-XXXX-XXXX-${lastFour}`;
    }

    case ENTITY_TYPES.AADHAAR: {
      const digits = value.replace(/\D/g, '');
      const lastFour = digits.length >= 4 ? digits.slice(-4) : digits;
      return `XXXX-XXXX-${lastFour}`;
    }

    case ENTITY_TYPES.PAN: {
      const clean = value.toUpperCase().trim();
      if (clean.length === 10) {
        const digits = clean.slice(5, 9);
        return `XXXXX${digits}X`;
      }
      return 'XXXXX****X';
    }

    case ENTITY_TYPES.IP: {
      if (value.includes('.')) {
        const octets = value.split('.');
        if (octets.length === 4) {
          return `${octets[0]}.${octets[1]}.XXX.XXX`;
        }
      } else if (value.includes(':')) {
        const groups = value.split(':');
        const first = groups[0] || 'fe80';
        return `${first}:XXXX:XXXX::XXXX`;
      }
      return 'XXX.XXX.XXX.XXX';
    }

    default:
      return '[REDACTED]';
  }
}

/**
 * Returns the short type code used for pseudonymization prefixes.
 *
 * @param {string} type - Entity type.
 * @returns {string} Prefix string (e.g. 'CARD' for CREDIT_CARD).
 */
function getPseudonymPrefix(type) {
  if (type === ENTITY_TYPES.CREDIT_CARD) {
    return 'CARD';
  }
  return type;
}

/**
 * Resolves the effective redaction mode for a specific match according to precedence:
 * Per-item override > Custom per-type mode > Global mode.
 *
 * @param {import('./detectors.js').DetectedEntity} match
 * @param {string} mode - Global mode.
 * @param {Record<string, string>} [typeModes] - Per-type modes for Custom mode.
 * @param {Record<string, string>} [overrides] - Per-item overrides.
 * @returns {string} Effective mode (FULL, PARTIAL, PSEUDONYM, or NONE).
 */
export function resolveEffectiveMode(
  match,
  mode = REDACTION_MODES.FULL,
  typeModes = {},
  overrides = {}
) {
  const itemKey = `${match.type}::${match.normalized}`;
  const override =
    overrides[itemKey] !== undefined ? overrides[itemKey] : overrides[match.normalized];

  if (override && override !== OVERRIDE_OPTIONS.DEFAULT) {
    return override;
  }

  if (mode === REDACTION_MODES.CUSTOM) {
    return typeModes[match.type] || DEFAULT_CUSTOM_TYPE_MODES[match.type] || REDACTION_MODES.FULL;
  }

  return mode || REDACTION_MODES.FULL;
}

/**
 * Redacts text based on detected entities, selected mode, custom per-type mappings, and per-item overrides.
 *
 * @param {string} text - Source text.
 * @param {import('./detectors.js').DetectedEntity[]} matches - Non-overlapping detected entities.
 * @param {string|{ mode?: string, typeModes?: Record<string, string>, overrides?: Record<string, string> }} [modeOrOptions=REDACTION_MODES.FULL]
 * @param {Record<string, string>} [typeModesParam]
 * @param {Record<string, string>} [overridesParam]
 * @returns {{ sanitizedText: string, replacements: Array<{ placeholder: string, original: string, type: string, start: number, end: number, mode: string, isExcluded: boolean }>, mapping: Array<{ placeholder: string, original: string, type: string, normalized: string }>, excludedCount: number }}
 */
export function redactText(
  text,
  matches,
  modeOrOptions = REDACTION_MODES.FULL,
  typeModesParam = {},
  overridesParam = {}
) {
  if (!text || !matches || matches.length === 0) {
    return {
      sanitizedText: text || '',
      replacements: [],
      mapping: [],
      excludedCount: 0,
    };
  }

  // Support both object configuration and positional arguments
  let mode = REDACTION_MODES.FULL;
  let typeModes = typeModesParam || {};
  let overrides = overridesParam || {};

  if (typeof modeOrOptions === 'object' && modeOrOptions !== null) {
    mode = modeOrOptions.mode || REDACTION_MODES.FULL;
    typeModes = modeOrOptions.typeModes || {};
    overrides = modeOrOptions.overrides || {};
  } else if (typeof modeOrOptions === 'string') {
    mode = modeOrOptions;
  }

  // Pseudonymization bookkeeping
  const pseudonymCounters = {};
  const entityToPseudonym = new Map();
  const mappingList = [];
  let excludedCount = 0;

  // Generate replacements for each match
  const matchReplacements = matches.map((match) => {
    const effectiveMode = resolveEffectiveMode(match, mode, typeModes, overrides);
    let placeholder = '';
    const isExcluded = effectiveMode === OVERRIDE_OPTIONS.NONE || effectiveMode === 'none';

    if (isExcluded) {
      placeholder = match.value;
      excludedCount += 1;
    } else if (effectiveMode === REDACTION_MODES.PARTIAL) {
      placeholder = getPartialMask(match.type, match.value);
    } else if (effectiveMode === REDACTION_MODES.PSEUDONYM) {
      const key = `${match.type}::${match.normalized}`;
      if (entityToPseudonym.has(key)) {
        placeholder = entityToPseudonym.get(key);
      } else {
        const prefix = getPseudonymPrefix(match.type);
        pseudonymCounters[prefix] = (pseudonymCounters[prefix] || 0) + 1;
        const indexStr = String(pseudonymCounters[prefix]).padStart(2, '0');
        placeholder = `${prefix}_${indexStr}`;
        entityToPseudonym.set(key, placeholder);
        mappingList.push({
          placeholder,
          original: match.value,
          type: match.type,
          normalized: match.normalized,
        });
      }
    } else {
      placeholder = `[REDACTED_${match.type}]`;
    }

    // Safety check: ensure placeholder contains NO commas to protect CSV structure
    placeholder = placeholder.replace(/,/g, '');

    return {
      match,
      placeholder,
      effectiveMode,
      isExcluded,
      unverified: Boolean(match.unverified),
    };
  });

  // Rebuild the sanitized string piece by piece
  let sanitizedText = '';
  let cursor = 0;
  const replacements = [];

  for (const { match, placeholder, effectiveMode, isExcluded, unverified } of matchReplacements) {
    // Append non-PII text between previous match and this one
    sanitizedText += text.slice(cursor, match.start);

    // Record replacement offset in the new text
    const startInSanitized = sanitizedText.length;
    sanitizedText += placeholder;
    const endInSanitized = sanitizedText.length;

    replacements.push({
      placeholder,
      original: match.value,
      type: match.type,
      start: startInSanitized,
      end: endInSanitized,
      mode: effectiveMode,
      isExcluded,
      unverified,
    });

    cursor = match.end;
  }

  // Append trailing text after the last match
  sanitizedText += text.slice(cursor);

  return {
    sanitizedText,
    replacements,
    mapping: mappingList,
    excludedCount,
  };
}
