# AI Feature Specification — Courier Delivery

> Current-state contract for the Courier Order Delivery list, eligibility, status progression, persistence, partial-failure recovery, and Delivery Details modal.

## 1. Feature identity

- **Feature:** Courier Delivery
- **Route:** `client/app/courier/index.js`
- **Area:** Courier UI, protected order API, delivery status and assignment
- **Required progression:** `PENDING` → `IN PROGRESS` → `DELIVERED` → locked

## 2. Goal

The active courier sees all available pending orders and only their own assigned in-progress or delivered orders. They can accept a pending order, complete an assigned delivery, recover from a partial acceptance, and inspect full delivery details. Persisted API state—not an optimistic label—is authoritative.

## 3. Implemented scope

- Fetch pending and active-courier order collections in parallel.
- Validate, normalize, merge, deduplicate, and eligibility-filter responses in `orderService.js`.
- Render loading, empty, data, refresh, recoverable error, mutation, and partial-recovery states.
- Refresh on entry/focus, pull-to-refresh, retry, and successful mutation.
- Provide red Pending, orange In Progress, and green Delivered status controls.
- Advance Pending with status update first and courier assignment second.
- Advance the active courier's In Progress order to Delivered without reassignment.
- Lock Delivered in UI and service validation.
- Retain a “Retry assignment” path when status persisted but assignment failed.
- Open a scrollable Delivery Details modal from every eligible row.
- Preserve Customer order creation/history behavior and the established navigation/session boundaries.

Out of scope are maps, route planning, rating entry, arbitrary database repair, foreign-courier work, extra statuses, reversed/skipped transitions, and direct customer contact actions.

## 4. Retrieval and eligibility contract

The service reads a validated stored Courier session at request time and calls:

- `GET /api/orders/pending`
- `GET /api/orders?type=courier&id={courierId}`

Both requests include the bearer token. Each response must be `{ message: "Success", data: [...] }`.

The normalized visible set contains:

- every well-formed `pending` order;
- an `in progress` or `delivered` order only when its `courier_id` equals the active stored courier ID.

Rows with malformed IDs/amounts/products, unsupported status, foreign assignment, or an unassigned non-pending state are excluded. Overlapping results are deduplicated by order ID, with the courier-scoped record taking precedence.

## 5. Normalized delivery data

Each accepted row exposes only validated camelCase fields needed by the UI and mutations:

```js
{
  id,
  status,                 // PENDING | IN_PROGRESS | DELIVERED
  restaurantId,
  restaurantName,
  restaurantRating,       // nullable positive integer, round-tripped on broad update
  customerId,
  courierId,              // nullable for pending
  deliveryAddress,
  createdOn,
  products: [{ productId, productName, quantity, unitCost, totalCost }],
  totalCost,
}
```

Backend lowercase status values are allowlisted. The display label for `IN_PROGRESS` is `IN PROGRESS`.

## 6. Status mutation contract

The existing broad endpoint remains the canonical status update:

```http
PUT /api/orders/{orderId}
Content-Type: application/json

{
  "restaurant_id": <existing restaurant ID>,
  "customer_id": <existing customer ID>,
  "order_status_id": 2 or 3,
  "restaurant_rating": <existing rating or null>
}
```

`ApiOrderDTO` includes `restaurant_rating`, allowing the client to read and round-trip it so a status-only user action does not erase unrelated rating data. The broad update does not replace the courier assignment.

Courier assignment uses:

```http
PUT /api/order/{orderId}/courier
Content-Type: application/json

{ "courier_id": <active courier ID> }
```

Status IDs are fixed by the seeded backend contract: Pending `1`, In Progress `2`, Delivered `3`.

### Pending acceptance

1. Validate the session and that the snapshot is Pending.
2. Persist status ID `2` through the broad update.
3. Assign the active courier through the assignment endpoint.
4. Treat the acceptance as complete only after both responses validate.
5. Reconcile through refresh.

### Partial acceptance

If step 2 succeeds and assignment fails, the service throws the dedicated `partial` classification. The screen retains the order and exposes `Retry assignment`; it does not refresh away the recovery affordance or claim the order was fully accepted. Retrying calls only the assignment endpoint, then reconciles.

### Completion

