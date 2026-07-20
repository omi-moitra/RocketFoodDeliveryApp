# AI Feature Specification — Navigation Structure

> Defines the combined Module 14 Expo Router hierarchy. Use this document together with `ai/M14/ai-spec.md` and the retained M13 navigation specification at `ai/M13/features/navigation-structure.feature.md`.

> **Implementation owner:** Claude will run and implement this specification. Claude must treat it as an executable prompt: inspect before editing, stay inside the allowed file boundary, stop at unresolved decision gates, verify every claimed criterion, and never depend on private `.omi/` files.

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
- **Claude deliverable:** A verified navigation skeleton and role-capable session boundary; later Account and Courier business screens remain honest placeholders.
- **Completion evidence:** Current diff, Expo/dependency/export checks, and named manual navigation scenarios. File existence alone is insufficient.

## 2. Feature goal

Claude must extend the working M13 customer navigation in place into a protected, role-aware structure. After implementation, exactly one valid root branch is exposed for any resolved session: Login, Account Selection, Customer, or Courier. The existing Restaurant List → Restaurant Menu stack must continue working unchanged from the user's perspective.

The concrete output is route files, navigator ownership, authenticated guards, role/session persistence, and clearly labeled placeholder destinations. Claude must not simulate completed Account or Delivery features. Later feature specifications own their final UI, validation, requests, mutations, and acceptance evidence.

## 3. Feature scope

### 3.1 In scope

- Before editing, Claude must inspect all existing files named below plus their imports/callers. A listed target that already exists must be extended rather than recreated.
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
- Update this feature specification only when verified implementation details require reconciliation.

Claude may modify or create only these implementation surfaces unless it first records why an additional shared owner is necessary:

- The route/layout interfaces in Section 6.1; `client/app/customer/restaurant/_layout.js` may change only if required to preserve the documented stack.
- `client/contexts/AuthContext.js`
- `client/storage/authStorage.js`
- `client/services/authService.js`
- Existing shared icon/theme/header components only when the new navigators require a reusable addition
- This feature specification and the global spec only when final reality changes them

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
- Account, courier-delivery, order-notification, restaurant, order-history, or backend service behavior not required to establish navigation.
- Dependency upgrades, formatting sweeps, broad comment rewrites, or unrelated refactors.
- Editing `feature-name.feature.md`, private `.omi/` materials, supplied PDFs, live `.env`, generated output, or unrelated user changes.

## 4. Requirements breakdown

### 4.1 Requirement A — Root Stack with authentication flow

- Claude must keep `client/app/_layout.js` as the only root Expo Router Stack; do not introduce a second navigation container.
- It must not render protected content until fonts and stored-session restoration finish.
- Login is available only without a usable session.
- Account Selection is available only to a usable dual-role session with no selected active role.
- Customer is available only when `activeRole` is `customer` and a customer ID exists.
- Courier is available only when `activeRole` is `courier` and a courier ID exists.
- Root navigator headers remain hidden because authenticated role layouts supply the shared header.
- Protected routes must close immediately when their guard becomes false. Follow the existing Expo Router 6 `Stack.Protected` pattern already used in `client/app/_layout.js`; extend that established root guard rather than introducing a competing navigation mechanism.
- Preserve existing font loading, safe-area provider, error boundary, status bar, and neutral loading behavior.

### 4.2 Requirement B — Role Selection screen route

- Create `client/app/selection.js`.
- It must provide explicit Customer and Courier choices.
- It must not infer a choice for a dual-role user.
- Selecting a role must call the shared AuthContext action, await persistence, and let the root guard expose the matching tree. The screen must not push a protected route before storage succeeds.
- Invalid, unavailable, or stale role choices must fail safely without opening the wrong app.
- This route is not a tab in either role app.
- Match the supplied Account Selection wireframe: this root destination shows neither the role-app logo/logout header nor a Customer/Courier footer. Role-specific chrome begins only after a role choice opens its matching tab tree.
- While persistence is pending, disable both choices and ignore duplicate taps. On storage failure, keep Selection visible and provide retryable, user-safe feedback.

