/**
 * File: productService.js
 * Purpose: Loads and validates products belonging to one authenticated restaurant menu.
 * Contents:
 * 1. Product request messages and validation helpers
 * 2. Product response normalization
 * 3. Protected restaurant-product request
 */

import { ApiRequestError, requestJson } from './apiClient';

export const PRODUCT_ERROR_MESSAGES = Object.freeze({
  response: 'Menu information could not be loaded. Please try again.',
  service: 'The menu service is unavailable right now. Please try again.',
  token: 'Your session has expired. Please log in again.',
});

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

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
  if (!responseData || responseData.message !== 'Success' || !Array.isArray(responseData.data)) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response);
  }

  const seenProductIds = new Set();

  return responseData.data.map((rawProduct) => {
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
 * @param {{accessToken: string, restaurantId: number, signal?: AbortSignal}} options
 * @returns {Promise<Array<{cost: number, description: string|null, id: number, name: string, restaurantId: number}>>}
 * @throws {ApiRequestError} For invalid input, authentication, HTTP, or response failures.
 */
export async function fetchProductsForRestaurant({ accessToken, restaurantId, signal }) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new ApiRequestError('unauthorized', PRODUCT_ERROR_MESSAGES.token, 401);
  }

  if (!isPositiveSafeInteger(restaurantId)) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response);
  }

  const encodedRestaurantId = encodeURIComponent(restaurantId);
  const { data, response } = await requestJson(
    `/api/products?restaurant=${encodedRestaurantId}`,
    {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
      method: 'GET',
      signal,
    },
  );

  if (response.status === 401) {
    throw new ApiRequestError('unauthorized', PRODUCT_ERROR_MESSAGES.token, 401);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', PRODUCT_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('response', PRODUCT_ERROR_MESSAGES.response, response.status);
  }

  return normalizeProducts(data, restaurantId);
}
