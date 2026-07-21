/**
 * File: apiClient.js
 * Purpose: Builds environment-based API URLs, performs bounded JSON requests, and centralizes the
 *          shared protected-request failure classification every domain service reuses.
 * Contents:
 * 1. Request error contract
 * 2. API URL configuration
 * 3. Bounded JSON request helper
 * 4. Shared protected-response failure classification
 * 5. Shared success-envelope validation
 * 6. Shared role-neutral session precondition
 */

import { getStoredSession } from '../storage/authStorage';

// Every request gets a finite upper bound so the interface can recover from a hung connection.
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Carries a stable client error code plus an optional HTTP status across service boundaries.
 * Feature services throw it so screens can display safe messages without inspecting raw failures.
 */
export class ApiRequestError extends Error {
  /**
   * Creates one classifiable request failure for transport and feature-service handling.
   */
  constructor(code, message, status = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

// The env URL cannot change while the app runs, so the validated result is cached after the
// first successful parse instead of re-running URL construction on every request.
let cachedApiBaseUrl = null;

/**
 * Validates and normalizes the public environment URL without exposing a hard-coded server.
 * buildApiUrl calls it for every outgoing request; only a valid result is cached so a
 * misconfigured environment keeps producing the clear configuration error.
 */
function getApiBaseUrl() {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configuredUrl) {
    throw new ApiRequestError(
      'configuration',
      'The API connection is not configured. Please try again after setup is complete.',
    );
  }

  try {
    const parsedUrl = new URL(configuredUrl);

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
      throw new Error('Unsupported API URL.');
    }

    cachedApiBaseUrl = configuredUrl.replace(/\/+$/, '');
    return cachedApiBaseUrl;
  } catch {
    throw new ApiRequestError(
      'configuration',
      'The API connection is not configured correctly. Please try again after setup is complete.',
    );
  }
}

/**
 * Joins one API path to the validated base URL with exactly one path separator.
 * requestJson uses it immediately before fetch.
 */
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

/**
 * Performs a cancellable, time-bounded request and returns both parsed data and response metadata.
 * Feature services use it to share transport behavior while classifying domain failures themselves.
 */
export async function requestJson(path, options = {}) {
  const { signal, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const requestController = new AbortController();
  // didTimeout distinguishes the internal timer from a caller-requested cancellation.
  let didTimeout = false;

  // A feature-owned controller can cancel this request without taking ownership of the timeout.
  const handleExternalAbort = () => requestController.abort();

  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener('abort', handleExternalAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    requestController.abort();
  }, timeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...fetchOptions,
      signal: requestController.signal,
    });

    let data;

    try {
      data = await response.json();
    } catch {
      // Let each service classify an HTTP failure even when its body is not JSON.
      if (!response.ok) {
        return { data: null, response };
      }

      throw new ApiRequestError(
        'response',
        'The service returned an unexpected response. Please try again.',
        response.status,
      );
    }

    return { data, response };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (signal?.aborted && !didTimeout) {
      throw new ApiRequestError('aborted', 'The request was cancelled.');
    }

    throw new ApiRequestError(
      'connection',
      didTimeout
        ? 'The request timed out. Check your connection and try again.'
        : 'Unable to reach the service. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}

/**
 * Classifies a protected response's session-expiry and server-outage failures, throwing a shared
 * `ApiRequestError` for either case; returns normally so the caller continues its own domain-specific
 * checks (404/400/envelope validation/etc.) for every other status.
 *
 * Live evidence (2026-07-15): this backend has no custom AuthenticationEntryPoint and no per-role
 * rules on `/api/**`, so Spring Security's default reports a missing, invalid, or expired bearer
 * token as HTTP 403 alongside the expected 401. Both statuses mean the session is unusable and must
 * exit through the shared sign-out transition rather than a retryable failure.
 *
 * Feature services call this once per protected request, before their own remaining checks, instead
 * of each repeating this same two-branch ladder with only its error messages changed.
 * @param {Response} response The fetch Response from a protected request.
 * @param {{token: string, service: string}} messages Domain-specific safe messages for each case.
 * @throws {ApiRequestError} Code `unauthorized` for 401/403, or `service` for 5xx.
 */
export function classifyProtectedFailure(response, messages) {
  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError('unauthorized', messages.token, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', messages.service, response.status);
  }
}

/**
 * Validates a `{ message: "Success", data: [...] }` list envelope and returns the raw array.
 * Every domain service still owns its own per-row normalization/validation on the returned array;
 * this only removes the repeated envelope-shape check that precedes it in four services.
 * @param {unknown} responseData Parsed JSON body from a protected list request.
 * @param {string} message Domain-specific safe message for a malformed/missing envelope.
 * @returns {Array<unknown>} The envelope's `data` array.
 * @throws {ApiRequestError} Code `response` when the envelope is missing or malformed.
 */
export function requireSuccessList(responseData, message) {
  if (!responseData || responseData.message !== 'Success' || !Array.isArray(responseData.data)) {
    throw new ApiRequestError('response', message);
  }

  return responseData.data;
}

/**
 * Validates a `{ message: "Success", data: {...} }` single-object envelope and returns the record.
 * Every domain service still owns its own per-field coherence checks on the returned record; this
 * only removes the repeated envelope-shape check that precedes it in three services.
 * @param {unknown} responseData Parsed JSON body from a protected single-object request.
 * @param {string} message Domain-specific safe message for a malformed/missing envelope.
 * @returns {object} The envelope's `data` record.
 * @throws {ApiRequestError} Code `response` when the envelope is missing or malformed.
 */
export function requireSuccessObject(responseData, message) {
  const record =
    responseData?.message === 'Success' &&
    responseData.data &&
    typeof responseData.data === 'object' &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;

  if (!record) {
    throw new ApiRequestError('response', message);
  }

  return record;
}

/**
 * Reads the current stored session and throws a shared `unauthorized` failure when none exists.
 * This is the role-neutral precondition shared by every request any authenticated user may make
 * (restaurant/product reads); role-specific requests keep their own dedicated precondition helper
 * (`requireCourierSession` in `orderService.js`, `requireAccountSession` in `accountService.js`),
 * since their role/ID checks are not identical to this one and to each other.
 * @param {string} tokenMessage Domain-specific safe message for a missing/unusable session.
 * @returns {Promise<object>} The current stored session.
 * @throws {ApiRequestError} Code `unauthorized` when no usable session is stored.
 */
export async function requireSession(tokenMessage) {
  const session = await getStoredSession();

  if (!session) {
    throw new ApiRequestError('unauthorized', tokenMessage, 401);
  }

  return session;
}
