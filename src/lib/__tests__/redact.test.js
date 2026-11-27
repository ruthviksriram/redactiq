import { describe, it, expect } from 'vitest';
import { redactText, getPartialMask } from '../redact.js';
import { ENTITY_TYPES, REDACTION_MODES } from '../constants.js';

describe('redact.js', () => {
  const sampleText = 'Contact alice@example.com or phone +91 98765 43210.';
  const emailStart = sampleText.indexOf('alice@example.com');
  const phoneStart = sampleText.indexOf('+91 98765 43210');

  const sampleMatches = [
    {
      type: ENTITY_TYPES.EMAIL,
      value: 'alice@example.com',
      start: emailStart,
      end: emailStart + 'alice@example.com'.length,
      normalized: 'alice@example.com',
    },
    {
      type: ENTITY_TYPES.PHONE,
      value: '+91 98765 43210',
      start: phoneStart,
      end: phoneStart + '+91 98765 43210'.length,
      normalized: '9876543210',
    },
  ];

  describe('Full Mask Mode', () => {
    it('replaces entities with [REDACTED_<TYPE>]', () => {
      const res = redactText(sampleText, sampleMatches, REDACTION_MODES.FULL);
      expect(res.sanitizedText).toBe('Contact [REDACTED_EMAIL] or phone [REDACTED_PHONE].');
      expect(res.replacements).toHaveLength(2);
      expect(res.replacements[0].placeholder).toBe('[REDACTED_EMAIL]');
      expect(res.replacements[1].placeholder).toBe('[REDACTED_PHONE]');
    });
  });

  describe('Partial Mask Mode', () => {
    it('masks email preserving first char and domain', () => {
      expect(getPartialMask(ENTITY_TYPES.EMAIL, 'johndoe@gmail.com')).toBe('j***@gmail.com');
    });

    it('masks phone preserving last 4 digits', () => {
      expect(getPartialMask(ENTITY_TYPES.PHONE, '+91 98765 43210')).toBe('XXXXXX3210');
    });

    it('masks credit card in XXXX-XXXX-XXXX-1234 format', () => {
      expect(getPartialMask(ENTITY_TYPES.CREDIT_CARD, '4111 1111 1111 1234')).toBe('XXXX-XXXX-XXXX-1234');
    });

    it('masks Aadhaar in XXXX-XXXX-1234 format', () => {
      expect(getPartialMask(ENTITY_TYPES.AADHAAR, '2345 6789 1234')).toBe('XXXX-XXXX-1234');
    });

    it('masks PAN in XXXXX1234X format', () => {
      expect(getPartialMask(ENTITY_TYPES.PAN, 'ABCDE1234F')).toBe('XXXXX1234X');
    });

    it('masks IP preserving first 2 octets', () => {
      expect(getPartialMask(ENTITY_TYPES.IP, '192.168.1.100')).toBe('192.168.XXX.XXX');
    });

    it('redacts text in partial mode', () => {
      const res = redactText(sampleText, sampleMatches, REDACTION_MODES.PARTIAL);
      expect(res.sanitizedText).toBe('Contact a***@example.com or phone XXXXXX3210.');
    });
  });

  describe('Consistent Pseudonymization Mode', () => {
    it('maps identical normalized entities to the exact same placeholder', () => {
      const text = 'Primary: +91 98765 43210, Secondary: 9876543210, Alt: 09876543210.';
      const p1 = '+91 98765 43210';
      const p2 = '9876543210';
      const p3 = '09876543210';

      const s1 = text.indexOf(p1);
      const s2 = text.indexOf(p2);
      const s3 = text.indexOf(p3);

      const matches = [
        { type: ENTITY_TYPES.PHONE, value: p1, start: s1, end: s1 + p1.length, normalized: '9876543210' },
        { type: ENTITY_TYPES.PHONE, value: p2, start: s2, end: s2 + p2.length, normalized: '9876543210' },
        { type: ENTITY_TYPES.PHONE, value: p3, start: s3, end: s3 + p3.length, normalized: '9876543210' },
      ];
      const res = redactText(text, matches, REDACTION_MODES.PSEUDONYM);
      expect(res.sanitizedText).toBe('Primary: PHONE_01, Secondary: PHONE_01, Alt: PHONE_01.');
      // Only 1 unique entry in mapping table
      expect(res.mapping).toHaveLength(1);
      expect(res.mapping[0].placeholder).toBe('PHONE_01');
      expect(res.mapping[0].normalized).toBe('9876543210');
    });

    it('increments index per entity type in order of first appearance', () => {
      const text = 'User user1@test.com and user2@test.com with card 4111 1111 1111 1111.';
      const e1 = 'user1@test.com';
      const e2 = 'user2@test.com';
      const c1 = '4111 1111 1111 1111';

      const s1 = text.indexOf(e1);
      const s2 = text.indexOf(e2);
      const s3 = text.indexOf(c1);

      const matches = [
        { type: ENTITY_TYPES.EMAIL, value: e1, start: s1, end: s1 + e1.length, normalized: e1 },
        { type: ENTITY_TYPES.EMAIL, value: e2, start: s2, end: s2 + e2.length, normalized: e2 },
        { type: ENTITY_TYPES.CREDIT_CARD, value: c1, start: s3, end: s3 + c1.length, normalized: '4111111111111111' },
      ];
      const res = redactText(text, matches, REDACTION_MODES.PSEUDONYM);
      expect(res.sanitizedText).toBe('User EMAIL_01 and EMAIL_02 with card CARD_01.');
      expect(res.mapping).toHaveLength(3);
    });

    it('ensures replacement text never contains commas (CSV safety)', () => {
      const text = 'csv_row,user@domain.com,192.168.1.1';
      const e1 = 'user@domain.com';
      const ip1 = '192.168.1.1';
      const s1 = text.indexOf(e1);
      const s2 = text.indexOf(ip1);

      const matches = [
        { type: ENTITY_TYPES.EMAIL, value: e1, start: s1, end: s1 + e1.length, normalized: e1 },
        { type: ENTITY_TYPES.IP, value: ip1, start: s2, end: s2 + ip1.length, normalized: ip1 },
      ];
      for (const mode of [REDACTION_MODES.FULL, REDACTION_MODES.PARTIAL, REDACTION_MODES.PSEUDONYM]) {
        const res = redactText(text, matches, mode);
        // The number of commas should remain exactly 2
        const commaCount = (res.sanitizedText.match(/,/g) || []).length;
        expect(commaCount).toBe(2);
      }
    });

    it('guarantees sanitized export/copy text contains no UI type labels or HTML tags', () => {
      const text = 'Alert: user john@example.com logged in from 10.0.0.1 with card 4111 1111 1111 1111.';
      const e1 = 'john@example.com';
      const ip1 = '10.0.0.1';
      const c1 = '4111 1111 1111 1111';

      const s1 = text.indexOf(e1);
      const s2 = text.indexOf(ip1);
      const s3 = text.indexOf(c1);

      const matches = [
        { type: ENTITY_TYPES.EMAIL, value: e1, start: s1, end: s1 + e1.length, normalized: e1 },
        { type: ENTITY_TYPES.IP, value: ip1, start: s2, end: s2 + ip1.length, normalized: ip1 },
        { type: ENTITY_TYPES.CREDIT_CARD, value: c1, start: s3, end: s3 + c1.length, normalized: '4111111111111111' },
      ];

      for (const mode of [REDACTION_MODES.FULL, REDACTION_MODES.PARTIAL, REDACTION_MODES.PSEUDONYM]) {
        const res = redactText(text, matches, mode);
        // Verify output is strictly plain text without any HTML elements or UI badges
        expect(res.sanitizedText).not.toMatch(/<[^>]*>/);
        expect(res.sanitizedText).not.toContain('class="');
        expect(res.sanitizedText).not.toContain('entity-type-tag');
        expect(res.sanitizedText).not.toContain('hl-tag');
        expect(res.sanitizedText).not.toContain('aria-label');

        // Verify it never contains separate UI badge labels like " Payment Card" or " IP Address"
        expect(res.sanitizedText).not.toContain('Payment Card');
        expect(res.sanitizedText).not.toContain('IP Address');
      }
    });
  });
});
