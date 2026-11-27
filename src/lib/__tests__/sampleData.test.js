import { describe, it, expect } from 'vitest';
import { detectEntities } from '../detectors.js';
import { SAMPLE_TEXT, SAMPLE_EXPECTED_COUNTS } from '../sampleData.js';
import { ENTITY_TYPES } from '../constants.js';

describe('sampleData.js Integration Test', () => {
  it('detects all expected entities with exact counts on SAMPLE_TEXT', () => {
    const { matches, luhnFailedCount } = detectEntities(SAMPLE_TEXT);

    const countsByType = {
      [ENTITY_TYPES.EMAIL]: 0,
      [ENTITY_TYPES.PHONE]: 0,
      [ENTITY_TYPES.IP]: 0,
      [ENTITY_TYPES.PAN]: 0,
      [ENTITY_TYPES.AADHAAR]: 0,
      [ENTITY_TYPES.CREDIT_CARD]: 0,
    };

    for (const match of matches) {
      expect(countsByType[match.type]).toBeDefined();
      countsByType[match.type]++;
    }

    expect(countsByType[ENTITY_TYPES.EMAIL]).toBe(SAMPLE_EXPECTED_COUNTS.EMAIL);
    expect(countsByType[ENTITY_TYPES.PHONE]).toBe(SAMPLE_EXPECTED_COUNTS.PHONE);
    expect(countsByType[ENTITY_TYPES.IP]).toBe(SAMPLE_EXPECTED_COUNTS.IP);
    expect(countsByType[ENTITY_TYPES.PAN]).toBe(SAMPLE_EXPECTED_COUNTS.PAN);
    expect(countsByType[ENTITY_TYPES.AADHAAR]).toBe(SAMPLE_EXPECTED_COUNTS.AADHAAR);
    expect(countsByType[ENTITY_TYPES.CREDIT_CARD]).toBe(SAMPLE_EXPECTED_COUNTS.CREDIT_CARD);

    // Verify Luhn failure count
    expect(luhnFailedCount).toBe(SAMPLE_EXPECTED_COUNTS.LUHN_FAILED);

    // Verify invalid elements in sampleData were NOT detected:
    const values = matches.map((m) => m.value);
    expect(values).not.toContain('999.1.1.1'); // Invalid IP
    expect(values).not.toContain('256.0.0.1'); // Invalid IP
    expect(values).not.toContain('ABCDE1234F'); // Invalid PAN
    expect(values).not.toContain('2345 6789 0125'); // Verhoeff-failed Aadhaar
    expect(values).not.toContain('1234 5678 9012 3456'); // Luhn-failed Card
  });
});
