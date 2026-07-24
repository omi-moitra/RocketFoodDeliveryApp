/**
 * File: authStorage.test.js
 * Purpose: Verifies persisted session coherence, role selection, and cleanup rules.
 * Contents:
 * 1. Session restoration
 * 2. Session persistence
 * 3. Role selection and clearing
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import mockAsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUTH_STORAGE_KEYS,
  clearAuthSession,
  getStoredSession,
  ROLES,
  saveAuthSession,
  saveRoleSelection,
} from '../authStorage';

const allKeys = Object.values(AUTH_STORAGE_KEYS);

function storedEntries(values = {}) {
  return allKeys.map((key) => [key, values[key] ?? null]);
}

function customerValues(overrides = {}) {
  return {
    [AUTH_STORAGE_KEYS.accessToken]: ' token ',
    [AUTH_STORAGE_KEYS.activeRole]: ROLES.customer,
    [AUTH_STORAGE_KEYS.customerId]: '12',
    [AUTH_STORAGE_KEYS.userId]: '7',
    ...overrides,
  };
}

describe('authentication storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.multiGet.mockResolvedValue(storedEntries());
    mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
    mockAsyncStorage.multiSet.mockResolvedValue(undefined);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  test('restores a coherent customer session from one storage snapshot', async () => {
    mockAsyncStorage.multiGet.mockResolvedValue(storedEntries(customerValues()));

    await expect(getStoredSession()).resolves.toEqual({
      accessToken: 'token',
      activeRole: ROLES.customer,
      courierId: null,
      customerId: '12',
      userId: '7',
    });
    expect(mockAsyncStorage.multiGet).toHaveBeenCalledWith(allKeys);
    expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
  });

  test('restores a dual-role session awaiting explicit selection', async () => {
    mockAsyncStorage.multiGet.mockResolvedValue(
      storedEntries(
        customerValues({
          [AUTH_STORAGE_KEYS.activeRole]: null,
          [AUTH_STORAGE_KEYS.courierId]: '22',
        }),
      ),
    );

    await expect(getStoredSession()).resolves.toMatchObject({
      activeRole: null,
      courierId: '22',
      customerId: '12',
    });
  });

  test.each([
    customerValues({ [AUTH_STORAGE_KEYS.accessToken]: null }),
    customerValues({ [AUTH_STORAGE_KEYS.userId]: '0' }),
    customerValues({ [AUTH_STORAGE_KEYS.customerId]: '12x' }),
    customerValues({ [AUTH_STORAGE_KEYS.activeRole]: ROLES.courier }),
    customerValues({ [AUTH_STORAGE_KEYS.activeRole]: null }),
  ])('fails closed and clears corrupt stored state %#', async (values) => {
    mockAsyncStorage.multiGet.mockResolvedValue(storedEntries(values));

    await expect(getStoredSession()).resolves.toBeNull();
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(allKeys);
  });

  test('does not write when storage is already empty', async () => {
    await expect(getStoredSession()).resolves.toBeNull();
    expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
  });

  test.each([
    [{ accessToken: 'token', customerId: 12, userId: 7 }, ROLES.customer],
    [{ accessToken: 'token', courierId: 22, userId: 7 }, ROLES.courier],
    [{ accessToken: 'token', courierId: 22, customerId: 12, userId: 7 }, null],
  ])('persists a normalized role-capable session %#', async (input, activeRole) => {
    const session = await saveAuthSession(input);

    expect(session).toMatchObject({ activeRole, accessToken: 'token', userId: '7' });
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(allKeys);
    expect(mockAsyncStorage.multiSet).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(mockAsyncStorage.multiSet.mock.calls[0][0])).toMatchObject({
      [AUTH_STORAGE_KEYS.accessToken]: 'token',
      [AUTH_STORAGE_KEYS.userId]: '7',
      ...(activeRole ? { [AUTH_STORAGE_KEYS.activeRole]: activeRole } : {}),
    });
  });

  test.each([
    [{ accessToken: '', customerId: 12, userId: 7 }, 'token'],
    [{ accessToken: 'token', customerId: 12, userId: 0 }, 'token'],
    [{ accessToken: 'token', userId: 7 }, 'role'],
  ])('rejects unusable session input without touching storage %#', async (input, messagePart) => {
    await expect(saveAuthSession(input)).rejects.toThrow(messagePart);
    expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
    expect(mockAsyncStorage.multiSet).not.toHaveBeenCalled();
  });

  test('persists an available role selection and returns the updated session', async () => {
    mockAsyncStorage.multiGet.mockResolvedValue(
      storedEntries(
        customerValues({
          [AUTH_STORAGE_KEYS.activeRole]: null,
          [AUTH_STORAGE_KEYS.courierId]: '22',
        }),
      ),
    );

    await expect(saveRoleSelection(ROLES.courier)).resolves.toMatchObject({
      activeRole: ROLES.courier,
      courierId: '22',
    });
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      AUTH_STORAGE_KEYS.activeRole,
      ROLES.courier,
    );
  });

  test('rejects unsupported and unavailable role selections without writing', async () => {
    await expect(saveRoleSelection('admin')).rejects.toThrow('customer or courier');

    mockAsyncStorage.multiGet.mockResolvedValue(storedEntries(customerValues()));
    await expect(saveRoleSelection(ROLES.courier)).rejects.toThrow('no courier role');
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('clears the complete authentication key set', async () => {
    await clearAuthSession();
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(allKeys);
  });
});
