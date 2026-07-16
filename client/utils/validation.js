/**
 * File: validation.js
 * Purpose: Shares the integer rules that services use to enforce backend contracts.
 * Contents: positive and non-negative safe-integer checks.
 */

/**
 * Reports whether a value is a safe integer greater than zero.
 * Services use it for backend identifiers and quantities.
 * Read aloud: “is positive safe integer.”
 */
export function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * Reports whether a value is a safe integer of zero or more.
 * Services use it for whole-dollar costs, which may legitimately be zero.
 * Read aloud: “is non-negative safe integer.”
 */
export function isNonNegativeSafeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}
