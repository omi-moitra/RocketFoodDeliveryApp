/**
 * File: orderTotals.js
 * Purpose: Calculates order line and grand totals without allowing unsafe integer arithmetic.
 * Contents:
 * 1. Safe line-total calculation
 * 2. Safe order-total accumulation
 */

import { isNonNegativeSafeInteger, isPositiveSafeInteger } from './validation';

/** Returns a safe line total, or null when an input/product exceeds integer safety. */
export function calculateLineTotal(cost, quantity) {
  if (!isNonNegativeSafeInteger(cost) || !isPositiveSafeInteger(quantity)) {
    return null;
  }

  const total = cost * quantity;
  return Number.isSafeInteger(total) ? total : null;
}

/** Returns the safe sum of all product lines; an empty valid selection retains the prior total of 0. */
export function calculateOrderTotal(products) {
  if (!Array.isArray(products)) {
    return null;
  }

  let total = 0;

  for (const product of products) {
    const lineTotal = calculateLineTotal(product?.cost, product?.quantity);

    if (lineTotal === null || total > Number.MAX_SAFE_INTEGER - lineTotal) {
      return null;
    }

    total += lineTotal;
  }

  return total;
}
