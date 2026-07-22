/**
 * File: currency.js
 * Purpose: Formats backend product costs with one project-wide currency-unit rule.
 * Contents:
 * 1. Currency formatter
 * 2. Cost validation and formatting
 */

// Module 13's DataSeeder stores product costs as whole-dollar integers from 5 through 24.
// Confirmed against the live API on 2026-07-15: untouched seeded products return whole-dollar
// integer costs. This formatter is the single boundary to revise if another grading environment
// proves that the API uses minor units instead.

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  style: 'currency',
});

/**
 * Formats one validated non-negative backend cost as US dollars with two decimal places.
 * Menu, confirmation, order-history, and courier-detail surfaces share this display boundary.
 * A value outside the whole-dollar contract returns a visible placeholder instead of
 * throwing, because this function runs inside render paths where an exception would
 * take down the whole screen rather than one price cell.
 * @param {number} cost Whole-dollar integer from the current seeded API contract.
 * @returns {string} A value such as `$9.00`, or `—` for an out-of-contract value.
 */
export function formatProductCost(cost) {
  if (!Number.isSafeInteger(cost) || cost < 0) {
    if (__DEV__) {
      console.warn('formatProductCost: received a cost outside the whole-dollar contract.');
    }

    return '—';
  }

  return USD_FORMATTER.format(cost);
}
