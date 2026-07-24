/**
 * File: formatting.test.js
 * Purpose: Verifies stable currency, date, restaurant-label, and delivery-status presentation rules.
 * Contents:
 * 1. Currency and date formatting
 * 2. Restaurant labels
 * 3. Delivery-status metadata
 */

import {
  BACKEND_STATUS_TO_INTERNAL,
  DELIVERY_STATUS,
  DELIVERY_STATUS_ID,
  DELIVERY_STATUS_LABELS,
} from '../../constants/deliveryStatus';
import { formatProductCost } from '../../constants/currency';
import { formatOrderDate } from '../orderFormatting';
import { getPriceRangeLabel, getRatingLabel } from '../restaurantLabels';

describe('currency formatting', () => {
  let warning;

  beforeEach(() => {
    warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warning.mockRestore());

  test.each([
    [0, '$0.00'],
    [9, '$9.00'],
    [Number.MAX_SAFE_INTEGER, '$9,007,199,254,740,991.00'],
  ])('formats whole-dollar cost %p', (cost, expected) => {
    expect(formatProductCost(cost)).toBe(expected);
  });

  test.each([-1, 1.5, '9', Number.MAX_SAFE_INTEGER + 1, NaN])(
    'returns a safe placeholder for invalid cost %p',
    (cost) => {
      expect(formatProductCost(cost)).toBe('—');
    },
  );
});

describe('date and restaurant labels', () => {
  test('formats backend microseconds using the shared long-date format', () => {
    expect(formatOrderDate('2026-07-15T13:01:38.705432Z')).toBe('July 15, 2026');
  });

  test.each([null, '', 'not-a-date'])('returns blank for unusable date %p', (value) => {
    expect(formatOrderDate(value)).toBe('');
  });

  test.each([
    [1, '$'],
    [2, '$$'],
    [3, '$$$'],
  ])('formats price range %i', (value, expected) => {
    expect(getPriceRangeLabel(value)).toBe(expected);
  });

  test('distinguishes unrated restaurants from rated restaurants', () => {
    expect(getRatingLabel(0)).toBe('Not yet rated');
    expect(getRatingLabel(4)).toBe('★★★★');
  });
});

describe('delivery status metadata', () => {
  test('keeps tokens, labels, backend spellings, and persisted IDs aligned', () => {
    expect(DELIVERY_STATUS_LABELS[DELIVERY_STATUS.PENDING]).toBe('PENDING');
    expect(DELIVERY_STATUS_LABELS[DELIVERY_STATUS.IN_PROGRESS]).toBe('IN PROGRESS');
    expect(BACKEND_STATUS_TO_INTERNAL['in progress']).toBe(DELIVERY_STATUS.IN_PROGRESS);
    expect(DELIVERY_STATUS_ID[DELIVERY_STATUS.PENDING]).toBe(1);
    expect(DELIVERY_STATUS_ID[DELIVERY_STATUS.IN_PROGRESS]).toBe(2);
    expect(DELIVERY_STATUS_ID[DELIVERY_STATUS.DELIVERED]).toBe(3);
  });

  test('exports immutable status maps', () => {
    expect(Object.isFrozen(DELIVERY_STATUS)).toBe(true);
    expect(Object.isFrozen(DELIVERY_STATUS_LABELS)).toBe(true);
    expect(Object.isFrozen(BACKEND_STATUS_TO_INTERNAL)).toBe(true);
    expect(Object.isFrozen(DELIVERY_STATUS_ID)).toBe(true);
  });
});