### 4.3 Requirement C — Customer Tabs

- `client/app/customer/_layout.js` remains a Tabs navigator.
- Its visible tabs are Restaurants, Order History, and Account.
- Restaurants remains the initial tab.
- The shared header is visible on all Customer tab destinations.
- Customer routes reject a missing session, the wrong active role, or a missing customer ID.
- No route file may appear as an unintended extra tab.
- Reuse the existing tab styles/icon wrapper; add only the Account icon/registration needed by this feature.

### 4.4 Requirement D — Courier Tabs

- Create `client/app/courier/_layout.js` as a Tabs navigator.
- Its visible tabs are Order Delivery and Account.
- Order Delivery is the initial tab.
- The shared header is visible on both Courier destinations.
- Courier routes reject a missing session, the wrong active role, or a missing courier ID.
- No Customer route appears in Courier tabs.
- Match Customer layout conventions for shared header, tab accessibility labels, active indicator, typography, safe areas, and keyboard behavior.

### 4.5 Requirement E — Nested Restaurant Stack

- Preserve `client/app/customer/restaurant/_layout.js` as a Stack inside Customer Tabs.
- Preserve `restaurant/index.js` as Restaurant List.
- Preserve `restaurant/[restaurantId].js` as Restaurant Menu.
- Restaurant Menu remains inside the Restaurants tab, retaining its footer.
- Only the public restaurant ID travels through the route.
- Back returns Menu to Restaurant List, not Login or Account Selection.
- Existing filter preservation and per-restaurant quantity reset behavior must not regress.

### 4.6 Requirement F — Session and role persistence

This section is the canonical session-lifecycle contract for this feature. Section 7 defines its data shape and validation without replacing these persistence rules.

- Persist `accessToken`, `userId`, optional `customerId`, optional `courierId`, and selected/derived `activeRole`.
- A usable session requires a token, user ID, and at least one supported role ID.
- A single-role login derives and persists its only valid active role.
- A dual-role login initially stores no active role and requires Account Selection.
- A restored active role is accepted only when its matching role ID exists.
- Corrupt, partial, or unsupported stored state is logged out and cleared.
- Logout clears every authentication and role key.
- A new login must remove role IDs and active-role data belonging to the previous session before the new guarded tree becomes visible.
- Context exposes one role-selection action; route screens must not call AsyncStorage directly.
- Service normalization accepts positive numeric IDs returned as numbers or numeric strings and maps missing role IDs to null.

Existing customer-only gates that this feature must inspect and broaden without regressing Customer login:

- `client/services/authService.js`: `authenticateCustomer` currently rejects every otherwise successful response without `customer_id` and maps no `courierId`. Replace that customer-only boundary with role-capable authentication that accepts at least one supported role ID, maps both optional role IDs, and safely rejects a response with neither role.
- `client/storage/authStorage.js`: `getStoredSession` currently returns null without `customerId`, while `saveAuthSession` accepts no `courierId` or `activeRole`. Broaden storage to accept at least one supported role ID, persist the canonical active role, validate that it matches an available role, and keep the completed M13 customer-only path working.

### 4.7 Requirement G — Placeholder destination boundary

- Customer Account, Courier Order Delivery, and Courier Account routes may use clearly identified placeholder content during this feature.
- Placeholder routes must prove the correct header, footer, labels, active-role guard, safe area, and scrolling layout.
- They must not fake successful account or delivery API behavior.
- Later feature implementation must replace placeholder content without changing the required route hierarchy.
- Use one small reusable placeholder presentation when practical; do not copy the same layout into all three destination files.

## 5. User flow and navigation logic

### 5.1 Logged-out launch

1. Root providers load fonts and persisted storage.
2. No usable session resolves.
3. Root Stack exposes Login only.
4. Authenticated headers and tabs are absent.
5. A direct attempt to open Selection, Customer, or Courier fails closed through the root guard.

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
6. A storage failure leaves the user on Account Selection with both role trees closed.

Account Selection itself has no role-specific header or footer, matching the supplied wireframe; its successful choice opens the first destination where role-app chrome appears.

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

