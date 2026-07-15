/**
 * File: orderService.js
 * Purpose: Builds, submits, and classifies the protected create-order request.
 * Contents:
 * 1. Order error messages and validation helpers
 * 2. Create-order request-body construction
 * 3. Protected order submission and envelope validation
 */

import { getStoredSession } from '../storage/authStorage';
import { ApiRequestError, requestJson } from './apiClient';

// User-safe classification messages; raw server details and tokens never reach the interface.
export const ORDER_ERROR_MESSAGES = Object.freeze({
  invalid: 'The order could not be processed. Please review your selection and try again.',
  response: 'The order service returned an unexpected response. Please try again.',
  service: 'The order service is unavailable right now. Please try again.',
  token: 'Your session has expired. Please log in again.',
});

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * Builds the exact documented create-order body from already-validated client values.
 * createOrder calls it after the stored session resolves so a bad selection never reaches fetch.
 * Read aloud: “build create order request body.”
 * @param {{customerId: number, restaurantId: number, selectedProducts: Array<{id: number, quantity: number}>}} orderInput
 * @returns {{restaurant_id: number, customer_id: number, products: Array<{id: number, quantity: number}>, send_email: boolean, send_sms: boolean}}
 * @throws {ApiRequestError} With code `invalid` when any documented precondition fails.
 */
function buildCreateOrderRequestBody({ customerId, restaurantId, selectedProducts }) {
  // Every product must carry a real backend ID and a positive quantity; zero-quantity items are
  // excluded by the Restaurant Menu contract and must never be resent here.
  const hasValidSelection =
    Array.isArray(selectedProducts) &&
    selectedProducts.length > 0 &&
    selectedProducts.every(
      (product) => isPositiveSafeInteger(product?.id) && isPositiveSafeInteger(product?.quantity),
    );

  if (
    !isPositiveSafeInteger(restaurantId) ||
    !isPositiveSafeInteger(customerId) ||
    !hasValidSelection
  ) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.invalid);
  }

  // send_email and send_sms are sent as literal false; Module 13 never exercises notifications.
  return {
    restaurant_id: restaurantId,
    customer_id: customerId,
    products: selectedProducts.map((product) => ({ id: product.id, quantity: product.quantity })),
    send_email: false,
    send_sms: false,
  };
}

/**
 * Validates the created-order `{ message: "Success", data }` envelope and extracts essentials.
 * createOrder calls it so a malformed 201 body still classifies as a response failure.
 * Read aloud: “normalize created order.”
 */
function normalizeCreatedOrder(responseData) {
  const createdOrder =
    responseData?.message === 'Success' &&
    responseData.data &&
    typeof responseData.data === 'object' &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;
  const id = Number(createdOrder?.id);

  if (!createdOrder || !isPositiveSafeInteger(id)) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response);
  }

  return { id };
}

/**
 * Creates one order for the authenticated customer through the protected orders endpoint.
 * OrderConfirmationModal calls it once per confirmed submission attempt.
 * The token and customer ID are read from the shared session boundary at submission time so
 * credentials never travel through component props or route parameters.
 * Read aloud: “create order.”
 * @param {{restaurantId: number, selectedProducts: Array<{id: number, quantity: number}>, signal?: AbortSignal}} options
 * @returns {Promise<{id: number}>} The created order ID from the validated success envelope.
 * @throws {ApiRequestError} Codes: `unauthorized`, `invalid`, `service`, `response`, `connection`, `aborted`.
 */
export async function createOrder({ restaurantId, selectedProducts, signal }) {
  const session = await getStoredSession();

  // A missing or partial stored session can never satisfy the protected endpoint; the caller
  // routes this `unauthorized` failure through the shared sign-out transition instead of retrying.
  if (!session) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, 401);
  }

  const requestBody = buildCreateOrderRequestBody({
    customerId: Number(session.customerId),
    restaurantId,
    selectedProducts,
  });

  const { data, response } = await requestJson('/api/orders', {
    body: JSON.stringify(requestBody),
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  });

  // Live evidence (2026-07-15): this backend has no custom AuthenticationEntryPoint and no
  // per-role rules on /api/**, so Spring Security's default reports a missing, invalid, or
  // expired token as HTTP 403. Both statuses therefore mean the session is unusable and must
  // exit through the shared sign-out transition instead of a retryable modal failure.
  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', ORDER_ERROR_MESSAGES.service, response.status);
  }

  // The backend rejects bad bodies as HTTP 400 `{ error, details }`; details stay unexposed.
  if (!response.ok) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.invalid, response.status);
  }

  // Only HTTP 201 with the validated Success envelope counts as a created order.
  if (response.status !== 201) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response, response.status);
  }

  return normalizeCreatedOrder(data);
}
