/**
 * File: validation.js
 * Purpose: Shares the integer and account-field rules that services and forms enforce.
 * Contents: positive and non-negative safe-integer checks, email and phone validation.
 */

// One shared email shape rule so login and the Account form validate identically.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reports whether a value is a safe integer greater than zero.
 * Services use it for backend identifiers and quantities.
 * Read aloud: “is positive safe integer.”
 */
export function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * Reports whether a value is a safe integer of zero or more.
 * Services use it for whole-dollar costs, which may legitimately be zero.
 * Read aloud: “is non-negative safe integer.”
 */
export function isNonNegativeSafeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Reports whether a trimmed string is a syntactically valid email address.
 * The Account form validates the editable role email with it before saving.
 * Read aloud: “is valid email.”
 */
export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

/**
 * Reports whether a string contains any C0 control character or DEL.
 * isValidPhone uses it to keep control characters out of a saved account field. A char-code scan
 * is used instead of a control-character regex literal so the source stays plain-ASCII.
 * Read aloud: “has control character.”
 */
function hasControlCharacter(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }

  return false;
}

/**
 * Reports whether a trimmed string is meaningful phone content.
 * The backend enforces no phone format, so this keeps a permissive but non-empty rule: no control
 * characters and 7–15 digits, allowing common punctuation (spaces, +, -, parentheses, dots) so a
 * valid international number is never silently rewritten.
 * Read aloud: “is valid phone.”
 */
export function isValidPhone(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || hasControlCharacter(trimmedValue)) {
    return false;
  }

  const digitCount = (trimmedValue.match(/\d/g) ?? []).length;
  return digitCount >= 7 && digitCount <= 15;
}
