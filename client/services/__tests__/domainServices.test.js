/**
 * File: domainServices.test.js
 * Purpose: Verifies account, restaurant, and product service request and normalization boundaries.
 * Contents:
 * 1. Account identity isolation
 * 2. Restaurant filters and response coherence
 * 3. Product ownership and uniqueness
 */

jest.mock('../../storage/authStorage', () => ({
  getStoredSession: jest.fn(),
  ROLES: Object.freeze({ courier: 'courier', customer: 'customer' }),
}));

jest.mock('../apiClient', () => {
  class ApiRequestError extends Error {
    constructor(code, message, status = null) {
      super(message);
      this.name = 'ApiRequestError';
      this.code = code;
      this.status = status;
    }
  }

  const classifyProtectedFailure = (response, messages) => {
    if (response.status === 401 || response.status === 403) {
      throw new ApiRequestError('unauthorized', messages.token, response.status);
    }
    if (response.status >= 500) {
      throw new ApiRequestError('service', messages.service, response.status);
    }
  };

  const requireSuccessList = (payload, message) => {
    if (payload?.message !== 'Success' || !Array.isArray(payload.data)) {
      throw new ApiRequestError('response', message);
    }
    return payload.data;
  };

  const requireSuccessObject = (payload, message) => {
    const record =
      payload?.message === 'Success' &&
      payload.data &&
      typeof payload.data === 'object' &&
      !Array.isArray(payload.data)
        ? payload.data
        : null;
    if (!record) {
      throw new ApiRequestError('response', message);
    }
    return record;
  };

  return {
    ApiRequestError,
    classifyProtectedFailure,
    requestJson: jest.fn(),
    requireSession: jest.fn(),
    requireSuccessList,
    requireSuccessObject,
  };
});

import { fetchAccount, updateAccount } from '../accountService';
import { requestJson, requireSession } from '../apiClient';
import { fetchProductsForRestaurant } from '../productService';
import { fetchRestaurantById, fetchRestaurants } from '../restaurantService';
import { getStoredSession as mockGetStoredSession } from '../../storage/authStorage';

const ok = (status = 200) => ({ ok: true, status });
const failed = (status) => ({ ok: false, status });

function success(data) {
  return { data, message: 'Success' };
}

function accountPayload(overrides = {}) {
  return success({
    courier: { email: 'courier@example.com', id: 22, phone: '555-222-2222' },
    customer: { email: 'customer@example.com', id: 12, phone: '555-111-1111' },
    email: 'login@example.com',
    id: 7,
    ...overrides,
  });
}

describe('account service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStoredSession.mockResolvedValue({
      accessToken: 'token',
      activeRole: 'customer',
      courierId: '22',
      customerId: '12',
      userId: '7',
    });
  });

  test('fetches and exposes only the active role account', async () => {
    requestJson.mockResolvedValue({ data: accountPayload(), response: ok() });

    await expect(fetchAccount({ expectedRole: 'customer' })).resolves.toEqual({
      primaryEmail: 'login@example.com',
      role: 'customer',
      roleEmail: 'customer@example.com',
      roleId: 12,
      rolePhone: '555-111-1111',
      userId: 7,
    });
    expect(requestJson).toHaveBeenCalledWith(
      '/api/account/7?type=customer',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        method: 'GET',
      }),
    );
  });

  test.each([
    ['courier', accountPayload()],
    ['customer', accountPayload({ id: 8 })],
    ['customer', accountPayload({ customer: { email: 'x@y.com', id: 99, phone: '555-111-1111' } })],
  ])('rejects role or response identity mismatch %#', async (expectedRole, data) => {
    requestJson.mockResolvedValue({ data, response: ok() });

    await expect(fetchAccount({ expectedRole })).rejects.toMatchObject({
      code: expectedRole === 'courier' ? 'unauthorized' : 'response',
    });
  });

  test('validates account updates before issuing a request', async () => {
    await expect(
      updateAccount({ email: 'invalid', expectedRole: 'customer', phone: '123' }),
    ).rejects.toMatchObject({ code: 'invalid' });
    expect(requestJson).not.toHaveBeenCalled();
  });

  test('sends the official trimmed role-specific update body', async () => {
    requestJson.mockResolvedValue({ data: accountPayload(), response: ok() });

    await updateAccount({
      email: ' customer@example.com ',
      expectedRole: 'customer',
      phone: ' 555-111-1111 ',
    });

    expect(JSON.parse(requestJson.mock.calls[0][1].body)).toEqual({
      account_email: 'customer@example.com',
      account_phone: '555-111-1111',
      account_type: 'customer',
    });
  });

  test.each([
    [400, 'invalid'],
    [401, 'unauthorized'],
    [404, 'notFound'],
    [503, 'service'],
  ])('classifies account HTTP %i as %s', async (status, code) => {
    requestJson.mockResolvedValue({ data: null, response: failed(status) });
    await expect(fetchAccount({ expectedRole: 'customer' })).rejects.toMatchObject({ code, status });
  });
});

