import React from 'react';
import { ENTITY_TYPES, ENTITY_METADATA, REDACTION_MODES } from '../lib/constants.js';

/**
 * Controls bar component allowing selection of redaction mode and
 * toggling individual entity detection types.
 *
 * @param {Object} props
 * @param {string} props.mode - Current redaction mode from REDACTION_MODES.
 * @param {function(string): void} props.onModeChange - Mode change callback.
 * @param {Object.<string, boolean>} props.enabledTypes - Map of enabled entity types.
 * @param {function(string): void} props.onToggleType - Toggle entity type callback.
 * @returns {React.ReactElement} The ControlsBar component.
 */
export default function ControlsBar({ mode, onModeChange, enabledTypes, onToggleType }) {
  const modes = [
    {
      id: REDACTION_MODES.FULL,
      name: 'Full Mask',
      desc: '[REDACTED_EMAIL]',
    },
    {
      id: REDACTION_MODES.PARTIAL,
      name: 'Partial Mask',
      desc: 'j***@gmail.com',
    },
    {
      id: REDACTION_MODES.PSEUDONYM,
      name: 'Consistent Pseudonym',
      desc: 'EMAIL_01',
    },
  ];

  return (
    <section className="controls-bar" aria-labelledby="controls-heading">
      <h2 id="controls-heading" className="visually-hidden">
        Redaction Controls and Entity Filters
      </h2>

      {/* Redaction Mode Selector */}
      <div className="control-group">
        <span className="control-group-label" id="mode-group-label">
          Redaction Mode
        </span>
        <div
          className="mode-toggle-group"
          role="radiogroup"
          aria-labelledby="mode-group-label"
        >
          {modes.map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`mode-button ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onModeChange(m.id)}
              >
                <span className="mode-button-title">{m.name}</span>
                <span className="mode-button-example">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entity Type Checkbox Filters */}
      <div className="control-group">
        <span className="control-group-label" id="entities-group-label">
          Entity Detection Filters
        </span>
        <div
          className="entity-checkboxes"
          role="group"
          aria-labelledby="entities-group-label"
        >
          {Object.values(ENTITY_TYPES).map((type) => {
            const meta = ENTITY_METADATA[type];
            const isChecked = enabledTypes[type] !== false;
            return (
              <label
                key={type}
                className={`entity-toggle-pill ${isChecked ? 'is-checked' : 'is-disabled'}`}
                style={{
                  '--pill-bg': meta.badgeColor,
                  '--pill-color': meta.textColor,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleType(type)}
                  className="entity-checkbox-input"
                  aria-label={`Toggle detection for ${meta.label}`}
                />
                <span
                  className="pill-color-dot"
                  style={{ backgroundColor: meta.badgeColor }}
                  aria-hidden="true"
                ></span>
                <span className="pill-label">{meta.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
