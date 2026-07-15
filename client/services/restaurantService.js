/**
 * File: restaurantService.js
 * Purpose: Builds protected restaurant queries and validates the backend restaurant contract.
 * Contents:
 * 1. Restaurant request messages and validation helpers
 * 2. Filter query construction
 * 3. Restaurant response normalization
 * 4. Protected restaurant-list fetch
 * 5. Protected restaurant-detail fetch
 */

import { ApiRequestError, requestJson } from './apiClient';

export const RESTAURANT_ERROR_MESSAGES = Object.freeze({
  response: 'The restaurant service returned an unexpected response. Please try again.',
  service: 'Restaurants are unavailable right now. Please try again.',
  token: 'Your session has expired. Please log in again.',
  unavailable: 'Restaurant unavailable.',
});

/**
 * Reports whether a value is a whole number inside an inclusive allowed range.
 * Filter and response validation share it to enforce the backend's integer contract.
 * Read aloud: “is integer in range.”
 */
function isIntegerInRange(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

/**
 * Converts the selected filter values into the exact restaurant endpoint and query string.
 * fetchRestaurants uses it before sending the protected request.
 * Read aloud: “build restaurant path.”
 */
function buildRestaurantPath({ priceRange, rating }) {
  const queryEntries = [];

  // Null is the UI's deliberate “Select” state, so an unset filter is omitted instead of being
  // sent as placeholder text, zero, or the string “null”, all of which change API semantics.
  if (rating !== null) {
    if (!isIntegerInRange(rating, 1, 5)) {
      throw new ApiRequestError('filter', RESTAURANT_ERROR_MESSAGES.response);
    }

    // Stars are presentation only; the Java endpoint filters on the corresponding integer.
    queryEntries.push(['rating', rating]);
  }

  if (priceRange !== null) {
    if (!isIntegerInRange(priceRange, 1, 3)) {
      throw new ApiRequestError('filter', RESTAURANT_ERROR_MESSAGES.response);
    }

    // Dollar signs are presentation only; price_range expects an integer from one through three.
    queryEntries.push(['price_range', priceRange]);
  }

  if (!queryEntries.length) {
    return '/api/restaurants';
  }

  const query = queryEntries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `/api/restaurants?${query}`;
}

/**
 * Validates one backend restaurant and maps its snake-case fields to the client shape.
 * normalizeRestaurants calls it for every response item before UI code receives the data.
 * Read aloud: “normalize restaurant.”
 */
function normalizeRestaurant(rawRestaurant) {
  if (!rawRestaurant || typeof rawRestaurant !== 'object' || Array.isArray(rawRestaurant)) {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response);
  }

  const id = Number(rawRestaurant.id);
  const name = typeof rawRestaurant.name === 'string' ? rawRestaurant.name.trim() : '';
  const priceRange = Number(rawRestaurant.price_range);
  const rating = Number(rawRestaurant.rating);

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !name ||
    !isIntegerInRange(priceRange, 1, 3) ||
    !isIntegerInRange(rating, 0, 5)
  ) {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response);
  }

  return {
    id,
    name,
    // Backend snake_case is mapped once here so UI components use consistent client naming.
    priceRange,
    rating,
  };
}

/**
 * Validates the API envelope and returns a duplicate-free array of normalized restaurants.
 * fetchRestaurants uses it as the final boundary between untrusted JSON and screen state.
 * Read aloud: “normalize restaurants.”
 */
function normalizeRestaurants(responseData) {
  if (!responseData || responseData.message !== 'Success' || !Array.isArray(responseData.data)) {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response);
  }

  const seenRestaurantIds = new Set();

  return responseData.data.map((rawRestaurant) => {
    const restaurant = normalizeRestaurant(rawRestaurant);

    // Duplicate IDs would produce unstable FlatList keys and could open the wrong menu.
    if (seenRestaurantIds.has(restaurant.id)) {
      throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response);
    }

    seenRestaurantIds.add(restaurant.id);
    return restaurant;
  });
}

/**
 * Loads restaurants for the exact active filters using the existing bearer-token API.
 * The Restaurant List screen calls it whenever its initial load or filters change.
 * Read aloud: “fetch restaurants.”
 * @param {{accessToken: string, priceRange: number|null, rating: number|null, signal?: AbortSignal}} options
 * @returns {Promise<Array<{id: number, name: string, priceRange: number, rating: number}>>}
 * @throws {ApiRequestError} When authentication, transport, HTTP, or response validation fails.
 */
export async function fetchRestaurants({ accessToken, priceRange, rating, signal }) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new ApiRequestError('unauthorized', RESTAURANT_ERROR_MESSAGES.token, 401);
  }

  const path = buildRestaurantPath({ priceRange, rating });
  const { data, response } = await requestJson(path, {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
    },
    method: 'GET',
    signal,
  });

  if (response.status === 401) {
    throw new ApiRequestError('unauthorized', RESTAURANT_ERROR_MESSAGES.token, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', RESTAURANT_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response, response.status);
  }

  return normalizeRestaurants(data);
}

/**
 * Loads and validates one restaurant whose response ID must match the selected route ID.
 * RestaurantMenuScreen uses this detail request because its route intentionally carries only ID.
 * @param {{accessToken: string, restaurantId: number, signal?: AbortSignal}} options
 * @returns {Promise<{id: number, name: string, priceRange: number, rating: number}>}
 * @throws {ApiRequestError} For authentication, unavailable, HTTP, or response failures.
 */
export async function fetchRestaurantById({ accessToken, restaurantId, signal }) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new ApiRequestError('unauthorized', RESTAURANT_ERROR_MESSAGES.token, 401);
  }

  if (!Number.isSafeInteger(restaurantId) || restaurantId <= 0) {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response);
  }

  const encodedRestaurantId = encodeURIComponent(restaurantId);
  const { data, response } = await requestJson(`/api/restaurants/${encodedRestaurantId}`, {
    headers: { Authorization: `Bearer ${accessToken.trim()}` },
    method: 'GET',
    signal,
  });

  if (response.status === 401) {
    throw new ApiRequestError('unauthorized', RESTAURANT_ERROR_MESSAGES.token, 401);
  }

  if (response.status === 404) {
    throw new ApiRequestError('unavailable', RESTAURANT_ERROR_MESSAGES.unavailable, 404);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', RESTAURANT_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok || !data || data.message !== 'Success') {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response, response.status);
  }

  const restaurant = normalizeRestaurant(data.data);

  // The route is the menu boundary; a mismatched response must never relabel another restaurant.
  if (restaurant.id !== restaurantId) {
    throw new ApiRequestError('response', RESTAURANT_ERROR_MESSAGES.response, response.status);
  }

  return restaurant;
}
