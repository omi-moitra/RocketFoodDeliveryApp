/**
 * File: customerOrders.js
 * Purpose: Loads and normalizes the authenticated customer's order history.
 * Contents:
 * 1. Customer order normalization
 * 2. History-envelope normalization
 * 3. Protected customer-history request
 */

import { getStoredSession } from '../../storage/authStorage';
import { isNonNegativeSafeInteger, isPositiveSafeInteger } from '../../utils/validation';
import {
  ApiRequestError,
  classifyProtectedFailure,
  requestJson,
  requireSuccessList,
} from '../apiClient';
import { normalizeBaseOrderProduct, ORDER_ERROR_MESSAGES } from './orderShared';

/** Validates one raw customer order and maps backend snake_case fields to the client shape. */
function normalizeCustomerOrder(rawOrder) {
  if (!rawOrder || typeof rawOrder !== 'object' || Array.isArray(rawOrder)) {
    return null;
  }

  const id = Number(rawOrder.id);
  const restaurantName =
    typeof rawOrder.restaurant_name === 'string' ? rawOrder.restaurant_name.trim() : '';
  const status = typeof rawOrder.status === 'string' ? rawOrder.status.trim() : '';
  const totalCost = Number(rawOrder.total_cost);
  const createdOn = typeof rawOrder.created_on === 'string' ? rawOrder.created_on.trim() : '';
  const courierId =
    rawOrder.courier_id === null || rawOrder.courier_id === undefined
      ? null
      : Number(rawOrder.courier_id);
  const courierName =
    typeof rawOrder.courier_name === 'string' && rawOrder.courier_name.trim()
      ? rawOrder.courier_name.trim()
      : null;
  const products = Array.isArray(rawOrder.products)
    ? rawOrder.products.map(normalizeBaseOrderProduct)
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
    courierName,
    createdOn,
    id,
    products,
    restaurantName,
    status,
    totalCost,
  };
}

/** Returns well-formed, uniquely identified orders from the strict success-list envelope. */
function normalizeCustomerOrders(responseData) {
  const rawOrders = requireSuccessList(responseData, ORDER_ERROR_MESSAGES.response);
  const seenOrderIds = new Set();
  const orders = [];
  let skippedCount = 0;

  for (const rawOrder of rawOrders) {
    const order = normalizeCustomerOrder(rawOrder);

    if (!order || seenOrderIds.has(order.id)) {
      skippedCount += 1;
      continue;
    }

    seenOrderIds.add(order.id);
    orders.push(order);
  }

  if (skippedCount > 0 && __DEV__) {
    console.warn(
      `orderService: skipped ${skippedCount} malformed or duplicate order-history entries.`,
    );
  }

  return orders;
}

/** Loads all orders belonging to the authenticated customer through the existing query contract. */
export async function fetchCustomerOrders({ signal } = {}) {
  const session = await getStoredSession();
  const customerId = Number(session?.customerId);

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

  classifyProtectedFailure(response, ORDER_ERROR_MESSAGES);

  if (!response.ok) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response, response.status);
  }

  return normalizeCustomerOrders(data);
}
