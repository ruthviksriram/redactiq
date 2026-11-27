import React from 'react';
import { ENTITY_TYPES, ENTITY_METADATA } from '../lib/constants.js';

/**
 * Summary bar component displaying detection statistics, live entity counts,
 * an aria-live region for accessibility, and note on Luhn-failed numbers.
 *
 * @param {Object} props
 * @param {import('../lib/detectors.js').DetectedEntity[]} props.matches - Valid detected entities.
 * @param {number} props.luhnFailedCount - Count of card-like sequences failing Luhn.
 * @param {Object.<string, boolean>} props.enabledTypes - Map of enabled types.
 * @returns {React.ReactElement} The SummaryBar component.
 */
export default function SummaryBar({
  matches,
  luhnFailedCount = 0,
  enabledTypes = {},
  excludedCount = 0,
}) {
  // Aggregate counts per entity type
  const countsByType = {
    [ENTITY_TYPES.EMAIL]: 0,
    [ENTITY_TYPES.PHONE]: 0,
    [ENTITY_TYPES.IP]: 0,
    [ENTITY_TYPES.PAN]: 0,
    [ENTITY_TYPES.AADHAAR]: 0,
    [ENTITY_TYPES.CREDIT_CARD]: 0,
  };

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

      {/* Accessible aria-live status announcement for screen readers */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {totalCount === 0
          ? 'No PII entities detected.'
          : `${totalCount} PII entities detected: ${Object.entries(countsByType)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `${count} ${ENTITY_METADATA[type]?.label || type}`)
              .join(', ')}.`}
      </div>

      {/* Note under counts regarding Luhn validation failures */}
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
        <span className="luhn-note-highlight">
          Luhn-failed numbers ignored: {luhnFailedCount}
        </span>
        <span className="luhn-note-detail">
          (Random 13–19 digit sequences failing the Luhn algorithm are safely excluded to prevent false positives)
        </span>
      </div>
    </section>
  );
}
