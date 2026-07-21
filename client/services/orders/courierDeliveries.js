/**
 * File: courierDeliveries.js
 * Purpose: Loads, normalizes, and mutates courier-visible deliveries.
 * Contents:
 * 1. Courier delivery normalization
 * 2. Eligible-delivery retrieval
 * 3. Courier session and mutation helpers
 * 4. Accept, assignment-recovery, and delivered transitions
 */

import {
  BACKEND_STATUS_TO_INTERNAL,
  DELIVERY_STATUS,
  DELIVERY_STATUS_ID,
} from '../../constants/deliveryStatus';
import { getStoredSession, ROLES } from '../../storage/authStorage';
import { isNonNegativeSafeInteger, isPositiveSafeInteger } from '../../utils/validation';
import {
  ApiRequestError,
  classifyProtectedFailure,
  requestJson,
  requireSuccessList,
  requireSuccessObject,
} from '../apiClient';
import { normalizeBaseOrderProduct, ORDER_ERROR_MESSAGES } from './orderShared';

/**
 * Maps a verified backend status spelling to its internal token, or null when unrecognized.
 * Comparison is case- and whitespace-tolerant only for the three allowlisted spellings.
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
 */
function normalizeDeliveryProduct(rawProduct) {
  const base = normalizeBaseOrderProduct(rawProduct);

  if (!base) {
    return null;
  }

  const unitCost = Number(rawProduct.unit_cost);

  if (!isNonNegativeSafeInteger(unitCost)) {
    return null;
  }

  return { ...base, unitCost };
}

/**
 * Validates one raw courier order and maps backend snake_case fields to the client Delivery shape.
 * The backend has no per-order details endpoint, so the Delivery Details modal renders entirely
 * from this normalized list object. A row with an unsupported status or malformed data returns
 * null so the caller can exclude it rather than render `undefined` or a guessed status.
 */
function normalizeCourierDelivery(rawOrder) {
  if (!rawOrder || typeof rawOrder !== 'object' || Array.isArray(rawOrder)) {
    return null;
  }

  const id = Number(rawOrder.id);
  const customerId = Number(rawOrder.customer_id);
  const restaurantId = Number(rawOrder.restaurant_id);
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

  // The nullable restaurant rating is retained only so a status change can echo it back through the
  // broad order update without erasing it; a missing or non-positive value normalizes to null.
  const restaurantRating =
    rawOrder.restaurant_rating === null ||
    rawOrder.restaurant_rating === undefined ||
    !isPositiveSafeInteger(Number(rawOrder.restaurant_rating))
      ? null
      : Number(rawOrder.restaurant_rating);

  const products = Array.isArray(rawOrder.products)
    ? rawOrder.products.map(normalizeDeliveryProduct)
    : null;

  if (
    !isPositiveSafeInteger(id) ||
    !isPositiveSafeInteger(customerId) ||
    !isPositiveSafeInteger(restaurantId) ||
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
    customerId,
    deliveryAddress,
    id,
    products,
    restaurantId,
    restaurantName,
    restaurantRating,
    status,
    totalCost,
  };
}

/**
 * Validates one `{ message: "Success", data: [...] }` list envelope and normalizes its rows.
 * fetchCourierDeliveries calls it for both the pending and courier-scoped responses.
 * A valid empty array is legitimate and returns []; a malformed envelope is a response error.
 */
function normalizeDeliveryList(responseData) {
  const rawDeliveries = requireSuccessList(responseData, ORDER_ERROR_MESSAGES.response);

  return rawDeliveries.map(normalizeCourierDelivery);
}

/**
 * Performs one authenticated delivery-list GET and classifies its failures for the caller.
 * fetchCourierDeliveries uses it for the pending and courier-scoped endpoints under one session.
 */
async function requestDeliveryList(path, session, signal) {
  const { data, response } = await requestJson(path, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    method: 'GET',
    signal,
  });

  classifyProtectedFailure(response, ORDER_ERROR_MESSAGES);

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
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<Array<object>>} Eligible normalized deliveries; [] when none are available.
 * @throws {ApiRequestError} Codes: `unauthorized`, `service`, `response`, `connection`, `aborted`.
 */
