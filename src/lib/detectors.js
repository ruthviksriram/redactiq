/**
 * @file PII Detection and classification engine.
 * Pure functions for detecting and resolving entities with strict validation.
 */

import { ENTITY_TYPES } from './constants.js';
import {
  validateLuhn,
  validateVerhoeff,
  validateIPv4,
  validateIPv6,
  validatePAN,
} from './validators.js';
import {
  EMAIL_REGEX,
  INDIAN_PHONE_REGEX,
  INTL_PHONE_REGEX,
  IPV4_CANDIDATE_REGEX,
  IPV6_CANDIDATE_REGEX,
  PAN_REGEX,
  AADHAAR_CANDIDATE_REGEX,
  CARD_CANDIDATE_REGEX,
  normalizeEntity,
} from './detectors/rules.js';
import { resolveOverlaps } from './detectors/overlaps.js';

// Re-export helpers for backward compatibility
export { normalizeEntity, resolveOverlaps };

/**
 * @typedef {Object} DetectedEntity
 * @property {string} type - Entity type from ENTITY_TYPES.
 * @property {string} value - Exact substring matched in the source text.
 * @property {number} start - 0-based start character index in source text.
 * @property {number} end - 0-based end character index in source text.
 * @property {string} normalized - Normalized representation for comparison and pseudonymization.
 * @property {boolean} [unverified] - True if pattern matches but failed strict algorithmic checksum.
 */

/**
 * @typedef {Object} DetectionResult
 * @property {DetectedEntity[]} matches - Non-overlapping detected entities sorted by start index.
 * @property {number} luhnFailedCount - Count of card-like numeric sequences that failed Luhn validation.
 * @property {number} verhoeffFailedCount - Count of 12-digit Aadhaar candidate sequences that failed Verhoeff checksum.
 */

/**
 * Scans text and detects all supported PII entities with strict validation.
 *
 * @param {string} text - The input text to scan.
 * @param {Object.<string, boolean>} [enabledTypes] - Optional map of enabled entity types.
 * @param {Array<string|{pattern: string, isRegex?: boolean}>} [customRules] - User-defined custom rules.
 * @param {boolean|{ strict?: boolean }} [options] - Detection configuration options (e.g. strict checksum mode).
 * @returns {DetectionResult} Detection result with validated matches and failure counts.
 */
