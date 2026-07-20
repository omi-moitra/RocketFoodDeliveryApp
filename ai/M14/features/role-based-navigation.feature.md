# AI Feature Specification — Role-Based Navigation

> Defines the graded login redirection and Account Selection behavior for customer-only, courier-only, and dual-role users. Use this document together with `ai/M14/ai-spec.md` and `ai/M14/features/navigation-structure.feature.md`.

> **Implementation owner:** Claude will run and implement this specification. Because the Navigation Structure feature already established the role-capable session and guarded route trees, Claude must audit the current implementation first and change only behavior that does not satisfy this contract. Do not rewrite passing navigation merely to recreate the feature.

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

- **Feature name:** Role-Based Login Redirection and Account Selection
- **Related area:** Mobile authentication, session persistence, authorization-aware routing
- **Specification file:** `ai/M14/features/role-based-navigation.feature.md`
- **Implementation branch:** `feature/m14-role-based-navigation`
- **Grading requirements:** Customer redirection, Courier redirection, dual-account redirection, Customer choice, and Courier choice
- **Dependency:** The completed Navigation Structure feature supplies the root guards and Customer/Courier route trees.
- **Claude deliverable:** Verified behavior for all three login role combinations and both dual-role choices, with only evidence-driven gap fixes.
- **Completion evidence:** Login/API contract evidence, stored-session inspection, named manual scenarios, regression checks, and the final diff.

## 2. Feature goal

Ensure that a successful login always opens the one correct experience allowed by the authenticated account:

- A customer-only user goes directly to the Customer application.
- A courier-only user goes directly to the Courier application.
- A dual-role user goes to Account Selection and enters only the role application they explicitly choose.

Claude must preserve the completed M13 login form, validation, request safety, logout, and Customer journey. This feature owns role decision behavior; it does not own navigator construction, Account data, Courier deliveries, or unrelated screen design.

## 3. Feature scope

### 3.1 In scope

- Audit the merged Navigation Structure implementation before editing.
- Verify and, only when necessary, correct mapping of `user_id`, `customer_id`, and `courier_id` from successful login responses.
- Accept customer-only, courier-only, and dual-role accounts.
- Reject a successful authentication response that contains neither a Customer nor Courier role.
- Derive the only role for single-role users without showing Account Selection.
- Leave a dual-role session unselected until the user chooses Customer or Courier.
- Persist the active role before exposing its protected route tree.
- Route a Customer choice to Customer tabs.
- Route a Courier choice to Courier tabs.
- Prevent invalid/stale role choices and direct navigation into the wrong role tree.
- Prevent duplicate login and role-selection writes.
- Restore valid single-role and selected dual-role sessions after app restart.
- Reject and clear incomplete, corrupt, or contradictory session state.
- Preserve global logout/session-expiry behavior across both roles.
- Keep user-safe loading and failure feedback during authentication and role selection.
- Verify the behavior on representative iOS and Android runtimes when available.
- Reconcile this specification and the global authoring status with verified final behavior.

Claude may modify only these files when current evidence shows a requirement gap:

- `client/app/index.js`
- `client/app/selection.js`
- `client/app/_layout.js` only for a demonstrated role-guard defect
- `client/contexts/AuthContext.js`
- `client/storage/authStorage.js`
- `client/services/authService.js`
- Existing shared validation/error helpers only when the current owner cannot express a required role rule
- This specification and `ai/M14/ai-spec.md` when verified final reality changes them

Claude must inspect but should not modify unless a failing role-isolation criterion proves it necessary:

