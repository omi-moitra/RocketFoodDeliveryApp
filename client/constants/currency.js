/**
 * File: currency.js
 * Purpose: Formats backend product costs with one project-wide currency-unit rule.
 * Contents:
 * 1. Product cost-unit decision
 * 2. Currency validation and formatting
 */

// Module 13's DataSeeder stores product costs as whole-dollar integers from 5 through 24.
// Confirmed against the live API on 2026-07-15: untouched seeded products return whole-dollar
// integer costs, so this one named boundary stays and remains the single place to revise if
// grading data ever proves that another environment uses minor units.
export const PRODUCT_COST_UNIT = 'whole-dollars';

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  style: 'currency',
});

/**
 * Formats one validated non-negative backend cost as US dollars with two decimal places.
 * Menu, confirmation, and later order-history features share this display boundary.
 * Read aloud: “format product cost.”
 * @param {number} cost Whole-dollar integer from the current seeded API contract.
 * @returns {string} A value such as `$9.00`.
 */
export function formatProductCost(cost) {
  if (!Number.isSafeInteger(cost) || cost < 0) {
    throw new TypeError('Product cost must be a non-negative safe integer.');
  }

  return USD_FORMATTER.format(cost);
}
