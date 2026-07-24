/**
 * File: orderServices.test.js
 * Purpose: Verifies customer order creation/history and courier delivery transition contracts.
 * Contents:
 * 1. Shared order-product normalization
 * 2. Customer creation and history
 * 3. Courier retrieval and status mutations
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
    requireSuccessList,
    requireSuccessObject,
  };
});

import { DELIVERY_STATUS } from '../../constants/deliveryStatus';
import { getStoredSession } from '../../storage/authStorage';
import { requestJson } from '../apiClient';
import {
  acceptDelivery,
  assignActiveCourier,
  fetchCourierDeliveries,
  markDelivered,
} from '../orders/courierDeliveries';
import { createOrder } from '../orders/createOrder';
import { fetchCustomerOrders } from '../orders/customerOrders';
import { normalizeBaseOrderProduct } from '../orders/orderShared';

const ok = (status = 200) => ({ ok: true, status });

function success(data) {
  return { data, message: 'Success' };
}

function customerOrder(overrides = {}) {
  return {
    courier_id: null,
    courier_name: null,
    created_on: '2026-07-15T13:01:38.705432',
    id: 40,
    products: [{ product_id: 5, product_name: 'Meal', quantity: 2, total_cost: 18 }],
    restaurant_name: 'Bistro',
    status: 'pending',
    total_cost: 18,
    ...overrides,
  };
}

function delivery(overrides = {}) {
  return {
    courier_id: null,
    created_on: '2026-07-15T13:01:38.705432',
    customer_address: '1 Main Street',
    customer_id: 12,
    id: 40,
    products: [
      { product_id: 5, product_name: 'Meal', quantity: 2, total_cost: 18, unit_cost: 9 },
    ],
    restaurant_id: 3,
    restaurant_name: 'Bistro',
    restaurant_rating: 4,
    status: 'pending',
    total_cost: 18,
    ...overrides,
  };
}

const customerSession = {
  accessToken: 'token',
  activeRole: 'customer',
  customerId: '12',
  userId: '7',
};

const courierSession = {
  accessToken: 'token',
  activeRole: 'courier',
  courierId: '22',
  userId: '7',
};

describe('shared order product normalization', () => {
  test('maps a valid backend line to the shared client shape', () => {
    expect(
      normalizeBaseOrderProduct({
        product_id: '5',
        product_name: ' Meal ',
        quantity: '2',
        total_cost: '18',
      }),
    ).toEqual({ productId: 5, productName: 'Meal', quantity: 2, totalCost: 18 });
  });

  test.each([
    null,
    [],
    { product_id: 0, product_name: 'Meal', quantity: 1, total_cost: 9 },
    { product_id: 5, product_name: '', quantity: 1, total_cost: 9 },
    { product_id: 5, product_name: 'Meal', quantity: 0, total_cost: 9 },
    { product_id: 5, product_name: 'Meal', quantity: 1, total_cost: -1 },
  ])('rejects malformed shared line %#', (value) => {
    expect(normalizeBaseOrderProduct(value)).toBeNull();
  });
});

describe('createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStoredSession.mockResolvedValue(customerSession);
  });

  test('sends the exact notification and product contract and returns the created ID', async () => {
    requestJson.mockResolvedValue({ data: success({ id: '90' }), response: ok(201) });

    await expect(
      createOrder({
        restaurantId: 3,
        selectedProducts: [{ id: 5, quantity: 2 }],
        sendEmail: true,
        sendSMS: 'true',
      }),
    ).resolves.toEqual({ id: 90 });

    expect(requestJson.mock.calls[0][0]).toBe('/api/orders');
    expect(JSON.parse(requestJson.mock.calls[0][1].body)).toEqual({
      customer_id: 12,
      products: [{ id: 5, quantity: 2 }],
      restaurant_id: 3,
      sendEmail: true,
      sendSMS: false,
    });
  });

  test.each([
    { restaurantId: 0, selectedProducts: [{ id: 5, quantity: 1 }] },
    { restaurantId: 3, selectedProducts: [] },
    { restaurantId: 3, selectedProducts: [{ id: 5, quantity: 0 }] },
  ])('rejects invalid order input before requesting %#', async (input) => {
    await expect(createOrder(input)).rejects.toMatchObject({ code: 'invalid' });
    expect(requestJson).not.toHaveBeenCalled();
  });

  test('rejects missing customer session, non-201 success, and malformed created ID', async () => {
    getStoredSession.mockResolvedValueOnce(null);
    await expect(createOrder({ restaurantId: 3, selectedProducts: [{ id: 5, quantity: 1 }] })).rejects.toMatchObject({ code: 'unauthorized' });

    requestJson.mockResolvedValueOnce({ data: success({ id: 90 }), response: ok(200) });
    await expect(createOrder({ restaurantId: 3, selectedProducts: [{ id: 5, quantity: 1 }] })).rejects.toMatchObject({ code: 'response', status: 200 });

    requestJson.mockResolvedValueOnce({ data: success({ id: 0 }), response: ok(201) });
    await expect(createOrder({ restaurantId: 3, selectedProducts: [{ id: 5, quantity: 1 }] })).rejects.toMatchObject({ code: 'response' });
  });
});

describe('fetchCustomerOrders', () => {
  let warning;

  beforeEach(() => {
    jest.clearAllMocks();
    warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    getStoredSession.mockResolvedValue(customerSession);
  });

  afterEach(() => warning.mockRestore());

  test('normalizes valid history and skips malformed or duplicate rows once', async () => {
    requestJson.mockResolvedValue({
      data: success([customerOrder(), customerOrder(), customerOrder({ id: 0 })]),
      response: ok(),
    });

    await expect(fetchCustomerOrders()).resolves.toEqual([
      {
        courierId: null,
        courierName: null,
        createdOn: '2026-07-15T13:01:38.705432',
        id: 40,
        products: [{ productId: 5, productName: 'Meal', quantity: 2, totalCost: 18 }],
        restaurantName: 'Bistro',
        status: 'pending',
        totalCost: 18,
      },
    ]);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0][0]).toContain('skipped 2');
    expect(requestJson.mock.calls[0][0]).toBe('/api/orders?type=customer&id=12');
  });

  test('requires a usable customer ID', async () => {
    getStoredSession.mockResolvedValue({ ...customerSession, customerId: null });
    await expect(fetchCustomerOrders()).rejects.toMatchObject({ code: 'unauthorized' });
    expect(requestJson).not.toHaveBeenCalled();
  });
});

describe('courier delivery workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStoredSession.mockResolvedValue(courierSession);
  });

  test('merges pending and assigned rows, preferring authoritative assigned data', async () => {
    requestJson
      .mockResolvedValueOnce({
        data: success([delivery(), delivery({ id: 41 }), delivery({ id: 42, status: 'delivered', courier_id: 99 })]),
        response: ok(),
      })
      .mockResolvedValueOnce({
        data: success([
          delivery({ id: 40, status: 'in progress', courier_id: 22 }),
          delivery({ id: 43, status: 'delivered', courier_id: 22 }),
        ]),
        response: ok(),
      });

    const rows = await fetchCourierDeliveries();

    expect(rows.map((row) => row.id)).toEqual([40, 41, 43]);
    expect(rows[0]).toMatchObject({ courierId: 22, status: DELIVERY_STATUS.IN_PROGRESS });
    expect(requestJson.mock.calls.map(([path]) => path)).toEqual([
      '/api/orders/pending',
      '/api/orders?type=courier&id=22',
    ]);
  });

  test('accepts a delivery by changing status before assigning the courier', async () => {
    requestJson
      .mockResolvedValueOnce({
        data: success(delivery({ status: 'in progress' })),
        response: ok(),
      })
      .mockResolvedValueOnce({
        data: success(delivery({ status: 'in progress', courier_id: 22 })),
        response: ok(),
      });

    await expect(
      acceptDelivery({
        delivery: {
          courierId: null,
          customerId: 12,
          id: 40,
          restaurantId: 3,
          restaurantRating: 4,
          status: DELIVERY_STATUS.PENDING,
        },
      }),
    ).resolves.toMatchObject({ courierId: 22, status: DELIVERY_STATUS.IN_PROGRESS });

    expect(requestJson.mock.calls.map(([path]) => path)).toEqual([
      '/api/orders/40',
      '/api/order/40/courier',
    ]);
    expect(JSON.parse(requestJson.mock.calls[0][1].body).order_status_id).toBe(2);
    expect(JSON.parse(requestJson.mock.calls[1][1].body)).toEqual({ courier_id: 22 });
  });

  test('reports a recoverable partial result when assignment fails after status succeeds', async () => {
    requestJson
      .mockResolvedValueOnce({
        data: success(delivery({ status: 'in progress' })),
        response: ok(),
      })
      .mockResolvedValueOnce({ data: null, response: { ok: false, status: 409 } });

    await expect(
      acceptDelivery({
        delivery: {
          customerId: 12,
          id: 40,
          restaurantId: 3,
          restaurantRating: null,
          status: DELIVERY_STATUS.PENDING,
        },
      }),
    ).rejects.toMatchObject({ code: 'partial', orderId: 40, status: 409 });
  });

  test('recovers assignment for a valid order ID', async () => {
    requestJson.mockResolvedValue({
      data: success(delivery({ status: 'in progress', courier_id: 22 })),
      response: ok(),
    });

    await assignActiveCourier({ orderId: '40' });
    expect(requestJson.mock.calls[0][0]).toBe('/api/order/40/courier');
  });

  test('delivers only an in-progress order owned by the active courier', async () => {
    const inProgress = {
      courierId: 22,
      customerId: 12,
      id: 40,
      restaurantId: 3,
      restaurantRating: 4,
      status: DELIVERY_STATUS.IN_PROGRESS,
    };
    requestJson.mockResolvedValue({
      data: success(delivery({ status: 'delivered', courier_id: 22 })),
      response: ok(),
    });

    await expect(markDelivered({ delivery: inProgress })).resolves.toMatchObject({
      status: DELIVERY_STATUS.DELIVERED,
    });
    expect(JSON.parse(requestJson.mock.calls[0][1].body).order_status_id).toBe(3);

    await expect(markDelivered({ delivery: { ...inProgress, courierId: 99 } })).rejects.toMatchObject({ code: 'invalid' });
  });

  test('requires an active courier session and valid mutation inputs', async () => {
    getStoredSession.mockResolvedValueOnce({ ...courierSession, activeRole: 'customer' });
    await expect(fetchCourierDeliveries()).rejects.toMatchObject({ code: 'unauthorized' });

    await expect(assignActiveCourier({ orderId: 0 })).rejects.toMatchObject({ code: 'invalid' });
    await expect(acceptDelivery({ delivery: null })).rejects.toMatchObject({ code: 'invalid' });
  });
});
