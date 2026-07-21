<a id="top"></a>

# AI Feature Specification — Restaurant List Page

> Defines the authenticated restaurant-browsing screen, rating and price filters, restaurant-card grid, and navigation to the selected restaurant menu. Use this document together with `ai/ai-spec.md`, `ai/features/navigation-structure.feature.md`, and `ai/features/header-footer.feature.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow](#user-flow-and-restaurant-list-logic)
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

- **Feature Name:** Customer Restaurant List and Filters
- **Related Area:** Mobile frontend, protected restaurant API, filtering, assets, nested restaurant navigation
- **Specification file:** `ai/features/restaurant-list-page.feature.md`
- **Screen route:** `client/app/customer/restaurant/index.js`
- **API endpoint:** `GET ${API_BASE_URL}/api/restaurants`
- **Implementation branch:** `feature/restaurant-list-page`

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Goal

Allow an authenticated customer to browse every available restaurant in the wireframe's scrollable card grid, optionally narrow the results by exact rating, exact price range, or both, and open the correct Restaurant Menu by pressing a restaurant image.

The initial Restaurants view must have neither filter selected and must request all restaurants. Every filter state must remain understandable, recoverable, and distinguish no matching restaurants from request failure. The page must use the supplied restaurant images and exact project palette while remaining usable on both iOS and Android.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Scope

### In Scope (Included)

- The authenticated Restaurant List route at `client/app/customer/restaurant/index.js`.
- A protected request to `GET /api/restaurants` using the persisted bearer token.
- Unfiltered initial loading with both query parameters omitted.
- Two filter controls labeled exactly `Rating` and `Price`.
- An unselected placeholder, such as `-- Select --`, in each filter.
- Rating-only, price-only, combined, and no-filter requests.
- A reliable way to return each control to its unselected state.
- A two-column, scrollable restaurant-card grid matching the supplied wireframe.
- Restaurant cards displaying an assigned supplied image, name, price-range symbols, and rating stars or a deliberate unrated state.
- Stable assignment of images from `client/images/restaurants/` so images do not flicker during rerenders.
- Loading, empty, no-match, error, retry, expired-session, and stale-request handling.
- Navigation from a pressed restaurant image to `/customer/restaurant/[restaurantId]` with only the selected public restaurant ID.
- Preservation of the selected filters and visible list position when normal back navigation returns from a Restaurant Menu during the current mounted Restaurants tab state.
- Shared authenticated header and footer integration without duplicating either component.
- Accessibility, safe-area compatibility, scroll behavior, and representative iOS/Android layouts.
- Postman coverage for unfiltered, rating-only, price-only, and combined restaurant requests.

### Out of Scope (Excluded)

- Login, session persistence, shared header rendering, logout, and footer-tab implementation; this feature consumes those shared contracts.
- Restaurant Menu data, product quantities, order creation, confirmation modal, or order history.
- Creating, updating, deleting, or administrating restaurants.
- Adding or changing Java endpoints, DTOs, repository queries, database schema, or seeded records.
- Client-side replacement of the existing server filtering contract.
- Free-text search, sorting, favorites, pagination, maps, distance calculation, cuisine filtering, or additional filter types.
- Uploading restaurant images or requiring image URLs from the restaurant API.
- Passing the JWT, customer ID, complete restaurant object, or image object through route parameters.
- Importing runtime images directly from `support_materials_13/`, or deleting a source image before its runtime copy has been verified.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Sub-Requirements (Feature Breakdown)

### Requirement A — Authenticated Restaurant Entry

- Restaurant List is the initial route of the Restaurants nested stack at `client/app/customer/restaurant/index.js`.
- A successful login and the authenticated Restaurants footer tab both lead to this route.
- The shared authenticated header and footer remain visible; the screen must not render duplicate header or tab controls.
- Do not issue the protected restaurant request until shared session resolution has produced a usable access token.
- On first entry with a usable session, initialize both filter values to `null` and load the unfiltered list.

### Requirement B — Protected Restaurant Request

- Send `GET ${API_BASE_URL}/api/restaurants` through the shared API client.
- Attach `Authorization: Bearer <accessToken>` through the shared authenticated request layer.
- Resolve `API_BASE_URL` from `EXPO_PUBLIC_API_URL`; never hard-code localhost, an ngrok domain, credentials, or a token.
- Expect the existing success envelope:

```json
{
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Example Restaurant",
      "price_range": 2,
      "rating": 4
    }
  ]
}
```

- Treat `data` as the restaurant array. Do not mistake the response envelope for a restaurant.
- Map `price_range` to `priceRange` once at the service boundary when the client uses camelCase domain objects.
- Apply a finite timeout/abort strategy and ignore results after the screen or owning request has been cancelled.

### Requirement C — Default Unfiltered Display

- The initial Rating value is unselected (`null`).
- The initial Price value is unselected (`null`).
- Both controls visibly show their placeholder while unselected.
- Omit both `rating` and `price_range` from the initial URL; do not send empty strings, `null`, `undefined`, placeholder text, or zero as substitutes.
- Render every restaurant returned by the unfiltered API response.
- Returning from a selected menu through normal stack back navigation must not reset the currently mounted filter selections or list position.

### Requirement D — Rating Filter

- Provide integer rating choices `1` through `5`, presented clearly as star values.
- Selecting a rating requests restaurants whose calculated API `rating` exactly matches that integer.
- When Price is unselected, send only `rating=<integer>`.
- Provide an explicit placeholder/unselected choice that removes the rating query parameter.
- Do not send decorative star characters as the API value.

### Requirement E — Price Filter

- Provide integer price-range choices `1`, `2`, and `3`, presented clearly as `$`, `$$`, and `$$$`.
- Selecting a price requests restaurants whose API `price_range` exactly matches that integer.
- When Rating is unselected, send only `price_range=<integer>`.
- Provide an explicit placeholder/unselected choice that removes the price query parameter.
- Do not send dollar-sign strings as the API value.

### Requirement F — Combined and Cleared Filters

- When both filters are selected, request:

```text
GET ${API_BASE_URL}/api/restaurants?rating=<integer>&price_range=<integer>
```

- Changing either control must build the next request from the complete next filter state, not from stale component state.
- Clearing one control keeps the other control active and omits only the cleared parameter.
- Clearing both controls returns to the unfiltered request and displays all returned restaurants.
- Encode query parameters with `URLSearchParams` or an equivalent safe URL builder.
- Do not append a bare `?` when no query parameters are present.

### Requirement G — Filter Request Coordination

- Enter a visible loading or refreshing state whenever a filter change starts a new request.
- Disable or safely coordinate rapid repeated changes so older responses cannot overwrite results for the newest selection.
- Abort the previous filter request where supported, or associate requests with a monotonically increasing request ID and accept only the latest result.
- Keep the selected controls visible while filtered results are loading.
- A failed filtered request must keep the customer's selections visible and provide retry for that same query.
- Do not silently fall back to unfiltered results after a filtered request fails.

### Requirement H — Restaurant Grid and Card Content

- Match the `Restaurants Page` wireframes in `support_materials_13/Design/Wireframe.pdf`.
- Display the page heading `NEARBY RESTAURANTS`.
- Display the subsection heading `RESTAURANTS` below the filter row.
- Render restaurant cards in a responsive two-column grid at normal phone widths, with consistent gutters and card dimensions.
- Each card displays:
  - One supplied restaurant image at the top.
  - The restaurant `name`.
  - The price range represented by `$`, `$$`, or `$$$`.
  - The rating represented by the matching number of stars.
- Keep text readable when a restaurant name wraps; do not overlap the next card or clip essential information.
- Render a returned rating of `0` as a deliberate `Not yet rated` or equivalent accessible unrated state rather than fabricating a positive rating.
- Never show `undefined`, `null`, raw object text, or a broken layout for invalid display data.

### Requirement I — Supplied Restaurant Images

- Copy the six supplied images from `support_materials_13/Images/Restaurants/` to the graded runtime path `client/images/restaurants/` before implementation is considered complete:
  - `cuisineGreek.jpg`
  - `cuisineJapanese.jpg`
  - `cuisinePasta.jpg`
  - `cuisinePizza.jpg`
  - `cuisineSoutheast.jpg`
  - `cuisineViet.jpg`
- After all six files have been copied successfully, verify that every destination file exists, is readable, and matches its source filename; then delete the six originals from `support_materials_13/Images/Restaurants/`.
- Never delete a source image when its destination copy is missing, unreadable, incomplete, or named incorrectly.
- Use static local `require(...)` entries or an equivalent React Native-compatible image registry; do not build dynamic string paths for `require`.
- The source permits any supplied restaurant image to be assigned to a card. Make the assignment stable for a restaurant during the current session/list lifecycle, preferably through a deterministic function of the restaurant ID, so rerenders and filter changes do not cause visible image flicker.
- Use an image resize mode and card crop consistent with the wireframe without stretching the source image.
- Provide a safe local fallback from the same supplied set if a mapped image cannot render.

### Requirement J — Restaurant Image Navigation

- Make every restaurant image an accessible press target.
- Pressing the image navigates within the Restaurants tab to:

```text
/customer/restaurant/[restaurantId]
```

- Pass only `restaurantId`, normalized to a non-empty string route parameter.
- Use the exact ID from the selected API restaurant; never use the grid index or image index as the restaurant ID.
- Do not navigate if the restaurant ID is absent, non-integer, or not positive.
- A rapid double press must not push duplicate Menu routes.
- Normal back navigation from the Menu returns to Restaurant List within the same Restaurants tab.
- The image itself must navigate even if an implementation also makes the surrounding card pressable.

### Requirement K — Loading, Empty, Error, and Retry States

- **Initial loading:** Show a visible progress state in the content area without hiding or replacing the shared header/footer.
- **Unfiltered empty:** Explain that no restaurants are currently available and offer retry.
- **Filtered no-match:** Explain that no restaurants match the selected filters and provide a clear path to change or clear filters; this is not an API error.
- **Connection/timeout error:** Show a concise retryable connection message.
- **Unexpected response or HTTP 5xx:** Show a generic service error and retry action without raw server details.
- **HTTP 401:** Run the shared session-expiry/sign-out flow, clear stale authentication data, and replace authenticated navigation with Login.
- **Retry:** Repeat the request for the exact filters currently shown.
- Preserve the last confirmed list during a background refresh only if the UI clearly indicates refreshing and never presents stale results as belonging to a newly selected filter.

### Requirement L — Scroll, Lifecycle, and Refresh Behavior

- Use a virtualized list suitable for a grid, such as `FlatList` with `numColumns={2}`, rather than nesting a full restaurant map inside a same-direction `ScrollView`.
- The complete heading, filters, result states, and grid must be vertically reachable on small screens.
- Keep the shared header and footer stable while the restaurant content scrolls between them.
- Use stable restaurant IDs as list keys; do not use array indexes.
- If pull-to-refresh is included, it reruns the request for the currently selected filters and does not reset them.
- Avoid updating state after unmount and clean up request cancellation/listeners.

### Requirement M — File Table of Contents and Detailed Inline Comments

- Every human-authored JavaScript file created or materially changed for this feature must begin with a block comment containing:
  - The exact file name.
  - A one-sentence purpose.
  - A numbered `Contents` list in the same order as the major sections in that file.
- Keep each file's `Contents` list synchronized whenever imports, constants, components, helpers, handlers, state logic, or styles are added, removed, or reorganized.
- Use a visible Markdown Table of Contents with working anchor links in this feature specification and in any other restaurant-list Markdown document with three or more major sections.
- Add detailed inline comments immediately above non-obvious restaurant-list logic. At minimum, comments must explain:
  - Why filter placeholder values are represented internally as `null` and omitted from the URL.
  - Why star and dollar-sign display values are converted to integer API query values.
  - Why `price_range` is mapped to `priceRange` at the API boundary.
  - How stale or aborted filter responses are prevented from replacing the newest results.
  - How stable restaurant-image assignment prevents image flicker across rerenders and filter changes.
  - Why the restaurant API `id`, rather than a list/image index, is used for Menu navigation.
  - Why an empty filtered response is a valid no-match state while HTTP/network failure is an error state.
  - Why HTTP 401 delegates to the shared sign-out flow.
  - Why source restaurant images are deleted only after all destination copies have been verified.
- Comments must describe the business reason, data contract, race-condition protection, or grading constraint—not merely restate the JavaScript syntax.
- Use complete, direct sentences and place each explanation next to the relevant block so a reader can understand the decision without searching another file.
- Add JSDoc for reusable service or helper functions when parameter, return-value, normalized-data, or thrown-error contracts are not obvious from the function name and implementation.
- Do not add a comment to every line, narrate obvious assignments or rendering, leave stale comments, paste prompts, expose credentials/tokens, or use comments to compensate for unclear names and oversized functions.
- Before completion, review every changed file and update or remove comments and TOC entries that no longer match the final implementation.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## User Flow and Restaurant List Logic

### Initial Unfiltered Load

1. The authenticated customer enters the Restaurants tab or completes Login.
2. The Restaurant List route mounts inside the nested Restaurant Stack.
3. Both filter values initialize as unselected and show placeholders.
4. The screen sends `GET /api/restaurants` with the bearer token and no filter query parameters.
5. A loading state appears while the request is pending.
6. The service validates the success envelope and maps every usable restaurant.
7. The screen displays all returned restaurants in the two-column card grid.

### Apply One Filter

1. The customer selects a Rating or Price value.
2. The visible control updates to the selected stars or dollar signs.
3. The screen creates a request containing only the selected filter parameter.
4. The newest request replaces/cancels any older pending filter request.
5. Matching results replace the previous grid, or the filtered no-match state appears when `data` is an empty array.

### Apply Both Filters

1. One filter is already selected.
2. The customer selects a value in the other control.
3. The screen sends both `rating` and `price_range` using their integer API values.
4. The grid displays only the API results for the combined selection.

### Clear Filters

1. The customer chooses the placeholder/unselected option for one filter.
2. The request omits that parameter while preserving the other selected filter, if any.
3. When both controls are unselected, the screen requests `/api/restaurants` without a query string.
4. All restaurants returned by the unfiltered endpoint display again.

### Open and Return From a Restaurant Menu

1. The customer presses the image on a restaurant card.
2. The screen validates the restaurant's API ID and prevents a duplicate push.
3. Expo Router pushes the dynamic Menu route with only `restaurantId`.
4. The Menu feature loads products for that ID.
5. Normal back navigation returns to the mounted Restaurant List with its current filters and scroll state intact where the navigator preserves the screen.

### Request Failure or Session Expiry

1. A connection, server, response, or authentication failure occurs.
2. A non-authentication failure displays a user-safe error and retry for the currently visible filters.
3. An HTTP 401 invokes the shared sign-out flow rather than showing a normal list error indefinitely.
4. Cleared authentication causes root navigation to replace the customer area with Login.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Frontend Routes and Layouts

| File | Responsibility |
| --- | --- |
| `client/app/customer/restaurant/index.js` | Owns filter selection, request/list screen state, result rendering, retry, and Menu navigation. |
| `client/app/customer/restaurant/_layout.js` | Defines Restaurant List as the nested stack entry and the dynamic Menu as its next screen. |
| `client/app/customer/restaurant/[restaurantId].js` | Receives the validated selected restaurant ID; its menu behavior belongs to the Restaurant Menu feature. |
| `client/app/customer/_layout.js` | Supplies the authenticated header/footer frame and Restaurants tab; does not duplicate list content. |

### Components

- `client/components/RestaurantCard.js` — renders the supplied image, name, price range, rating, accessibility, and menu press behavior.
- A small filter-select component may be extracted when it preserves the native mobile interaction and exact wireframe treatment.
- Reuse shared loading/error primitives only when they support the required initial, no-match, failure, and retry distinctions.

### Services and Configuration

- `client/services/restaurantService.js` — recommended owner of URL query construction, protected restaurant requests, response validation, and API-to-client field mapping.
- `client/services/apiClient.js` — owns the environment base URL, bounded JSON request behavior, bearer-token integration, and shared HTTP error classification.
- `client/constants/theme.js` — owns the exact palette, typography, spacing, and shared dimensions.
- A static restaurant-image registry should live in a clear client module near the restaurant component or image assets.

### Storage

- Read the access token only through the shared authentication/session layer.
- This feature does not create new AsyncStorage keys.
- Filter values and list position are screen/navigation state, not authentication storage.
- Do not persist the restaurant list, token, or selected restaurant object solely for navigation.

### Backend / API

`GET ${API_BASE_URL}/api/restaurants`

| Filter state | Request path |
| --- | --- |
| Neither selected | `/api/restaurants` |
| Rating only | `/api/restaurants?rating=4` |
| Price only | `/api/restaurants?price_range=2` |
| Rating and Price | `/api/restaurants?rating=4&price_range=2` |

- The endpoint is protected and requires `Authorization: Bearer <accessToken>`.
- The existing backend performs exact equality filtering for both values.
- A successful response is HTTP 200 with `{ "message": "Success", "data": [...] }`.
- An empty successful `data` array is a valid no-results response.
- This feature does not require `GET /api/restaurants/{id}`; add that call only if a later approved implementation demonstrates a real need.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Data, Validation, and State

### Restaurant Data Contract

| API field | Client field | Type | Validation and display rule |
| --- | --- | --- | --- |
| `id` | `id` | Integer | Required and greater than zero; use as list key and Menu route ID. |
| `name` | `name` | String | Required non-blank display name; trim only for validation/display safety. |
| `price_range` | `priceRange` | Integer | Expected `1`–`3`; display the same count of `$` symbols. |
| `rating` | `rating` | Integer | Expected `0`–`5`; display matching stars, with `0` shown as unrated. |

### Filter State

| UI state | Internal value | Query behavior |
| --- | --- | --- |
| Rating placeholder | `null` | Omit `rating`. |
| Rating selected | Integer `1`–`5` | Send `rating=<value>`. |
| Price placeholder | `null` | Omit `price_range`. |
| Price selected | Integer `1`–`3` | Send `price_range=<value>`. |

### Screen States

Use one explicit request status, for example:

```text
idle → loading → success
               ↘ empty
               ↘ error
