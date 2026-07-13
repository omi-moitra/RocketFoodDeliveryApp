# AI Feature Specification — Navigation Structure

> Defines the three-level Expo Router navigation structure for the Rocket Food Delivery customer mobile application. Use this document together with `ai/ai-spec.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow and Navigation Logic](#user-flow-and-navigation-logic)
6. [Interfaces](#interfaces-pages-components-services-storage-and-endpoints)
7. [Data, Validation, and State](#data-validation-and-state)
8. [Expected Behavior](#expected-behavior)
9. [Technical Constraints](#technical-constraints-feature-level)
10. [Acceptance Criteria](#acceptance-criteria)
11. [Feature Definition of Done](#feature-definition-of-done)
12. [Notes for the AI](#notes-for-the-ai)

---

## Feature Identity

- **Feature Name:** Three-Level Customer Navigation Structure
- **Related Area:** Mobile frontend, Expo Router, authentication flow, shared navigation
- **Required nesting:** Root Stack → Customer Tabs → Restaurant Stack
- **Specification file:** `ai/features/navigation-structure.feature.md`
- **Implementation branch:** `feature/navigation-structure`

## Feature Goal

Provide a predictable navigation structure that takes an unauthenticated customer from Login into the authenticated application, lets the customer switch between Restaurants and Order History with persistent bottom tabs, and lets the customer move from the restaurant list to a selected restaurant menu within the Restaurants tab.

The structure must keep authentication data out of route parameters, preserve relevant screen state when navigating back, reset restaurant-specific quantity state when changing restaurants, and prevent ordinary back navigation from exposing a stale Login or authenticated screen.

## Feature Scope

### In Scope (Included)

- A root Expo Router Stack in `client/app/_layout.js`.
- The Login route in `client/app/index.js`.
- An authenticated customer route group/folder under `client/app/customer/`.
- Customer bottom Tabs in `client/app/customer/_layout.js`.
- A left **Restaurants** tab and a right **Order History** tab.
- A nested restaurant Stack in `client/app/customer/restaurant/_layout.js`.
- The restaurant-list route in `client/app/customer/restaurant/index.js`.
- The dynamic restaurant-menu route in `client/app/customer/restaurant/[restaurantId].js`.
- The order-history route in `client/app/customer/order-history.js`.
- Authentication-aware entry, successful-login, logout, expired-session, and missing-session navigation behavior.
- Passing only the selected public `restaurantId` through the restaurant-menu route.
- Stack back behavior from Restaurant Menu to Restaurant List.
- Preservation of authentication and restaurant-filter state when returning from a menu.
- Reset of menu quantity state when entering a different restaurant.
- Header/footer visibility boundaries needed by navigation: both absent on Login and available throughout the authenticated customer area.
- Placeholder route screens when needed to verify the full navigation skeleton before feature screens are implemented.
- Navigation behavior on iOS and Android, including Android hardware-back behavior.

### Out of Scope (Excluded)

- Login form layout, credential validation, and authentication request implementation; see `login-page.feature.md`.
- Header styling, logo rendering, Log Out button styling, and footer styling; see `header-footer.feature.md`.
- Restaurant fetching, cards, images, filters, loading states, and empty/error UI; see `restaurant-list-page.feature.md`.
- Menu fetching, product display, quantities, and Create Order behavior; see `restaurant-menu-page.feature.md`.
- Order confirmation and submission behavior; see `menu-modal-confirmation.feature.md`.
- Order-history fetching, table content, and detail-modal behavior; see the two order-history feature specifications.
- Backend changes, database changes, or new API endpoints.
- Courier, employee, or restaurant-owner navigation.
- Extra tabs, drawers, screens, or navigation libraries not required by the grading sheet.
- Detailed visual styling beyond maintaining the supplied wireframe's screen hierarchy and header/footer visibility.

## Sub-Requirements (Feature Breakdown)

### Requirement A — Root Stack

- `client/app/_layout.js` must define the root-level Expo Router Stack and top-level navigation container.
- The Stack must contain the Login route and the authenticated customer application.
- Login is the unauthenticated entry route.
- The root Stack must not display a duplicate native header because the authenticated area uses the project shared header.
- A successful login must replace Login with the customer application so normal back gestures or the Android hardware-back button do not return to Login.
- Logout or an invalid/expired session must clear authentication storage before replacing the current route with Login.

### Requirement B — Authentication-Aware Entry

- The app must resolve persisted authentication before choosing Login or the customer application.
- While AsyncStorage is being checked, show a neutral loading/splash state rather than briefly displaying the wrong route.
- A usable persisted `accessToken` and `customerId` allow entry to the customer application.
- Missing, corrupt, cleared, or rejected authentication data is treated as logged out.
- A protected route opened without a usable session must replace itself with Login.
- Authentication values must be read through the shared storage/auth helpers, not passed in a route URL.

### Requirement C — Customer Tabs

- `client/app/customer/_layout.js` must define the authenticated bottom Tab navigator nested inside the root Stack.
- The first/left tab must be **Restaurants** and map to the `restaurant` route.
- The second/right tab must be **Order History** and map to the `order-history` route.
- Restaurants must be the initial authenticated destination after login.
- The tab bar is the required footer and must remain available on both authenticated tabs, including while the nested Restaurant Menu route is open.
- Tab labels must be exactly `Restaurants` and `Order History`.
- No additional automatically generated route may appear as a visible tab.

### Requirement D — Nested Restaurant Stack

- `client/app/customer/restaurant/_layout.js` must define a Stack nested inside the Restaurants tab.
- `client/app/customer/restaurant/index.js` is the Restaurant List stack entry.
- `client/app/customer/restaurant/[restaurantId].js` is the selected Restaurant Menu route.
- Pressing a restaurant image on the list must navigate to the matching dynamic menu route while remaining inside the Restaurants tab.
- The menu route must receive the selected restaurant's ID as `restaurantId`.
- Stack back navigation, the platform back gesture, and Android hardware back must return from Restaurant Menu to Restaurant List.
- The nested Stack must not add a second header above the shared authenticated header.

### Requirement E — State Continuity and Reset Boundaries

- Authentication state must remain available while navigating between all authenticated routes.
- Returning from a menu to the restaurant list must not corrupt the list's selected rating/price filters.
- Switching from Restaurants to Order History and back must return to a valid Restaurants stack state.
- Quantity state belongs to one selected restaurant/menu instance and must begin at zero.
- Navigating to a different `restaurantId` must create fresh quantity state with every quantity reset to zero.
- A route must not reuse one restaurant's quantities for another restaurant.
- Modal state is local to its owning feature and must not create a new footer tab or root route.

### Requirement F — Safe Back and Replacement Behavior

- Successful login uses replacement navigation rather than pushing the customer area above Login.
- Logout uses replacement navigation rather than pushing Login above authenticated content.
- An HTTP 401 handled by the shared API/auth layer must clear stale authentication and replace the active route with Login.
- After logout or session expiry, back navigation must not reopen Restaurant List, Restaurant Menu, or Order History.
- Back navigation from Restaurant Menu must return to Restaurant List rather than Login.
- The root-level authenticated customer route must not expose Login through an interactive back-swipe.

## User Flow and Navigation Logic

### First Launch or Logged-Out Launch

1. The root layout starts and waits for the shared auth-storage check.
2. No usable persisted session is found.
3. The root Stack displays `client/app/index.js` as Login.
4. Login displays neither the authenticated shared header nor the footer tabs.

### Successful Login

1. The customer submits valid credentials on Login.
2. The login feature persists `accessToken`, `userId` when needed, and `customerId`.
3. After those writes finish, navigation replaces Login with the customer application.
4. Customer Tabs open on the left Restaurants tab.
5. The Restaurant Stack opens its `index.js` Restaurant List entry.
6. The authenticated shared header and footer tabs are visible.

### Open a Restaurant and Return

1. The customer views the Restaurant List.
2. The customer presses a restaurant image.
3. The app validates that the selected restaurant has an ID and navigates to `/customer/restaurant/{restaurantId}`.
4. The nested Restaurant Stack displays `[restaurantId].js` inside the Restaurants tab.
5. The menu reads `restaurantId` from the route, while authentication remains in shared storage/context.
6. Back navigation returns to the Restaurant List and preserves its valid filter state.

### Change Restaurants

1. The customer returns from a menu to the Restaurant List.
2. The customer selects a restaurant with a different `restaurantId`.
3. A new dynamic menu route is opened for that ID.
4. The menu feature initializes every product quantity to zero for the newly selected restaurant.

### Switch Footer Tabs

1. From any authenticated Restaurants screen, the customer presses **Order History**.
2. Customer Tabs display `client/app/customer/order-history.js`.
3. The customer presses **Restaurants**.
4. Customer Tabs return to the Restaurants route in a valid stack state without losing authentication.

### Logout or Session Expiry

1. Logout or a protected API HTTP 401 starts the shared sign-out flow.
2. All stored authentication/customer keys are cleared and awaited.
3. Navigation replaces the authenticated customer area with Login.
4. Header and footer disappear with the authenticated layout.
5. Back navigation cannot reopen authenticated screens.

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Route and Layout Files

| File | Navigator or Screen | Responsibility |
| --- | --- | --- |
| `client/app/_layout.js` | Root Stack | Resolves top-level Login versus authenticated customer navigation. |
| `client/app/index.js` | Login screen | Unauthenticated entry route. |
| `client/app/customer/_layout.js` | Customer Tabs | Provides Restaurants and Order History bottom tabs. |
| `client/app/customer/restaurant/_layout.js` | Restaurant Stack | Provides Restaurant List → Restaurant Menu navigation inside the Restaurants tab. |
| `client/app/customer/restaurant/index.js` | Restaurant List screen | Default Restaurants tab and nested-stack entry. |
| `client/app/customer/restaurant/[restaurantId].js` | Restaurant Menu screen | Displays the menu for the public restaurant ID in the route. |
| `client/app/customer/order-history.js` | Order History screen | Right footer-tab destination. |

Use the `.js` filenames above because the current client is JavaScript. Do not introduce `.tsx` only for this feature without an approved project-wide TypeScript decision.

### Navigation Tree

```text
Root Stack — client/app/_layout.js
├── Login — client/app/index.js
└── Customer Tabs — client/app/customer/_layout.js
    ├── Restaurants — client/app/customer/restaurant/
    │   └── Restaurant Stack — client/app/customer/restaurant/_layout.js
    │       ├── Restaurant List — index.js
    │       └── Restaurant Menu — [restaurantId].js
    └── Order History — client/app/customer/order-history.js
