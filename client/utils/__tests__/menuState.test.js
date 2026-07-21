/**
 * File: menuState.test.js
 * Purpose: Verifies Restaurant Menu route normalization and quantity-state safety.
 * Contents:
 * 1. Restaurant route cases
 * 2. Quantity reconciliation cases
 * 3. Quantity transition cases
 */

import {
  changeProductQuantity,
  normalizeRestaurantId,
  reconcileQuantities,
} from '../menuState';

describe('normalizeRestaurantId', () => {
  test.each([
    ['1', 1],
    [' 22 ', 22],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ])('normalizes route value %p', (routeValue, expected) => {
    expect(normalizeRestaurantId(routeValue)).toBe(expected);
  });

  test.each([undefined, null, '', '0', '-1', '1.5', 'abc', ['1'], Number.MAX_SAFE_INTEGER + 1])(
    'rejects unsafe route value %p',
    (routeValue) => {
      expect(normalizeRestaurantId(routeValue)).toBeNull();
    },
  );
});

describe('reconcileQuantities', () => {
  test('preserves valid current products, initializes new products, and drops removed products', () => {
    expect(
      reconcileQuantities(
        [{ id: 1 }, { id: 2 }],
        { 1: 3, 7: 9 },
      ),
    ).toEqual({ 1: 3, 2: 0 });
  });

  test('replaces invalid stored quantities with zero', () => {
    expect(reconcileQuantities([{ id: 1 }, { id: 2 }], { 1: -1, 2: 1.5 })).toEqual({
      1: 0,
      2: 0,
    });
  });
});

describe('changeProductQuantity', () => {
  const products = [
    { cost: 5, id: 1 },
    { cost: 0, id: 2 },
  ];

  test('increments and floors a quantity at zero without mutating the prior map', () => {
    const current = { 1: 0, 2: 0 };
    const incremented = changeProductQuantity(current, products, 1, 1);

    expect(incremented).toEqual({ 1: 1, 2: 0 });
    expect(current).toEqual({ 1: 0, 2: 0 });
    expect(changeProductQuantity(current, products, 1, -1)).toEqual(current);
  });

  test('caps paid and zero-cost products at their safe maximum', () => {
    const paidMaximum = Math.floor(Number.MAX_SAFE_INTEGER / 5);

    expect(changeProductQuantity({ 1: paidMaximum }, products, 1, 1)[1]).toBe(paidMaximum);
    expect(
      changeProductQuantity({ 2: Number.MAX_SAFE_INTEGER }, products, 2, 1)[2],
    ).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('returns the same map for an unknown product or unsupported change', () => {
    const current = { 1: 2 };

    expect(changeProductQuantity(current, products, 99, 1)).toBe(current);
    expect(changeProductQuantity(current, products, 1, 2)).toBe(current);
  });
});
