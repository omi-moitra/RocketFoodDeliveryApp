<a id="top"></a>

# AI Feature Specification — Restaurant Menu Page

> Defines the authenticated Restaurant Menu screen, restaurant/product loading, menu presentation, button-only quantity controls, and the transition to Order Confirmation. Use this document together with `ai/ai-spec.md`, `ai/features/navigation-structure.feature.md`, `ai/features/header-footer.feature.md`, `ai/features/restaurant-list-page.feature.md`, and `ai/features/menu-modal-confirmation.feature.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow](#user-flow-and-restaurant-menu-logic)
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

- **Feature Name:** Customer Restaurant Menu and Quantity Selection
- **Related Area:** Mobile frontend, protected restaurant/product APIs, nested restaurant navigation, quantity state, confirmation-modal entry
- **Specification file:** `ai/features/restaurant-menu-page.feature.md`
- **Screen route:** `client/app/customer/restaurant/[restaurantId].js`
- **API endpoints:**
  - `GET ${API_BASE_URL}/api/restaurants/{restaurantId}`
  - `GET ${API_BASE_URL}/api/products?restaurant={restaurantId}`
- **Implementation branch:** `feature/restaurant-menu-page`

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Goal

Allow an authenticated customer to inspect the selected restaurant and every product on its menu, choose non-negative integer quantities using only minus and plus buttons, and open the Order Confirmation modal when at least one quantity is greater than zero.

Every menu must match the supplied Restaurant Menu wireframe and use the same supplied `RestaurantMenu.jpg` image. Quantity state belongs to one selected restaurant: every product starts at zero, values never become negative, and changing to a different restaurant resets all quantities to zero. This feature prepares accurate selected-product data for the confirmation feature but does not submit the order itself.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Scope

### In Scope (Included)

- The authenticated dynamic Restaurant Menu route at `client/app/customer/restaurant/[restaurantId].js`.
- Validation and normalization of the route's public `restaurantId` parameter.
- Protected loading of the selected restaurant details and only that restaurant's products.
- Use of the existing API success envelope and exact snake_case response keys.
- Display of the selected restaurant's name, price range, and rating.
- Display of every returned product's name, description, formatted price, static menu image, quantity, minus button, and plus button.
- Using the supplied `RestaurantMenu.jpg` through its verified runtime owner at `client/assets/RestaurantMenu.jpg`.
- Initial quantity `0` for every product.
- Button-only quantity changes in integer steps of one.
- A hard zero floor; quantities can never be negative.
- Quantity reset when `restaurantId` changes to a different restaurant.
- Safe quantity reconciliation if products reload for the same restaurant.
- Disabled Create Order state while no product quantity is positive.
- Enabled Create Order state as soon as at least one product quantity is positive.
- Opening the Order Confirmation modal with the selected restaurant and only products whose quantity is greater than zero.
- Loading, empty-menu, invalid-route, not-found, connection, service, response, retry, and expired-session behavior.
- Rapid-tap, request-race, unmount, and route-change protection.
- Shared authenticated header/footer integration, scrolling, safe-area behavior, accessibility, and representative iOS/Android layouts.
- Postman coverage for restaurant detail and selected-restaurant products.
- Required per-file Contents headers, detailed inline comments, and accurate handoff staging/commit guidance.

### Out of Scope (Excluded)

- Restaurant List loading, filtering, card images, or list-to-menu navigation; those belong to `restaurant-list-page.feature.md`.
- Confirm Order submission, request-body creation, processing/success/failure states, success navigation, or retry after submission; those belong to `menu-modal-confirmation.feature.md`.
- Order History and its detail modal.
- Login, persisted-session creation, shared header rendering, footer implementation, or manual logout; this feature consumes those shared contracts.
- Creating, updating, deleting, or administrating restaurants or products.
- Modifying Java controllers, DTOs, repositories, services, database schema, or seeded records.
- Editable quantity text fields, keyboard quantity entry, sliders, gestures, or direct numeric entry.
- Product search, sorting, categories, favorites, dietary filters, customizations, notes, inventory, or maximum-stock rules not supplied by the API.
- Separate product images, remote image URLs, or generated menu images.
- Passing the access token, customer ID, full restaurant object, product array, or quantity map in route parameters.
- Deleting or replacing `client/assets/RestaurantMenu.jpg`, the byte-identical port of the supplied image.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Sub-Requirements (Feature Breakdown)

### Requirement A — Dynamic Route Entry and Validation

- Restaurant Menu lives at `client/app/customer/restaurant/[restaurantId].js` inside the nested Restaurant Stack.
- Read `restaurantId` with Expo Router's local route-parameter API.
- Reject arrays, blanks, nonnumeric strings, decimals, zero, and negative values.
- Normalize a valid route value to one positive integer for API requests and quantity-state boundaries.
- Never substitute a fallback restaurant ID or use a list/image index.
- For an invalid route, make no restaurant/product request; display a safe `Restaurant unavailable` state with an accessible return action to Restaurant List.
- Keep the access token and customer identity in the shared session layer; do not add either to the route.

### Requirement B — Protected Restaurant and Product Requests

- After a valid route and usable session resolve, request:

```text
GET ${API_BASE_URL}/api/restaurants/{restaurantId}
GET ${API_BASE_URL}/api/products?restaurant={restaurantId}
```

- Send `Authorization: Bearer <accessToken>` through the shared API client on both requests.
- Encode the restaurant ID when building each path/query.
- Resolve the base URL from `EXPO_PUBLIC_API_URL`; never hard-code localhost, a personal ngrok URL, credentials, or a token.
- Apply finite timeout and abort behavior.
- Cancel obsolete requests when the route changes or screen unmounts.
- Use a request ID or equivalent coordination so a late response for Restaurant A cannot replace Restaurant B after the route changes.
- `GET /api/restaurants/{restaurantId}` is required here because the route carries only the public ID while the wireframe requires restaurant name, price range, and rating.

### Requirement C — Restaurant Detail Response

- Expect the existing HTTP 200 success envelope:

```json
{
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Example Restaurant",
    "price_range": 2,
    "rating": 4
  }
}
```

- Validate that `data.id` is the same positive integer as the route `restaurantId`.
- Map `price_range` to `priceRange` once at the service boundary when client domain objects use camelCase.
- Validate a non-blank name, price range `1`–`3`, and rating `0`–`5`.
- Display price range as `$`, `$$`, or `$$$` and rating as matching stars.
- Display returned rating `0` as a deliberate `Not yet rated` state; do not fabricate a rating.
- Treat HTTP 404 as selected restaurant unavailable and provide a return action.

### Requirement D — Product Response and Restaurant Scoping

- Expect the existing HTTP 200 success envelope:

```json
{
  "message": "Success",
  "data": [
    {
      "id": 10,
      "restaurant_id": 1,
      "name": "Example Product",
      "description": "Example description",
      "cost": 975
    }
  ]
}
```

- Treat `data` as an array, including a valid empty array.
- Map `restaurant_id` to `restaurantId` once at the service boundary when using camelCase in client code.
- Validate every product:
  - `id` is a unique positive integer.
  - `restaurant_id` exactly matches the selected route restaurant ID.
  - `name` is a non-blank string.
  - `description` is a string or a deliberate empty/null value.
  - `cost` is a non-negative integer.
- Reject malformed or cross-restaurant data rather than displaying or ordering it.
- Use product IDs as list keys and quantity-map keys; never use array indexes.
- Do not call unfiltered `GET /api/products` for the menu screen.

### Requirement E — Currency-Unit Verification

- Format every visible product price as standard currency with a symbol and two decimal places.
- The source-based implementation rule is **whole-dollar integers** because the current `DataSeeder` creates grading menu costs from `5` through `24`; therefore `9` displays as `$9.00` without division.
- API controller tests also contain create/update fixtures such as `1299`, but those test arbitrary CRUD values rather than the seeded customer-menu dataset.
- The user explicitly deferred MySQL verification during implementation. Live `GET /api/products?restaurant={restaurantId}` Postman verification therefore remains an open acceptance item and must not be claimed as complete.
- `client/constants/currency.js` owns the named `whole-dollars` rule so a later verified contract change is made once rather than inferred per product.
- Use this same source-based conversion in Restaurant Menu and its confirmation preview; later confirmation/history features must reuse the formatter and revisit it if live grading data contradicts the seeder.
- Do not infer the conversion from the number's size on a product-by-product basis and do not mix units.

### Requirement F — Static Menu Image Asset

- Use the supplied file named exactly `RestaurantMenu.jpg` for every restaurant menu/product image shown by this feature.
- Keep it at `client/assets/RestaurantMenu.jpg`, the verified byte-identical runtime port that preserves the exact filename.
- Verify the runtime asset exists, is readable, and renders before considering the asset requirement complete.
- Do not replace, recompress, rename, or delete `client/assets/RestaurantMenu.jpg`; the former duplicate source directory was intentionally consolidated.
- Register the runtime image with a static React Native `require(...)`; do not construct a dynamic string path.
- The source file has a `.jpg` filename even though local inspection reports PNG image data. Do not recompress, rename, or change the extension merely to normalize it; verify Expo bundles and renders the supplied file as-is.
- Render the same image in every product row, matching the repeated-image treatment in the Restaurant Menu wireframe.
- Use an appropriate crop/resize mode without stretching the source.

### Requirement G — Menu Layout and Product Rows

- Match the Restaurant Menu / Order Page in `client/docs/m13/design/Wireframe.pdf`.
- Display the page heading exactly `RESTAURANT MENU`.
- Display the selected restaurant's name, price range, and rating near the top.
- Place the Create Order button in the restaurant-summary area as shown by the wireframe.
- Render every product in a vertically scrollable list.
- Each product row displays:
  - `RestaurantMenu.jpg`.
  - Product name.
  - Formatted product price.
  - Product description when present.
  - Minus button.
  - Current integer quantity.
  - Plus button.
- Keep controls aligned and essential text readable when names/descriptions wrap or text size increases.
- Never display `undefined`, `null`, raw JSON, unformatted integers, or broken image placeholders.

### Requirement H — Quantity Initialization and Data Shape

- Store quantities by product ID, for example `{ [productId]: quantity }`.
- After the selected restaurant's products first load successfully, create one entry per returned product and initialize every value to integer `0`.
- Do not initialize quantity from array position, prior restaurant state, product cost, or route parameters.
- An empty product response produces an empty quantity map and keeps Create Order disabled.
- Derived values such as `hasSelectedProducts` and selected-item arrays must come from the current validated products plus the current quantity map.
- Do not duplicate the authoritative quantity in component-local child state.

### Requirement I — Button-Only Quantity Changes

- Quantity changes only when the customer presses the visible minus or plus button.
- Do not render a `TextInput` or any editable numeric control for quantity.
- Plus increments exactly one product by `1` per accepted press.
- Minus decrements exactly one product by `1` per accepted press.
- Minus is disabled at zero and must also safely ignore a stale/rapid press that reaches the handler at zero.
- Quantity values must remain finite, safe, non-negative integers.
- Use functional state updates so rapid taps do not lose increments or apply stale values.
- A control for Product A must never modify Product B.
- Display the quantity as read-only text between the two buttons.

### Requirement J — Restaurant Change and Reload Reconciliation

- Treat a change from one valid `restaurantId` to another as a new menu boundary.
- Immediately clear the previous restaurant detail, products, quantity map, modal-selection state, and errors before the new menu becomes interactive.
- After the new products load, initialize all their quantities to zero even if product IDs overlap with the previous restaurant.
- Never show Restaurant A products or quantities under Restaurant B's heading while B is loading.
- If products reload for the same restaurant:
  - Preserve quantities for still-present validated product IDs.
  - Initialize newly returned product IDs to zero.
  - Remove quantities for products no longer returned.
- Switching footer tabs away and back without changing `restaurantId` may preserve the mounted menu's current selections.
- Leaving the menu stack and opening a new menu instance starts from zero according to the route lifecycle.

### Requirement K — Create Order Enabled/Disabled State

- Derive `hasSelectedProducts` by checking whether at least one current product quantity is greater than zero.
- Disable Create Order when:
  - All quantities are zero.
  - The product list is empty.
  - Restaurant/products are loading.
  - The route or response data is invalid.
  - A blocking request error is displayed.
  - The confirmation modal is already opening/open and another press would duplicate it.
- Enable Create Order immediately when at least one current quantity becomes positive and the menu data is valid.
- Disable it again when the customer returns every quantity to zero.
- Use both the native `disabled` prop and a clear visual/accessibility disabled state.
- Prevent rapid repeated presses from opening duplicate confirmation modals.

### Requirement L — Open Order Confirmation Modal

- Pressing enabled Create Order opens the Order Confirmation modal owned by `menu-modal-confirmation.feature.md`.
- Build the selected product collection from current validated products whose quantity is greater than zero.
- Each selected item passed to the modal includes only the data needed for accurate confirmation, such as product ID, name, raw confirmed cost, formatted unit price, and quantity.
- Provide the selected restaurant ID and display details through component props/state, not new route parameters or AsyncStorage keys.
- Read `customerId` and `accessToken` through the shared session/service boundary only when the confirmation feature needs them for order creation.
- Opening the modal does not send `POST /api/orders`; submission begins only when the customer presses Confirm Order inside the modal.
- Closing the modal before submission returns to the same menu with current quantities intact.
- Do not include zero-quantity products in the modal selection or future order request.

### Requirement M — Loading, Empty, Error, Retry, and Session States

- **Loading:** Show visible progress while restaurant/products load without hiding the shared authenticated header/footer.
- **Empty menu:** A valid restaurant with an empty products array shows a deliberate no-menu-items message and disabled Create Order.
- **Invalid route:** Make no API request and offer return to Restaurant List.
- **Restaurant 404:** Show Restaurant unavailable and offer return to Restaurant List.
- **Connection/timeout:** Show a concise retryable connection message.
- **HTTP 5xx/unexpected response:** Show a generic service/response message and retry without raw server details.
- **HTTP 401:** Invoke the shared unauthorized/sign-out transition, clear stale session state, and return to Login.
- **Retry:** Repeat both required menu requests for the same current `restaurantId` and keep Create Order disabled until validated success.
- Do not let a late failed/successful response replace state for a newer route or request.
- Abort pending requests and avoid state updates after unmount.

### Requirement N — Detailed Comments and Per-File Contents

- Every human-authored JavaScript file created or materially changed for this feature begins with a block comment containing the exact file name, one-sentence purpose, and numbered `Contents` list in source order.
- Keep each Contents list synchronized with the final implementation.
- Add detailed inline comments immediately above non-obvious logic, including:
  - Route-ID normalization and rejection.
  - Cross-restaurant response validation.
  - Confirmed currency-unit conversion.
  - Quantity initialization and same-restaurant reload reconciliation.
  - Functional updates that protect rapid plus/minus taps.
  - Zero-floor enforcement in both UI and handler logic.
  - Restaurant-change resets.
  - Derived Create Order state.
  - Request cancellation/stale-response protection.
  - The boundary between opening the modal and submitting the order.
  - Why `RestaurantMenu.jpg` is statically registered and its support original is preserved.
- Comments explain business reasons, data contracts, race protection, or grading constraints rather than narrating obvious syntax.
- Add JSDoc where reusable helpers/services have non-obvious parameters, normalized return shapes, currency behavior, or thrown errors.
- Remove stale comments and update Contents lists before completion.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## User Flow and Restaurant Menu Logic

### Open a Valid Restaurant Menu

1. The customer presses a restaurant image on Restaurant List.
2. The nested stack opens `[restaurantId].js` with only the selected public restaurant ID.
3. The screen normalizes the ID and resolves the authenticated session.
4. It clears state belonging to any previous restaurant and enters loading.
5. It requests the selected restaurant details and products with the bearer token.
6. The services validate the success envelopes, route ownership, fields, and confirmed currency contract.
7. The screen creates a zero quantity for every product.
8. The restaurant summary and complete scrollable product list display with Create Order disabled.

### Increase and Decrease Quantities

1. The customer presses plus for one product.
2. A functional state update increments only that product by one.
3. Create Order enables because at least one quantity is positive.
4. The customer presses minus for a positive quantity.
5. The value decreases by one but never below zero.
6. When every quantity returns to zero, Create Order disables again.

### Open and Close Confirmation

1. At least one product has a positive quantity.
2. The customer presses Create Order once.
3. The screen derives only positive-quantity selected products and opens Order Confirmation.
4. No order request is sent during opening.
5. If the customer closes before confirming, the modal closes and current menu quantities remain.
6. Submission behavior continues under `menu-modal-confirmation.feature.md`.

### Change Restaurants

1. The customer returns to Restaurant List and selects a different restaurant.
2. The route `restaurantId` changes or a new Menu screen mounts.
3. Previous restaurant/product/quantity/modal state is discarded.
4. New detail/products load for the new ID.
5. Every new menu quantity initializes to zero and Create Order remains disabled.

### Empty, Failure, or Expired Session

1. A valid empty product array shows an empty-menu state, not an API failure.
2. A connection/service/response failure shows a retry for the current restaurant.
3. An invalid or missing restaurant shows a return-to-list action.
4. HTTP 401 runs the shared unauthorized transition and removes authenticated routes.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Frontend Routes and Layouts

| File | Responsibility |
| --- | --- |
| `client/app/customer/restaurant/[restaurantId].js` | Validates route ID; owns restaurant/menu request state, product quantities, derived Create Order state, and modal visibility/selection. |
| `client/app/customer/restaurant/_layout.js` | Keeps Restaurant Menu inside the nested Restaurant Stack and provides back navigation to Restaurant List. |
| `client/app/customer/restaurant/index.js` | Supplies only the selected restaurant's public ID when opening Menu. |
| `client/app/customer/_layout.js` | Supplies the shared authenticated header and persistent footer tabs. |

### Components

- `client/components/MenuProductRow.js` — renders the static image, product text, price, and button-only stepper while the parent screen retains authoritative quantity state.
- `client/components/OrderConfirmationModal.js` — modal component governed by `menu-modal-confirmation.feature.md`.
- Reuse shared loading/error primitives only if they preserve the menu-specific empty, invalid, unavailable, and retry distinctions.

### Services and Configuration

- `client/services/productService.js` or a focused menu service — owns protected product query construction, envelope validation, field mapping, and product scoping.
- Existing/new restaurant-detail service — owns `GET /api/restaurants/{restaurantId}` and detail normalization.
- `client/services/apiClient.js` — owns environment URL construction, bounded JSON transport, bearer-token support, and shared error classification.
- Shared currency formatter — owns the one verified integer-cost conversion used across menu, confirmation, and history.
- `client/constants/theme.js` — owns the exact palette, typography, spacing, and touch dimensions.
- Static menu-image registry/runtime `require` — owns the bundled `RestaurantMenu.jpg` reference.

### Storage

- Read access token and customer ID only through the shared authentication/session layer.
- This feature creates no new AsyncStorage keys.
- Keep quantities, loaded menu data, selected items, and modal visibility in route/screen state.
- Do not persist quantities, products, restaurant objects, or modal state merely to navigate.

### Backend / API

`GET ${API_BASE_URL}/api/restaurants/{restaurantId}`

- Protected by bearer token.
- Returns selected restaurant `id`, `name`, `price_range`, and `rating` inside `{ message, data }`.
- HTTP 404 means the selected restaurant does not exist.

`GET ${API_BASE_URL}/api/products?restaurant={restaurantId}`

- Protected by bearer token.
- The `restaurant` query parameter is required by this feature even though the backend makes it optional globally.
- Returns only the selected restaurant's product array inside `{ message, data }`.
- A successful empty array is a valid empty menu.

- This feature makes no `POST /api/orders` request.
- Postman must include both requests with preconfigured restaurant ID and bearer-token handling.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Data, Validation, and State

### Route and Restaurant Data

| Value | Source | Client type | Rule |
| --- | --- | --- | --- |
| `restaurantId` | Expo route | Positive integer | Required; scopes both requests and quantity reset boundary. |
| `accessToken` | Shared auth session | Non-blank string | Bearer header only; never route/log/UI data. |
| `id` | Restaurant API | Positive integer | Must equal route `restaurantId`. |
| `name` | Restaurant API | Non-blank string | Display in restaurant summary. |
| `price_range` | Restaurant API | Integer `1`–`3` | Map to `priceRange`; display matching `$` count. |
| `rating` | Restaurant API | Integer `0`–`5` | Display matching stars or deliberate unrated state. |

### Product Data

| API field | Client field | Type | Rule |
| --- | --- | --- | --- |
| `id` | `id` | Positive integer | Unique list key and quantity key. |
| `restaurant_id` | `restaurantId` | Positive integer | Must equal current route restaurant ID. |
| `name` | `name` | Non-blank string | Required display/confirmation name. |
| `description` | `description` | String or null | Display safely or use a deliberate omission/fallback. |
| `cost` | `cost` | Non-negative integer | Preserve raw value; format only through confirmed shared conversion. |

### Quantity and Derived Selection

```js
quantities = {
  10: 0,
  11: 2,
};
```

- Every value is a finite non-negative integer.
- Product ID `11` is selected because its quantity is greater than zero.
- `hasSelectedProducts` is `true` when any current product has quantity `> 0`.
- The modal selection contains Product `11` and excludes Product `10`.
- Quantity totals and prices must not be pre-rounded or mutated in the quantity map.

### Screen States

Use explicit states rather than overlapping booleans:

```text
resolving → loading → ready
                    ↘ empty
                    ↘ unavailable
                    ↘ error