```

### Components

- The shared authenticated header is rendered at an authenticated layout boundary or by a shared wrapper so it appears on every authenticated screen and never on Login.
- The Expo Router Tabs component supplies the persistent footer navigation.
- Restaurant cards/images call a navigation callback with only the selected `restaurantId`.
- Feature modals remain within their owning screen and are not registered as footer tabs.

### Services

- Navigation must use shared authentication/session actions for login completion, logout, and HTTP 401 handling.
- Protected API services obtain the bearer token through the shared API/storage layer; navigation does not supply it.
- No navigation-specific HTTP service is required.

### Storage

- Access token key.
- Customer ID key.
- User ID key only where another feature requires it.
- All navigation-affecting AsyncStorage reads, writes, and clears must be awaited.
- Passwords must never be stored.

### Backend / API

This feature introduces no endpoint and makes no navigation-only API request. It integrates with these behaviors owned elsewhere:

- `POST /api/auth` — successful authentication permits entry into the customer area.
- Any protected `/api/**` response with HTTP 401 — triggers storage clearing and replacement navigation to Login.

## Data, Validation, and State

### Route Data

| Value | Source | Destination | Rule |
| --- | --- | --- | --- |
| `restaurantId` | Selected restaurant returned by the restaurants API | `[restaurantId].js` | Required public route parameter; must identify the restaurant the customer selected. |
| `accessToken` | Shared auth storage | Shared protected API client | Never include in route parameters, logs, or visible URLs. |
| `customerId` | Shared auth storage | Order features/services | Never require Restaurant Menu navigation to carry it. |
| `userId` | Shared auth storage when needed | Feature/service that needs it | Do not confuse it with `customerId` and do not pass it merely to navigate. |

### Validation Rules

- Do not navigate to Restaurant Menu if the selected restaurant has no usable ID.
- Treat an absent or malformed `restaurantId` as an invalid route state; show a safe error/back action or return to Restaurant List instead of issuing an ambiguous menu request.
- Never put the JWT, password, customer ID, or full restaurant/product objects in route parameters.
- Do not enter authenticated routes until required auth-storage writes or reads have completed.
- Treat missing or corrupt authentication storage as logged out.

### Navigation State Transitions

| Current State | Event | Next State | Required Navigation Action |
| --- | --- | --- | --- |
| Resolving session | No usable session | Login | Show/replace with root Login route. |
| Resolving session | Usable persisted session | Restaurant List | Enter customer tabs on Restaurants. |
| Login | Authentication succeeds and storage completes | Restaurant List | Replace Login with customer area. |
| Restaurant List | Valid restaurant image pressed | Restaurant Menu | Push/navigate within nested Restaurant Stack using `restaurantId`. |
| Restaurant Menu | Back action | Restaurant List | Pop nested Restaurant Stack. |
| Restaurants | Order History tab pressed | Order History | Switch customer tab. |
| Order History | Restaurants tab pressed | Restaurants | Switch customer tab. |
| Any authenticated route | Logout or HTTP 401 | Login | Clear auth storage, then replace the customer area. |

## Expected Behavior

- The three navigator levels are structurally distinct and correctly nested.
- Login is outside Customer Tabs, so it has no authenticated header/footer.
- Restaurant Menu remains inside the Restaurants tab, so the footer remains visible.
- Order History is a sibling tab of Restaurants, not a Restaurant Stack screen.
- Selecting a restaurant opens the menu associated with that exact restaurant ID.
- Returning from a menu does not create duplicate Restaurant List routes or discard valid list-filter state.
- Selecting a different restaurant cannot inherit the previous restaurant's quantities.
- Authentication survives ordinary route changes but is removed before logout/session-expiry navigation completes.
- Navigation does not expose private credentials or tokens.
- Unknown or invalid navigation data fails safely without crashing the app.

## Technical Constraints (Feature-Level)

- Use Expo Router file-based routing because the graded implementation requires exact `_layout` locations.
- Use Expo Router's Stack and Tabs primitives; do not add a second independent navigation container.
- Preserve the exact nesting: Root Stack → Customer Tabs → Restaurant Stack.
- Use the current JavaScript baseline and `.js` route files.
- Keep route folders/files lowercase except Expo Router reserved/dynamic names.
- Keep navigation options and labels centralized in the owning layout instead of duplicating them across screens.
- Hide native navigator headers when they would duplicate the shared Rocket Food Delivery header.
- Respect safe areas and ensure the authenticated header and tab footer do not cover scrollable screen content.
- Support both iOS and Android through Expo.
- Do not modify the Java backend or database for this feature.
- Do not implement unrelated UI or business logic while building the navigation skeleton.

## Acceptance Criteria

### Structure

- [ ] `client/app/_layout.js` defines the root Stack.
- [ ] `client/app/customer/_layout.js` defines the nested customer Tabs.
- [ ] `client/app/customer/restaurant/_layout.js` defines the nested Restaurant Stack.
- [ ] The final hierarchy is Root Stack → Customer Tabs → Restaurant Stack.
- [ ] Login, Restaurant List, Restaurant Menu, and Order History resolve from the exact route files specified above.
- [ ] No unintended route appears as an extra footer tab.

### Root and Authentication Flow

- [ ] A logged-out launch displays Login without briefly exposing authenticated content.
- [ ] A usable persisted session enters the authenticated customer area without requiring a new login.
- [ ] Successful login opens Restaurant List and normal back navigation cannot return to Login.
- [ ] Logout clears all auth/customer storage and opens Login.
- [ ] After logout, platform back navigation cannot reopen an authenticated screen.
- [ ] A protected API HTTP 401 clears stale auth data and returns the customer to Login.
- [ ] Direct access to an authenticated route without a usable session returns to Login.

### Customer Tabs and Shared Navigation

- [ ] The left footer tab is labeled `Restaurants`.
- [ ] The right footer tab is labeled `Order History`.
- [ ] Restaurants is the initial authenticated tab.
- [ ] Both tabs switch to the correct screen.
- [ ] The footer remains present throughout the authenticated customer area, including Restaurant Menu.
- [ ] The shared header and footer are absent only on Login.

### Restaurant Stack and Route Data

- [ ] Pressing a restaurant image opens that restaurant's menu inside the Restaurants tab.
- [ ] The selected public ID is available as `restaurantId` on the dynamic menu route.
- [ ] No token, password, or full data object is passed through route parameters.
- [ ] Back gesture/button behavior returns Restaurant Menu to Restaurant List.
- [ ] Returning to Restaurant List preserves valid authentication and filter state.
- [ ] Opening a different restaurant resets all menu quantities to zero.
- [ ] A missing or invalid `restaurantId` is handled safely without a crash or incorrect API request.

### Platform and Quality Verification

- [ ] The navigation skeleton starts without Expo Router warnings or route-name errors.
- [ ] iOS back gestures and Android hardware-back behavior follow the defined stack boundaries.
- [ ] Repeated tab switching does not create duplicate screens or lose authentication.
- [ ] Rapid restaurant selection/back actions do not show the wrong restaurant's menu or quantities.
- [ ] Authenticated header/footer placement does not cover screen content on a small phone.
- [ ] Navigation is verified on both iOS and Android through Expo.

## Feature Definition of Done

- [ ] Every in-scope route and `_layout.js` file exists at the exact required path.
- [ ] All acceptance criteria pass with the real login/session integration or an explicitly temporary navigation test harness.
- [ ] The complete path Login → Restaurants → Restaurant Menu → back → Order History → Restaurants → Logout works without navigation errors.
- [ ] Cold-start session restoration, missing storage, logout, and HTTP 401 routing are verified.
- [ ] Navigation parameters contain only approved public route data.
- [ ] Tests or focused verification cover replacement navigation, nested back behavior, tab switching, and invalid `restaurantId` handling.
- [ ] The flow is manually checked on both iOS and Android, including Android hardware back and iOS back gesture behavior.
- [ ] The implementation matches `ai/ai-spec.md`, the grading sheet, the supplied wireframe hierarchy, and this feature specification.
- [ ] No backend files, database schema, or unrelated feature behavior were changed.
- [ ] Human-authored source files include the required purpose header and contents map.
- [ ] Temporary logs, placeholder navigation shortcuts, unused routes, and stale comments are removed.
- [ ] The feature diff is reviewed and contains no secret, access token, password, `.env`, or generated build output.

## Notes for the AI

- Read `ai/ai-spec.md` and this file before changing navigation code.
- Build the route skeleton first and verify every path before implementing feature-screen details.
- Keep the exact graded layout paths and three-level nesting; do not flatten the Restaurant Stack into the customer Tabs.
- Use replacement navigation at authentication boundaries and nested stack navigation between Restaurant List and Restaurant Menu.
- Do not create endpoints or modify the supplied Java server to solve a client navigation problem.
- Keep changes limited to navigation and the minimum placeholders/shared hooks needed to prove it works.
- If a real implementation decision changes a route path or state contract, update this specification before changing code.
