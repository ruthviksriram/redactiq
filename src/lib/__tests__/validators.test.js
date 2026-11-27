import { describe, it, expect } from 'vitest';
import {
  validateLuhn,
  validateVerhoeff,
  validateIPv4,
  validateIPv6,
  validatePAN,
  computeVerhoeffCheckDigit,
} from '../validators.js';

describe('validators.js', () => {
  describe('validateLuhn', () => {
    it('accepts valid credit card numbers', () => {
      expect(validateLuhn('4111 1111 1111 1111')).toBe(true);
      expect(validateLuhn('4111111111111111')).toBe(true);
      expect(validateLuhn('5500 0000 0000 0004')).toBe(true);
      expect(validateLuhn('3782 822463 10005')).toBe(true); // 15-digit Amex
    });

    it('rejects numbers failing the Luhn checksum', () => {
      expect(validateLuhn('4111 1111 1111 1112')).toBe(false);
      expect(validateLuhn('1234 5678 9012 3456')).toBe(false);
      expect(validateLuhn('9999 9999 9999 9999')).toBe(false);
    });

    it('rejects invalid lengths and non-numeric strings', () => {
      expect(validateLuhn('123456789012')).toBe(false); // 12 digits (too short)
      expect(validateLuhn('12345678901234567890')).toBe(false); // 20 digits (too long)
      expect(validateLuhn('')).toBe(false);
      expect(validateLuhn(null)).toBe(false);
    });
  });

  describe('validateVerhoeff & computeVerhoeffCheckDigit', () => {
    it('computes and validates check digits for Aadhaar', () => {
      const base = '23456789012';
      const checkDigit = computeVerhoeffCheckDigit(base);
      const fullAadhaar = base + checkDigit;
      expect(validateVerhoeff(fullAadhaar)).toBe(true);
      expect(validateVerhoeff(`2345 6789 012${checkDigit}`)).toBe(true);
      expect(validateVerhoeff(`2345-6789-012${checkDigit}`)).toBe(true);
    });

    it('rejects invalid Verhoeff checksums', () => {
      expect(validateVerhoeff('2345 6789 0125')).toBe(false);
      expect(validateVerhoeff('9876 5432 1095')).toBe(false);
    });

    it('rejects Aadhaar starting with 0 or 1', () => {
      // First digit must be 2-9
      const base0 = '01234567890';
      const full0 = base0 + computeVerhoeffCheckDigit(base0);
      expect(validateVerhoeff(full0)).toBe(false);

      const base1 = '12345678901';
      const full1 = base1 + computeVerhoeffCheckDigit(base1);
      expect(validateVerhoeff(full1)).toBe(false);
    });

    it('rejects numbers of incorrect length', () => {
      expect(validateVerhoeff('23456789012')).toBe(false); // 11 digits
      expect(validateVerhoeff('2345678901245')).toBe(false); // 13 digits
      expect(validateVerhoeff('')).toBe(false);
    });
  });

  describe('validateIPv4', () => {
    it('accepts valid IPv4 addresses', () => {
      expect(validateIPv4('192.168.1.1')).toBe(true);
      expect(validateIPv4('10.0.4.12')).toBe(true);
      expect(validateIPv4('0.0.0.0')).toBe(true);
      expect(validateIPv4('255.255.255.255')).toBe(true);
      expect(validateIPv4('127.0.0.1')).toBe(true);
    });

    it('rejects octets out of 0-255 range', () => {
      expect(validateIPv4('999.1.1.1')).toBe(false);
      expect(validateIPv4('256.0.0.1')).toBe(false);
      expect(validateIPv4('192.168.1.300')).toBe(false);
    });

    it('rejects leading zeroes and malformed inputs', () => {
      expect(validateIPv4('01.1.1.1')).toBe(false);
      expect(validateIPv4('192.168.01.1')).toBe(false);
      expect(validateIPv4('1.2.3')).toBe(false);
      expect(validateIPv4('1.2.3.4.5')).toBe(false);
      expect(validateIPv4('abc.def.ghi.jkl')).toBe(false);
      expect(validateIPv4('')).toBe(false);
    });
  });

  describe('validateIPv6', () => {
    it('accepts valid IPv6 addresses', () => {
      expect(validateIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(validateIPv6('fe80::1')).toBe(true);
      expect(validateIPv6('::1')).toBe(true);
      expect(validateIPv6('2001:db8::')).toBe(true);
    });

    it('rejects invalid IPv6 addresses', () => {
      expect(validateIPv6('12345::1')).toBe(false);
      expect(validateIPv6('::g123')).toBe(false);
      expect(validateIPv6('')).toBe(false);
    });
  });

  describe('validatePAN', () => {
    it('accepts valid Indian PANs with approved 4th characters', () => {
      const validFourth = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
      for (const char of validFourth) {
        expect(validatePAN(`ABC${char}E1234F`)).toBe(true);
      }
    });

    it('handles case-insensitivity', () => {
      expect(validatePAN('aaapl1234c')).toBe(true);
      expect(validatePAN('bkrpk5678m')).toBe(true);
    });

    it('rejects PANs with invalid 4th characters', () => {
      // 'D' is not allowed as 4th char
      expect(validatePAN('ABCDE1234F')).toBe(false);
      // 'Z' is not allowed
      expect(validatePAN('ABCZE1234F')).toBe(false);
    });

    it('rejects malformed PAN strings', () => {
      expect(validatePAN('AAAP12345C')).toBe(false); // 4 letters + 5 digits
      expect(validatePAN('AAAPL12345')).toBe(false); // ends in digit
      expect(validatePAN('AAAPL123C')).toBe(false); // 3 digits
      expect(validatePAN('AAAPL1234CC')).toBe(false); // too long
      expect(validatePAN('')).toBe(false);
    });
  });
});
