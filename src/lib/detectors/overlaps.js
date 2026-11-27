/**
 * @file Collision and overlap resolution logic for detected PII entities.
 */

import { ENTITY_TYPES } from '../constants.js';

/**
 * Priority order for overlap resolution.
 * Higher number means higher priority.
 * Validated card > validated Aadhaar > PAN > IP > Email > Phone.
 */
export const TYPE_PRIORITY = {
  [ENTITY_TYPES.CUSTOM_RULE]: 70,
  [ENTITY_TYPES.CREDIT_CARD]: 60,
  [ENTITY_TYPES.AADHAAR]: 50,
  [ENTITY_TYPES.PAN]: 40,
  [ENTITY_TYPES.IP]: 30,
  [ENTITY_TYPES.EMAIL]: 20,
  [ENTITY_TYPES.PHONE]: 10,
};

/**
 * Resolves overlapping entity matches.
 * Prioritizes:
 * 1. Type priority (CARD > AADHAAR > PAN > IP > EMAIL > PHONE)
 * 2. Longer length
 * 3. Earlier starting position
 *
 * @param {Array<import('./rules.js').DetectedEntity|object>} candidates - Array of raw matches.
 * @returns {Array<object>} Non-overlapping matches sorted ascending by start index.
 */
export function resolveOverlaps(candidates) {
  if (!candidates || candidates.length === 0) return [];

  // Sort candidates by priority desc, length desc, start asc
  const sorted = [...candidates].sort((a, b) => {
    const priorityA = TYPE_PRIORITY[a.type] || 0;
    const priorityB = TYPE_PRIORITY[b.type] || 0;
    if (priorityB !== priorityA) return priorityB - priorityA;

    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenB !== lenA) return lenB - lenA;

    return a.start - b.start;
  });

  const accepted = [];

  for (const candidate of sorted) {
    // Check if candidate overlaps with any already accepted match
    const hasOverlap = accepted.some(
      (curr) => Math.max(curr.start, candidate.start) < Math.min(curr.end, candidate.end)
    );

    if (!hasOverlap) {
      accepted.push(candidate);
    }
  }

  // Return sorted by start position
  return accepted.sort((a, b) => a.start - b.start);
}