```

- `idle`: Session/request prerequisites are still resolving; do not show false empty content.
- `loading`: A request is pending and progress is visible.
- `success`: The newest request returned one or more valid restaurants.
- `empty`: The newest request succeeded with no restaurants; message differs for filtered versus unfiltered state.
- `error`: The newest non-401 request failed and retry is available.
- Authentication expiry is handled by shared session state, not stored as a permanent restaurant-list error state.

### Validation and Normalization Rules

- Reject malformed success envelopes instead of crashing or rendering arbitrary values.
- Validate that `data` is an array.
- Do not silently use the array index as a missing restaurant ID.
- Do not send values outside the filter controls' allowed integer ranges.
- Encode only selected values; a placeholder is presentation, never API data.
- Duplicate restaurant IDs indicate malformed response data and must not produce unstable keys or incorrect navigation.
- User-visible errors must not include stack traces, bearer tokens, raw exception objects, or server internals.

### State Transitions

| Current state | Event | Next state | Required result |
| --- | --- | --- | --- |
| `idle` | Usable session available | `loading` | Start unfiltered request. |
| `loading` | Latest request returns rows | `success` | Render normalized cards. |
| `loading` | Latest request returns empty array | `empty` | Show correct unfiltered or filtered empty state. |
| Any result state | Filter changes | `loading` | Start request for complete next filters. |
| `loading` | Older request finishes late | unchanged | Ignore the stale result. |
| `loading` | Non-401 failure | `error` | Show safe message and retry. |
| `error` | Retry pressed | `loading` | Repeat current-filter request. |
| Any authenticated state | HTTP 401 | signed out | Clear session and replace with Login. |
| `success` | Valid image pressed | navigating | Push Menu route once with selected ID. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Visual and Accessibility Contract

### Wireframe Composition

- Treat `support_materials_13/Design/Wireframe.pdf`, Restaurants Page without filter and with filter, as the visual source.
- Preserve this top-to-bottom hierarchy inside the shared authenticated frame:
  1. `NEARBY RESTAURANTS` heading.
  2. Side-by-side Rating and Price controls.
  3. `RESTAURANTS` heading.
  4. Two-column restaurant-card grid or the current request state.
- The shared logo/Log Out header remains above the content and the Restaurants/Order History tabs remain below it.
- Content scrolls without being hidden behind the fixed shared areas.

### Colors and Typography

- Use only centralized project palette values:
  - Orange-red: `#DA583B`.
  - Charcoal: `#222126`.
  - Dark red: `#851919`.
  - Muted green: `#609475`.
  - Warm yellow: `#F0CB67`.
  - White: `#FFFFFF`.