ready → confirmation-open → ready
```

- `resolving`: Route/session prerequisites are being validated.
- `loading`: Current restaurant detail/products requests are pending.
- `ready`: Restaurant and one or more products are valid and interactive.
- `empty`: Restaurant is valid but product array is empty.
- `unavailable`: Route is invalid or restaurant does not exist.
- `error`: A retryable non-401 request/response failure occurred.
- `confirmation-open`: Modal owns confirmation interaction; duplicate open is blocked.
- HTTP 401 transitions the shared application session to logged out rather than remaining a menu state.

### State Transitions

| Current state | Event | Next state | Required result |
| --- | --- | --- | --- |
| `resolving` | Invalid route ID | `unavailable` | No request; return action visible. |
| `resolving` | Valid route/session | `loading` | Start detail and scoped product requests. |
| `loading` | Valid restaurant and products | `ready` | Initialize all quantities to zero. |
| `loading` | Valid restaurant, empty products | `empty` | Show empty menu; Create Order disabled. |
| `loading` | Restaurant 404 | `unavailable` | Show return-to-list action. |
| `loading` | Non-401 failure | `error` | Show safe message and retry. |
| Any authenticated state | HTTP 401 | logged out | Clear session and return to Login. |
| `ready` | Plus pressed | `ready` | Increment only that product by one. |
| `ready` | Minus at positive value | `ready` | Decrement only that product by one. |
| `ready` | Minus at zero | `ready` | Remain zero; no negative value. |
| `ready` | First positive quantity | `ready` | Enable Create Order. |
| `ready` | All values return to zero | `ready` | Disable Create Order. |
| `ready` | Enabled Create Order pressed | `confirmation-open` | Open one modal with positive quantities only. |
| `confirmation-open` | Close before submit | `ready` | Preserve current quantities. |
| Any menu state | Different restaurant ID | `loading` | Clear old state; new products start at zero. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Visual and Accessibility Contract

### Wireframe Composition

- Treat the Restaurant Menu / Order Page in `client/docs/m13/design/Wireframe.pdf` as the visual source.
- Preserve this hierarchy inside the shared authenticated frame:
  1. `RESTAURANT MENU` heading.
  2. Restaurant name, Price, and Rating summary.
  3. Create Order button aligned with the summary.
  4. Vertical product rows with image, name, price, description, minus, quantity, and plus.
- Keep the shared logo/Log Out header above and Restaurants/Order History tabs below.
- Scroll menu content between those shared areas without covering controls.

### Colors and Typography

- Use only centralized project palette values:
  - Orange-red: `#DA583B`.
  - Charcoal: `#222126`.
  - Dark red: `#851919`.
  - Muted green: `#609475`.
  - Warm yellow: `#F0CB67`.
  - White: `#FFFFFF`.
