/**
 * @file Entity type definitions, color metadata, and UI configurations.
 */

/**
 * Supported PII entity types.
 * @readonly
 * @enum {string}
 */
export const ENTITY_TYPES = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  IP: 'IP',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  CREDIT_CARD: 'CREDIT_CARD',
};

/**
 * Metadata for each entity type: human-friendly label, description, and high-contrast styling.
 * All highlight colors pair light pastel backgrounds with dark text for >= 4.5:1 contrast.
 */
export const ENTITY_METADATA = {
  [ENTITY_TYPES.EMAIL]: {
    type: ENTITY_TYPES.EMAIL,
    label: 'Email',
    badgeColor: 'var(--hl-email-bg)',
    textColor: 'var(--hl-email-text)',
    className: 'hl-email',
  },
  [ENTITY_TYPES.PHONE]: {
    type: ENTITY_TYPES.PHONE,
    label: 'Phone',
    badgeColor: 'var(--hl-phone-bg)',
    textColor: 'var(--hl-phone-text)',
    className: 'hl-phone',
  },
  [ENTITY_TYPES.IP]: {
    type: ENTITY_TYPES.IP,
    label: 'IP Address',
    badgeColor: 'var(--hl-ip-bg)',
    textColor: 'var(--hl-ip-text)',
    className: 'hl-ip',
  },
  [ENTITY_TYPES.PAN]: {
    type: ENTITY_TYPES.PAN,
    label: 'PAN (India)',
    badgeColor: 'var(--hl-pan-bg)',
    textColor: 'var(--hl-pan-text)',
    className: 'hl-pan',
  },
  [ENTITY_TYPES.AADHAAR]: {
    type: ENTITY_TYPES.AADHAAR,
    label: 'Aadhaar (India)',
    badgeColor: 'var(--hl-aadhaar-bg)',
    textColor: 'var(--hl-aadhaar-text)',
    className: 'hl-aadhaar',
  },
  [ENTITY_TYPES.CREDIT_CARD]: {
    type: ENTITY_TYPES.CREDIT_CARD,
    label: 'Payment Card',
    badgeColor: 'var(--hl-card-bg)',
    textColor: 'var(--hl-card-text)',
    className: 'hl-card',
  },
};

/**
 * Redaction mode identifiers.
 * @readonly
 * @enum {string}
 */
export const REDACTION_MODES = {
  FULL: 'FULL',
  PARTIAL: 'PARTIAL',
  PSEUDONYM: 'PSEUDONYM',
};
