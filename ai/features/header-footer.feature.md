# AI Feature Specification — Header and Footer

> Defines the shared authenticated header and persistent footer navigation for the Rocket Food Delivery mobile application. Use this document together with `ai/ai-spec.md` and `ai/features/navigation-structure.feature.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow and Shared Layout Logic](#user-flow-and-shared-layout-logic)
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

- **Feature Name:** Authenticated Header and Footer Navigation
- **Related Area:** Mobile frontend, shared UI, Expo Router Tabs, authentication/logout
- **Specification file:** `ai/features/header-footer.feature.md`
- **Required visibility:** Every authenticated customer page; never the Login page
- **Related navigation specification:** `ai/features/navigation-structure.feature.md`
- **Implementation branch:** `feature/header-footer`

## Feature Goal

Give authenticated customers a consistent frame around the application. The header must identify Rocket Food Delivery and provide a reliable Log Out action. The footer must let the customer move between Restaurants and Order History from anywhere in the authenticated customer area.

The header and footer are visible on all pages except the Login page.

The shared frame must remain visible across the Restaurant List, Restaurant Menu, and Order History pages without being duplicated by nested navigators. It must respect safe areas, leave page content usable and scrollable, and disappear completely when the customer is on Login.

## Feature Scope

### In Scope (Included)

- A reusable authenticated header containing:
  - The supplied Rocket Food Delivery logo.
  - A visible button labeled exactly `Log Out`.
- A persistent footer implemented by the customer Expo Router Tab navigator.
- Exactly two visible footer tabs:
  - **Restaurants** on the left.
  - **Order History** on the right.
- Active and inactive footer-tab states that remain understandable through both text and visual treatment.
- Header and footer visibility on:
  - Restaurant List.
  - Restaurant Menu for any selected restaurant.
  - Order History.
  - Authenticated page content behind feature modals.
- Complete absence of the authenticated header and footer on Login.
- Logout sequencing:
  - Prevent duplicate logout actions.
  - Clear all persisted authentication/customer values.
  - Reset shared in-memory session state if present.
  - Replace the authenticated route with Login.
  - Prevent normal back navigation from reopening authenticated content.
- Layout behavior for safe areas, small phone screens, long/scrollable content, and iOS/Android.
- Exact use of the supplied color palette and an approved supplied logo asset.
- Accessibility labels, roles, selected state, readable contrast, and usable touch targets.

### Out of Scope (Excluded)

- Login-screen branding, fields, validation, and authentication request behavior; see `login-page.feature.md`.
- Root Stack and nested Restaurant Stack construction; see `navigation-structure.feature.md`.
- Restaurant-list, menu, order-confirmation, order-history, or order-detail business logic.
- Modal content and modal request states.
- Fetching page data when the customer changes tabs; each screen's feature specification owns that behavior.
- New backend endpoints, logout endpoints, token revocation, or Java server changes.
- Additional footer tabs, drawer navigation, a floating navigation bar, or role-specific navigation.
- A page title, search field, profile menu, avatar, notification control, or any other ungraded header action.
- Replacing or editing the original files under `support_materials_13/`.
- Approximate brand colors, unapproved logos, emoji icons, or newly invented branding.

## Sub-Requirements (Feature Breakdown)

### Requirement A — Shared Authenticated Header

- Render one shared header throughout the authenticated customer area.
- Display the supplied Rocket Food Delivery logo in the header.
- Use `support_materials_13/Images/AppLogoV1.png` as the default header source because it is the compact horizontal supplied logo.
- Copy the approved runtime logo into the client asset location; do not load it at runtime from `support_materials_13/`.
- Preserve the logo's aspect ratio; do not stretch, crop, recolor, redraw, or replace it with text.
- Display a visible button with the exact label `Log Out`.
- Keep the logo and Log Out button usable on narrow screens without overlap or horizontal clipping.
- Do not render an additional native Stack header above or below the shared header.

### Requirement B — Header Visibility

- Show the shared header on Restaurant List.
- Show the shared header on every Restaurant Menu route.
- Show the shared header on Order History.
- Keep the header mounted when an authenticated feature modal opens; the modal may visually overlay or block interaction with the content behind it.
- Do not show the authenticated shared header on Login.
- Determine visibility from the authenticated route/layout boundary, not by fragile pathname checks copied into every screen.

### Requirement C — Persistent Footer Tabs

- Implement the footer with Expo Router Tabs in `client/app/customer/_layout.js`.
- Register the `restaurant` route as the first/left visible tab with the exact label `Restaurants`.
- Register the `order-history` route as the second/right visible tab with the exact label `Order History`.
- Keep the footer mounted while navigating from Restaurant List to Restaurant Menu inside the nested Restaurant Stack.
- Clearly identify the active tab without removing its text label.
- Ensure inactive tabs remain readable and interactive.
- Prevent internal route/layout files and dynamic menu routes from appearing as extra footer tabs.
- Do not create a separate footer component that duplicates or competes with the Tabs navigator.

### Requirement D — Footer Navigation Behavior

- Pressing **Restaurants** displays the Restaurants tab and its nested Restaurant Stack.
- Pressing **Order History** displays the Order History page.
- Switching tabs must preserve a valid authenticated session.
- Switching away from and back to Restaurants must return to a valid Restaurant Stack state as defined by the navigation specification.
- Pressing the already-active tab must not create duplicate routes.
- Footer navigation must not put tokens, passwords, customer IDs, or full domain objects into route parameters.

### Requirement E — Logout Behavior

- The Log Out button starts one shared sign-out action.
- Ignore or disable repeated presses while logout is in progress.
- Await removal of every centralized authentication/customer storage key, including:
  - Access token.
  - Customer ID.
  - User ID when stored.
- Clear matching in-memory authentication/session state after or as part of the shared storage operation.
- After the clear succeeds, replace the current authenticated route with Login rather than pushing Login on top of it.
- After logout, the header and footer disappear because Login is outside the authenticated customer layout.
- After logout, iOS back gestures and Android hardware back must not reopen Restaurant List, Restaurant Menu, or Order History.
- Do not call a backend logout endpoint because the current API contract defines none.
- Do not log the access token or include it in a logout route.

### Requirement F — Logout Failure and Session Safety

- Keep logout state explicit, for example `idle` and `clearing`.
- If clearing persisted authentication fails, do not report a successful logout while reusable credentials may remain stored.
- Restore the button to an interactive state and show a short user-safe retry message.
- Do not expose AsyncStorage error details, stack traces, tokens, or internal server information to the customer.
- Use the same shared sign-out/session-clear logic for the Log Out button and protected API HTTP 401 handling; do not maintain two conflicting cleanup paths.

### Requirement G — Shared Layout and Content Boundaries

- Respect the device's top safe area before header content and bottom safe area around the footer tabs.
- Keep the header and footer fixed as shared navigation while the active page's overflow content scrolls within the remaining content area.
- The header must not cover the first row, heading, filter, or menu content.
- The footer must not cover the last restaurant card, menu product, order row, action button, or modal trigger.
- Account for the keyboard on screens that accept input without moving the footer into an unusable position.
- Use one shared source for theme values and shared layout spacing.

## User Flow and Shared Layout Logic

### Login to Authenticated Layout

1. The customer begins on Login without the authenticated header or footer.
2. Valid authentication finishes and required session values are persisted.
3. Root navigation replaces Login with the customer application.
4. `client/app/customer/_layout.js` mounts the authenticated shared frame.
5. The shared header appears with the Rocket Food Delivery logo and Log Out button.
6. The footer appears with Restaurants active on the left and Order History on the right.

### Navigate Between Restaurants and Order History

1. The customer presses **Order History** in the footer.
2. The Order History tab becomes active and its page appears.
3. The same shared header and footer remain mounted.
4. The customer presses **Restaurants**.
5. The Restaurants tab becomes active and returns to a valid nested Restaurant Stack state.

### Open a Restaurant Menu

1. The customer starts on Restaurant List with the authenticated frame visible.
2. The customer opens a restaurant menu.
3. The nested Restaurant Stack changes from Restaurant List to Restaurant Menu.
4. The parent customer layout does not unmount, so both shared header and footer remain visible.
5. Back navigation returns to Restaurant List without duplicating the shared frame.

### Log Out

1. The customer presses `Log Out` from any authenticated page.
2. The Log Out button prevents a second submission while session clearing is underway.
3. The shared auth-storage helper clears all authentication/customer keys and the app clears matching in-memory session state.
4. After cleanup succeeds, root navigation replaces the customer application with Login.
5. Login displays without the authenticated header and footer.
6. Back navigation cannot reopen the previous authenticated page.

### Logout Cleanup Failure

1. The customer presses `Log Out`.
2. Clearing persisted session data fails.
3. The application does not claim logout succeeded.
4. A concise retry message is shown without exposing private/internal details.
5. The button returns to its interactive state so the customer can retry.

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Files and Ownership

| File or Location | Responsibility |
| --- | --- |
| `client/app/customer/_layout.js` | Owns the authenticated customer Tabs, shared-header integration, footer labels/order, and tab visibility. |
| `client/components/AppHeader.js` | Renders the approved logo, Log Out button, accessibility properties, and logout pending/error UI. |
| `client/storage/authStorage.js` | Centralizes authentication/customer storage keys and the awaited clear-session operation. |
| `client/constants/theme.js` | Exposes the exact shared colors, typography, spacing, and layout constants used by the header/footer. |
| `client/assets/` | Stores the approved runtime copy of the supplied Rocket Food Delivery logo. |
| `client/app/index.js` | Login route; must not render or inherit the authenticated header/footer. |
| `client/app/customer/restaurant/_layout.js` | Nested Restaurant Stack; must hide duplicate native headers and remain inside the parent footer Tabs. |

If an approved implementation uses different reusable-module filenames, update this feature specification before implementation so paths do not drift.

### Pages Covered

- `client/app/customer/restaurant/index.js` — Restaurant List.
- `client/app/customer/restaurant/[restaurantId].js` — Restaurant Menu.
- `client/app/customer/order-history.js` — Order History.

### Component Contract — `AppHeader`

The header may receive shared session actions through props or context, but it must have a small, explicit contract:

| Input/State | Purpose |
| --- | --- |
| `onLogout` or shared auth action | Starts the single centralized logout flow. |
| `isLoggingOut` | Prevents repeated presses and communicates pending state. |
| `logoutError` when needed | Displays a user-safe retry message without leaking internal details. |

The header does not need customer profile data and must not receive a password or expose the access token.

### Services

- No header/footer-specific HTTP service is required.
- The shared authentication/session layer owns storage cleanup and in-memory session reset.
- The shared protected API layer may invoke the same session-clear behavior after HTTP 401.

### Storage

- Access token key.
- Customer ID key.
- User ID key when the login feature stores it.
- Key names must be defined once in the shared storage module.
- Logout must await clearing all keys before successful redirect.
- Passwords must never be stored or cleared because they must never be persisted.

### Backend / API

This feature creates no endpoint and makes no logout request. The supplied backend has no required logout endpoint. Logout is a client session operation: clear local authentication/customer state, then replace the route with Login.

## Data, Validation, and State

### Data Used

| Data | Source | Use | Restriction |
| --- | --- | --- | --- |
| Approved logo image | Supplied support materials, copied into `client/assets/` | Brand identification in the header | Preserve aspect ratio and visual content. |
| Active tab | Expo Router Tabs state | Distinguishes Restaurants from Order History | Must have a visible non-color-only indication. |
| Access token | Shared auth storage/session | Determines authenticated state and is cleared on logout | Never render, log, or pass as a route parameter. |
| Customer ID | Shared auth storage/session | Used by other customer features and cleared on logout | Do not display in the shared frame. |
| User ID | Shared auth storage/session when stored | Cleared on logout | Do not confuse with customer ID or display it. |
| Logout state | Shared auth/header state | Prevents duplicate clearing/navigation | Must return to an interactive state after failure. |

### Validation Rules

- Render the authenticated shared frame only inside the authenticated customer layout.
- Do not render the frame when Login is active.
- Do not navigate to Login as a successful logout until the shared clear operation completes.
- Prevent more than one logout operation from running at once.
- Register exactly two visible customer tabs and use their required labels.
- Do not allow a missing custom icon to remove a required text label or break tab navigation.
- Treat a missing runtime logo as an implementation error to fix before completion; do not silently replace it with unrelated artwork.

### State Transitions

| Current State | Event | Next State | Expected UI/Navigation |
| --- | --- | --- | --- |
| Login | Authentication succeeds | Authenticated / Restaurants | Shared header/footer mount; Restaurants is active. |
| Restaurants active | Order History pressed | Order History active | Same frame remains; active footer state changes. |
| Order History active | Restaurants pressed | Restaurants active | Same frame remains; active footer state changes. |
| Authenticated / idle | Log Out pressed | Authenticated / clearing | Disable repeated logout; begin awaited cleanup. |
| Authenticated / clearing | Cleanup succeeds | Logged out | Replace with Login; shared frame unmounts. |
| Authenticated / clearing | Cleanup fails | Authenticated / idle with error | Keep authenticated page, show retry message, re-enable logout. |
| Any authenticated state | Protected API returns HTTP 401 | Logged out | Use shared cleanup and replace with Login. |

## Visual and Accessibility Contract

### Supplied Assets

- Original logo files remain unchanged under `support_materials_13/Images/`.
- The default header source is the supplied compact horizontal `AppLogoV1.png` (`594 × 163`, transparent PNG).
- Copy the chosen file into the client runtime asset structure and use that copy consistently for the header.
- `AppLogoV2.png` is a taller supplied variation and must not be substituted casually where it causes the header to grow or content to clip.
- If the approved logo choice changes after direct wireframe/coach review, update this specification and every runtime reference together.

### Exact Palette

Use centralized theme constants with these supplied values; do not use approximate named colors:

| Color | Hex | RGBA |
| --- | --- | --- |
| Orange Red | `#DA583B` | `rgba(218, 88, 59, 1)` |
| Dark Charcoal | `#222126` | `rgba(33, 33, 38, 1)` |
| Dark Red | `#851919` | `rgba(132, 25, 25, 1)` |
| Muted Green | `#609475` | `rgba(96, 148, 116, 1)` |
| Warm Yellow / Mustard | `#F0CB67` | `rgba(240, 203, 103, 1)` |
| White | `#FFFFFF` | `rgba(255, 255, 255, 1)` |

