import React, { useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { OVERRIDE_OPTIONS, ENTITY_METADATA } from '../lib/constants.js';

/**
 * Accessible per-item redaction override popover.
 * Allows overriding redaction behavior for a specific normalized entity value.
 *
 * @param {Object} props
 * @param {import('../lib/detectors.js').DetectedEntity} props.entity - Selected entity match.
 * @param {string} [props.currentOverride] - Active override value (or undefined / 'DEFAULT').
 * @param {{ top: number, left: number, width: number, height: number }} props.anchorRect - Trigger bounding rect.
 * @param {function(string): void} props.onSelect - Option select callback.
 * @param {function(): void} props.onClose - Close popover callback.
 * @returns {React.ReactElement}
 */
export default function OverridePopover({
  entity,
  currentOverride = OVERRIDE_OPTIONS.DEFAULT,
  anchorRect,
  onSelect,
  onClose,
}) {
  const popoverRef = useRef(null);
  const optionsRef = useRef([]);

  const options = useMemo(
    () => [
      {
        id: OVERRIDE_OPTIONS.DEFAULT,
        label: 'Use default',
        desc: 'Follow global or custom type rule',
      },
      {
        id: OVERRIDE_OPTIONS.FULL,
        label: 'Full Mask',
        desc: `[REDACTED_${entity.type}]`,
      },
      {
        id: OVERRIDE_OPTIONS.PARTIAL,
        label: 'Partial Mask',
        desc: 'Contextual masking',
      },
      {
        id: OVERRIDE_OPTIONS.PSEUDONYM,
        label: 'Pseudonym',
        desc: 'Consistent pseudonym identifier',
      },
      {
        id: OVERRIDE_OPTIONS.NONE,
        label: "Don't redact",
        desc: 'Leave original value unmasked',
      },
    ],
    [entity.type]
  );

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = optionsRef.current.indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % options.length;
        optionsRef.current[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = optionsRef.current.indexOf(document.activeElement);
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        optionsRef.current[prevIndex]?.focus();
      }
    }

    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Initial focus on first option or currently checked option
    const activeIdx = options.findIndex((o) => o.id === currentOverride);
    const initialFocus = activeIdx >= 0 ? activeIdx : 0;
    setTimeout(() => {
      optionsRef.current[initialFocus]?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentOverride, onClose, options]);

  // Compute smart popover position
  const meta = ENTITY_METADATA[entity.type] || { label: entity.type };

  // Calculate screen positioning relative to viewport
  const popoverWidth = 280;
  let left = anchorRect.left;
  if (left + popoverWidth > window.innerWidth - 16) {
    left = Math.max(16, window.innerWidth - popoverWidth - 16);
  }
  let top = anchorRect.bottom + 8;
  if (top + 260 > window.innerHeight && anchorRect.top > 260) {
    top = anchorRect.top - 268;
  }

  return (
    <div
      ref={popoverRef}
      className="override-popover"
      style={{
        position: 'fixed',
        top: `${Math.max(16, top)}px`,
        left: `${Math.max(16, left)}px`,
        zIndex: 9999,
      }}
      role="menu"
      aria-labelledby="popover-title"
      aria-orientation="vertical"
    >
      <div className="popover-header">
        <div className="popover-title-row">
          <span className="popover-type-badge">{meta.label}</span>
          <span id="popover-title" className="popover-title">
            Per-Item Override
          </span>
        </div>
        <code className="popover-entity-value" title={entity.value}>
          {entity.value.length > 24 ? `${entity.value.slice(0, 22)}…` : entity.value}
        </code>
      </div>

      <div className="popover-options-list">
        {options.map((opt, idx) => {
          const isSelected =
            currentOverride === opt.id || (!currentOverride && opt.id === OVERRIDE_OPTIONS.DEFAULT);
          return (
            <button
              key={opt.id}
              ref={(el) => (optionsRef.current[idx] = el)}
              type="button"
              role="menuitemradio"
              aria-checked={isSelected}
              className={`popover-option-btn ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <div className="option-btn-content">
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
              </div>
              {isSelected && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="option-check-icon"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

OverridePopover.propTypes = {
  entity: PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    normalized: PropTypes.string.isRequired,
  }).isRequired,
  currentOverride: PropTypes.string,
  anchorRect: PropTypes.shape({
    top: PropTypes.number.isRequired,
    bottom: PropTypes.number,
    left: PropTypes.number.isRequired,
    right: PropTypes.number,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

OverridePopover.defaultProps = {
  currentOverride: OVERRIDE_OPTIONS.DEFAULT,
};