- Use the global Arial/default body font and Oswald display font from the shared theme.
- Match the orange-red filter controls, charcoal headings/text, light card surface, spacing, rounded corners, and subtle card elevation shown by the wireframe.
- Do not add unapproved colors because a library's default select, spinner, or error style is convenient.

### Accessibility

- Every filter has the visible label and an accessibility label identifying `Rating filter` or `Price filter`.
- Announce the current selected value and expose the correct adjustable/menu control semantics supported by the chosen native component.
- Restaurant images have button semantics, an accessible name such as `Open <restaurant name> menu`, and a useful hint.
- Do not rely on star/dollar symbols, color, or image content alone; accessible labels must communicate numeric rating/price meaning.
- Provide at least the global minimum touch target around images, controls, retry, and filter-clearing actions.
- Loading and result-count/no-result messages should be announced appropriately without repeated noisy announcements on every render.
- Preserve readable contrast, dynamic text growth where practical, and logical screen-reader traversal order.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Expected Behavior

| Situation | Expected behavior |
| --- | --- |
| First authenticated entry | Both placeholders show; all restaurants are requested and displayed. |
| Rating selected | Only `rating` is sent unless Price is also selected. |
| Price selected | Only `price_range` is sent unless Rating is also selected. |
| Both selected | Both integer query parameters are sent and combined API results display. |
| One filter cleared | Only that query parameter is removed. |
| Both cleared | The exact unfiltered endpoint is requested again. |
| Rapid filter changes | Only the newest request can update the visible results. |
| Empty filtered response | A no-match message appears; selections remain visible and clearable. |
| Request failure | A safe error and current-query retry appear. |
| Expired token | Shared sign-out clears session and replaces customer navigation with Login. |
| Restaurant image pressed | The correct selected API ID opens one Menu route. |
| Back from Menu | Restaurant List returns without losing valid auth state; current mounted filters/list position remain where supported. |
| Long result set | Cards scroll between the persistent header and footer without clipping. |

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Technical Constraints (Feature-Level)

