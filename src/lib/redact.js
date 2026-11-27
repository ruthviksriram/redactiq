/**
 * @file Redaction transformations and masking engines.
 * Supports Full Mask, Partial Mask, and Consistent Pseudonymization.
 */

import { ENTITY_TYPES, REDACTION_MODES } from './constants.js';

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
 * Redacts text based on detected entities and selected redaction mode.
 *
 * @param {string} text - Source text.
 * @param {import('./detectors.js').DetectedEntity[]} matches - Non-overlapping detected entities.
 * @param {string} mode - Redaction mode from REDACTION_MODES.
 * @returns {{ sanitizedText: string, replacements: Array<{ placeholder: string, original: string, type: string, start: number, end: number }>, mapping: Array<{ placeholder: string, original: string, type: string, normalized: string }> }}
 */
export function redactText(text, matches, mode = REDACTION_MODES.FULL) {
  if (!text || !matches || matches.length === 0) {
    return {
      sanitizedText: text || '',
      replacements: [],
      mapping: [],
    };
  }

  // Pseudonymization bookkeeping
  const pseudonymCounters = {};
  const entityToPseudonym = new Map();
  const mappingList = [];

  // Generate replacements for each match
  const matchReplacements = matches.map((match) => {
    let placeholder = '';

    if (mode === REDACTION_MODES.FULL) {
      placeholder = `[REDACTED_${match.type}]`;
    } else if (mode === REDACTION_MODES.PARTIAL) {
      placeholder = getPartialMask(match.type, match.value);
    } else if (mode === REDACTION_MODES.PSEUDONYM) {
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
    };
  });

  // Rebuild the sanitized string piece by piece
  let sanitizedText = '';
  let cursor = 0;
  const replacements = [];

  for (const { match, placeholder } of matchReplacements) {
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
    });

    cursor = match.end;
  }

  // Append trailing text after the last match
  sanitizedText += text.slice(cursor);

  return {
    sanitizedText,
    replacements,
    mapping: mappingList,
  };
}
