/**
 * File: authStorage.js
 * Purpose: Persists and validates the customer values that control protected navigation.
 * Contents: storage keys, session reads, session writes, session clearing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Central keys prevent screens and services from silently disagreeing about stored field names.
export const AUTH_STORAGE_KEYS = Object.freeze({
  accessToken: 'rocketFood.accessToken',
  customerId: 'rocketFood.customerId',
  userId: 'rocketFood.userId',
});

// The complete key list keeps cleanup and multi-read operations synchronized with the key map.
const ALL_AUTH_STORAGE_KEYS = Object.freeze(Object.values(AUTH_STORAGE_KEYS));

/**
 * Converts any nonblank stored value into a trimmed string, otherwise null.
 * Session readers and writers use it as the common base normalization rule.
 * Read aloud: “normalize stored value.”
 */
function normalizeStoredValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Converts a stored identifier into a positive numeric string, otherwise null.
 * All customer/user ID reads and writes pass through this stricter rule.
 * Read aloud: “normalize stored identifier.”
 */
function normalizeStoredIdentifier(value) {
  const normalizedValue = normalizeStoredValue(value);

  if (!normalizedValue || !/^\d+$/.test(normalizedValue) || Number(normalizedValue) <= 0) {
    return null;
  }

  return normalizedValue;
}

/**
 * Reconstructs a usable session only when both the token and customer ID are present.
 * AuthProvider calls it during startup route resolution.
 * Read aloud: “get stored session.”
 */
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

/**
 * Validates and persists the authenticated values, then returns their normalized session shape.
 * AuthProvider calls it before allowing protected routes to render.
 * Read aloud: “save auth session,” where “auth” means authentication.
 */
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

/**
 * Removes every authentication key as one shared logout/session-expiry operation.
 * AuthProvider uses it for logout, unreadable storage, and partial-write cleanup.
 * Read aloud: “clear auth session,” where “auth” means authentication.
 */
export async function clearAuthSession() {
  await AsyncStorage.multiRemove(ALL_AUTH_STORAGE_KEYS);
}
