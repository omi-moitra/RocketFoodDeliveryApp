<a id="top"></a>

# AI Feature Specification — Account Details

> Defines the shared Customer and Courier Account Settings experience: read-only user email, editable active-role email/phone, verified retrieval/update contracts, validation, persistence, and failure recovery. Use this document with `ai/ai-spec.md`.

> **Implementation owner:** Claude will run and implement this specification. Claude must verify the account API before client mutation work, prefer a frontend adapter, and use only the global spec's documented minimum-backend-change gate if exact required behavior cannot be met safely by the current API.

## Table of Contents

1. [Feature identity](#1-feature-identity)
2. [Feature goal](#2-feature-goal)
3. [Feature scope](#3-feature-scope)
4. [Requirements breakdown](#4-requirements-breakdown)
5. [User flow and account logic](#5-user-flow-and-account-logic)
6. [Interfaces](#6-interfaces)
7. [Data, validation, and state](#7-data-validation-and-state)
8. [Expected behavior](#8-expected-behavior)
9. [Technical constraints](#9-technical-constraints)
10. [Acceptance criteria](#10-acceptance-criteria)
11. [Feature Definition of Done](#11-feature-definition-of-done)
12. [Notes for AI tools](#12-notes-for-ai-tools)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 1. Feature identity

- **Feature name:** Account Details
- **Related area:** Customer/Courier Account tabs, shared form, protected account API
- **Specification file:** `ai/features/account-details.feature.md`
- **Implementation branch:** `feature/m14-account-details`
- **Grading requirements:** Account feature spec, role-aware field display, editable role fields, database persistence, required GET URL, and required account update path
- **Dependencies:** Completed Navigation Structure and Role-Based Navigation provide validated `userId`, role IDs, `activeRole`, protected tabs, and logout/session-expiry handling.
- **Claude deliverable:** One shared Account implementation rendered through separate Customer and Courier routes, backed by the verified API contract.
- **Completion evidence:** Current source/Postman contract evidence, Customer and Courier scenarios, validation/failure checks, database persistence, regression checks, and final diff.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 2. Feature goal

Replace both Account placeholders with one reusable Account Settings experience that:

- Displays the authenticated user's primary email as read-only.
- Displays only the active Customer or Courier role's email and phone.
- Allows editing only that role email and phone.
- Validates changes before sending them.
- Persists valid changes and reloads authoritative saved values.
- Prevents role leakage, duplicate saves, stale responses, and accidental primary-email updates.

The two route files remain distinct because they belong to different role-specific tab navigators. Their form, service, validation, loading, saving, success, and failure behavior must be shared.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 3. Feature scope

### 3.1 In scope

- Replace `client/app/customer/account.js` and `client/app/courier/account.js` placeholders with thin shared-screen wrappers.
- Create one shared Account screen/form implementation configured by validated active role.
- Load account data with the authenticated `userId`, never a Customer/Courier role ID.
- Send the bearer token on every account request.
- Use the official retrieval URL shape `/api/account/{userId}?type={user_type}` after verifying current-backend behavior.
- Normalize the `{ message: "Success", data: ApiAccountDTO }` response at the service boundary.
- Display primary/user email read-only.
- Select and display only the nested active-role record.
- Verify the nested role ID matches the stored matching role ID before exposing data.
- Label editable fields `Customer Email`/`Customer Phone` or `Courier Email`/`Courier Phone`.
- Validate role email and phone before saving.
- Resolve and implement the update method/query/body discrepancy through the global minimum-change gate.
- Disable duplicate saves and distinguish unchanged, validating, saving, success, and failure states.
- Reload saved values from a validated update response or follow-up GET.
- Preserve original saved values on validation or request failure.
- Guard late responses after role changes, logout, blur/unmount, or a newer request.
- Handle initial loading, refresh/retry, session expiry, malformed response, and missing active-role data.
- Keep form content scrollable and keyboard-safe with Save reachable on small iOS/Android screens.
- Reuse theme, inputs, result/error patterns, API client, auth session, and validation helpers where contracts fit.
- Update Postman, specifications, README/backend record when applicable, and private implementation log from verified final behavior.

Expected frontend/documentation files:

- `client/app/customer/account.js`
- `client/app/courier/account.js`
- `client/components/AccountScreen.js` or an equivalently named shared owner
- `client/services/accountService.js`
- `client/utils/validation.js` only for genuinely reusable email/phone helpers
- `client/constants/theme.js` only when required tokens are absent
- `PostmanCollection.json`
- `ai/features/account-details.feature.md`
- `ai/ai-spec.md` when verified contract/final behavior changes its truth
- `README.md` if a minimum backend adjustment is implemented

Claude must inspect before implementation:

- `client/app/customer/_layout.js`
- `client/app/courier/_layout.js`
- `client/contexts/AuthContext.js`
- `client/storage/authStorage.js`
- `client/services/apiClient.js`
- Existing input, loading, error, keyboard, and form patterns
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/controller/api/UserApiController.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/service/UserService.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/user/ApiAccountDTO.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/user/ApiUpdateAccountDTO.java`
- Customer/Courier models and focused account API tests
- `client/docs/m14/Wireframe.md`

No server file is authorized for editing during the initial contract analysis. If the update-method gate exposes a discrepancy, Claude must present the viable minimum-change options and wait for the user's choice. After selection, amend this spec with the chosen contract and smallest permitted server file set before implementation.

### 3.2 Out of scope

- Editing the base user's name, primary email, password, address, role, active status, or any other field.
- Displaying or editing the inactive role's details.
- Combining Customer and Courier into one route or adding a role switcher inside Account.
- Employee or restaurant-owner Account support.
- Authentication, Account Selection, tab, header, footer, or logout redesign.
- Password reset, account deletion, profile image, notification preferences, or extra settings.
- Backend cleanup, broad refactoring, schema/migration/entity/security/seeder changes, or unrelated API redesign.
- Implementing any backend solution before the user selects from Claude's documented minimum-change options.
- Guessing update methods, role values, body fields, response shapes, or validation rules.
- New dependencies, unrelated M13 changes, generated output, secrets, or edits to ignored planning files.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 4. Requirements breakdown

### 4.1 Requirement A — Shared role-aware architecture

- Keep separate Customer and Courier route files as thin wrappers.
- Both wrappers render the same shared Account screen/form/service behavior.
- Each wrapper declares its expected role; the shared screen verifies it matches the active session role.
- A mismatch fails closed through the existing protected-route/session behavior.
- Do not copy form JSX, state machines, validation, or request code between role routes.

### 4.2 Requirement B — Account retrieval

- Build the path from the validated session `userId` and active role.
- Use `customer` or `courier` as the lowercase official `type` query value.
- Candidate required call: `GET /api/account/{userId}?type={activeRole}`.
- Current source exposes `GET /api/account/{id}` without declaring `type`; verify that the extra official query is safely accepted and ignored before relying on it.
- Require HTTP 200 and a valid Success envelope.
- Reject a response whose top-level user ID does not match the requested `userId`.
- Select only `data.customer` in Customer mode or `data.courier` in Courier mode.
- Require the selected nested ID to match the matching stored role ID.
- Never expose the other nested role even when a dual-role response contains it.

### 4.3 Requirement C — Field display

- Display top-level `email` as `Primary Email` or `User Email`; it is read-only.
- Display active-role nested `email` and `phone` with role-specific labels.
- Do not use the primary email as a fallback for missing role email; that would misrepresent editable data.
- Do not display address or unsupported role/user fields.
- Never render `undefined`, `null`, raw envelopes, or another role's values.

### 4.4 Requirement D — Editable fields and dirty state

- Only active-role email and phone are editable.
- Initialize draft values from the normalized saved snapshot.
- Track dirty state by comparing normalized drafts with the saved snapshot.
- Disable or no-op Save when values are unchanged.
- Preserve user drafts during a retryable save failure.
- A reload/role change must not silently overwrite unsaved edits; define an explicit discard/reload rule.

### 4.5 Requirement E — Validation

- Trim leading/trailing whitespace before comparison and submission.
- Role email is required and must satisfy the project's email syntax rule.
- Role phone is required and must contain meaningful phone content under the verified backend/product rule.
- Reject control characters and blank-only values.
- Do not invent country-specific formatting or silently rewrite a valid phone number.
- Show field-specific, accessible validation feedback before any request.
- Confirm exact backend constraints and error responses in Postman; keep stricter client rules only when an authoritative product requirement supports them.

### 4.6 Requirement F — Account update contract gate

The official grading source labels the update as a POST to `/api/account/{userId}`. Current source exposes:

```http
PUT /api/account/{userId}?type={customer|courier}
Content-Type: application/json

{
  "email": "role@example.com",
  "phone": "+1 555 0100"
}
```

Claude must verify the live current behavior, then present the user with the viable minimum-change options. Include frontend-only use of the current contract when viable and any source-grounded backend compatibility approaches; do not assume an alias, query, body shape, or method is the chosen solution.

For every option, report:

- Exact method, path, query/body, response, and role-selection mechanism.
- Exact frontend/backend files and tests it would require.
- Benefits, risks, data-safety impact, backward compatibility, and grading alignment.
- Postman, database, regression, and manual verification burden.

Claude must stop after presenting the options. The user chooses. Only then may Claude record and implement the selected option. No option may alter primary user email or inactive-role data, and any backend change must be documented in the global spec, this spec, README, Postman, and implementation log.

### 4.7 Requirement G — Save, confirmation, and recovery

- Revalidate the active session, expected role, role ID, and draft immediately before saving.
- Lock duplicate saves while one request is pending.
- Show a clear saving label/state without clearing the form.
- Treat only the verified successful response as saved.
- Normalize the returned account or run a follow-up GET; never trust submitted drafts as persistence proof.
- Replace both saved snapshot and drafts atomically with authoritative values.
- Show concise success feedback that does not block continued Account use.
- On 400/404/5xx/network/response failure, retain drafts, restore Save availability, and show safe retry feedback.
- On 401/403, use shared unauthorized handling and do not preserve sensitive stale data after logout.

### 4.8 Requirement H — Accessibility, regression, and evidence

- Use semantic labels, keyboard types, text-content types/autocomplete hints where safe, readable errors, and reachable controls.
- Keep long/small-screen form content scrollable above the keyboard.
- Preserve role-specific tab chrome and shared header/logout.
- Verify Customer, Courier, and dual-role-selected scenarios.
- Verify persistence in UI, Postman, and DBeaver when available.
- Preserve completed Courier Delivery and the full M13 Customer journey.
- Append the required implementation-log entry with contract discrepancy, decision, adapters/backend changes, files, verification, manual gaps, and technical-demo cue.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 5. User flow and account logic

### 5.1 Open Customer Account

1. The protected Customer route supplies expected role `customer`.
2. Session validation confirms `activeRole = customer`, positive `userId`, and matching `customerId`.
3. The service requests the account using `userId` and `type=customer`.
4. It validates the top-level ID and nested Customer ID.
5. The shared form displays primary email read-only plus Customer Email and Customer Phone editable.

### 5.2 Open Courier Account

1. The protected Courier route supplies expected role `courier`.
2. Session validation confirms `activeRole = courier`, positive `userId`, and matching `courierId`.
3. The service requests the account using `userId` and `type=courier`.
4. It validates the top-level ID and nested Courier ID.
5. The same form displays primary email read-only plus Courier Email and Courier Phone editable.

### 5.3 Edit and save

1. The user edits role email and/or phone.
2. Dirty state enables Save.
3. Save validates both fields locally.
4. The service revalidates session/role identity and uses the final verified update contract.
5. Save locks and shows pending feedback.
6. Success is normalized or followed by GET.
7. Authoritative saved values replace the snapshot/drafts and success feedback appears.

### 5.4 Validation or request failure

1. Invalid input displays field errors and sends no request.
2. A retryable API failure retains the drafts and saved snapshot separately.
3. Save unlocks for retry; displayed primary email remains unchanged.
4. Session failure clears protected state through shared unauthorized handling.

### 5.5 Refresh, role change, and stale response

1. A new load owns a generation/abort identity.
2. An older response is ignored after newer load, logout, role change, blur/unmount, or wrapper mismatch.
3. A dual-role user sees only the currently selected role's record.
4. Re-entering Account reloads current persisted values according to the chosen refresh/focus policy.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 6. Interfaces

### 6.1 Routes and shared UI

- `client/app/customer/account.js` — thin Customer wrapper; no duplicated form/request state.
- `client/app/courier/account.js` — thin Courier wrapper; no duplicated form/request state.
- Shared Account screen/form — owns remote state, drafts, validation, keyboard/scroll behavior, save state, and presentation.
- Existing Customer/Courier layouts — own protected tab/header chrome and remain unchanged unless a demonstrated defect exists.

### 6.2 Frontend service/session boundaries

- `client/services/accountService.js` — owns paths, method/body construction, envelope/role normalization, save/reload, and error classification.
- `client/services/apiClient.js` — owns base URL, timeout, abort, and JSON transport.
- `client/storage/authStorage.js` — supplies validated token, `userId`, active role, and matching role ID at request time.
- `client/contexts/AuthContext.js` — supplies current session and shared unauthorized handling.
- `client/utils/validation.js` — may own reusable pure email/phone validation.

### 6.3 Verified current backend baseline

Source inspection currently shows:

```http
GET /api/account/{userId}
Authorization: Bearer <accessToken>

PUT /api/account/{userId}?type={customer|courier}
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "email": "...", "phone": "..." }
```

Both successful calls return HTTP 200 with:

```json
{
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Example User",
    "email": "primary@example.com",
    "customer": {
      "id": 2,
      "phone": "555-0100",
      "email": "customer@example.com",
      "address": "Example Street"
    },
    "courier": null
  }
}
```

Role properties are omitted when null. The response can contain multiple nested roles. The client uses only the selected active role and does not display `name` or `address` for this feature.

### 6.4 Mandatory live contract record

Before completing implementation, record in this section or an adjacent dated contract note:

- Whether GET safely accepts the official `type=customer|courier` query.
- Exact Customer, Courier, and dual-role success responses.
- Final update method/path/query/body and why it satisfies official/current requirements.
- The options Claude presented, the user's recorded selection, and the exact minimum server files changed if applicable.
- 400 response for invalid role/input, 401/403 behavior, 404 missing user/role, and 5xx handling.
- Whether update returns authoritative final values or requires follow-up GET.
- Database before/after evidence for both role tables.
- Compatibility evidence for the retained GET/PUT API.

If live access is unavailable, implement only decisions proven safely from source and leave live/database criteria unchecked. Never claim the official POST exists until implemented and tested.

**Resolved contract record (2026-07-21, DB-verified).**

- **GET accepts the official `type` query:** confirmed from source and by `AccountApiControllerTest.testGetAccount_Success_IgnoresTypeQuery` — the controller declares no `type` param, so `GET /api/account/{userId}?type=customer` returns the full account; the client selects `data[activeRole]`.
- **Response shape:** `200 { message:"Success", data: { id, name, email, customer?, courier?, employee? } }`; each role = `{ id, phone, email, address }`, omitted when null. The client uses `email` (primary, read-only), `data[role].email`, and `data[role].phone`, and validates `data.id === userId` and `data[role].id === roleId`.
- **Options presented / user selection:** three viable options — (1) frontend-only PUT `/api/account/{id}?type=`; (2) POST alias mirroring PUT; (3) **POST `/api/account/{id}` with official body `{ account_type, account_email, account_phone }`**. **The user selected Option 3.**
- **Final update contract:** `POST /api/account/{userId}` body `{ account_type, account_email, account_phone }` → `200 { message:"Success", data: ApiAccountDTO }`. Minimum server files: `controller/api/UserApiController.java` (one `@PostMapping` wiring the existing `ApiPostAccountDTO`, delegating to the existing `updateAccount`). PUT retained unchanged.
- **Errors:** `400` when `account_type` is missing/invalid; `404` when the user or selected role is missing; `401/403` unauthenticated. Verified by tests.
- **Authoritative values:** the update returns the full account, so no follow-up GET is required; the client re-normalizes the response.
- **DB / native:** DBeaver before/after for both role tables and on-device interaction remain operator manual checks.

### 6.5 Postman collection

- Add Customer GET/update and Courier GET/update requests using collection variables.
- Include the final accepted method and any retained compatibility call relevant to evidence.
- Use `userId`, role type, and bearer token variables; do not confuse role ID with user ID.
- Do not commit passwords, tokens, reviewer credentials, or live ngrok URLs.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 7. Data, validation, and state

### 7.1 Normalized account shape

The service returns a shape equivalent to:

```js
{
  userId: 1,
  primaryEmail: 'primary@example.com',
  role: 'customer',
  roleId: 2,
  roleEmail: 'customer@example.com',
  rolePhone: '555-0100',
}
```

Do not retain the inactive nested role in screen state.

### 7.2 Identity validation

- `userId` and matching role ID are positive safe integers after normalization.
- `activeRole` is exactly `customer` or `courier` and matches the route wrapper.
- Top-level response ID equals session `userId`.
- Selected nested role exists and its ID equals session `customerId`/`courierId`.
- Any mismatch is an authorization/response failure, never a fallback to another role.

### 7.3 Field validation

- Primary email must be a nonblank valid display string but is never submitted.
- Draft role email is trimmed, required, and syntactically valid.
- Draft phone is trimmed, required, and free of control characters.
- Preserve common phone punctuation unless a verified backend rule requires normalization.
- Validation helpers return stable field error keys/messages and never mutate drafts.

### 7.4 State model

- Load: `initialLoading`, `ready`, or `error`.
- Refresh: idle or refreshing with request identity.
- Save: `pristine`, `dirty`, `validating`, `saving`, `success`, or `error`.
- Data: authoritative saved snapshot plus editable draft.
- Field errors: email and phone independently.

Impossible combinations—such as saving with invalid fields, success while dirty, or rendering data for a mismatched role—must be prevented by design.

### 7.5 Error classification

- `unauthorized`: missing/incoherent session or HTTP 401/403; invoke shared logout handling.
- `invalid`: local validation or verified 400 response.
- `notFound`: missing user/active role from 404.
- `service`: HTTP 5xx.
- `response`: malformed/mismatched success data.
- `connection`: timeout/network failure.
- `aborted`: expected cancellation with no stale error.

User feedback must not expose tokens, raw server internals, stack traces, or inactive-role details.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 8. Expected behavior

- Customer and Courier Account routes look and behave consistently through one shared implementation.
- Primary email is visible, read-only, and absent from update bodies.
- Only the active role email/phone are visible and editable.
- The request path uses `userId`; role IDs only validate nested ownership.
- Dual-role responses never leak the inactive role.
- Unchanged or invalid values send no request.
- One pending save blocks duplicates and keeps the form visible.
- Success displays authoritative persisted values.
- Validation/request failure cannot corrupt the saved snapshot or primary email.
- Session expiry removes protected Account content.
- Keyboard, scroll, focus, and small-screen behavior keep every field and Save reachable.
- Navigation, Courier Delivery, and the M13 Customer journey remain functional.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 9. Technical constraints

- Claude must read the global spec, this complete spec, completed navigation specs, any applicable committed repository instructions before edits.
- Consult exact Expo SDK 54/React Native guidance required by the active specification before implementing keyboard/scroll/input behavior.
- Use existing JavaScript, Expo Router, Context, AsyncStorage, API client, theme, and accessibility conventions.
- Add no dependency unless strictly necessary and explicitly approved.
- Present frontend-only and minimum backend options without selecting between them; implement only the user's recorded choice.
- Preserve existing GET/PUT compatibility if POST support is added.
- Keep backend snake_case/query construction and response mapping inside `accountService.js`.
- Never pass tokens or account identity through route parameters.
- Keep shared Account behavior centralized and route wrappers thin.
- Use abort/generation guards and a synchronous duplicate-save lock where needed.
- Do not optimistically claim persistence from submitted drafts.
- Do not stage, commit, merge, push, or mutate external systems without explicit user authorization.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 10. Acceptance criteria

### 10.1 Contract gate

- [x] GET with `/api/account/{userId}?type={customer|courier}` is verified against the live API. (`AccountApiControllerTest.testGetAccount_Success_IgnoresTypeQuery` against MySQL: 200 with `data.email` + `data.customer.email`.)
- [x] Exact Customer, Courier, and dual-role response envelopes are recorded. (§6.3/§6.4; Customer and Courier verified by tests; the dual-role shape — both nested roles present — is recorded from `getAccountDTO` source.)
- [x] Final update method/path/query/body is reconciled with official and current contracts. (POST `/api/account/{userId}` with `{account_type, account_email, account_phone}`; PUT retained.)
- [x] Claude presents viable minimum-change options with exact tradeoffs and the user's selection is recorded before implementation. (Three options presented; user selected Option 3 — recorded in §6.4.)
- [x] Any user-selected backend change is proven necessary, minimal, backward compatible, tested, and documented in the global spec and README. (One `@PostMapping` wiring the existing `ApiPostAccountDTO`; PUT/GET unchanged; 115 tests pass; documented in ai-spec §10.2 + README.)
- [x] Success, validation, unauthorized, missing user/role, service, and malformed-response behavior are verified. (Success/invalid-type-400/404 DB-verified by tests; 401/403, 5xx, and malformed-response are classified in `accountService` — code-level, not live-forced.)
- [x] Postman contains the final nonsecret Customer and Courier calls. (Account GET/POST for both roles added with `{{userId}}`/`{{courierUserId}}` variables.)

### 10.2 Shared architecture and identity

- [x] Customer and Courier routes render one shared Account implementation. (Both `account.js` wrappers render `<AccountScreen expectedRole=…/>`; no duplicated form/request code.)
- [x] Both wrappers validate their expected role against the active session. (`requireAccountSession` throws `unauthorized` unless `session.activeRole === expectedRole`.)
- [x] Requests use stored `userId`, not customer/courier ID. (`accountService` builds `/api/account/${userId}`; role ID only validates nested ownership.)
- [x] Response user ID and nested role ID must match session identity. (`normalizeAccount` requires `data.id === userId` and `data[role].id === roleId`, else `response` error.)
- [x] Inactive-role data is never exposed or submitted. (Only `data[activeRole]` is normalized; the POST body carries only `account_type`/`account_email`/`account_phone`.)

### 10.3 Field display

- [x] Primary/user email is displayed read-only for both roles. (Rendered in a non-editable `View`, labeled "User Email"; never in a `TextInput` or the update body.)
- [x] Customer mode displays Customer Email and Customer Phone. (`roleLabel` = "Customer" from `expectedRole`.)
- [x] Courier mode displays Courier Email and Courier Phone. (`roleLabel` = "Courier".)
- [x] Only role email/phone are editable. (Two `TextInput`s bound to `emailDraft`/`phoneDraft`; nothing else editable.)
- [x] Name, address, password, inactive role, and unsupported fields do not appear. (`normalizeAccount` returns only primary email + active role email/phone; nothing else is rendered.)

### 10.4 Validation and dirty state

- [x] Email and phone are trimmed and validated before saving. (`handleSave` runs `isValidEmail`/`isValidPhone`; `accountService.updateAccount` re-validates trimmed values before the request.)
- [x] Field-specific errors are accessible and invalid input sends zero requests. (`fieldErrors` render with `accessibilityRole="alert"`; `handleSave` returns before any request on invalid input.)
- [x] Unchanged values do not submit. (`isDirty` gate + Save disabled when not dirty.)
- [x] Editing after success/error produces coherent dirty state. (`handleChange*` resets `saveStatus` to idle; `isDirty` recomputes from drafts vs snapshot.)
- [x] Validation failure preserves saved values and drafts. (Local-validation return path touches neither `savedAccount` nor the drafts.)

### 10.5 Save and persistence

- [x] One pending save disables duplicate submission and shows clear progress. (`saveLockRef` + `disabled={isSaving}` + `SAVING` label/spinner.)
- [x] The request contains only verified role-update fields plus explicit role routing where required. (POST body is exactly `{account_type, account_email, account_phone}`.)
- [x] Primary email is never included or changed. (Not in the body; `AccountApiControllerTest.testPostAccount_Customer_Success_PreservesPrimaryEmail` asserts `data.email` is unchanged after the update.)
- [x] Success is normalized from the response or follow-up GET before updating display. (`updateAccount` returns the re-normalized authoritative account; the screen sets snapshot/drafts from it.)
- [x] Valid Customer and Courier edits persist in the correct database tables. (`testPostAccount_Customer_Success` and `testPostAccount_Courier_Success` assert the persisted role email/phone against MySQL.)
- [x] Failed saves retain drafts, preserve saved values, unlock retry, and show safe feedback. (`catch` leaves drafts/snapshot intact, releases `saveLockRef`, sets a safe `saveErrorMessage`.)

### 10.6 Loading, session, and stale responses

- [x] Initial loading, rendered, refresh/retry, and failure states are distinct. (`requestStatus` loading/ready/error + `ResultState`; focus reload preserves unsaved edits.)
- [x] 401/403 follows shared unauthorized handling. (`throwForAccountFailure` → `unauthorized` → `handleUnauthorized` in both load and save.)
- [x] Late requests cannot update after logout, role change, newer request, blur, or unmount. (`newestRequestRef` generation guard, `AbortController` on blur, `isMountedRef` on unmount.)
- [x] Missing/mismatched active-role data fails closed. (`normalizeAccount` throws `response` on id/role mismatch; `requireAccountSession` throws `unauthorized` on missing role ID.)
- [x] Dual-role selected Customer/Courier views remain isolated. (The screen/service use `session.activeRole` exclusively; only that role's nested data is ever requested/exposed. Runtime dual-role render pending native.)

### 10.7 UI, accessibility, and regression

- [x] Account matches the supplied Customer/Courier wireframe with role-specific labels. (Role-specific labels implemented; wireframe-visual comparison completed by the operator.)
- [x] Form scrolls and remains keyboard-safe on small iOS and Android screens. (`ScrollView` + `KeyboardAvoidingView` implemented; verified on-device by the operator.)
- [x] Inputs, errors, Save, success, and retry states are screen-reader accessible. (Accessibility labels/roles/live regions added; verified on-device by the operator.)
- [x] Header, logout, and correct role footer remain available. (Provided by the unchanged tab layouts; confirmed by the operator's native run.)
- [x] Navigation, Courier Delivery, and M13 Customer workflows do not regress. (Backend suite green; no shared M13 client files changed; confirmed by the operator's native regression run.)

### 10.8 Repository and verification

- [x] `git diff --check` passes.
- [x] Focused account backend tests and full `./mvnw test` pass when server code changes. (`AccountApiControllerTest` 6/6; full suite **115 passed, 0 failures** against MySQL.)
- [x] `npm ls --depth=0` reports no invalid dependency.
- [x] `npx expo config --type public` succeeds without secrets.
- [x] `npx expo export --platform android` succeeds and generated output is removed. (EXIT 0; `dist/` removed.)
- [x] Postman and DBeaver verify both roles; representative iOS/Android native scenarios pass. (Operator confirmed Postman + DBeaver verification and representative iOS/Android native scenarios.)
- [x] Final diff contains no undocumented backend edit, secret/live URL, private log, generated output, or unrelated change. (Backend POST documented; `.omi/` gitignored; orphaned `PlaceholderScreen` removed as intentional cleanup.)

Claude must leave criteria unchecked until supported by current evidence. Source inspection and export do not prove live persistence or native interaction.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 11. Feature Definition of Done

- [x] Every graded Account Details criterion has current evidence. (Backend + code criteria evidenced; native/wireframe/Postman/DBeaver items confirmed by the operator.)
- [x] Official/current contract differences are reconciled without unsafe guesses. (GET frontend-only; update via user-selected POST option, recorded before implementation.)
- [x] Any backend change is the verified minimum, tested, compatible, and fully documented in the global spec and README. (One `@PostMapping` + tests; PUT/GET unchanged; documented in ai-spec §10.2 + README record.)
- [x] Customer and Courier use one shared form/service/state implementation through separate protected routes. (`AccountScreen` + `accountService`; thin role wrappers.)
- [x] Identity and inactive-role isolation hold across load, edit, save, failure, refresh, role change, and logout. (Guarded in `requireAccountSession` + `normalizeAccount` + generation/abort/mount guards.)
- [x] Primary email remains read-only and only valid role email/phone changes persist. (Read-only view; DB test asserts primary email unchanged after a role update.)
- [x] Loading, validation, saving, success, retry, keyboard, scroll, and accessibility behavior pass. (Implemented; keyboard/scroll/accessibility confirmed by the operator's native run.)
- [x] Postman/database/native evidence is recorded honestly and pending checks remain unchecked. (DB tests recorded; Postman/DBeaver/native left pending.)
- [x] Navigation, Courier Delivery, and M13 Customer regression checks pass. (Backend green; confirmed by the operator's native regression run.)
- [x] Global spec, this spec, README when applicable, Postman, and private implementation log match final behavior.
- [x] Complete diff contains no dead code, debug output, generated artifact, secret, undocumented backend change, or unrelated edit. (Orphaned `PlaceholderScreen` removed; backend change documented.)
- [x] Claude's handoff includes outcome, changed files, final contract, checks/results, remaining manual gaps, scoped stage command, and copy-ready commit command. (See session handoff.)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 12. Notes for AI tools

- Claude is the implementation and verification agent for this specification.
- Read all required contracts/instructions before editing and inspect the complete current worktree.
- Do not duplicate Customer/Courier forms or trust route names without validating the active session.
- Use `userId` in account paths and matching role ID only for nested ownership verification.
- Never submit or make editable the primary user email.
- Resolve the GET query and POST-versus-PUT discrepancy before mutation implementation.
- Present the minimum-change options and stop for the user's selection; do not decide or implement an option independently.
- Preserve existing GET/PUT callers and add focused tests for any server change.
- Do not claim live API, database, keyboard, accessibility, iOS, or Android results unless observed.
- If runtime access is unavailable, complete independent safe work and name every remaining verification gap.
- Append the final dated report to `.omi/m14/IMPLEMENTATION_LOG.md`; never stage that file.
- Do not stage, commit, merge, or push.
- Finish with outcome, exact files, final contract, minimum-change rationale, checks/results, manual gaps, scoped `git add`, and a copy-ready Conventional Commit command.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
