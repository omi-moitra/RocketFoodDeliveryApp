/**
 * File: deliveryStatus.js
 * Purpose: Centralizes the verified delivery status tokens, display labels, backend spellings, and IDs.
 * Contents:
 * 1. Internal delivery status tokens
 * 2. Display labels and backend mappings
 * 3. Backend status identifiers
 */

// Stable client tokens keep display wording separate from the backend's lowercase status names.
export const DELIVERY_STATUS = Object.freeze({
  DELIVERED: 'DELIVERED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING: 'PENDING',
});

export const DELIVERY_STATUS_LABELS = Object.freeze({
  [DELIVERY_STATUS.DELIVERED]: 'DELIVERED',
  [DELIVERY_STATUS.IN_PROGRESS]: 'IN PROGRESS',
  [DELIVERY_STATUS.PENDING]: 'PENDING',
});

// Only verified backend spellings are mapped. Unknown values stay unsupported and fail closed.
export const BACKEND_STATUS_TO_INTERNAL = Object.freeze({
  delivered: DELIVERY_STATUS.DELIVERED,
  'in progress': DELIVERY_STATUS.IN_PROGRESS,
  pending: DELIVERY_STATUS.PENDING,
});

// Confirmed backend order_status IDs used by the existing courier mutation requests.
export const DELIVERY_STATUS_ID = Object.freeze({
  [DELIVERY_STATUS.DELIVERED]: 3,
  [DELIVERY_STATUS.IN_PROGRESS]: 2,
  [DELIVERY_STATUS.PENDING]: 1,
});
