import React from 'react';
import PropTypes from 'prop-types';
import { ENTITY_METADATA } from '../lib/constants.js';

/**
 * @file Mapping table component for Consistent Pseudonymization mode.
 * Displays reverse-lookup mappings exclusively in volatile memory for audit purposes.
 */

/**
 * @param {object} props
 * @param {Array<{ placeholder: string, original: string, type: string, normalized: string }>} props.mapping
 * @returns {React.JSX.Element}
 */
export default function MappingTable({ mapping = [] }) {
  if (!mapping || mapping.length === 0) {
    return (
      <section className="mapping-card card-3d" aria-label="Pseudonymization Mapping Table">
        <div className="mapping-header">
          <div className="mapping-title-group">
            <span className="mapping-icon" aria-hidden="true">
              🔑
            </span>
            <h2 className="mapping-title">Pseudonymization Mapping Table</h2>
          </div>
        </div>
        <p className="mapping-empty-note">
          No pseudonymized entities detected yet. Paste text or load sample data to view
          memory-resident pseudonym mappings.
        </p>
      </section>
    );
  }

  return (
    <section className="mapping-card card-3d" aria-label="Pseudonymization Mapping Table">
      <div className="mapping-header">
        <div className="mapping-title-group">
          <span className="mapping-icon" aria-hidden="true">
            🔑
          </span>
          <div>
            <div className="mapping-title-row">
              <h2 className="mapping-title">Pseudonymization Mapping Table</h2>
              <span className="mapping-count-pill">
                {mapping.length} unique {mapping.length === 1 ? 'entity' : 'entities'} mapped
              </span>
            </div>
            <p className="mapping-subtitle">
              Auditing index mapping consistent pseudonyms to their original values across this
              document.
            </p>
          </div>
        </div>
      </div>

      <div className="mapping-warning-callout" role="alert">
        <span className="warning-callout-icon" aria-hidden="true">
          ⚠️
        </span>
        <div className="warning-callout-content">
          <strong>Sensitive Data Warning:</strong> This mapping table contains unmasked personal
          data and exists <em>strictly in volatile browser RAM</em>. It is never included in
          exported or downloaded files, never logged, and is destroyed when this browser tab is
          closed.
        </div>
      </div>

      <div className="mapping-table-container">
        <table className="mapping-table">
          <caption className="sr-only">Pseudonym to original value mappings</caption>
          <thead>
            <tr>
              <th scope="col" className="col-pseudonym">
                Pseudonym
              </th>
              <th scope="col" className="col-type">
                Entity Type
              </th>
              <th scope="col" className="col-original">
                Original Value
              </th>
            </tr>
          </thead>
          <tbody>
            {mapping.map((item) => {
              const meta = ENTITY_METADATA[item.type] || {
                label: item.type,
                className: 'hl-email',
              };

              return (
                <tr key={`${item.placeholder}-${item.original}`}>
                  <td className="cell-pseudonym">
                    <code className="pseudonym-pill">{item.placeholder}</code>
                  </td>
                  <td className="cell-type">
                    <span className={`entity-type-tag ${meta.className}`}>{meta.label}</span>
                  </td>
                  <td className="cell-original">
                    <code className="original-val-code">{item.original}</code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

MappingTable.propTypes = {
  mapping: PropTypes.arrayOf(
    PropTypes.shape({
      placeholder: PropTypes.string.isRequired,
      original: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      normalized: PropTypes.string.isRequired,
    })
  ),
};

MappingTable.defaultProps = {
  mapping: [],
};