- Use JavaScript to match the current client; do not introduce TypeScript only for this feature.
- Use Expo Router's existing nested file-based navigation.
- Use the existing Spring Boot API as-is.
- Use the shared environment-driven API client and bearer-token/session contract.
- Use React Native components; do not render browser-only React Bootstrap DOM components in the native screen.
- Use `FlatList` or an equivalent virtualized native list for the two-column grid.
- Use centralized theme values and supplied assets only.
- Copy the six restaurant images to `client/images/restaurants/`, verify the destination files, and then delete their originals from `support_materials_13/Images/Restaurants/`; do not delete first or remove other support materials.
- Keep screen, service, image-registry, and component responsibilities separate enough to test without introducing an unrequested state library or architecture layer.
- Follow Requirement M and the global file-header, per-file TOC, naming, comment, logging, secret, and error-handling rules.
- Do not modify `server/` for this Module 13 feature.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Acceptance Criteria

### Entry and API

- [x] Restaurant List is the initial Restaurants stack screen after login and when the Restaurants tab is selected.
- [x] The shared header and footer appear once and remain usable.
- [x] The first restaurant request is authenticated and contains no filter query parameters.
- [x] The `{ message, data }` API envelope and `price_range` field are parsed correctly.
- [x] Every restaurant returned by the initial unfiltered request displays.

