/**
 * File: apiClient.test.js
 * Purpose: Verifies shared URL, transport, envelope, and protected-response contracts.
 * Contents:
 * 1. URL and request transport
 * 2. Protected failure classification
 * 3. Success envelopes and session preconditions
 */

const mockGetStoredSession = jest.fn();

jest.mock('../../storage/authStorage', () => ({
  getStoredSession: mockGetStoredSession,
}));

process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/root/';

const {
  ApiRequestError,
  buildApiUrl,
  classifyProtectedFailure,
  requestJson,
  requireSession,
  requireSuccessList,
  requireSuccessObject,
} = require('../apiClient');

function response({ data, jsonRejects = false, ok = true, status = 200 }) {
  return {
    json: jsonRejects ? jest.fn().mockRejectedValue(new Error('not json')) : jest.fn().mockResolvedValue(data),
    ok,
    status,
  };
}

describe('API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    delete global.fetch;
  });

  test('normalizes the configured base URL and request path', () => {
    expect(buildApiUrl('api/orders')).toBe('https://api.example.test/root/api/orders');
    expect(buildApiUrl('/api/orders')).toBe('https://api.example.test/root/api/orders');
  });

  test('returns parsed data with response metadata and forwards options', async () => {
    const fetchResponse = response({ data: { message: 'Success' }, status: 201 });
    global.fetch.mockResolvedValue(fetchResponse);

    await expect(
      requestJson('/api/orders', { method: 'POST', timeoutMs: 1000 }),
    ).resolves.toEqual({ data: { message: 'Success' }, response: fetchResponse });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/root/api/orders',
      expect.objectContaining({ method: 'POST', signal: expect.any(Object) }),
    );
  });

  test('allows a non-2xx response with a non-JSON body to reach domain classification', async () => {
    const fetchResponse = response({ jsonRejects: true, ok: false, status: 503 });
    global.fetch.mockResolvedValue(fetchResponse);

    await expect(requestJson('/api/orders')).resolves.toEqual({ data: null, response: fetchResponse });
  });

  test('rejects a successful response whose body is not JSON', async () => {
    global.fetch.mockResolvedValue(response({ jsonRejects: true }));

    await expect(requestJson('/api/orders')).rejects.toMatchObject({
      code: 'response',
      status: 200,
    });
  });

  test('classifies network failures without leaking their raw message', async () => {
    global.fetch.mockRejectedValue(new Error('socket details'));

    await expect(requestJson('/api/orders')).rejects.toMatchObject({
      code: 'connection',
      message: 'Unable to reach the service. Check your connection and try again.',
    });
  });

  test('classifies the internal request deadline as a timeout', async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementation((_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
    );

    const pendingRequest = requestJson('/api/orders', { timeoutMs: 25 });
    jest.advanceTimersByTime(25);

    await expect(pendingRequest).rejects.toMatchObject({
      code: 'connection',
      message: 'The request timed out. Check your connection and try again.',
    });
    jest.useRealTimers();
  });

  test('classifies caller cancellation separately from connection failures', async () => {
    const controller = new AbortController();
    global.fetch.mockImplementation((_url, options) => {
      controller.abort();
      return Promise.reject(Object.assign(new Error('aborted'), { signal: options.signal }));
    });

    await expect(requestJson('/api/orders', { signal: controller.signal })).rejects.toMatchObject({
      code: 'aborted',
    });
  });

  test.each([401, 403])('classifies HTTP %i as an unusable protected session', (status) => {
    expect(() =>
      classifyProtectedFailure({ status }, { service: 'offline', token: 'expired' }),
    ).toThrow(expect.objectContaining({ code: 'unauthorized', message: 'expired', status }));
  });

  test('classifies server errors and ignores domain-specific statuses', () => {
    expect(() =>
      classifyProtectedFailure({ status: 503 }, { service: 'offline', token: 'expired' }),
    ).toThrow(expect.objectContaining({ code: 'service', status: 503 }));
    expect(() =>
      classifyProtectedFailure({ status: 404 }, { service: 'offline', token: 'expired' }),
    ).not.toThrow();
  });

  test('returns valid success-list and success-object payloads', () => {
    const list = [{ id: 1 }];
    const object = { id: 1 };

    expect(requireSuccessList({ data: list, message: 'Success' }, 'bad')).toBe(list);
    expect(requireSuccessObject({ data: object, message: 'Success' }, 'bad')).toBe(object);
  });

  test.each([
    null,
    {},
    { data: {}, message: 'Success' },
    { data: [], message: 'Failure' },
  ])('rejects malformed list envelope %#', (payload) => {
    expect(() => requireSuccessList(payload, 'bad list')).toThrow(
      expect.objectContaining({ code: 'response', message: 'bad list' }),
    );
  });

  test.each([
    null,
    {},
    { data: [], message: 'Success' },
    { data: {}, message: 'Failure' },
  ])('rejects malformed object envelope %#', (payload) => {
    expect(() => requireSuccessObject(payload, 'bad object')).toThrow(
      expect.objectContaining({ code: 'response', message: 'bad object' }),
    );
  });

  test('returns a stored session or throws the shared unauthorized error', async () => {
    const session = { accessToken: 'token' };
    mockGetStoredSession.mockResolvedValueOnce(session).mockResolvedValueOnce(null);

    await expect(requireSession('expired')).resolves.toBe(session);
    await expect(requireSession('expired')).rejects.toEqual(
      expect.objectContaining({ code: 'unauthorized', message: 'expired', status: 401 }),
    );
  });

  test('ApiRequestError exposes stable classification fields', () => {
    expect(new ApiRequestError('service', 'safe', 503)).toMatchObject({
      code: 'service',
      message: 'safe',
      name: 'ApiRequestError',
      status: 503,
    });
  });
});