Match the supplied `Wireframe.pdf` for which palette value is applied to each header/footer surface and state. Do not invent gradients, shadows, transparency, or approximate colors that are not shown there.

### Typography and Controls

- Use Oswald where the wireframe shows it and the project's Arial/platform-safe fallback elsewhere.
- Keep the exact visible labels `Log Out`, `Restaurants`, and `Order History`.
- Do not make required navigation understandable by icons alone.
- If footer icons are used, use the installed FontAwesome system and select icons that match the wireframe; do not use emoji or text glyph substitutes.
- Provide accessibility roles for the button and tabs.
- Announce the selected state of the active footer tab.
- Give the logo an appropriate accessibility label or mark it decorative when adjacent semantics already identify the app; do not cause duplicate announcements.
- Maintain readable contrast and a usable touch target on both iOS and Android.
- Ensure larger accessibility text does not hide, overlap, or truncate the only available logout/navigation control.

## Expected Behavior

- Login is the only application page without the authenticated shared header and footer.
- Restaurant List, every Restaurant Menu, and Order History share one consistent header/footer implementation.
- The header displays an undistorted Rocket Food Delivery logo and one Log Out button.
- The footer displays exactly Restaurants on the left and Order History on the right.
- The active tab is obvious through more than color alone.
- Nested restaurant navigation changes page content without removing or duplicating the shared frame.
- Long page content scrolls between the shared navigation regions and remains reachable.
- Logout clears all local session values before redirecting and cannot be submitted twice concurrently.
- Successful logout cannot be reversed with ordinary platform back navigation.
- Cleanup failures remain retryable and never expose authentication data.
- Header/footer colors, typography, spacing, asset treatment, and control placement match the supplied wireframe as closely as possible on both platforms.

