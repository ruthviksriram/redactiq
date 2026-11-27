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

/**
 * @typedef {Object} DetectedEntity
 * @property {string} type - Entity type from ENTITY_TYPES.
 * @property {string} value - Exact substring matched in the source text.
 * @property {number} start - 0-based start character index in source text.
 * @property {number} end - 0-based end character index in source text.
 * @property {string} normalized - Normalized representation for comparison and pseudonymization.
 */

/**
 * @typedef {Object} DetectionResult
 * @property {DetectedEntity[]} matches - Non-overlapping detected entities sorted by start index.
 * @property {number} luhnFailedCount - Count of card-like numeric sequences that failed Luhn validation.
 */

// Regex definitions with strict boundary constraints
const EMAIL_REGEX = /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\b/g;

// Indian mobile: 10 digits starting 6-9, optional +91 / 0 prefix, optional spaces or dashes
const INDIAN_PHONE_REGEX = /(?<!\w|\+)(?:\+91[ -]?|0)?[6-9]\d{2}[ -]?\d{3}[ -]?\d{4}(?!\d)|(?<!\w|\+)(?:\+91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d)|(?<!\w|\+)(?:\+91[ -]?|0)?[6-9]\d{9}(?!\d)/g;

// Common international format: e.g. +1 555-123-4567 or +1 (555) 123-4567 or +44 20 7946 0958
const INTL_PHONE_REGEX = /(?<!\w|\+)\+\d{1,3}[ -]?(?:\(\d{1,4}\)|\d{1,4})[ -]?\d{1,4}[ -]?\d{3,4}(?!\d)/g;

// IPv4 octet candidate regex (handles terminal sentence periods and rejects 5-octet strings)
const IPV4_CANDIDATE_REGEX = /(?<!\d\.)(?<![a-zA-Z0-9])\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?!\.\d)(?![a-zA-Z0-9])/g;

// IPv6 candidate regex
const IPV6_CANDIDATE_REGEX = /(?<!\w|:)(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}(?!\w|:)|(?<!\w|:)::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}(?!\w|:)|(?<!\w|:)(?:[0-9a-fA-F]{1,4}:){1,7}:(?!\w|:)/g;

// Indian PAN format: 5 letters + 4 digits + 1 letter
const PAN_REGEX = /(?<![a-zA-Z0-9])[a-zA-Z]{5}[0-9]{4}[a-zA-Z](?![a-zA-Z0-9])/g;

// Aadhaar: 12 digits, first digit 2-9, optional grouping 4-4-4
const AADHAAR_CANDIDATE_REGEX = /(?<!\d)[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?!\d)/g;

// Credit / Debit card candidate: 13-19 digits with optional spaces or dashes
const CARD_CANDIDATE_REGEX = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;

/**
 * Normalizes an entity value based on its type.
 *
 * @param {string} type - Entity type.
 * @param {string} rawValue - Raw matched text.
 * @returns {string} Normalized value.
 */
export function normalizeEntity(type, rawValue) {
  switch (type) {
    case ENTITY_TYPES.EMAIL:
      return rawValue.toLowerCase().trim();

    case ENTITY_TYPES.PAN:
      return rawValue.toUpperCase().trim();

    case ENTITY_TYPES.AADHAAR:
      return rawValue.replace(/\D/g, '');

    case ENTITY_TYPES.CREDIT_CARD:
      return rawValue.replace(/\D/g, '');

    case ENTITY_TYPES.IP:
      return rawValue.toLowerCase().trim();

    case ENTITY_TYPES.PHONE: {
      const digits = rawValue.replace(/\D/g, '');
      // For Indian numbers (+91 or 0 prefix), normalize to 10 digits
      if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
        return digits.slice(2);
      }
      if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
        return digits.slice(1);
      }
      return digits;
    }

    default:
      return rawValue.trim();
  }
}

/**
 * Priority order for overlap resolution.
 * Higher number means higher priority.
 * Validated card > validated Aadhaar > PAN > IP > Email > Phone.
 */
const TYPE_PRIORITY = {
  [ENTITY_TYPES.CREDIT_CARD]: 60,
  [ENTITY_TYPES.AADHAAR]: 50,
  [ENTITY_TYPES.PAN]: 40,
  [ENTITY_TYPES.IP]: 30,
  [ENTITY_TYPES.EMAIL]: 20,
  [ENTITY_TYPES.PHONE]: 10,
};

/**
 * Resolves overlapping entity matches.
 * Prioritizes:
 * 1. Type priority (CARD > AADHAAR > PAN > IP > EMAIL > PHONE)
 * 2. Longer length
 * 3. Earlier starting position
 *
 * @param {DetectedEntity[]} candidates - Array of raw matches.
 * @returns {DetectedEntity[]} Non-overlapping matches sorted ascending by start index.
 */
export function resolveOverlaps(candidates) {
  if (!candidates || candidates.length === 0) return [];

  // Sort candidates by priority desc, length desc, start asc
  const sorted = [...candidates].sort((a, b) => {
    const priorityA = TYPE_PRIORITY[a.type] || 0;
    const priorityB = TYPE_PRIORITY[b.type] || 0;
    if (priorityB !== priorityA) return priorityB - priorityA;

    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenB !== lenA) return lenB - lenA;

    return a.start - b.start;
  });

  const accepted = [];

  for (const candidate of sorted) {
    // Check if candidate overlaps with any already accepted match
    const hasOverlap = accepted.some(
      (curr) => Math.max(curr.start, candidate.start) < Math.min(curr.end, candidate.end)
    );

    if (!hasOverlap) {
      accepted.push(candidate);
    }
  }

  // Return sorted by start position
  return accepted.sort((a, b) => a.start - b.start);
}

/**
 * Scans text and detects all supported PII entities with strict validation.
 *
 * @param {string} text - The input text to scan.
 * @param {Object.<string, boolean>} [enabledTypes] - Optional map of enabled entity types.
 * @returns {DetectionResult} Detection result with validated matches and Luhn failure count.
 */
export function detectEntities(text, enabledTypes = {}) {
  if (typeof text !== 'string' || text.length === 0) {
    return { matches: [], luhnFailedCount: 0 };
  }

  // Default all types to enabled if not specified
  const isEnabled = (type) => enabledTypes[type] !== false;

  const rawCandidates = [];
  let luhnFailedCount = 0;

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
          });
        }
      } else {
        // Track candidate as failed Luhn if it looks like a card (e.g. 13-19 digits)
        luhnFailedCount++;
      }
    }
  }

  // 2. AADHAAR NUMBERS (12 digits, first digit 2-9, validated with Verhoeff)
  if (isEnabled(ENTITY_TYPES.AADHAAR)) {
    const aadhaarMatches = text.matchAll(AADHAAR_CANDIDATE_REGEX);
    for (const match of aadhaarMatches) {
      const value = match[0];
      if (validateVerhoeff(value)) {
        rawCandidates.push({
          type: ENTITY_TYPES.AADHAAR,
          value,
          start: match.index,
          end: match.index + value.length,
          normalized: normalizeEntity(ENTITY_TYPES.AADHAAR, value),
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

  // Resolve overlaps
  const finalMatches = resolveOverlaps(rawCandidates);

  return {
    matches: finalMatches,
    luhnFailedCount,
  };
}