describe('restaurant service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSession.mockResolvedValue({ accessToken: 'token' });
  });

  test('builds filters and normalizes unique restaurant rows', async () => {
    requestJson.mockResolvedValue({
      data: success([{ id: '3', name: ' Bistro ', price_range: '2', rating: '4' }]),
      response: ok(),
    });

    await expect(fetchRestaurants({ priceRange: 2, rating: 4 })).resolves.toEqual([
      { id: 3, name: 'Bistro', priceRange: 2, rating: 4 },
    ]);
    expect(requestJson.mock.calls[0][0]).toBe('/api/restaurants?rating=4&price_range=2');
  });

  test.each([
    [{ priceRange: 0, rating: null }],
    [{ priceRange: null, rating: 6 }],
    [{ priceRange: '2', rating: null }],
  ])('rejects invalid filters before requesting %#', async (filters) => {
    await expect(fetchRestaurants(filters)).rejects.toMatchObject({ code: 'filter' });
    expect(requestJson).not.toHaveBeenCalled();
  });

  test('rejects duplicate restaurant IDs', async () => {
    const row = { id: 3, name: 'Bistro', price_range: 2, rating: 4 };
    requestJson.mockResolvedValue({ data: success([row, row]), response: ok() });

    await expect(fetchRestaurants({ priceRange: null, rating: null })).rejects.toMatchObject({
      code: 'response',
    });
  });

  test('requires restaurant detail identity to match the selected route', async () => {
    requestJson.mockResolvedValue({
      data: success({ id: 4, name: 'Other', price_range: 1, rating: 0 }),
      response: ok(),
    });

    await expect(fetchRestaurantById({ restaurantId: 3 })).rejects.toMatchObject({
      code: 'response',
    });
  });

  test('classifies a missing restaurant separately', async () => {
    requestJson.mockResolvedValue({ data: null, response: failed(404) });
    await expect(fetchRestaurantById({ restaurantId: 3 })).rejects.toMatchObject({
      code: 'unavailable',
      status: 404,
    });
  });
});

describe('product service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSession.mockResolvedValue({ accessToken: 'token' });
  });

  test('normalizes products owned by the selected restaurant', async () => {
    requestJson.mockResolvedValue({
      data: success([
        { cost: '9', description: ' Fresh ', id: '5', name: ' Meal ', restaurant_id: '3' },
      ]),
      response: ok(),
    });

    await expect(fetchProductsForRestaurant({ restaurantId: 3 })).resolves.toEqual([
      { cost: 9, description: 'Fresh', id: 5, name: 'Meal', restaurantId: 3 },
    ]);
    expect(requestJson.mock.calls[0][0]).toBe('/api/products?restaurant=3');
  });

  test.each([
    [{ cost: 9, description: null, id: 5, name: 'Meal', restaurant_id: 4 }],
    [{ cost: -1, description: null, id: 5, name: 'Meal', restaurant_id: 3 }],
    [{ cost: 9, description: 12, id: 5, name: 'Meal', restaurant_id: 3 }],
  ])('rejects malformed or cross-restaurant product %#', async (row) => {
    requestJson.mockResolvedValue({ data: success([row]), response: ok() });
    await expect(fetchProductsForRestaurant({ restaurantId: 3 })).rejects.toMatchObject({
      code: 'response',
    });
  });

  test('rejects duplicate product IDs and invalid restaurant input', async () => {
    const row = { cost: 9, description: null, id: 5, name: 'Meal', restaurant_id: 3 };
    requestJson.mockResolvedValue({ data: success([row, row]), response: ok() });

    await expect(fetchProductsForRestaurant({ restaurantId: 3 })).rejects.toMatchObject({
      code: 'response',
    });
    await expect(fetchProductsForRestaurant({ restaurantId: 0 })).rejects.toMatchObject({
      code: 'response',
    });
  });
});
