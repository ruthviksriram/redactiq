import React from 'react';
import { ENTITY_METADATA, OVERRIDE_OPTIONS } from '../lib/constants.js';

/**
 * Pure tokenized renderer for highlighting text spans as native React elements.
 * Strictly avoids dangerouslySetInnerHTML to prevent XSS.
 * High-contrast dark text is rendered over light pastel backgrounds (contrast >= 4.5:1).
 *
 * @param {Object} props
 * @param {string} props.text - Full text to render.
 * @param {Array<{ start: number, end: number, type: string, value?: string, placeholder?: string, normalized?: string, mode?: string, isExcluded?: boolean }>} props.spans - Slices to highlight.
 * @param {boolean} [props.isRedacted] - True if rendering sanitized replacements.
 * @param {boolean} [props.allowOverrides] - True if clicking spans triggers override popover.
 * @param {Record<string, string>} [props.overrides] - Map of active overrides.
 * @param {function(object, HTMLElement): void} [props.onSelectEntity] - Callback when an entity is clicked.
 * @returns {React.ReactElement} The tokenized content fragment.
 */
export default function HighlightedText({
  text,
  spans,
  isRedacted = false,
  allowOverrides = false,
  overrides = {},
  onSelectEntity,
}) {
  if (!text) return null;
  if (!spans || spans.length === 0) {
    return <span className="plain-text-stream">{text}</span>;
  }

  const elements = [];
  let cursor = 0;

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const start = Math.max(0, span.start);
    const end = Math.min(text.length, span.end);

    // Append un-highlighted text prior to this span
    if (start > cursor) {
      elements.push(
        <span key={`text-${cursor}-${start}`} className="plain-text-stream">
          {text.slice(cursor, start)}
        </span>
      );
    }

    // Highlighted token
    const tokenText = text.slice(start, end);
    const meta = ENTITY_METADATA[span.type] || {
      label: span.type,
      badgeColor: 'var(--accent-cyan)',
      textColor: '#082f49',
    };

    // Check if this entity has an active override
    const itemKey = `${span.type}::${span.normalized}`;
    const activeOverride = overrides[itemKey] || overrides[span.normalized];
    const hasOverride = Boolean(activeOverride && activeOverride !== OVERRIDE_OPTIONS.DEFAULT);
    const isUnredacted = span.isExcluded || activeOverride === OVERRIDE_OPTIONS.NONE;

    const handleKeyDown = (e) => {
      if (allowOverrides && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (onSelectEntity) {
          onSelectEntity(span, e.currentTarget);
        }
      }
    };

    const handleClick = (e) => {
      if (allowOverrides && onSelectEntity) {
        onSelectEntity(span, e.currentTarget);
      }
    };

    elements.push(
      <mark
        key={`mark-${start}-${end}-${i}`}
        className={`entity-highlight ${isRedacted ? 'is-redacted' : ''} ${
          allowOverrides ? 'is-interactive' : ''
        } ${hasOverride ? 'has-override' : ''} ${isUnredacted ? 'is-unredacted-span' : ''}`}
        style={{
          '--hl-bg': meta.badgeColor,
          '--hl-text': meta.textColor,
        }}
        title={
          hasOverride
            ? `${meta.label} (${tokenText}) - Override active: ${activeOverride}`
            : `${meta.label}: ${tokenText}`
        }
        role={allowOverrides ? 'button' : undefined}
        tabIndex={allowOverrides ? 0 : undefined}
        aria-haspopup={allowOverrides ? 'menu' : undefined}
        aria-label={
          allowOverrides
            ? `Click to override redaction for ${meta.label}: ${tokenText}${
                hasOverride ? ` (edited: ${activeOverride})` : ''
              }`
            : undefined
        }
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className="entity-text">{tokenText}</span>
        <span
          className={`entity-type-tag ${span.unverified ? 'is-unverified' : ''}`}
          aria-label={`Type: ${meta.label}${span.unverified ? ' (unverified)' : ''}`}
        >
          {span.unverified ? `${span.type} (unverified)` : span.type}
        </span>
        {hasOverride && (
          <span className="override-badge-marker" aria-label={`Override: ${activeOverride}`}>
            • edited
          </span>
        )}
      </mark>
    );

    cursor = end;
  }

  // Trailing text after the last span
  if (cursor < text.length) {
    elements.push(
      <span key={`text-tail-${cursor}`} className="plain-text-stream">
        {text.slice(cursor)}
      </span>
    );
  }

  return <div className="highlighted-content-scroll">{elements}</div>;
}