1. Validate the row is In Progress and assigned to the active courier.
2. Persist status ID `3` through the broad update.
3. Do not call assignment again.
4. Reconcile and render Delivered as a non-pressable indicator.

## 7. Mutation safety

- One screen-level mutation lock prevents concurrent or duplicate status changes.
- The affected row displays `Updating…` and disables its action.
- Pending, foreign, unassigned, stale, delivered, and unsupported snapshots are rejected before a request where applicable.
- A failed mutation retains the last authoritative row state and presents safe retry feedback.
- HTTP 401/403 invokes shared unauthorized cleanup.
- 400, 404, 5xx, malformed response, connection, abort, and partial failure remain distinct internal classifications; raw server details are never shown.

## 8. Delivery Details contract

The modal receives the selected normalized list row; there is no per-order detail endpoint. It displays:

- status;
- delivery address;
- restaurant;
- order date;
- every line item;
- quantity and unit/item price;
- line totals and order total.

Currency uses the shared formatter and dates use the shared safe display convention. Optional/null content never renders `undefined`, `null`, or `NaN`. The body scrolls independently, Close stays outside the scrolling body, and closing clears the selection after dismissal without mutating the list.

## 9. Screen concurrency and refresh

- A generation counter and `AbortController` ensure the newest load wins.
- Blur/unmount aborts active reads and blocks late state updates.
- Existing rows remain during noninitial refresh.
- A valid empty collection renders an empty state.
- Recoverable failure retains prior valid rows when available.
- Logout or role change cannot publish late Courier data into another route tree.

## 10. Interfaces

| File | Responsibility |
| --- | --- |
| `client/app/courier/index.js` | Screen load/refresh, selection, mutation phases, reconciliation |
| `client/components/DeliveryRow.js` | Status presentation/action and View control |
| `client/components/DeliveryDetailsModal.js` | Selected-delivery presentation and scrolling |
| `client/services/orderService.js` | Requests, normalization, filtering, mutation validation, errors |
| `client/constants/theme.js` | Central status colors and shared presentation tokens |
| `server/.../dtos/order/ApiOrderDTO.java` | Exposes `restaurant_rating` for safe round-trip |
| `server/.../service/OrderService.java` | Maps the persisted rating into order responses |

## 11. Design decision record

Claude identified that `PUT /api/orders/{id}` overwrites broad order fields while the original response omitted `restaurant_rating`. The choices were a new status endpoint or retaining the established endpoint with enough response data for a lossless round-trip. The user chose the smallest compatibility change: add `restaurant_rating` to `ApiOrderDTO` and its mapping. The existing broad update, assignment, create, retrieval, and rating endpoints remain unchanged.

The confirmed acceptance order is status first, assignment second. The deliberate partial-failure strategy is retained local retry of assignment rather than an automatic compensating status reversal.

## 12. Acceptance criteria

- [x] Pending and courier-scoped collections are normalized, merged, and deduplicated.
- [x] Eligibility excludes foreign, malformed, unsupported, and dirty unassigned non-pending rows.
- [x] Pending acceptance sends status ID 2 before assigning the active courier.
- [x] Partial acceptance exposes retry assignment and is never reported as full success.
- [x] The active courier's In Progress row advances to status ID 3 without reassignment.
- [x] Delivered is non-actionable in both component and service logic.
- [x] `restaurant_rating` is available and round-tripped to preserve unrelated order data.
- [x] Details render the required normalized fields without a new endpoint.
- [x] 401/403 follows centralized session cleanup.
- [x] Postman documents pending, courier list, broad update, and assignment requests with variables.
- [ ] Representative iOS/Android list, mutation, partial-failure, modal, refresh, restart, and back flows require native verification.
- [ ] DBeaver before/after evidence remains an operator verification item.

## 13. Verification boundary

Backend tests in the implementation record cover rating exposure and preservation of rating/courier during broad updates. During the 2026-07-21 specification re-audit, the suite compiled and discovered 120 tests but the local MySQL instance was unavailable; 116 Spring-context errors followed, with zero assertion failures, so this was not a fresh database-backed pass. Expo configuration/export and static inspection cover buildability and code contracts. Native interaction, forced network partial failure, platform scrolling, and visual fidelity are not claimed until exercised on devices.