- Use global Arial/default body typography and Oswald display typography.
- Match the wireframe's charcoal text/icons, orange-red Create Order action, white/light menu surface, spacing, and compact product rows.
- A disabled Create Order/minus action must remain recognizable and readable without introducing unapproved colors.

### Accessibility

- Heading uses header semantics.
- Restaurant price/rating have spoken labels that explain numeric meaning rather than relying only on symbols.
- Each product image has an appropriate accessible label or is hidden when the adjacent product name already supplies the same information.
- Minus label identifies product and action, for example `Decrease Cheeseburger quantity`.
- Plus label identifies product and action, for example `Increase Cheeseburger quantity`.
- Quantity text exposes a readable value, for example `Cheeseburger quantity 2`.
- Minus exposes disabled state at zero; Create Order exposes disabled state when unavailable.
- All buttons meet the global minimum touch target and do not rely on color alone.
- Announce loading, empty, error, and meaningful quantity changes without producing repeated noisy announcements.
- Preserve logical screen-reader order: restaurant summary → Create Order → product rows and controls.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Expected Behavior

| Situation | Expected behavior |
| --- | --- |
| Valid restaurant opened | Correct restaurant and scoped products load with bearer token. |
| Invalid/missing route ID | No API request; unavailable state and return action display. |
| Menu first loads | Every product quantity is exactly zero. |
| Plus pressed rapidly | Each accepted press increments the correct product without lost updates. |
| Minus pressed at zero | Value stays zero and never becomes negative. |
| Some quantities positive | Create Order is enabled. |
| All quantities zero | Create Order is disabled. |
| Create Order pressed while enabled | One confirmation modal opens with positive-quantity products only. |
| Create Order pressed while disabled | No modal opens. |
| Different restaurant opened | Old products/quantities disappear; new quantities start at zero. |
| Same restaurant products reload | Existing valid quantities reconcile by product ID without index corruption. |
| Products response is empty | Empty-menu message appears; Create Order remains disabled. |
| Request fails | Safe retry state appears for the current restaurant. |
| HTTP 401 | Shared sign-out removes authenticated navigation and returns to Login. |
| Long menu | All products and controls remain reachable by vertical scrolling. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Technical Constraints (Feature-Level)