## Technical Constraints (Feature-Level)

- Use Expo Router Tabs for the footer because it is part of the required Root Stack → Customer Tabs → Restaurant Stack hierarchy.
- Keep the header integration at the authenticated customer layout boundary so pages do not each create their own copy.
- Hide duplicate native headers at the root and nested Restaurant Stack levels.
- Use the current JavaScript baseline and `.js` modules.
- Use React Native components only; do not render browser DOM or React Bootstrap web components in native screens.
- Use centralized theme constants rather than repeating raw color values across components.
- Use centralized auth-storage keys and one shared logout/session-clear action.
- Respect top and bottom safe-area insets.
- Keep active page content scrollable and unobscured by the shared frame.
- Support iOS and Android through Expo.
- Do not modify the supplied Java backend, database, or original support-material files.
- Do not add packages unless the current Expo-compatible dependencies cannot meet a confirmed requirement.

## Acceptance Criteria

### Visibility and Structure

- [x] Login renders without the authenticated shared header.
- [x] Login renders without the footer Tabs.
- [x] Restaurant List displays both the shared header and footer.
- [x] Restaurant Menu displays both the shared header and footer.
- [x] Order History displays both the shared header and footer.
- [ ] Opening or closing an authenticated feature modal does not create a second header/footer.
- [x] Root and nested Stack native headers do not duplicate the shared header.

