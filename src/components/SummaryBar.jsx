import React from 'react';
import { ENTITY_TYPES, ENTITY_METADATA } from '../lib/constants.js';
import RiskMeter from './RiskMeter.jsx';

/**
 * Summary bar component displaying detection statistics, live entity counts,
 * privacy risk gauge, compliance framework flags, and accessibility live regions.
 *
 * @param {Object} props
 * @param {import('../lib/detectors.js').DetectedEntity[]} props.matches - Valid detected entities.
 * @param {number} props.luhnFailedCount - Count of card-like sequences failing Luhn.
 * @param {Object.<string, boolean>} props.enabledTypes - Map of enabled types.
 * @param {number} [props.excludedCount=0] - Count of items excluded by "Don't redact".
 * @param {{ score: number, level: string, activeCount: number }} [props.riskScore] - Risk score object.
 * @param {{ title: string, details: string, recommendation: string }} [props.riskSummary] - Risk summary object.
 * @param {Array<{ id: string, name: string, description: string, color: string }>} [props.complianceTags] - Compliance tags.
 * @returns {React.ReactElement} The SummaryBar component.
 */
export default function SummaryBar({
  matches,
  luhnFailedCount = 0,
  verhoeffFailedCount = 0,
  enabledTypes = {},
  excludedCount = 0,
  riskScore,
  riskSummary,
  complianceTags = [],
  strictChecksum = true,
}) {
  // Aggregate counts per entity type
  const countsByType = {};
  for (const type of Object.values(ENTITY_TYPES)) {
    countsByType[type] = 0;
  }

  for (const match of matches) {
    if (countsByType[match.type] !== undefined) {
      countsByType[match.type]++;
    }
  }

  const totalCount = matches.length;

  return (
    <section className="summary-bar tilt-card" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="visually-hidden">
        Detection Summary
      </h2>

      {/* Main Stats Row */}
      <div className="summary-main-row">
        <div className="summary-badges-group">
          <div className="total-stat-badge">
            <span className="total-label">Total PII Detected</span>
            <span className="total-number">{totalCount}</span>
          </div>
          {excludedCount > 0 && (
            <div className="excluded-stat-badge" title="Items explicitly marked as 'Don't redact'">
              <span className="excluded-label">Excluded from Redaction</span>
              <span className="excluded-number">{excludedCount}</span>
            </div>
          )}
        </div>

        {/* Counts per entity type */}
        <div className="entity-stat-grid" role="list" aria-label="Detected entity counts">
          {Object.values(ENTITY_TYPES).map((type) => {
            const meta = ENTITY_METADATA[type];
            if (!meta) return null;
            const isEnabled = enabledTypes[type] !== false;
            const count = countsByType[type] || 0;

            return (
              <div
                key={type}
                role="listitem"
                className={`entity-stat-card ${!isEnabled ? 'is-disabled' : ''} ${count > 0 ? 'has-matches' : ''}`}
                style={{
                  '--hl-bg': meta.badgeColor,
                  '--hl-text': meta.textColor,
                }}
              >
                <div className="stat-card-header">
                  <span
                    className="stat-color-dot"
                    style={{ backgroundColor: meta.badgeColor }}
                    aria-hidden="true"
                  ></span>
                  <span className="stat-name">{meta.label}</span>
                </div>
                <div className="stat-card-count">
                  {isEnabled ? count : 'Off'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Exposure Meter & Guidance */}
      {riskScore && (
        <RiskMeter riskScore={riskScore} riskSummary={riskSummary} />
      )}

      {/* Regulatory Compliance Frameworks */}
      {complianceTags.length > 0 && (
        <div className="compliance-tags-bar" role="region" aria-label="Regulatory Compliance Flags">
          <span className="compliance-title">Applicable Regulatory Frameworks:</span>
          <div className="compliance-badges-list">
            {complianceTags.map((tag) => (
              <div
                key={tag.id}
                className="compliance-pill"
                style={{
                  '--comp-color': tag.color,
                }}
                title={tag.description}
              >
                <span className="comp-dot" aria-hidden="true" />
                <span className="comp-name">{tag.name}</span>
                <span className="comp-desc">— {tag.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessible aria-live status announcement for screen readers */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {totalCount === 0
          ? 'No PII entities detected.'
          : `${totalCount} PII entities detected, risk level ${riskScore?.level || 'Low'}.`}
      </div>

      {/* Note under counts regarding Checksum validation failures */}
      <div className="luhn-failed-note" role="note">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {strictChecksum ? (
          <>
            <span className="luhn-note-highlight">
              Checksum-failed numbers ignored: {luhnFailedCount} cards (Luhn), {verhoeffFailedCount} Aadhaar-like (Verhoeff)
            </span>
            <span className="luhn-note-detail">
              (Numbers matching card or Aadhaar patterns that fail checksum algorithms are excluded to prevent false positives. Turn off strict validation to redact them anyway.)
            </span>
          </>
        ) : (
          <>
            <span className="luhn-note-highlight">
              Strict checksum validation off: {luhnFailedCount} cards (Luhn), {verhoeffFailedCount} Aadhaar-like (Verhoeff) detected and redacted as unverified
            </span>
            <span className="luhn-note-detail">
              (Maximum caution active: numbers matching card or Aadhaar formats are redacted even if checksum validation fails.)
            </span>
          </>
        )}
      </div>
    </section>
  );
}