Claude must verify this table against the live repository before editing. “Create” means create only when absent; “preserve” means modify only if the active requirement cannot be met otherwise.

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

Implementation ownership rules:

- Layouts declare routes, guards, labels, and navigator presentation; they do not authenticate or persist directly.
- AuthContext coordinates in-memory transitions and calls storage helpers.
- `authStorage.js` owns raw keys, normalization, persistence, restoration, and clearing.
- `authService.js` owns validation/mapping of the untrusted login response.
- Route screens consume shared actions and render state; they do not duplicate service/storage rules.

### 6.4 Backend/API

This feature adds no endpoint. It consumes the existing login contract:

```text
POST /api/auth
```

Required successful response values are `accessToken`, `user_id`, optional `customer_id`, and optional `courier_id`. Later feature specs own account and delivery endpoints.

Before implementation, Claude must inspect the current `AuthApiController`/success DTO or verify a live response. If the login response does not provide the four values above with the documented optionality, Claude must stop the dependent session change and report the mismatch.

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

Use these centralized AsyncStorage keys unless the existing storage module has an equivalent established naming scheme:

```text
rocketFood.accessToken
rocketFood.userId
rocketFood.customerId
rocketFood.courierId
rocketFood.activeRole
```

Claude must update the complete-key collection used by logout/cleanup whenever it adds a key.

### 7.2 Session validation

- `accessToken` must be a nonblank string.
- `userId` must be a positive identifier.
- At least one of `customerId` or `courierId` must be a positive identifier.
- `activeRole = customer` requires `customerId`.
- `activeRole = courier` requires `courierId`.
- Both role IDs with no active role is a valid pending-selection state.
- A newly saved single-role session must include its derived `activeRole`; a restored single-role record without it is incomplete and is rejected/cleared rather than silently normalized at read time.
- Any other combination is rejected or cleared.
- Do not accept role names outside exact lowercase `customer` and `courier`.
- Do not accept zero, negative, fractional, blank, nonnumeric, or unsafe identifiers.
- Do not coerce the strings `null`, `undefined`, or `NaN` into usable data.

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
- Account Selection receives no token or role object through params; it reads the validated session from context.

## 8. Expected behavior

- Claude must implement these as observable outcomes, not merely matching code shapes.
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
- A failed persistence operation cannot leave the UI in one role while storage says another.
- Restarting the app reconstructs the same valid single-role or selected dual-role destination.

## 9. Technical constraints

- Before coding, Claude must read `client/AGENTS.md`, `client/CLAUDE.md`, `client/package.json`, and the current root/customer layouts that establish the project navigation conventions.
- Extend the installed Expo Router 6 JavaScript pattern: the existing root `Stack` with `Stack.Protected`, role-specific `Tabs`, and `Redirect` only where the established route flow needs it.
- Do not add a second navigation container.
- Use current `.js` route files; do not introduce TypeScript for this feature.
- Keep navigator-native headers hidden where `AppHeader` supplies the authenticated header.
- Keep tabs declared explicitly so placeholder/template routes do not appear automatically.
- Await authentication storage writes before changing in-memory guards.
- Preserve unrelated M13 files and behavior.
- Do not modify the Java backend.
- Do not add a new navigation or state-management dependency.
- Preserve JavaScript, existing formatting, purpose headers, semantic naming, accessibility labels, and established theme constants.
- Use `apply_patch`-style focused edits and preserve unrelated worktree changes.

## 10. Acceptance criteria

### 10.1 Required structure

- [x] Every interface in Section 6.1 exists with its stated responsibility, and the resulting hierarchy matches the single navigation tree in Section 6.2.

Evidence: `rg --files client/app` lists `_layout.js`, `index.js`, `selection.js`, `customer/{_layout,account,order-history}.js`, `customer/restaurant/{_layout,index,[restaurantId]}.js`, and `courier/{_layout,index,account}.js`; focused layout inspection; and `npx expo export --platform android` (EXIT 0) bundling every route without an import/resolution error.

### 10.2 Session and root guards

