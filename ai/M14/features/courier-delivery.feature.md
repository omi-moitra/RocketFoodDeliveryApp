# AI Feature Specification — Courier Delivery

> Defines the graded Courier Order Delivery list, eligibility rules, status progression, persistence, delivered lock, and Delivery Details modal. Use this document together with `ai/M14/ai-spec.md` and the completed navigation specifications.

> **Implementation owner:** Claude will run and implement this specification. Claude must verify the existing Java API in Postman before writing any courier mutation code and prefer a frontend service adapter. If the verified broad update cannot preserve unrelated order data, Claude may implement only the minimum status-specific backend adjustment authorized by the global spec and documented in `README.md`.

## Table of Contents

1. [Feature identity](#1-feature-identity)
2. [Feature goal](#2-feature-goal)
3. [Feature scope](#3-feature-scope)
4. [Requirements breakdown](#4-requirements-breakdown)
5. [User flow and delivery logic](#5-user-flow-and-delivery-logic)
6. [Interfaces](#6-interfaces)
7. [Data, validation, and state](#7-data-validation-and-state)
8. [Expected behavior](#8-expected-behavior)
9. [Technical constraints](#9-technical-constraints)
10. [Acceptance criteria](#10-acceptance-criteria)
11. [Feature Definition of Done](#11-feature-definition-of-done)
12. [Notes for AI tools](#12-notes-for-ai-tools)

## 1. Feature identity

- **Feature name:** Courier Delivery
- **Related area:** Courier Order Delivery tab, protected order API, status persistence, delivery details
- **Specification file:** `ai/M14/features/courier-delivery.feature.md`
- **Implementation branch:** `feature/m14-courier-delivery`
- **Grading requirements:** AI feature specification, clickable status, ordered status progression, delivered lock, and View-to-details behavior
- **Dependencies:** Completed Navigation Structure and Role-Based Navigation features provide the protected Courier tabs and validated active courier session.
- **Claude deliverable:** A working Courier Order Delivery experience backed only by the verified existing API, with safe visibility filtering and persistent status changes.
- **Completion evidence:** Postman contract evidence, current code inspection, named native scenarios, database verification, regression checks, and the final diff.

## 2. Feature goal

Replace the current Courier Order Delivery placeholder with a reliable delivery workflow where the active courier can:

- See every pending order available for acceptance.
- See only their own assigned in-progress and delivered orders.
- Advance a pending order to in progress and become its assigned courier.
- Advance their in-progress order to delivered.
- Never advance or mutate a delivered order.
- Open the selected order's complete, scrollable Delivery Details modal.

Claude must preserve the completed M13 Customer journey and the role-isolated navigation already in place. Correctness is defined by persisted backend state, not an optimistic label. Backend work is limited to the smallest verified status-contract correction needed to make this frontend feature safe.

## 3. Feature scope

### 3.1 In scope

- Replace `client/app/courier/index.js` placeholder content with the Courier Order Delivery screen.
- Load pending orders from the verified pending endpoint.
- Load orders assigned to the authenticated courier from the verified courier query.
- Validate both success envelopes and normalize backend fields once at the service boundary.
- Merge and deduplicate results by order ID.
- Display all valid pending orders and only the active courier's assigned in-progress/delivered orders.
- Exclude malformed, unsupported-status, duplicate, and dirty unassigned non-pending rows.
- Provide initial loading, refreshing, empty, recoverable error, and rendered-list states.
- Refresh on initial entry, tab focus, explicit retry/refresh, and successful status mutation.
- Display a clickable status control with red `PENDING`, orange `IN PROGRESS`, and green `DELIVERED` states.
- Prevent duplicate or out-of-order status requests.
- Persist `PENDING` to status ID 2, then assign the active courier through the existing assignment endpoint.
- Persist the active courier's `IN PROGRESS` order to status ID 3 without replacing its courier.
- Define and implement verified recovery for a partial pending-acceptance failure.
- Lock delivered orders in both UI behavior and service validation.
- Open a reusable Delivery Details modal for the selected delivery.
- Show status, delivery address, restaurant, order date, line items, quantity, item price, and total.
- Keep long lists and modal content scrollable with controls reachable on iOS and Android.
- Reuse the current API client, session storage, shared header/tab chrome, theme, icons, validation helpers, and applicable order normalization.
- Update this specification, the global spec, Postman collection, and private implementation log only where verified implementation changes their truth.

Expected frontend and documentation files:

- `client/app/courier/index.js`
- `client/services/orderService.js`
- `client/components/DeliveryRow.js` or one equivalently named reusable delivery-row component, only if extraction improves clarity
- `client/components/DeliveryDetailsModal.js` or a verified extension/reuse of the existing order-details modal
- `client/constants/theme.js` only for centralized missing status/style tokens
- `client/utils/validation.js` only for genuinely shared validation
- `PostmanCollection.json` for verified courier requests
- `ai/M14/features/courier-delivery.feature.md`
- `ai/M14/ai-spec.md` only when verified repository truth changes
- `README.md` for the discrepancy, final API contract, minimum backend change, compatibility impact, and verification

Claude must inspect these backend files before deciding whether the minimum-change gate is met:

- `server/src/main/java/com/rocketFoodDelivery/rocketFood/controller/api/OrderApiController.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/service/OrderService.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/order/ApiOrderDTO.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/order/ApiUpdateOrderDTO.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/order/ApiAssignCourierDTO.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/product/ApiProductForOrderApiDTO.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/repository/OrderRepository.java`

If live/source evidence confirms the rating round-trip blocker, backend edits are limited by default to:

- `server/src/main/java/com/rocketFoodDelivery/rocketFood/controller/api/OrderApiController.java`
- One narrowly named status-update request DTO, if a request body cannot be represented safely without it
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/service/OrderService.java` only when the existing status-update behavior cannot provide required validation or a reliable response
- Focused server tests for the new/adjusted status contract

Expanding beyond those files requires new evidence, an updated minimum-change justification in the global spec and `README.md`, and explicit disclosure in the handoff. Existing broad update, creation, retrieval, assignment, and rating contracts must remain backward compatible.

Claude must inspect but should not modify unless a demonstrated feature defect requires it:
- `client/app/courier/_layout.js` unless a demonstrated feature defect requires a narrowly scoped correction
- `client/storage/authStorage.js`, `client/contexts/AuthContext.js`, and `client/services/apiClient.js` unless a demonstrated shared-boundary defect blocks this feature
- `client/app/customer/order-history.js` and its components as retained M13 regression references
- `support_materials_14/Wireframe.pdf` as the visual source for Courier Deliveries and Delivery Details

### 3.2 Out of scope

- Backend cleanup, broad refactoring, schema/migration/entity/security/seeder changes, or API changes beyond the documented minimum status-contract correction.
- Adding an undocumented status endpoint, changing the existing broad update contract, or expanding beyond the authorized minimum status operation.
- Automatically repairing arbitrary dirty database rows from the mobile interface.
- Displaying another courier's assigned in-progress or delivered orders.
- Allowing a customer session to use courier delivery requests or routes.
- Skipping a status, reversing status, reassigning an assigned order, or changing a delivered order.
- Customer/courier personal data in Delivery Details beyond the required delivery address.
- Account contact retrieval/editing; see `account-details.feature.md`.
- Customer notification options; see `order-confirmation-modal.feature.md`.
- Final cross-app design cleanup; see `ui.feature.md`.
- Restaurant rating, maps, direct SMS/email, or any extra-mile feature.
- New dependencies, broad architecture rewrites, unrelated M13 changes, or generated artifacts.
- Editing or committing `.omi/` planning material; the implementation log is the sole required private write.

## 4. Requirements breakdown

### 4.1 Requirement A — Eligible delivery retrieval

- Read a validated active Courier session at request time; use `courierId`, never `userId` or an email, for courier scoping.
- Request all pending orders from `GET /api/orders/pending`.
- Request the active courier's assigned orders from `GET /api/orders?type=courier&id={courierId}`.
- Send the bearer token on both requests.
- Verify both endpoints live before implementation; do not rely on controller inspection alone for completion.
- Validate each `{ message: "Success", data: [...] }` envelope.
- Normalize and combine both arrays at the service boundary, deduplicating by positive order ID.
- The final visible set is exactly all valid `PENDING` orders plus this courier's assigned `IN PROGRESS` and `DELIVERED` orders.
- A non-pending row without a valid matching courier ID is ineligible and must not render.
- An assigned row belonging to another courier must not render even if stale or malformed upstream data reaches the client.
- Unsupported status text must not be guessed into one of the three supported states.

### 4.2 Requirement B — Delivery-list states and refresh

- Initial entry displays a useful loading state without showing stale data as current.
- A valid empty eligible set displays an empty state, not an exception.
- Recoverable connection/service/response failures display safe retry feedback.
- Pull-to-refresh or an equivalently clear refresh action must preserve the existing list while showing refreshing state.
- A newer request wins; late results from an older refresh, logout, role change, or unmount must not replace current state.
- A 401 or 403 follows the shared expired-session/sign-out path.
- Long lists scroll inside the Courier tab while the shared authenticated header and tab footer remain available.

### 4.3 Requirement C — Status presentation and interaction

- Render normalized status as the row's clickable status control.
- `PENDING` is red, `IN PROGRESS` is orange, and `DELIVERED` is green using centralized semantic tokens.
- Only `PENDING` and the active courier's `IN PROGRESS` orders are actionable.
- `DELIVERED` remains visibly green but has no next action and sends no request.
- While one order mutation is pending, its status control is disabled and displays `Updating…`.
- Repeated taps for the same order and stale callbacks cannot send duplicate or out-of-order requests.
- Other rows may remain viewable; concurrency across multiple status mutations must be deliberately defined and must never corrupt per-order state.

### 4.4 Requirement D — Pending acceptance and assignment

- The confirmed business sequence is status update first, courier assignment second.
- Step 1 calls the final verified status contract with status ID 2. Use the existing broad `PUT /api/orders/{orderId}` only if it can preserve every unrelated field safely; otherwise use the authorized minimum status-only backend adjustment.
- Step 2 calls `PUT /api/order/{orderId}/courier` with `{ "courier_id": activeCourierId }`.
- Do not derive broad-update fields from UI labels. Use only normalized, backend-originated identifiers whose round-trip safety is proven in Postman.
- Do not send guessed zeros, stale IDs, invented keys, or an assumed restaurant-rating value.
- Do not display `IN PROGRESS` as final until both requests succeed and the refreshed eligible set confirms status 2 plus the active courier assignment.
- Claude must verify and document the partial-failure plan before coding. At minimum, assignment failure after a successful status update must retain a recoverable local action or use a verified compensating request; it must not silently lose the order or claim acceptance succeeded.
- The implementation must not reverse the operation order merely because assignment-first is easier.

### 4.5 Requirement E — In-progress to delivered

- Only an order whose normalized status is `IN PROGRESS` and whose courier ID equals the active courier ID may advance.
- Call the verified existing broad order-update endpoint with status ID 3 and only the proven-safe complete body.
- Preserve the existing courier assignment; do not call the assignment endpoint again.
- Treat the change as final only after a successful response and refresh/normalization confirm `DELIVERED` for the same courier.
- A failure leaves or restores the previously persisted `IN PROGRESS` display and offers a safe retry.

### 4.6 Requirement F — Delivered lock

- A normalized `DELIVERED` order has no next status.
- Its control is non-actionable and accessible as a status indicator rather than suggesting another transition.
- Service mutation functions independently reject attempts to mutate delivered, unassigned, foreign-courier, unsupported, or stale orders before sending a request.
- Refresh and app restart must continue to show delivered as locked from persisted API state.

### 4.7 Requirement G — Delivery Details modal

- Every rendered delivery has a visible, accessible `View` action.
- `View` opens details for exactly that selected order; switching rows must never reuse stale details.
- Use the normalized list response; the backend has no dedicated per-order details endpoint.
- Display exactly the minimum wireframe data: status, delivery address, restaurant, order date, line items, each quantity, each item price, and total.
- Interpret “item price” as the verified backend `unit_cost`; do not substitute the line `total_cost` without a visible distinction.
- Format monetary values through the existing currency convention and dates through one safe display helper.
- Nullable/missing optional content must not crash or render `undefined`, `null`, `NaN`, or misleading personal data.
- The modal content scrolls independently and keeps Close reachable with screen-reader labels and sensible focus behavior.
- Closing the modal clears the selected order after dismissal and does not mutate delivery data.

### 4.8 Requirement H — Regression, evidence, and documentation

- Preserve the role guards, Courier tab labels, shared header/logout, and Customer route tree.
- Preserve M13 order creation and customer order history behavior while extending shared order normalization carefully.
- Verify the two list calls, both status transitions, assignment, delivered lock, refresh, and relevant failures in Postman/native runtime.
- Confirm status and courier assignment persistence in DBeaver when available.
- Update `PostmanCollection.json` with actual current-backend calls and safe sample variables.
- Document the broad-update discrepancy, frontend-only analysis, exact minimum backend change (if used), final frontend adapter, compatibility impact, and verification in the global spec and `README.md`.
- Append the same decision plus partial-failure handling, changed files, evidence, manual gaps, and technical-demo cue to the private implementation log.
- Do not mark runtime/database criteria complete from code inspection or export alone.

## 5. User flow and delivery logic

### 5.1 Enter Order Delivery

1. A validated session has `activeRole = courier`, a positive `courierId`, and a bearer token.
2. The Courier tab guard exposes Order Delivery.
3. The screen starts both eligible-order requests under one refresh generation.
4. The service validates, normalizes, merges, filters, and deduplicates results.
5. The screen renders loading, empty, error, or the eligible list.

### 5.2 Refresh deliveries

1. The courier refreshes or returns focus to the tab.
2. A newer generation supersedes any older request.
3. Existing valid rows remain visible during a noninitial refresh.
4. Success replaces the list atomically; failure retains safe prior data and exposes retry feedback.

### 5.3 Accept a pending delivery

1. The courier taps the red `PENDING` status control once.
2. The row locks and displays `Updating…`.
3. The service revalidates the session, order snapshot, status, and verified broad-update fields.
4. The service persists status ID 2 through `PUT /api/orders/{id}`.
5. The service assigns the active courier through `PUT /api/order/{id}/courier`.
6. After both succeed, the client refreshes and confirms the order is `IN PROGRESS` and assigned to the active courier.
7. Only then does the orange `IN PROGRESS` state become final.

### 5.4 Recover a partial pending acceptance

1. If status update fails, keep `PENDING`, unlock the row, and show retry feedback.
2. If status succeeds but assignment fails, do not claim acceptance succeeded.
3. Execute the exact recovery chosen during the live contract gate: retry assignment from retained local context or a verified compensating status request.
4. Keep the action recoverable until persisted state is reconciled; do not refresh away the only recovery affordance.
5. Record the observed failure state and recovery behavior in the private implementation log.

### 5.5 Complete an in-progress delivery

1. The active assigned courier taps the orange `IN PROGRESS` control once.
2. The row locks and displays `Updating…`.
3. The service persists status ID 3 through the verified broad-update request.
4. Refresh confirms the same order/courier now has `DELIVERED`.
5. The row becomes a green, permanently non-actionable delivered indicator.

### 5.6 View and close details

1. The courier taps `View` on one row.
2. The modal receives that normalized order as its selected value.
3. The courier scrolls all required fields and line items.
4. Close dismisses the modal and returns to the unchanged list position/state.

### 5.7 Session or data failure

1. A 401/403 clears the unusable session through the shared unauthorized flow and returns to Login.
2. A malformed row is excluded rather than rendered with unsafe values.
3. A dirty unassigned status-2/status-3 row is not inferred as eligible and is not automatically repaired by the mobile client.
4. A foreign assigned order is excluded even if it appears in stale merged input.

## 6. Interfaces

### 6.1 Route and screen files

- `client/app/courier/index.js` — owns screen-level fetch state, refresh generation, selected order, per-order mutation state, and composition.
- `client/app/courier/_layout.js` — existing protected Courier tabs and shared header; inspect and preserve.
- `client/app/_layout.js` — existing root session/role guards; inspect and preserve.

### 6.2 Shared components and modules

- `client/services/orderService.js` — owns backend paths, body construction, response normalization, eligibility filtering, deduplication, transition validation, and error classification.
- `client/services/apiClient.js` — existing timeout, abort, base URL, and JSON transport boundary.
- `client/storage/authStorage.js` — supplies the current validated token, courier ID, and active role at request time.
- `client/contexts/AuthContext.js` — supplies shared unauthorized/session-expiry handling.
- Delivery row component — owns presentation and accessible status/View controls, not API calls.
- Delivery Details modal — owns required details presentation and scrolling, not request state.
- `client/constants/theme.js` — owns semantic status colors if equivalent tokens do not already exist.
- Existing currency, validation, icon, result-state, and order-history patterns must be reused where their contracts fit.

### 6.3 Existing backend/API contract and mandatory gate

The current repository exposes these baseline calls:

```http
GET /api/orders/pending
Authorization: Bearer <accessToken>

GET /api/orders?type=courier&id=<courierId>
Authorization: Bearer <accessToken>

PUT /api/orders/<orderId>
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "restaurant_id": <verified existing value>,
  "customer_id": <verified existing value>,
  "order_status_id": 2 or 3,
  "restaurant_rating": <verified safe existing value or verified null>
}

PUT /api/order/<orderId>/courier
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "courier_id": <activeCourierId>
}
```

Current controller/DTO inspection indicates successful calls return HTTP 200 with `{ "message": "Success", "data": <ApiOrderDTO or ApiOrderDTO[]> }`. `ApiOrderDTO` currently includes `id`, customer/restaurant IDs and names/addresses, nullable courier ID/name, status, products, total cost, and creation date. Products include `product_id`, `product_name`, `quantity`, `unit_cost`, and `total_cost`.

This inspection is not sufficient to authorize mutation code. Before implementation, Claude must use Postman/live evidence to record in this file:

- Exact 200 response bodies for pending, courier-scoped, status-update, and assignment calls.
- Actual status strings/case and their confirmed mapping to IDs 1, 2, and 3.
- Whether the list response supplies every broad-update field without destructive loss.
- The safe `restaurant_rating` value for pending/in-progress transitions and whether round-tripping it can overwrite data.
- 400/401/403/404/500 behavior and response envelopes.
- What persists when status succeeds but assignment fails.
- The chosen, demonstrated recovery for that partial failure.
- Whether a post-mutation refresh reliably returns the changed order from the intended endpoint.

If the broad update can preserve unrelated fields safely, keep it and adapt the frontend service. If verified evidence confirms that it cannot—such as the identified `restaurant_rating` response/update mismatch—use the global spec's minimum-change gate. Prefer a narrow status-only operation that changes only `order_status_id` and reuses existing service/repository behavior; preserve the broad endpoint for compatibility. Do not invent the final contract silently: record its method, path, body, response, validation, errors, files, tests, compatibility impact, and client mapping in this spec, `ai/M14/ai-spec.md`, `README.md`, Postman, and the implementation log.

### 6.4 Frontend adapter contract

The frontend service must isolate backend details from UI code:

- Convert snake_case fields to a stable camelCase `CourierDelivery` model.
- Normalize only proven status spellings to `PENDING`, `IN_PROGRESS`, or `DELIVERED` internal values.
- Build exact snake_case request bodies inside the service.
- Compare numeric IDs after safe normalization so JSON numbers/numeric strings cannot bypass ownership checks.
- Preserve the source identifiers required for a verified safe status update without exposing them as editable screen state.
- Return one classified service result/error; screens must not inspect raw envelopes or assemble API bodies.

### 6.5 Postman and database evidence

- Add nonsecret variables for API base URL, bearer token, courier ID, and disposable order IDs.
- Include pending retrieval, courier retrieval, pending-to-in-progress update, courier assignment, and in-progress-to-delivered update.
- Do not hard-code live ngrok URLs, passwords, or tokens in the committed collection.
- Use disposable test data and capture the before/after order status and courier ID in DBeaver.
- Do not use a delivered production/reviewer order as a mutation test fixture.

## 7. Data, validation, and state

### 7.1 Normalized delivery shape

The service should return a shape equivalent to:

```js
{
  id: 42,
  customerId: 8,
  deliveryAddress: '123 Example Street',
  restaurantId: 3,
  restaurantName: 'Example Restaurant',
  courierId: null,
  status: 'PENDING',
  products: [
    {
      productId: 7,
      productName: 'Example Item',
      quantity: 2,
      unitCost: 1299,
      totalCost: 2598,
    },
  ],
  totalCost: 2598,
  createdOn: '2026-07-20T12:00:00',
  restaurantRating: null,
}
```

`restaurantRating` may be retained for mutation only if the live response actually supplies it and round-trip behavior is proven safe. Do not add a field to normalized data merely to satisfy this example.

### 7.2 Validation rules

- Order, customer, restaurant, courier, product, quantity, and status IDs must be positive safe integers where required.
- Monetary values must be finite nonnegative integers in the backend's established unit convention.
- Required names, status, address, and creation date must be nonblank and safely displayable.
- Products must be an array; each rendered line item needs valid name, quantity, unit cost, and line total.
- A pending order may have no courier; an in-progress/delivered visible order must match the active courier.
- Duplicate IDs collapse to one eligible order using a deterministic source-precedence rule documented in code.
- Conflicting duplicate snapshots must prefer verified assigned/current data or trigger refresh; never downgrade an assigned status from stale pending data.

### 7.3 Status model

```text
PENDING (ID 1) → IN_PROGRESS (ID 2) → DELIVERED (ID 3) → locked
```

- Internal state may use `IN_PROGRESS`; visible text must be `IN PROGRESS`.
- Status normalization is allowlisted and case/whitespace tolerant only for verified backend spellings.
- No backward transition, skipped transition, unknown transition, or transition by a foreign courier is valid.

### 7.4 Screen state

Represent these states explicitly rather than combining ambiguous booleans:

- Load state: `initialLoading`, `ready`, `empty`, or `error`.
- Refresh state: idle or refreshing with a generation/request identity.
- Per-order mutation: idle, updating status, assigning courier, reconciling, partial failure, or error.
- Modal state: no selection or one selected normalized order.

The UI must not simultaneously claim empty and loading, show a completed new status during mutation, or retain a modal selection for an order removed after refresh without an intentional close/reconciliation rule.

### 7.5 Error classification

- `unauthorized`: missing/invalid courier session or HTTP 401/403; invoke shared sign-out handling.
- `invalid`: client precondition, stale ownership/status, or verified 400-class request rejection.
- `notFound`: order/courier unavailable during mutation; refresh and explain safely.
- `service`: HTTP 5xx.
- `response`: malformed/unexpected success data.
- `connection`: timeout/network failure.
- `aborted`: expected cancellation; do not show a stale error.
- `partial`: status persisted but assignment not yet confirmed; preserve a deliberate recovery action.

Never show raw server details, tokens, IDs that are not useful to the user, or stack traces.

## 8. Expected behavior

- A courier sees all valid pending deliveries regardless of assignment and only their own valid assigned non-pending deliveries.
- The same order appears once when responses overlap.
- Another courier's assigned work never appears.
- Pending is red and advances only to orange in progress after status and assignment both persist.
- In progress is orange and advances only to green delivered after persistence.
- Delivered is green and permanently locked.
- A pending request displays `Updating…`, blocks duplicate taps, and never masquerades as a persisted status.
- Partial failure remains visible and recoverable according to the Postman-proven strategy.
- Refresh, retry, focus, logout, and role changes cannot leak stale deliveries into the wrong session.
- Every View action opens the selected order and shows all required fields in a scrollable modal.
- Missing/malformed data produces exclusion or a safe fallback, never a crash or fabricated value.
- Customer routes, order creation, order history, navigation, and logout continue working.

## 9. Technical constraints

- Claude must read `ai/M14/ai-spec.md`, this entire feature spec, both completed M14 navigation specs, `client/AGENTS.md`, and `client/CLAUDE.md` before changing client files.
- Because `client/AGENTS.md` requires exact current Expo guidance before client code, consult the official versioned Expo SDK 54/Expo Router documentation relevant to focus, modal, list, and refresh behavior before implementation.
- Use existing Expo SDK 54, Expo Router 6, React Native, JavaScript, Context, AsyncStorage, and API client patterns.
- Add no dependency unless an existing required behavior is impossible and the user explicitly approves it.
- Prefer a frontend adapter. Change the backend only when the documented gate proves it necessary, and then touch only the minimum status-contract surface with focused tests and backward compatibility.
- Keep backend snake_case and broad-update compatibility inside `orderService.js`; UI code consumes normalized camelCase data.
- Reuse existing order normalization carefully or extract shared pure helpers; do not regress Customer Order History.
- Keep token and courier identity in session/service boundaries, never props, route parameters, logs, or local UI input.
- Use abort/generation guards for asynchronous reads and per-order locks for mutations.
- Avoid optimistic status claims; persisted/refreshed server state is authoritative.
- Preserve accessibility labels, touch targets, safe areas, Oswald typography, theme conventions, and junior-readable code comments.
- Do not read the private implementation log as an implementation dependency; append to it only after implementation/handoff reconciliation.
- Do not stage, commit, merge, push, or modify external systems without explicit user authorization.

## 10. Acceptance criteria

### 10.1 Contract gate

- [ ] Both list endpoints are verified **live** with a Courier bearer token and their exact success/error envelopes are recorded. (Source-verified from `OrderApiController` + `OrderService` + `ApiOrderDTO`; **live Postman run pending** — no running backend/DB in this environment.)
- [ ] Status IDs and returned status spellings are verified against live responses/database values. (Source: `OrderStatus` names are lowercase `pending`/`in progress`/`delivered`, IDs 1/2/3 per `DataSeeder`; **live/DB confirmation pending**.)
- [ ] The final status-update contract is proven safe for status IDs 2 and 3. (**Pending — see gate finding below.** The broad update cannot safely round-trip `restaurant_rating`; if live verification confirms that behavior, implement and verify the authorized minimum status-only backend operation.)
- [ ] Assignment body/response and persistence are verified. (Source: `assignCourier` sets courier, requires courier to exist, leaves status untouched; **live/DB confirmation pending**.)
- [ ] Partial status-success/assignment-failure behavior and recovery are demonstrated and documented. (**Pending** — depends on the blocked mutation code and live verification.)
- [ ] PostmanCollection documents the final verified backend calls without secrets. (**Pending** live capture.)
- [x] The completed read-only pass modified no Java backend file. (`git status` showed zero `server/` changes during that pass.)
- [ ] Any later backend adjustment is proven necessary, limited to the minimum status contract, backward compatible, tested, and documented in the global spec and `README.md`.

> **Contract-gate finding (broad-update rating round trip).** `PUT /api/orders/{id}` binds `ApiUpdateOrderDTO { restaurant_id, customer_id, order_status_id, restaurant_rating }`, and `OrderService.updateOrderFromDTO` sets all four fields (courier is left untouched, so a status change does **not** wipe the assignment). But `ApiOrderDTO` omits `restaurant_rating`, so a courier client cannot read the current rating to preserve it. Sending `restaurant_rating: null` could erase an existing rating. `restaurant_id` and `customer_id` are present and can round-trip. The policy decision is now resolved: if live verification confirms this incompatibility, add the documented minimum status-only backend operation instead of guessing a rating. The final endpoint contract and live evidence remain pending.

### 10.2 Retrieval and eligibility

- [ ] A valid active Courier session loads pending and courier-scoped orders with its stored token/courier ID. (`fetchCourierDeliveries` reads the session and requests both endpoints with the bearer token; **live run pending**.)
- [x] Valid responses are normalized, merged, and deduplicated by order ID. (`normalizeDeliveryList` + a `Map` keyed by order ID with courier-scoped precedence; pure logic.)
- [ ] Every valid pending order appears. (Filter keeps all `PENDING`; **live data + render pending**.)
- [x] Only the active courier's assigned in-progress/delivered orders appear. (Eligibility filter keeps a non-pending row only when `delivery.courierId === courierId`.)
- [x] Foreign, dirty unassigned non-pending, unsupported-status, and malformed rows do not appear. (Ownership filter excludes foreign/unassigned non-pending; `normalizeDeliveryStatus` allowlist drops unsupported status; `normalizeCourierDelivery` returns null for malformed rows.)
- [x] Customer/no-role sessions cannot issue courier delivery requests. (`fetchCourierDeliveries` throws `unauthorized` unless `activeRole === courier` and `courierId` is a positive integer.)

### 10.3 Loading, refresh, and failure states

- [ ] Initial loading, empty, rendered, refreshing, recoverable error, and retry states are distinct and useful. (All six implemented via `requestStatus` + `ResultState`, mirroring the proven Order History screen; **native render pending**.)
- [x] A newer request prevents stale results after focus, refresh, logout, role change, or unmount. (`newestRequestRef` generation guard + `AbortController` cleanup on blur/unmount.)
- [x] HTTP 401/403 follows shared unauthorized handling. (`requestDeliveryList` throws `unauthorized`; the screen calls `handleUnauthorized`.)
- [ ] Long delivery lists scroll without losing authenticated header/footer access. (`FlatList` inside the tab chrome; **native scroll test pending**.)

### 10.4 Status control and progression

> **Status mutation deferred (contract gate).** The clickable accept/deliver actions are NOT implemented in this pass because the broad-update rating round-trip is unresolved and no live verification is possible here. The status is currently a correctly-colored, non-actionable indicator. The items below stay unchecked.

- [ ] Status controls show PENDING red, IN PROGRESS orange, and DELIVERED green. (Color tokens `DELIVERY_STATUS_COLORS` + status pill are implemented; **native render pending**.)
- [ ] One pending tap displays `Updating…` and blocks duplicate/out-of-order requests. (**Deferred** — mutation not wired.)
- [ ] Pending acceptance persists status ID 2, then assigns the active courier in that order. (**Deferred/blocked** — see gate finding.)
- [ ] The UI confirms in progress only after both operations and reconciliation succeed. (**Deferred**.)
- [ ] The active courier's in-progress order persists status ID 3 without reassignment. (**Deferred/blocked**.)
- [ ] A failed transition restores/retains persisted state and offers safe retry feedback. (**Deferred**.)
- [ ] A partial pending acceptance follows the verified recovery path and is never reported as success. (**Deferred**.)

### 10.5 Delivered lock and ownership

- [ ] Delivered orders have no next transition in UI or service logic. (UI shows delivered as a non-actionable indicator; dedicated service mutation guards are **deferred** with the mutation code.)
- [ ] Repeated delivered taps send zero requests. (**Deferred** — no status request is wired yet.)
- [ ] A foreign/unassigned/stale in-progress order cannot be mutated by the active courier. (Retrieval already excludes foreign/unassigned non-pending rows; the service-level mutation guard is **deferred**.)
- [ ] Refresh and restart preserve delivered lock from backend state. (**Live/native pending**.)

### 10.6 Delivery Details

- [ ] Every eligible row has a working accessible View action. (`DeliveryRow` renders an accessible View button wired to the screen handler; **native tap pending**.)
- [ ] View opens the correct selected order without stale content. (Handler sets `selectedDelivery` to the row's item; modal `ScrollView` is keyed by delivery id to drop stale scroll; **native verification pending**.)
- [ ] The modal shows status, delivery address, restaurant, order date, every line item, quantity, unit/item price, and total. (All fields rendered in `DeliveryDetailsModal`; **native render pending**.)
- [x] Currency/date/status formatting is consistent and no unsupported personal fields appear. (Reuses `formatProductCost` and the shared `July 15, 2026` date format; only status/address/restaurant/date/line items/total render — no customer/courier personal fields beyond the required delivery address.)
- [x] Missing optional data never renders `undefined`, `null`, or `NaN` and never crashes. (`deliveryAddress ?? ''`, `formatProductCost`/`formatOrderDate` guards, allowlisted status, and a null-`delivery`-tolerant modal body.)
- [ ] Modal overflow scrolls and Close remains reachable on iOS and Android. (`ScrollView` + fixed footer; **native scroll test pending**.)

### 10.7 Persistence and regression

- [ ] Postman and DBeaver confirm both status transitions and courier assignment persist.
- [ ] App refresh/restart reloads the persisted status/ownership and visibility.
- [ ] Courier-only and dual-role Courier paths both work.
- [ ] Logout/session expiry prevents protected back access and stale delivery display.
- [ ] M13 Customer login, restaurants, menus, order creation, order history/details, and logout still work.
- [ ] Courier tabs remain exactly Order Delivery and Account.

### 10.8 Repository and platform verification

- [x] `git diff --check` passes. (No whitespace/conflict errors.)
- [x] `npm ls --depth=0` reports no invalid top-level dependency. (Clean tree.)
- [x] `npx expo config --type public` succeeds without exposing secrets. (EXIT 0.)
- [x] `npx expo export --platform android` succeeds and generated output is removed. (EXIT 0; `dist/` removed.)
- [ ] Representative iOS and Android native scenarios verify list, refresh, both transitions, lock, modal, errors, and back behavior. (**Pending native run**; transitions also await the mutation gate.)
- [x] The read-only-pass status/diff contained no server edits, secret/live URL, private log, generated output, or unrelated change. (`server/` was untouched; `.omi/` gitignored.)
- [ ] The completed mutation diff contains no undocumented or non-minimal server edit, secret/live URL, private log, generated output, or unrelated change.

Claude must leave every criterion unchecked until current evidence exists. Static inspection/export cannot prove native interaction, live API behavior, or database persistence.

## 11. Feature Definition of Done

- [ ] Every graded Courier Delivery criterion has current evidence. (Read-only retrieval/list/details complete with code evidence; status-mutation criteria **deferred/blocked** on the rating gate + live verification.)
- [ ] The live baseline contract, frontend-only limitation, final minimum backend decision, and frontend adaptation are recorded before mutation code. (Baseline contract is source-recorded; live confirmation and final mutation contract remain pending.)
- [ ] Eligible visibility is exact and role-safe across initial load, refresh, focus, mutation, logout, and restart. (Load/refresh/focus/role-scoping implemented and code-verified; mutation/restart paths **pending**.)
- [ ] Both allowed transitions persist in order and failures never leave a false final UI state. (**Deferred/blocked**.)
- [ ] Delivered and invalid/foreign/stale orders cannot mutate from either UI or service entry points. (Retrieval excludes foreign/unassigned; service mutation guards **deferred** with the mutation code.)
- [ ] Delivery Details matches the minimum wireframe fields and works with long/nullable content. (All required fields + null-safety implemented; **wireframe-visual comparison + native long-content test pending**.)
- [ ] Customer and navigation regression checks pass. (**Pending native run**; no customer-path files changed — shared `orderService` additions are additive and do not touch `normalizeCustomerOrder`.)
- [ ] Postman and database evidence confirm status/assignment behavior. (**Pending**.)
- [x] This spec and the global spec match final verified behavior with no unsupported checked items. (Only code/automated-verified items are checked; every live/native/mutation item is annotated pending.)
- [x] The private implementation log records the discrepancy, decision, adapter, recovery behavior, evidence, manual gaps, and technical-demo cue. (Feature-3 entry appended to `.omi/m14/IMPLEMENTATION_LOG.md`.)
- [ ] The completed feature diff contains no undocumented/non-minimal backend edit, dead code, debug output, generated artifact, secret, or unrelated change. (The earlier read-only pass was clean; mutation work remains pending.)
- [x] Claude's handoff reports outcome, changed files, exact checks/results, remaining manual checks, a narrowly scoped stage command, and a copy-ready Conventional Commit command. (See session handoff.)

## 12. Notes for AI tools

- Claude is the implementation and verification agent for this specification.
- Read the global spec first, this entire feature spec second, and both completed M14 navigation specs before any implementation edit.
- Start with `git status --short`, `rg --files`, targeted callers/DTO/controller searches, and a complete inspection of every allowed file.
- Complete the Section 10.1 live contract gate before writing status mutation code. Read-only UI/list work may proceed only when it cannot prejudice the unresolved mutation decision.
- Prefer reconfiguring the frontend service adapter. If the verified API cannot satisfy the feature without data loss, use only the documented minimum backend status-contract adjustment and add focused tests.
- Treat `PUT /api/orders/{id}` as dangerous until every required field and round-trip effect is proven; never guess a payload from the DTO alone.
- Preserve the confirmed operation order: status ID 2 first, active-courier assignment second; status ID 3 later without reassignment.
- Keep dirty unassigned non-pending rows out of the mobile list. Do not build an automatic client data-repair tool.
- Reuse existing order/customer behavior only where its full contract fits; after shared changes, re-run the M13 order-history and creation regressions.
- Compare the Courier list and Delivery Details modal to the supplied wireframe, but use the checklist label `Order Delivery` for the tab.
- Do not claim native interaction, live API success, or persistence without observing it.
- If live backend access, safe disposable data, or representative Courier credentials are unavailable, finish only independent work and report the exact blocked criteria.
- After implementation or any material follow-up, append the dated handoff to `.omi/m14/IMPLEMENTATION_LOG.md`; never stage that private log.
- Finish with outcome first, changed files, exact checks/results, manual gaps, the scoped staging command, and a copy-ready commit command.
