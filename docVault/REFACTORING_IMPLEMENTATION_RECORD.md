<a id="top"></a>

# Refactoring Implementation Record

This document is the canonical, append-only committed completion history for work selected from the point-in-time candidate inventory in [`REFACTORING_AUDIT.md`](REFACTORING_AUDIT.md). Feature specifications under [`ai/features/`](../ai/features/) define required behavior; they do not own refactoring history. The ignored `.omi/m14/IMPLEMENTATION_LOG.md` contains private per-pass handoff notes and is never normative.

Add an entry only after the selected work and its available verification are complete. A proposal, selection, partial edit, or unverified change is not completed work. Entries remain chronological; if completed work is revised or reverted, append a dated correction rather than rewriting history.

#### RF-19 — Remove stale `@JsonAlias` claims

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P0
- **Reason and benefit:** Source/test comments claimed the backend accepted notification keys via `@JsonAlias`, but the DTO now uses canonical camelCase (`sendEmail` default-mapped, `sendSms` via `@JsonProperty("sendSMS")`). The stale claim contradicted the graded HTTP contract.
- **Files affected:** `client/services/orderService.js`, `server/src/test/java/com/rocketFoodDelivery/rocketFood/order/OrderApiControllerTest.java`
- **Change:** Rewrote both comments to describe the canonical camelCase mapping; no code/behavior change. Snake_case is intentionally not accepted (verified by the existing DTO deserialization test).
- **Verification:** `rg JsonAlias client server` → no matches; `mvnw test` for `OrderApiControllerTest,ApiCreateOrderDTODeserializationTest` (local MySQL) → 15 passed, 0 failures.

#### RF-03 — Reuse the shared email validator in Login

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** Login defined a local `EMAIL_PATTERN` duplicating the `isValidEmail` rule already owned by `utils/validation.js` (used by Account). Sharing it prevents Login and Account email validation from drifting.
- **Files affected:** `client/app/index.js`
- **Change:** Imported `isValidEmail`, replaced `EMAIL_PATTERN.test(email)` with `!isValidEmail(email)`, and deleted the local regex. Behavior identical (empty → required message first, non-empty invalid → shape message).
- **Verification:** `npx expo export --platform android` EXIT 0; `git diff --check` clean. Native email-field manual check pending.

#### RF-04 — Route guards consume the `ROLES` constants

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** Root and role tab guards repeated raw `'customer'`/`'courier'` string literals despite `authStorage.js` exporting the canonical `ROLES`. Using the constants removes typo-prone literals at the security-sensitive navigation boundary.
- **Files affected:** `client/app/_layout.js`, `client/app/customer/_layout.js`, `client/app/courier/_layout.js`
- **Change:** Imported `ROLES` and replaced the raw role literals in the active-role guards with `ROLES.customer` / `ROLES.courier`. No route/guard behavior change.
- **Verification:** `rg` confirms no raw role literals remain in guards; `npx expo export --platform android` EXIT 0. Native four-way navigation (logged-out, customer-only, courier-only, dual-pending) manual check pending.

#### RF-07 — Clear the confirmation modal's settled abort controller

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** `OrderConfirmationModal` stored the active `AbortController` but never cleared it in `finally`, so closing a settled modal aborted a stale controller — unlike the Login/Account request owners.
- **Files affected:** `client/components/OrderConfirmationModal.js`
- **Change:** In `finally`, clear `abortControllerRef.current` only when it still equals the local controller. Visible idle/processing/success/failure behavior unchanged.
- **Verification:** `npx expo export --platform android` EXIT 0. Native confirm/failure/close-during-processing/close-after-settle manual checks pending.

#### RF-08 — Emit the font-load warning from an effect

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** The dev-only font-failure warning ran during render, so unrelated re-renders could repeat it and logging became a render side effect.
- **Files affected:** `client/app/_layout.js`
- **Change:** Moved the `__DEV__` `console.warn` into a `useEffect` keyed by `fontError`. Font-fallback and loading behavior unchanged.
- **Verification:** `npx expo export --platform android` EXIT 0.