- `client/app/customer/_layout.js`
- `client/app/courier/_layout.js`
- `client/components/AppHeader.js`
- `client/services/apiClient.js`
- `ai/M13/features/login-page.feature.md`
- `ai/M14/features/navigation-structure.feature.md`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/controller/api/AuthApiController.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/auth/AuthResponseSuccessDTO.java`

### 3.2 Out of scope

- Rebuilding the Root Stack, Customer Tabs, Courier Tabs, or Restaurant Stack.
- Adding new routes, footer tabs, navigators, or role types.
- Account contact retrieval/editing; see `account-details.feature.md`.
- Courier delivery retrieval, assignment, status changes, or details; see `courier-delivery.feature.md`.
- Order notification behavior; see `order-confirmation-modal.feature.md`.
- Final cross-app styling or unrelated Account Selection visual changes; see `ui.feature.md`.
- Switching roles from inside an already selected role application.
- Employee or restaurant-owner mobile access.
- Backend authentication changes or new endpoints.
- Password storage, token-in-route behavior, or role derivation from an email/address/hard-coded ID.
- Dependency changes, broad refactors, formatting sweeps, or unrelated comment changes.
- Editing private `.omi/` source material, supplied PDFs, the generic feature template, live `.env`, or generated output.

## 4. Requirements breakdown

### 4.1 Requirement A — Role-capable authentication response

- Continue using `POST /api/auth` with email and password.
- A successful response must contain `success: true`, a nonblank `accessToken`, and a positive `user_id`.
- `customer_id` and `courier_id` are independently optional; at least one must be a positive identifier.
- Accept positive integer IDs returned as JSON numbers or numeric strings.
- Normalize a missing, null, blank, zero, negative, fractional, nonnumeric, or unsafe role ID to unavailable.
- Reject a successful response with neither supported role using a stable, user-safe account-access error.
- Invalid credentials remain a credential failure and must not create or mutate a session.
- Raw backend details, passwords, and tokens must not appear in errors or logs.

### 4.2 Requirement B — Customer-only redirection

- A valid response with `customer_id` and no usable `courier_id` is a customer-only session.
- Persist the token, user ID, customer ID, and `activeRole = customer`.
- Remove any courier ID or prior active-role value left by another login before exposing Customer.
- Root guards must bypass Account Selection and expose Customer tabs directly.
- Restaurants remains the initial Customer destination established by Navigation Structure.
- Back navigation must not return to Login or Account Selection.

### 4.3 Requirement C — Courier-only redirection

- A valid response with `courier_id` and no usable `customer_id` is a courier-only session.
- Persist the token, user ID, courier ID, and `activeRole = courier`.
- Remove any customer ID or prior active-role value left by another login before exposing Courier.
- Root guards must bypass Account Selection and expose Courier tabs directly.
- Order Delivery remains the initial Courier destination established by Navigation Structure.
- Back navigation must not return to Login or Account Selection.

### 4.4 Requirement D — Dual-role redirection

- A valid response with both `customer_id` and `courier_id` is a dual-role session.
- Persist the token, user ID, and both role IDs.
- Clear any active role left by a previous session or login.
- Keep `activeRole = null` until the user makes an explicit selection.
- Root guards must expose Account Selection and neither role application.
- The app must not select a remembered default role for a new dual-role login.
- Direct Customer/Courier route attempts remain blocked while the choice is pending.

### 4.5 Requirement E — Customer option

- The Customer control is visible only on a valid dual-role Account Selection session.
- Selecting Customer calls the shared context action with the exact role `customer`.
- The storage layer confirms that `customerId` exists before persisting the choice.
- Await the role write before setting in-memory `activeRole` or exposing Customer.
- On success, the root guard removes Account Selection and opens Customer tabs.
- A failed write keeps Account Selection visible, leaves both role trees closed, and shows retryable feedback.
- Repeated taps while the write is pending must not produce additional writes or navigation.

### 4.6 Requirement F — Courier option

- The Courier control is visible only on a valid dual-role Account Selection session.
- Selecting Courier calls the shared context action with the exact role `courier`.
- The storage layer confirms that `courierId` exists before persisting the choice.
- Await the role write before setting in-memory `activeRole` or exposing Courier.
- On success, the root guard removes Account Selection and opens Courier tabs.
- A failed write keeps Account Selection visible, leaves both role trees closed, and shows retryable feedback.
- Repeated taps while the write is pending must not produce additional writes or navigation.

### 4.7 Requirement G — Restore, logout, and invalid state

- Restore a session only after reading all token, user, role-ID, and active-role keys as one coherent state.
- A restored Customer active role requires a customer ID.
- A restored Courier active role requires a courier ID.
- No active role is valid only when both role IDs exist and Account Selection is pending.
- A single-role session with no matching active role is incomplete and must fail closed.
- An unknown role string or an active role without its matching ID is corrupt state.
- Clear partial/corrupt stored values and expose Login rather than repairing them by guessing.
- Logout and protected-request session failure clear every session/role key before closing the protected route tree.
- After logout or invalidation, back behavior cannot reopen Account Selection, Customer, or Courier.

### 4.8 Requirement H — Existing implementation audit

The Navigation Structure feature already introduced role-aware authentication, storage, selection, and guards. Claude must begin this feature by mapping each requirement above to the current code:

- Keep a behavior unchanged when code inspection plus verification proves it passes.
- Make a focused correction only for a failed or unprovable requirement.
- Do not rename established functions or reorganize files merely to make this feature look newly implemented.
- Treat current code as evidence, not proof of runtime success.
- Leave manual criteria unchecked until the corresponding scenario is actually exercised.

## 5. User flow and navigation logic

### 5.1 Customer-only login

1. The user submits valid credentials once.
2. The API returns token, user ID, and customer ID without a usable courier ID.
3. The service normalizes the response into a customer-only session candidate.
4. AuthContext asks storage to persist it.
5. Storage clears stale keys, saves the new values, and derives `activeRole = customer`.
6. AuthContext publishes the saved session.
7. Root guards expose Customer tabs directly on Restaurants.

### 5.2 Courier-only login

1. The user submits valid credentials once.
2. The API returns token, user ID, and courier ID without a usable customer ID.
3. The service normalizes the response into a courier-only session candidate.
4. AuthContext asks storage to persist it.
5. Storage clears stale keys, saves the new values, and derives `activeRole = courier`.
6. AuthContext publishes the saved session.
7. Root guards expose Courier tabs directly on Order Delivery.

### 5.3 Dual-role login

1. The user submits valid credentials once.
2. The API returns token, user ID, customer ID, and courier ID.
3. The service normalizes the response into a dual-role session candidate.
4. Storage clears stale keys, saves both role IDs, and leaves `activeRole` unset.
5. AuthContext publishes the pending-selection session.
6. Root guards expose Account Selection only.

### 5.4 Dual-role Customer choice

1. The user presses Customer once.
2. Account Selection locks both controls and invokes the shared role action.
3. Storage revalidates the session and confirms the customer role exists.
4. Storage persists `activeRole = customer`.
5. AuthContext publishes the updated session.
6. Root guards expose Customer tabs and remove Account Selection.

### 5.5 Dual-role Courier choice

1. The user presses Courier once.
2. Account Selection locks both controls and invokes the shared role action.
3. Storage revalidates the session and confirms the courier role exists.
4. Storage persists `activeRole = courier`.
5. AuthContext publishes the updated session.
6. Root guards expose Courier tabs and remove Account Selection.

### 5.6 Failure and recovery

1. Invalid credentials or a malformed/no-role success response leaves Login visible with a safe error.
2. A login-storage failure clears any partial new session and leaves Login available for retry.
3. A role-selection storage failure leaves Account Selection and its current dual-role identity intact for retry.
4. Corrupt restored storage is cleared and resolves to Login.
5. Logout/session expiry clears the session and returns to Login without a protected back path.

## 6. Interfaces

### 6.1 Route and screen files

| File | Interface | Role-based responsibility |
| --- | --- | --- |
| `client/app/index.js` | Login | Submits once, persists the verified session, and lets root guards choose the destination. |
| `client/app/selection.js` | Account Selection | Accepts one explicit Customer/Courier choice with pending/error behavior. |
| `client/app/_layout.js` | Root guards | Exposes Login, Selection, Customer, or Courier from validated session state. |
| `client/app/customer/_layout.js` | Customer boundary | Rejects a missing/wrong active role and exposes Customer destinations only. |
| `client/app/courier/_layout.js` | Courier boundary | Rejects a missing/wrong active role and exposes Courier destinations only. |

### 6.2 Shared modules

| File | Responsibility |
| --- | --- |
| `client/services/authService.js` | Validates the untrusted login response and maps optional role IDs. |
| `client/storage/authStorage.js` | Owns keys, normalization, role derivation, persistence, restoration, selection, and clearing. |
| `client/contexts/AuthContext.js` | Coordinates saved session transitions and exposes `completeSignIn`, `selectRole`, logout, and unauthorized handling. |
| `client/services/apiClient.js` | Supplies the shared request/error boundary without owning role decisions. |

### 6.3 Backend/API

This feature uses one existing public endpoint:

```text
POST /api/auth
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Successful fields consumed by the client:

