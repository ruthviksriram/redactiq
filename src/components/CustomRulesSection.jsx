import React, { useState } from 'react';

/**
 * Custom rules management component allowing users to define keywords or regex patterns.
 *
 * @param {Object} props
 * @param {Array<{ id: string, pattern: string, isRegex: boolean }>} props.rules
 * @param {function(Array<{ id: string, pattern: string, isRegex: boolean }>): void} props.onRulesChange
 * @returns {React.ReactElement}
 */
export default function CustomRulesSection({ rules = [], onRulesChange }) {
  const [patternInput, setPatternInput] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [regexError, setRegexError] = useState(null);

  const handlePatternChange = (e) => {
    const val = e.target.value;
    setPatternInput(val);
    if (isRegex && val.trim()) {
      try {
        new RegExp(val.trim(), 'gi');
        setRegexError(null);
      } catch (err) {
        setRegexError(err instanceof Error ? err.message : 'Invalid regex pattern');
      }
    } else {
      setRegexError(null);
    }
  };

  const handleToggleIsRegex = (targetIsRegex) => {
    setIsRegex(targetIsRegex);
    if (targetIsRegex && patternInput.trim()) {
      try {
        new RegExp(patternInput.trim(), 'gi');
        setRegexError(null);
      } catch (err) {
        setRegexError(err instanceof Error ? err.message : 'Invalid regex pattern');
      }
    } else {
      setRegexError(null);
    }
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    const cleanPattern = patternInput.trim();
    if (!cleanPattern) return;

    if (isRegex) {
      try {
        new RegExp(cleanPattern, 'gi');
      } catch (err) {
        setRegexError(err instanceof Error ? err.message : 'Invalid regex pattern');
        return;
      }
    }

    const newRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pattern: cleanPattern,
      isRegex,
    };

    onRulesChange([...rules, newRule]);
    setPatternInput('');
    setRegexError(null);
  };

  const handleRemoveRule = (idToRemove) => {
    onRulesChange(rules.filter((r) => r.id !== idToRemove));
  };

  return (
    <div className="custom-rules-card card-3d" aria-label="Custom Pattern Rules">
      <div className="custom-rules-header">
        <div className="custom-rules-title-group">
          <span className="custom-rules-icon" aria-hidden="true">⚙️</span>
          <div>
            <h3 className="custom-rules-title">Custom Detection Rules</h3>
            <p className="custom-rules-subtitle">
              Add proprietary terms, project code names, or custom regex patterns to detect and mask as custom entities.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddRule} className="custom-rules-form">
        <div className="rules-input-row">
          <div className="rules-type-toggle" role="radiogroup" aria-label="Rule pattern type">
            <button
              type="button"
              role="radio"
              aria-checked={!isRegex}
              className={`rule-type-btn ${!isRegex ? 'is-active' : ''}`}
              onClick={() => handleToggleIsRegex(false)}
            >
              Keyword (Exact)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isRegex}
              className={`rule-type-btn ${isRegex ? 'is-active' : ''}`}
              onClick={() => handleToggleIsRegex(true)}
            >
              Regular Expression
            </button>
          </div>

          <div className="rule-field-group">
            <label htmlFor="custom-rule-pattern-input" className="visually-hidden">
              {isRegex ? 'Regular expression pattern' : 'Exact keyword'}
            </label>
            <input
              id="custom-rule-pattern-input"
              name="custom-rule-pattern-input"
              type="text"
              value={patternInput}
              onChange={handlePatternChange}
              placeholder={
                isRegex
                  ? 'Enter regex pattern, e.g. \\bPROJECT-[A-Z]{3}-\\d+\\b'
                  : 'Enter exact keyword, e.g. AcmeSecretKey'
              }
              className={`rule-pattern-input ${regexError ? 'has-error' : ''}`}
              aria-label="Custom rule pattern"
            />
            <button
              type="submit"
              disabled={!patternInput.trim() || Boolean(regexError)}
              className="btn btn-3d btn-primary btn-sm add-rule-btn"
            >
              Add Rule
            </button>
          </div>
        </div>

        {regexError && (
          <div className="rule-error-msg" role="alert">
            <span aria-hidden="true">⚠️</span>
            <span>{regexError}</span>
          </div>
        )}
      </form>

      {rules.length > 0 && (
        <div className="active-rules-list" aria-label="Active custom rules">
          <span className="active-rules-label">Active Custom Rules ({rules.length}):</span>
          <div className="active-rules-chips">
            {rules.map((rule) => (
              <div key={rule.id} className="rule-chip">
                <span className="rule-type-tag">
                  {rule.isRegex ? 'REGEX' : 'KEYWORD'}
                </span>
                <code className="rule-pattern-code">{rule.pattern}</code>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule.id)}
                  className="rule-remove-btn"
                  aria-label={`Remove rule ${rule.pattern}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