### Header

- [x] The header uses an approved supplied Rocket Food Delivery logo copied into the client runtime assets.
- [x] The logo is not stretched, cropped, recolored, or replaced with plain text.
- [x] A visible button is labeled exactly `Log Out`.
- [ ] Logo and button do not overlap or clip on a small phone.
- [x] The Log Out button remains accessible with larger text settings.

### Footer

- [x] Exactly two customer footer tabs are visible.
- [x] The left tab is labeled exactly `Restaurants`.
- [x] The right tab is labeled exactly `Order History`.
- [x] Each tab opens the correct route.
- [x] The active tab is visibly and accessibly selected without relying only on color.
- [ ] Pressing the active tab repeatedly does not create duplicate routes.
- [x] The footer remains visible while Restaurant Menu is open.
- [x] No layout, dynamic route, or internal screen appears as an unintended tab.

### Logout

- [x] Pressing Log Out starts only one cleanup operation.
- [x] Repeated presses are disabled or ignored while cleanup is running.
- [x] Access token, customer ID, and stored user ID are all cleared and awaited.
- [x] Matching in-memory session state is cleared.
- [x] Successful logout replaces the authenticated customer area with Login.
- [x] Header and footer are absent after logout.
- [ ] iOS back gesture and Android hardware back cannot reopen authenticated content after logout.
- [x] No backend logout endpoint is called.
- [x] No token, password, or internal storage error is logged or displayed.
- [x] A cleanup failure shows a safe retry message and returns the button to an interactive state.