### Filters

- [x] Rating and Price controls implement the wireframe behavior and each shows a placeholder when unselected.
- [x] Neither filter is selected by default.
- [x] Rating-only selection sends only a valid integer `rating` query parameter.
- [x] Price-only selection sends only a valid integer `price_range` query parameter.
- [x] Combined selection sends both parameters and shows the combined API result.
- [x] Either control can return to its unselected state without resetting the other.
- [x] Clearing both controls calls the unfiltered endpoint again.
- [x] Rapid selection changes cannot allow stale response data to replace the newest results.

### Cards, Assets, and Navigation

- [x] Results render in a responsive two-column, scrollable grid implementing the supplied Restaurants wireframe structure.
- [x] Each card displays a stable supplied image, restaurant name, correct price symbols, and correct rating/unrated presentation.
- [x] All six supplied restaurant images exist and are readable under `client/images/restaurants/`, and their six originals are absent from `support_materials_13/Images/Restaurants/` after the verified move.
- [x] The restaurant image is an accessible press target.
- [x] Pressing an image opens exactly one Menu route for that restaurant's API `id`.
- [x] No token, customer ID, array index, or full restaurant object is passed as the Menu route identifier.
- [x] Back navigation returns to the Restaurant List without corrupting auth/filter state.

### States and Quality

