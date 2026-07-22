/**
 * File: authService.test.js
 * Purpose: Verifies login failure classification and trusted session mapping.
 * Contents:
 * 1. Authentication request contract
 * 2. Failure classification
 * 3. Successful role-aware session mapping
 */

jest.mock('../apiClient', () => {
  class ApiRequestError extends Error {
    constructor(code, message, status = null) {
      super(message);
      this.name = 'ApiRequestError';
      this.code = code;
      this.status = status;
    }
  }

  return { ApiRequestError, requestJson: jest.fn() };
});

import { ApiRequestError, requestJson } from '../apiClient';
import { authenticateUser, LOGIN_ERROR_MESSAGES } from '../authService';

function response(status, ok = status >= 200 && status < 300) {
  return { ok, status };
}

function successfulPayload(overrides = {}) {
  return {
    accessToken: '  token-value  ',
    customer_id: 12,
    success: true,
    user_id: 7,
    ...overrides,
  };
}

describe('authenticateUser', () => {
  beforeEach(() => {
    requestJson.mockReset();
  });

  test('posts credentials and returns a trimmed customer session', async () => {
    const signal = new AbortController().signal;
    requestJson.mockResolvedValue({ data: successfulPayload(), response: response(200) });

    await expect(
      authenticateUser({ email: 'user@example.com', password: 'secret', signal }),
    ).resolves.toEqual({
      accessToken: 'token-value',
      courierId: null,
      customerId: 12,
      userId: 7,
    });

    expect(requestJson).toHaveBeenCalledWith('/api/auth', {
      body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal,
    });
  });

  test('accepts courier-only and dual-role identifier strings', async () => {
    requestJson
      .mockResolvedValueOnce({
        data: successfulPayload({ customer_id: null, courier_id: '22', user_id: '8' }),
        response: response(200),
      })
      .mockResolvedValueOnce({
        data: successfulPayload({ courier_id: '23', customer_id: '13' }),
        response: response(200),
      });

    await expect(authenticateUser({ email: 'a', password: 'b' })).resolves.toMatchObject({
      courierId: '22',
      customerId: null,
      userId: '8',
    });
    await expect(authenticateUser({ email: 'a', password: 'b' })).resolves.toMatchObject({
      courierId: '23',
      customerId: '13',
    });
  });

  test.each([
    [{ success: false }, response(200), 'credentials', LOGIN_ERROR_MESSAGES.credentials],
    [{}, response(401, false), 'credentials', LOGIN_ERROR_MESSAGES.credentials],
    [{}, response(400, false), 'request-validation', LOGIN_ERROR_MESSAGES.requestValidation],
    [{}, response(503, false), 'service', LOGIN_ERROR_MESSAGES.service],
    [{ success: true }, response(418, false), 'response', LOGIN_ERROR_MESSAGES.response],
    [{ success: 'true' }, response(200), 'response', LOGIN_ERROR_MESSAGES.response],
  ])('classifies an unsuccessful response as %s', async (data, httpResponse, code, message) => {
    requestJson.mockResolvedValue({ data, response: httpResponse });

    await expect(authenticateUser({ email: 'a', password: 'b' })).rejects.toMatchObject({
      code,
      message,
      status: httpResponse.status,
    });
  });

  test.each([
    successfulPayload({ accessToken: '   ' }),
    successfulPayload({ user_id: 0 }),
    successfulPayload({ user_id: Number.MAX_SAFE_INTEGER + 1 }),
    successfulPayload({ user_id: '12x' }),
  ])('rejects malformed identity payload %#', async (data) => {
    requestJson.mockResolvedValue({ data, response: response(200) });

    await expect(authenticateUser({ email: 'a', password: 'b' })).rejects.toEqual(
      expect.objectContaining({ code: 'response' }),
    );
  });

  test('rejects a valid user with no supported customer or courier role', async () => {
    requestJson.mockResolvedValue({
      data: successfulPayload({ customer_id: null, courier_id: null }),
      response: response(200),
    });

    await expect(authenticateUser({ email: 'a', password: 'b' })).rejects.toEqual(
      expect.objectContaining({
        code: 'account-access',
        message: LOGIN_ERROR_MESSAGES.accountAccess,
      }),
    );
  });

  test('uses the shared classifiable request error contract', () => {
    const error = new ApiRequestError('credentials', 'safe message', 401);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'credentials', name: 'ApiRequestError', status: 401 });
  });
});
