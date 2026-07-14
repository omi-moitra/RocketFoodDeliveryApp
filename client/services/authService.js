/**
 * File: authService.js
 * Purpose: Authenticates customer credentials and maps the backend session response.
 * Contents: login messages, response validation, customer authentication request.
 */

import { ApiRequestError, requestJson } from './apiClient';

export const LOGIN_ERROR_MESSAGES = Object.freeze({
  accountAccess: 'This account cannot access the customer application.',
  credentials: 'The email or password is incorrect. Please try again.',
  requestValidation: 'Please check your email and password, then try again.',
  response: 'The login service returned an unexpected response. Please try again.',
  service: 'The login service is unavailable right now. Please try again.',
});

function isUsableIdentifier(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0;
  }

  return typeof value === 'string' && /^\d+$/.test(value.trim()) && Number(value) > 0;
}

export async function authenticateCustomer({ email, password, signal }) {
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

  if (!isUsableIdentifier(data.customer_id)) {
    throw new ApiRequestError('account-access', LOGIN_ERROR_MESSAGES.accountAccess, response.status);
  }

  if (typeof data.accessToken !== 'string' || !data.accessToken.trim()) {
    throw new ApiRequestError('response', LOGIN_ERROR_MESSAGES.response, response.status);
  }

  return {
    accessToken: data.accessToken.trim(),
    customerId: data.customer_id,
    userId: isUsableIdentifier(data.user_id) ? data.user_id : null,
  };
}