- [x] Startup waits for fonts and stored-session resolution. (`RootNavigator` renders the neutral loading view while `isSessionLoading || (!areFontsLoaded && !fontError)`; gate preserved from M13.)
- [ ] Logged-out/invalid storage exposes only Login. (Root guard `!session` is code-correct; on-device runtime exposure not yet exercised.)
- [ ] Customer-only storage exposes only Customer. (Guard `isCustomerActive` code-correct; runtime not yet exercised.)
- [ ] Courier-only storage exposes only Courier. (Guard `isCourierActive` code-correct; runtime not yet exercised.)
- [ ] Unselected dual-role storage exposes only Account Selection. (Guard `isDualRolePending` code-correct; runtime not yet exercised.)
- [ ] A selected dual-role session exposes only the selected role app. (Runtime not yet exercised.)
- [x] Logout/unauthorized handling clears every identity/role key. (`clearAuthSession` calls `AsyncStorage.multiRemove(ALL_AUTH_STORAGE_KEYS)`, and `ALL_AUTH_STORAGE_KEYS` is derived from the full `AUTH_STORAGE_KEYS` map — token, userId, customerId, courierId, activeRole.)
- [ ] Back navigation cannot reopen a closed protected tree. (Uses `Stack.Protected` replacement guards; native back behavior not yet exercised.)
- [x] Authentication accepts a valid courier-only response instead of enforcing the current customer-only gate, while customer-only login still works. (`authenticateUser` maps both optional role IDs and rejects only when neither is present; customer-only path unchanged in its returned `customerId`.)
- [x] Storage accepts either supported role ID, persists the derived/selected active role, and rejects a newly restored single-role record that lacks its required persisted active role. (`saveAuthSession` derives the active role for single-role logins; `resolveRestoredActiveRole` returns the `INVALID_SESSION` sentinel for a single-role record with no persisted active role, which `getStoredSession` clears and rejects.)

Evidence: storage/service helper inspection above. Named manual scenarios for fresh launch, restart, logout, direct route access, and platform back behavior remain **pending on-device execution** (no simulator/device run performed in this environment).

### 10.3 Account Selection

- [ ] Customer and Courier choices are both visible and accessible. (Rendered controls present in `selection.js`; on-device render not yet exercised.)
- [x] Each choice persists only a role available in the current session. (`saveRoleSelection` throws for a role whose ID is absent, and `selection.js` redirects when both IDs are not present.)
- [ ] A choice opens the matching role tabs. (Runtime not yet exercised.)
- [ ] Selection is unavailable to logged-out and single-role sessions. (Root `isDualRolePending` guard + `selection.js` redirect are code-correct; runtime not yet exercised.)
- [ ] Selection matches the supplied wireframe boundary with no role-app header or role-specific footer. (Structurally it is a root Stack screen with `headerShown:false` and no footer; wireframe-visual comparison against `support_materials_14/` still pending.)
- [x] Duplicate taps are safely ignored while persistence is pending. (`submissionLockRef` + `disabled={isSelecting}` block re-entry until a failure clears the lock.)

Evidence: shared `selectRole`/`saveRoleSelection` action inspected above. Manual exercise of both choices, a repeated tap, and an observed storage failure remain **pending on-device execution**.

### 10.4 Customer navigation

- [ ] Customer footer labels are Restaurants, Order History, and Account. (Tab titles set in `customer/_layout.js`; footer render not yet exercised on device.)
- [ ] Restaurants is initial. (`unstable_settings.initialRouteName = 'restaurant'`; runtime not yet exercised.)
- [ ] Each Customer tab resolves to the correct route. (Runtime not yet exercised.)
- [ ] Restaurant List → Menu → back behavior still works. (Restaurant Stack unchanged; runtime regression pass not yet exercised.)
- [ ] Header/footer and retained filter/quantity boundaries do not regress. (No changes to those files; runtime regression pass not yet exercised.)

Evidence: manual traversal of all Customer tabs, open/back from two restaurant menus, and existing list/menu state rules remain **pending on-device execution**.

### 10.5 Courier navigation

