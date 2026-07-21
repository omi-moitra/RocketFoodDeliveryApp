/**
 * File: validation.test.js
 * Purpose: Verifies shared identifier, cost, email, and phone validation boundaries.
 * Contents:
 * 1. Safe-integer validation cases
 * 2. Email validation cases
 * 3. Phone validation cases
 */

import {
  isNonNegativeSafeInteger,
  isPositiveSafeInteger,
  isValidEmail,
  isValidPhone,
} from '../validation';

describe('safe integer validation', () => {
  test.each([1, Number.MAX_SAFE_INTEGER])('accepts positive safe integer %p', (value) => {
    expect(isPositiveSafeInteger(value)).toBe(true);
  });

  test.each([0, -1, 1.5, '1', Number.MAX_SAFE_INTEGER + 1, Infinity, null])(
    'rejects non-positive or unsafe identifier %p',
    (value) => {
      expect(isPositiveSafeInteger(value)).toBe(false);
    },
  );

  test.each([0, 1, Number.MAX_SAFE_INTEGER])('accepts non-negative safe cost %p', (value) => {
    expect(isNonNegativeSafeInteger(value)).toBe(true);
  });

  test.each([-1, 1.5, '0', Number.MAX_SAFE_INTEGER + 1, NaN])(
    'rejects invalid cost %p',
    (value) => {
      expect(isNonNegativeSafeInteger(value)).toBe(false);
    },
  );
});

describe('account field validation', () => {
  test.each(['customer@example.com', ' courier+qa@example.co.uk '])(
    'accepts valid email %p',
    (value) => {
      expect(isValidEmail(value)).toBe(true);
    },
  );

  test.each(['', 'missing-at.example.com', 'missing-domain@', null])(
    'rejects invalid email %p',
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );

  test.each(['555-123-4567', ' +1 (555) 123-4567 ', '+44 20 7946 0958'])(
    'accepts valid phone %p',
    (value) => {
      expect(isValidPhone(value)).toBe(true);
    },
  );

  test.each(['', '123456', '1234567890123456', '555\n1234', null])(
    'rejects invalid phone %p',
    (value) => {
      expect(isValidPhone(value)).toBe(false);
    },
  );
});
