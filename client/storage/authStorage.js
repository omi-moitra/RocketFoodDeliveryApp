/**
 * File: authStorage.js
 * Purpose: Persists and validates the role-capable session values that control protected navigation.
 * Contents:
 * 1. storage keys
 * 2. role constants
 * 3. value normalization
 * 4. session reads
 * 5. writes
 * 6. role selection
 * 7. clearing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { isPositiveSafeInteger } from '../utils/validation';

// Central keys prevent screens and services from silently disagreeing about stored field names.
export const AUTH_STORAGE_KEYS = Object.freeze({
  accessToken: 'rocketFood.accessToken',
  activeRole: 'rocketFood.activeRole',
  courierId: 'rocketFood.courierId',
  customerId: 'rocketFood.customerId',
  userId: 'rocketFood.userId',
});

// The two supported active roles; no other role name is ever accepted from storage or a caller.
export const ROLES = Object.freeze({
  courier: 'courier',
  customer: 'customer',
});

// The complete key list keeps cleanup and multi-read operations synchronized with the key map.
const ALL_AUTH_STORAGE_KEYS = Object.freeze(Object.values(AUTH_STORAGE_KEYS));

/**
 * Converts any nonblank stored value into a trimmed string, otherwise null.
 * Session readers and writers use it as the common base normalization rule.
 */
function normalizeStoredValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Converts a stored identifier into a positive numeric string, otherwise null.
 * All customer/courier/user ID reads and writes pass through this stricter rule.
 */
function normalizeStoredIdentifier(value) {
  const normalizedValue = normalizeStoredValue(value);

  if (
    !normalizedValue ||
    !/^\d+$/.test(normalizedValue) ||
    !isPositiveSafeInteger(Number(normalizedValue))
  ) {
    return null;
  }

  return normalizedValue;
}

/**
 * Accepts only the exact lowercase role names, rejecting any other stored string.
 * Session restoration uses it before trusting a persisted active role.
 */
function normalizeStoredRole(value) {
  const normalizedValue = normalizeStoredValue(value);

  return normalizedValue === ROLES.customer || normalizedValue === ROLES.courier
    ? normalizedValue
    : null;
}

/**
 * Derives the only valid active role for a single-role login; dual-role stays unselected.
 * saveAuthSession uses it so a customer-only or courier-only login routes without Account Selection.
 */
function deriveInitialActiveRole(customerId, courierId) {
  if (customerId && !courierId) {
    return ROLES.customer;
  }

  if (courierId && !customerId) {
    return ROLES.courier;
  }

  // Both roles present means the user must choose explicitly on Account Selection.
  return null;
}

// Sentinel marking a stored active role that contradicts the available role IDs.
const INVALID_SESSION = Symbol('invalidSession');

/**
 * Validates a restored active role against the available role IDs and pending-selection rules.
 * getStoredSession uses it to fail closed on any incoherent role/ID combination.
 */
function resolveRestoredActiveRole(storedActiveRole, customerId, courierId) {
  if (storedActiveRole === ROLES.customer) {
    return customerId ? ROLES.customer : INVALID_SESSION;
  }

  if (storedActiveRole === ROLES.courier) {
    return courierId ? ROLES.courier : INVALID_SESSION;
  }

  // No active role is valid only for a dual-role session still awaiting an explicit choice.
  if (customerId && courierId) {
    return null;
  }

  // A single-role record with no persisted active role is incomplete, not silently normalized.
  return INVALID_SESSION;
}

/**
 * Reconstructs a coherent role-aware session, or null when stored state is unusable.
 * Partial or corrupt values are cleared here so stale data cannot unlock a protected route.
 * AuthProvider calls it during startup route resolution.
 */
