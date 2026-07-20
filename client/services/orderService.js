/**
 * File: orderService.js
 * Purpose: Owns the protected order requests: creation, history loading, and classification.
 * Contents:
 * 1. Order error messages and validation helpers
 * 2. Create-order request-body construction
 * 3. Protected order submission and envelope validation
 * 4. Customer order-history normalization and request
 * 5. Courier delivery status model, normalization, and eligible-delivery retrieval
 */

import { getStoredSession, ROLES } from '../storage/authStorage';
import { isNonNegativeSafeInteger, isPositiveSafeInteger } from '../utils/validation';
import { ApiRequestError, requestJson } from './apiClient';

// Internal status values used by the courier UI. The backend stores lowercase status names
// ("pending", "in progress", "delivered"); these stable uppercase tokens are the client's model.
// Visible text uses a space ("IN PROGRESS"); the internal token uses an underscore.
export const DELIVERY_STATUS = Object.freeze({
  DELIVERED: 'DELIVERED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING: 'PENDING',
});

// Human-readable label for each internal status, matching the wireframe's uppercase display.
export const DELIVERY_STATUS_LABELS = Object.freeze({
  DELIVERED: 'DELIVERED',
  IN_PROGRESS: 'IN PROGRESS',
  PENDING: 'PENDING',
});

// Allowlist mapping the only verified backend status spellings onto internal tokens. An
// unrecognized status is intentionally left unmapped so a malformed row is excluded, never guessed
// into one of the three supported states.
const BACKEND_STATUS_TO_INTERNAL = Object.freeze({
  delivered: DELIVERY_STATUS.DELIVERED,
  'in progress': DELIVERY_STATUS.IN_PROGRESS,
  pending: DELIVERY_STATUS.PENDING,
});

// User-safe classification messages; raw server details and tokens never reach the interface.
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

// ==================== Courier delivery retrieval ====================

/**
 * Maps a verified backend status spelling to its internal token, or null when unrecognized.
 * Comparison is case- and whitespace-tolerant only for the three allowlisted spellings.
 * Read aloud: “normalize delivery status.”
 */
function normalizeDeliveryStatus(rawStatus) {
  if (typeof rawStatus !== 'string') {
    return null;
  }

  // Collapse internal whitespace so "In  Progress" and "in progress" resolve identically.
  const key = rawStatus.trim().toLowerCase().replace(/\s+/g, ' ');

  return BACKEND_STATUS_TO_INTERNAL[key] ?? null;
}

/**
 * Validates one raw delivery product and maps its snake_case fields to camelCase.
 * Unlike the customer history product, the courier Delivery Details modal shows the per-item
 * `unit_cost`, so this normalizer maps and validates it in addition to the line total.
 * Returns null for a malformed entry so the caller can exclude the whole delivery.
 * Read aloud: “normalize delivery product.”
 */
function normalizeDeliveryProduct(rawProduct) {
  if (!rawProduct || typeof rawProduct !== 'object' || Array.isArray(rawProduct)) {
    return null;
  }

  const productId = Number(rawProduct.product_id);
  const productName =
    typeof rawProduct.product_name === 'string' ? rawProduct.product_name.trim() : '';
  const quantity = Number(rawProduct.quantity);
  const unitCost = Number(rawProduct.unit_cost);
  const totalCost = Number(rawProduct.total_cost);

  if (
    !isPositiveSafeInteger(productId) ||
    !productName ||
    !isPositiveSafeInteger(quantity) ||
    !isNonNegativeSafeInteger(unitCost) ||
    !isNonNegativeSafeInteger(totalCost)
  ) {
    return null;
  }

  return { productId, productName, quantity, totalCost, unitCost };
}

/**
 * Validates one raw courier order and maps backend snake_case fields to the client Delivery shape.
 * The backend has no per-order details endpoint, so the Delivery Details modal renders entirely
 * from this normalized list object. A row with an unsupported status or malformed data returns
 * null so the caller can exclude it rather than render `undefined` or a guessed status.
 * Read aloud: “normalize courier delivery.”
 */
function normalizeCourierDelivery(rawOrder) {
  if (!rawOrder || typeof rawOrder !== 'object' || Array.isArray(rawOrder)) {
    return null;
  }

  const id = Number(rawOrder.id);
  const restaurantName =
    typeof rawOrder.restaurant_name === 'string' ? rawOrder.restaurant_name.trim() : '';
  const status = normalizeDeliveryStatus(rawOrder.status);
  const totalCost = Number(rawOrder.total_cost);
  const createdOn = typeof rawOrder.created_on === 'string' ? rawOrder.created_on.trim() : '';

  // customer_address is the delivery destination; a blank value normalizes to null so the modal
  // shows a safe fallback instead of the strings "undefined" or "null".
  const deliveryAddress =
    typeof rawOrder.customer_address === 'string' && rawOrder.customer_address.trim()
      ? rawOrder.customer_address.trim()
      : null;

  // A pending order has no courier (null); an assigned order carries the owning courier ID, which
  // the retrieval filter compares against the active courier before the row may render.
  const courierId =
    rawOrder.courier_id === null || rawOrder.courier_id === undefined
      ? null
      : Number(rawOrder.courier_id);

  const products = Array.isArray(rawOrder.products)
    ? rawOrder.products.map(normalizeDeliveryProduct)
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

  return {
    courierId,
    createdOn,
    deliveryAddress,
    id,
    products,
    restaurantName,
    status,
    totalCost,
  };
}

