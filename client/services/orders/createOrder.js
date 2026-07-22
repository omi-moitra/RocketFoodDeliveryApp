/**
 * File: createOrder.js
 * Purpose: Validates and submits the authenticated customer's create-order request.
 * Contents:
 * 1. Request-body construction
 * 2. Created-order response normalization
 * 3. Protected create-order request
 */

import { getStoredSession } from '../../storage/authStorage';
import { isPositiveSafeInteger } from '../../utils/validation';
import {
  ApiRequestError,
  classifyProtectedFailure,
  requestJson,
  requireSuccessObject,
} from '../apiClient';
import { ORDER_ERROR_MESSAGES } from './orderShared';

/** Builds the exact documented create-order body from validated client values. */
function buildCreateOrderRequestBody({
  customerId,
  restaurantId,
  selectedProducts,
  sendSMS,
  sendEmail,
}) {
  // Validate the entire selection before mapping it so one malformed row cannot produce a
  // partially valid order body with different products from the summary the customer approved.
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

  // Use the exact HTTP contract: `sendEmail` follows Jackson's normal camelCase mapping, while
  // `sendSMS` matches the DTO's explicit @JsonProperty capitalization. Strict comparisons prevent
  // truthy strings or numbers from becoming an unintended notification opt-in.
  return {
    restaurant_id: restaurantId,
    customer_id: customerId,
    products: selectedProducts.map((product) => ({ id: product.id, quantity: product.quantity })),
    sendEmail: sendEmail === true,
    sendSMS: sendSMS === true,
  };
}

/** Validates the created-order success envelope and returns only the ID consumed by the UI. */
function normalizeCreatedOrder(responseData) {
  const createdOrder = requireSuccessObject(responseData, ORDER_ERROR_MESSAGES.response);
  const id = Number(createdOrder.id);

  if (!isPositiveSafeInteger(id)) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response);
  }

  return { id };
}

/**
 * Creates one order for the authenticated customer through the existing protected endpoint.
 * Identity stays at the service boundary and never travels through component props.
 */
export async function createOrder({
  restaurantId,
  selectedProducts,
  sendSMS = false,
  sendEmail = false,
  signal,
}) {
  const session = await getStoredSession();

  if (!session) {
    throw new ApiRequestError('unauthorized', ORDER_ERROR_MESSAGES.token, 401);
  }

  // Read customer identity at submission time rather than trusting a screen prop that could belong
  // to a previous role/session after logout or account switching.
  const requestBody = buildCreateOrderRequestBody({
    customerId: Number(session.customerId),
    restaurantId,
    selectedProducts,
    sendSMS,
    sendEmail,
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

  classifyProtectedFailure(response, ORDER_ERROR_MESSAGES);

  if (!response.ok) {
    throw new ApiRequestError('invalid', ORDER_ERROR_MESSAGES.invalid, response.status);
  }

  // A generic 2xx is not enough: only 201 proves the create endpoint accepted a new order.
  if (response.status !== 201) {
    throw new ApiRequestError('response', ORDER_ERROR_MESSAGES.response, response.status);
  }

  return normalizeCreatedOrder(data);
}
