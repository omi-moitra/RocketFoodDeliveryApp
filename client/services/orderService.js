/**
 * File: orderService.js
 * Purpose: Owns the protected order requests: creation, history loading, and classification.
 * Contents:
 * 1. Order error messages and validation helpers
 * 2. Create-order request-body construction
 * 3. Protected order submission and envelope validation
 * 4. Customer order-history normalization and request
 */

import { getStoredSession } from '../storage/authStorage';
import { isNonNegativeSafeInteger, isPositiveSafeInteger } from '../utils/validation';
import { ApiRequestError, requestJson } from './apiClient';

// User-safe classification messages; raw server details and tokens never reach the interface.
export const ORDER_ERROR_MESSAGES = Object.freeze({
  invalid: 'The order could not be processed. Please review your selection and try again.',
  response: 'The order service returned an unexpected response. Please try again.',
  service: 'The order service is unavailable right now. Please try again.',
  token: 'Your session has expired. Please log in again.',
});

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

/**
 * Validates one raw order product and maps its backend snake_case fields to camelCase.
 * normalizeCustomerOrder calls it for every entry so the detail modal can trust the shape.
 * Read aloud: “normalize order product.”
 */
function normalizeOrderProduct(rawProduct) {
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

  // Only the fields the history table and detail modal consume are mapped; the raw unit cost
  // stays unmapped because the modal renders the backend's precomputed line totals.
  return { productId, productName, quantity, totalCost };
}

/**
 * Validates one raw customer order and maps backend snake_case fields to the client shape.
 * The detail modal renders from this list response instead of calling a per-order endpoint
 * that the backend does not provide, so everything the modal shows must be mapped here.
 * Returns null for a malformed entry so the caller can skip it instead of rendering broken rows.
 * Read aloud: “normalize customer order.”
 */
function normalizeCustomerOrder(rawOrder) {
  if (!rawOrder || typeof rawOrder !== 'object' || Array.isArray(rawOrder)) {
    return null;
  }

  const id = Number(rawOrder.id);
  const restaurantName =
    typeof rawOrder.restaurant_name === 'string' ? rawOrder.restaurant_name.trim() : '';
  // The raw lowercase status is preserved; the uppercase wireframe look is a display transform.
  const status = typeof rawOrder.status === 'string' ? rawOrder.status.trim() : '';
  const totalCost = Number(rawOrder.total_cost);
  const createdOn = typeof rawOrder.created_on === 'string' ? rawOrder.created_on.trim() : '';

  // A null courier is a valid not-yet-assigned pending state, never an error; blank courier text
  // also normalizes to null so nothing downstream can render the string "undefined".
  const courierId =
    rawOrder.courier_id === null || rawOrder.courier_id === undefined
      ? null
      : Number(rawOrder.courier_id);
  const courierName =
    typeof rawOrder.courier_name === 'string' && rawOrder.courier_name.trim()
      ? rawOrder.courier_name.trim()
      : null;

  const products = Array.isArray(rawOrder.products)
    ? rawOrder.products.map(normalizeOrderProduct)
    : null;

  if (
    !isPositiveSafeInteger(id) ||
    !restaurantName ||
    !status ||
    !isNonNegativeSafeInteger(totalCost) ||
    !createdOn ||
    (courierId !== null && !isPositiveSafeInteger(courierId)) ||
    !products ||
    products.some((product) => product === null)
  ) {
    return null;
  }

  // Only the fields the history table and detail modal consume are mapped; addresses, customer
  // identity, and the restaurant id stay unmapped until a screen actually needs them.
  return {
    courierId,
    courierName,
    createdOn,
    id,
    products,
    restaurantName,
    status,
    totalCost,
  };
}

/**
 * Validates the history envelope and returns only well-formed, uniquely identified orders.
 * A valid empty array is a legitimate no-orders result, so it returns [] rather than throwing.
 * Read aloud: “normalize customer orders.”
 */
function normalizeCustomerOrders(responseData) {
  if (!responseData || responseData.message !== 'Success' || !Array.isArray(responseData.data)) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response);
  }

  const seenOrderIds = new Set();
  const orders = [];

  for (const rawOrder of responseData.data) {
    const order = normalizeCustomerOrder(rawOrder);

    // Skip-and-log keeps one malformed or duplicated entry from hiding the whole history; the
    // development-only warning never includes customer data or tokens.
    if (!order || seenOrderIds.has(order.id)) {
      if (__DEV__) {
        console.warn('orderService: skipped a malformed or duplicate order-history entry.');
      }
      continue;
    }

    seenOrderIds.add(order.id);
    orders.push(order);
  }

  return orders;
}

/**
 * Loads every order belonging to the authenticated customer, newest-known list from the API.
 * The Order History screen calls it on mount, on tab focus, and on retry.
 * The query is scoped by `type=customer` plus the stored `customer_id` (never `user_id`),
 * both read from the shared session boundary at request time rather than from props.
 * Read aloud: “fetch customer orders.”
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<Array<object>>} Validated orders in API order; [] when the customer has none.
 * @throws {ApiRequestError} Codes: `unauthorized`, `invalid`, `service`, `response`, `connection`, `aborted`.
 */
export async function fetchCustomerOrders({ signal } = {}) {
  const session = await getStoredSession();
  const customerId = Number(session?.customerId);

  // No usable stored session means the protected request can never succeed; the screen routes
  // this through the shared logged-out handling instead of showing a retryable page error.
  if (!session || !isPositiveSafeInteger(customerId)) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, 401);
  }

  const { data, response } = await requestJson(
    `/api/orders?type=customer&id=${encodeURIComponent(customerId)}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      method: 'GET',
      signal,
    },
  );

  // As verified live for order creation, this backend reports missing/invalid/expired tokens as
  // HTTP 403 (no custom AuthenticationEntryPoint); both statuses exit through shared sign-out.
  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', ORDER_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response, response.status);
  }

  return normalizeCustomerOrders(data);
}