### Layout, Visual, and Platform Verification

- [x] Header/footer colors use exact centralized values from the supplied palette.
- [ ] The implementation is compared side by side with `support_materials_13/Design/Wireframe.pdf`.
- [ ] Top and bottom safe areas are respected on iOS and Android.
- [ ] Header and footer do not cover the first or last page content.
- [ ] Long Restaurant List, Restaurant Menu, and Order History content remains scrollable and reachable.
- [x] Required controls have readable contrast, accessible roles/labels, and usable touch targets.
- [ ] The complete shared-frame and logout flow is verified on both iOS and Android through Expo.

## Feature Definition of Done

- [ ] Every in-scope requirement and acceptance criterion passes.
- [x] One shared header implementation is used throughout the authenticated customer area.
- [x] Expo Router Tabs provide exactly the required footer navigation.
- [ ] The complete path Login → Restaurants → Restaurant Menu → Order History → Restaurants → Logout works without duplicated or missing shared UI.
- [ ] Logout success, repeated presses, storage-cleanup failure, HTTP 401 cleanup, and post-logout back behavior are verified.
- [ ] Header/footer placement is checked on small screens, long content, large accessibility text, and device safe areas.
- [ ] The visual result is compared with the supplied wireframe and exact color scheme on both iOS and Android.
- [x] The approved supplied logo is copied into runtime assets and the originals remain unchanged.
- [x] Tests or focused verification cover visibility boundaries, tab destinations/order, and awaited logout navigation.
- [ ] The implementation matches `ai/ai-spec.md`, `navigation-structure.feature.md`, the grading sheet, and this feature specification.
- [x] No backend, database, unrelated feature, or original support-material file was changed.
- [x] New human-authored source files contain the required purpose header and contents map.
- [ ] Temporary logs, placeholder controls, unused assets, stale comments, and duplicate shared components are removed.
- [x] The feature diff contains no access token, password, `.env`, or generated build output.

## Notes for the AI

- Read `ai/ai-spec.md`, `navigation-structure.feature.md`, and this file before changing shared layout code.
- Implement the shared frame at the authenticated layout boundary; do not copy header/footer markup into individual screens.
- Keep Restaurants and Order History as Tabs, while Restaurant List and Restaurant Menu remain a nested Stack.
- Treat footer labels, order, and Login visibility as exact grading requirements.
- Use the supplied assets and palette; do not approximate or invent branding.
- Use one awaited storage-clear/session-reset function for logout and HTTP 401 handling.
- Do not change the backend or add a logout endpoint.
- Keep changes limited to the shared header/footer, their direct session/navigation integration, and the minimum supporting constants/assets.
- If a verified wireframe or coach decision changes the logo choice or shared-layout contract, update this specification before implementation.
