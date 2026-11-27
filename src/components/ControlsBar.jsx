import React from 'react';
import { ENTITY_TYPES, ENTITY_METADATA, REDACTION_MODES, DEFAULT_CUSTOM_TYPE_MODES } from '../lib/constants.js';

/**
 * Controls bar component allowing selection of redaction mode and
 * toggling individual entity detection types.
 *
 * @param {Object} props
 * @param {string} props.mode - Current redaction mode from REDACTION_MODES.
 * @param {function(string): void} props.onModeChange - Mode change callback.
 * @param {Record<string, string>} [props.typeModes] - Per-type modes for Custom mode.
 * @param {function(string, string): void} [props.onTypeModeChange] - Per-type mode change callback.
 * @param {Object.<string, boolean>} props.enabledTypes - Map of enabled entity types.
 * @param {function(string): void} props.onToggleType - Toggle entity type callback.
 * @returns {React.ReactElement} The ControlsBar component.
 */
export default function ControlsBar({
  mode,
  onModeChange,
  typeModes = DEFAULT_CUSTOM_TYPE_MODES,
  onTypeModeChange,
  enabledTypes,
  onToggleType,
}) {
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
    {
      id: REDACTION_MODES.CUSTOM,
      name: 'Custom',
      desc: 'Per-type rules',
    },
  ];

  return (
    <section className="controls-bar tilt-card" aria-labelledby="controls-heading">
      <h2 id="controls-heading" className="visually-hidden">
        Redaction Controls and Entity Filters
      </h2>

      {/* Redaction Mode Selector */}
      <div className="control-group">
        <span className="control-group-label" id="mode-group-label">
          Redaction Mode
        </span>
        <div
          className="mode-toggle-group mode-toggle-group-4"
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

      {/* Custom Redaction Mode Panel */}
      {mode === REDACTION_MODES.CUSTOM && (
        <div className="custom-mode-panel" role="region" aria-label="Custom Redaction Settings">
          <div className="custom-panel-header">
            <span className="custom-panel-title">Per-Entity Redaction Strategy</span>
            <span className="custom-panel-desc">
              Define granular default masking rules per entity type. You can still override individual items in the audit view.
            </span>
          </div>
          <div className="custom-type-grid">
            {Object.values(ENTITY_TYPES).map((type) => {
              const meta = ENTITY_METADATA[type];
              const currentTypeMode = typeModes[type] || DEFAULT_CUSTOM_TYPE_MODES[type] || REDACTION_MODES.FULL;
              const selectId = `custom-select-${type.toLowerCase()}`;

              return (
                <div key={type} className="custom-type-field">
                  <label htmlFor={selectId} className="custom-type-label">
                    <span className="custom-type-dot" style={{ backgroundColor: meta.badgeColor }} aria-hidden="true" />
                    <span>{meta.label}</span>
                  </label>
                  <select
                    id={selectId}
                    className="custom-type-select"
                    value={currentTypeMode}
                    onChange={(e) => onTypeModeChange && onTypeModeChange(type, e.target.value)}
                  >
                    <option value={REDACTION_MODES.FULL}>Full Mask ([REDACTED])</option>
                    <option value={REDACTION_MODES.PARTIAL}>Partial Mask (Contextual)</option>
                    <option value={REDACTION_MODES.PSEUDONYM}>Pseudonym (ID_01)</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
