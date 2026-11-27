/**
 * @file Core algorithmic validators for PII detection.
 * All functions are pure, deterministic, and self-contained.
 */

// Verhoeff dihedral group D5 multiplication table
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Verhoeff permutation table (cycle of 8)
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Verhoeff inverse table
const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a number string using the Luhn algorithm (mod 10).
 * Used for payment cards (13 to 19 digits).
 *
 * @param {string} value - String of digits to validate.
 * @returns {boolean} True if the number passes the Luhn checksum.
 */
export function validateLuhn(value) {
  if (typeof value !== 'string') return false;
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  // Process digits from right to left
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);
    if (isNaN(digit)) return false;

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Computes the Verhoeff checksum check digit for a string of digits.
 *
 * @param {string} numStr - String of numeric digits without the check digit.
 * @returns {number} The computed Verhoeff check digit (0-9).
 */
export function computeVerhoeffCheckDigit(numStr) {
  const digitsOnly = numStr.replace(/\D/g, '');
  let c = 0;
  const reversed = digitsOnly.split('').reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][reversed[i]]];
  }

  return VERHOEFF_INV[c];
}

/**
 * Validates a 12-digit Indian Aadhaar number using the Verhoeff algorithm.
 * Criteria: 12 digits, first digit between 2 and 9, and valid Verhoeff checksum.
 *
 * @param {string} value - Aadhaar number string (may contain spaces or dashes).
 * @returns {boolean} True if the Aadhaar number is mathematically valid.
 */
export function validateVerhoeff(value) {
  if (typeof value !== 'string') return false;
  const digitsOnly = value.replace(/\D/g, '');

  // Must be exactly 12 digits
  if (digitsOnly.length !== 12) {
    return false;
  }

  // First digit must be 2-9 (UIDAI rule: Aadhaar numbers never start with 0 or 1)
  const firstDigit = parseInt(digitsOnly.charAt(0), 10);
  if (firstDigit < 2 || firstDigit > 9) {
    return false;
  }

  let c = 0;
  const reversed = digitsOnly.split('').reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    const digit = reversed[i];
    if (isNaN(digit)) return false;
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
  }

  return c === 0;
}

/**
 * Validates whether an IP address string is a valid IPv4 address.
 * Every octet must be between 0 and 255, without invalid leading zeros.
 *
 * @param {string} ip - IP candidate string.
 * @returns {boolean} True if valid IPv4.
 */
export function validateIPv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    if (!/^\d{1,3}$/.test(part)) return false;

    // Reject leading zeroes like "01" (unless it's just "0")
    if (part.length > 1 && part.startsWith('0')) return false;

    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return false;
  }

  return true;
}

/**
 * Validates whether an IP address string is a valid IPv6 address.
 *
 * @param {string} ip - IP candidate string.
 * @returns {boolean} True if valid IPv6.
 */
export function validateIPv6(ip) {
  if (typeof ip !== 'string') return false;
  // Strict standard IPv6 regex matching full or compressed forms
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
  return ipv6Regex.test(ip);
}

/**
 * Validates an Indian Permanent Account Number (PAN).
 * Format: 5 letters + 4 digits + 1 letter.
 * 4th letter must be one of: P, C, H, F, A, T, B, L, J, G (Status of Taxpayer).
 *
 * @param {string} pan - PAN candidate string.
 * @returns {boolean} True if valid PAN.
 */
export function validatePAN(pan) {
  if (typeof pan !== 'string') return false;
  const upper = pan.toUpperCase().trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(upper)) {
    return false;
  }

  const fourthChar = upper.charAt(3);
  const validFourthChars = new Set(['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']);
  return validFourthChars.has(fourthChar);
}

/**
 * Sanitizes an uploaded file name to prevent path traversal, control character injection,
 * and dangerous filesystem characters.
 *
 * @param {string} rawName - Raw filename string from upload.
 * @returns {string} Clean, safe filename.
 */
export function sanitizeFileName(rawName) {
  if (typeof rawName !== 'string' || !rawName.trim()) return '';
  // Strip path prefixes (e.g. ../ or /etc/ or C:\)
  const baseName = rawName.replace(/^.*[\\/]/, '');
  // Replace illegal or dangerous characters with underscores
  const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').trim();
  // Strip leading dots to prevent hidden files or traversal
  const clean = safe.replace(/^\.+/, '');
  return clean || 'sanitized_document.txt';
}