- Use JavaScript to match the current client; do not introduce TypeScript for only this feature.
- Use the existing Expo Router dynamic route and nested Restaurant Stack.
- Use the existing Spring Boot API as-is; do not modify `server/`.
- Use React Native components and shared client services; do not render browser-only React Bootstrap DOM components.
- Use a virtualized vertical list such as `FlatList` for menu products.
- Use functional state updates for quantities.
- Keep quantity state local to the selected menu route and keyed by product ID.
- Use only the verified shared currency conversion; do not duplicate conversion logic in row/modal components.
- Statically bundle the exact supplied `RestaurantMenu.jpg` runtime copy and preserve its support original.
- Use centralized palette, typography, spacing, layout, and minimum touch-target values.
- Follow global naming, file header/Contents, inline-comment, logging, secret, request, error, testing, branch, staging-command, and commit-message rules.
- Keep Menu rendering/selection separate from Confirmation submission without introducing an unrequested state library or architecture layer.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Acceptance Criteria

### Route, API, and Data

- [x] Restaurant Menu is the dynamic nested route `client/app/customer/restaurant/[restaurantId].js`.
- [x] Invalid, missing, zero, negative, decimal, or array route values make no menu request and show a safe return action.
- [x] Valid menu requests use the exact route restaurant ID and bearer token.
- [x] Restaurant detail response is validated and matches the route ID.
- [x] Products request uses `?restaurant=<restaurantId>` and never loads the global unfiltered list.
- [x] Every product is validated, uniquely keyed, and belongs to the selected restaurant.
- [x] Empty product arrays are handled as a valid empty menu.
- [x] The integer-cost currency rule has been verified in live API data and documented before formatting.