export async function getStoredSession() {
  const storedEntries = await AsyncStorage.multiGet(ALL_AUTH_STORAGE_KEYS);
  const storedValues = Object.fromEntries(storedEntries);
  const accessToken = normalizeStoredValue(storedValues[AUTH_STORAGE_KEYS.accessToken]);
  const userId = normalizeStoredIdentifier(storedValues[AUTH_STORAGE_KEYS.userId]);
  const customerId = normalizeStoredIdentifier(storedValues[AUTH_STORAGE_KEYS.customerId]);
  const courierId = normalizeStoredIdentifier(storedValues[AUTH_STORAGE_KEYS.courierId]);
  const storedActiveRole = normalizeStoredRole(storedValues[AUTH_STORAGE_KEYS.activeRole]);

  const activeRole = resolveRestoredActiveRole(storedActiveRole, customerId, courierId);

  // A usable session requires a token, a user ID, and at least one coherent role selection state.
  const isUsableSession = Boolean(accessToken && userId && (customerId || courierId)) && activeRole !== INVALID_SESSION;

  if (!isUsableSession) {
    // Clear any partial/corrupt remnants so a later read cannot resurrect an unsafe half-session.
    const hasAnyStoredValue = Object.values(storedValues).some((value) => normalizeStoredValue(value));

    if (hasAnyStoredValue) {
      await clearAuthSession().catch(() => undefined);
    }

    return null;
  }

  return {
    accessToken,
    activeRole,
    courierId,
    customerId,
    userId,
  };
}

/**
 * Validates and persists the authenticated values, then returns their normalized session shape.
 * AuthProvider calls it before allowing protected routes to render.
 */
export async function saveAuthSession({
  accessToken,
  userId = null,
  customerId = null,
  courierId = null,
}) {
  const normalizedAccessToken = normalizeStoredValue(String(accessToken ?? ''));
  const normalizedUserId = normalizeStoredIdentifier(String(userId ?? ''));
  const normalizedCustomerId = normalizeStoredIdentifier(String(customerId ?? ''));
  const normalizedCourierId = normalizeStoredIdentifier(String(courierId ?? ''));

  if (!normalizedAccessToken || !normalizedUserId) {
    throw new Error('A valid access token and user ID are required.');
  }

  if (!normalizedCustomerId && !normalizedCourierId) {
    throw new Error('At least one supported role ID is required.');
  }

  const activeRole = deriveInitialActiveRole(normalizedCustomerId, normalizedCourierId);

  const entries = [
    [AUTH_STORAGE_KEYS.accessToken, normalizedAccessToken],
    [AUTH_STORAGE_KEYS.userId, normalizedUserId],
  ];

  if (normalizedCustomerId) {
    entries.push([AUTH_STORAGE_KEYS.customerId, normalizedCustomerId]);
  }

  if (normalizedCourierId) {
    entries.push([AUTH_STORAGE_KEYS.courierId, normalizedCourierId]);
  }

  if (activeRole) {
    entries.push([AUTH_STORAGE_KEYS.activeRole, activeRole]);
  }

  // Clear every key first so a new login cannot inherit a previous user's role IDs or active role.
  await AsyncStorage.multiRemove(ALL_AUTH_STORAGE_KEYS);
  await AsyncStorage.multiSet(entries);

  return {
    accessToken: normalizedAccessToken,
    activeRole,
    courierId: normalizedCourierId,
    customerId: normalizedCustomerId,
    userId: normalizedUserId,
  };
}

/**
 * Persists an explicit dual-role choice only when the chosen role is available in the session.
 * AuthContext calls it from Account Selection; route screens never write storage directly.
 */
export async function saveRoleSelection(role) {
  if (role !== ROLES.customer && role !== ROLES.courier) {
    throw new Error('An active role must be customer or courier.');
  }

  const session = await getStoredSession();

  if (!session) {
    throw new Error('No usable session is available for role selection.');
  }

  if (role === ROLES.customer && !session.customerId) {
    throw new Error('This session has no customer role to select.');
  }

  if (role === ROLES.courier && !session.courierId) {
    throw new Error('This session has no courier role to select.');
  }

  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.activeRole, role);

  return { ...session, activeRole: role };
}

/**
 * Removes every authentication key as one shared logout/session-expiry operation.
 * AuthProvider uses it for logout, unreadable storage, and partial-write cleanup.
 */
export async function clearAuthSession() {
  await AsyncStorage.multiRemove(ALL_AUTH_STORAGE_KEYS);
}