```text
success
accessToken
user_id
customer_id (optional)
courier_id (optional)
```

Current Java evidence: `AuthApiController` sets both optional role IDs independently, and `AuthResponseSuccessDTO` exposes them as nullable integers. Before claiming all three scenarios pass, Claude must verify representative customer-only, courier-only, and dual-role responses through Postman or the running app when suitable credentials/data are available.

### 6.4 Storage

Canonical keys:

```text
rocketFood.accessToken
rocketFood.userId
rocketFood.customerId
rocketFood.courierId
rocketFood.activeRole
```

Only `authStorage.js` reads or writes these raw keys. Screens and layouts consume the validated session through AuthContext.

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

### 7.2 Valid session combinations

| Customer ID | Courier ID | Active role | Meaning | Destination |
| --- | --- | --- | --- | --- |
| Present | Missing | `customer` | Customer-only | Customer |
| Missing | Present | `courier` | Courier-only | Courier |
| Present | Present | `null` | Dual-role awaiting choice | Account Selection |
| Present | Present | `customer` | Dual-role chose Customer | Customer |
| Present | Present | `courier` | Dual-role chose Courier | Courier |

Every other role/ID combination is invalid and fails closed.

### 7.3 Authentication request state

| State | Visible behavior | Allowed event |
| --- | --- | --- |
| `idle` | Login enabled | Submit valid form |
| `submitting` | Button busy/disabled | Abort on unmount only |
| `success` | Busy presentation remains while root tree changes | Root guard transition |
| `error` | Safe inline error and enabled retry | Correct/retry submission |

