<a id="top"></a>

# Rocket Food Delivery Refactoring Audit

**Audit date:** July 21, 2026  
**Branch inspected:** `feature/m14-code-quality`  
**Scope:** Tracked first-party client, M14-touched backend/API tests, configuration, and repository documentation  
**Purpose:** Identify every evidence-backed refactoring opportunity currently visible without weakening a grading requirement

**Record role:** This document is a point-in-time inventory of candidate findings, not a feature contract or proof that an item was completed. Canonical implementation requirements and the committed completion history live in [`ai/features/code-quality.feature.md`](../ai/features/code-quality.feature.md); private per-pass handoff notes belong only in the ignored `.omi/m14/IMPLEMENTATION_LOG.md`.

## Table of Contents

- [Executive conclusion](#executive-conclusion)
- [Non-negotiable grading safeguards](#non-negotiable-grading-safeguards)
- [Findings register](#findings-register)
- [Areas that should remain unchanged](#areas-that-should-remain-unchanged)
- [Suggested implementation batches](#suggested-implementation-batches)
- [Test coverage to add before or alongside structural refactors](#test-coverage-to-add-before-or-alongside-structural-refactors)
- [Audit evidence collected](#audit-evidence-collected)
- [Definition of done for any selected refactor set](#definition-of-done-for-any-selected-refactor-set)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Executive conclusion

The application is already organized around sensible boundaries: Expo routes, reusable components, domain services, one API client, centralized authentication/storage, shared theme/currency/validation utilities, and conventional Spring packages. The most valuable remaining work is not a rewrite. It is a focused cleanup of repeated role/list/modal/request code, inconsistent validation and unauthorized handling, stale comments/documentation, unused exports/dependencies, and missing automated client coverage.

The safest implementation order is:

1. Correct stale comments and documentation.
2. Make ID validation and HTTP 401/403 handling consistent.
3. Remove proven-unused exports and dependencies after the required user-selection gate.
4. Extract exact duplication: role tab layout, focus-refresh list behavior, order-date formatting, and common order-product normalization.
5. Split the 795-line order service behind a compatibility-preserving barrel module.
6. Add client tests and make backend tests less database-dependent.
7. Delete the inactive feature template only after the final code-quality pass is genuinely complete.

No source refactor was performed as part of this audit.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Non-negotiable grading safeguards

Every implementation should preserve these constraints from `ai/ai-spec.md` and the owning feature specifications:

- Keep Expo Router route and `_layout.js` files under `client/app/`; route wrappers can be thin but cannot be deleted merely because nothing imports them.
- Keep separate Customer and Courier route destinations and guards.
- Keep `AccountScreen` shared behind the two role-specific route wrappers.
- Keep API calls in `client/services/`; screens and components must not call `fetch` directly.
- Keep authentication identity in storage/context and read tokens/IDs at the service boundary.
- Preserve all request locks, abort handling, generation checks, ownership checks, and safe retry behavior.
- Preserve canonical `sendSMS` and `sendEmail`; do not restore legacy snake-case notification keys.
- Preserve `POST /api/account/{userId}` and the existing compatibility `PUT` endpoint.
- Preserve `restaurant_rating` in order responses and round-trip it during the broad order status update.
- Preserve exact visible labels, notification combinations, status progression, nullable-courier behavior, filters, quantity rules, required images, palette, fonts, touch targets, and accessible semantics.
- Retain the required JavaScript file header with exact file name, purpose, and ordered Contents list in every file governed by an M13 feature specification.
- Retain comments that explain grading rules, business invariants, ownership, response races, compatibility, cancellation, or recovery.
- Do not broaden this pass into unrelated legacy backoffice/backend cleanup.
- Do not move, rename, delete, consolidate, or change a dependency/public contract/backend surface until the user selects an option, as required by `ai/features/code-quality.feature.md`.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Findings register

Priority meanings:

- **P0:** correctness or direct contract inconsistency
- **P1:** high-value maintainability/reuse improvement
- **P2:** worthwhile cleanup, testing, or documentation improvement
- **P3:** optional refinement; do only if the abstraction remains simpler than the original code

Gate meanings:

- **Direct:** a narrow correction with one clearly safe outcome
- **Choice required:** the repository's code-quality spec requires options and explicit user selection before implementation
- **Finalization only:** perform only when all features and regression checks are complete

### Correctness and contract consistency

#### RF-01 — Centralize protected HTTP failure classification

- **Priority:** P0
- **Evidence:** `restaurantService.js:155-165` and `productService.js:106-116` treat only HTTP 401 as unauthorized, while the global contract and other order/account paths treat both 401 and 403 as expired-session signals. The backend's current Spring Security behavior is documented as returning 403 for invalid or expired bearer tokens.
- **Refactor:** Add a small service-layer helper that classifies 401/403, 5xx, and remaining non-OK responses using caller-supplied safe messages. Use it from restaurant, product, order, and account services without changing successful response normalization.
- **Benefit:** Fixes inconsistent logout behavior and removes repeated status ladders.
- **Grading safety:** Directly aligns with the grading/global requirement that protected 401/403 uses centralized unauthorized cleanup.
- **Gate:** Choice required because it changes a shared service boundary and several callers.
- **Verify:** Service tests for 401, 403, 404 where applicable, 500, non-JSON errors, and successful envelopes; Expo export; login/session-expiry manual flow.

#### RF-02 — Use one safe identifier rule everywhere

- **Priority:** P0
- **Evidence:** `authService.js:23-29` and `authStorage.js:41-49` accept digit strings based on `Number(value) > 0`, which permits integers above `Number.MAX_SAFE_INTEGER`. Other services correctly use `isPositiveSafeInteger`.
- **Refactor:** Normalize numeric/string IDs once, convert to a number, require `Number.isSafeInteger(id) && id > 0`, then serialize stored IDs consistently. Reuse that helper in authentication response mapping, storage restoration/writes, route ID normalization, and service checks where contracts match.
- **Benefit:** Prevents lossy ID rounding and removes three subtly different identifier validators.
- **Grading safety:** Strengthens the existing positive-safe-integer requirement and preserves all valid seeded IDs.
- **Gate:** Choice required if the helper is moved or exported; a local correction in each owner is direct but leaves duplication.
- **Verify:** Boundary tests for `1`, numeric strings, whitespace, `0`, negative, decimal, signed strings, blank, nonnumeric, `Number.MAX_SAFE_INTEGER`, and one above it.

#### RF-03 — Replace duplicated login email validation with the shared validator

- **Priority:** P1
- **Evidence:** `client/app/index.js:27-29` defines `EMAIL_PATTERN`, while `client/utils/validation.js:7-35` already owns the same email rule and is used by Account.
- **Refactor:** Import and call `isValidEmail` from the Login screen; delete only the local duplicate regex.
- **Benefit:** Login and Account cannot drift to different email rules.
- **Grading safety:** The regex behavior is currently identical, so required-field and email-shape behavior remains unchanged.
- **Gate:** Direct.
- **Verify:** Manual missing/invalid/valid email checks and a small validator unit test.

#### RF-04 — Make role comparisons consume `ROLES`

- **Priority:** P1
- **Evidence:** `client/app/_layout.js:57-59`, `client/app/customer/_layout.js:42`, and `client/app/courier/_layout.js:42` repeat raw `'customer'`/`'courier'` strings even though `authStorage.js` exports the canonical `ROLES` object.
- **Refactor:** Import `ROLES` into route guards and use `ROLES.customer`/`ROLES.courier`.
- **Benefit:** Removes typo-prone duplicated role literals at the most security-sensitive navigation boundary.
- **Grading safety:** No behavior or route change.
- **Gate:** Direct.
- **Verify:** Expo export and all four navigation cases: logged out, customer-only, courier-only, dual-role pending.

#### RF-05 — Key delivery label/color maps from the status constants

- **Priority:** P1
- **Evidence:** `orderService.js:26-30`, `orderService.js:595-599`, and `theme.js:22-26` repeat literal `PENDING`, `IN_PROGRESS`, and `DELIVERED` keys.
- **Refactor:** Use computed keys based on `DELIVERY_STATUS`, or move the complete status metadata (`label`, `color`, backend ID) into one domain constant module while avoiding a theme/service circular import.
- **Benefit:** One status rename cannot silently break labels, colors, or IDs.
- **Grading safety:** Preserve the exact internal tokens, visible labels, colors, and backend IDs 1/2/3.
- **Gate:** Choice required because moving ownership between `theme.js` and `orderService.js` is structural.
- **Verify:** Courier list/detail rendering and all status mutations.

#### RF-06 — Make confirmation total arithmetic explicitly safe

- **Priority:** P2
- **Evidence:** `OrderConfirmationModal.js:205-208` sums multiple individually safe line totals without checking whether their combined value remains a safe integer. `formatProductCost` deliberately rejects unsafe integers.
- **Refactor:** Extract a pure `calculateOrderTotal` helper that validates each cost/quantity and checks safe multiplication/addition. Keep the request body unchanged because the backend calculates authoritative totals.
- **Benefit:** Avoids a misleading rounded total or placeholder only after overflow.
- **Grading safety:** Normal selections display exactly the same amounts; invalid extreme state fails closed.
- **Gate:** Choice required if a new utility/export is introduced.
- **Verify:** Zero, normal multi-product, maximum-safe boundary, and overflow tests.

#### RF-07 — Clear the modal's settled abort-controller reference

- **Priority:** P2
- **Evidence:** `OrderConfirmationModal.js:141-178` stores the active controller but does not clear it in `finally`, unlike the Login and Account request owners. Closing a settled modal therefore aborts a stale controller.
- **Refactor:** In `finally`, clear `abortControllerRef.current` only if it still equals the local controller.
- **Benefit:** Keeps request ownership accurate and avoids stale lifecycle state.
- **Grading safety:** Does not alter visible idle/processing/success/failure behavior.
- **Gate:** Direct.
- **Verify:** Confirm success, failure/retry, close during processing, close after settlement.

#### RF-08 — Warn about font failure once, outside render

- **Priority:** P2
- **Evidence:** `client/app/_layout.js:35-39` calls `console.warn` from render whenever `fontError` remains truthy, so unrelated re-renders can repeat the warning.
- **Refactor:** Move the development-only warning into an effect keyed by `fontError`.
- **Benefit:** Keeps the intentional diagnostic without log spam or a render side effect.
- **Grading safety:** Font fallback and loading behavior remain unchanged.
- **Gate:** Direct.
- **Verify:** Expo export and a simulated font error if feasible.

### High-value reuse and file-size refactors

#### RF-09 — Extract the duplicated Customer/Courier tab shell

- **Priority:** P1
- **Evidence:** `client/app/customer/_layout.js` (121 lines) and `client/app/courier/_layout.js` (111 lines) are nearly identical. Their `TabIcon`, screen options, header, guard shape, and styles are duplicated; only role/ID checks and tab definitions differ.
- **Refactor:** Keep both Expo route files, but make each a thin configuration wrapper around a shared `RoleTabsLayout`/`TabIcon` component in `client/components/`. Pass role, role-ID selector, initial route, and tab descriptors.
- **Benefit:** Removes about one layout's worth of repeated code while preserving required route separation.
- **Risk:** An overly generic configuration object could be harder to understand than two small layouts.
- **Grading safety:** Route filenames, guards, titles, icons, header, tab order, and initial routes must remain exact.
- **Gate:** Choice required for shared extraction versus documented justified duplication.
- **Verify:** Customer tabs (Restaurants, Order History, Account), Courier tabs (Order Delivery, Account), active icon styling, cold-start route, logout, and wrong-role redirects.

#### RF-10 — Extract the duplicated focus-refresh list lifecycle

- **Priority:** P1
- **Evidence:** `customer/order-history.js:39-128` and `courier/index.js:58-159` duplicate `requestStatus`, initial-versus-refresh behavior, `newestRequestRef`, `hasLoadedOnceRef`, last-count tracking, abort-on-blur, retry sequence, stale-response checks, unauthorized cleanup, retained rows, and refresh error handling.
- **Refactor:** Create a focused hook such as `useProtectedFocusList` that owns only the identical load/refresh lifecycle. Keep courier mutation state and customer modal/table state in their screens.
- **Benefit:** Removes a large, behavior-sensitive duplicate and makes future race fixes apply to both lists.
- **Risk:** The hook must not merge the courier mutation state machine with the read state machine.
- **Grading safety:** Preserve refresh-on-focus, retained rows on failed refresh, empty/error distinction, abort behavior, and unauthorized logout.
- **Gate:** Choice required.
- **Verify:** First load, focus refresh, empty refresh, failed refresh with/without rows, rapid tab changes, stale response, logout mid-request for both roles.

#### RF-11 — Extract the duplicated refresh-error banner

- **Priority:** P2
- **Evidence:** Order History and Order Delivery render the same message-plus-Retry banner and substantially identical styles.
- **Refactor:** Add a small `RefreshErrorBanner` component used by both screens.
- **Benefit:** Exact accessibility and retry presentation stay synchronized.
- **Grading safety:** Keep each screen's domain-specific message and existing live-region behavior.
- **Gate:** Choice required, ideally implemented with RF-10.
- **Verify:** Failed refresh on both screens.

#### RF-12 — Share order-date normalization/formatting

- **Priority:** P1
- **Evidence:** `OrderHistoryModal.js:15-45` and `DeliveryDetailsModal.js:17-45` duplicate the same `Intl.DateTimeFormat`, microsecond trimming, invalid-date handling, and output format.
- **Refactor:** Move `formatOrderDate` and its formatter to `client/utils/orderFormatting.js`; keep one accurate JSDoc contract.
- **Benefit:** Guarantees the documented project-wide date format remains identical.
- **Grading safety:** Output remains `Month D, YYYY`, invalid values remain blank, and no raw ISO text appears.
- **Gate:** Choice required because it adds a file and moves code.
- **Verify:** ISO milliseconds, microseconds, blank, malformed, and both detail modals.

#### RF-13 — Share the common detail-modal shell, not the domain-specific content

- **Priority:** P2
- **Evidence:** `OrderHistoryModal.js` and `DeliveryDetailsModal.js` duplicate modal/backdrop/panel/header-row/close button/scroll/footer/total structures and most corresponding styles.
- **Refactor:** Extract a narrow `DetailModalShell` with slots for header details and line-item content. Keep customer courier-name logic and courier status/address/unit-cost logic in their respective components.
- **Benefit:** Removes repeated modal mechanics without conflating different field contracts.
- **Risk:** A configuration-heavy universal modal would be worse than the current duplication.
- **Grading safety:** Preserve each wireframe, nullable courier rule, delivery status pill, line columns, reset-by-key behavior, and accessibility labels.
- **Gate:** Choice required; retaining duplication with RF-12 only is also valid.
- **Verify:** Both modals with long product lists, missing optional fields, order A then B, Android back, and screen reader labels.

#### RF-14 — Share the base order-product normalizer

- **Priority:** P1
- **Evidence:** `orderService.js:191-214` and `orderService.js:381-404` duplicate object checks plus product ID/name/quantity/total-cost parsing. Courier normalization only adds `unit_cost`.
- **Refactor:** Create one private base normalizer and an option/extension for the required unit cost. Do not weaken the all-or-nothing validation of a delivery/order row.
- **Benefit:** Removes parallel contract logic that could drift.
- **Grading safety:** Customer history continues to expose line totals; Courier detail continues to expose both unit and line totals.
- **Gate:** Choice required.
- **Verify:** Valid product, malformed object, invalid ID/name/quantity/cost, missing courier unit cost, and full list normalization.

#### RF-15 — Split `orderService.js` behind a stable public facade

- **Priority:** P1
- **Evidence:** `client/services/orderService.js` is 795 lines and owns four distinct concerns: creation, customer history, courier retrieval, and courier mutations. It also contains status metadata and many private normalizers.
- **Refactor:** Split internal modules by concern, then retain `orderService.js` as a compatibility barrel exporting the exact current public API. A possible internal layout is `orders/createOrder.js`, `orders/customerOrders.js`, `orders/courierDeliveries.js`, and `orders/orderConstants.js` under `client/services/`.
- **Benefit:** Smaller review/test surfaces and clearer ownership without changing import paths in existing screens.
- **Risk:** This is the largest client structural diff and should follow smaller normalization extractions, not precede them.
- **Grading safety:** Existing service boundary and public exports remain available; no endpoint/body/response changes.
- **Gate:** Choice required.
- **Verify:** All order service tests, Expo export, create/history/courier flows, and a complete import/caller search.

#### RF-16 — Consolidate required-session resolution

- **Priority:** P1
- **Evidence:** Account, restaurant, product, order creation/history, and courier methods all read `getStoredSession`, validate overlapping subsets, create an unauthorized `ApiRequestError`, and build bearer headers.
- **Refactor:** Add small role-aware helpers such as `requireSession`, `requireCustomerSession`, and `requireCourierSession`, returning normalized numeric IDs and an authorization header. Do not cache sessions; every service call must continue reading current storage at request time.
- **Benefit:** One security rule for missing token, active role, user ID, and role IDs.
- **Risk:** A single helper must support the legitimate difference between role-neutral restaurant/menu reads and role-specific mutations.
- **Grading safety:** Retains service-boundary identity and fail-closed behavior.
- **Gate:** Choice required.
- **Verify:** Missing, partial, corrupt, wrong-role, dual-role pending, customer, and courier sessions.

#### RF-17 — Use shared envelope predicates/normalizers

- **Priority:** P2
- **Evidence:** Services repeatedly check `message === 'Success'`, object-versus-array shape, and list envelopes using slightly different code.
- **Refactor:** Add private/shared `requireSuccessObject` and `requireSuccessList` helpers that accept the domain error message. Domain ownership/field validation remains in each service.
- **Benefit:** Less boilerplate and consistent malformed-response classification.
- **Grading safety:** Must stay strict and never expose raw response data.
- **Gate:** Choice required.
- **Verify:** Null, wrong message, wrong container type, empty list, valid object/list.

#### RF-18 — Prefer local state constants or reducers for complex state machines

- **Priority:** P2
- **Evidence:** Screens and modals use many repeated raw strings (`idle`, `loading`, `ready`, `empty`, `error`, `refreshing`, `processing`, `success`, `partial`, `updating`). `AccountScreen` uses separate request/save/error/draft states that can technically represent combinations its comment calls impossible.
- **Refactor:** Use frozen local constants for simple lifecycles; consider a reducer only for Account and Courier mutation flows where transitions are genuinely coupled.
- **Benefit:** Prevents typo-only states and makes allowed transitions reviewable.
- **Risk:** Do not force all screens into one global state machine; their semantics differ.
- **Grading safety:** Preserve every visible state and draft-retention rule.
- **Gate:** Choice required for reducer conversion; local constants are direct.
- **Verify:** Transition tables from the feature specifications.

### Cleanliness, comments, and public surface

#### RF-19 — Remove stale `@JsonAlias` claims

- **Priority:** P0
- **Evidence:** `orderService.js:84` says the backend accepts notification keys through `@JsonAlias`; `OrderApiControllerTest.java:77-78` repeats that claim. The current DTO intentionally removed aliases and uses canonical `sendEmail` plus `@JsonProperty("sendSMS")`. README and feature specs correctly describe the new contract.
- **Refactor:** Rewrite only those comments to describe canonical camelCase mapping.
- **Benefit:** Source and tests stop contradicting the actual graded HTTP contract.
- **Grading safety:** Documentation-only correction; canonical field names remain unchanged.
- **Gate:** Direct.
- **Verify:** Search for `JsonAlias` and confirm no stale matches remain.

#### RF-20 — Correct role-obsolete file comments

- **Priority:** P1
- **Evidence:** `client/app/_layout.js:3` describes only login/customer routes; `AppHeader.js:23` says only Customer tabs install it; `AppHeader.js:35` says logout returns the customer to Login. The app now supports Customer and Courier.
- **Refactor:** Update the mandatory purpose/Contents/JSDoc text to say public/protected or authenticated role routes.
- **Benefit:** Keeps required headers accurate.
- **Grading safety:** Required headers remain present.
- **Gate:** Direct.
- **Verify:** Review all mandatory file headers against current ownership.

#### RF-21 — Remove repeated “Read aloud” comment lines

- **Priority:** P2
- **Evidence:** The client contains many `Read aloud:` lines, but no current global/feature specification requires pronunciation annotations. The code-quality spec says comments should explain non-obvious behavior rather than narrate names.
- **Refactor:** Remove only the pronunciation lines. Retain mandatory file headers, useful JSDoc types/throws, and non-obvious invariant comments.
- **Benefit:** Meaningful comments become easier to scan without violating the detailed-comment rubric.
- **Grading safety:** Do not remove the required file name/purpose/Contents block or required explanations listed in each feature spec.
- **Gate:** Choice required because it is a broad comment sweep; apply narrowly and inspect the full diff.
- **Verify:** Each changed file still satisfies its feature's explicit comment checklist.

#### RF-22 — Aggregate malformed-order development warnings

- **Priority:** P2
- **Evidence:** `orderService.js:291-300` can emit one identical warning for every malformed or duplicate history row on every refresh.
- **Refactor:** Count skipped entries and issue at most one development-only warning after normalization, without IDs, customer data, raw values, or tokens.
- **Benefit:** Retains the intentional diagnostic with less noise.
- **Grading safety:** Valid rows are still shown and malformed/duplicate rows still skipped.
- **Gate:** Direct.
- **Verify:** Mixed valid/invalid/duplicate response test and no production warning.

#### RF-23 — Make currently internal-only exports private

- **Priority:** P2
- **Evidence:** No client file imports `ACCOUNT_ERROR_MESSAGES`, `LOGIN_ERROR_MESSAGES`, `ORDER_ERROR_MESSAGES`, `RESTAURANT_ERROR_MESSAGES`, `PRODUCT_ERROR_MESSAGES`, `PRODUCT_COST_UNIT`, `AUTH_STORAGE_KEYS`, or `buildApiUrl`. Searches find only their declaring modules/internal uses. `PRODUCT_COST_UNIT` is not read even within its module.
- **Refactor options:**
  1. Remove `export` but retain constants/helpers privately where useful.
  2. Keep selected exports only if upcoming client tests intentionally consume them.
  3. Remove `PRODUCT_COST_UNIT` and keep the documented unit decision in the formatter comment/spec, or make the formatter actually branch on it if future units are planned.
- **Benefit:** Smaller intentional public surface and clearer test boundaries.
- **Grading safety:** Current runtime callers are unaffected, but an import/caller/test search must be repeated immediately before editing.
- **Gate:** Choice required because this changes public exports.
- **Verify:** `rg` caller search, Expo export, and client tests.

#### RF-24 — Keep inline dynamic styles where they carry data

- **Priority:** P3 / retain
- **Evidence:** `ResultState` uses `{ minHeight }`, and delivery components use dynamic status background colors.
- **Recommendation:** Do not extract these into dozens of static variants merely to eliminate inline objects. They express component data and are clearer than a configuration explosion.
- **Grading safety:** Retaining them avoids cosmetic churn.
- **Gate:** No action.

#### RF-25 — Avoid a universal button abstraction

- **Priority:** P3 / retain
- **Evidence:** Many buttons share orange/red colors and minimum touch height but differ materially in text case, radius, busy state, disabled treatment, layout, accessibility state, and wireframe role.
- **Recommendation:** Extract a shared button only for two or more truly identical consumers (for example, if refresh banners are shared). Do not replace every button with a prop-heavy universal component.
- **Grading safety:** Preserves exact screen-specific designs.
- **Gate:** Choice required for any extraction.

### Dependencies, configuration, and assets

#### RF-26 — Remove `react-bootstrap`

- **Priority:** P1
- **Evidence:** It is a direct dependency in `client/package.json`, but no first-party client file imports it. The app is React Native, and the Android Expo export succeeds without any runtime reference to React Bootstrap. `npm explain react-bootstrap` shows it exists solely because the root project declares it.
- **Refactor:** Remove it with npm so both `package.json` and `package-lock.json` update together.
- **Benefit:** Removes an unused web UI library and its transitive dependency tree.
- **Grading safety:** No graded screen uses it.
- **Gate:** Choice required for dependency removal.
- **Verify:** `npm ls --depth=0`, `npx expo install --check`, Android export, and web start/export only if web remains supported.

#### RF-27 — Review the direct `@expo/vector-icons` declaration

- **Priority:** P2
- **Evidence:** No first-party file imports `@expo/vector-icons`; all icons use the selected FontAwesome SVG stack. `npm explain` shows Expo also supplies this package transitively.
- **Refactor options:**
  1. Remove only the direct declaration while leaving Expo's transitive copy.
  2. Retain it and document it as Expo/tooling-owned if a generated/native path requires a direct declaration.
- **Benefit:** Makes every direct dependency intentional.
- **Grading safety:** Do not replace the established icon system or remove FontAwesome peer dependencies.
- **Gate:** Choice required.
- **Verify:** Expo dependency check, Android export, all icons on native devices.

#### RF-28 — Retain justified direct peer/platform dependencies

- **Priority:** P2 / retain
- **Evidence:** `@fortawesome/fontawesome-svg-core` is a peer of `@fortawesome/react-native-fontawesome`; `react-native-svg` is its renderer peer. `expo-constants` and `expo-linking` are consumed by Expo Router/Expo; `react-dom` supports the declared web platform.
- **Recommendation:** Do not remove these merely because first-party source has no direct import. Document their peer/framework purpose during the dependency audit.
- **Grading safety:** Avoids breaking native icons, routing, or web builds.
- **Gate:** No action unless platform scope changes.

#### RF-29 — Add explicit quality scripts and client test tooling

- **Priority:** P1
- **Evidence:** `client/package.json` has only start/android/ios/web scripts. There is no lint, test, type-check, or export-check script, and no tracked client test files.
- **Refactor options:**
  1. Add Expo-compatible ESLint plus `lint`, and Jest/`jest-expo` plus `test`.
  2. Add only Jest first, prioritizing pure utilities/services.
  3. Add no dependency and use lightweight Node-based checks only for modules that can run without JSX/Metro transforms.
- **Benefit:** Makes refactoring verifiable rather than relying on export/manual testing alone.
- **Risk:** Tool versions must match Expo SDK 54; configuration churn should not become the project.
- **Grading safety:** The code-quality spec explicitly requires presenting options before adding tools.
- **Gate:** Choice required.
- **Verify:** Clean install, scripts pass, Expo export still passes, lockfile consistent.

#### RF-30 — Do not casually optimize or rename supplied image assets

- **Priority:** P2 / guarded
- **Evidence:** Android export bundles roughly 36 MB of first-party images; three restaurant photos are about 9-11 MB each. `RestaurantMenu.jpg` is actually PNG data despite its extension. However, feature specs require the supplied images and exact runtime filename, and describe preserving/copying support originals.
- **Recommendation:** Performance optimization is possible only through an explicitly approved, visually verified asset pass. Preserve filenames and required subjects. Prefer lossless metadata optimization first; resize/recompress only after confirming that “supplied image” grading is visual rather than byte-exact. Do not rename `RestaurantMenu.jpg` solely to match its file signature.
- **Benefit:** Potentially much smaller bundle/startup memory.
- **Risk:** Unapproved asset mutation could violate a grading-source requirement.
- **Gate:** Choice required plus grading clarification for lossy changes.
- **Verify:** Before/after dimensions/size, pixel inspection, Android/iOS native rendering, list scrolling, and all source/runtime asset requirements.

#### RF-31 — Simplify stale/redundant ignore entries

- **Priority:** P2
- **Evidence:** `.gitignore` contains both general `node_modules/` and redundant `client/node_modules`; it also ignores obsolete `ai/M14/features/feature-name.feature.md` while the actual current template is tracked at `ai/features/feature-name.feature.md`.
- **Refactor:** Remove redundant/stale entries after confirming no tooling depends on them. Retain `.omi`, `.env*` exceptions, Expo/native outputs, Java targets, IDE/OS files, and local Spring properties.
- **Benefit:** The ignore file describes the real repository layout.
- **Grading safety:** No tracked file is deleted and secret/build coverage remains intact.
- **Gate:** Choice required for the cleanup sweep.
- **Verify:** `git check-ignore` on representative secret, build, cache, and private paths.

### Backend and backend-test refactors allowed by the M14 scope

#### RF-32 — Refactor `ApiPostAccountDTO` to Java naming while preserving JSON

- **Priority:** P1
- **Evidence:** `ApiPostAccountDTO.java:9-11` uses package-private snake_case Java fields, unlike normal Java conventions and the camelCase implementation used in `ApiCreateOrderDTO`.
- **Refactor:** Rename to private `accountType`, `accountEmail`, and `accountPhone`, annotated with `@JsonProperty("account_type")`, etc. Update controller getters. Keep the HTTP body exactly unchanged.
- **Benefit:** Conventional encapsulated Java DTO without changing the grading contract.
- **Grading safety:** JSON keys and endpoint remain exact.
- **Gate:** Choice required because it touches the backend DTO/controller contract owner.
- **Verify:** Account POST controller tests plus JSON serialization/deserialization test.

#### RF-33 — Extract account-type validation/delegation in `UserApiController`

- **Priority:** P2
- **Evidence:** `UserApiController.java:70-81` and `84-102` repeat the role allowlist, `userService.updateAccount`, not-found construction, and response building for PUT and POST.
- **Refactor:** Add private `isSupportedAccountType` and `updateAccountResponse` helpers inside the controller. Keep the two endpoint signatures and their distinct input DTOs.
- **Benefit:** Compatibility and official endpoints cannot drift.
- **Grading safety:** No verb/path/body/response removal or aliasing.
- **Gate:** Choice required for backend cleanup.
- **Verify:** Existing GET/PUT/POST account tests, invalid type, missing role, missing user.

#### RF-34 — Use constructor injection consistently in `UserService`

- **Priority:** P2
- **Evidence:** `UserService.java:31-45` mixes field injection for three role services with constructor injection for `UserRepository`.
- **Refactor:** Make all four dependencies final and inject them through one constructor.
- **Benefit:** Makes dependencies explicit and unit testing straightforward.
- **Grading safety:** No service behavior change.
- **Gate:** Choice required because the code-quality spec restricts backend cleanup.
- **Verify:** Compilation, Spring context, account tests, and any unit construction callers.

#### RF-35 — Extract repeated `RoleDetail` mapping

- **Priority:** P2
- **Evidence:** `UserService.java:141-166` repeats creation plus ID/phone/email/address mapping for Customer, Courier, and Employee.
- **Refactor:** Add a narrow private factory accepting already-resolved scalar values/address, or a tiny mapper overload. Avoid reflection or a new inheritance hierarchy.
- **Benefit:** One account response mapping rule.
- **Grading safety:** Preserve all three nested response shapes and null-address behavior.
- **Gate:** Choice required.
- **Verify:** Customer-only, courier-only, employee-only, dual-role, and null-address account responses.

#### RF-36 — Remove stale test comments and reuse test fixtures

- **Priority:** P1
- **Evidence:** `OrderApiControllerTest.java:77-78` incorrectly mentions `@JsonAlias`. The delete test at lines 195-211 duplicates the `createFreshOrder` fixture already defined at lines 173-190. Line 65 constructs another `ObjectMapper` despite an injected one at line 29.
- **Refactor:** Correct the comment, reuse `createFreshOrder`, and consistently use the injected mapper.
- **Benefit:** Tests express the current contract with less setup duplication.
- **Grading safety:** Assertions and endpoint coverage remain unchanged.
- **Gate:** Direct for comments/local fixture reuse; backend test edits should still run focused tests.
- **Verify:** DTO unit test and Order controller test.

#### RF-37 — Isolate database-mutating integration tests

- **Priority:** P1
- **Evidence:** Account tests update seeded users 1 and 22; order tests create/delete/update records. The tests depend on a running, seeded MySQL database and can leave state behind. The audit run reported 120 tests, 0 assertion failures, 116 context/database errors because MySQL was inaccessible; only four database-independent DTO tests completed.
- **Refactor options:**
  1. Add transactional rollback to compatible integration tests.
  2. Create explicit per-test fixtures and cleanup through repositories.
  3. Add a dedicated test profile/database while retaining a separate MySQL integration suite for native-query compatibility.
- **Benefit:** Repeatable tests that do not mutate development/grading seed state.
- **Risk:** H2 alone may not match MySQL native SQL; it should not replace MySQL contract coverage blindly.
- **Grading safety:** Preserve the existing MySQL path and endpoint tests.
- **Gate:** Choice required because it changes backend test infrastructure/dependencies.
- **Verify:** Repeat suite twice from the same baseline; database state unchanged; native repository queries tested against MySQL.

#### RF-38 — Add controller/service unit slices independent of MySQL

- **Priority:** P1
- **Evidence:** Nearly every backend controller test uses `@SpringBootTest`, so a database outage prevents HTTP validation/response tests from running. The current failure cascaded into 116 errors after one context failure.
- **Refactor:** Add focused MVC/service tests with mocked collaborators for M14 account/order contract branches. Retain a smaller set of full MySQL integration tests.
- **Benefit:** Fast feedback for request mapping, JSON keys, validation, error classification, and response status without database infrastructure.
- **Grading safety:** Does not remove integration evidence.
- **Gate:** Choice required.
- **Verify:** Unit/slice suite passes with MySQL stopped; integration suite passes when MySQL is available.

#### RF-39 — Investigate the duplicate `org.json.JSONObject` test classpath

- **Priority:** P3
- **Evidence:** Maven reports both `android-json` and `org.json:json` on the test classpath and warns behavior may be unpredictable. Notification support makes dependency removal risk-sensitive.
- **Refactor:** Use `mvn dependency:tree` to identify owners, then exclude only the redundant artifact if provider and test behavior prove safe.
- **Benefit:** Deterministic JSON implementation in tests.
- **Risk:** A careless exclusion could affect Twilio/notification code.
- **Grading safety:** Dependency change requires focused provider/notification verification.
- **Gate:** Choice required.

### Documentation and repository finalization

#### RF-40 — Repair the README tree and links

- **Priority:** P1
- **Evidence:** README's project tree lists nonexistent root `support_materials_13/`, `CONCEPTS.md`, and `RESEARCH.md`. The tracked files are `Concepts/M13/CONCEPTS.md`, `docVault/RESEARCH.md`, and design references under `client/docs/`. Related-document links at README lines 391-392 are therefore broken.
- **Refactor:** Update the tree and links to actual tracked paths. Separately reconcile feature-spec references to the old support-material paths only after confirming whether the originals were intentionally moved/deleted.
- **Benefit:** Setup/review documentation becomes navigable and truthful.
- **Grading safety:** Do not invent or delete support material; document its actual retained location.
- **Gate:** Direct for README links; choice required for broad feature-spec path reconciliation.
- **Verify:** Check every local Markdown link/path with a script or manual filesystem test.

#### RF-41 — Reconcile manual-QA claims

- **Priority:** P1
- **Evidence:** README says completed iOS and Android manual QA, while `ai/features/ui.feature.md` still lists native verification as required and the global acceptance checklist distinguishes pending manual evidence.
- **Refactor:** State exactly which device/platform checks were performed, on what build, and which remain pending. Do not infer completion from source inspection or Expo export.
- **Benefit:** Honest grading evidence with no contradictory claims.
- **Grading safety:** Improves auditability; does not reduce any acceptance requirement.
- **Gate:** Direct once evidence is known; unknown claims require user confirmation rather than guessing.
- **Verify:** Cross-check README, global spec, UI spec, and private implementation record.

#### RF-42 — Reconcile obsolete support-material paths in feature specs

- **Priority:** P2
- **Evidence:** Multiple M13 feature specs refer to `support_materials_13/...`, but that directory is not tracked. Some specs say certain originals must remain present, creating a factual conflict.
- **Refactor:** Determine the authoritative current location/history first. Then update references to `client/docs/m13/...` or record the intentional removal/move. Do not rewrite grading rules or claim missing evidence exists.
- **Benefit:** Canonical specifications point to reviewable files.
- **Grading safety:** Requires evidence because some files were explicitly required to remain unchanged.
- **Gate:** Choice required after provenance check.
- **Verify:** Every referenced PDF/image exists and matches its documented role.

#### RF-43 — Delete the inactive feature template at final completion

- **Priority:** P1
- **Evidence:** `ai/ai-spec.md:62-64` and the code-quality spec explicitly require deleting `ai/features/feature-name.feature.md` only after the last feature is genuinely complete. It is currently tracked.
- **Refactor:** At final successful completion, delete the template and update `ai/ai-spec.md` plus any references that still say it exists.
- **Benefit:** Removes explicitly designated dead specification material.
- **Grading safety:** Timing is mandatory: not before final checks, not left behind afterward.
- **Gate:** Finalization only.
- **Verify:** No remaining references, complete regression evidence, clean final diff.

#### RF-44 — Keep documentation comments synchronized after each extraction

- **Priority:** P1
- **Evidence:** Mandatory Contents lists describe source order, so moving functions without updating headers would immediately make them stale.
- **Refactor:** Treat header/JSDoc updates as part of each code refactor, not a final bulk sweep. Update README/Postman/specs only when a factual contract or path changes.
- **Benefit:** Prevents the cleanup itself from violating the comment rubric.
- **Grading safety:** Directly required.
- **Gate:** Direct and mandatory with every selected change.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Areas that should remain unchanged

The following are intentional and should not be “cleaned up” without new evidence:

- Separate route wrappers for Customer/Courier Account and separate role route trees.
- Defensive abort controllers, generation IDs, synchronous ref locks, and stale-response checks.
- Distinct read and mutation state machines on Courier Delivery.
- Role-neutral restaurant/menu access versus role-specific account/order mutations.
- Service-side response normalization and ownership validation, even where it appears verbose.
- Nullable courier and delivery-address fallbacks.
- Static literal `require(...)` calls for Metro-bundled images.
- FontAwesome core and `react-native-svg` peer dependencies.
- Expo Router/config/reserved files, lockfiles, Maven wrapper, Postman collection, tests, and grading documents.
- Development-only warnings that explain safe invariant failures, once stale wording/log spam is corrected.
- Unrelated legacy backend `System.out`, `printStackTrace`, backoffice style, broad DTO naming, or controller cleanup; the code-quality feature explicitly excludes widening into legacy backend work.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Suggested implementation batches

### Batch A — Narrow direct corrections

- RF-03 shared email validator
- RF-04 role constants
- RF-07 abort-controller cleanup
- RF-08 one-time font warning
- RF-19 stale alias comments
- RF-20 obsolete role comments
- RF-22 aggregate warning
- RF-36 local test cleanup
- RF-40 README paths

Expected risk: low. No API, route, dependency, or backend behavior change.

### Batch B — User-selected shared client boundaries

- RF-01 protected HTTP classifier
- RF-02 safe identifier helper
- RF-09 role tab shell
- RF-10/RF-11 focus list and refresh banner
- RF-12 date formatter
- RF-14 product normalizer
- RF-16 session helpers
- RF-17 envelope helpers

Expected risk: medium. Verify all callers after each extraction.

### Batch C — Order module structure

- RF-05 status metadata
- RF-06 safe total helper
- RF-13 optional modal shell
- RF-15 order service split/facade
- RF-18 selected state constants/reducers

Expected risk: medium-high. Keep public imports and every graded state unchanged.

### Batch D — Dependencies and test infrastructure

- RF-26 remove React Bootstrap
- RF-27 decide direct Expo Vector Icons status
- RF-29 client tooling/tests
- RF-37/RF-38 backend test isolation/slices
- RF-39 duplicate JSON investigation

Expected risk: medium. Requires explicit dependency/test-infrastructure choices.

### Batch E — Final documentation and deletion

- RF-21 scoped comment cleanup
- RF-31 ignore cleanup
- RF-41 manual evidence reconciliation
- RF-42 support-material path reconciliation
- RF-43 inactive-template deletion
- RF-44 final header/spec synchronization

Expected risk: low to medium, but RF-43 must be last.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Test coverage to add before or alongside structural refactors

Highest-value client unit cases:

- Identifier normalization and session coherence.
- Email/phone validation boundaries.
- Route restaurant ID normalization.
- Quantity reconciliation, decrement floor, safe maximum, and restaurant changes.
- Currency/date/total formatting boundaries.
- Restaurant/product/order/delivery response normalization, duplicates, malformed rows, and ownership.
- 401/403/404/5xx/non-JSON/timeout/external-abort API classifications.
- Courier merge priority, eligibility filtering, status request bodies, partial assignment recovery, and rating preservation.
- Account response role/ID matching and official POST body.
- Notification booleans for all four combinations.

Highest-value component/integration cases:

- Root navigation for no session, one role, dual-role pending, and selected role.
- Duplicate login/selection/create-order/status taps.
- Focus refresh retaining old rows on failure.
- Modal close during request and success-close quantity reset.
- Pending customer order with no courier.
- Delivery status progression and locked Delivered state.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Audit evidence collected

- Working tree was clean before this document was added.
- 258 tracked files were inventoried.
- No client screen/component calls `fetch`; only `client/services/apiClient.js` does.
- No TODO/FIXME/HACK markers were found in the audited client/M14 source.
- `npm ls --depth=0` succeeded with no invalid dependency.
- `npx expo config --type public` succeeded and did not print the API URL value.
- `npx expo install --check` reported dependencies up to date using Expo's offline local map; it explicitly warned the check was less reliable without networking.
- Android Expo export succeeded: 1,151 modules, one 4.31 MB Hermes bundle, and 36 assets.
- The exported first-party images total roughly 36 MB; the largest restaurant files are 9-11 MB.
- `PostmanCollection.json` parses as valid JSON.
- Maven reached compilation, then the full test run failed on inaccessible MySQL/network infrastructure: 120 tests discovered, 0 assertion failures, 116 errors, 0 skipped. Four database-independent DTO tests completed before the Spring context failures cascaded.
- Maven also reported duplicate `org.json.JSONObject` implementations on the test classpath.
- The Maven run generated only ignored `server/target/` output; the Expo export was directed to `/tmp`.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Definition of done for any selected refactor set

- Every changed JavaScript header and Contents list matches final source order.
- Every changed shared owner has caller-focused tests.
- `git diff --check` passes.
- `npm ls --depth=0` passes.
- `npx expo config --type public` passes without exposing secrets.
- Android Expo export passes; iOS/native flows are tested where affected.
- Focused backend tests pass; the full Maven suite passes when MySQL is available, with infrastructure failures reported separately.
- Postman JSON and all local documentation links parse/resolve.
- The complete diff contains no route/API/wireframe/accessibility drift, secret, generated output, private `.omi` material, or unrelated cleanup.
- Manual Customer and Courier regression evidence is recorded honestly.
- The inactive feature template is removed only at genuine final completion.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