- [x] Initial/filter loading is visible without freezing navigation.
- [x] Unfiltered empty, filtered no-match, connection error, server/response error, and retry are distinct and user-safe.
- [x] Retry repeats the request for the currently displayed filter values.
- [x] HTTP 401 invokes the shared session-expiry/sign-out behavior.
- [x] Long lists, long names, and small phone screens remain scrollable and readable.
- [x] Filter controls, image actions, state messages, and retry actions have correct accessibility behavior and touch targets.
- [x] The page uses the exact supplied palette and shared fonts on iOS and Android.
- [ ] Postman verifies no-filter, rating-only, price-only, combined, and no-match/boundary behavior against the existing API.

### Documentation and Code Readability

- [x] This feature specification retains its visible, accurate Markdown Table of Contents with working section links.
- [x] Every human-authored JavaScript file created or materially changed for this feature begins with an accurate file name, purpose, and numbered Contents list.
- [x] Every changed file's Contents list follows the actual source order and has been updated after the final implementation structure is known.
- [x] Detailed inline comments explain the non-obvious filter, API mapping, response-race, image-assignment, navigation-ID, empty/error, 401, and copy-verify-delete decisions listed in Requirement M.
- [x] Comments explain why the logic exists without narrating obvious syntax, exposing sensitive values, or becoming stale.
- [x] Reusable helpers with non-obvious parameters, return values, normalized data, or errors use accurate JSDoc where it materially improves the contract.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Feature Definition of Done