#### RF-20 — Correct obsolete role-scope comments

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The mandatory `_layout.js` header described only login/customer routes and `AppHeader.js` comments said only Customer tabs install it and logout returns "the customer" to Login. The app now supports Customer and Courier.
- **Files affected:** `client/app/_layout.js`, `client/components/AppHeader.js`
- **Change:** Updated the file header and JSDoc to reference login/account-selection/role routes and the Customer *and* Courier layouts; logout "returns the user to Login." Comments only.
- **Verification:** Manual header review; `npx expo export --platform android` EXIT 0.

#### RF-22 — Aggregate the malformed-order development warning

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** `normalizeCustomerOrders` could emit one identical warning for every malformed/duplicate row on every refresh.
- **Files affected:** `client/services/orderService.js`
- **Change:** Count skipped rows and emit at most one `__DEV__` warning after normalization, containing only a count — never IDs, customer data, or tokens. Valid rows still render; malformed/duplicate rows still skipped.
- **Verification:** `npx expo export --platform android` EXIT 0. A mixed valid/invalid/duplicate response unit test remains a pending gap.

#### RF-36 — Tidy the order controller test

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The test constructed two throwaway `ObjectMapper`s despite an injected one and duplicated the `createFreshOrder` fixture in the delete test.
- **Files affected:** `server/src/test/java/com/rocketFoodDelivery/rocketFood/order/OrderApiControllerTest.java`
- **Change:** Use the injected `objectMapper` in both create tests; reuse `createFreshOrder` in `testDeleteOrder_Success`. Assertions and endpoint coverage unchanged.
- **Verification:** `mvnw test` for `OrderApiControllerTest,ApiCreateOrderDTODeserializationTest` (local MySQL) → 15 passed, 0 failures.

