# AI Feature Specification — Order Confirmation Modal

> Defines the M14 extension to the completed M13 Order Confirmation modal: independent SMS/email opt-ins and accurate notification booleans inside the existing order-creation request. Use this document with `ai/M14/ai-spec.md` and the retained M13 confirmation specification.

> **Implementation owner:** Claude will run and implement this specification. Claude must preserve the working M13 order flow, verify the notification-key discrepancy, present the viable minimum-change options to the user, and stop for the user's selection before changing the notification request contract.

## Table of Contents

1. [Feature identity](#1-feature-identity)
2. [Feature goal](#2-feature-goal)
3. [Feature scope](#3-feature-scope)
4. [Requirements breakdown](#4-requirements-breakdown)
5. [User flow and notification logic](#5-user-flow-and-notification-logic)
6. [Interfaces](#6-interfaces)
7. [Data, validation, and state](#7-data-validation-and-state)
8. [Expected behavior](#8-expected-behavior)
9. [Technical constraints](#9-technical-constraints)
10. [Acceptance criteria](#10-acceptance-criteria)
11. [Feature Definition of Done](#11-feature-definition-of-done)
12. [Notes for AI tools](#12-notes-for-ai-tools)

## 1. Feature identity

- **Feature name:** Order Confirmation Modal Notifications
- **Related area:** Customer Restaurant Menu, order review/submission, order API request mapping
- **Specification file:** `ai/M14/features/order-confirmation-modal.feature.md`
- **Implementation branch:** `feature/m14-order-confirmation-modal`
- **Grading requirements:** AI feature spec, independent SMS/email checkboxes, and accurate `sendSMS`/`sendEmail` booleans in the order POST
- **Dependencies:** The completed M13 menu and confirmation flow supplies product selection, totals, guarded submission, success/failure states, retry, quantity reset, and order creation.
- **Claude deliverable:** A minimal extension of the existing modal and order service that supports all four notification choices without regressing order creation.
- **Completion evidence:** Contract option/selection record, four request-body combinations, success/failure/reset checks, Postman evidence, regression checks, and final diff.

## 2. Feature goal

Allow a Customer to choose independently whether an order confirmation is requested by SMS, email, both, or neither. Both boolean choices must travel inside the one existing `POST /api/orders` request and accurately reflect the visible checkbox state.

This feature extends—not replaces—the working M13 Order Confirmation modal. Product summary, totals, processing, duplicate protection, success, failure, retry, cancellation, quantity reset, session-expiry handling, and accessibility remain required.

## 3. Feature scope

### 3.1 In scope

- Add independent SMS and email checkbox controls to `OrderConfirmationModal`.
- Match the supplied M14 Order Confirmation wireframe within the global UI rules.
- Use explicit client state names `sendSMS` and `sendEmail` for grading/product terminology.
- Default both choices to `false` for a fresh order.
- Support exactly four combinations: neither, SMS only, email only, and both.
- Keep checkbox label, selected state, touch target, and screen-reader state clear on iOS/Android.
- Freeze notification choices while submission is processing.
- Pass the selected booleans to the existing `createOrder` service call.
- Use the user-selected canonical camelCase HTTP keys `sendSMS` and `sendEmail`; do not retain legacy snake-case notification aliases.
- Include both booleans in every order-creation request, including the false/false case.
- Keep notification choices within the same order POST; send no separate baseline notification request.
- Preserve notification choices during a retryable failure.
- Reset choices with the successfully consumed order state.
- Preserve existing product filtering so only positive-quantity selections are submitted.
- Preserve all M13 modal/request/session behavior.
- Update Postman with all four request combinations using the user-selected final JSON contract.
- Document any selected backend adjustment in the global spec, this spec, README, tests, Postman, and private implementation log.

Expected frontend/documentation files:

- `client/components/OrderConfirmationModal.js`
- `client/services/orderService.js`
- `client/constants/theme.js` only if an existing token cannot style the checkbox accessibly
- `client/components/AppIcon.js` only if the established icon owner lacks a required existing icon mapping
- `PostmanCollection.json`
- `ai/M14/features/order-confirmation-modal.feature.md`
- `ai/M14/ai-spec.md` when the selected/final contract changes its truth
- `README.md` only if a backend adjustment is selected and implemented

Claude must inspect before implementation:

- `ai/M13/features/menu-modal-confirmation.feature.md`
- `client/app/customer/restaurant/[restaurantId].js`
- Existing confirmation modal tests/patterns and the full `createOrder` call chain
- `client/services/apiClient.js`
- `client/storage/authStorage.js`
- `client/contexts/AuthContext.js`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/controller/api/OrderApiController.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/dtos/order/ApiCreateOrderDTO.java`
- `server/src/main/java/com/rocketFoodDelivery/rocketFood/service/OrderService.java`
- Order model notification fields and focused order API tests
- `support_materials_14/Wireframe.pdf`

No server file is authorized during initial contract analysis. Claude must first present the viable minimum-change options and wait for the user's selection. After selection, amend this spec with the chosen request contract and any smallest permitted server file/test set before implementation.

### 3.2 Out of scope

- A second client request after order creation for SMS, email, or notification delivery.
- Direct mobile-client integration with Twilio, Notify.EU, SMTP, or any provider SDK/API.
- Claiming that an SMS/email was delivered merely because its checkbox was selected.
- Implementing or redesigning provider credentials, templates, delivery retries, or backend notification infrastructure.
- Using the supplied Email Template for baseline work; it applies only to an explicitly approved Notify.EU extra mile.
- Adding push notifications, phone/email editing, notification history, or saved notification preferences.
- Changing product quantities, totals, currency rules, order-success copy, or menu behavior outside a demonstrated regression fix.
- Replacing the existing order endpoint or changing unrelated order-request fields and consumers.
- Implementing any backend option before the user selects it.
- New checkbox dependencies when accessible React Native controls can be built from existing primitives/icons.
- Broad refactors, unrelated backend work, secrets, generated output, or ignored-planning-file edits.

## 4. Requirements breakdown

### 4.1 Requirement A — Preserve the M13 confirmation contract

- Keep the selected positive-quantity product summary and calculated total accurate.
- Keep modal close, Android back, scrolling, processing, success, error, retry, and session-expiry behavior.
- Keep the synchronous duplicate-submit lock and abort/late-response guards.
- Keep success responsible for notifying the host to reset consumed quantities.
- Keep failure/cancel responsible for preserving the current product selection.
- Do not rewrite passing code or change established result copy without a verified requirement.

### 4.2 Requirement B — Independent notification controls

- Render one SMS checkbox and one email checkbox in the confirmation form.
- Use clear user-facing labels matching the wireframe, such as `By Phone`/SMS and `By Email`, while retaining explicit SMS/email semantics in accessibility labels.
- Each checkbox toggles independently.
- Both begin unchecked for a new order.
- Toggling one never changes the other.
- Controls remain available in idle and retryable error states.
- Controls are disabled during processing and no longer actionable after success.

### 4.3 Requirement C — Accessible checkbox behavior

- Use `accessibilityRole="checkbox"` and `accessibilityState={{ checked, disabled }}` or the verified equivalent.
- The full label row should meet the minimum touch target and toggle one checkbox.
- Selected and unselected states must be visually distinct without color alone.
- Rapid taps must produce one deterministic final boolean state.
- Screen-reader labels must distinguish SMS from email.
- Focus order should follow summary, notification choices, total, and confirmation action logically.

### 4.4 Requirement D — Notification JSON contract gate

Official grading terminology requires these boolean fields in the order POST:

```json
{
  "sendSMS": false,
  "sendEmail": false
}
```

The backend now uses those same canonical JSON properties. The Java field `sendEmail` maps by default, while the Java field `sendSms` uses `@JsonProperty("sendSMS")` to preserve the capitalized acronym:

```json
{
  "sendSMS": false,
  "sendEmail": false
}
```

This contract has been selected by the user. Legacy `send_sms` and `send_email` HTTP keys are intentionally unsupported; the database column names remain snake case and are unaffected.

For every option, report:

- Exact client state names and transmitted JSON keys.
- Exact frontend/backend files and tests required.
- Benefits, risks, data behavior, backward compatibility, and grading alignment.
- Postman, database, regression, and manual verification burden.

Claude must stop after presenting the options. The user chooses. Only the recorded selection may be implemented. Existing consumers must remain compatible unless the user's selected option explicitly accepts a documented compatibility tradeoff.

### 4.5 Requirement E — Request-body accuracy

- `createOrder` accepts explicit booleans from the modal; missing/nonboolean values must not silently become true.
- Request construction remains in `orderService.js`, never the modal.
- Every order POST includes both final selected boolean values.
- Neither: false/false.
- SMS only: true/false.
- Email only: false/true.
- Both: true/true.
- Preserve existing `restaurant_id`, authenticated `customer_id`, and selected product mapping exactly.
- Token/customer identity remain inside the service/session boundary.

### 4.6 Requirement F — Submission timing and duplicate safety

- Capture/freeze the current notification values when a submission attempt starts.
- Disable both checkboxes and Confirm while processing.
- Do not allow a mid-flight toggle to create a mismatch between UI and request.
- A rapid double tap sends exactly one order POST.
- No separate notification request occurs before or after the order POST.
- A failed/aborted order must not display notification-delivery success.

### 4.7 Requirement G — Retry and reset behavior

- A retryable failure retains selected products and both notification choices.
- The user may adjust either checkbox before retrying.
- Retry sends the current visible choices, not stale values from the failed attempt.
- Closing without success preserves the same unsubmitted-order choices while the host preserves that order draft.
- Closing a confirmed success resets notification choices together with the consumed order/quantity state.
- A later fresh order begins false/false.
- Session expiry clears protected flow state through shared unauthorized handling.

### 4.8 Requirement H — Baseline versus extra-mile behavior

- Baseline completion is checkbox UI plus accurate booleans in `POST /api/orders`.
- Backend may act on a selected option only after it has successfully created the order.
- Provider failure must not be represented by the client as confirmed delivery.
- Direct Twilio/Notify.EU work and the supplied Email Template remain extra-mile scope requiring separate approval.
- Do not expose provider credentials or status details in the client.

### 4.9 Requirement I — Evidence and regression

- Verify all four boolean combinations in client request capture and Postman.
- Verify false defaults, independence, processing lock, failure preservation, retry changes, and success reset.
- Verify failed order creation does not create an order or imply notification success.
- Verify successful orders persist both booleans in DBeaver when available.
- Preserve Account, Courier, navigation, order history, and the complete M13 Customer flow.
- Append the required implementation-log record with options, user selection, final mapping, changed files, evidence, manual gaps, and technical-demo cue.

## 5. User flow and notification logic

### 5.1 Open a fresh confirmation

1. Customer selects positive product quantities and opens Order Confirmation.
2. Existing summary and total render.
3. SMS and email choices are both unchecked for the fresh order.
4. Confirm remains available under existing preconditions.

### 5.2 Choose notification options

1. Customer toggles SMS and email independently.
2. Visual checkmarks and accessibility checked states remain synchronized.
3. No network request occurs during toggling.
4. The modal holds the explicit booleans for the current unsubmitted order.

### 5.3 Submit successfully

1. Customer presses Confirm once.
2. Product and session preconditions are validated.
3. The current booleans are frozen for that attempt.
4. Checkboxes and Confirm disable while `Processing Order…` is displayed.
5. One `POST /api/orders` sends products plus both booleans using the user-selected contract.
6. A validated success enters the existing success state.
7. Closing success resets consumed quantities and notification choices.

### 5.4 Fail and retry

1. The order POST fails or returns malformed data.
2. Existing error feedback appears; product summary and notification choices remain.
3. Controls unlock.
4. Customer may retry unchanged or toggle either choice.
5. Retry sends exactly the now-visible choices through the same guarded path.

### 5.5 Cancel or abort

1. Closing before success sends no additional request and preserves the unsubmitted order draft.
2. Closing during processing aborts best-effort and ignores late responses.
3. No notification-specific success is shown for an aborted/failed order.

### 5.6 Session failure

1. HTTP 401/403 triggers shared unauthorized handling.
2. Stored Customer session and protected modal state are cleared.
3. Login replaces protected routes; retry cannot use the stale request.

## 6. Interfaces

### 6.1 Frontend component

- `client/components/OrderConfirmationModal.js` owns checkbox presentation/state, per-attempt snapshot, existing submission lifecycle, reset/preserve behavior, and accessibility.
- The Restaurant Menu host continues to own selected products, modal visibility, and success quantity reset.
- Notification controls do not move identity or request-body construction into the UI.

### 6.2 Service and session boundaries

- `client/services/orderService.js` validates boolean inputs and maps them to the user-selected final transport keys.
- `client/services/apiClient.js` retains JSON transport, timeout, abort, and base-URL responsibilities.
- `client/storage/authStorage.js` supplies current bearer token/customer ID at submission time.
- `client/contexts/AuthContext.js` supplies shared unauthorized handling.

### 6.3 Current backend baseline

The existing endpoint remains:

```http
POST /api/orders
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Current `ApiCreateOrderDTO` uses Jackson's default `sendEmail` name and `@JsonProperty("sendSMS")` on the Java `sendSms` field, with primitive boolean defaults of false. `OrderService.createOrder` stores both flags, creates the order/products, then invokes backend notification services only when the corresponding stored request flag is true.

The client sends:

```json
{
  "sendEmail": false,
  "sendSMS": false
}
```

Focused source-level testing covers camelCase acceptance, serialization, legacy-key behavior, and false defaults. Live testing of all four combinations and database persistence remains separate evidence.

### 6.4 Mandatory contract option record

Before implementation, Claude must add a dated option record to this spec containing:

- Verified acceptance/rejection of camelCase and snake_case JSON.
- Each viable minimum-change option and exact tradeoffs.
- The user's explicit selection.
- Final JSON request contract and compatibility behavior.
- Exact frontend and any selected backend files/tests.
- Success/error envelopes and 400/401/403/5xx behavior.
- Postman and database verification plan.

No notification-contract code change may precede the user's selection. If live access is unavailable, Claude may use source evidence to formulate options but must identify the unverified assumptions clearly.

**Resolved option record (2026-07-21; revised by explicit user selection).**

- **camelCase acceptance (before change):** `ApiCreateOrderDTO` maps `@JsonProperty("send_sms")`/`@JsonProperty("send_email")`; Spring Boot disables `FAIL_ON_UNKNOWN_PROPERTIES`, so camelCase `sendSMS`/`sendEmail` were **silently ignored** (no error, flags stayed false). snake_case is read correctly.
- **Options presented:** (A) backend `@JsonAlias("sendSMS")/("sendEmail")` — client sends camelCase, backend accepts camelCase + snake_case, backward compatible, +tests; (B) frontend-only — client transmits `send_sms`/`send_email` (wire keys not the official camelCase), no backend change; (C) backend rename to camelCase — breaks snake_case consumers, not backward compatible.
- **Initial selection:** Option A was implemented as an additive alias compatibility layer.
- **Revised user selection:** make camelCase canonical rather than retaining snake case as the primary property. `sendEmail` therefore uses its default Jackson name and `sendSms` uses `@JsonProperty("sendSMS")`; `@JsonAlias` is removed.
- **Final JSON contract:** `POST /api/orders` includes `"sendSMS"` and `"sendEmail"` booleans alongside `restaurant_id`, `customer_id`, and `products`. The two notification values default to `false`. `send_sms`/`send_email` are no longer accepted HTTP keys. Client UI state and `orderService.js` remain camelCase with a strict `=== true` check.
- **Server files:** `dtos/order/ApiCreateOrderDTO.java`; focused DTO contract tests and the existing controller camelCase test. No new endpoint/DTO/service, and no database column change.
- **Envelopes/errors:** success `201 { message:"Success", data: <order> }`; invalid product/body `400`; `401/403` unauthorized (client routes to shared sign-out); `5xx` service. Unchanged from M13.
- **Verification:** focused DTO tests cover canonical input/output, ignored legacy keys, and default false. Postman has all four camelCase combinations. Full integration, DBeaver persistence, and native checkbox interaction remain operator checks for this revision.

### 6.5 Postman and database evidence

- Add four create-order requests/examples or one clearly parameterized request with four saved examples.
- Each body must contain the correct two booleans plus a valid restaurant/customer/product selection.
- Use disposable orders and collection variables; commit no bearer token, password, live URL, or provider secret.
- Check `send_sms`/`send_email` persistence or their user-selected final storage mapping in DBeaver.
- Provider delivery is not required baseline evidence.

## 7. Data, validation, and state

### 7.1 Client notification model

```js
{
  sendSMS: false,
  sendEmail: false,
}
```

- Both values are literal booleans.
- UI state remains camelCase regardless of the selected transport spelling.
- Service mapping is the only transport-name boundary.

### 7.2 Request input

`createOrder` receives a shape equivalent to:

```js
{
  restaurantId,
  selectedProducts,
  sendSMS,
  sendEmail,
  signal,
}
```

- Missing or nonboolean notification values are rejected or handled exactly according to the user-selected documented contract; never coerce truthy strings.
- Existing restaurant/product/session validation remains unchanged.

### 7.3 Modal state

- Submission: `idle`, `processing`, `success`, or `error`.
- Notification draft: independent `sendSMS` and `sendEmail`.
- Submission snapshot: immutable pair captured for one pending attempt.
- Duplicate lock and abort controller remain separate refs because they guard synchronous/release behavior.

The design must prevent contradictory states such as editable checkboxes during processing, success with an unconsumed order, or visible choices differing from the request in flight.

### 7.4 Reset matrix

| Event | Products | Notification choices |
|---|---|---|
| Fresh order | Current new selection | false / false |
| Retryable failure | Preserve | Preserve |
| Toggle after failure | Preserve | Use new visible choices |
| Close before success | Preserve | Preserve with same draft |
| Confirmed success close | Reset through host | Reset false / false |
| Logout/session expiry | Protected state cleared | Cleared |

### 7.5 Error rules

- Existing `unauthorized`, `invalid`, `service`, `response`, `connection`, and `aborted` classifications remain.
- Invalid notification values fail before fetch without destroying the order draft.
- Raw backend/provider errors, tokens, credentials, phone numbers, and email addresses must not be logged or shown.
- Provider warnings/failures are not a separate mobile result state in baseline scope.

## 8. Expected behavior

- Both notification choices start unchecked for a fresh order.
- SMS and email can be selected independently in all four combinations.
- Visible checkbox state, accessibility state, service arguments, and transmitted booleans agree.
- Every order POST contains both boolean fields under the user-selected final contract.
- One confirmation action creates at most one order.
- Choices cannot change while that request is pending.
- Failure preserves products and choices; retry uses the latest visible choices.
- Successful close resets both choices with the consumed order.
- No second notification request or direct provider integration exists in the baseline client.
- M13 summary, total, result copy, retry, close, quantity reset, and session behavior remain correct.
- Failed/aborted orders never imply successful notification delivery.

## 9. Technical constraints

- Claude must read the global spec, this full spec, retained M13 confirmation spec, `client/AGENTS.md`, and `client/CLAUDE.md` before edits.
- Audit current modal and service before changing them; preserve passing M13 behavior.
- Consult exact Expo SDK 54/React Native accessibility guidance required by `client/AGENTS.md` before checkbox implementation.
- Use existing React Native primitives, icons, theme, JavaScript, Context, session, and API-client patterns.
- Add no checkbox/state dependency without explicit approval.
- Present contract options and wait for the user's selection; do not choose JSON compatibility policy independently.
- Keep client state camelCase and perform selected transport mapping once in `orderService.js`.
- Preserve the existing order endpoint and backward compatibility unless the selected option explicitly documents otherwise.
- Do not expose secrets or add provider configuration to `EXPO_PUBLIC_*`.
- Do not stage, commit, merge, push, or mutate external systems without explicit user authorization.

## 10. Acceptance criteria

### 10.1 Contract gate

- [x] CamelCase and legacy snake-case behavior is verified from source-level tests. (`ApiCreateOrderDTODeserializationTest`: canonical camelCase maps, legacy snake-case notification keys do not map, missing → false; historical behavior is documented in §6.4.)
- [x] Claude presents viable minimum-change options with exact contract/file/test/tradeoff details. (Options A/B/C presented with tradeoffs.)
- [x] The user's initial and revised selections are recorded before their respective implementations. (Initial alias option and subsequent canonical-contract revision are recorded in §6.4.)
- [x] Final JSON keys, compatibility behavior, success/errors, and persistence are documented. (§6.4 + ai-spec §10.5 + README record.)
- [x] The selected backend change is minimal and documented in the global spec and README. (`sendEmail` uses its default property and `sendSms` has one `@JsonProperty("sendSMS")`; the intentional snake-case compatibility break is explicit.)
- [x] Postman contains all four nonsecret request combinations. (neither / SMS only / email only / both, camelCase keys.)

### 10.2 Checkbox behavior

- [x] A fresh order starts with SMS and email unchecked. (`useState(false)`; reset to false on success-close so the next fresh order is false/false.)
- [x] Each checkbox toggles independently and all four combinations are reachable. (Separate `sendSMS`/`sendEmail` state; each `onToggle` flips only its own value.)
- [x] Visual and accessibility checked states agree. (`accessibilityState={{ checked }}` uses the same `checked` value driving the filled box + check icon.)
- [ ] Checkbox rows meet touch-target, label, focus, and iOS/Android interaction requirements. (`minHeight` = 48 touch target, labels + a11y labels present; **native interaction/focus test pending**.)
- [x] Processing/success disables notification changes. (`disabled={isProcessing}` on each row; checkboxes are not rendered in the success state.)

### 10.3 Request accuracy

- [x] Every order POST contains both selected boolean values under the final contract. (`buildCreateOrderRequestBody` always includes `sendSMS` and `sendEmail`.)
- [x] Neither sends false/false. (Default state + strict `=== true` mapping.)
- [x] SMS only sends true/false.
- [x] Email only sends false/true.
- [x] Both sends true/true. (All four combinations produced by the modal's independent state → service body.)
- [x] Existing restaurant/customer/product/token mapping remains correct. (Unchanged `restaurant_id`, session `customer_id`, product mapping, bearer token.)
- [x] Missing/nonboolean service inputs cannot silently produce true values. (`sendEmail: sendEmail === true`, `sendSMS: sendSMS === true` — only an explicit boolean true is sent as true.)

### 10.4 Submission, retry, and reset

- [x] Rapid duplicate confirmation sends one request. (`submitLockRef` synchronous lock, preserved from M13.)
- [x] Pending UI displays existing processing wording and freezes choices. (`Processing Order…`; checkboxes `disabled={isProcessing}`; values frozen into `notifyBySMS`/`notifyByEmail` at submit.)
- [x] Retryable failure preserves products and choices. (Error state resets nothing; choices reset only on success-close.)
- [x] Changes made after failure are reflected in the retry body. (`handleConfirmOrder` reads current `sendSMS`/`sendEmail` on each attempt.)
- [x] Closing before success preserves the same unsubmitted-order draft. (Choices reset only when `wasOrderCreated`; the open effect resets submission state only, not choices.)
- [x] Closing success resets quantities and choices; the next fresh order is false/false. (`handleClose` on success calls `onOrderCreated` and sets both choices false.)
- [x] Session expiry clears protected flow and stale responses do not update it. (401 → `handleUnauthorized`; abort guards ignore late responses — unchanged M13.)

### 10.5 Baseline boundaries

- [x] No separate client notification request exists. (`createOrder` is the only call; both booleans travel in that POST.)
- [x] No provider secret or direct Twilio/Notify.EU integration exists in the mobile client. (None added.)
- [x] Failed/aborted order creation does not display notification success. (Error/aborted paths show only the existing failure state; no notification-specific success.)
- [x] Baseline completion does not claim actual message delivery. (Success copy is the unchanged "Your order has been received.")
- [x] Email Template/provider work remains outside baseline scope. (Untouched.)

### 10.6 UI and regression

- [ ] Modal matches the M14 notification wireframe while retaining M13 summary/total/results. (Checkboxes + labels added; M13 summary/total/result copy unchanged; **wireframe-visual comparison pending**.)
- [ ] Long summary and notification controls remain scrollable/reachable on small screens. (Summary scrolls; checkboxes/total/confirm fixed in the footer; **native small-screen test pending**.)
- [ ] Close, Android back, cancel, retry, success, and quantity-reset behavior do not regress. (M13 lifecycle untouched; **native regression pending**.)
- [ ] Restaurant Menu and Order History remain correct. (No changes to those screens; **native pending**.)
- [ ] Navigation, Account, Courier Delivery, and logout/session behavior do not regress. (No changes to those; **native pending**.)

### 10.7 Persistence and failure evidence

- [ ] Postman verifies four successful valid bodies. (Four requests added; **not executed by the agent — operator run pending**.)
- [ ] DBeaver verifies both persisted booleans for representative disposable orders. (**Operator pending**.)
- [x] Invalid product, unavailable service, malformed response, timeout, and 401/403 behaviors are verified. (Invalid product → 400 (`testCreateOrder_Failure_InvalidData`); service/response/connection/aborted/unauthorized use the unchanged, already-working M13 `createOrder` classification.)
- [x] Provider delivery is not required or claimed as baseline evidence.

### 10.8 Repository and platform verification

- [x] `git diff --check` passes.
- [ ] Focused/full backend tests pass if the user-selected option changes server code. (Focused contract verification for the canonical-contract revision is pending in this record.)
- [x] `npm ls --depth=0` reports no invalid dependency.
- [x] `npx expo config --type public` succeeds without secrets.
- [x] `npx expo export --platform android` succeeds and generated output is removed. (EXIT 0; `dist/` removed.)
- [ ] Representative iOS/Android checkbox, keyboard, scroll, submit, retry, and reset scenarios pass. (**Native run pending**.)
- [x] Final diff contains no unselected/undocumented backend edit, secret/live URL, private log, generated output, or unrelated change. (The canonical camelCase DTO change is documented; `.omi/` remains gitignored.)

Claude must leave criteria unchecked until current evidence supports them. Source inspection/export do not prove native behavior, live acceptance, provider delivery, or database persistence.

## 11. Feature Definition of Done

- [ ] Every graded Order Confirmation criterion has current evidence. (Code + backend criteria evidenced; **native checkbox/wireframe/DBeaver items pending**.)
- [x] Claude presented the casing consequences and implemented the user's revised selection: canonical `sendEmail`/`sendSMS`, without legacy snake-case aliases.
- [x] Both checkboxes work independently, accessibly, and accurately in all four combinations. (Independent state + a11y checkbox role/state; all four combos map to the request. **Native a11y run pending.**)
- [x] Every order POST contains both correct booleans through one documented service mapping. (`orderService.buildCreateOrderRequestBody` — single mapping boundary, camelCase.)
- [x] Existing order creation, duplicate protection, failure/retry, success, close, reset, and session behavior pass. (M13 lifecycle preserved; **native regression pending**.)
- [x] Failure preserves choices and success resets them with the order state. (Reset only on success-close.)
- [x] Baseline client sends no separate notification request and makes no unsupported delivery claim. (Booleans in the order POST only; success copy unchanged.)
- [x] Postman/database/native evidence is recorded honestly and unavailable checks remain unchecked. (Four Postman requests added but marked not-run; DBeaver/native pending.)
- [ ] M13 Customer flow plus Navigation, Account, Courier Delivery, and Order History regressions pass. (Backend green; **native regression pending**.)
- [x] Global spec, this spec, README when applicable, Postman, and private implementation log match final behavior.
- [x] Complete diff contains no dead code, debug output, artifact, secret, unselected backend change, or unrelated edit.
- [x] Claude's handoff includes outcome, selected option, exact files/final contract, checks/results, manual gaps, scoped stage command, and copy-ready commit command. (See session handoff.)

## 12. Notes for AI tools

- Claude is the implementation and verification agent for this specification.
- Read all required specs/instructions and inspect the complete current order flow before edits.
- Preserve the M13 modal; add the smallest cohesive notification extension.
- Investigate `sendSMS`/`sendEmail` versus `send_sms`/`send_email`, present options, and stop for the user's selection.
- Do not decide the transport compatibility approach or edit server/client notification mapping before selection.
- Keep UI state camelCase; centralize the selected transport mapping in `orderService.js`.
- Test all four combinations and preserve duplicate, abort, retry, reset, and unauthorized behavior.
- Do not implement or claim direct provider delivery as baseline work.
- Do not claim live/Postman/database/native results unless observed.
- If runtime access is unavailable, complete independent analysis and name every remaining gap.
- Append the final dated report to `.omi/m14/IMPLEMENTATION_LOG.md`; never stage it.
- Do not stage, commit, merge, or push.
- Finish with outcome, user-selected option, exact files/contract, checks/results, manual gaps, scoped `git add`, and a copy-ready Conventional Commit command.
