# AI Feature Specification — Navigation Structure

> Defines the combined Module 14 Expo Router hierarchy. Use this document together with `ai/M14/ai-spec.md` and the retained M13 navigation specification at `ai/M13/features/navigation-structure.feature.md`.

> **Implementation owner:** Claude will run with this specification and implement the feature. The specification must therefore be complete enough for Claude to work without relying on private `.omi/` files, guessing missing product behavior, or expanding the feature scope.

## Table of Contents

1. [Feature identity](#1-feature-identity)
2. [Feature goal](#2-feature-goal)
3. [Feature scope](#3-feature-scope)
4. [Requirements breakdown](#4-requirements-breakdown)
5. [User flow and navigation logic](#5-user-flow-and-navigation-logic)
6. [Interfaces](#6-interfaces)
7. [Data, validation, and state](#7-data-validation-and-state)
8. [Expected behavior](#8-expected-behavior)
9. [Technical constraints](#9-technical-constraints)
10. [Acceptance criteria](#10-acceptance-criteria)
11. [Feature Definition of Done](#11-feature-definition-of-done)
12. [Notes for AI tools](#12-notes-for-ai-tools)

## 1. Feature identity

- **Feature name:** Combined Customer and Courier Navigation Structure
- **Related area:** Mobile frontend, Expo Router, authentication/session boundary
- **Required nesting:** Root Stack → role-specific Tabs → nested Restaurant Stack for Customer
- **Specification file:** `ai/M14/features/navigation-structure.feature.md`
- **Implementation branch:** `feature/navigation-structure`
- **Grading requirements:** Root authentication layout, Account Selection route, Customer Tabs, Courier Tabs, and nested Restaurant Stack

## 2. Feature goal

Extend the working M13 customer navigation into a protected, role-aware structure that can safely route authenticated users to Account Selection, Customer, or Courier sections. Preserve the existing Restaurant List → Restaurant Menu stack while adding the required Account destinations and Courier tabs.

This feature establishes route files, navigator ownership, authenticated guards, role/session persistence, and placeholder destinations. Later feature specifications own the final Account forms, Courier delivery behavior, detailed role-selection wireframe behavior, and business data.

## 3. Feature scope

### 3.1 In scope

- Continue using `client/app/_layout.js` as the root Stack.
- Keep `client/app/index.js` as Login outside authenticated navigation.
- Extend the authenticated session to retain user, customer, courier, and active-role identity.
- Route a valid customer session to Customer tabs.
- Route a valid courier session to Courier tabs.
- Route a valid dual-role session without an active role to `client/app/selection.js`.
- Add Customer, Courier, and Account Selection guards at the root boundary.
- Add `client/app/selection.js` with Customer and Courier choices so both role trees can be reached.
- Preserve Customer Tabs at `client/app/customer/_layout.js`.
- Add the Customer Account tab and destination.
- Preserve the Restaurant Stack at `client/app/customer/restaurant/_layout.js`.
- Add Courier Tabs at `client/app/courier/_layout.js`.
- Add Courier Order Delivery and Account destinations.
- Keep the shared authenticated header visible on Customer/Courier tabs.
- Use replacement/protected navigation so logout, role resolution, and invalid sessions do not leave unsafe back paths.
- Support iOS and Android navigation behavior.

### 3.2 Out of scope

- Final Account Selection visual polish and all edge-case acceptance criteria owned by `role-based-navigation.feature.md`.
- Account retrieval, editing, validation, save requests, and final Account UI; see `account-details.feature.md`.
- Courier order requests, eligibility merging, status transitions, details modal, and final delivery UI; see `courier-delivery.feature.md`.
- Notification checkboxes or order request changes; see `order-confirmation-modal.feature.md`.
- A complete cross-app visual audit; see `ui.feature.md`.
- Java backend or database changes.
- Employee or restaurant-owner routes.
- Switching roles from inside a role app unless a later approved requirement adds it.
- Extra tabs, drawers, or navigators not required by M14.

## 4. Requirements breakdown

### 4.1 Requirement A — Root Stack with authentication flow

- `client/app/_layout.js` remains the root Expo Router Stack.
- It must not render protected content until fonts and stored-session restoration finish.
- Login is available only without a usable session.
- Account Selection is available only to a usable dual-role session with no selected active role.
- Customer is available only when `activeRole` is `customer` and a customer ID exists.
- Courier is available only when `activeRole` is `courier` and a courier ID exists.
- Root navigator headers remain hidden because authenticated role layouts supply the shared header.
- Protected routes must close immediately when their guard becomes false.

### 4.2 Requirement B — Role Selection screen route

- Create `client/app/selection.js`.
- It must provide explicit Customer and Courier choices.
- It must not infer a choice for a dual-role user.
- Selecting a role persists a valid `activeRole`; the root guard then opens the matching role tree.
- Invalid, unavailable, or stale role choices must fail safely without opening the wrong app.
- This route is not a tab in either role app.

### 4.3 Requirement C — Customer Tabs

- `client/app/customer/_layout.js` remains a Tabs navigator.
- Its visible tabs are Restaurants, Order History, and Account.
- Restaurants remains the initial tab.
- The shared header is visible on all Customer tab destinations.
- Customer routes reject a missing session, the wrong active role, or a missing customer ID.
- No route file may appear as an unintended extra tab.

### 4.4 Requirement D — Courier Tabs

- Create `client/app/courier/_layout.js` as a Tabs navigator.
- Its visible tabs are Order Delivery and Account.
- Order Delivery is the initial tab.
- The shared header is visible on both Courier destinations.
- Courier routes reject a missing session, the wrong active role, or a missing courier ID.
- No Customer route appears in Courier tabs.

### 4.5 Requirement E — Nested Restaurant Stack

- Preserve `client/app/customer/restaurant/_layout.js` as a Stack inside Customer Tabs.
- Preserve `restaurant/index.js` as Restaurant List.
- Preserve `restaurant/[restaurantId].js` as Restaurant Menu.
- Restaurant Menu remains inside the Restaurants tab, retaining its footer.
- Only the public restaurant ID travels through the route.
- Back returns Menu to Restaurant List, not Login or Account Selection.
- Existing filter preservation and per-restaurant quantity reset behavior must not regress.

### 4.6 Requirement F — Session and role persistence

- Persist `accessToken`, `userId`, optional `customerId`, optional `courierId`, and selected/derived `activeRole`.
- A usable session requires a token, user ID, and at least one supported role ID.
- A single-role login derives and persists its only valid active role.
- A dual-role login initially stores no active role and requires Account Selection.
- A restored active role is accepted only when its matching role ID exists.
- Corrupt, partial, or unsupported stored state is logged out and cleared.
- Logout clears every authentication and role key.

### 4.7 Requirement G — Placeholder destination boundary

- Customer Account, Courier Order Delivery, and Courier Account routes may use clearly identified placeholder content during this feature.
- Placeholder routes must prove the correct header, footer, labels, active-role guard, safe area, and scrolling layout.
- They must not fake successful account or delivery API behavior.
- Later feature implementation must replace placeholder content without changing the required route hierarchy.

## 5. User flow and navigation logic

### 5.1 Logged-out launch

1. Root providers load fonts and persisted storage.
2. No usable session resolves.
3. Root Stack exposes Login only.
4. Authenticated headers and tabs are absent.

### 5.2 Customer-only login

1. Login receives a usable token, user ID, and customer ID without a courier ID.
2. Storage saves the session with `activeRole = customer`.
3. Root guards remove Login and expose Customer.
4. Customer Tabs open Restaurants.

### 5.3 Courier-only login

1. Login receives a usable token, user ID, and courier ID without a customer ID.
2. Storage saves the session with `activeRole = courier`.
3. Root guards remove Login and expose Courier.
4. Courier Tabs open Order Delivery.

### 5.4 Dual-role login

1. Login receives a usable token, user ID, customer ID, and courier ID.
2. Storage saves both role IDs with no active role.
3. Root guards expose Account Selection only.
4. Customer choice persists `activeRole = customer` and opens Customer Tabs.
5. Courier choice persists `activeRole = courier` and opens Courier Tabs.

### 5.5 Customer navigation

1. Customer opens Restaurants, Order History, or Account through the footer.
2. Restaurant image navigation remains inside the nested Restaurant Stack.
3. Back from Restaurant Menu returns to Restaurant List.
4. Footer remains visible across Customer destinations.

### 5.6 Courier navigation

1. Courier opens Order Delivery or Account through the footer.
2. Footer and shared header remain visible.
3. Customer tabs and routes remain unavailable.

### 5.7 Logout/session invalidation

1. Logout or shared unauthorized handling clears all stored keys.
2. In-memory session becomes null.
3. Protected root guards close Selection, Customer, and Courier.
4. Login becomes the only root destination.
5. Back cannot reopen protected content.

## 6. Interfaces

### 6.1 Route and layout files

| File | Interface | Responsibility |
| --- | --- | --- |
| `client/app/_layout.js` | Root Stack | Resolves Login, Selection, Customer, and Courier guards. |
| `client/app/index.js` | Login | Produces the authenticated role-capable session. |
| `client/app/selection.js` | Account Selection | Persists one explicit choice for a dual-role user. |
| `client/app/customer/_layout.js` | Customer Tabs | Restaurants, Order History, and Account. |
| `client/app/customer/restaurant/_layout.js` | Restaurant Stack | Restaurant List → Restaurant Menu. |
| `client/app/customer/account.js` | Customer Account destination | Placeholder until Account Details feature. |
| `client/app/courier/_layout.js` | Courier Tabs | Order Delivery and Account. |
| `client/app/courier/index.js` | Order Delivery destination | Placeholder until Courier Delivery feature. |
| `client/app/courier/account.js` | Courier Account destination | Placeholder until Account Details feature. |

### 6.2 Navigation tree

```text
Root Stack
├── Login
├── Account Selection
├── Customer Tabs
│   ├── Restaurants
│   │   └── Restaurant Stack
│   │       ├── Restaurant List
│   │       └── Restaurant Menu
│   ├── Order History
│   └── Account
└── Courier Tabs
    ├── Order Delivery
    └── Account
```

### 6.3 Shared modules

- `client/contexts/AuthContext.js`: owns restored session, login completion, role selection, logout, and unauthorized transitions.
- `client/storage/authStorage.js`: owns all stored keys, validation, session reconstruction, role selection, and clearing.
- `client/services/authService.js`: validates and maps both optional role IDs from `POST /api/auth`.
- `client/components/AppHeader.js`: shared authenticated logo/logout boundary.
- `client/components/AppIcon.js`: registered footer icons.

### 6.4 Backend/API

This feature adds no endpoint. It consumes the existing login contract:

```text
POST /api/auth
```

Required successful response values are `accessToken`, `user_id`, optional `customer_id`, and optional `courier_id`. Later feature specs own account and delivery endpoints.

## 7. Data, validation, and state

### 7.1 Session shape

```js
{
  accessToken: string,
  userId: string,
  customerId: string | null,
  courierId: string | null,
  activeRole: 'customer' | 'courier' | null,
}
```

Identifiers may arrive as numbers or numeric strings but are normalized to positive numeric strings at storage boundaries.

### 7.2 Session validation

- `accessToken` must be a nonblank string.
- `userId` must be a positive identifier.
- At least one of `customerId` or `courierId` must be a positive identifier.
- `activeRole = customer` requires `customerId`.
- `activeRole = courier` requires `courierId`.
- Both role IDs with no active role is a valid pending-selection state.
- A single role with no active role is normalized to that only role.
- Any other combination is rejected or cleared.

### 7.3 Navigation state table

| Session state | Exposed root destination |
| --- | --- |
| Loading/unresolved | Neutral loading screen |
| Null/invalid | Login |
| Customer only | Customer Tabs |
| Courier only | Courier Tabs |
| Both, no active role | Account Selection |
| Both, active customer | Customer Tabs |
| Both, active courier | Courier Tabs |

### 7.4 Route data rules

- Only `restaurantId` is required by the retained dynamic Restaurant Menu route.
- Token, password, role IDs, and full objects do not travel through route parameters.
- Route access is derived from AuthContext, not user-controlled URL data.

## 8. Expected behavior

- Root Stack exposes exactly one valid branch after session restoration.
- Every single-role session bypasses Account Selection.
- Every unresolved dual-role session requires an explicit choice.
- Customer and Courier tab trees cannot be open simultaneously.
- Customer has three visible tabs; Courier has two.
- Shared authenticated header/logout works in both role apps.
- Account Selection is not a footer tab.
- Existing Restaurant List/Menu navigation remains structurally and behaviorally intact.
- Placeholder destinations are honest about later implementation and do not call unverified APIs.
- Invalid state fails closed to Login rather than opening a guessed role.

## 9. Technical constraints

- Use Expo Router 6 JavaScript `Stack`, `Stack.Protected`, `Tabs`, and `Redirect` primitives supported by the installed SDK 54 baseline.
- Do not add a second navigation container.
- Use current `.js` route files; do not introduce TypeScript for this feature.
- Keep navigator-native headers hidden where `AppHeader` supplies the authenticated header.
- Keep tabs declared explicitly so placeholder/template routes do not appear automatically.
- Await authentication storage writes before changing in-memory guards.
- Preserve unrelated M13 files and behavior.
- Do not modify the Java backend.
- Do not add a new navigation or state-management dependency.

## 10. Acceptance criteria

### 10.1 Required structure

- [ ] `client/app/_layout.js` defines the protected root Stack.
- [ ] `client/app/selection.js` exists as Account Selection.
- [ ] `client/app/customer/_layout.js` defines Customer Tabs.
- [ ] `client/app/courier/_layout.js` defines Courier Tabs.
- [ ] `client/app/customer/restaurant/_layout.js` remains the nested Restaurant Stack.
- [ ] The resulting hierarchy matches the tree in Section 6.2.

### 10.2 Session and root guards

- [ ] Startup waits for fonts and stored-session resolution.
- [ ] Logged-out/invalid storage exposes only Login.
- [ ] Customer-only storage exposes only Customer.
- [ ] Courier-only storage exposes only Courier.
- [ ] Unselected dual-role storage exposes only Account Selection.
- [ ] A selected dual-role session exposes only the selected role app.
- [ ] Logout/unauthorized handling clears every identity/role key.
- [ ] Back navigation cannot reopen a closed protected tree.

### 10.3 Account Selection

- [ ] Customer and Courier choices are both visible and accessible.
- [ ] Each choice persists only a role available in the current session.
- [ ] A choice opens the matching role tabs.
- [ ] Selection is unavailable to logged-out and single-role sessions.
- [ ] Duplicate taps are safely ignored while persistence is pending.

### 10.4 Customer navigation

- [ ] Customer footer labels are Restaurants, Order History, and Account.
- [ ] Restaurants is initial.
- [ ] Each Customer tab resolves to the correct route.
- [ ] Restaurant List → Menu → back behavior still works.
- [ ] Header/footer and retained filter/quantity boundaries do not regress.

### 10.5 Courier navigation

- [ ] Courier footer labels are Order Delivery and Account.
- [ ] Order Delivery is initial.
- [ ] Each Courier tab resolves to the correct route.
- [ ] Customer destinations do not appear in Courier tabs.
- [ ] Shared header and Courier footer remain visible.

### 10.6 Verification

- [ ] Expo public configuration resolves.
- [ ] Dependency tree contains no invalid top-level dependency.
- [ ] Android export/bundle smoke test passes.
- [ ] Navigation is manually verified on a representative native platform.
- [ ] `git diff --check` passes.
- [ ] No secret, live URL, generated output, or unrelated change is included.

## 11. Feature Definition of Done

- [ ] Every in-scope route/layout and session boundary is implemented.
- [ ] Every acceptance criterion has current evidence or an explicitly recorded manual-test limitation.
- [ ] Later Account and Courier business behavior remains clearly out of scope and unclaimed.
- [ ] Relevant M13 regression behavior passes.
- [ ] Code and this specification match the same final implementation.
- [ ] The final diff contains no debug code, dead code, stale comments, or accidental generated files.

## 12. Notes for AI tools

- Claude will be the AI tool running and implementing this specification.
- Claude must read `ai/M14/ai-spec.md` first, then this feature specification, before changing project files.
- Claude must treat this document as the complete feature contract and must not depend on ignored `.omi/` planning files during implementation.
- Read `client/AGENTS.md` and current Expo SDK 54 Router documentation before client changes.
- Extend the existing M13 navigation; do not replace working layouts wholesale.
- Keep authentication and role identity in shared context/storage, never route parameters.
- Treat the generic `feature-name.feature.md` as an ignored drafting template, not an implementation authority.
- Do not mark manual iOS/Android behavior complete from static inspection alone.
- Do not implement account or courier API behavior while creating navigation placeholders.