### 7.4 Role-selection state

| State | Visible behavior | Allowed event |
| --- | --- | --- |
| `idle` | Both choices enabled | Choose one role |
| `selecting` | Both choices disabled; progress visible | Await the one storage write |
| `error` | Safe error; both choices enabled | Retry either valid role |

### 7.5 Validation and security rules

- Never store the password.
- Never log the access token, password, full login response, or reviewer credentials.
- Do not put identity or token values in route parameters.
- Do not derive roles from route names, email addresses, UI labels, or hard-coded test users.
- Do not expose a protected tree before its session write succeeds.
- Do not repair contradictory storage by choosing a role.
- Do not allow one user's stale role ID or choice to survive a later login.
- Do not show raw storage, network, stack-trace, or backend errors to the user.

## 8. Expected behavior

- Exactly one valid root destination is exposed after session resolution.
- Customer-only and courier-only users never see Account Selection.
- A dual-role user always sees Account Selection after a fresh login.
- Account Selection never silently preselects a role.
- Each selection opens the matching application and never the other one.
- Customer and Courier route trees cannot be active simultaneously.
- Restart restores the same valid role destination after a completed selection.
- A fresh dual-role login does not inherit an earlier dual-role choice.
- Invalid credentials, no-role responses, corrupt storage, and failed writes never open protected content.
- Existing Customer login, logout, restaurants, menus, order creation, and order history remain functional.
- The UI never presents a successful navigation state before persistence succeeds.

