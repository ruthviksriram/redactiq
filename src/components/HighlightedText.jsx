import React from 'react';
import { ENTITY_METADATA } from '../lib/constants.js';

/**
 * Pure tokenized renderer for highlighting text spans as native React elements.
 * Strictly avoids dangerouslySetInnerHTML to prevent XSS.
 * High-contrast dark text is rendered over light pastel backgrounds (contrast >= 4.5:1).
 *
 * @param {Object} props
 * @param {string} props.text - Full text to render.
 * @param {Array<{ start: number, end: number, type: string, value?: string, placeholder?: string }>} props.spans - Slices to highlight.
 * @param {boolean} [props.isRedacted] - True if rendering sanitized replacements.
 * @returns {React.ReactElement} The tokenized content fragment.
 */
export default function HighlightedText({ text, spans, isRedacted = false }) {
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

    elements.push(
      <mark
        key={`mark-${start}-${end}-${i}`}
        className={`entity-highlight ${isRedacted ? 'is-redacted' : ''}`}
        style={{
          '--hl-bg': meta.badgeColor,
          '--hl-text': meta.textColor,
        }}
        title={`${meta.label}: ${tokenText}`}
      >
        <span className="entity-text">{tokenText}</span>
        <span className="entity-type-tag" aria-label={`Type: ${meta.label}`}>
          {span.type}
        </span>
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
