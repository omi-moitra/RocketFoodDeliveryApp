/**
 * File: apiClient.js
 * Purpose: Builds environment-based API URLs and performs bounded JSON requests.
 * Contents: request errors, API URL configuration, JSON request helper.
 */

const REQUEST_TIMEOUT_MS = 15000;

export class ApiRequestError extends Error {
  constructor(code, message, status = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

function getApiBaseUrl() {
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

    return configuredUrl.replace(/\/+$/, '');
  } catch {
    throw new ApiRequestError(
      'configuration',
      'The API connection is not configured correctly. Please try again after setup is complete.',
    );
  }
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function requestJson(path, options = {}) {
  const { signal, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const requestController = new AbortController();
  let didTimeout = false;

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
      throw new ApiRequestError('aborted', 'The login request was cancelled.');
    }

    throw new ApiRequestError(
      'connection',
      didTimeout
        ? 'The login request timed out. Check your connection and try again.'
        : 'Unable to reach the login service. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}
