/**
 * File: orderTotals.test.js
 * Purpose: Verifies safe line multiplication and order-total accumulation boundaries.
 * Contents:
 * 1. Line-total cases
 * 2. Order-total cases
 */

import { calculateLineTotal, calculateOrderTotal } from '../orderTotals';

describe('calculateLineTotal', () => {
  test('calculates a normal line and permits a zero-cost product', () => {
    expect(calculateLineTotal(12, 3)).toBe(36);
    expect(calculateLineTotal(0, 4)).toBe(0);
  });

  test('preserves the maximum safe boundary', () => {
    expect(calculateLineTotal(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER);
  });

  test.each([
    [-1, 1],
    [1, 0],
    [1, -1],
    [1.5, 1],
    [Number.MAX_SAFE_INTEGER, 2],
  ])('rejects invalid or unsafe line %p × %p', (cost, quantity) => {
    expect(calculateLineTotal(cost, quantity)).toBeNull();
  });
});

describe('calculateOrderTotal', () => {
  test('retains zero for an empty selection', () => {
    expect(calculateOrderTotal([])).toBe(0);
  });

  test('adds a normal multi-product selection', () => {
    expect(
      calculateOrderTotal([
        { cost: 12, quantity: 2 },
        { cost: 5, quantity: 3 },
      ]),
    ).toBe(39);
  });

  test('rejects invalid input, an unsafe line, or an unsafe accumulated total', () => {
    expect(calculateOrderTotal(null)).toBeNull();
    expect(calculateOrderTotal([{ cost: Number.MAX_SAFE_INTEGER, quantity: 2 }])).toBeNull();
    expect(
      calculateOrderTotal([
        { cost: Number.MAX_SAFE_INTEGER, quantity: 1 },
        { cost: 1, quantity: 1 },
      ]),
    ).toBeNull();
  });
});
