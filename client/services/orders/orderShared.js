/**
 * File: orderShared.js
 * Purpose: Owns order-domain messages and product normalization shared by customer and courier flows.
 * Contents:
 * 1. User-safe order error messages
 * 2. Shared order-product normalizer
 */

import { isNonNegativeSafeInteger, isPositiveSafeInteger } from '../../utils/validation';

// Raw server details and credentials never reach the interface through these messages.
export const ORDER_ERROR_MESSAGES = Object.freeze({
  invalid: 'The order could not be processed. Please review your selection and try again.',
  notFound: 'This delivery is no longer available. Please refresh and try again.',
  partial: 'The delivery moved to in progress, but assigning you failed. Please retry assignment.',
  response: 'The order service returned an unexpected response. Please try again.',
  service: 'The order service is unavailable right now. Please try again.',
  status: 'The delivery status could not be updated. Please try again.',
  token: 'Your session has expired. Please log in again.',
});

/**
 * Validates the fields every customer/courier product line shares and maps them to camelCase.
 * Domain-specific normalizers may add fields after this common contract succeeds.
 */
export function normalizeBaseOrderProduct(rawProduct) {
  if (!rawProduct || typeof rawProduct !== 'object' || Array.isArray(rawProduct)) {
    return null;
  }

  const productId = Number(rawProduct.product_id);
  const productName =
    typeof rawProduct.product_name === 'string' ? rawProduct.product_name.trim() : '';
  const quantity = Number(rawProduct.quantity);
  const totalCost = Number(rawProduct.total_cost);

  if (
    !isPositiveSafeInteger(productId) ||
    !productName ||
    !isPositiveSafeInteger(quantity) ||
    !isNonNegativeSafeInteger(totalCost)
  ) {
    return null;
  }

  return { productId, productName, quantity, totalCost };
}