/**
 * Validates one `{ message: "Success", data: [...] }` list envelope and normalizes its rows.
 * fetchCourierDeliveries calls it for both the pending and courier-scoped responses.
 * A valid empty array is legitimate and returns []; a malformed envelope is a response error.
 * Read aloud: “normalize delivery list.”
 */
function normalizeDeliveryList(responseData) {
  if (!responseData || responseData.message !== 'Success' || !Array.isArray(responseData.data)) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response);
  }

  return responseData.data.map(normalizeCourierDelivery);
}

/**
 * Performs one authenticated delivery-list GET and classifies its failures for the caller.
 * fetchCourierDeliveries uses it for the pending and courier-scoped endpoints under one session.
 * Read aloud: “request delivery list.”
 */
async function requestDeliveryList(path, session, signal) {
  const { data, response } = await requestJson(path, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    method: 'GET',
    signal,
  });

  // As verified live for the other order calls, this backend reports missing/invalid/expired
  // tokens as 401 or 403 with no custom entry point; both exit through shared sign-out handling.
  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', ORDER_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response, response.status);
  }

  return normalizeDeliveryList(data);
}

/**
 * Loads the active courier's eligible deliveries: every pending order plus only the orders this
 * courier is assigned. The token and courier ID are read from the shared session boundary at
 * request time, never from props or route parameters, and `courierId` (never `userId`) scopes the
 * courier query. Results are merged, deduplicated by order ID, and ownership-filtered so another
 * courier's assigned order can never render even if stale upstream data reaches the client.
 * Read aloud: “fetch courier deliveries.”
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<Array<object>>} Eligible normalized deliveries; [] when none are available.
 * @throws {ApiRequestError} Codes: `unauthorized`, `service`, `response`, `connection`, `aborted`.
 */
export async function fetchCourierDeliveries({ signal } = {}) {
  const session = await getStoredSession();
  const courierId = Number(session?.courierId);

  // Only a validated active courier session may issue these requests; a missing session, the wrong
  // active role, or a missing courier ID routes through shared logged-out handling.
  if (!session || session.activeRole !== ROLES.courier || !isPositiveSafeInteger(courierId)) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, 401);
  }

  // Both lists load under one call so a single failure classifies the whole refresh; the courier
  // query is scoped by the stored courier ID.
  const [pendingRows, assignedRows] = await Promise.all([
    requestDeliveryList('/api/orders/pending', session, signal),
    requestDeliveryList(
      `/api/orders?type=courier&id=${encodeURIComponent(courierId)}`,
      session,
      signal,
    ),
  ]);

  // Deduplicate by order ID. The courier-scoped row is authoritative for an assigned order, so it
  // is applied after the pending rows and wins any overlap; a downgrade to stale pending data for
  // an already-assigned order is therefore impossible.
  const deliveriesById = new Map();

  for (const delivery of pendingRows) {
    if (delivery && !deliveriesById.has(delivery.id)) {
      deliveriesById.set(delivery.id, delivery);
    }
  }

  for (const delivery of assignedRows) {
    if (delivery) {
      deliveriesById.set(delivery.id, delivery);
    }
  }

  const eligibleDeliveries = [];

  for (const delivery of deliveriesById.values()) {
    // A pending order is visible to every courier for acceptance. Any non-pending order is visible
    // only to its assigned courier, which excludes foreign and dirty unassigned non-pending rows.
    const isEligible =
      delivery.status === DELIVERY_STATUS.PENDING || delivery.courierId === courierId;

    if (isEligible) {
      eligibleDeliveries.push(delivery);
    }
  }

  return eligibleDeliveries;
}

// ==================== Courier status mutation ====================

// Backend order_status_id for each internal status (confirmed 1/2/3 and DB-verified in tests).
const DELIVERY_STATUS_ID = Object.freeze({
  DELIVERED: 3,
  IN_PROGRESS: 2,
  PENDING: 1,
});

/**
 * Reads a validated active courier session or throws the shared unauthorized failure.
 * The status-mutation functions call it so courier identity stays at the service boundary.
 * Read aloud: “require courier session.”
 */
async function requireCourierSession() {
  const session = await getStoredSession();
  const courierId = Number(session?.courierId);

  if (!session || session.activeRole !== ROLES.courier || !isPositiveSafeInteger(courierId)) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, 401);
  }

  return { courierId, session };
}

/**
 * Classifies a non-2xx mutation response into the shared error codes, or returns for success.
 * Read aloud: “throw for mutation failure.”
 */
