/**
 * File: productService.js
 * Purpose: Loads and validates products belonging to one authenticated restaurant menu.
 * Contents:
 * 1. Product request messages and validation helpers
 * 2. Product response normalization
 * 3. Protected restaurant-product request
 */

import { isPositiveSafeInteger } from '../utils/validation';
import {
  ApiRequestError,
  classifyProtectedFailure,
  requestJson,
  requireSession,
  requireSuccessList,
} from './apiClient';

export const PRODUCT_ERROR_MESSAGES = Object.freeze({
  response: 'Menu information could not be loaded. Please try again.',
  service: 'The menu service is unavailable right now. Please try again.',
  token: 'Your session has expired. Please log in again.',
});

/**
 * Validates one raw product and maps backend snake_case fields to the client domain shape.
 * Cross-restaurant data is rejected so another restaurant's product can never be displayed or
 * selected merely because a malformed response reached the client.
 */
function normalizeProduct(rawProduct, expectedRestaurantId) {
  if (!rawProduct || typeof rawProduct !== 'object' || Array.isArray(rawProduct)) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response);
  }

  const id = Number(rawProduct.id);
  const restaurantId = Number(rawProduct.restaurant_id);
  const name = typeof rawProduct.name === 'string' ? rawProduct.name.trim() : '';
  const hasValidDescription =
    rawProduct.description === null || typeof rawProduct.description === 'string';
  const description =
    typeof rawProduct.description === 'string' && rawProduct.description.trim()
      ? rawProduct.description.trim()
      : null;
  const cost = Number(rawProduct.cost);

  if (
    !isPositiveSafeInteger(id) ||
    restaurantId !== expectedRestaurantId ||
    !name ||
    !hasValidDescription ||
    !Number.isSafeInteger(cost) ||
    cost < 0
  ) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response);
  }

  return { cost, description, id, name, restaurantId };
}

/**
 * Validates the product envelope, restaurant ownership, and unique product IDs.
 * @returns {Array<{cost: number, description: string|null, id: number, name: string, restaurantId: number}>}
 */
function normalizeProducts(responseData, expectedRestaurantId) {
  const rawProducts = requireSuccessList(responseData, PRODUCT_ERROR_MESSAGES.response);

  const seenProductIds = new Set();

  return rawProducts.map((rawProduct) => {
    const product = normalizeProduct(rawProduct, expectedRestaurantId);

    if (seenProductIds.has(product.id)) {
      throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response);
    }

    seenProductIds.add(product.id);
    return product;
  });
}

/**
 * Loads only the products for one selected restaurant using its bearer-token session.
 * The token is read from the shared session boundary at request time, never from arguments.
 * @param {{restaurantId: number, signal?: AbortSignal}} options
 * @returns {Promise<Array<{cost: number, description: string|null, id: number, name: string, restaurantId: number}>>}
 * @throws {ApiRequestError} For invalid input, authentication, HTTP, or response failures.
 */
export async function fetchProductsForRestaurant({ restaurantId, signal }) {
  const session = await requireSession(PRODUCT_ERROR_MESSAGES.token);

  if (!isPositiveSafeInteger(restaurantId)) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response);
  }

  const encodedRestaurantId = encodeURIComponent(restaurantId);
  const { data, response } = await requestJson(
    `/api/products?restaurant=${encodedRestaurantId}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      method: 'GET',
      signal,
    },
  );

  classifyProtectedFailure(response, PRODUCT_ERROR_MESSAGES);

  if (!response.ok) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response, response.status);
  }

  return normalizeProducts(data, restaurantId);
}