export async function fetchCourierDeliveries({ signal } = {}) {
  // The active-courier precondition is the same one `acceptDelivery`/`markDelivered` require, so
  // this reuses that shared helper instead of re-inlining the identical check.
  const { courierId, session } = await requireCourierSession();

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

/**
 * Reads a validated active courier session or throws the shared unauthorized failure.
 * The status-mutation functions call it so courier identity stays at the service boundary.
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
 */
function throwForMutationFailure(response) {
  classifyProtectedFailure(response, ORDER_ERROR_MESSAGES);

  if (response.status === 404) {
    throw new ApiRequestError('notFound', ORDER_ERROR_MESSAGES.notFound, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status, response.status);
  }
}

/**
 * Validates the single-object `{ message: "Success", data }` envelope and normalizes the order.
 * Every mutation returns the persisted order, so the screen renders reconciled state, not a guess.
 */
function normalizeUpdatedDelivery(responseData) {
  const rawOrder = requireSuccessObject(responseData, ORDER_ERROR_MESSAGES.response);
  const delivery = normalizeCourierDelivery(rawOrder);

  if (!delivery) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response);
  }

  return delivery;
}

/**
 * Persists a status change through the existing broad `PUT /api/orders/{id}` endpoint.
 * The broad update overwrites restaurant, customer, status, and rating, so the request echoes the
 * delivery's own `restaurantId`, `customerId`, and current `restaurantRating` and changes only the
 * status. The rating is preserved because the order response now exposes it (courier is not part of
 * the broad body, so the assignment is untouched).
 */
async function putOrderStatusUpdate(delivery, statusId, session, signal) {
  const { data, response } = await requestJson(
    `/api/orders/${encodeURIComponent(delivery.id)}`,
    {
      body: JSON.stringify({
        customer_id: delivery.customerId,
        order_status_id: statusId,
        restaurant_id: delivery.restaurantId,
        restaurant_rating: delivery.restaurantRating,
      }),
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
 * @param {{delivery: object, signal?: AbortSignal}} options
 * @returns {Promise<object>} The persisted, assigned in-progress delivery.
 * @throws {ApiRequestError} Codes: `unauthorized`, `invalid`, `notFound`, `service`, `response`,
 *   `connection`, `aborted`, `partial`.
 */
export async function acceptDelivery({ delivery, signal }) {
  const { courierId, session } = await requireCourierSession();

  // Only a genuinely pending delivery with the identifiers the broad update needs may be accepted.
  if (
    !delivery ||
    delivery.status !== DELIVERY_STATUS.PENDING ||
    !isPositiveSafeInteger(delivery.restaurantId) ||
    !isPositiveSafeInteger(delivery.customerId)
  ) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status);
  }

  // Step 1: status → IN PROGRESS. A failure here leaves the order PENDING and is surfaced as-is.
  await putOrderStatusUpdate(delivery, DELIVERY_STATUS_ID.IN_PROGRESS, session, signal);

  // Step 2: assign the active courier. A failure now is a partial acceptance, not a full failure.
  try {
    return await putOrderCourier(delivery.id, courierId, session, signal);
  } catch (error) {
    if (error?.code === 'aborted') {
      throw error;
    }

    const partialError = new ApiRequestError(
      'partial',
      ORDER_ERROR_MESSAGES.partial,
      error?.status ?? null,
    );
    partialError.orderId = delivery.id;
    throw partialError;
  }
}

/**
 * Recovery for a partial acceptance: assign the active courier to an order already at status 2.
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
 * @param {{delivery: object, signal?: AbortSignal}} options
 * @returns {Promise<object>} The persisted delivered delivery.
 */
export async function markDelivered({ delivery, signal }) {
  const { courierId, session } = await requireCourierSession();

  // Guard against skipped/reversed/foreign/duplicate transitions and a body missing identifiers.
  if (
    !delivery ||
    delivery.status !== DELIVERY_STATUS.IN_PROGRESS ||
    delivery.courierId !== courierId ||
    !isPositiveSafeInteger(delivery.restaurantId) ||
    !isPositiveSafeInteger(delivery.customerId)
  ) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.status);
  }

  return putOrderStatusUpdate(delivery, DELIVERY_STATUS_ID.DELIVERED, session, signal);
}