function throwForMutationFailure(response) {
  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, response.status);
  }

  if (response.status === 404) {
    throw new ApiRequestError('notFound', ORDER_ERROR_MESSAGES.notFound, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', ORDER_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status, response.status);
  }
}

/**
 * Validates the single-object `{ message: "Success", data }` envelope and normalizes the order.
 * Every mutation returns the persisted order, so the screen renders reconciled state, not a guess.
 * Read aloud: “normalize updated delivery.”
 */
function normalizeUpdatedDelivery(responseData) {
  const rawOrder =
    responseData?.message === 'Success' &&
    responseData.data &&
    typeof responseData.data === 'object' &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;
  const delivery = rawOrder ? normalizeCourierDelivery(rawOrder) : null;

  if (!delivery) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response);
  }

  return delivery;
}

/**
 * Persists a status-only change through the minimal `PUT /api/order/{id}/status` endpoint.
 * This endpoint changes only `order_status_id`; it never overwrites restaurant, customer, rating,
 * or courier, so a status change cannot erase unrelated order data.
 * Read aloud: “put order status.”
 */
async function putOrderStatus(orderId, statusId, session, signal) {
  const { data, response } = await requestJson(
    `/api/order/${encodeURIComponent(orderId)}/status`,
    {
      body: JSON.stringify({ order_status_id: statusId }),
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      signal,
    },
  );

  throwForMutationFailure(response);
  return normalizeUpdatedDelivery(data);
}

/**
 * Assigns the given courier to the order through the existing assignment endpoint.
 * Read aloud: “put order courier.”
 */
async function putOrderCourier(orderId, courierId, session, signal) {
  const { data, response } = await requestJson(
    `/api/order/${encodeURIComponent(orderId)}/courier`,
    {
      body: JSON.stringify({ courier_id: courierId }),
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      signal,
    },
  );

  throwForMutationFailure(response);
  return normalizeUpdatedDelivery(data);
}

/**
 * Accepts a pending delivery: persist status IN PROGRESS first, then assign the active courier.
 * The order is confirmed business sequence (status ID 2, then assignment). If the status update
 * succeeds but assignment fails, a `partial` error carrying `orderId` is thrown so the screen can
 * offer a retry-assignment recovery instead of losing the order or claiming acceptance succeeded.
 * Read aloud: “accept delivery.”
 * @param {{delivery: object, signal?: AbortSignal}} options
 * @returns {Promise<object>} The persisted, assigned in-progress delivery.
 * @throws {ApiRequestError} Codes: `unauthorized`, `invalid`, `notFound`, `service`, `response`,
 *   `connection`, `aborted`, `partial`.
 */
export async function acceptDelivery({ delivery, signal }) {
  const { courierId, session } = await requireCourierSession();

  // Only a genuinely pending delivery may be accepted; anything else is a stale/duplicate action.
  if (!delivery || delivery.status !== DELIVERY_STATUS.PENDING) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status);
  }

  // Step 1: status → IN PROGRESS. A failure here leaves the order PENDING and is surfaced as-is.
  await putOrderStatus(delivery.id, DELIVERY_STATUS_ID.IN_PROGRESS, session, signal);

  // Step 2: assign the active courier. A failure now is a partial acceptance, not a full failure.
  try {
    return await putOrderCourier(delivery.id, courierId, session, signal);
  } catch (error) {
    if (error?.code === 'aborted') {
      throw error;
    }

    const partialError = new ApiRequestError('partial', ORDER_ERROR_MESSAGES.partial, error?.status ?? null);
    partialError.orderId = delivery.id;
    throw partialError;
  }
}

/**
 * Recovery for a partial acceptance: assign the active courier to an order already at status 2.
 * Read aloud: “assign active courier.”
 * @param {{orderId: number, signal?: AbortSignal}} options
 * @returns {Promise<object>} The persisted, now-assigned in-progress delivery.
 */
export async function assignActiveCourier({ orderId, signal }) {
  const { courierId, session } = await requireCourierSession();
  const normalizedOrderId = Number(orderId);

  if (!isPositiveSafeInteger(normalizedOrderId)) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status);
  }

  return putOrderCourier(normalizedOrderId, courierId, session, signal);
}

/**
 * Completes the active courier's in-progress delivery by persisting status DELIVERED (ID 3).
 * Only an in-progress delivery owned by the active courier may advance; the courier is not
 * reassigned because the status-only endpoint leaves the existing assignment untouched.
 * Read aloud: “mark delivered.”
 * @param {{delivery: object, signal?: AbortSignal}} options
 * @returns {Promise<object>} The persisted delivered delivery.
 */
export async function markDelivered({ delivery, signal }) {
  const { courierId, session } = await requireCourierSession();

  // Guard against skipped/reversed/foreign/duplicate transitions before any request is sent.
  if (
    !delivery ||
    delivery.status !== DELIVERY_STATUS.IN_PROGRESS ||
    delivery.courierId !== courierId
  ) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status);
  }

  return putOrderStatus(delivery.id, DELIVERY_STATUS_ID.DELIVERED, session, signal);
}
