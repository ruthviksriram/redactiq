import React from 'react';
import PropTypes from 'prop-types';

/**
 * Visual privacy risk exposure gauge and assessment summary component.
 *
 * @param {Object} props
 * @param {{ score: number, level: string, activeCount: number }} props.riskScore - Calculated risk score.
 * @param {{ title: string, details: string, recommendation: string }} props.riskSummary - Auto-generated assessment summary.
 * @returns {React.ReactElement}
 */
export default function RiskMeter({ riskScore, riskSummary }) {
  const score = riskScore?.score || 0;
  const level = riskScore?.level || 'Low';

  const levelColors = {
    Low: {
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
    },
    Medium: {
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
    },
    High: {
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.15)',
      border: 'rgba(251, 146, 60, 0.35)',
    },
    Critical: {
      color: '#F43F5E',
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
    },
  };

  const currentLevelStyle = levelColors[level] || levelColors.Low;

  return (
    <div className="risk-meter-wrapper" aria-label="Privacy Risk Meter">
      <div className="risk-meter-header">
        <div className="risk-meter-title-row">
          <span className="risk-meter-icon" aria-hidden="true">
            🛡️
          </span>
          <div>
            <span className="risk-meter-label">Privacy Risk Exposure</span>
            <div className="risk-score-badge-row">
              <span
                className="risk-level-badge"
                style={{
                  backgroundColor: currentLevelStyle.bg,
                  color: currentLevelStyle.color,
                  borderColor: currentLevelStyle.border,
                }}
              >
                {level} Risk
              </span>
              <span className="risk-score-text">{score} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible progress meter bar */}
      <div
        role="meter"
        aria-label="Privacy Risk Score"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${score} out of 100, ${level} risk level`}
        className="risk-progress-track"
      >
        <div
          className="risk-progress-fill"
          style={{
            width: `${Math.max(4, score)}%`,
            backgroundColor: currentLevelStyle.color,
          }}
        />
      </div>

      {/* Auto-generated plain summary */}
      {riskSummary && (
        <div className="risk-summary-callout">
          <p className="risk-summary-details">{riskSummary.details}</p>
          <p className="risk-summary-rec">
            <strong>Guidance:</strong> {riskSummary.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

RiskMeter.propTypes = {
  riskScore: PropTypes.shape({
    score: PropTypes.number,
    level: PropTypes.string,
    activeCount: PropTypes.number,
  }),
  riskSummary: PropTypes.shape({
    title: PropTypes.string,
    details: PropTypes.string,
    recommendation: PropTypes.string,
  }),
};

RiskMeter.defaultProps = {
  riskScore: null,
  riskSummary: null,
};
