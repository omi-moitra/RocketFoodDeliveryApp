# AI Feature Specification — Order History Modal

> Defines the Order History Detail modal's interior: the restaurant-name header with accurate date, status, and courier lines, the product rows with correct quantities and prices, and the order total — all rendered from the already-loaded order object selected on the Order History page. Use this document together with `ai/ai-spec.md`, `ai/features/navigation-structure.feature.md`, `ai/features/header-footer.feature.md`, `ai/features/order-history-page.feature.md`, and `ai/features/menu-modal-confirmation.feature.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow](#user-flow-and-detail-modal-logic)
6. [Interfaces](#interfaces-pages-components-services-storage-and-endpoints)
7. [Data, Validation, and State](#data-validation-and-state)
8. [Visual and Accessibility Contract](#visual-and-accessibility-contract)
9. [Expected Behavior](#expected-behavior)
10. [Technical Constraints](#technical-constraints-feature-level)
11. [Acceptance Criteria](#acceptance-criteria)
12. [Feature Definition of Done](#feature-definition-of-done)
13. [Notes for the AI](#notes-for-the-ai)

---

## Feature Identity

- **Feature Name:** Order History Detail Modal
- **Related Area:** Mobile frontend, order-detail presentation, shared currency formatting, nullable-courier display
- **Specification file:** `ai/features/order-history-modal.feature.md`
- **Primary component:** `client/components/OrderHistoryModal.js`
- **Host screen:** `client/app/customer/order-history.js`
- **API endpoint:** None — renders the order object already returned by `GET /api/orders?type=customer&id={customerId}`
- **Implementation branch:** `feature/order-history-modal`

## Feature Goal

Show an authenticated customer the complete, accurate details of one selected past order: which restaurant it came from, when it was placed, its current status, the courier assigned to it (or a safe blank when none is assigned yet), every ordered product with its quantity and price, and the correct order total.

The grading sheet requires that the modal shows the correct date, status, courier name, products, prices, and totals, and that a missing courier — a valid pending state — never renders as `undefined` or crashes. The Order History page already loads, validates, and passes the selected order object; this feature owns everything rendered inside the modal. No new API request is made.

## Feature Scope

### In Scope (Included)

- Completing the interior of the existing modal shell in `client/components/OrderHistoryModal.js`; the shell's backdrop, panel, and close control were staged by the Order History page feature.
- The wireframe header block: the restaurant name as the modal title, with `Order Date:`, `Status:`, and `Courier:` lines and the X close control.
- A human-readable order date formatted from the normalized `createdOn` value.
- The uppercase status presentation (`pending` → `PENDING`) from the preserved raw status.
- Safe courier display: the courier's name when assigned, and a deliberate blank value when `courierName` is `null`.
- One row per ordered product showing the product name, `x{quantity}`, and the formatted line total.
- The `TOTAL:` row from the order's total cost.
- Standard currency formatting for every price through the shared `formatProductCost` in `client/constants/currency.js` (for example `$20.75`).
- Correct re-rendering when a different order is viewed next; no stale content from a previously viewed order.
- Close behavior via the X control and the Android back action, returning to the unchanged Order History list.
- Long product lists scrolling inside the panel without hiding the total.
- Wireframe-exact layout, palette, typography, and accessibility.
- Required per-file Contents headers, detailed inline comments, and accurate handoff staging/commit guidance.

### Out of Scope (Excluded)

- Loading, validating, or refreshing order data; requesting `GET /api/orders`; or deciding which order is selected — those belong to `order-history-page.feature.md`.
- Inventing or calling a per-order detail endpoint; the backend does not provide one and the list response is the only data source.
- The `MY ORDERS` table, View buttons, focus refresh, or page-level states.
- Creating orders or the Order Confirmation modal; those belong to `menu-modal-confirmation.feature.md`.
- Order actions of any kind inside the modal: cancelling, reordering, rating, contacting the courier, or editing.
- Courier assignment, status transitions, or any other `OrderApiController` route.
- Login, session handling, header/footer implementation, or logout; the modal renders above the authenticated frame.
- Modifying Java controllers, DTOs, services, repositories, database schema, or seeded records.
- Persisting the selected order or modal state to AsyncStorage.

## Sub-Requirements (Feature Breakdown)

### Requirement A — Modal Contract with the Order History Page

- The modal remains a controlled component receiving props only: `visible`, `onClose`, and `order` — the complete normalized order object selected on the Order History page.
- The normalized order shape is owned by `client/services/orderService.js` and already provides: `id`, `restaurantName`, `status` (raw lowercase), `createdOn` (ISO date-time string), `courierId`/`courierName` (`null` when unassigned), `totalCost` (raw integer), and `products` entries with `productId`, `productName`, `quantity`, `unitCost`, and `totalCost`.
- Render only from this prop; make no network request and read no storage.
- Render nothing order-specific when `order` is absent (closed state); never crash on a `null` order while the modal is hidden.
- Do not mutate the order object; it belongs to the page's list state.

### Requirement B — Header Block: Restaurant, Date, Status, and Courier

- The charcoal header block shows, matching the wireframe:
  1. The restaurant name (`restaurantName`) as the modal title in the orange-red Oswald treatment.
  2. `Order Date:` followed by the formatted order date.
  3. `Status:` followed by the uppercase status (`PENDING`).
  4. `Courier:` followed by the courier name or a safe blank.
  5. The white X close control aligned to the right.
- Format `createdOn` into one human-readable date through a small shared/local helper (the wireframe leaves its sample value blank, so the exact format is a recorded project decision — a clear result such as `July 15, 2026` is acceptable; keep it consistent and documented).
- An unparseable `createdOn` renders a safe blank rather than `Invalid Date`, `NaN`, or a raw ISO string.
- Uppercase status is a display transform only; the raw status value stays untouched in state.
- Replace the staged `Order Details` placeholder title and `Order #` line with this wireframe header.

### Requirement C — Safe Nullable-Courier Display

- `courierName: null` is a valid not-yet-assigned pending state, explicitly required by the grading sheet to display safely.
- When `courierName` is `null`, the `Courier:` label renders with an empty value exactly as the wireframe shows for a pending order.
- The strings `undefined` and `null` must never appear anywhere in the modal, and a missing courier must never throw.
- When `courierName` is present, display it verbatim.
- Provide an accessible spoken form for the unassigned case (for example `Courier: not assigned yet`) even though the visible value is blank.

### Requirement D — Product Rows, Prices, and Total

- Render one row per entry in `order.products`: the product name left, `x{quantity}` center-right, and the formatted line total (`totalCost`) right — the same row treatment as the Order Confirmation modal.
- Format every displayed price through the shared `formatProductCost` and its verified `whole-dollars` rule; do not duplicate or bypass the formatter.
- Render the separator and the right-aligned `TOTAL:` row beneath the product rows, formatting the order's `totalCost`.
- The backend computes each product `total_cost` as `quantity × unit_cost` and the order `total_cost` as their sum; display the provided values rather than recomputing, and never re-parse formatted strings.
- Never display `undefined`, `NaN`, raw JSON, or unformatted integers.
- An order with many products scrolls inside the panel while the header block and total remain discoverable; a valid single-product order renders the same structure.

### Requirement E — Per-Order Lifecycle and Close Behavior

- Opening the modal for order A and later for order B must show only order B's details; no field, row, or scroll position from a previously viewed order may persist.
- The X close control and the Android back action (`onRequestClose`) both call `onClose`; the page clears the selection and the list remains unchanged with no refetch, per the page feature's contract.
- The modal performs no side effects on open or close: no requests, no storage writes, no navigation.
- Exactly one modal instance serves the page; the page's guard against stacked modals is out of scope here but the modal must tolerate rapid open/close cycles without stale renders.

### Requirement F — Detailed Comments and Per-File Contents

- Every human-authored JavaScript file created or materially changed for this feature begins with a block comment containing the exact file name, one-sentence purpose, and numbered `Contents` list in source order, kept synchronized with the final implementation.
- Update the `OrderHistoryModal.js` header and remove the staged-shell comments that say the interior is pending.
- Add detailed inline comments immediately above non-obvious logic, including:
  - Why the modal renders from the passed list order object instead of an endpoint.
  - The nullable-courier display rule and its grading requirement.
  - The date-formatting decision and the safe-blank fallback.
  - The uppercase status display transform versus the preserved raw value.
  - Reuse of the shared currency formatter and why backend-computed totals are displayed rather than recomputed.
- Add JSDoc where a date/display helper has non-obvious parameters or fallbacks.
- Remove stale comments before completion.

## User Flow and Detail Modal Logic

### Inspect an Order

1. The customer presses View on one row of the `MY ORDERS` table.
2. The page passes that row's complete normalized order object and sets the modal visible.
3. The modal header shows the restaurant name, formatted order date, uppercase status, and courier line.
4. The body lists every ordered product with `x{quantity}` and formatted prices, then the formatted `TOTAL:`.
5. The customer reviews the details; no further requests occur.

### Pending Order Without a Courier

1. The selected order has `courierName: null`.
2. The `Courier:` line renders with a safe blank value, exactly as the wireframe's pending example.
3. Nothing renders as `undefined` and nothing crashes.

### Close and View Another Order

1. The customer presses X (or the Android back action).
2. The modal closes; the Order History list, data, and scroll position are unchanged and not refetched.
3. The customer presses View on a different row.
4. The modal shows only the newly selected order's details with no stale content.

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Frontend Components and Routes

| File | Responsibility |
| --- | --- |
| `client/components/OrderHistoryModal.js` | Owns the complete detail presentation: header block (restaurant, date, status, courier), product rows, total, scrolling, and close affordances. |
| `client/app/customer/order-history.js` | Owns `visible`, the selected order object, and clearing the selection on close; governed by `order-history-page.feature.md`. |
| `client/app/customer/_layout.js` | Keeps the shared authenticated header/footer visible behind the modal backdrop. |

### Services and Configuration

- `client/services/orderService.js` — already owns the normalized order shape consumed by this modal; this feature adds no service functions.
- `client/constants/currency.js` — existing shared `formatProductCost` and the single `whole-dollars` cost-unit rule for every displayed price.
- `client/constants/theme.js` — exact palette, Oswald/body font families, spacing, and minimum touch targets.
- A small date-formatting helper (local to the component or a shared constant module if reused) owning the one documented `createdOn` display format and its safe-blank fallback.

### Storage

- None. The modal reads no storage, creates no AsyncStorage keys, and persists nothing.

### Backend / API

- No endpoint belongs to this feature. The data source is the selected order object from the Order History page's `GET /api/orders?type=customer&id={customerId}` response; the backend provides no per-order detail endpoint and none may be invented.
- Postman evidence for the list endpoint (including an order with a `null` courier) is owned by `order-history-page.feature.md`; this feature relies on it rather than duplicating collection entries.

## Data, Validation, and State

### Consumed Normalized Order Object

| Field | Type | Modal use |
| --- | --- | --- |
| `restaurantName` | Non-blank string | Header title. |
| `createdOn` | ISO date-time string | Formatted `Order Date:` value; safe blank if unparseable. |
| `status` | Non-blank lowercase string | Displayed uppercase after `Status:`. |
| `courierName` | String or `null` | `Courier:` value; blank display and accessible fallback when `null`. |
| `products[].productName` | Non-blank string | Row name. |
| `products[].quantity` | Positive integer | Row `x{quantity}`. |
| `products[].totalCost` | Non-negative integer | Row price via shared formatter. |
| `products[].unitCost` | Non-negative integer | Available raw; not separately displayed by the wireframe rows. |
| `totalCost` | Non-negative integer | `TOTAL:` value via shared formatter. |
| `id`, `restaurantId`, `customer*`, `courierId` | Various / nullable | Preserved on the object; not displayed by the wireframe. |

- Validation happened once at the service boundary (`normalizeCustomerOrder`); the modal trusts the normalized shape and adds only display-level fallbacks (date parsing, null courier).

### Modal States

The modal itself is presentation-only with two states driven by props:

```text
hidden (visible: false / no order) ⇄ showing (visible: true, order present)
```

- `hidden`: Nothing order-specific renders; a `null` order is tolerated.
- `showing`: All Requirement B–D content renders for exactly the passed order.
- There is no internal request state; page-level states are governed by `order-history-page.feature.md`.

### State Transitions

| Current state | Event | Next state | Required result |
| --- | --- | --- | --- |
| `hidden` | Page sets an order + visible | `showing` | All details for exactly that order. |
| `showing` | X or Android back | `hidden` | `onClose` fires once; list unchanged; no side effects. |
| `showing` | Page selects a different order | `showing` | Only the new order's details; no stale content. |
| `showing` | Order has `null` courier | `showing` | Blank courier value; no `undefined`; no crash. |

## Visual and Accessibility Contract

### Wireframe Composition

- Treat the `Order History Details` page in `support_materials_13/Design/Wireframe.pdf` as the visual source.
- The modal is a centered white rounded panel over the dimmed Order History table; the shared header and footer remain visible but inert behind the backdrop.
- Panel hierarchy:
  1. Charcoal header block: restaurant name in orange-red Oswald, then white `Order Date:`, `Status:`, and `Courier:` lines, with the white X close control top-right.
  2. Body on the white surface: one row per product — name left, `x{quantity}`, formatted price right.
  3. Separator line, then the right-aligned bold `TOTAL: ${amount}`.
- The wireframe's pending example shows `Status: PENDING` and an empty courier value; reproduce that treatment for unassigned couriers.

### Colors and Typography

- Use only centralized project palette values:
  - Orange-red `#DA583B` — restaurant-name title.
  - Charcoal `#222126` — header block background, body text, backdrop tint.
  - White `#FFFFFF` — header text, panel surface.
  - Dark red `#851919`, muted green `#609475`, warm yellow `#F0CB67` — available but unused unless the wireframe shows them here.
- The title and `TOTAL:` use the Oswald treatment; header detail lines and product rows use the platform-safe body font, consistent with the confirmation modal's row styling.
- Match the wireframe's compact spacing; do not restyle it generically.

### Accessibility

- The modal traps context (`accessibilityViewIsModal`) and labels itself with the restaurant, for example `Order details for Sweet Dragon`.
- The restaurant title uses header semantics.
- Date, status, and courier lines expose readable spoken forms; the blank courier announces `not assigned yet` rather than silence implying an error.
- Each product row exposes a spoken form such as `2 of Cheeseburger, $18.00`; the total announces as `Total $20.75`.
- The X close control is a labeled button meeting the global minimum touch target.
- Long product lists remain scrollable and readable at larger text sizes; status never relies on color alone.

## Expected Behavior

| Situation | Expected behavior |
| --- | --- |
| View pressed on an order | The modal shows that exact order's restaurant, date, status, courier, products, prices, and total. |
| Order date rendered | `createdOn` displays as the one documented human-readable format; never a raw ISO string or `Invalid Date`. |
| Status rendered | Uppercase presentation (`PENDING`) of the preserved raw status. |
| Courier assigned | The courier's name displays after `Courier:`. |
| Courier not assigned (`null`) | The courier value is a safe blank; no `undefined`, no crash. |
| Prices rendered | Every product price and the total use the shared formatter (for example `$20.75`). |
| Totals rendered | Row prices are the backend line totals; `TOTAL:` is the backend order total. |
| X or Android back pressed | The modal closes; the list, data, and scroll position are unchanged; no refetch. |
| A different order viewed next | Only the new order's details render; no stale content. |
| Many products | Rows scroll inside the panel; header and total remain discoverable. |
| Modal hidden | No order-specific render; a `null` order prop is tolerated. |

## Technical Constraints (Feature-Level)

- Use JavaScript to match the current client; do not introduce TypeScript for only this feature.
- Complete the existing `client/components/OrderHistoryModal.js`; do not create a parallel modal component or move the route.
- Keep the modal a controlled, presentation-only component; the page owns `visible` and the selected order.
- Make no network request and read no storage inside the modal; do not invent a detail endpoint.
- Reuse `formatProductCost` for every displayed price; do not add a second currency formatter or recompute backend totals.
- Display transforms (uppercase status, date formatting, blank courier) happen at the rendering boundary; raw normalized values stay untouched.
- Use React Native components only; no browser-only React Bootstrap DOM components.
- Use centralized palette, typography, spacing, and minimum touch-target values from `client/constants/theme.js`.
- Follow global naming, file header/Contents, inline-comment, logging, secret, error, testing, branch, staging-command, and commit-message rules.
- Keep this feature's diff inside the modal presentation; page behavior changes belong to `order-history-page.feature.md`.

## Acceptance Criteria

### Accurate Details

- [ ] The header shows the selected order's restaurant name, formatted order date, uppercase status, and courier line, matching the wireframe block.
- [ ] The date comes from `createdOn`, renders in the one documented format, and falls back to a safe blank if unparseable.
- [ ] An assigned courier's name displays correctly; a `null` courier displays as a safe blank with an accessible fallback.
- [ ] The strings `undefined` and `null` never appear, and a missing courier never crashes the modal.
- [ ] Every ordered product renders with its correct name, `x{quantity}`, and formatted line total.
- [ ] The `TOTAL:` row shows the order's formatted total cost.
- [ ] Every price uses the shared formatter with a currency symbol and two decimals (for example `$20.75`).

### Data Source and Lifecycle

- [ ] The modal renders only from the passed normalized order object; no network request or storage read occurs.
- [ ] Viewing order A then order B shows only order B's details with no stale content.
- [ ] X and the Android back action both close the modal via `onClose`, and the list behind it is unchanged without a refetch.
- [ ] The hidden state tolerates a `null` order without rendering or crashing.

### Visual, Accessibility, and Documentation

- [ ] The modal closely matches the supplied Order History Details wireframe: charcoal header block, orange-red restaurant title, white detail lines, product rows, separator, and bold total.
- [ ] Only the exact graded palette and shared Oswald/body typography are used.
- [ ] Long product lists scroll inside the panel with the header and total discoverable.
- [ ] The modal, detail lines, rows, total, and close control have correct roles, labels, and touch targets; the blank courier has a spoken fallback.
- [ ] Every changed human-authored JavaScript file has an accurate file name, purpose, numbered Contents list, and required detailed comments/JSDoc, with the staged-shell comments removed.
- [ ] Verified on representative iPhone and Android dimensions, including an order with a `null` courier and an order with multiple products.

## Feature Definition of Done

This feature is complete only when:

- Every in-scope sub-requirement and acceptance criterion passes against real orders returned by the existing Java API.
- The staged modal shell interior has been replaced with the complete wireframe presentation: header block, product rows, and total.
- A live check confirms the modal shows correct details for at least two different real orders, including one pending order with no courier and one order containing multiple products.
- Date, status, courier, price, and total displays are verified against the same order's raw API response (Postman) so "accurate details" is proven, not assumed.
- Close-and-reopen across different orders shows no stale content, and closing leaves the Order History list untouched.
- The modal closely matches the wireframe and remains accessible at representative iPhone and Android dimensions.
- Relevant component tests, Expo iOS/Android bundle exports, and `git diff --check` pass; any unavailable live test is reported exactly rather than claimed.
- All changed source files retain accurate Contents headers and detailed comments next to non-obvious logic.
- The implementation follows `feature/order-history-modal` → `dev` workflow, and the final AI handoff provides the exact scoped staging command before its copy-ready commit message.

## Notes for the AI

- Read `ai/ai-spec.md` and this entire feature file before implementation.
- The grading sheet is authoritative: the modal shows the correct date, status, courier name, products, prices, and totals, and a missing courier is a valid pending state that must display safely.
- `client/components/OrderHistoryModal.js` already exists as a staged shell (backdrop, panel, charcoal header, X control, minimal body); complete its interior rather than rewriting it, and update its header/staged comments.
- The data source is the normalized order object from `client/services/orderService.js` (`restaurantName`, `createdOn`, `status`, `courierName`/`courierId` nullable, `totalCost`, `products[].productId/productName/quantity/unitCost/totalCost`); do not re-read snake_case keys inside the component and do not invent a detail endpoint.
- The wireframe header spells the label `Courrier:`; the grading sheet says "courier name." Use the standard spelling `Courier:` and record the wireframe typo — if a coach confirms the exact wireframe text is graded literally, change only the label string.
- The wireframe's sample leaves the `Order Date:` value blank, so the exact date format is a documented project decision; pick one readable format, comment it, and keep it consistent.
- Status arrives lowercase (`pending`); uppercase is a display transform, matching the Order History table's rule.
- Product rows display the backend-computed line totals and the order `TOTAL:` displays the backend order total through the shared `formatProductCost` and its `whole-dollars` rule; if live Postman evidence proves minor units, update `client/constants/currency.js` once and continue.
- The modal is presentation-only: no requests, no storage, no navigation, no order actions.
- Preserve unrelated user changes and do not modify the Java backend.
- If implementation evidence changes a field, shape, or lifecycle behavior, update this feature spec before continuing.