## 9. Technical constraints

- Claude must read `ai/M14/ai-spec.md`, this full specification, `client/AGENTS.md`, `client/CLAUDE.md`, and the Navigation Structure spec before changing client files.
- Use the installed Expo SDK 54 and Expo Router 6 protected-route pattern already present in the root layout.
- Use the existing React Context and AsyncStorage architecture; add no state or navigation dependency.
- Preserve JavaScript and established naming, purpose headers, accessibility, theme, error, and comment conventions.
- Keep backend snake_case field names at the service boundary and client session names camelCase.
- Await every persistence operation that changes route eligibility.
- Keep role decisions centralized; screens must not duplicate storage validation.
- Preserve unrelated worktree changes and completed M13 behavior.
- Do not modify the Java backend for this feature.
- Do not claim native back, restart, or persistence behavior from static inspection/export alone.

## 10. Acceptance criteria

### 10.1 Authentication contract

- [x] Valid credentials with at least one supported role produce a normalized session candidate. (`authenticateUser` returns `{accessToken, userId, customerId, courierId}` with each role ID mapped only when `isUsableIdentifier`.)
- [x] Invalid credentials remain on Login with the existing credential error. (`response.status === 401 || data?.success === false` → `credentials` error; `index.js` sets `error` state and stays on Login.)
- [x] Missing/invalid token or user ID is rejected as a malformed response. (Nonblank `accessToken` and `isUsableIdentifier(user_id)` are each enforced with the `response` error before any mapping.)
- [x] A success response with neither usable role ID is rejected safely. (When both mapped IDs are null → `accountAccess` error, thrown before persistence.)
- [x] No rejected response mutates stored or in-memory session state. (Every rejection throws inside `authenticateUser`, before `completeSignIn`/`saveAuthSession` runs.)

Evidence: `authService.js` inspection above; `AuthApiController`/`AuthResponseSuccessDTO` confirm nullable `customer_id`/`courier_id`. Live Postman confirmation of representative customer-only/courier-only/dual responses remains **pending backend runtime** (see seed-account note in the implementation log).

### 10.2 Customer-only scenario

- [ ] Customer-only login routes directly to Customer without showing Account Selection. (Guard `isCustomerActive` is code-correct; on-device routing **pending native run**.)
- [x] The saved session contains customer ID and `activeRole = customer` with no stale courier ID. (`saveAuthSession` calls `multiRemove(ALL_AUTH_STORAGE_KEYS)` then writes only `accessToken`, `userId`, `customerId`, and derived `activeRole = customer`; no courier key is written.)
- [ ] Restaurants is the initial Customer destination. (`unstable_settings.initialRouteName = 'restaurant'`; **pending native run**.)
- [ ] Back cannot return to Login or Account Selection. (`Stack.Protected` replacement; **pending native back test**.)
- [ ] Restart restores Customer directly. (`resolveRestoredActiveRole('customer', customerId, null) → 'customer'`; **pending native restart test**.)

Evidence: session-shape code above. Confirmed customer-only account run, restart, and platform back remain **pending native run**.

### 10.3 Courier-only scenario

- [ ] Courier-only login routes directly to Courier without showing Account Selection. (Guard `isCourierActive` is code-correct; on-device routing **pending native run**.)
- [x] The saved session contains courier ID and `activeRole = courier` with no stale customer ID. (`saveAuthSession` clears all keys then writes only `accessToken`, `userId`, `courierId`, and derived `activeRole = courier`; no customer key is written.)
- [ ] Order Delivery is the initial Courier destination. (`unstable_settings.initialRouteName = 'index'`; **pending native run**.)
- [ ] Back cannot return to Login or Account Selection. (`Stack.Protected` replacement; **pending native back test**.)
- [ ] Restart restores Courier directly. (`resolveRestoredActiveRole('courier', null, courierId) → 'courier'`; **pending native restart test**.)

