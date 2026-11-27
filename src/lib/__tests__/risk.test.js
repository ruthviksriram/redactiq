import { describe, it, expect } from 'vitest';
import {
  calculateRiskScore,
  generateRiskSummary,
  evaluateComplianceTags,
  generateAuditReport,
} from '../risk.js';
import { detectEntities } from '../detectors.js';
import { ENTITY_TYPES, REDACTION_MODES } from '../constants.js';

describe('risk.js and Custom Rules (Part 2)', () => {
  describe('Custom Rules Detection', () => {
    const text = 'Top secret Project-Orion deployed by secretKey99. Also tested PROJECT-ORION.';

    it('detects exact keywords case-insensitively', () => {
      const customRules = [
        { id: '1', pattern: 'secretKey99', isRegex: false },
      ];
      const res = detectEntities(text, {}, customRules);
      const customMatches = res.matches.filter((m) => m.type === ENTITY_TYPES.CUSTOM_RULE);
      expect(customMatches).toHaveLength(1);
      expect(customMatches[0].value).toBe('secretKey99');
    });

    it('detects patterns using regular expressions', () => {
      const customRules = [
        { id: '2', pattern: 'project-[a-z]+', isRegex: true },
      ];
      const res = detectEntities(text, {}, customRules);
      const customMatches = res.matches.filter((m) => m.type === ENTITY_TYPES.CUSTOM_RULE);
      expect(customMatches).toHaveLength(2);
      expect(customMatches[0].value).toBe('Project-Orion');
      expect(customMatches[1].value).toBe('PROJECT-ORION');
    });

    it('gracefully handles invalid regex patterns without throwing', () => {
      const customRules = [
        { id: '3', pattern: '[unclosed(bracket', isRegex: true },
      ];
      expect(() => {
        const res = detectEntities(text, {}, customRules);
        expect(res.matches).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Risk Scoring', () => {
    it('returns score 0 and Low level when no active entities exist', () => {
      const result = calculateRiskScore([], {}, {});
      expect(result.score).toBe(0);
      expect(result.level).toBe('Low');
      expect(result.activeCount).toBe(0);
    });

    it('calculates score based on sensitivity weights (Cards/Aadhaar high, IP low)', () => {
      const ipOnly = [
        { type: ENTITY_TYPES.IP, normalized: '192.168.1.1' },
      ];
      const resIp = calculateRiskScore(ipOnly, {}, {});
      expect(resIp.score).toBeLessThan(15);
      expect(resIp.level).toBe('Low');

      const cardAndAadhaar = [
        { type: ENTITY_TYPES.CREDIT_CARD, normalized: '4111111111111111' },
        { type: ENTITY_TYPES.AADHAAR, normalized: '234567890124' },
        { type: ENTITY_TYPES.PAN, normalized: 'AAAPL1234C' },
      ];
      const resCritical = calculateRiskScore(cardAndAadhaar, {}, {});
      expect(resCritical.score).toBeGreaterThanOrEqual(75);
      expect(['High', 'Critical']).toContain(resCritical.level);
    });

    it('updates live and decrements risk when items are excluded by "Don\'t redact"', () => {
      const matches = [
        { type: ENTITY_TYPES.CREDIT_CARD, normalized: '4111111111111111' },
        { type: ENTITY_TYPES.EMAIL, normalized: 'alice@example.com' },
      ];

      const beforeOverride = calculateRiskScore(matches, {}, {});
      expect(beforeOverride.activeCount).toBe(2);

      // Exclude credit card
      const overrides = {
        [`${ENTITY_TYPES.CREDIT_CARD}::4111111111111111`]: 'NONE',
      };
      const afterOverride = calculateRiskScore(matches, overrides, {});
      expect(afterOverride.activeCount).toBe(1);
      expect(afterOverride.score).toBeLessThan(beforeOverride.score);
    });

    it('updates live and excludes disabled entity types from risk calculation', () => {
      const matches = [
        { type: ENTITY_TYPES.CREDIT_CARD, normalized: '4111111111111111' },
      ];
      const enabled = { [ENTITY_TYPES.CREDIT_CARD]: false };
      const res = calculateRiskScore(matches, {}, enabled);
      expect(res.score).toBe(0);
      expect(res.activeCount).toBe(0);
    });

    it('caps maximum risk score at 100', () => {
      const hugeMatches = Array.from({ length: 50 }, (_, i) => ({
        type: ENTITY_TYPES.CREDIT_CARD,
        normalized: `411111111111111${i % 10}`,
      }));
      const res = calculateRiskScore(hugeMatches, {}, {});
      expect(res.score).toBe(100);
      expect(res.level).toBe('Critical');
    });
  });

  describe('Regulatory Compliance Frameworks', () => {
    it('flags PCI-DSS when payment cards are detected', () => {
      const matches = [{ type: ENTITY_TYPES.CREDIT_CARD, normalized: '4111111111111111' }];
      const tags = evaluateComplianceTags(matches, {}, {});
      const tagIds = tags.map((t) => t.id);
      expect(tagIds).toContain('PCI-DSS');
    });

    it('flags India DPDP Act 2023 for personal IDs (PAN, Aadhaar, Phone, Email)', () => {
      const matches = [{ type: ENTITY_TYPES.PAN, normalized: 'AAAPL1234C' }];
      const tags = evaluateComplianceTags(matches, {}, {});
      const tagIds = tags.map((t) => t.id);
      expect(tagIds).toContain('DPDP');
    });

    it('flags EU GDPR for online and contact identifiers (Email, IP, Phone)', () => {
      const matches = [{ type: ENTITY_TYPES.IP, normalized: '10.0.0.1' }];
      const tags = evaluateComplianceTags(matches, {}, {});
      const tagIds = tags.map((t) => t.id);
      expect(tagIds).toContain('GDPR');
    });
  });

  describe('Audit Report Generation (Zero-PII Proof)', () => {
    it('generates an audit report containing statistics and compliance tags without any raw PII values', () => {
      const secretCard = '4111 1111 1111 1111';
      const secretEmail = 'ceo@confidential.org';
      const secretAadhaar = '2345 6789 0124';

      const matches = [
        { type: ENTITY_TYPES.CREDIT_CARD, value: secretCard, normalized: '4111111111111111' },
        { type: ENTITY_TYPES.EMAIL, value: secretEmail, normalized: secretEmail },
        { type: ENTITY_TYPES.AADHAAR, value: secretAadhaar, normalized: '234567890124' },
      ];

      const riskScore = calculateRiskScore(matches);
      const complianceTags = evaluateComplianceTags(matches);

      const report = generateAuditReport({
        mode: REDACTION_MODES.FULL,
        matches,
        luhnFailedCount: 1,
        verhoeffFailedCount: 0,
        excludedCount: 0,
        riskScore,
        complianceTags,
      });

      // Report metadata assertions
      expect(report.reportVersion).toBe('1.0');
      expect(report.redactionStrategy.mode).toBe(REDACTION_MODES.FULL);
      expect(report.statistics.totalEntitiesDetected).toBe(3);
      expect(report.statistics.luhnValidationFailures).toBe(1);
      expect(report.privacyRiskAssessment.score).toBe(riskScore.score);
      expect(report.complianceFrameworks.length).toBeGreaterThan(0);

      // CRITICAL SECURITY PROOF: Serialize report to string and verify raw PII is NEVER present
      const serialized = JSON.stringify(report);
      expect(serialized).not.toContain(secretCard);
      expect(serialized).not.toContain('4111111111111111');
      expect(serialized).not.toContain(secretEmail);
      expect(serialized).not.toContain(secretAadhaar);
      expect(serialized).not.toContain('234567890124');
    });
  });

  describe('Risk Summary Generator', () => {
    it('generates an auto-generated plain text summary without external AI', () => {
      const matches = [
        { type: ENTITY_TYPES.CREDIT_CARD, normalized: '4111111111111111' },
      ];
      const riskScore = calculateRiskScore(matches);
      const summary = generateRiskSummary(matches, riskScore, REDACTION_MODES.FULL);

      expect(summary.title).toContain('Risk Exposure');
      expect(summary.details).toContain('financial records');
      expect(summary.recommendation).toContain('Full Mask');
    });
  });
});
