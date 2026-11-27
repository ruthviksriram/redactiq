import React, { useState, useRef } from 'react';
import HighlightedText from './HighlightedText.jsx';
import OverridePopover from './OverridePopover.jsx';
import { REDACTION_MODES, OVERRIDE_OPTIONS } from '../lib/constants.js';

/**
 * Side-by-side audit view component:
 * Left panel = Original text with detected entities highlighted, labeled, and interactive for overrides.
 * Right panel = Sanitized output with redaction replacements highlighted and labeled.
 *
 * @param {Object} props
 * @param {string} props.originalText - Source text.
 * @param {import('../lib/detectors.js').DetectedEntity[]} props.matches - Detected entities.
 * @param {string} props.sanitizedText - Sanitized output text.
 * @param {Array<{ placeholder: string, original: string, type: string, start: number, end: number, mode?: string, isExcluded?: boolean }>} props.replacements - Sanitized replacement spans.
 * @param {string} props.mode - Active redaction mode.
 * @param {Record<string, string>} [props.overrides] - Active per-item overrides map.
 * @param {function(string, string): void} [props.onOverrideChange] - Override change callback (key, option).
 * @param {function(): void} [props.onResetOverrides] - Reset all overrides callback.
 * @returns {React.ReactElement} The AuditView component.
 */
export default function AuditView({
  originalText,
  matches,
  sanitizedText,
  replacements,
  mode,
  overrides = {},
  onOverrideChange,
  onResetOverrides,
}) {
  const [popoverState, setPopoverState] = useState(null); // { entity, anchorRect, triggerElement }
  const triggerRef = useRef(null);

  const modeLabels = {
    [REDACTION_MODES.FULL]: 'Full Mask',
    [REDACTION_MODES.PARTIAL]: 'Partial Mask',
    [REDACTION_MODES.PSEUDONYM]: 'Consistent Pseudonym',
    [REDACTION_MODES.CUSTOM]: 'Custom per-type',
  };

  const isEmpty = !originalText.trim();
  const overrideCount = Object.keys(overrides).length;

  const handleSelectEntity = (entity, triggerElement) => {
    triggerRef.current = triggerElement;
    const rect = triggerElement.getBoundingClientRect();
    setPopoverState({
      entity,
      anchorRect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  const handleClosePopover = () => {
    setPopoverState(null);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  const handleApplyOverride = (optionId) => {
    if (!popoverState?.entity || !onOverrideChange) return;
    const itemKey = `${popoverState.entity.type}::${popoverState.entity.normalized}`;
    onOverrideChange(itemKey, optionId);
  };

  return (
    <section className="audit-view-section" aria-labelledby="audit-view-heading">
      <h2 id="audit-view-heading" className="visually-hidden">
        Live Side-by-Side Redaction Audit
      </h2>

      <div className="audit-split-grid">
        {/* Left Panel: Original Text */}
        <div className="audit-panel original-panel tilt-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <span className="panel-dot original-dot" aria-hidden="true"></span>
              <h3 className="panel-title">Original Source</h3>
              <span className="panel-hint-text">(Click highlighted items to override)</span>
            </div>
            <div className="panel-header-actions">
              {overrideCount > 0 && onResetOverrides && (
                <button
                  type="button"
                  onClick={onResetOverrides}
                  className="btn-reset-overrides btn-3d"
                  aria-label="Reset all per-item overrides to default rules"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Reset overrides ({overrideCount})</span>
                </button>
              )}
              <span className="panel-badge original-badge">
                {matches.length} {matches.length === 1 ? 'entity' : 'entities'} detected
              </span>
            </div>
          </div>

          <div className="panel-body">
            {isEmpty ? (
              <div className="empty-panel-state">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="empty-icon"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p>No content to display.</p>
                <span>Paste text or click &quot;Load Sample&quot; above to inspect detected entities.</span>
              </div>
            ) : (
              <HighlightedText
                text={originalText}
                spans={matches}
                isRedacted={false}
                allowOverrides={true}
                overrides={overrides}
                onSelectEntity={handleSelectEntity}
              />
            )}
          </div>
        </div>

        {/* Right Panel: Sanitized Output */}
        <div className="audit-panel sanitized-panel tilt-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <span className="panel-dot sanitized-dot" aria-hidden="true"></span>
              <h3 className="panel-title">Sanitized Output</h3>
            </div>
            <span className="panel-badge sanitized-badge">
              Mode: {modeLabels[mode] || mode}
            </span>
          </div>

          <div className="panel-body">
            {isEmpty ? (
              <div className="empty-panel-state">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="empty-icon"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p>No redacted output generated.</p>
                <span>Sanitized text will appear here with highlighted replacements.</span>
              </div>
            ) : (
              <HighlightedText
                text={sanitizedText}
                spans={replacements}
                isRedacted={true}
                overrides={overrides}
              />
            )}
          </div>
        </div>
      </div>

      {/* Override Popover */}
      {popoverState && (
        <OverridePopover
          entity={popoverState.entity}
          currentOverride={
            overrides[`${popoverState.entity.type}::${popoverState.entity.normalized}`] ||
            overrides[popoverState.entity.normalized] ||
            OVERRIDE_OPTIONS.DEFAULT
          }
          anchorRect={popoverState.anchorRect}
          onSelect={handleApplyOverride}
          onClose={handleClosePopover}
        />
      )}
    </section>
  );
}