Evidence: session-shape code above. Confirmed courier-only account run, restart, and platform back remain **pending native run** (see seed-account note in the implementation log).

### 10.4 Dual-role redirection

- [ ] Dual-role login opens Account Selection and neither role application. (Guard `isDualRolePending` is code-correct; on-device routing **pending native run**.)
- [x] Both role IDs are retained while `activeRole` is null. (`deriveInitialActiveRole` returns null when both IDs are present, and both keys are written; no `activeRole` key is set.)
- [x] A previous user's active role is not inherited. (`saveAuthSession` clears every key before writing, so no prior `activeRole` survives a new login.)
- [ ] Direct Customer/Courier navigation is blocked before selection. (Root guards expose only `selection`; **pending native direct-route test**.)
- [ ] Restart before selection returns to Account Selection. (`resolveRestoredActiveRole(null, customerId, courierId) → null`; **pending native restart test**.)

Evidence: derivation/clear code above. Confirmed dual-role account fresh login, direct-route attempts, and restart remain **pending native run**.

### 10.5 Customer option

- [ ] Customer is selectable from Account Selection. (Control rendered in `selection.js`; on-device render **pending native run**.)
- [x] One pending write disables both role controls and blocks duplicate taps. (`submissionLockRef` short-circuits re-entry and `disabled={isSelecting}` disables both `Pressable`s during the write.)
- [ ] Successful persistence opens Customer and removes Selection. (Root guard swaps on `activeRole = customer`; **pending native run**.)
- [ ] Restart restores the dual-role session in Customer mode. (`resolveRestoredActiveRole('customer', customerId, courierId) → 'customer'`; **pending native restart test**.)
- [x] A failed selection write leaves Account Selection available with retry feedback. (`catch` restores `idle` state, releases the lock, and shows the `SELECTION_ERROR` alert; no navigation occurs.)

Evidence: `selection.js`/`saveRoleSelection` code above. Customer choice, duplicate tap, restart, and observed storage-failure remain **pending native run**.

### 10.6 Courier option

- [ ] Courier is selectable from Account Selection. (Control rendered in `selection.js`; on-device render **pending native run**.)
- [x] One pending write disables both role controls and blocks duplicate taps. (Same `submissionLockRef` + `disabled={isSelecting}` guard applies to the Courier `Pressable`.)
- [ ] Successful persistence opens Courier and removes Selection. (Root guard swaps on `activeRole = courier`; **pending native run**.)
- [ ] Restart restores the dual-role session in Courier mode. (`resolveRestoredActiveRole('courier', customerId, courierId) → 'courier'`; **pending native restart test**.)
- [x] A failed selection write leaves Account Selection available with retry feedback. (`catch` restores `idle`, releases the lock, and shows the alert without navigating.)

Evidence: `selection.js`/`saveRoleSelection` code above. Courier choice, duplicate tap, restart, and observed storage-failure remain **pending native run**.

### 10.7 Invalid state, logout, and regression

- [x] Unknown active role, missing matching role ID, and incomplete single-role state fail closed. (`normalizeStoredRole` rejects unknown strings; `resolveRestoredActiveRole` returns the `INVALID_SESSION` sentinel for a role without its ID and for a single-role record with no active role, so `getStoredSession` returns null.)
- [x] Corrupt/partial stored values are cleared rather than guessed. (`getStoredSession` calls `clearAuthSession` when a value exists but the session is unusable; no role is inferred.)
- [x] Logout clears every session key from either role application. (`clearAuthSession` → `multiRemove(ALL_AUTH_STORAGE_KEYS)` covering all five keys; used by `signOut` and `handleUnauthorized`.)
- [ ] Session expiry returns either role to Login without protected back access. (`handleUnauthorized` clears storage and nulls the session; **pending native back test**.)
- [ ] Existing M13 Customer login and customer journey do not regress. (No customer-path code changed; **pending M13 smoke test on device**.)