This feature is complete only when:

- Every in-scope sub-requirement and acceptance criterion passes against the existing Java API.
- The Restaurant List UI is the real authenticated grid and filter implementation.
- The unfiltered, rating-only, price-only, and combined flows are verified with real or contract-accurate responses.
- Restaurant image assignment is stable, all six required assets are verified in the graded runtime path, and their six support-material originals have then been deleted without removing unrelated support files.
- The correct restaurant ID reaches the dynamic Menu route through image navigation.
- Loading, empty, no-match, error, retry, stale-response, and expired-session paths behave deliberately.
- Every changed human-authored file has an accurate purpose/Contents header, and the required detailed inline comments remain next to the non-obvious logic they explain.
- The Restaurants page closely matches the supplied filtered and unfiltered wireframes and uses the exact project color scheme.
- The flow is manually checked on representative iOS and Android dimensions and, when physical-phone testing is used, through the configured ngrok API URL.
- Relevant automated/component/service tests pass, Postman cases pass, lint/static checks pass, and no new warning, secret, temporary log, generated file, or unrelated refactor remains.
- The implementation branch follows the global feature-branch, review, and merge workflow.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Notes for the AI

- Read `ai/ai-spec.md` and this entire feature file before implementing.
- The grading sheet is authoritative: all restaurants display initially, both filter placeholders are visible when unset, all four filter combinations work, and pressing a restaurant image opens its Menu.
- Use the real response wrapper and backend snake_case key. Do not infer a bare array or rename the query parameter to camelCase.
- Keep filter display values separate from API values: stars map to integers and dollar signs map to integers.
- Do not generate a new image on every render. A source image may be selected from the supplied set, but its assignment must remain stable enough to avoid flicker.
- For these six restaurant images only, this feature explicitly requires `copy → verify destination → delete source`; it overrides the global preserve-original asset rule without authorizing deletion of any other support material.
- Treat an empty filtered array as a valid no-match state, not a request error.
- Prevent response races when customers change selectors quickly.
- Treat the per-file Contents headers and detailed inline comments in Requirement M as required deliverables, not optional cleanup.
- Preserve the current working nested navigation, session, header, and footer contracts; do not refactor unrelated features.
- Do not modify the Java backend or invent another endpoint to simplify the client.
- If an implementation decision conflicts with the grading sheet, business document, wireframe, or global spec, follow the authority order in `ai/ai-spec.md` and record unresolved questions instead of guessing.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