- [ ] Courier footer labels are Order Delivery and Account. (Tab titles set in `courier/_layout.js`; footer render not yet exercised on device.)
- [ ] Order Delivery is initial. (`unstable_settings.initialRouteName = 'index'`; runtime not yet exercised.)
- [ ] Each Courier tab resolves to the correct route. (Runtime not yet exercised.)
- [ ] Customer destinations do not appear in Courier tabs. (Only `index` and `account` are declared under `courier/`; runtime not yet exercised.)
- [ ] Shared header and Courier footer remain visible. (`courier/_layout.js` installs `AppHeader` and the tab bar; render not yet exercised.)

Evidence: manual traversal of both Courier tabs and direct Customer navigation while Courier is active remain **pending on-device execution**.

### 10.6 Verification

- [x] Expo public configuration resolves. (`npx expo config --type public` → EXIT 0.)
- [x] Dependency tree contains no invalid top-level dependency. (`npm ls --depth=0` → clean tree, no unmet/invalid entries.)
- [x] Android export/bundle smoke test passes. (`npx expo export --platform android` → EXIT 0; single Hermes bundle produced.)
- [ ] Navigation is manually verified on a representative native platform. (**Pending on-device execution** — no simulator/device available in this environment.)
- [x] `git diff --check` passes. (No whitespace/conflict errors.)
- [x] No secret, live URL, generated output, or unrelated change is included. (`git status --short` shows only the seven intended edits and four new route/component files; generated `dist/` removed.)

Claude must record exact commands and exit results. Manual iOS/Android items remain unchecked until actually exercised; a successful export does not prove touch, back, or persistence behavior.

## 11. Feature Definition of Done

- [x] Every in-scope route/layout and session boundary is implemented. (All Section 6.1 interfaces exist; session shape broadened to role-capable in storage/service/context.)
- [x] Every acceptance criterion has current evidence or an explicitly recorded manual-test limitation. (Automated/static criteria checked with evidence; every on-device criterion carries a "pending on-device execution" note.)
- [x] Later Account and Courier business behavior remains clearly out of scope and unclaimed. (Customer Account, Courier Order Delivery, and Courier Account render the shared honest `PlaceholderScreen`; no account/delivery API is called.)
- [ ] Relevant M13 regression behavior passes. (**Pending on-device execution** of the customer journey; code paths and export bundle unchanged for M13 screens.)
- [x] Code and this specification match the same final implementation.
- [x] The final diff contains no debug code, dead code, stale comments, or accidental generated files. (Generated `dist/` removed; no debug logs added.)
- [x] Claude's handoff identifies every changed file, check/result, unresolved manual item, and contract decision. (See handoff in the session response.)
- [x] Claude provides a narrowly scoped staging command followed by a copy-ready Conventional Commit command, but does not stage or commit without explicit user authorization. (Provided in the session handoff; no staging/commit performed.)

## 12. Notes for AI tools

- Claude will be the AI tool running and implementing this specification.
- Claude must read `ai/M14/ai-spec.md` first, this entire feature specification second, and applicable client instruction files third before changing project files.
- Claude must treat this document as the complete feature contract and must not depend on ignored `.omi/` planning files during implementation.
- Begin with `git status --short`, `rg --files`, targeted caller searches, and inspection of all allowed files. Preserve every unrelated change.
- Extend the existing M13 navigation; do not replace working layouts wholesale or reimplement completed screen behavior.
- Keep authentication and role identity in shared context/storage, never route parameters.
- Follow the two-pass specification guidance in the global spec before manual debugging. It is development guidance, not required grading evidence.
- Treat the generic `feature-name.feature.md` as an ignored drafting template, not an implementation authority.
- Do not mark manual iOS/Android behavior complete from static inspection alone.
- Do not implement account or courier API behavior while creating navigation placeholders.
- If a required edit falls outside Section 3.1, stop and explain the file, reason, and scope impact before expanding the change.
- If code evidence contradicts this spec, update neither silently: report the contradiction and ask for direction unless the global authority order resolves it.
- Finish with outcome first; changed files; exact automated/static checks; manual checks completed and remaining; then the scoped stage command and copy-ready commit command.