### Menu Display and Asset

- [x] The screen closely matches the supplied Restaurant Menu wireframe. (Wireframe-visual comparison completed by the operator.)
- [x] `RESTAURANT MENU`, restaurant name, price range, and rating display accurately.
- [x] Every product displays name, safe description, correctly formatted price, image, and controls.
- [x] `client/assets/RestaurantMenu.jpg` or the approved runtime equivalent exists and renders for every product row.
- [x] `client/assets/RestaurantMenu.jpg` remains present and byte-identical to the supplied original recorded in Git history.
- [x] Long product lists and wrapped content remain scrollable between the persistent header/footer.

### Quantities and Create Order

- [x] Every product starts at quantity `0`.
- [x] Quantities change only through minus/plus buttons in integer steps of one.
- [x] No editable quantity input exists.
- [x] Minus is disabled/safe at zero and quantities never become negative.
- [x] Rapid taps update the correct product without lost or cross-product changes.
- [x] A different restaurant resets every new product quantity to zero.
- [x] A same-restaurant product reload reconciles quantities by product ID.
- [x] Create Order is disabled while all quantities are zero or menu data is not ready.
- [x] Create Order enables as soon as at least one quantity is positive and disables again when all return to zero.
- [x] One enabled press opens exactly one confirmation modal.
- [x] The modal receives only positive-quantity products and no order request occurs merely by opening it.
- [x] Closing before submission preserves current menu quantities.

