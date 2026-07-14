/**
 * File: authStorage.js
 * Purpose: Persists and validates the customer values that control protected navigation.
 * Contents: storage keys, session reads, session writes, session clearing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEYS = Object.freeze({
  accessToken: 'rocketFood.accessToken',
  customerId: 'rocketFood.customerId',
  userId: 'rocketFood.userId',
});

const ALL_AUTH_STORAGE_KEYS = Object.freeze(Object.values(AUTH_STORAGE_KEYS));

function normalizeStoredValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeStoredIdentifier(value) {
  const normalizedValue = normalizeStoredValue(value);

  if (!normalizedValue || !/^\d+$/.test(normalizedValue) || Number(normalizedValue) <= 0) {
    return null;
  }

  return normalizedValue;
}

export async function getStoredSession() {
  const storedEntries = await AsyncStorage.multiGet(ALL_AUTH_STORAGE_KEYS);
  const storedValues = Object.fromEntries(storedEntries);
  const accessToken = normalizeStoredValue(storedValues[AUTH_STORAGE_KEYS.accessToken]);
  const customerId = normalizeStoredIdentifier(storedValues[AUTH_STORAGE_KEYS.customerId]);

  // Both values are required because authenticated API calls and customer orders need them.
  if (!accessToken || !customerId) {
    return null;
  }

  return {
    accessToken,
    customerId,
    userId: normalizeStoredIdentifier(storedValues[AUTH_STORAGE_KEYS.userId]),
  };
}

export async function saveAuthSession({ accessToken, customerId, userId = null }) {
  const normalizedAccessToken = normalizeStoredValue(String(accessToken ?? ''));
  const normalizedCustomerId = normalizeStoredIdentifier(String(customerId ?? ''));

  if (!normalizedAccessToken || !normalizedCustomerId) {
    throw new Error('A valid access token and customer ID are required.');
  }

  const entries = [
    [AUTH_STORAGE_KEYS.accessToken, normalizedAccessToken],
    [AUTH_STORAGE_KEYS.customerId, normalizedCustomerId],
  ];
  const normalizedUserId = normalizeStoredIdentifier(String(userId ?? ''));

  if (normalizedUserId) {
    entries.push([AUTH_STORAGE_KEYS.userId, normalizedUserId]);
  } else {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userId);
  }

  await AsyncStorage.multiSet(entries);

  return {
    accessToken: normalizedAccessToken,
    customerId: normalizedCustomerId,
    userId: normalizedUserId,
  };
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove(ALL_AUTH_STORAGE_KEYS);
}
