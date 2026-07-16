/**
 * File: apiClient.js
 * Purpose: Builds environment-based API URLs and performs bounded JSON requests.
 * Contents:
 * 1. Request error contract
 * 2. API URL configuration
 * 3. Bounded JSON request helper
 */

// Every request gets a finite upper bound so the interface can recover from a hung connection.
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Carries a stable client error code plus an optional HTTP status across service boundaries.
 * Feature services throw it so screens can display safe messages without inspecting raw failures.
 * Read aloud: “A-P-I request error.”
 */
export class ApiRequestError extends Error {
  /**
   * Creates one classifiable request failure for transport and feature-service handling.
   * Read aloud: “constructor,” the standard JavaScript class initializer.
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
 * Read aloud: “get A-P-I base U-R-L.”
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
 * Read aloud: “build A-P-I U-R-L.”
 */
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

/**
 * Performs a cancellable, time-bounded request and returns both parsed data and response metadata.
 * Feature services use it to share transport behavior while classifying domain failures themselves.
 * Read aloud: “request J-S-O-N.”
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