export function detectEntities(text, enabledTypes = {}, customRules = [], options = {}) {
  if (typeof text !== 'string' || text.length === 0) {
    return { matches: [], luhnFailedCount: 0, verhoeffFailedCount: 0 };
  }

  const { strict = true } = typeof options === 'boolean' ? { strict: options } : options || {};

  // Default all types to enabled if not specified
  const isEnabled = (type) => enabledTypes[type] !== false;

  const rawCandidates = [];
  let luhnFailedCount = 0;
  let verhoeffFailedCount = 0;

  // 1. CREDIT CARDS (13-19 digits, validated with Luhn algorithm)
  const cardCandidates = text.matchAll(CARD_CANDIDATE_REGEX);
  for (const match of cardCandidates) {
    const value = match[0];
    const digitsOnly = value.replace(/\D/g, '');

    // Card numbers must have 13 to 19 digits
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
      if (validateLuhn(digitsOnly)) {
        if (isEnabled(ENTITY_TYPES.CREDIT_CARD)) {
          rawCandidates.push({
            type: ENTITY_TYPES.CREDIT_CARD,
            value,
            start: match.index,
            end: match.index + value.length,
            normalized: normalizeEntity(ENTITY_TYPES.CREDIT_CARD, value),
            unverified: false,
          });
        }
      } else {
        // Track candidate as failed Luhn if it looks like a card (e.g. 13-19 digits)
        luhnFailedCount++;
        if (!strict && isEnabled(ENTITY_TYPES.CREDIT_CARD)) {
          rawCandidates.push({
            type: ENTITY_TYPES.CREDIT_CARD,
            value,
            start: match.index,
            end: match.index + value.length,
            normalized: normalizeEntity(ENTITY_TYPES.CREDIT_CARD, value),
            unverified: true,
          });
        }
      }
    }
  }

  // 2. AADHAAR NUMBERS (12 digits, first digit 2-9, validated with Verhoeff)
  const aadhaarMatches = text.matchAll(AADHAAR_CANDIDATE_REGEX);
  for (const match of aadhaarMatches) {
    const value = match[0];
    if (validateVerhoeff(value)) {
      if (isEnabled(ENTITY_TYPES.AADHAAR)) {
        rawCandidates.push({
          type: ENTITY_TYPES.AADHAAR,
          value,
          start: match.index,
          end: match.index + value.length,
          normalized: normalizeEntity(ENTITY_TYPES.AADHAAR, value),
          unverified: false,
        });
      }
    } else {
      verhoeffFailedCount++;
      if (!strict && isEnabled(ENTITY_TYPES.AADHAAR)) {
        rawCandidates.push({
          type: ENTITY_TYPES.AADHAAR,
          value,
          start: match.index,
          end: match.index + value.length,
          normalized: normalizeEntity(ENTITY_TYPES.AADHAAR, value),
          unverified: true,
        });
      }
    }
  }

  // 3. PAN (Indian Permanent Account Number)
  if (isEnabled(ENTITY_TYPES.PAN)) {
    const panMatches = text.matchAll(PAN_REGEX);
    for (const match of panMatches) {
      const value = match[0];
      if (validatePAN(value)) {
        rawCandidates.push({
          type: ENTITY_TYPES.PAN,
          value,
          start: match.index,
          end: match.index + value.length,
          normalized: normalizeEntity(ENTITY_TYPES.PAN, value),
        });
      }
    }
  }

  // 4. IP ADDRESSES (IPv4 with 0-255 octet validation and IPv6)
  if (isEnabled(ENTITY_TYPES.IP)) {
    const ipv4Matches = text.matchAll(IPV4_CANDIDATE_REGEX);
    for (const match of ipv4Matches) {
      const value = match[0];
      if (validateIPv4(value)) {
        rawCandidates.push({
          type: ENTITY_TYPES.IP,
          value,
          start: match.index,
          end: match.index + value.length,
          normalized: normalizeEntity(ENTITY_TYPES.IP, value),
        });
      }
    }

    const ipv6Matches = text.matchAll(IPV6_CANDIDATE_REGEX);
    for (const match of ipv6Matches) {
      const value = match[0];
      if (validateIPv6(value)) {
        rawCandidates.push({
          type: ENTITY_TYPES.IP,
          value,
          start: match.index,
          end: match.index + value.length,
          normalized: normalizeEntity(ENTITY_TYPES.IP, value),
        });
      }
    }
  }

  // 5. EMAIL ADDRESSES
  if (isEnabled(ENTITY_TYPES.EMAIL)) {
    const emailMatches = text.matchAll(EMAIL_REGEX);
    for (const match of emailMatches) {
      const value = match[0];
      rawCandidates.push({
        type: ENTITY_TYPES.EMAIL,
        value,
        start: match.index,
        end: match.index + value.length,
        normalized: normalizeEntity(ENTITY_TYPES.EMAIL, value),
      });
    }
  }

  // 6. PHONE NUMBERS (Indian mobile and international)
  if (isEnabled(ENTITY_TYPES.PHONE)) {
    const indianMatches = text.matchAll(INDIAN_PHONE_REGEX);
    for (const match of indianMatches) {
      const value = match[0];
      rawCandidates.push({
        type: ENTITY_TYPES.PHONE,
        value,
        start: match.index,
        end: match.index + value.length,
        normalized: normalizeEntity(ENTITY_TYPES.PHONE, value),
      });
    }

    const intlMatches = text.matchAll(INTL_PHONE_REGEX);
    for (const match of intlMatches) {
      const value = match[0];
      rawCandidates.push({
        type: ENTITY_TYPES.PHONE,
        value,
        start: match.index,
        end: match.index + value.length,
        normalized: normalizeEntity(ENTITY_TYPES.PHONE, value),
      });
    }
  }

  // 7. USER-DEFINED CUSTOM RULES (Keywords or simple regex)
  if (isEnabled(ENTITY_TYPES.CUSTOM_RULE) && Array.isArray(customRules)) {
    for (const rule of customRules) {
      if (!rule) continue;
      const pattern = typeof rule === 'string' ? rule : rule.pattern;
      const isRegex = typeof rule === 'object' ? Boolean(rule.isRegex) : false;

      if (!pattern || !pattern.trim()) continue;

      try {
        let rx;
        if (isRegex) {
          rx = new RegExp(pattern.trim(), 'gi');
        } else {
          // Exact keyword, case-insensitive (escaped regex)
          const escaped = pattern.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          rx = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'gi');
        }

        const ruleMatches = text.matchAll(rx);
        for (const match of ruleMatches) {
          const value = match[0];
          if (!value) continue;
          rawCandidates.push({
            type: ENTITY_TYPES.CUSTOM_RULE,
            value,
            start: match.index,
            end: match.index + value.length,
            normalized: value.toLowerCase(),
          });
        }
      } catch {
        // Safe error boundary: invalid regex patterns never crash the engine
      }
    }
  }

  // Resolve overlaps
  const finalMatches = resolveOverlaps(rawCandidates);

  return {
    matches: finalMatches,
    luhnFailedCount,
    verhoeffFailedCount,
  };
}
