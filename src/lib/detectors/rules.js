/**
 * @file Regular expression patterns and value normalization rules for PII detectors.
 */

import { ENTITY_TYPES } from '../constants.js';

// Regex definitions with strict boundary constraints
export const EMAIL_REGEX =
  /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\b/g;

// Indian mobile: 10 digits starting 6-9, optional +91 / 0 prefix, optional spaces or dashes
export const INDIAN_PHONE_REGEX =
  /(?<!\w|\+)(?:\+91[ -]?|0)?[6-9]\d{2}[ -]?\d{3}[ -]?\d{4}(?!\d)|(?<!\w|\+)(?:\+91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d)|(?<!\w|\+)(?:\+91[ -]?|0)?[6-9]\d{9}(?!\d)/g;

// Common international format: e.g. +1 555-123-4567 or +1 (555) 123-4567 or +44 20 7946 0958
export const INTL_PHONE_REGEX =
  /(?<!\w|\+)\+\d{1,3}[ -]?(?:\(\d{1,4}\)|\d{1,4})[ -]?\d{1,4}[ -]?\d{3,4}(?!\d)/g;

// IPv4 octet candidate regex (handles terminal sentence periods and rejects 5-octet strings)
export const IPV4_CANDIDATE_REGEX =
  /(?<!\d\.)(?<![a-zA-Z0-9])\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?!\.\d)(?![a-zA-Z0-9])/g;

// IPv6 candidate regex
export const IPV6_CANDIDATE_REGEX =
  /(?<!\w|:)(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}(?!\w|:)|(?<!\w|:)::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}(?!\w|:)|(?<!\w|:)(?:[0-9a-fA-F]{1,4}:){1,7}:(?!\w|:)/g;

// Indian PAN format: 5 letters + 4 digits + 1 letter
export const PAN_REGEX = /(?<![a-zA-Z0-9])[a-zA-Z]{5}[0-9]{4}[a-zA-Z](?![a-zA-Z0-9])/g;

// Aadhaar: 12 digits, first digit 2-9, grouping 4-4-4, strictly isolated from adjacent digit sequences
export const AADHAAR_CANDIDATE_REGEX =
  /(?<!\d)(?<!\d[ -])[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?![ -]?\d)/g;

// Credit / Debit card candidate: 13-19 digits with optional spaces or dashes
export const CARD_CANDIDATE_REGEX = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;

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