#### RF-12 — Share order-date normalization/formatting

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P1
- **Reason and benefit:** `OrderHistoryModal.js` and `DeliveryDetailsModal.js` defined byte-identical `ORDER_DATE_FORMATTER` and `formatOrderDate` (same microsecond-trim regex, same invalid-date guard, same blank fallback). Sharing one copy guarantees the documented project-wide date format cannot drift between the two modals.
- **Files affected:** `client/utils/orderFormatting.js` (new), `client/components/OrderHistoryModal.js`, `client/components/DeliveryDetailsModal.js`
- **Change:** Moved the formatter/constant into `client/utils/orderFormatting.js` (matching the directory's existing one-concern-per-file convention, e.g. `validation.js`); both modals import `formatOrderDate` and deleted their local copies. No output/behavior change.
- **Verification:** `git diff --check` clean; `npx expo export --platform android` EXIT 0. Manual ISO-milliseconds/microseconds/blank/malformed-date checks in both modals remain a native regression item.

#### RF-14 — Share the base order-product normalizer

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P1
- **Reason and benefit:** `normalizeOrderProduct` (customer history) and `normalizeDeliveryProduct` (courier delivery) in `orderService.js` duplicated the same id/name/quantity/total-cost guard and validation; the courier variant only added `unit_cost`. A shared base prevents the common contract from drifting between the two paths.
- **Files affected:** `client/services/orderService.js`
- **Change:** Added a private `normalizeBaseOrderProduct` with the shared guard/validation; `normalizeOrderProduct` now returns it directly, and `normalizeDeliveryProduct` calls it then additionally parses/validates `unit_cost` and spreads it in. Same all-or-nothing null-on-failure contract; no caller changes.
- **Verification:** `git diff --check` clean; `npx expo export --platform android` EXIT 0.

#### RF-01 — Centralize protected HTTP failure classification

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P0
- **Reason and benefit:** `restaurantService.js` and `productService.js` only treated HTTP 401 as an expired/invalid session, while this backend (confirmed live and documented in `orderService.js`) reports a missing/invalid/expired bearer token as 401 **or** 403. Restaurant List, Restaurant Menu, and product/menu loads were not signing the user out on a 403. `orderService.js` also had four in-file duplicates of the same correct 401/403+5xx ladder.
- **Files affected:** `client/services/apiClient.js`, `client/services/restaurantService.js`, `client/services/productService.js`, `client/services/orderService.js`, `client/services/accountService.js`
- **Change:** Added `classifyProtectedFailure(response, messages)` to `apiClient.js` (the shared-transport-behavior owner), throwing `unauthorized` for 401/403 and `service` for 5xx from one place. Adopted it at all 7 call sites — `restaurantService.fetchRestaurants`/`fetchRestaurantById` (fixing the 403 bug), `productService.fetchProductsForRestaurant` (fixing the 403 bug), `orderService.createOrder`/`fetchCustomerOrders`/`requestDeliveryList`/`throwForMutationFailure`, and `accountService.throwForAccountFailure` — each keeping its own subsequent domain-specific checks (404/400/`!response.ok`) unchanged and in the same relative order (safe because HTTP statuses are mutually exclusive).
- **Verification:** `git diff --check` clean; `npm ls --depth=0` clean; `npx expo config --type public` EXIT 0; `npx expo export --platform android` EXIT 0. Native confirmation that Restaurant List/Menu/product load now sign out on a 403 remains a pending manual check.

#### RF-17 — Use shared success-envelope predicates/normalizers

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P2
- **Reason and benefit:** Four services repeated the same `{message:"Success", data:[...]}` list-envelope check and three repeated the same single-object envelope check, each with its own copy of the identical guard logic. One non-conforming variant in `restaurantService.fetchRestaurantById` also merged a transport check into its envelope check.
- **Files affected:** `client/services/apiClient.js`, `client/services/orderService.js`, `client/services/restaurantService.js`, `client/services/productService.js`, `client/services/accountService.js`
- **Change:** Added `requireSuccessList`/`requireSuccessObject` to `apiClient.js`. Adopted at all 7 canonical sites (`orderService.normalizeCustomerOrders`/`normalizeDeliveryList`/`normalizeCreatedOrder`/`normalizeUpdatedDelivery`, `restaurantService.normalizeRestaurants`, `productService.normalizeProducts`, `accountService.normalizeAccount`), each keeping its own subsequent field/coherence checks. Also split `fetchRestaurantById`'s merged transport+envelope check so its transport check stays a plain `!response.ok` and its envelope check routes through `requireSuccessObject` too — the observable result (same thrown `response` error) is unchanged, only detected one line earlier.
- **Verification:** `git diff --check` clean; `npm ls --depth=0` clean; `npx expo config --type public` EXIT 0; `npx expo export --platform android` EXIT 0. `rg` confirms no manual `message !== 'Success'` checks remain in the four touched services.

#### RF-16 — Consolidate required-session resolution (partial, evidence-scoped)

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P1
- **Reason and benefit:** Five distinct session-precondition shapes existed across services; only one (role-neutral: restaurant list/detail, product/menu reads) had ≥2 real callers with an identical contract, and one in-file duplicate existed (`fetchCourierDeliveries` re-inlined the same check `requireCourierSession()` already implements). The other three shapes (order creation, customer-scoped, account dual-ID) are genuinely different security postures with a single caller each or an already-appropriate local helper, so they were intentionally left as documented duplication rather than forced into one generic helper (which the reuse test's "no sprawling flag/config object" rule argues against).
- **Files affected:** `client/services/apiClient.js`, `client/services/restaurantService.js`, `client/services/productService.js`, `client/services/orderService.js`
- **Change:** Added `requireSession(tokenMessage)` to `apiClient.js` for the 3 role-neutral callers; `restaurantService.fetchRestaurants`/`fetchRestaurantById` and `productService.fetchProductsForRestaurant` now call it instead of inlining `getStoredSession`+`!session` checks. `orderService.fetchCourierDeliveries` now calls the existing `requireCourierSession()` instead of re-inlining its identical check. `createOrder`'s weaker session-only check and `fetchCustomerOrders`'s customer-scoped check were deliberately left untouched (different, intentional security postures, not a bug).
- **Verification:** `git diff --check` clean; `npm ls --depth=0` clean; `npx expo config --type public` EXIT 0; `npx expo export --platform android` EXIT 0.

#### RF-09 — Extract the duplicated Customer/Courier tab shell

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P1
- **Reason and benefit:** `client/app/customer/_layout.js` and `client/app/courier/_layout.js` shared ~90 byte-identical lines (the `TabIcon` helper, the full `Tabs screenOptions` object, and all 5 style keys), differing only in the guard's role/ID field and the tab descriptor list.
- **Files affected:** `client/components/RoleTabsLayout.js` (new), `client/app/customer/_layout.js`, `client/app/courier/_layout.js`
- **Change:** Extracted the shared shell into `RoleTabsLayout` (props: `isAuthorized` boolean, a literal `screens` descriptor array). Each thin `_layout.js` keeps its own `unstable_settings` (Expo Router reads this from the route file itself), computes its own `isAuthorized` guard expression, and passes its own descriptor list; only the identical header/style/tab-registration mechanics moved.
- **Verification:** `git diff --check` clean; `npm ls --depth=0` clean; `npx expo config --type public` EXIT 0; `npx expo export --platform android` EXIT 0. Native re-verification of both tab bars (titles/icons/order/initial route/active-indicator styling, logout, wrong-role redirect both directions) remains a pending manual check.

#### RF-11 — Extract the duplicated refresh-error banner

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P2
- **Reason and benefit:** `customer/order-history.js` and `courier/index.js` rendered byte-identical refresh-failure banner JSX and 5 style keys, separate from the already-shared `ResultState` component.
- **Files affected:** `client/components/RefreshErrorBanner.js` (new), `client/app/customer/order-history.js`, `client/app/courier/index.js`
- **Change:** Extracted `RefreshErrorBanner` (props: `message`, `onRetry`; renders `null` when no message). Both screens replaced their inline banner block with it and removed the now-unused style keys.
- **Verification:** `git diff --check` clean; `npx expo export --platform android` EXIT 0. Manual failed-refresh check on both screens remains a pending native item.

#### RF-10 — Extract the duplicated focus-refresh list lifecycle

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P1
- **Reason and benefit:** `customer/order-history.js` and `courier/index.js` duplicated ~90 lines of identical state/refs/`useFocusEffect` lifecycle (generation-staleness guard, loading-vs-refreshing distinction, aborted/unauthorized/refresh-preserves-rows/first-load-error branches, abort-on-blur cleanup). Courier's screen additionally owns a mutation state machine (`activeMutation`, mutation refs, `runStatusMutation`, etc.) with no counterpart in the customer screen, which the extraction must not absorb.
- **Files affected:** `client/components/useProtectedFocusList.js` (new), `client/app/customer/order-history.js`, `client/app/courier/index.js`
- **Change:** Extracted `useProtectedFocusList({fetchItems, handleUnauthorized, messages, session})` returning `{items, requestStatus, errorMessage, refreshErrorMessage, isRefreshing, hasRows, retry, setItems}` — a raw setter, matching exactly what each screen did with local state today. `order-history.js` calls it with `fetchCustomerOrders` and keeps its own `selectedOrder`/modal logic untouched. `courier/index.js` calls it with `fetchCourierDeliveries`; its mutation state machine stays entirely in the screen, unchanged, except `applyMutationSuccess` now calls the hook's `setDeliveries`/`retry()` (aliased `handleRetry`) instead of local equivalents — the same two operations, sourced from the hook.
- **Verification:** `git diff --check` clean; `npm ls --depth=0` clean; `npx expo config --type public` EXIT 0; `npx expo export --platform android` EXIT 0. This is the largest/highest-risk item in the batch; full native regression (first load, focus refresh, empty/failed refresh with/without rows, rapid tab switching, logout mid-request, and the courier accept/deliver/partial-retry flow against the hook's exposed `setItems`/`retry`) remains a pending manual check for both screens.

#### RF-02 — Use one safe identifier rule everywhere

- **Completed:** 2026-07-21 15:29 America/New_York
- **Priority:** P0
- **Reason and benefit:** `authService.isUsableIdentifier` and `authStorage.normalizeStoredIdentifier` each used their own `Number.isInteger`/regex-based check, which incorrectly accepts a digit string one above `Number.MAX_SAFE_INTEGER` (or an all-9s string that overflows to `Infinity`), unlike the already-shared `isPositiveSafeInteger` three other services already use. The divergence was one-directional (current code over-accepts unsafe-integer overflow); no valid seeded ID is affected.
- **Files affected:** `client/services/authService.js`, `client/storage/authStorage.js`
- **Change:** Both functions now route their number-producing branch through `isPositiveSafeInteger` from `utils/validation.js`, with no change to either function's name, signature, or return shape/type — zero caller changes.
- **Verification:** `git diff --check` clean; `npx expo export --platform android` EXIT 0. Boundary values (`1`, `"1"`, `" 1 "`, `0`, `-1`, `1.5`, `""`, `"abc"`, `Number.MAX_SAFE_INTEGER`, one above it) reasoned through by inspection; native login/session-restore smoke test for customer-only/courier-only/dual-role remains a pending manual check.

#### RF-05 — Key delivery metadata from the status constants

- **Completed:** 2026-07-21 16:35 America/New_York
- **Priority:** P1
- **Reason and benefit:** Delivery tokens, labels, theme-map keys, backend spellings, and mutation IDs repeated the same three status names in separate owners. Centralized metadata makes a status-token change fail visibly in one module instead of silently desynchronizing UI colors, labels, response normalization, or persisted status IDs.
- **Files affected:** `client/constants/deliveryStatus.js` (new), `client/constants/theme.js`, `client/services/orderService.js`, `client/services/orders/courierDeliveries.js`
- **Change:** Added a dependency-light status module retaining the exact `PENDING`, `IN_PROGRESS`, and `DELIVERED` tokens, visible labels, verified lowercase backend spellings, and backend IDs 1/2/3. Theme colors now use computed `DELIVERY_STATUS` keys; courier normalization/mutations consume the same metadata; the established `orderService.js` facade still re-exports `DELIVERY_STATUS` and `DELIVERY_STATUS_LABELS` for compatibility. No backend/API change.
- **Verification:** Focused metadata assertions passed 12/12; Babel parsed all 11 changed client files; all 42 relative import/export targets resolved; `npm ls --depth=0`, `npx expo config --type public`, and `git diff --check` passed. Native courier list/detail colors and pending → in-progress → delivered persistence remain in the deferred manual checklist.

#### RF-06 — Make confirmation total arithmetic explicitly safe

- **Completed:** 2026-07-21 16:35 America/New_York
- **Priority:** P2
- **Reason and benefit:** Individually valid costs and quantities could overflow during multiplication or accumulation. A pure helper now rejects unsafe arithmetic before the UI can present a misleading rounded total or submit an internally invalid extreme selection.
- **Files affected:** `client/utils/orderTotals.js` (new), `client/components/OrderConfirmationModal.js`
- **Change:** Added safe line multiplication and order accumulation with input validation and explicit `Number.MAX_SAFE_INTEGER` addition protection. Normal and empty selections retain their prior totals; invalid/overflow values return `null`, render through the existing safe currency placeholder, and block submission. The create-order payload is unchanged because the backend remains authoritative for totals.
- **Verification:** Seven focused arithmetic cases passed: empty, normal multi-product, zero-cost, maximum-safe multiplication, unsafe multiplication, unsafe accumulation, and invalid negative cost. Babel parse, dependency resolution, Expo config, dependency-tree, and whitespace checks passed. Native modal display/submission regression remains deferred.

#### RF-15 — Split the order service behind its stable facade

- **Completed:** 2026-07-21 16:35 America/New_York
- **Priority:** P1
- **Reason and benefit:** One 754-line service owned creation, customer history, courier retrieval, and courier mutations. Focused modules reduce review surface and make each order flow easier to maintain while keeping callers insulated from the internal layout.
- **Files affected:** `client/services/orderService.js`, `client/services/orders/createOrder.js` (new), `client/services/orders/customerOrders.js` (new), `client/services/orders/courierDeliveries.js` (new), `client/services/orders/orderShared.js` (new), `client/constants/deliveryStatus.js` (new)
- **Change:** Converted `orderService.js` into a small compatibility facade that re-exports the same nine public names. Moved create-order, customer-history, and courier-delivery behavior into focused modules and retained shared error messages/product normalization in `orderShared.js`. Existing component imports, endpoints, methods, query parameters, request bodies, response guards, error codes, identity checks, and mutation sequencing are unchanged. No backend/API change.
- **Verification:** Previous and current public export names were compared; Babel parsed all 11 changed files; all 42 relative import/export targets resolved; `npm ls --depth=0`, `npx expo config --type public`, and `git diff --check` passed. Full Android export and live customer/courier request regressions are deferred under the token-efficient test policy.

#### RF-18 — Replace selected lifecycle literals with local constants

- **Completed:** 2026-07-21 16:35 America/New_York
- **Priority:** P2
- **Reason and benefit:** Repeated lifecycle strings in the confirmation, Account, and courier mutation owners were typo-prone and made allowed values harder to review. Frozen local constants improve transition readability without introducing global state coupling or a higher-risk reducer rewrite.
- **Files affected:** `client/components/OrderConfirmationModal.js`, `client/components/AccountScreen.js`, `client/app/courier/index.js`
- **Change:** Added component-local frozen constants for confirmation submission, Account load/save, courier mutation, and courier list-display states; replaced the corresponding initial values, setters, and comparisons. All existing visible states, retry paths, draft preservation, abort handling, and transition behavior remain unchanged; no reducer or backend change was introduced.
- **Verification:** Targeted search found no remaining raw lifecycle literals in the selected setters/comparisons/phases; Babel parse, import resolution, Expo config, dependency-tree, and whitespace checks passed. Native transition-table regression for confirmation, Account, and courier mutations remains deferred.

#### RF-26 — Remove React Bootstrap

- **Completed:** 2026-07-21 16:52 America/New_York
- **Priority:** P1
- **Reason and benefit:** `react-bootstrap` was declared directly but no first-party client file imported it; `npm explain` confirmed the root project was its only owner. Removing this web UI library reduces an unused dependency branch without touching the React Native presentation stack.
- **Files affected:** `client/package.json`, `client/package-lock.json`
- **Change:** Removed `react-bootstrap` with npm so the manifest and lockfile changed together. No component, route, icon, style, or runtime behavior changed.
- **Verification:** Caller search found no first-party import; `npm ls --depth=0` is clean; the focused Jest suite passes 58/58; `npx expo install --check` reports dependencies up to date using Expo SDK 54's local compatibility map because network validation was unavailable. Full platform export remains deferred under the token-efficient test policy.

#### RF-27 — Remove the redundant direct Expo Vector Icons declaration

- **Completed:** 2026-07-21 16:52 America/New_York
- **Priority:** P2
- **Reason and benefit:** First-party icons use the established FontAwesome SVG stack and never import `@expo/vector-icons`. Expo 54 already declares and installs it transitively, so listing the same package as an application dependency falsely implied direct ownership.
- **Files affected:** `client/package.json`, `client/package-lock.json`
- **Change:** Removed only the root project's direct declaration. Expo's transitive `@expo/vector-icons` installation remains in the resolved dependency tree; all FontAwesome and `react-native-svg` dependencies were retained. No icon implementation changed.
- **Verification:** First-party caller search is empty; the lockfile confirms Expo 54 still declares `@expo/vector-icons`; `npm ls --depth=0`, 58 focused Jest assertions, and the local Expo dependency check pass. Native icon rendering remains in the deferred manual checklist.

#### RF-29 — Add focused client unit-test tooling

- **Completed:** 2026-07-21 16:52 America/New_York
- **Priority:** P1
- **Reason and benefit:** The client had no repeatable test command, so pure validation, total-arithmetic, route-ID, and quantity-state regressions depended on manual reasoning or a full Expo build. A narrow Jest setup provides fast, reviewer-runnable evidence without a simulator.
- **Files affected:** `client/package.json`, `client/package-lock.json`, `client/utils/__tests__/validation.test.js` (new), `client/utils/__tests__/orderTotals.test.js` (new), `client/utils/__tests__/menuState.test.js` (new)
- **Change:** Added the Expo SDK 54-compatible `jest-expo` preset and Jest 29 as development-only dependencies, a concise non-watch `npm test` command, an opt-in `test:watch` command, and three pure utility suites. No UI-testing library, snapshot suite, simulator, TypeScript tooling, or production dependency was added.
- **Verification:** `npm test` → 3 suites passed, 58 tests passed, 0 snapshots, approximately 1.2 seconds; all three test files parse; `npm ls --depth=0` is clean. `npm audit --omit=dev` still reports 13 moderate advisories in the retained Expo 54 dependency tree whose proposed automatic fix is the breaking Expo 57 upgrade; no force-fix or SDK upgrade was applied.

#### RF-39 — Investigate duplicate `org.json.JSONObject` providers and retain both

- **Completed:** 2026-07-21 16:52 America/New_York
- **Priority:** P3
- **Reason and benefit:** The Maven warning needed dependency-owner evidence before any exclusion. The investigation showed the two providers serve different established owners, so retaining both avoids an unverified notification or assertion regression.
- **Files affected:** None (read-only dependency investigation).
- **Change:** `mvn dependency:tree` traced `com.vaadin.external.google:android-json` to Spring Boot Test → JSONassert and `org.json:json` to the compile-scoped Twilio SDK. No exclusion or backend file change was made because full provider and MySQL-backed regression evidence is unavailable; RF-37/RF-38 remain deferred per the selected zero-backend-change scope.
- **Verification:** Focused Maven dependency-tree command completed successfully and identified both paths. A future exclusion requires the full notification/provider tests plus database-backed backend suite.

#### RF-21 — Remove repeated “Read aloud” comment lines

- **Completed:** 2026-07-21 17:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** Pronunciation-only annotations narrated function names but did not explain ownership, invariants, contracts, or grading behavior. Removing them makes the required technical comments easier to scan without reducing useful documentation.
- **Files affected:** 39 JavaScript files: `client/app/{_layout.js,index.js,selection.js}`, `client/app/courier/{_layout.js,account.js,index.js}`, `client/app/customer/{_layout.js,account.js,order-history.js}`, `client/app/customer/restaurant/{_layout.js,index.js,[restaurantId].js}`, `client/components/{AccountScreen.js,AppHeader.js,AppIcon.js,DeliveryDetailsModal.js,DeliveryRow.js,ErrorBoundary.js,FilterSelect.js,OrderConfirmationModal.js,OrderHistoryModal.js,OrderHistoryRow.js,RefreshErrorBanner.js,RestaurantCard.js,ResultState.js,RoleTabsLayout.js,useProtectedFocusList.js}`, `client/constants/{currency.js,restaurantImages.js}`, `client/contexts/AuthContext.js`, `client/services/{accountService.js,apiClient.js,authService.js,restaurantService.js}`, `client/services/orders/courierDeliveries.js`, `client/storage/authStorage.js`, `client/utils/{orderFormatting.js,restaurantLabels.js,validation.js}`
- **Change:** Removed exactly 115 lines containing `Read aloud:`. Mandatory headers, JSDoc descriptions/types/throws, caller notes, race/security explanations, and non-obvious mapping/recovery comments remain. No executable code changed.
- **Verification:** Targeted search returns zero `Read aloud:` matches; the initial zero-context client diff contained exactly 115 removals and no additions; all affected JavaScript still parses. Header normalization completed separately under RF-44.

#### RF-31 — Simplify stale and redundant ignore entries

- **Completed:** 2026-07-21 17:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** The general `node_modules/` rule already covered `client/node_modules`, while the ignored `ai/M14/features/feature-name.feature.md` path belonged to a removed directory and did not govern the real tracked template.
- **Files affected:** `.gitignore`
- **Change:** Removed only those two redundant/stale rules and their now-extra spacing. Secret, environment, dependency, Expo/native output, Java target, IDE/OS, local Spring, and private `.omi` coverage remains unchanged.
- **Verification:** `git check-ignore --no-index` confirms representative client dependencies, `.omi`, `.env`, Expo state, Java target, and local Spring files remain ignored; the stale M14 template path is no longer ignored.

#### RF-40 — Repair README structure and documentation links

- **Completed:** 2026-07-21 17:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The README tree and related-document links pointed to removed root paths and omitted the current role routes and design-reference owner. Reviewers could not navigate the documented repository confidently.
- **Files affected:** `README.md`
- **Change:** Replaced the obsolete support-material, root Concepts, and root Research entries with `client/docs/`, `Concepts/M13/`, and `docVault/`; corrected both local links; synchronized the route tree with Account Selection, Customer Account, and Courier tabs. No product contract changed.
- **Verification:** Every local README Markdown link resolves and every documented top-level/current client path exists.

#### RF-41 — Reconcile manual-QA claims with observed evidence

- **Completed:** 2026-07-21 17:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The README claimed the complete customer journey had passed on iOS and Android, while the canonical specifications still marked native coverage pending. The record now distinguishes the user's actual smoke check from unperformed scenarios.
- **Files affected:** `README.md`, `ai/features/ui.feature.md`
- **Change:** Recorded the 2026-07-21 Expo Go smoke check on an iPhone 17 Pro Max iOS Simulator using the ngrok-backed API URL: the app opened and login plus the initial authenticated view succeeded. Full iOS journeys, Android, persistence/restart, customer/courier flows, scrolling, and keyboard scenarios remain explicitly pending.
- **Verification:** README and UI-spec statements now agree; no Android, physical-device, full-journey, or database result is claimed.

#### RF-42 — Reconcile obsolete support-material paths

- **Completed:** 2026-07-21 17:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** Seven retained M13 feature contracts referenced a support-material directory that Git history shows was intentionally consolidated and removed after its authoritative files were ported. Current specifications now point to reviewable files instead of nonexistent paths.
- **Files affected:** `ai/features/header-footer.feature.md`, `ai/features/login-page.feature.md`, `ai/features/menu-modal-confirmation.feature.md`, `ai/features/order-history-modal.feature.md`, `ai/features/order-history-page.feature.md`, `ai/features/restaurant-list-page.feature.md`, `ai/features/restaurant-menu-page.feature.md`
- **Change:** Updated design references to `client/docs/m13/design/`; updated logo, menu-image, and restaurant-image requirements to their verified runtime owners; replaced obsolete copy/delete instructions with final-state preservation language. Git history and byte comparisons—not inference—establish that the current PDFs and runtime assets match the supplied originals.
- **Verification:** Zero obsolete support-directory path references remain in README/feature specs; all 11 referenced M13 PDFs/assets are readable; focused Git comparisons confirm the design PDFs and representative runtime assets are byte-identical to their original blobs.

#### RF-44 — Synchronize final headers and specification inventory

- **Completed:** 2026-07-21 17:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The final comment cleanup exposed one route header without a filename and 21 inline, unnumbered Contents summaries. Normalizing them preserves the detailed-comment rubric and makes source ownership consistently scannable after the preceding refactors.
- **Files affected:** `ai/ai-spec.md`; `client/app/{_layout.js,index.js,selection.js}`, `client/app/courier/{_layout.js,account.js}`, `client/app/customer/{_layout.js,account.js}`, `client/app/customer/restaurant/_layout.js`, `client/components/{AppHeader.js,AppIcon.js,DeliveryRow.js,ErrorBoundary.js,RefreshErrorBanner.js,ResultState.js,RoleTabsLayout.js,useProtectedFocusList.js}`, `client/constants/theme.js`, `client/services/authService.js`, `client/storage/authStorage.js`, `client/utils/{orderFormatting.js,restaurantLabels.js,validation.js}`
- **Change:** Added the missing `_layout.js` filename/purpose/numbered Contents header, converted 21 inline Contents summaries into numbered lists without changing their wording/order, and added the existing `Concepts/M13/` owner to the global canonical tree. RF-43 remains deliberately deferred: the inactive template is still tracked while full native/final completion criteria remain pending.
- **Verification:** All 40 changed client JavaScript files parse and retain `File`, `Purpose`, and numbered `Contents` fields; the canonical paths in the global tree exist. No template file was deleted and no backend/runtime code changed.

#### RF-45 — Clarify authentication boundaries and remove proven dead declarations

- **Completed:** 2026-07-22 16:07 America/New_York
- **Priority:** P1
- **Reason and benefit:** Authentication crossed transport, payload validation, durable storage, context publication, and protected navigation with too little explanation at the transition points. Separately, a cost-unit export and account DTO had no callers, while repository comments repeated behavior already expressed by `JpaRepository`.
- **Files affected:** `client/app/_layout.js`, `client/app/index.js`, `client/constants/currency.js`, `client/services/authService.js`, `client/storage/authStorage.js`, `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/user/ApiGetAccountDTO.java`, all 11 files in `server/src/main/java/com/rocketFoodDelivery/rocketFood/repository/`, `README.md`, `ai/ai-spec.md`, `ai/features/code-quality.feature.md`, `docVault/REFACTORING_AUDIT.md`
- **Change:** Added tightly inline comments at the login request-lifecycle, response-validation, persistence commit, session-restoration, role-selection, and route-guard boundaries. Removed the unreferenced `PRODUCT_COST_UNIT` export and `ApiGetAccountDTO`, preserving the whole-dollar contract beside the formatter. Removed comments that merely narrated repository inheritance. Defined distinct ownership for the point-in-time candidate audit, canonical committed implementation record, and private non-normative handoff log.
- **Verification:** Caller searches return no runtime, test, framework, or documentation consumer for either removed declaration; stale repository-comment and debug-marker searches are empty; `git diff --check` passes; the client Jest suite passes 58/58; `./mvnw -q -DskipTests compile` passes. Native authentication and relaunch behavior remain unchanged and were not re-run because executable authentication logic did not change.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

