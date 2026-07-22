<a id="top"></a>

# AI Feature Specification — Menu Modal Confirmation

> Defines the Order Confirmation modal: the accurate selected-product summary, Confirm Order submission through `POST /api/orders`, and the explicit processing, success, and failure states required by the grading sheet. Use this document together with `ai/ai-spec.md`, `ai/features/navigation-structure.feature.md`, `ai/features/header-footer.feature.md`, `ai/features/restaurant-menu-page.feature.md`, and `ai/features/order-history-page.feature.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow](#user-flow-and-confirmation-logic)
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

- **Feature Name:** Order Confirmation Modal and Order Creation
- **Related Area:** Mobile frontend, protected order-creation API, confirmation submission states, shared currency formatting
- **Specification file:** `ai/features/menu-modal-confirmation.feature.md`
- **Primary component:** `client/components/OrderConfirmationModal.js`
- **Host screen:** `client/app/customer/restaurant/[restaurantId].js`
- **API endpoint:** `POST ${API_BASE_URL}/api/orders`
- **Implementation branch:** `feature/menu-modal-confirmation`

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Goal

Let an authenticated customer review exactly the products they selected on the Restaurant Menu — accurate names, quantities, and correctly formatted prices with a correct total — and place the order with one Confirm Order press.

While the order request is pending, the action button is disabled and reads `Processing Order…`. On success, the button disappears and a green checkmark with a success message appears. On failure, the Confirm Order button reappears with a red X icon and a useful failure message so the customer can retry. Duplicate submissions must be impossible, and every state must match the supplied Order Confirmation wireframe pages exactly.

The Restaurant Menu feature already opens the modal with only positive-quantity products; this feature owns everything that happens inside the modal, including the actual `POST /api/orders` request.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Scope

### In Scope (Included)

- The Order Confirmation modal rendered over the Restaurant Menu screen by `client/components/OrderConfirmationModal.js`.
- Accurate display of every selected product's name, quantity (`x{quantity}`), and line total, plus the order `TOTAL`, from the selection provided by Restaurant Menu.
- Standard currency formatting through the one shared formatter in `client/constants/currency.js` (for example `$20.95`).
- The `CONFIRM ORDER` action button and construction of the exact `POST /api/orders` request body from the current selection, stored `customer_id`, and selected `restaurant_id`.
- Protected submission through the shared `apiClient` with the bearer token and bounded timeout/abort behavior.
- The stable `client/services/orderService.js` facade and focused `client/services/orders/createOrder.js` owner for request-body creation, envelope validation, and order-creation error classification.
- Explicit modal submission states: `idle`, `processing`, `success`, and `error`.
- The disabled `Processing Order…` button state while the request is pending.
- The success state: action button hidden, green checkmark, success message.
- The failure state: Confirm Order restored, red X icon, safe retryable failure message.
- Duplicate-request prevention across rapid taps, retries, and modal lifecycle.
- Close (X) behavior in every state, including the quantity outcome on the menu after success versus after cancel/failure.
- HTTP 401/403 handling through the shared unauthorized/sign-out transition.
- Unmount/abort protection so no state update or duplicate request survives closing the modal or leaving the screen.
- Wireframe-exact layout, palette, typography, scrolling, and accessibility for all four modal states.
- Postman coverage for successful and failed `POST /api/orders`.
- Required per-file Contents headers, detailed inline comments, and accurate handoff staging/commit guidance.

### Out of Scope (Excluded)

- Menu loading, product validation, quantity plus/minus controls, zero-floor enforcement, or the Create Order enable/disable rule; those belong to `restaurant-menu-page.feature.md`.
- Deciding *which* products enter the modal — the menu passes only positive-quantity products; this feature never re-derives or edits the selection.
- Editing quantities inside the modal; the wireframe shows a read-only summary.
- Order History list, its detail modal, or reloading history after a created order; those belong to `order-history-page.feature.md` and `order-history-modal.feature.md`.
- Login, session creation, header/footer implementation, or manual logout; this feature consumes those shared contracts.
- Email/SMS notification behavior beyond sending the literal `send_email: false` and `send_sms: false` request fields.
- Order status updates, courier assignment, ratings, `PUT`/`DELETE` order endpoints, or any other `OrderApiController` route besides `POST /api/orders`.
- Modifying Java controllers, DTOs, services, repositories, database schema, or seeded records.
- Persisting the selection, order draft, or modal state to AsyncStorage.
- Navigating automatically to Order History after success; the wireframe keeps the customer on the success modal until they close it.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Sub-Requirements (Feature Breakdown)

### Requirement A — Modal Contract with Restaurant Menu

- The modal is a controlled component owned by `client/app/customer/restaurant/[restaurantId].js` and receives props only: `visible`, `onClose`, `restaurant` (selected restaurant with a valid `id`), and `selectedProducts`.
- Each selected product carries `id`, `name`, `cost` (raw validated backend integer), and `quantity` (positive integer) exactly as validated by the Restaurant Menu feature.
- The modal never receives, filters in, or renders zero-quantity products; if the host passes an empty selection, Confirm Order must not submit.
- The access token and customer ID never travel through props or route parameters; the order service reads them through the shared session boundary at submission time.
- Add a completion callback prop (for example `onOrderCreated`) so the host menu can reset quantities after a confirmed successful order; the modal itself never mutates menu quantity state directly.

### Requirement B — Accurate Order Summary and Currency Format

- Under the `Order Summary` heading, render one row per selected product showing the product name, the quantity as `x{quantity}`, and the line total (`cost × quantity`).
- Compute the order total as the sum of all line totals from the raw integer costs; never re-parse formatted strings.
- Display the total as `TOTAL: ${amount}` above the action area, matching the wireframe.
- Format every displayed price through the shared `formatProductCost` in `client/constants/currency.js`, which owns the verified `whole-dollars` unit rule; do not duplicate or bypass the formatter.
- Names, quantities, and prices must exactly reflect the menu selection at open time; never display `undefined`, `NaN`, raw JSON, or unformatted integers.
- Long product lists scroll inside the modal panel without hiding the total or the action button.

### Requirement C — Confirm Order Action and Request Body

- Add the `CONFIRM ORDER` button to the modal, shown in the `idle` and `error` states.
- Pressing enabled Confirm Order builds exactly this request body:

```json
{
  "restaurant_id": 1,
  "customer_id": 1,
  "products": [
    {
      "id": 10,
      "quantity": 2
    }
  ],
  "send_email": false,
  "send_sms": false
}
```

- `restaurant_id` is the selected restaurant's validated ID from the host screen.
- `customer_id` is the stored authenticated customer ID read through `client/storage/authStorage.js` / the shared session boundary — never the `user_id`.
- `products` contains only the modal's selected products, each with its real product `id` and current positive `quantity`.
- `send_email` and `send_sms` are sent as literal `false`; the backend `ApiCreateOrderDTO` defaults match, and Module 13 does not exercise notifications.
- Validate before sending: a usable session, a positive restaurant ID, and at least one product with a positive quantity. A failed precondition shows the failure state without making a network request.

### Requirement D — Protected Submission Through the Shared API Client

- Submit with `POST ${API_BASE_URL}/api/orders` through `client/services/apiClient.js` so the environment base URL, JSON handling, bearer `Authorization` header, timeout, and abort behavior stay centralized.
- The endpoint is protected; a missing/expired token must never be retried blindly. Live evidence (2026-07-15): the backend configures no custom `AuthenticationEntryPoint` and no per-role rules on `/api/**`, so Spring Security's default reports a missing, invalid, or expired token as HTTP 403; the client treats both 401 and 403 as the unauthorized sign-out signal.
- Expect the existing HTTP 201 success envelope:

```json
{
  "message": "Success",
  "data": {
    "id": 33,
    "customer_id": 1,
    "restaurant_id": 1,
    "status": "pending",
    "products": [],
    "total_cost": 29
  }
}
```

- Treat HTTP 201 with a `Success` message envelope as the only success signal; `data` is the created order DTO (`ApiOrderDTO`) and may be logged-free and unused beyond optional confirmation details.
- Expect the existing failure shapes:
  - HTTP 400 `{ "error": "Bad Request", "details": "Invalid or missing parameters" }` from `ApiExceptionHandler` when the body is invalid.
  - HTTP 401/403 for a missing/expired token (the current backend emits 403; see above).
  - Network/timeout/abort failures with no HTTP response.
  - HTTP 5xx or malformed envelopes as service/response failures.
- Classify failures in `services/orders/createOrder.js` into user-safe categories; never surface raw server messages, stack traces, or the token.

### Requirement E — Explicit Submission States

- Model the modal's request lifecycle with one explicit state value:

```text
idle → processing → success
                 ↘ error → processing (retry)
```

- `idle`: summary and enabled Confirm Order visible (empty selections keep it unsubmittable).
- `processing`: exactly one request is in flight.
- `success`: the order was created; no further submission is possible from this modal instance.
- `error`: the last attempt failed; retry is available.
- Do not represent this lifecycle with independent booleans that allow impossible combinations (for example success and processing simultaneously).
- Reset the state to `idle` whenever the modal opens for a fresh selection.

### Requirement F — Processing Order… State

- Entering `processing` immediately disables the action button and changes its label to exactly `Processing Order…` (wireframe presentation `PROCESSING ORDER…`).
- The disabled processing button keeps the wireframe's action styling and remains readable; do not swap to unapproved colors.
- The summary stays visible; quantities and prices do not change during processing.
- The button never remains permanently disabled: every outcome (success, failure, timeout) leaves `processing` deterministically.
- Expose the disabled/busy state to accessibility so screen readers announce that the order is being processed.

### Requirement G — Success State

- On a validated HTTP 201 success envelope:
  - The action button disappears entirely (not merely disabled).
  - A green checkmark icon appears in the action area using the approved muted green `#609475`.
  - A success message appears, matching the wireframe copy: `Thank you!` / `Your order has been received.`
- The order summary above the success area remains visible and unchanged.
- The only remaining interaction is closing the modal with the X control.
- After success, closing the modal notifies the host through `onOrderCreated` so the menu resets every quantity to zero and Create Order returns to disabled; the consumed selection must not remain orderable by an accidental second confirm.

### Requirement H — Failure State and Retry

- On any classified failure (400, timeout, network, 5xx, malformed response):
  - The `CONFIRM ORDER` button reappears enabled.
  - A red X icon appears below the action button using the approved dark red `#851919`.
  - A useful, user-safe failure message appears, matching the wireframe copy: `Your order was not processed successfully.` / `Please try again.`
- Retry submits the same current selection again through the same validated path and re-enters `processing`.
- A failure never corrupts the summary, quantities, or total, and never leaves a stale success indicator visible.
- HTTP 401/403 is not a retryable modal failure: invoke the shared unauthorized/sign-out transition, clear stale session state, and return to Login.

### Requirement I — Duplicate-Request Prevention

- At most one `POST /api/orders` request may ever be in flight for the modal.
- Guard the submit handler so rapid taps, double-fire press events, or a stale enabled button cannot start a second request while state is `processing` or `success`.
- Enforce the guard in the handler itself, not only through the disabled prop.
- Closing the modal or unmounting the host screen aborts a pending request and prevents any late response from updating state or being mistaken for a fresh submission.
- A late success response after the customer closed mid-processing must not throw, must not update unmounted state, and must not trigger a second order.

### Requirement J — Close Behavior Across States

- The X close control stays available in every state (`idle`, `processing`, `success`, `error`) as shown in the wireframe header.
- Closing from `idle` or `error` returns to the Restaurant Menu with all current quantities intact so the customer can adjust and reopen.
- Closing from `processing` aborts the pending request (best effort) and preserves menu quantities; the customer may reopen and retry.
- Closing from `success` triggers the host quantity reset described in Requirement G.
- The Android hardware back action (`onRequestClose`) follows the same per-state rules as the X control.
- Reopening the modal always starts a fresh `idle` state built from the menu's current selection.

### Requirement K — Detailed Comments and Per-File Contents

- Every human-authored JavaScript file created or materially changed for this feature begins with a block comment containing the exact file name, one-sentence purpose, and numbered `Contents` list in source order, kept synchronized with the final implementation.
- Add detailed inline comments immediately above non-obvious logic, including:
  - The idle/processing/success/error state model and why booleans are avoided.
  - Request-body construction and why `customer_id` comes from storage rather than props.
  - Duplicate-submission guards and abort/unmount protection.
  - Failure classification and why HTTP 401/403 exits to Login instead of retrying.
  - The success-close quantity-reset contract with the host menu.
  - Reuse of the shared currency formatter and its `whole-dollars` rule.
- Add JSDoc where the order service has non-obvious parameters, normalized return shapes, or thrown errors.
- Remove stale comments — including the current header note that says no API request is made here — before completion.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## User Flow and Confirmation Logic

### Review and Confirm an Order

1. The customer selects positive quantities on Restaurant Menu and presses enabled Create Order.
2. The modal opens in `idle` with the accurate Order Summary, formatted prices, `TOTAL`, and enabled `CONFIRM ORDER`.
3. The customer presses Confirm Order once.
4. The modal validates the session, restaurant ID, and selection, builds the exact request body, and enters `processing`.
5. The action button disables and reads `Processing Order…` while exactly one `POST /api/orders` request is in flight.
6. The service validates the HTTP 201 success envelope.
7. The modal enters `success`: the button disappears, the green checkmark and `Thank you! Your order has been received.` message appear.
8. The customer closes the modal; the menu resets every quantity to zero and Create Order disables.

### Failed Submission and Retry

1. The request fails with 400, a timeout, a network error, or a 5xx/malformed response.
2. The modal enters `error`: `CONFIRM ORDER` reappears with the red X icon and `Your order was not processed successfully. Please try again.`
3. The summary and total remain accurate and unchanged.
4. The customer presses Confirm Order again; the same selection resubmits through the same guarded path.
5. Alternatively the customer closes the modal; menu quantities remain intact for adjustment.

### Cancel Without Ordering

1. The customer opens the modal, reviews the summary, and presses X in `idle`.
2. No request is sent; the menu keeps its current quantities and Create Order stays enabled.

### Expired Session

1. `POST /api/orders` returns HTTP 401/403.
2. The shared unauthorized transition clears stored session data and replaces authenticated routes with Login.
3. No retry, duplicate request, or stale modal state survives the transition.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Frontend Routes and Components

| File | Responsibility |
| --- | --- |
| `client/components/OrderConfirmationModal.js` | Owns the summary rendering, submission state machine, Confirm Order action, processing/success/failure presentation, and per-state close behavior. |
| `client/app/customer/restaurant/[restaurantId].js` | Opens/closes the modal, supplies the validated restaurant and positive-quantity selection, and resets quantities after a successful order via the completion callback. |
| `client/app/customer/_layout.js` | Keeps the shared authenticated header/footer visible behind the modal backdrop. |

### Services and Configuration

- `client/services/orderService.js` — stable public facade exporting `createOrder` for existing callers.
- `client/services/orders/createOrder.js` — focused owner of request-body construction, `POST /api/orders` submission, HTTP 201 envelope validation, and failure classification.
- `client/services/apiClient.js` — existing shared transport: environment base URL, bounded JSON requests, bearer-token header, abort/timeout, and `ApiRequestError` classification.
- `client/constants/currency.js` — existing shared `formatProductCost` and the single `whole-dollars` cost-unit rule.
- `client/constants/theme.js` — exact palette, Oswald/body font families, spacing, and minimum touch targets.

### Storage

- Read `accessToken` and `customerId` only through `client/storage/authStorage.js` / the shared session boundary at submission time.
- This feature creates no new AsyncStorage keys and persists no selection, draft, or modal state.

### Backend / API

`POST ${API_BASE_URL}/api/orders`

- Protected by bearer token; consumed as-is from the existing `OrderApiController`.
- Request body: `restaurant_id`, `customer_id`, `products` (`[{ id, quantity }]`), `send_email: false`, `send_sms: false`.
- Success: HTTP 201 with `{ "message": "Success", "data": <created order DTO> }`.
- Invalid body: HTTP 400 with `{ "error": "Bad Request", "details": "Invalid or missing parameters" }`.
- This feature calls no other endpoint.
- Postman must include a preconfigured successful create-order request and at least one failing request (for example an invalid product ID or missing field) demonstrating the 400 shape.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Data, Validation, and State

### Inputs at Submission Time

| Value | Source | Client type | Rule |
| --- | --- | --- | --- |
| `restaurant.id` | Host menu screen props | Positive integer | Required; becomes `restaurant_id`. |
| `selectedProducts[].id` | Host menu selection | Positive integer | Real backend product ID; never an index. |
| `selectedProducts[].name` | Host menu selection | Non-blank string | Display only; never sent. |
| `selectedProducts[].cost` | Host menu selection | Non-negative integer | Raw backend value; formatted only for display. |
| `selectedProducts[].quantity` | Host menu selection | Positive integer | Becomes `products[].quantity`; zero-quantity items never appear. |
| `customerId` | `authStorage` session | Positive integer string/number | Becomes `customer_id`; never `user_id`. |
| `accessToken` | `authStorage` session | Non-blank string | Bearer header only; never props, logs, or UI. |

### Derived Display Values

- Line total per product: `cost × quantity`, formatted by `formatProductCost`.
- Order total: sum of raw line totals, formatted once for the `TOTAL:` row.
- Totals derive from raw integers at render time; no rounded or formatted intermediate is stored.

### Modal State Machine

| Current state | Event | Next state | Required result |
| --- | --- | --- | --- |
| (closed) | Modal opens with selection | `idle` | Fresh summary; Confirm Order enabled. |
| `idle` | Confirm pressed, preconditions pass | `processing` | One request starts; button disabled as `Processing Order…`. |
| `idle` | Confirm pressed, preconditions fail | `error` | No request; failure presentation with retry. |
| `processing` | HTTP 201 valid envelope | `success` | Button hidden; green checkmark and success message. |
| `processing` | 400 / network / timeout / 5xx / bad envelope | `error` | Confirm Order restored; red X and failure message. |
| `processing` | HTTP 401/403 | (logged out) | Shared sign-out; modal state discarded. |
| `processing` | Extra Confirm press | `processing` | Ignored; no second request. |
| `error` | Confirm pressed | `processing` | Same selection resubmits once. |
| `idle` / `error` | X or back close | (closed) | Menu quantities preserved. |
| `processing` | X or back close | (closed) | Request aborted; quantities preserved; no late state update. |
| `success` | X or back close | (closed) | `onOrderCreated` fires; menu quantities reset to zero. |
| `success` | Confirm attempt | `success` | Impossible; no button exists. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Visual and Accessibility Contract

### Wireframe Composition

- Treat the `Order Confirmation`, `Order Confirmation (processing)`, `Order Confirmation (success)`, and `Order Confirmation (failure)` pages in `client/docs/m13/design/Wireframe.pdf` as the visual source for all four states.
- The modal is a centered white rounded panel over a dimmed Restaurant Menu; the shared header and footer remain visible but inert behind the backdrop.
- Panel hierarchy:
  1. Charcoal header band with the `Order Confirmation` title (white, Oswald) and a white X close control on the right.
  2. `Order Summary` heading.
  3. One row per product: name left, `x{quantity}` center-right, formatted line total right.
  4. Separator, then right-aligned `TOTAL: ${amount}`.
  5. Action area: full-width orange-red `CONFIRM ORDER` button (`idle`/`error`), `PROCESSING ORDER…` (`processing`), or the checkmark/message block (`success`).
  6. Result iconography/message below or in place of the action per state: green check with `Thank you! Your order has been received.` on success; red X with `Your order was not processed successfully. Please try again.` on failure.

### Colors and Typography

- Use only centralized palette values: orange-red `#DA583B` for the action button, charcoal `#222126` for the header band and text, muted green `#609475` for the success checkmark, dark red `#851919` for the failure X, and white `#FFFFFF` surfaces.
- Titles and the total use the Oswald treatment; summary rows use the platform-safe body font, matching the established menu components.
- The processing button remains the approved action color with a readable disabled treatment; do not invent new colors for any state.

### Accessibility

- The modal traps context (`accessibilityViewIsModal`) and labels itself with the restaurant, for example `Order confirmation for Sweet Dragon`.
- The title uses header semantics; each summary row exposes a spoken form such as `2 of Cheeseburger, $18.00`.
- Confirm Order is a labeled button; during processing it exposes disabled/busy semantics and the `Processing Order…` label.
- Success and failure announce their messages to screen readers when they appear; icons alone never carry the outcome.
- The X close control is a labeled button meeting the minimum touch target in every state.
- Long summaries remain scrollable and the action area reachable with large text sizes.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Expected Behavior

| Situation | Expected behavior |
| --- | --- |
| Modal opens from Create Order | Accurate names, `x` quantities, formatted prices, and total for exactly the positive-quantity selection. |
| Prices displayed | Every value uses the shared formatter, for example `$20.95`; no raw integers. |
| Confirm pressed once | Exactly one `POST /api/orders` with the exact body contract and bearer token. |
| Request pending | Button disabled, label `Processing Order…`, summary unchanged. |
| Confirm tapped rapidly | Only one request; extra presses ignored during processing/success. |
| HTTP 201 success | Button disappears; green checkmark; `Thank you! Your order has been received.` |
| Close after success | Menu quantities reset to zero; Create Order disabled. |
| HTTP 400 / network / 5xx failure | Confirm Order restored; red X; `Your order was not processed successfully. Please try again.` |
| Retry after failure | Same selection resubmits through the same guarded path. |
| Close from idle/error/processing | No order created; menu quantities preserved; pending request aborted. |
| HTTP 401/403 | Shared sign-out clears the session and returns to Login; no retry. |
| Late response after close | No crash, no state update, no duplicate order. |
| Long selection list | Summary scrolls inside the panel; total and action stay reachable. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Technical Constraints (Feature-Level)

- Use JavaScript to match the current client; do not introduce TypeScript for only this feature.
- Extend the existing `client/components/OrderConfirmationModal.js`; do not create a parallel modal component.
- Keep the modal a controlled component; the host menu owns `visible` and the selection, and receives success completion through a callback.
- Use the existing Spring Boot API as-is; do not modify `server/`.
- Route the request through the shared `apiClient`; do not call `fetch` directly or duplicate token/timeout handling.
- Reuse `formatProductCost` for every displayed price; do not add a second currency formatter.
- Model the submission lifecycle as one explicit state value; avoid impossible boolean combinations.
- Send only positive-quantity products; never send zero quantities, `send_email`/`send_sms` `true`, or invented fields.
- Use centralized palette, typography, spacing, and minimum touch-target values from `client/constants/theme.js`.
- Follow global naming, file header/Contents, inline-comment, logging, secret, request, error, testing, branch, staging-command, and commit-message rules.
- Do not add navigation side effects (for example jumping to Order History) that the wireframe does not show.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Acceptance Criteria

### Summary Accuracy and Currency

- [x] The modal shows exactly the positive-quantity products passed by Restaurant Menu with accurate names and quantities.
- [x] Each row shows the correct formatted line total and the `TOTAL:` row equals the sum of raw line totals.
- [x] Every price uses the shared formatter with a currency symbol and two decimals (for example `$20.95`).
- [x] No zero-quantity product, `undefined`, `NaN`, or unformatted value ever renders.

### Submission and Request Contract

- [x] Confirm Order sends `POST /api/orders` with the exact documented body: `restaurant_id`, stored `customer_id`, positive-quantity `products`, `send_email: false`, `send_sms: false`.
- [x] The request goes through the shared `apiClient` with the bearer token and bounded timeout.
- [x] Only HTTP 201 with the validated `{ message, data }` envelope counts as success.
- [x] At most one request is ever in flight; rapid taps and stale presses cannot duplicate it.
- [x] Closing or unmounting aborts a pending request and no late response updates state or creates a duplicate order.

### State Presentation

- [x] While pending, the action button is disabled and reads `Processing Order…`.
- [x] On success the button disappears and the green checkmark with `Thank you! Your order has been received.` appears.
- [x] On failure the Confirm Order button reappears with the red X icon and `Your order was not processed successfully. Please try again.`
- [x] Retry after failure resubmits the same selection and can succeed.
- [x] No button is ever left permanently disabled after a failed request.
- [x] HTTP 401/403 triggers the shared sign-out to Login instead of a modal retry state.

### Close Behavior and Menu Integration

- [x] The X control (and Android back) works in every state.
- [x] Closing from idle, error, or processing preserves current menu quantities.
- [x] Closing after success resets every menu quantity to zero and disables Create Order.
- [x] Reopening the modal always starts fresh in `idle` from the menu's current selection.

### Visual, Accessibility, and Documentation

- [ ] All four modal states closely match the supplied Order Confirmation wireframe pages.
- [x] Only the exact graded palette is used: orange-red action, charcoal header/text, muted-green checkmark, dark-red failure X, white surfaces.
- [x] The modal, rows, buttons, and result messages have correct roles, labels, disabled/busy semantics, and touch targets; outcomes are announced, not color-only.
- [x] Every changed human-authored JavaScript file has an accurate file name, purpose, numbered Contents list, and required detailed comments/JSDoc, with stale pre-submission notes removed.
- [x] Postman contains preconfigured successful and failed `POST /api/orders` requests demonstrating the documented success and 400 shapes.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Definition of Done

This feature is complete only when:

- Every in-scope sub-requirement and acceptance criterion passes against the existing Java API.
- The Order Confirmation modal contains the Confirm Order action, order service submission, and all four wireframe states.
- A real order created through the modal is verified as HTTP 201 in Postman/logs and subsequently appears in the customer's `GET /api/orders?type=customer&id={customerId}` history.
- Processing, success, failure, retry, duplicate-prevention, abort-on-close, and 401 paths are each exercised deliberately (using a failing request such as an invalid body to prove the failure state).
- Success-close resets the menu quantities to zero and cancel-close preserves them, verified in the running app.
- All four states closely match the wireframe on representative iPhone and Android dimensions with exact palette values.
- Relevant service/component tests, Expo iOS/Android bundle exports, Postman requests, and `git diff --check` pass; any unavailable live test is reported exactly rather than claimed.
- All changed source files retain accurate Contents headers and detailed comments next to non-obvious logic.
- The implementation follows `feature/menu-modal-confirmation` → `dev` workflow, and the final AI handoff provides the exact scoped staging command before its copy-ready commit message.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Notes for the AI

- Read `ai/ai-spec.md` and this entire feature file before implementation.
- The grading sheet is authoritative: accurate details, standard currency format, disabled `Processing Order…` while awaiting the API, success hides the button with a green checkmark and message, failure restores Confirm Order with a red X and message.
- `client/components/OrderConfirmationModal.js` owns the selected-product summary and the complete order-submission state machine.
- The API responds with the `{ "message": "Success", "data": ... }` envelope and HTTP 201 on create; failures use `{ "error", "details" }`. Do not assume a bare object or a `success` boolean.
- `customer_id` comes from stored session data (`authStorage`), never from `user_id`, props, or route parameters.
- Enforce the single-request guard inside the submit handler even though the button is disabled during processing.
- The success-close quantity reset is a host-menu responsibility triggered by the modal's completion callback; the modal must not reach into menu state.
- The success/failure message copy in this spec comes from the wireframe pages; keep it exact.
- Reuse `formatProductCost` and its documented `whole-dollars` rule. Live `GET /api/products` evidence gathered during this feature (2026-07-15) confirmed untouched seeded products carry whole-dollar integer costs (10–24); a few locally polluted rows (for example `Updated Burger`, cost `1499`) come from earlier backend test runs, not the seeded contract, so the rule stands.
- Preserve unrelated user changes and do not modify the Java backend.
- If implementation evidence changes an endpoint, field, envelope, or lifecycle behavior, update this feature spec before continuing.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
