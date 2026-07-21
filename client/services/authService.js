/**
 * File: authService.js
 * Purpose: Authenticates credentials and maps the role-capable backend session response.
 * Contents: login messages, identifier validation, role-aware authentication request.
 */

import { ApiRequestError, requestJson } from './apiClient';
import { isPositiveSafeInteger } from '../utils/validation';

// Screens receive stable, user-safe messages instead of backend or network implementation details.
export const LOGIN_ERROR_MESSAGES = Object.freeze({
  accountAccess: 'This account is not set up for the customer or courier app.',
  credentials: 'The email or password is incorrect. Please try again.',
  requestValidation: 'Please check your email and password, then try again.',
  response: 'The login service returned an unexpected response. Please try again.',
  service: 'The login service is unavailable right now. Please try again.',
});

/**
 * Accepts only positive whole-number identifiers returned as numbers or numeric strings.
 * authenticateUser uses it before trusting backend user/customer/courier IDs.
 * Read aloud: “is usable identifier.”
 */
function isUsableIdentifier(value) {
  if (typeof value === 'number') {
    return isPositiveSafeInteger(value);
  }

  return (
    typeof value === 'string' &&
    /^\d+$/.test(value.trim()) &&
    isPositiveSafeInteger(Number(value.trim()))
  );
}

/**
 * Submits credentials and maps a successful payload into a role-capable client session shape.
 * A response with at least one supported role ID is accepted; neither role is rejected safely.
 * LoginScreen calls it before AuthProvider persists the authenticated session.
 * Read aloud: “authenticate user.”
 */
export async function authenticateUser({ email, password, signal }) {
  const { data, response } = await requestJson('/api/auth', {
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  });

  if (response.status === 401 || data?.success === false) {
    throw new ApiRequestError('credentials', LOGIN_ERROR_MESSAGES.credentials, response.status);
  }

  if (response.status === 400) {
    throw new ApiRequestError(
      'request-validation',
      LOGIN_ERROR_MESSAGES.requestValidation,
      response.status,
    );
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', LOGIN_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok || data?.success !== true) {
    throw new ApiRequestError('response', LOGIN_ERROR_MESSAGES.response, response.status);
  }

  if (typeof data.accessToken !== 'string' || !data.accessToken.trim()) {
    throw new ApiRequestError('response', LOGIN_ERROR_MESSAGES.response, response.status);
  }

  // The user ID is always returned for a successful login and anchors the persisted session.
  if (!isUsableIdentifier(data.user_id)) {
    throw new ApiRequestError('response', LOGIN_ERROR_MESSAGES.response, response.status);
  }

  // Both role IDs are optional; the backend omits the role an account does not have.
  const customerId = isUsableIdentifier(data.customer_id) ? data.customer_id : null;
  const courierId = isUsableIdentifier(data.courier_id) ? data.courier_id : null;

  // An account with neither supported role cannot enter either app; reject it safely.
  if (!customerId && !courierId) {
    throw new ApiRequestError('account-access', LOGIN_ERROR_MESSAGES.accountAccess, response.status);
  }

  return {
    accessToken: data.accessToken.trim(),
    courierId,
    customerId,
    userId: data.user_id,
  };
}
