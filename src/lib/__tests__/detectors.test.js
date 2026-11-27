import { describe, it, expect } from 'vitest';
import { detectEntities, normalizeEntity, resolveOverlaps } from '../detectors.js';
import { ENTITY_TYPES } from '../constants.js';

describe('detectors.js', () => {
  describe('normalizeEntity', () => {
    it('normalizes emails to lowercase', () => {
      expect(normalizeEntity(ENTITY_TYPES.EMAIL, 'User.Name@Domain.COM')).toBe('user.name@domain.com');
    });

    it('normalizes PAN to uppercase', () => {
      expect(normalizeEntity(ENTITY_TYPES.PAN, 'aaapl1234c')).toBe('AAAPL1234C');
    });

    it('normalizes Indian phone numbers across prefixes', () => {
      expect(normalizeEntity(ENTITY_TYPES.PHONE, '+91 98765 43210')).toBe('9876543210');
      expect(normalizeEntity(ENTITY_TYPES.PHONE, '09876543210')).toBe('9876543210');
      expect(normalizeEntity(ENTITY_TYPES.PHONE, '98765-43210')).toBe('9876543210');
      expect(normalizeEntity(ENTITY_TYPES.PHONE, '9876543210')).toBe('9876543210');
    });

    it('normalizes cards and Aadhaar to digits only', () => {
      expect(normalizeEntity(ENTITY_TYPES.CREDIT_CARD, '4111-1111-1111-1111')).toBe('4111111111111111');
      expect(normalizeEntity(ENTITY_TYPES.AADHAAR, '2345 6789 0124')).toBe('234567890124');
    });
  });

  describe('detectEntities — Entity Recognition', () => {
    it('detects emails correctly', () => {
      const text = 'Contact alice@example.com and BOB.SMITH@COMPANY.CO.UK for details.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(2);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.EMAIL);
      expect(res.matches[0].value).toBe('alice@example.com');
      expect(res.matches[1].value).toBe('BOB.SMITH@COMPANY.CO.UK');
      expect(res.matches[1].normalized).toBe('bob.smith@company.co.uk');
    });

    it('detects Indian and international phones', () => {
      const text = 'Call +91 98765 43210 or 09876543210 or US line +1 555-123-4567.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(3);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.PHONE);
      expect(res.matches[1].type).toBe(ENTITY_TYPES.PHONE);
      expect(res.matches[2].type).toBe(ENTITY_TYPES.PHONE);
    });

    it('detects valid IPs and ignores invalid octets', () => {
      const text = 'Valid: 192.168.1.1 and 10.0.0.1. Invalid: 999.1.1.1 and 256.0.0.1.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(2);
      expect(res.matches.every(m => m.type === ENTITY_TYPES.IP)).toBe(true);
      expect(res.matches.map(m => m.value)).toEqual(['192.168.1.1', '10.0.0.1']);
    });

    it('detects valid PAN and ignores invalid 4th letter', () => {
      const text = 'PAN AAAPL1234C is valid, but ABCDE1234F is invalid.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.PAN);
      expect(res.matches[0].value).toBe('AAAPL1234C');
    });

    it('detects valid Aadhaar and tracks Verhoeff failures', () => {
      const text = 'Valid UID: 2345 6789 0124. Corrupted: 2345 6789 0125.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.AADHAAR);
      expect(res.matches[0].value).toBe('2345 6789 0124');
      expect(res.verhoeffFailedCount).toBe(1);
    });

    it('detects Luhn-passing cards and tracks Luhn failures', () => {
      const text = 'Payment 4111 1111 1111 1111 was accepted. Sequence 1234 5678 9012 3456 failed.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.CREDIT_CARD);
      expect(res.matches[0].value).toBe('4111 1111 1111 1111');
      expect(res.luhnFailedCount).toBe(1);
    });

    it('redacts unverified cards and Aadhaar when strict mode is turned off', () => {
      const text = 'Luhn-fail card 1234 5678 9012 3456 and Verhoeff-fail Aadhaar 2345 6789 0125.';
      // Strict on (default)
      const strictRes = detectEntities(text, {}, [], { strict: true });
      expect(strictRes.matches).toHaveLength(0);
      expect(strictRes.luhnFailedCount).toBe(1);
      expect(strictRes.verhoeffFailedCount).toBe(1);

      // Strict off
      const nonStrictRes = detectEntities(text, {}, [], { strict: false });
      expect(nonStrictRes.matches).toHaveLength(2);
      expect(nonStrictRes.luhnFailedCount).toBe(1);
      expect(nonStrictRes.verhoeffFailedCount).toBe(1);

      const card = nonStrictRes.matches.find((m) => m.type === ENTITY_TYPES.CREDIT_CARD);
      const aadhaar = nonStrictRes.matches.find((m) => m.type === ENTITY_TYPES.AADHAAR);
      expect(card).toBeDefined();
      expect(card.unverified).toBe(true);
      expect(aadhaar).toBeDefined();
      expect(aadhaar.unverified).toBe(true);
    });
  });

  describe('Boundary and Overlap Resolution', () => {
    it('does not partly match numbers inside longer strings', () => {
      const text = 'Part number SKU98765432101234567890 should not be partially extracted.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(0);
    });

    it('resolves card vs phone overlap in favor of credit card', () => {
      // 4111 1111 1111 1111 could match 10 digits as phone if not resolved
      const text = 'Card: 4111 1111 1111 1111.';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.CREDIT_CARD);
    });

    it('resolves Aadhaar vs phone in favor of Aadhaar', () => {
      const text = 'UID: 2345 6789 0124';
      const res = detectEntities(text);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.AADHAAR);
    });

    it('resolveOverlaps prioritizes longer and higher priority types', () => {
      const candidates = [
        { type: ENTITY_TYPES.PHONE, value: '9876543210', start: 0, end: 10, normalized: '9876543210' },
        { type: ENTITY_TYPES.AADHAAR, value: '2345 6789 0124', start: 0, end: 14, normalized: '234567890124' },
      ];
      const resolved = resolveOverlaps(candidates);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].type).toBe(ENTITY_TYPES.AADHAAR);
    });

    it('honors enabledTypes filter', () => {
      const text = 'Email user@example.com and phone +91 98765 43210';
      const res = detectEntities(text, { [ENTITY_TYPES.EMAIL]: false });
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].type).toBe(ENTITY_TYPES.PHONE);
    });
  });
});
