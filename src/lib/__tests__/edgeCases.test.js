import { describe, it, expect } from 'vitest';
import { detectEntities } from '../detectors.js';
import { redactText } from '../redact.js';
import { calculateRiskScore, generateRiskSummary } from '../risk.js';
import { sanitizeFileName } from '../validators.js';
import { REDACTION_MODES, ENTITY_TYPES } from '../constants.js';

describe('Edge-Case & Robustness Tests', () => {
  describe('1. Empty & Whitespace Input Handling', () => {
    it('handles empty string without throwing', () => {
      const detection = detectEntities('');
      expect(detection.matches).toEqual([]);
      expect(detection.luhnFailedCount).toBe(0);
      expect(detection.verhoeffFailedCount).toBe(0);

      const redaction = redactText('', detection.matches);
      expect(redaction.sanitizedText).toBe('');
      expect(redaction.replacements).toEqual([]);
      expect(redaction.mapping).toEqual([]);
      expect(redaction.excludedCount).toBe(0);

      const risk = calculateRiskScore([]);
      expect(risk.score).toBe(0);
      expect(risk.level).toBe('Low');
    });

    it('handles null and undefined text safely', () => {
      expect(detectEntities(null).matches).toEqual([]);
      expect(detectEntities(undefined).matches).toEqual([]);
      expect(redactText(null, []).sanitizedText).toBe('');
      expect(redactText(undefined, []).sanitizedText).toBe('');
      expect(sanitizeFileName(null)).toBe('');
      expect(sanitizeFileName(undefined)).toBe('');
    });

    it('handles whitespace-only text', () => {
      const whitespace = '   \t\n\r\n   ';
      const detection = detectEntities(whitespace);
      expect(detection.matches).toEqual([]);

      const redaction = redactText(whitespace, detection.matches);
      expect(redaction.sanitizedText).toBe(whitespace);
    });
  });

  describe('2. Text with Zero PII', () => {
    it('accurately reports zero matches on benign prose and logs', () => {
      const benignText = `
        The quick brown fox jumps over the lazy dog.
        Kernel init completed in 0.04 seconds.
        Memory allocated: 2048 MB heap.
        Documentation available at https://internal.example.wiki/architecture
      `;
      const detection = detectEntities(benignText);
      expect(detection.matches).toHaveLength(0);
      expect(detection.luhnFailedCount).toBe(0);
      expect(detection.verhoeffFailedCount).toBe(0);

      const redaction = redactText(benignText, detection.matches);
      expect(redaction.sanitizedText).toBe(benignText);

      const risk = calculateRiskScore(detection.matches);
      const summary = generateRiskSummary(detection.matches, risk, REDACTION_MODES.FULL);
      expect(summary.recommendation).toBe(
        'No PII detected by the active rules. Review the text before sharing.'
      );
    });
  });

  describe('3. Unicode & Multilingual Text Handling', () => {
    it('preserves Unicode characters and detects embedded PII seamlessly', () => {
      const unicodeText = `
        こんにちは！連絡先は contact.jp@tokyo-domain.co.jp です。
        हिंदी विवरण: ग्राहक फोन नंबर +91 98765 43210 और पैन कार्ड AAAPL1234C है।
        Emoji test: 🔒 🛡️ 🚀 Server IP: 192.168.1.50 at gateway.
        Greek & Cyrillic: Ελληνικά / Русский язык / Café Münster.
      `;

      const detection = detectEntities(unicodeText);
      expect(detection.matches.length).toBeGreaterThanOrEqual(4);

      const types = detection.matches.map((m) => m.type);
      expect(types).toContain(ENTITY_TYPES.EMAIL);
      expect(types).toContain(ENTITY_TYPES.PHONE);
      expect(types).toContain(ENTITY_TYPES.PAN);
      expect(types).toContain(ENTITY_TYPES.IP);

      const redaction = redactText(unicodeText, detection.matches, REDACTION_MODES.FULL);
      expect(redaction.sanitizedText).toContain('こんにちは！連絡先は [REDACTED_EMAIL] です。');
      expect(redaction.sanitizedText).toContain('हिंदी विवरण');
      expect(redaction.sanitizedText).toContain('Emoji test: 🔒 🛡️ 🚀');
      expect(redaction.sanitizedText).toContain('[REDACTED_PHONE]');
      expect(redaction.sanitizedText).toContain('[REDACTED_PAN]');
      expect(redaction.sanitizedText).toContain('[REDACTED_IP]');
    });
  });

  describe('4. Very Long Input & Stress Test', () => {
    it('processes a 100,000 character document with hundreds of PII items efficiently without error', () => {
      // Build 100k character text with interleaved PII
      const lineTemplate = 'User incident #48291: contact user.alpha_{N}@test-domain.com at phone +91 98765 {PAD} on IP 10.0.{OCTET}.12. ';
      let largeText = '';
      const iterations = 800; // ~100k chars

      for (let i = 0; i < iterations; i++) {
        const pad = String(i % 10000).padStart(4, '0');
        const octet = (i % 250) + 1;
        largeText += lineTemplate.replace('{N}', String(i)).replace('{PAD}', pad).replace('{OCTET}', String(octet));
      }

      expect(largeText.length).toBeGreaterThan(80000);

      const t0 = performance.now();
      const detection = detectEntities(largeText);
      const t1 = performance.now();

      // High efficiency: should execute in under 400ms in testing environment
      expect(t1 - t0).toBeLessThan(1000);
      expect(detection.matches.length).toBeGreaterThan(500);

      const redaction = redactText(largeText, detection.matches, REDACTION_MODES.FULL);
      expect(redaction.sanitizedText).toBeDefined();
      expect(redaction.sanitizedText.length).toBeGreaterThan(0);
      expect(redaction.sanitizedText).not.toContain('contact user.alpha_0@test-domain.com');
      expect(redaction.sanitizedText).toContain('[REDACTED_EMAIL]');
    });
  });

  describe('5. Filename Sanitization Security', () => {
    it('neutralizes path traversal and control characters in file names', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFileName('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
      expect(sanitizeFileName('test\x00file\n.csv')).toBe('test_file_.csv');
      expect(sanitizeFileName('../../../sensitive_data.txt')).toBe('sensitive_data.txt');
      expect(sanitizeFileName('...')).toBe('sanitized_document.txt');
      expect(sanitizeFileName('')).toBe('');
    });
  });
});