### States, Accessibility, and Documentation

- [x] Loading, empty menu, invalid route, unavailable restaurant, connection error, service/response error, retry, and HTTP 401 behaviors are distinct and user-safe.
- [x] Late/aborted requests cannot replace a newer restaurant's state.
- [x] Shared header/footer remain visible and usable throughout the authenticated menu flow.
- [x] Plus, minus, quantity, Create Order, retry, and return controls have correct labels, roles, disabled state, and touch targets.
- [x] Exact palette and shared fonts are used on iOS and Android.
- [x] Every changed human-authored JavaScript file has an accurate file name, purpose, numbered Contents list, and required detailed comments/JSDoc.
- [x] Postman contains preconfigured successful restaurant-detail and selected-restaurant-products requests plus relevant failure evidence.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Definition of Done

This feature is complete only when:

- Every in-scope sub-requirement and acceptance criterion passes against the existing Java API.
- The Menu screen contains the real restaurant summary, scrollable product list, quantity controls, and Create Order entry.
- The cost-unit conflict is resolved through real Postman/grading-data evidence and one shared conversion is documented and used consistently.
- `RestaurantMenu.jpg` is verified in the runtime client path, renders on both platforms, and remains preserved in support materials.
- Quantity initialization, plus/minus behavior, zero floor, route-change reset, same-restaurant reload, and rapid taps are verified.
- Create Order enables/disables correctly and opens one accurate confirmation modal without submitting prematurely.
- Loading, empty, unavailable, retryable error, stale-request, and expired-session paths behave deliberately.
- The screen closely matches the wireframe and remains accessible/scrollable at representative iPhone and Android dimensions.
- Relevant service/component tests, Expo iOS/Android bundle exports, Postman requests, and `git diff --check` pass; any unavailable live test is reported exactly rather than claimed.
- All changed source files retain accurate Contents headers and detailed comments next to non-obvious logic.
- The implementation follows `feature/restaurant-menu-page` → `dev` workflow, and the final AI handoff provides the exact scoped staging command before its copy-ready commit message.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Notes for the AI

- Read `ai/ai-spec.md` and this entire feature file before implementation.
- The grading sheet is authoritative: quantities start at zero, never become negative, change only by buttons, reset for another restaurant, disable Create Order at all-zero, open confirmation when enabled, and use `RestaurantMenu.jpg` everywhere.
- Use the route's real restaurant ID for both detail and product requests; never use a product/list index.
- Do not assume the API returns a bare array: both endpoints use `{ "message": "Success", "data": ... }`.
- Do not guess integer cost units. Resolve and document the current conflict before implementing currency conversion.
- Keep the raw confirmed cost available for confirmation/order calculations and format only at a shared display boundary.
- Keep quantity state keyed by product ID and use functional updates.
- Enforce the zero floor inside the handler even when the minus button is visually disabled.
- Opening Order Confirmation and submitting the order are separate state transitions owned by separate feature specifications.
- Preserve `client/assets/RestaurantMenu.jpg`; Git provenance confirms it is the byte-identical runtime owner of the supplied file.
- Preserve unrelated user changes and do not modify the Java backend.
- If implementation evidence changes an endpoint, field, currency rule, or lifecycle behavior, update this feature spec before continuing.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