Evidence: storage/context code above. Both-role logout, unauthorized-back, and M13 smoke test remain **pending native run**.

### 10.8 Repository and platform verification

- [x] `git diff --check` passes. (No whitespace/conflict errors.)
- [x] `npm ls --depth=0` reports no invalid top-level dependency. (Clean tree.)
- [x] `npx expo config --type public` succeeds without exposing secrets. (EXIT 0; no secret keys in output.)
- [x] Android export/bundle smoke test passes. (`npx expo export --platform android` → EXIT 0.)
- [ ] Customer-only, courier-only, and both dual-role choices are manually verified on a native runtime. (**Pending native run** — no simulator/device/backend in this environment.)
- [ ] Representative iOS and Android back/restart behavior is verified. (**Pending native run**.)
- [x] No live URL, secret, generated output, private log, or unrelated change is staged. (Working tree holds only spec edits; `dist/` removed; `.omi/` is gitignored and untracked.)

Claude must record exact commands and results. Manual/native criteria remain unchecked until exercised; code inspection and export are not substitutes.

## 11. Feature Definition of Done

- [ ] Every graded role-based navigation scenario and option has current evidence. (Static/code evidence complete for each; the graded **routing outcomes** still need a native run — see the pending items in 10.2–10.6.)
- [x] Existing passing Navigation Structure code was preserved unless a demonstrated gap required correction. (Audit found no gap; zero client code changed for this feature.)
- [x] Any correction stays within Section 3.1 and is tied to a failed acceptance criterion. (No corrections were made; vacuously satisfied.)
- [x] Session validation, persistence, selection, restore, logout, and invalid-state behavior agree across service, storage, context, and guards. (Cross-checked `authService` → `authStorage` → `AuthContext` → root/tab guards; shapes and role rules are consistent.)
- [ ] Customer and Courier identities/routes never leak into each other. (Guards are code-correct; runtime isolation **pending native run**.)
- [ ] M13 Customer authentication and journey regression checks pass. (**Pending native run**; no customer-path code changed.)
- [x] This specification matches final verified behavior and contains no unsupported completion claims. (Only code/automated-verified rows are checked; every runtime row is marked pending.)
- [x] The final diff has no dead code, debug output, stale comments, generated artifacts, or unrelated edits. (This feature changed only spec files plus the gitignored log.)
- [x] Claude's handoff reports changed files, contract decisions, exact verification, manual gaps, and the implementation-log update required by the global spec. (See session handoff.)
- [x] Claude provides a narrowly scoped staging command followed by a copy-ready Conventional Commit command without staging or committing unless explicitly authorized. (Provided in handoff; nothing staged/committed.)

## 12. Notes for AI tools

- Claude is the implementation and verification agent for this specification.
- Read the global spec first, this entire feature spec second, and the completed Navigation Structure spec third.
- Begin with `git status --short`, `rg --files`, targeted role/session caller searches, and inspection of every allowed file.
- The navigation implementation is already merged; audit it before making any implementation edit.
- Do not create artificial code changes when the existing behavior satisfies a requirement. Verification and honest unchecked manual criteria are valid outcomes.
- Keep Navigation Structure responsible for navigator construction; this feature owns observable role-routing behavior and corrective changes only.
- Do not implement Account, Courier Delivery, notification, or unrelated UI behavior.
- Do not use ignored `.omi/` material as an implementation dependency.
- If representative credentials or runtime access are unavailable, complete safe static checks and report the exact manual scenarios still required.
- If a required fix falls outside Section 3.1, stop and explain the file, evidence, and scope impact before expanding the change.
- After implementation or a material follow-up, append the required dated handoff to `.omi/m14/IMPLEMENTATION_LOG.md`; never stage that private log.
- Finish with outcome first, changed files, exact checks/results, manual gaps, the scoped staging command, and a copy-ready commit command.
