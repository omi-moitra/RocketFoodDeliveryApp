/**
 * File: orderFormatting.js
 * Purpose: Shares the project-wide order/delivery date display rule used by detail modals.
 * Contents: order-date formatter and its human-readable date formatting helper.
 */

// The project-wide order-date format ("July 15, 2026"). The wireframe leaves its sample date
// value blank, so this is the recorded format decision shared by every order/delivery detail view.
export const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Formats a normalized ISO `createdOn` value as one documented human-readable date.
 * An unparseable value returns a safe blank so a detail modal never shows `Invalid Date`, `NaN`,
 * or a raw ISO string.
 * Read aloud: “format order date.”
 * @param {string} createdOn ISO date-time string from a normalized order or delivery object.
 * @returns {string} A value such as `July 15, 2026`, or an empty string when unparseable.
 */
export function formatOrderDate(createdOn) {
  if (typeof createdOn !== 'string' || !createdOn.trim()) {
    return '';
  }

  // The backend sends microsecond fractions (…T13:01:38.705432); the standard ISO profile stops
  // at milliseconds, so longer fractions are trimmed before parsing to stay engine-portable.
  const parsedDate = new Date(createdOn.trim().replace(/(\.\d{3})\d+/, '$1'));

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return ORDER_DATE_FORMATTER.format(parsedDate);
}
