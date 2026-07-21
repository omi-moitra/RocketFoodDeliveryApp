<a id="top"></a>

# AI Feature Specification — Order History Page

> Defines the authenticated Order History tab: loading the current customer's orders, the structured `ORDER` / `STATUS` / `VIEW` table from the wireframe, and the View action that opens the Order History Detail modal. Use this document together with `ai/ai-spec.md`, `ai/features/navigation-structure.feature.md`, `ai/features/header-footer.feature.md`, `ai/features/menu-modal-confirmation.feature.md`, and `ai/features/order-history-modal.feature.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow](#user-flow-and-order-history-logic)
6. [Interfaces](#interfaces-pages-components-services-storage-and-endpoints)
7. [Data, Validation, and State](#data-validation-and-state)
8. [Visual and Accessibility Contract](#visual-and-accessibility-contract)
9. [Expected Behavior](#expected-behavior)
10. [Technical Constraints](#technical-constraints-feature-level)
11. [Acceptance Criteria](#acceptance-criteria)
12. [Feature Definition of Done](#feature-definition-of-done)
13. [Notes for the AI](#notes-for-the-ai)

---

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Identity

- **Feature Name:** Customer Order History Page
- **Related Area:** Mobile frontend, protected order-listing API, footer-tab navigation, detail-modal entry
- **Specification file:** `ai/features/order-history-page.feature.md`
- **Screen route:** `client/app/customer/order-history.js`
- **API endpoint:** `GET ${API_BASE_URL}/api/orders?type=customer&id={customerId}`
- **Implementation branch:** `feature/order-history-page`

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Goal

Show an authenticated customer every order they have placed, as a structured table with exactly the wireframe's three headings — `ORDER`, `STATUS`, and `VIEW` — where each row displays the order's restaurant name, its current status, and a View action that opens the Order History Detail modal for that exact order.

Orders load for the stored authenticated `customer_id` (never `user_id`) with the bearer token, and the list must include orders created moments earlier through the Order Confirmation modal. This feature owns the page, the request, the table, and opening the modal with the correct selected order object; everything rendered inside the modal belongs to `order-history-modal.feature.md`.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Scope

### In Scope (Included)

- The implemented Order History screen at `client/app/customer/order-history.js` inside the existing customer tab layout.
- Protected loading of the current customer's orders via `GET /api/orders?type=customer&id={customerId}` through the shared `apiClient`.
- Reading `customerId` and the access token only through the shared session boundary (`client/storage/authStorage.js`).
- Validation and normalization of the API's `{ message, data }` envelope and each returned order object at the service boundary.
- Extending `client/services/orderService.js` with a `fetchCustomerOrders` function alongside the existing order-creation logic.
- The `MY ORDERS` page heading and the structured table with exact column headings `ORDER`, `STATUS`, and `VIEW`.
- One row per order showing the restaurant name, the order status in the wireframe's uppercase presentation, and the View (magnifier) action.
- Opening the Order History Detail modal with the complete selected order object when View is pressed.
- Refreshing the order list when the tab regains focus so a newly created order appears without a manual app reload.
- Safe handling of orders with missing courier data (a valid pending state) and other nullable fields.
- Loading, empty ("no orders yet"), connection, service/response, retry, and expired-session (HTTP 401/403) behavior.
- Stale-request, rapid-tap, and unmount protection.
- Shared authenticated header/footer integration, vertical scrolling for long histories, safe areas, accessibility, and representative iOS/Android layouts.
- Postman coverage for the customer order-history request.
- Required per-file Contents headers, detailed inline comments, and accurate handoff staging/commit guidance.

### Out of Scope (Excluded)

- The Order History Detail modal's content, layout, and close behavior; those belong to `order-history-modal.feature.md`. This page only opens it with the right data.
- Creating orders, the confirmation modal, or menu quantity state; those belong to `restaurant-menu-page.feature.md` and `menu-modal-confirmation.feature.md`.
- Restaurant List, filters, or menu navigation.
- Login, session creation, header/footer implementation, or manual logout; this feature consumes those shared contracts.
- Courier or restaurant order views (`type=courier`, `type=restaurant`), pending-order queues, or any other `OrderApiController` route besides the customer `GET /api/orders` query.
- Order status updates, cancellation, reordering, ratings, pagination, search, or filtering of history entries not shown by the wireframe.
- Modifying Java controllers, DTOs, services, repositories, database schema, or seeded records.
- Persisting orders to AsyncStorage or inventing a per-order detail endpoint; the detail modal uses the already-returned order object.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Sub-Requirements (Feature Breakdown)

### Requirement A — Protected Customer-Scoped Request

- After the tab mounts (or regains focus) with a usable session, request:

```text
GET ${API_BASE_URL}/api/orders?type=customer&id={customerId}
```

- `type` is exactly the literal `customer`; `id` is the stored authenticated `customer_id`, never `user_id`.
- Send `Authorization: Bearer <accessToken>` through the shared `apiClient` with its bounded timeout/abort behavior.
- Resolve the base URL from `EXPO_PUBLIC_API_URL`; never hard-code localhost, a personal ngrok URL, credentials, or a token.
- A missing or corrupt stored session is treated as logged out through the shared session boundary; make no request in that case.
- Cancel obsolete requests when the screen unmounts or a newer refresh supersedes them; a late response must never overwrite newer data.

### Requirement B — Response Envelope and Order Validation

- Expect the existing HTTP 200 success envelope with an array payload:

```json
{
  "message": "Success",
  "data": [
    {
      "id": 33,
      "customer_id": 1,
      "customer_name": "Example Customer",
      "customer_address": "123 Example Street",
      "restaurant_id": 1,
      "restaurant_name": "Sweet Dragon",
      "restaurant_address": "456 Example Avenue",
      "courier_id": null,
      "courier_name": null,
      "status": "pending",
      "products": [
        {
          "product_id": 10,
          "product_name": "Cheeseburger",
          "quantity": 2,
          "unit_cost": 9,
          "total_cost": 18
        }
      ],
      "total_cost": 18,
      "created_on": "2026-07-15T10:30:00"
    }
  ]
}
```

- Treat `data` as an array; a valid empty array is the empty history state, not an error.
- Validate each order at the service boundary:
  - `id` is a unique positive integer (list key; never an array index).
  - `restaurant_name` is a non-blank string for the `ORDER` column.
  - `status` is a non-blank string (seeded value such as `pending`).
  - `courier_id` and `courier_name` may be `null` — a valid not-yet-assigned state that must never render as `undefined` or crash.
  - `products` is an array whose entries carry `product_id`, `product_name`, `quantity`, `unit_cost`, and `total_cost` integers.
  - `total_cost` is a non-negative integer and `created_on` is an ISO-style date-time value.
- Preserve the complete validated order object (all fields above) so the detail modal receives everything it needs without another request.
- Skip-and-log (development-safe) or reject malformed entries rather than rendering broken rows; never render raw JSON.

### Requirement C — MY ORDERS Table Structure

- Display the page heading exactly `MY ORDERS`.
- Render a structured table whose header row contains exactly the three column headings `ORDER`, `STATUS`, and `VIEW`, styled as the wireframe's charcoal band with white text.
- Render one body row per validated order, in the order returned by the API:
  - `ORDER` column: the order's restaurant name.
  - `STATUS` column: the order status displayed in uppercase (`pending` → `PENDING`) to match the wireframe while preserving the raw status value in state.
  - `VIEW` column: the magnifier View action for that row.
- Keep the three columns aligned between header and body rows, with long restaurant names wrapping or truncating without breaking alignment.
- Long histories scroll vertically between the persistent header and footer; the table header should remain visually associated with its rows.
- Never display `undefined`, `null`, raw JSON, or misaligned placeholder cells.

### Requirement D — View Action Opens the Detail Modal

- Each row's `VIEW` cell contains a pressable magnifier icon (FontAwesome), matching the wireframe.
- Pressing View opens the Order History Detail modal governed by `order-history-modal.feature.md`, passing the complete validated order object already held in state.
- Do not invent or call a per-order detail endpoint; the list response is the modal's data source.
- Exactly one modal can be open at a time; rapid or repeated taps must not stack modals or open the wrong order.
- Closing the modal returns to the unchanged, still-scrolled order list without refetching.
- The View action for row N must always open order N's data; never index-match across sorted/filtered copies.

### Requirement E — Refresh on Focus and New-Order Visibility

- Load orders when the screen first mounts with a usable session.
- Reload orders when the Order History tab regains focus (for example via Expo Router/React Navigation focus effects) so an order created moments earlier in the confirmation modal appears without an app restart.
- A focus refresh must not flash away existing rows: keep current data visible while refreshing and replace it only with a newer validated result.
- Guard against overlapping requests: a refresh while one is pending either reuses the in-flight request or supersedes it safely.
- Failed refreshes with existing data keep the existing list visible with a non-destructive error indication and retry, rather than replacing rows with a full-screen error.

### Requirement F — Loading, Empty, Error, Retry, and Session States

- **Loading (first load):** Show visible progress without hiding the shared authenticated header/footer.
- **Empty:** A valid empty array shows a deliberate no-orders message (for example that orders will appear here after the first purchase); it is not an error and shows no retry-styled alarm.
- **Connection/timeout:** Show a concise retryable connection message.
- **HTTP 400/5xx/malformed envelope:** Show a generic service/response message with retry; never surface raw server internals.
- **HTTP 401/403:** Invoke the shared unauthorized/sign-out transition, clear stale session state, and return to Login.
- **Retry:** Repeats the same customer-scoped request; the button is never left permanently disabled after a failure.
- Distinguish initial loading, focus refreshing, empty, error, and rendered data as explicit states; avoid impossible boolean combinations.
- Abort pending requests and avoid state updates after unmount.

### Requirement G — Detailed Comments and Per-File Contents

- Every human-authored JavaScript file created or materially changed for this feature begins with a block comment containing the exact file name, one-sentence purpose, and numbered `Contents` list in source order, kept synchronized with the final implementation.
- Keep the implemented purpose/Contents header in `order-history.js` accurate as the screen evolves.
- Add detailed inline comments immediately above non-obvious logic, including:
  - Why `type=customer` and the stored `customer_id` (not `user_id`) scope the request.
  - Envelope/array validation and the nullable-courier rule.
  - The uppercase status display transform versus the preserved raw value.
  - Focus-refresh behavior and overlapping-request protection.
  - Why the detail modal receives the already-returned order object instead of a new endpoint call.
  - Stale-response and unmount protection.
- Add JSDoc where `fetchCustomerOrders` documents parameters, the normalized return shape, and thrown errors.
- Remove stale comments before completion.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## User Flow and Order History Logic

### View Order History

1. The customer presses the Order History footer tab.
2. The screen resolves the stored session and enters loading.
3. It requests `GET /api/orders?type=customer&id={customerId}` with the bearer token.
4. The service validates the envelope and each order object.
5. The `MY ORDERS` heading and the `ORDER` / `STATUS` / `VIEW` table render one row per order with restaurant name, uppercase status, and the magnifier icon.

### Inspect an Order

1. The customer presses the View icon on one row.
2. The screen opens the Order History Detail modal with that row's complete order object.
3. Modal content and closing behavior follow `order-history-modal.feature.md`.
4. Closing returns to the unchanged list without refetching.

### See a Newly Created Order

1. The customer completes an order through the confirmation modal on the menu.
2. They switch to the Order History tab.
3. The focus refresh reloads the customer's orders and the new order appears in the table.

### Empty, Failure, or Expired Session

1. A valid empty array shows the deliberate no-orders state.
2. A connection/service/response failure shows a safe message with retry; existing rows survive a failed refresh.
3. HTTP 401/403 runs the shared unauthorized transition, clears the session, and returns to Login.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Frontend Routes and Layouts

| File | Responsibility |
| --- | --- |
| `client/app/customer/order-history.js` | Owns the order-history request state, validated order list, table rendering, focus refresh, and detail-modal visibility/selection. |
| `client/app/customer/_layout.js` | Supplies the shared authenticated header and the persistent Restaurants / Order History footer tabs. |

### Components

- `client/components/OrderHistoryRow.js` — renders the restaurant name, uppercase status, and View action for one table row.
- `client/components/OrderHistoryModal.js` — detail modal component governed by `order-history-modal.feature.md`; this page only controls its visibility and selected order.
- Reuse shared loading/error primitives only if they preserve the page-specific empty, error, and retry distinctions.

### Services and Configuration

- `client/services/orderService.js` — extended with `fetchCustomerOrders({ signal })` owning query construction, envelope/array validation, per-order normalization, and error classification; order creation already lives here. Like `createOrder`, it reads `customerId` and the token from the shared session boundary at request time instead of taking them as parameters.
- `client/services/apiClient.js` — existing shared transport: environment base URL, bounded JSON requests, bearer-token header, abort/timeout, and error classification.
- `client/constants/theme.js` — exact palette, Oswald/body font families, spacing, and minimum touch targets.
- `client/constants/currency.js` — shared formatter available to the detail modal; the table itself displays no prices.

### Storage

- Read `accessToken` and `customerId` only through `client/storage/authStorage.js` / the shared session boundary.
- This feature creates no new AsyncStorage keys.
- Keep the order list, request state, and modal visibility/selection in screen state; never persist them merely to navigate.

### Backend / API

`GET ${API_BASE_URL}/api/orders?type=customer&id={customerId}`

- Protected by bearer token; consumed as-is from the existing `OrderApiController`.
- `type` must be exactly `customer` (other values serve courier/restaurant views outside this app's scope); an invalid type returns HTTP 400 `{ "error": "Bad Request", "details": ... }`.
- Success: HTTP 200 with `{ "message": "Success", "data": [ ...order objects... ] }` as documented in Requirement B; an unknown customer or no orders yields an empty array.
- This feature calls no other endpoint.
- Postman must include the preconfigured customer order-history request using collection variables for the customer ID and token so graders edit nothing.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Data, Validation, and State

### Request Inputs

| Value | Source | Client type | Rule |
| --- | --- | --- | --- |
| `customerId` | `authStorage` session | Positive integer | Required; becomes the `id` query parameter; never `user_id`. |
| `accessToken` | `authStorage` session | Non-blank string | Bearer header only; never route/log/UI data. |
| `type` | Constant | Literal `customer` | Never user-editable in this app. |

### Order Data (per returned order)

| API field | Type | Rule |
| --- | --- | --- |
| `id` | Positive integer | Unique row key; passed to the modal. |
| `restaurant_name` | Non-blank string | `ORDER` column display. |
| `status` | Non-blank string | Displayed uppercase; raw value preserved. |
| `courier_id` / `courier_name` | Integer/string or `null` | Nullable pending state; must render safely in the modal. |
| `customer_*`, `restaurant_*` | Strings/integers | Preserved for the modal; not shown in the table. |
| `products[]` | Array | Each entry: `product_id`, `product_name`, `quantity`, `unit_cost`, `total_cost` integers; preserved for the modal. |
| `total_cost` | Non-negative integer | Preserved raw for the modal's shared currency formatting. |
| `created_on` | ISO date-time value | Preserved for the modal's order-date display. |

### Screen States

Use explicit states rather than overlapping booleans:

```text
resolving → loading → ready
                    ↘ empty
                    ↘ error
ready → refreshing → ready
ready → modal-open → ready
```

- `resolving`: Session prerequisites are being validated.
- `loading`: The first request is pending with no data yet.
- `ready`: One or more validated orders render in the table.
- `empty`: A valid empty array; deliberate no-orders message.
- `error`: A retryable non-auth failure with no usable data.
- `refreshing`: A focus/retry reload while existing rows stay visible.
- `modal-open`: The detail modal owns interaction for one selected order.
- HTTP 401/403 transitions the shared application session to logged out rather than remaining a page state.

### State Transitions

| Current state | Event | Next state | Required result |
| --- | --- | --- | --- |
| `resolving` | Usable session | `loading` | Start the customer-scoped request. |
| `resolving` | Missing/corrupt session | logged out | Shared logged-out handling; no request. |
| `loading` | Valid non-empty array | `ready` | Render all rows in API order. |
| `loading` | Valid empty array | `empty` | Show the no-orders message. |
| `loading` | Non-auth failure | `error` | Safe message and retry. |
| `error` | Retry pressed | `loading` | Same request repeats. |
| `ready` | Tab regains focus | `refreshing` | Reload without hiding current rows. |
| `refreshing` | Newer valid result | `ready` | Replace list only with validated data. |
| `refreshing` | Failure | `ready` | Keep existing rows; non-destructive error indication. |
| `ready` | View pressed on a row | `modal-open` | Open one modal with that exact order object. |
| `modal-open` | Modal closes | `ready` | List, scroll position, and data unchanged. |
| Any authenticated state | HTTP 401/403 | logged out | Clear session and return to Login. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Visual and Accessibility Contract

### Wireframe Composition

- Treat the `Order History` page in `client/docs/m13/design/Wireframe.pdf` as the visual source.
- Preserve this hierarchy inside the shared authenticated frame:
  1. `MY ORDERS` heading.
  2. Charcoal table-header band with white `ORDER`, `STATUS`, and `VIEW` labels.
  3. One aligned row per order: restaurant name, uppercase status, magnifier View icon.
- Keep the shared logo/Log Out header above and the Restaurants/Order History tabs below; the Order History tab shows its active state.
- Table rows scroll vertically between those shared areas without covering controls.

### Colors and Typography

- Use only centralized project palette values:
  - Orange-red: `#DA583B`.
  - Charcoal: `#222126` (table-header band background).
  - Dark red: `#851919`.
  - Muted green: `#609475`.
  - Warm yellow: `#F0CB67`.
  - White: `#FFFFFF` (table-header text, page surface).
- `MY ORDERS` and the table headings use the Oswald treatment shown in the wireframe; row text uses the platform-safe body font.
- Match the wireframe's compact row height, spacing, and light page surface rather than generic list styling.

### Accessibility

- `MY ORDERS` uses header semantics.
- The table exposes a meaningful reading order: each row announces the restaurant name, status, and View action together, for example `Sweet Dragon, status pending, view order details`.
- Each View icon is a labeled button (for example `View details for Sweet Dragon order`) meeting the global minimum touch target; the icon alone never carries unlabeled meaning.
- Status does not rely on color to convey meaning.
- Loading, empty, refresh, and error states are announced without producing repeated noisy announcements.
- Rows and controls remain readable and aligned at larger text sizes.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Expected Behavior

| Situation | Expected behavior |
| --- | --- |
| Tab opened with a valid session | Orders load for the stored `customer_id` with the bearer token. |
| Orders exist | `MY ORDERS` table renders one aligned row per order with restaurant name, uppercase status, and View icon. |
| No orders exist | Deliberate empty message; no error styling, no retry alarm. |
| View pressed | Exactly one detail modal opens with that row's complete order object. |
| Modal closed | The list, data, and scroll position are unchanged; no refetch. |
| Order just created in confirmation modal | Switching to the tab refreshes and shows the new order. |
| Refresh fails with data on screen | Existing rows remain; non-destructive error indication with retry. |
| First load fails | Safe retryable error state; retry repeats the same request. |
| Order has no courier yet | The row and stored object handle `null` courier data safely; nothing renders as `undefined`. |
| HTTP 401/403 | Shared sign-out clears the session and returns to Login. |
| Late/stale response | Never overwrites newer data or updates an unmounted screen. |
| Long history | All rows reachable by vertical scrolling between header and footer. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Technical Constraints (Feature-Level)

- Use JavaScript to match the current client; do not introduce TypeScript for only this feature.
- Keep the implemented screen inside the existing tab route `client/app/customer/order-history.js`; do not move or rename the route.
- Use the existing Spring Boot API as-is; do not modify `server/`.
- Route the request through the shared `apiClient`; do not call `fetch` directly or duplicate token/timeout handling.
- Extend the existing `client/services/orderService.js` rather than creating a second overlapping order service.
- Build the table with React Native components (a virtualized list such as `FlatList` with a fixed header row is appropriate); do not render browser-only React Bootstrap DOM components.
- Key rows by order `id`; never by array index.
- Preserve backend snake_case keys at the service boundary and map to client camelCase once if beneficial, per the global naming rules.
- Keep the raw `status`, costs, and `created_on` values intact for the detail modal; display transforms (uppercase status) happen at the rendering boundary.
- Use centralized palette, typography, spacing, and minimum touch-target values from `client/constants/theme.js`.
- Follow global naming, file header/Contents, inline-comment, logging, secret, request, error, testing, branch, staging-command, and commit-message rules.
- Keep list rendering separate from modal content; do not implement the modal's interior in this feature.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Acceptance Criteria

### Request and Data

- [x] The request is exactly `GET /api/orders?type=customer&id={customerId}` with the stored customer ID and bearer token via the shared `apiClient`.
- [x] `customer_id` from storage — never `user_id` — scopes the request.
- [x] The `{ message, data }` envelope and each order object are validated at the service boundary.
- [x] A valid empty array renders the empty state, not an error.
- [x] Orders with `null` courier fields load and render safely.
- [x] The complete validated order object is preserved in state for the detail modal; no per-order detail endpoint is called.

### Table and View Action

- [x] The page heading is exactly `MY ORDERS`.
- [x] The table header row contains exactly `ORDER`, `STATUS`, and `VIEW` on the charcoal band.
- [x] Each row shows the restaurant name, the uppercase status, and the magnifier View icon, aligned with the headings.
- [x] Pressing View opens the Order History Detail modal with exactly that row's order object.
- [x] Rapid or repeated View taps never stack modals or open the wrong order.
- [x] Closing the modal returns to the unchanged list without refetching.

### Refresh and States

- [x] Orders load on first mount and reload when the tab regains focus.
- [x] An order created moments earlier through the confirmation modal appears after switching to the tab.
- [x] A focus refresh keeps existing rows visible and replaces them only with newer validated data.
- [x] Initial loading, refreshing, empty, error, and rendered data are distinct states with no impossible combinations.
- [x] Retry repeats the same request and no control is left permanently disabled after a failure.
- [x] HTTP 401/403 triggers the shared sign-out to Login.
- [x] Late/stale responses never overwrite newer data or update an unmounted screen.

### Visual, Accessibility, and Documentation

- [ ] The page closely matches the supplied Order History wireframe, including the charcoal header band and magnifier icons.
- [x] Only the exact graded palette and shared Oswald/body typography are used.
- [x] Long histories scroll between the persistent shared header and footer on iOS and Android.
- [x] Rows and View buttons have correct roles, labels, reading order, and touch targets; status never relies on color alone.
- [x] Every changed human-authored JavaScript file has an accurate file name, purpose, numbered Contents list, and required detailed comments/JSDoc.
- [x] Postman contains the preconfigured customer order-history request needing no manual query edits.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Definition of Done

This feature is complete only when:

- Every in-scope sub-requirement and acceptance criterion passes against the existing Java API.
- The Order History screen is the real `MY ORDERS` table with accurate customer-scoped data.
- A live end-to-end check confirms an order created through the confirmation modal appears in the table after switching tabs.
- Loading, empty, error, retry, focus-refresh, stale-request, nullable-courier, and expired-session paths are each exercised deliberately.
- View opens the detail modal with the correct complete order object, verified for at least two different orders.
- The page closely matches the wireframe and remains accessible/scrollable at representative iPhone and Android dimensions.
- Relevant service/component tests, Expo iOS/Android bundle exports, Postman requests, and `git diff --check` pass; any unavailable live test is reported exactly rather than claimed.
- All changed source files retain accurate Contents headers and detailed comments next to non-obvious logic.
- The implementation follows `feature/order-history-page` → `dev` workflow, and the final AI handoff provides the exact scoped staging command before its copy-ready commit message.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Notes for the AI

- Read `ai/ai-spec.md` and this entire feature file before implementation.
- The grading sheet is authoritative: a structured table with headings `Order`, `Status`, and `View`, and a View button/icon that opens the Order History Detail modal.
- The API responds with the `{ "message": "Success", "data": [...] }` envelope; do not assume a bare array.
- Backend field names are snake_case (`restaurant_name`, `courier_name`, `total_cost`, `created_on`, and per-product `product_id`, `product_name`, `quantity`, `unit_cost`, `total_cost`); map them once at the service boundary if camelCase is used in the client.
- Seeded statuses arrive lowercase (for example `pending`); the wireframe shows uppercase (`PENDING`). Uppercase is a display transform — keep the raw value in state for the modal.
- A `null` courier is a valid pending order, required by the grading sheet to display safely; never coerce it to the string `undefined` or crash.
- The detail modal's data source is the selected returned order object; do not invent a detail endpoint.
- The table shows no prices; costs and `created_on` are preserved for the modal, which reuses the shared `formatProductCost` and its `whole-dollars` rule.
- Reuse `client/services/orderService.js` from the confirmation feature; add `fetchCustomerOrders` beside `createOrder` rather than creating a parallel service.
- Preserve unrelated user changes and do not modify the Java backend.
- If implementation evidence changes an endpoint, field, envelope, or lifecycle behavior, update this feature spec before continuing.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
