/**
 * File: accountService.js
 * Purpose: Owns the protected account retrieval/update requests for the shared Account screen.
 * Contents:
 * 1. Account error messages
 * 2. Session/identity resolution and response normalization
 * 3. Account retrieval (GET)
 * 4. Account update (POST, official body shape)
 */

import { getStoredSession, ROLES } from '../storage/authStorage';
import { isPositiveSafeInteger, isValidEmail, isValidPhone } from '../utils/validation';
import { ApiRequestError, requestJson } from './apiClient';

// User-safe classification messages; raw server details and tokens never reach the interface.
export const ACCOUNT_ERROR_MESSAGES = Object.freeze({
  invalid: 'Please check the email and phone, then try again.',
  notFound: 'Your account details could not be found. Please try again.',
  response: 'The account service returned an unexpected response. Please try again.',
  service: 'The account service is unavailable right now. Please try again.',
  token: 'Your session has expired. Please log in again.',
});

/**
 * Reads a validated account session for the expected role, or throws the shared unauthorized error.
 * Returns the session plus the resolved `userId` (path scope) and matching `roleId` (ownership).
 * The account path always uses `userId`; the role ID only validates nested ownership.
 * Read aloud: “require account session.”
 */
async function requireAccountSession(expectedRole) {
  const session = await getStoredSession();
  const role = session?.activeRole;
  const userId = Number(session?.userId);
  const roleId = Number(role === ROLES.customer ? session?.customerId : session?.courierId);

  const isUsable =
    Boolean(session) &&
    (role === ROLES.customer || role === ROLES.courier) &&
    role === expectedRole &&
    isPositiveSafeInteger(userId) &&
    isPositiveSafeInteger(roleId);

  if (!isUsable) {
    throw new ApiRequestError('unauthorized', ACCOUNT_ERROR_MESSAGES.token, 401);
  }

  return { role, roleId, session, userId };
}

/**
 * Classifies a non-2xx account response into the shared error codes, or returns for success.
 * Read aloud: “throw for account failure.”
 */
function throwForAccountFailure(response) {
  if (response.status === 401 || response.status === 403) {
    throw new ApiRequestError('unauthorized', ACCOUNT_ERROR_MESSAGES.token, response.status);
  }

  if (response.status === 404) {
    throw new ApiRequestError('notFound', ACCOUNT_ERROR_MESSAGES.notFound, response.status);
  }

  if (response.status === 400) {
    throw new ApiRequestError('invalid', ACCOUNT_ERROR_MESSAGES.invalid, response.status);
  }

  if (response.status >= 500) {
    throw new ApiRequestError('service', ACCOUNT_ERROR_MESSAGES.service, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError('response', ACCOUNT_ERROR_MESSAGES.response, response.status);
  }
}

/**
 * Validates the `{ message: "Success", data: ApiAccountDTO }` envelope and selects the active role.
 * Confirms the top-level user ID and the nested role ID match the session before exposing data, so
 * a mismatched or malformed response fails closed rather than leaking another role's values.
 * Read aloud: “normalize account.”
 */
function normalizeAccount(responseData, userId, role, roleId) {
  const account =
    responseData?.message === 'Success' &&
    responseData.data &&
    typeof responseData.data === 'object' &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;

  const primaryEmail = typeof account?.email === 'string' ? account.email.trim() : '';
  const roleDetail = account ? account[role] : null;
  const roleEmail = typeof roleDetail?.email === 'string' ? roleDetail.email.trim() : '';
  const rolePhone = typeof roleDetail?.phone === 'string' ? roleDetail.phone.trim() : '';

  const isCoherent =
    account &&
    Number(account.id) === userId &&
    roleDetail &&
    Number(roleDetail.id) === roleId &&
    primaryEmail &&
    roleEmail &&
    rolePhone;

  if (!isCoherent) {
    throw new ApiRequestError('response', ACCOUNT_ERROR_MESSAGES.response);
  }

  return { primaryEmail, role, roleEmail, roleId, rolePhone, userId };
}

/**
 * Loads the authenticated user's account and returns only the active role's editable details.
 * The path is scoped by the stored `userId` with the official `type` query; the token and identity
 * are read from the shared session boundary at request time, never from props or route parameters.
 * Read aloud: “fetch account.”
 * @param {{expectedRole: 'customer'|'courier', signal?: AbortSignal}} options
 * @returns {Promise<{userId:number, primaryEmail:string, role:string, roleId:number, roleEmail:string, rolePhone:string}>}
 * @throws {ApiRequestError} Codes: `unauthorized`, `notFound`, `service`, `response`, `connection`, `aborted`.
 */
export async function fetchAccount({ expectedRole, signal }) {
  const { role, roleId, session, userId } = await requireAccountSession(expectedRole);

  const { data, response } = await requestJson(
    `/api/account/${encodeURIComponent(userId)}?type=${encodeURIComponent(role)}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      method: 'GET',
      signal,
    },
  );

  throwForAccountFailure(response);
  return normalizeAccount(data, userId, role, roleId);
}

/**
 * Updates the active role's email and phone through the official `POST /api/account/{userId}` body
 * shape ({ account_type, account_email, account_phone }). The primary user email is never sent.
 * Returns the authoritative normalized account from the response, so drafts are never trusted as
 * proof of persistence.
 * Read aloud: “update account.”
 * @param {{expectedRole:'customer'|'courier', email:string, phone:string, signal?:AbortSignal}} options
 * @returns {Promise<object>} The persisted normalized account.
 * @throws {ApiRequestError} Codes: `unauthorized`, `invalid`, `notFound`, `service`, `response`, `connection`, `aborted`.
 */
export async function updateAccount({ email, phone, expectedRole, signal }) {
  const { role, roleId, session, userId } = await requireAccountSession(expectedRole);

  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

  // Local validation before any request; the screen shows field errors and sends nothing on fail.
  if (!isValidEmail(trimmedEmail) || !isValidPhone(trimmedPhone)) {
    throw new ApiRequestError('invalid', ACCOUNT_ERROR_MESSAGES.invalid);
  }

  const { data, response } = await requestJson(`/api/account/${encodeURIComponent(userId)}`, {
    body: JSON.stringify({
      account_email: trimmedEmail,
      account_phone: trimmedPhone,
      account_type: role,
    }),
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  });

  throwForAccountFailure(response);
  return normalizeAccount(data, userId, role, roleId);
}
