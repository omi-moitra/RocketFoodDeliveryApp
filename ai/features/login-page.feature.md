# AI Feature Specification — Login Page

> Defines the customer login screen, authentication request, persisted session, and transition into the Rocket Food Delivery mobile application. Use this document together with `ai/ai-spec.md`.

## Table of Contents

1. [Feature Identity](#feature-identity)
2. [Feature Goal](#feature-goal)
3. [Feature Scope](#feature-scope)
4. [Sub-Requirements](#sub-requirements-feature-breakdown)
5. [User Flow](#user-flow-and-login-logic)
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

- **Feature Name:** Customer Login Page
- **Related Area:** Mobile frontend, authentication API, AsyncStorage, root navigation
- **Specification file:** `ai/features/login-page.feature.md`
- **Screen route:** `client/app/index.js`
- **API endpoint:** `POST ${API_BASE_URL}/api/auth`
- **Implementation branch:** `feature/login-page`

## Feature Goal

Allow a Rocket Food Delivery customer to authenticate with an email address and password, persist the returned customer session safely, and enter the authenticated application at the Restaurants page.

The Login page must closely match the supplied wireframe and exact project color scheme. Invalid credentials must leave the customer on Login and display an inline error directly above the Login button. The screen must also handle local validation, request progress, network failures, malformed or non-customer success responses, and storage failures without exposing sensitive data.

## Feature Scope

### In Scope (Included)

- The unauthenticated Login screen at `client/app/index.js`.
- Email and password inputs.
- Required-field and email-format validation before the request.
- A Login button and keyboard submission behavior.
- A public `POST /api/auth` request using the environment-driven API base URL.
- Physical-device access to the local Java server through an HTTPS ngrok URL stored in `EXPO_PUBLIC_API_URL`.
- Explicit login states: `idle`, `submitting`, `success`, and `error`.
- An inline, user-safe error message above the Login button.
- Mapping the backend response fields `accessToken`, `user_id`, and `customer_id` to the client session fields `accessToken`, `userId`, and `customerId`.
- Awaited AsyncStorage persistence through the shared authentication/session layer.
- Navigation into the authenticated customer area after persistence succeeds.
- Root-route protection for new launches with either a complete persisted session or no usable session.
- Login-screen styling, keyboard avoidance, scrolling on small devices, safe-area handling, accessibility, and iOS/Android behavior.
- Postman coverage for successful login, incorrect credentials, and invalid request data.

### Out of Scope (Excluded)

- Registration, password reset, social login, biometric login, multi-factor authentication, or remembered passwords.
- Employee, courier, restaurant-owner, or administrator mobile login flows.
- A backend logout endpoint or server-side JWT revocation.
- Header, Log Out button, or footer tabs on the Login page; those belong to `header-footer.feature.md` and must not render here.
- Restaurant, menu, order, or order-history fetching.
- Modifying the Java backend, database schema, authentication response, or seeded users.
- Passing a token, password, customer object, or customer ID in route parameters.
- Hard-coded ngrok domains, localhost URLs, credentials, tokens, or secrets.
- Treating ngrok as a direct mobile-to-database connection. The app calls the Java REST API; the Java server remains responsible for its localhost MySQL connection.
- Editing the original files under `support_materials_13/`.

## Sub-Requirements (Feature Breakdown)

### Requirement A — Login Screen Structure

- Implement Login as the root unauthenticated route in `client/app/index.js`.
- Follow the Login composition, spacing, typography, input treatment, button placement, and proportions shown in `support_materials_13/Design/Wireframe.pdf`.
- Use the supplied Rocket Food Delivery branding shown by the wireframe. Copy an approved source logo from `support_materials_13/Images/` into a runtime client asset path rather than importing from support materials.
- Use only centralized project palette values from the supplied color scheme:
  - Orange-red: `#DA583B`.
  - Charcoal: `#222126`.
  - Dark red: `#851919`.
  - Muted green: `#609475`.
  - Warm yellow: `#F0CB67`.
  - White: `#FFFFFF`.
- Do not render the authenticated shared header, Log Out action, or footer tabs.
- Keep the form reachable when the keyboard is visible and on small phone screens.

### Requirement B — Credential Inputs

- Provide an email input with a visible label or equivalent accessible name.
- Configure the email input for email entry: email keyboard, no auto-capitalization, and appropriate autofill/content hints.
- Provide a password input with a visible label or equivalent accessible name.
- Mask the password using secure text entry and use an appropriate password autofill/content hint.
- Keep the password in component memory only for the current form interaction.
- Do not log, persist, place in navigation state, or include the password in diagnostic messages.
- Trim surrounding whitespace from the email before validation and submission; do not modify the password value.

### Requirement C — Client Validation

- Require both email and password.
- Reject a non-empty email that does not have a valid email shape before calling the API.
- Show one concise, user-safe inline validation message above the Login button.
- Do not send a request while local validation fails.
- Keep the entered values available so the customer can correct them.
- Clear or replace a stale error when the customer submits again.
- Do not reveal whether an individual email account exists.

### Requirement D — Authentication Request

- Send `POST ${API_BASE_URL}/api/auth` with `Content-Type: application/json`.
- Do not attach a bearer token; the endpoint is public.
- Send exactly the credential fields expected by the existing Java API:

```json
{
  "email": "customer@example.com",
  "password": "password"
}
```

- Resolve `API_BASE_URL` from `EXPO_PUBLIC_API_URL` through a shared API/configuration layer.
- Normalize the base URL so request construction does not produce missing or duplicated slashes.
- Fail safely with a configuration message when `EXPO_PUBLIC_API_URL` is missing or unusable.
- Apply a finite request timeout or abort strategy so Login cannot remain stuck indefinitely.

### Requirement E — Successful Customer Session

- Treat the response as a usable customer login only when:
  - HTTP status is successful.
  - `success` is `true`.
  - `accessToken` is a non-empty string.
  - `customer_id` is present and usable.
- Map backend snake_case identifiers once at the API boundary:
  - `user_id` → `userId`.
  - `customer_id` → `customerId`.
- Pass `accessToken`, `customerId`, and optional `userId` to the existing shared `completeSignIn` session action.
- Await AsyncStorage persistence before considering login complete.
- Never log the token or include it in navigation parameters.
- After session completion, let the protected root navigation replace Login with the authenticated customer area and open Restaurants.
- Prevent normal back navigation from returning to Login while the session remains valid.

### Requirement F — Non-Customer or Malformed Success Response

- This Module 13 app is customer-only; a successful API response without `customer_id` is not a usable mobile customer session.
- Do not persist a partial session and do not enter authenticated routes when `customer_id` is missing.
- Display a safe message indicating that the account cannot access the customer application.
- Treat a missing/empty token, invalid JSON, or unexpected response shape as a safe login failure rather than crashing.

### Requirement G — Incorrect Credentials and Other Failures

- For HTTP 401 or `success: false`, display an incorrect-credentials message directly above the Login button.
- Failed authentication must not navigate or create/update a stored session.
- For HTTP 400 caused by invalid request data, display a concise validation message without raw backend details.
- For timeout, offline, DNS, TLS, ngrok, or unreachable-server failures, display a retryable connection message.
- For HTTP 5xx or an unexpected server response, display a generic retryable service message.
- For AsyncStorage failure after a valid response, remain logged out and show a safe session-saving error.
- Re-enable the Login button after every failure.
- Do not display stack traces, exception class names, server internals, tokens, or the submitted password.

### Requirement H — Submission and Retry Control

- Disable the Login button while a request/session save is in progress.
- Prevent duplicate submissions from button presses or the keyboard.
- Show visible progress without replacing the button area in a way that shifts the required inline-error location.
- Ignore late results after the screen unmounts and abort the request when supported.
- On retry, preserve the current email, allow password correction, clear the stale error, and start a fresh request.

### Requirement I — Persisted Session Boundary

- The existing root authentication provider resolves stored session data before choosing Login or Customer routes.
- A complete stored session requires both a usable `accessToken` and `customerId`.
- Missing, incomplete, or unreadable storage is treated as logged out and displays Login.
- Do not briefly expose Login while a complete stored session is still being resolved.
- Storage keys remain centralized in `client/storage/authStorage.js`; do not duplicate raw AsyncStorage key strings in the Login screen or service.

### Requirement J — ngrok API Connectivity

- Start the Java server locally on port `8080`; its existing configuration owns the MySQL connection.
- Expose the Java server, not MySQL, using an HTTPS ngrok tunnel that forwards to local port `8080`.
- Set the current public tunnel origin in the client environment, for example:

```dotenv
EXPO_PUBLIC_API_URL=https://example-subdomain.ngrok-free.app
```

- Build Login and all later fetch requests from the same shared environment-driven base URL.
- Never commit a personal/temporary ngrok URL or place it directly in source code.
- Restart/reload the Expo client after the environment value changes.

## User Flow and Login Logic

### First Launch Without a Session

1. The root authentication provider reads centralized AsyncStorage keys.
2. No complete session is found.
3. Root navigation displays `client/app/index.js` as the Login page.
4. The page displays email and password inputs plus the Login button, without authenticated header/footer navigation.

### Valid Login

1. The customer enters email and password.
2. The customer presses Login or submits from the keyboard.
3. The app trims and validates the email and verifies that both values are present.
4. The state changes from `idle` to `submitting`; duplicate submission is disabled.
5. The client sends the public authentication request to `${API_BASE_URL}/api/auth`.
6. The API returns HTTP 200 with `success`, `accessToken`, `user_id`, and `customer_id`.
7. The API layer validates and maps those fields to the client session shape.
8. The shared auth context awaits persistence of `accessToken`, `customerId`, and optional `userId`.
9. Shared in-memory session state is updated.
10. The root protected navigator removes Login and enters Customer Tabs on Restaurants.

### Invalid Local Input

1. The customer submits with a missing field or invalid email shape.
2. No API request is made.
3. A concise validation message appears directly above the Login button.
4. Focus moves to or remains associated with the first invalid field where practical.
5. The customer corrects the input and retries.

### Incorrect Credentials

1. The customer submits locally valid credentials.
2. The API returns HTTP 401 with `success: false`.
3. The app remains on Login and stores no session.
4. An incorrect-credentials message appears directly above the Login button.
5. The Login button is re-enabled for retry.

### Connection, Server, Response, or Storage Failure

1. The customer submits locally valid credentials.
2. The request times out/fails, the server returns an unexpected result, the response lacks customer session data, or session storage fails.
3. The app remains on Login and does not expose a protected route.
4. A user-safe message appears directly above the Login button.
5. The customer can retry without restarting the application.

### Launch With a Complete Session

1. The root authentication provider reads a usable `accessToken` and `customerId` from centralized storage.
2. Session resolution finishes before protected route selection.
3. Root navigation enters the authenticated customer application rather than rendering Login.
4. Later protected HTTP 401 handling belongs to the shared authentication/navigation contract and returns the customer to Login after clearing stale session data.

## Interfaces (Pages, Components, Services, Storage, and Endpoints)

### Frontend Routes and Layouts

| File | Responsibility |
| --- | --- |
| `client/app/index.js` | Renders the unauthenticated Login screen and owns form interaction state. |
| `client/app/_layout.js` | Resolves persisted auth state and protects Login versus Customer routes. |
| `client/app/customer/_layout.js` | Authenticated tab destination entered after successful login; does not render during Login. |

### Components

- The Login form may remain in `client/app/index.js` while it is screen-specific.
- Extract a reusable component only when it has a clear second consumer or materially improves readability.
- Reuse centralized loading/error primitives if they already satisfy the wireframe; do not force a generic component that changes the required design.
- No authenticated `AppHeader` or footer Tabs component is rendered on this screen.

### Services and Configuration

| Interface | Responsibility |
| --- | --- |
| Shared API/config module | Reads and validates `EXPO_PUBLIC_API_URL`, builds URLs, parses responses, and applies shared network rules. |
| Authentication service, for example `authenticateCustomer` | Sends `POST /api/auth`, classifies response failures, validates the customer response, and maps API keys to the client session shape. |
| `client/contexts/AuthContext.js` | Exposes `completeSignIn`, persists the mapped session, and updates shared in-memory authentication state. |
| `client/storage/authStorage.js` | Owns centralized AsyncStorage keys and complete-session read/write/clear behavior. |

Do not duplicate the HTTP request, API URL parsing, or raw storage key strings inside multiple screens.

### Backend / API

`POST ${API_BASE_URL}/api/auth`

- **Authentication:** Public; do not send `Authorization`.
- **Content type:** `application/json`.
- **Request fields:**
  - `email`: required, valid email string.
  - `password`: required string.
- **HTTP 200 customer response used by this feature:**

```json
{
  "accessToken": "<jwt>",
  "success": true,
  "user_id": 1,
  "customer_id": 1,
  "courier_id": null
}
```

- `courier_id` can be present or null in the existing shared backend response but is not stored or used by the customer app.
- **HTTP 401 incorrect-credentials response:**

```json
{
  "success": false
}
```

- **HTTP 400:** Jakarta validation failure for missing or malformed fields; the UI shows a safe local message rather than relying on backend error internals.
- The endpoint and response already exist in the provided Java server. Do not modify them for this feature.

### Storage

| Client value | API source | AsyncStorage key owner | Required for complete session |
| --- | --- | --- | --- |
| `accessToken` | `accessToken` | `AUTH_STORAGE_KEYS.accessToken` | Yes |
| `customerId` | `customer_id` | `AUTH_STORAGE_KEYS.customerId` | Yes |
| `userId` | `user_id` | `AUTH_STORAGE_KEYS.userId` | No; save when returned. |

- All values are normalized by the shared storage module.
- The password and email are not part of the persisted session.
- Login must not write directly to AsyncStorage.

## Data, Validation, and State

### Form Data

| Field | Client type | Preparation | Validation | Persistence |
| --- | --- | --- | --- | --- |
| `email` | String | Trim surrounding whitespace. | Required and valid email shape. | Never stored by this feature. |
| `password` | String | Preserve exactly as entered. | Required. | Never stored. |

### API Response Data

| API field | Expected type | Client field | Rule |
| --- | --- | --- | --- |
| `success` | Boolean | Response status flag | Must be `true` for successful login. |
| `accessToken` | Non-empty string | `accessToken` | Required; sensitive; never log or route. |
| `user_id` | Integer/usable identifier | `userId` | Save when present; do not confuse with customer ID. |
| `customer_id` | Integer/usable identifier | `customerId` | Required for this customer-only application. |
| `courier_id` | Nullable integer | Not mapped | Ignore for customer app session. |

### Form and Request State

| State | Inputs | Login action | Inline message | Navigation |
| --- | --- | --- | --- | --- |
| `idle` | Enabled | Enabled | None | Remain on Login. |
| `submitting` | Remain visible; editing may be disabled consistently | Disabled | Clear stale error; show progress | Remain on Login. |
| `success` | No further interaction | Disabled during persistence/transition | None | Protected root enters Restaurants. |
| `error` | Enabled | Enabled | Visible above Login button | Remain on Login. |

- Model request status so impossible combinations such as active submission plus an enabled submit button cannot occur.
- One visible error region may present validation, credential, connectivity, server, response, or storage errors; it must remain directly above the Login button.
- Input values are never placed inside the error state.

### Error Classification

| Condition | Required UI behavior |
| --- | --- |
| Missing email/password | Show required-field guidance; do not fetch. |
| Invalid email shape | Show valid-email guidance; do not fetch. |
| HTTP 401 or `success: false` | Show incorrect-credentials message. |
| HTTP 400 | Show safe input-validation message. |
| Missing `customer_id` | Explain that the account cannot access the customer app. |
| Missing token or malformed response | Show generic login-response failure. |
| Timeout/offline/ngrok/network failure | Show retryable connection message. |
| HTTP 5xx | Show retryable service message. |
| AsyncStorage write failure | Show safe session-saving message and remain logged out. |

## Visual and Accessibility Contract

- Match the Login page shown in `support_materials_13/Design/Wireframe.pdf`; the grading criterion is visual agreement, not a generic form.
- Use `support_materials_13/Design/ColorScheme.pdf` and centralized values in `client/constants/theme.js`; do not approximate colors.
- Use Oswald where shown in the wireframe and the approved Arial/platform-safe body fallback elsewhere.
- Do not display the authenticated header or footer.
- Preserve the selected supplied logo's aspect ratio and accessible meaning.
- Keep the inline error above the Login button in every failure state.
- Respect device safe areas and provide enough bottom/keyboard spacing that the button remains reachable.
- Use `KeyboardAvoidingView`, scrolling, or an equivalent native-safe composition so no input is trapped behind the keyboard.
- Email and password controls must have labels, predictable focus order, readable contrast, and announced validation state.
- Give the Login control button semantics, an accessible name, a disabled/busy state while submitting, and at least the shared minimum touch target.
- Announce new login errors to assistive technology where React Native support permits.
- Do not rely on color alone to communicate an error or disabled state.
- Verify the screen in portrait layout on both iOS and Android and at a small-phone viewport.

## Expected Behavior

| Trigger | Expected Result |
| --- | --- |
| App opens without a complete session | Login renders without authenticated header/footer. |
| App opens with a complete session | Session resolution enters authenticated Restaurants without exposing Login. |
| Customer submits missing/invalid input | Inline validation appears above Login; no request is sent. |
| Customer submits valid credentials | Session fields are validated, mapped, persisted, and Restaurants opens. |
| Customer submits incorrect credentials | Inline credential error appears above Login; no navigation/storage occurs. |
| Customer submits a valid non-customer account | Safe access error appears; no partial session is saved. |
| API/ngrok is unreachable | Retryable connection message appears; Login becomes usable again. |
| Server/response is invalid | Safe generic error appears; app does not crash or expose internals. |
| Session persistence fails | Customer remains logged out with a retryable error. |
| Customer presses Login repeatedly while pending | Only one active authentication attempt is processed. |

## Technical Constraints (Feature-Level)

- Use the current JavaScript Expo Router client; do not introduce TypeScript only for this feature.
- Use the existing Java `POST /api/auth` contract as-is.
- Use `fetch` through a shared request/authentication service unless the repository adopts another client project-wide.
- Use `EXPO_PUBLIC_API_URL` as the only client API origin configuration.
- Remember that every `EXPO_PUBLIC_*` value is bundled into the app; never put a secret in it.
- Use AsyncStorage only through the centralized storage/session layer.
- Await authentication and storage work that controls navigation.
- Keep backend JSON keys at the API boundary and use client camelCase after mapping.
- Use domain names such as `authenticateCustomer`, `handleLogin`, `accessToken`, `customerId`, `userId`, `isSubmitting`, and semantic style names.
- Every new human-authored JavaScript file requires the purpose/contents header defined in the global spec.
- Do not modify `server/` for Module 13 authentication work.
- Do not use browser-only React Bootstrap DOM components in this React Native screen.
- Keep changes limited to login/authentication services, shared client configuration/session integration, tests, and required documentation.

## Acceptance Criteria

### Screen and Form

- [ ] `client/app/index.js` is a functional email/password Login page rather than a placeholder.
- [ ] The Login page closely matches the supplied wireframe and exact centralized palette on iOS and Android.
- [ ] The Login screen contains no authenticated shared header, Log Out button, or footer tabs.
- [ ] Email input uses appropriate keyboard, capitalization, and autofill settings.
- [ ] Password input masks its value and uses appropriate autofill settings.
- [ ] The form remains usable with the keyboard open and on a small phone screen.

### Validation and Error Placement

- [ ] Missing email, missing password, and malformed email are rejected before fetch.
- [ ] Every user-visible login error appears inline directly above the Login button.
- [ ] Incorrect credentials produce a clear inline error and do not navigate.
- [ ] Connection, server, malformed-response, non-customer, and storage failures show safe retryable messages.
- [ ] No UI message exposes raw server internals, a token, password, or stack trace.

### API and ngrok

- [ ] Login sends public `POST ${API_BASE_URL}/api/auth` with JSON `email` and `password`.
- [ ] Request URLs are built from `EXPO_PUBLIC_API_URL`; source code contains no hard-coded localhost or personal ngrok origin.
- [ ] A physical phone can authenticate through an HTTPS ngrok tunnel forwarding to the local Java server on port `8080`.
- [ ] The app never connects directly to MySQL; the Java server owns database access.
- [ ] A timeout/abort strategy prevents an indefinitely pending Login state.

### Session and Navigation

- [ ] A successful response requires `success: true`, a non-empty `accessToken`, and usable `customer_id`.
- [ ] API `user_id`/`customer_id` are mapped to client `userId`/`customerId` at the boundary.
- [ ] `accessToken`, `customerId`, and returned `userId` are saved through the shared session/storage layer.
- [ ] Password is never persisted, logged, or passed through navigation.
- [ ] AsyncStorage completion is awaited before protected navigation is unlocked.
- [ ] Successful customer login enters Restaurants and normal back navigation cannot reopen Login.
- [ ] Missing `customer_id` prevents a courier-only/non-customer account from entering the customer app.
- [ ] Complete stored sessions restore the authenticated route; missing/corrupt sessions resolve to Login.

### State and Verification

- [ ] The Login button is disabled/busy during authentication and duplicate submissions are prevented.
- [ ] Every failure returns the form to an enabled retry state.
- [ ] Late/unmounted request results do not update abandoned Login state.
- [ ] Postman verifies successful login, incorrect credentials, and invalid request data against the existing Java API.
- [ ] Automated client tests cover local validation, 200 success mapping, 401 handling, missing customer ID, network/server failure, storage failure, and duplicate-submit prevention where the project test setup supports them.
- [ ] `git diff --check` reports no whitespace errors.

## Feature Definition of Done

This feature is done only when:

- [ ] Every acceptance criterion above passes.
- [ ] The implementation follows `ai/ai-spec.md`, this feature specification, and the repository's applicable `AGENTS.md` instructions.
- [ ] Login behavior and styling have been compared directly with the grading rows, Module 13 brief, wireframe, color scheme, and physical-device guidance.
- [ ] Authentication works from both an emulator/simulator setup and a physical phone through the configured Java-server tunnel.
- [ ] Valid customer credentials persist a complete session and open Restaurants.
- [ ] Invalid credentials always remain on Login with the required error above the Login button.
- [ ] Secrets, passwords, tokens, and personal tunnel URLs are absent from code, logs, screenshots, and committed configuration.
- [ ] No Java backend or database change was made for the mobile login feature.
- [ ] Relevant client tests and manual verification pass, and any environment-only limitation is documented accurately.
- [ ] The feature file remains self-contained enough that an implementer does not need to infer decision-critical behavior from external assignment files.

## Notes for the AI

- Read `ai/ai-spec.md` and this entire feature file before implementing Login.
- Treat `.omi/FSD Grading Sheets (Shared) - m13.csv` as final grading authority and preserve the exact inline-error placement.
- Use the original support materials to compare the rendered UI, but keep all decision-critical implementation rules in this file.
- Inspect the current `client/app/_layout.js`, `client/contexts/AuthContext.js`, and `client/storage/authStorage.js` before changing their contracts.
- Inspect the existing Java authentication controller and DTOs only to verify the API contract; do not modify them.
- Preserve the distinction between `user_id` and `customer_id`; the customer app requires `customer_id`.
- ngrok exposes the Java REST server to the phone. It does not connect the phone directly to the local database.
- Do not refactor unrelated navigation, restaurant, menu, order, server, or documentation code.
- If a visual measurement is unclear, compare against the supplied wireframe rather than inventing a generic design.
- If an authority conflict cannot be resolved, document the question and ask a coach instead of guessing.
