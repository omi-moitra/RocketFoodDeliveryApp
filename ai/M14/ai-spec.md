# Rocket Food Delivery Mobile App — Module 14 Global AI Specification

> **Claude implementation contract:** Claude will run and implement the Module 14 feature specifications. Before changing files, Claude must read this entire document, then the exact feature specification under `ai/M14/features/`, then every repository instruction file governing the files it may touch. This specification extends the completed Module 13 customer app; it does not authorize replacing it.

Treat every statement containing **must**, **must not**, **only**, **exactly**, or **do not** as a hard constraint. Treat target paths as planned until repository inspection confirms them. When a decision-critical fact is absent or conflicts with current evidence, Claude must stop that decision, report the evidence, and request resolution instead of guessing.

## Table of Contents

1. [Document authority](#1-document-authority)
2. [Project identity](#2-project-identity)
3. [Goal and scope](#3-goal-and-scope)
4. [Users and required journeys](#4-users-and-required-journeys)
5. [Required feature specifications](#5-required-feature-specifications)
6. [Technology and constraints](#6-technology-and-constraints)
7. [Repository architecture](#7-repository-architecture)
8. [Navigation architecture](#8-navigation-architecture)
9. [Authentication, roles, and storage](#9-authentication-roles-and-storage)
10. [Backend API contract](#10-backend-api-contract)
11. [UI and design rules](#11-ui-and-design-rules)
12. [Cross-feature behavior rules](#12-cross-feature-behavior-rules)
13. [Naming and organization conventions](#13-naming-and-organization-conventions)
14. [File documentation and comments](#14-file-documentation-and-comments)
15. [Error, loading, and state rules](#15-error-loading-and-state-rules)
16. [Environment variables and secrets](#16-environment-variables-and-secrets)
17. [Specification-driven workflow](#17-specification-driven-workflow)
18. [Git and commit workflow](#18-git-and-commit-workflow)
19. [Development and phone-testing commands](#19-development-and-phone-testing-commands)
20. [Testing and verification strategy](#20-testing-and-verification-strategy)
21. [Documentation and submission rules](#21-documentation-and-submission-rules)
22. [Rules for AI tools](#22-rules-for-ai-tools)
23. [Global Definition of Done](#23-global-definition-of-done)

## 1. Document authority

This committed document is Claude's self-contained implementation contract for Module 14. It consolidates the official grading requirements, business rules, teaching guidance, and planning research used during drafting so implementation does not depend on ignored source files. It is subordinate to the current official grading checklist and explicit coach clarification; it cannot overrule either authority.

Use this authority order when sources conflict:

1. The current official Module 14 grading checklist and explicit coach clarification — final grading and product authority.
2. `ai/M14/ai-spec.md` — self-contained global implementation contract after official requirements have been reconciled into it.
3. The relevant exact feature specification under `ai/M14/features/` — executable feature contract; it may narrow this document but may not contradict it.
4. `support_materials_14/Wireframe.pdf` and `support_materials_14/Email Template.pdf` — supplied visual references, subject to checklist scope and explicit coach clarification.
5. `ai/M13/ai-spec.md` and the eight M13 feature specifications — retained customer behavior and established conventions.
6. `client/AGENTS.md` and `client/CLAUDE.md` — committed client-scoped working instructions; they govern how tools work in `client/`, not product requirements.
7. Existing repository code — implementation reality, but not permission to contradict a higher-priority requirement.

When a checklist revision or explicit coach clarification changes a requirement, stop the affected implementation decision, reconcile the change into this document and every affected feature specification, and then resume from the updated committed contracts. Ignored planning material remains drafting/audit evidence rather than a hidden runtime dependency.

For each conflict, Claude must quote or identify both conflicting sources, state which file/behavior is blocked, and continue only with independent work that cannot prejudice the decision. Claude must not silently choose a convenient interpretation, invent a requirement, or broaden permission.

### 1.1 Known contract mismatches requiring verification

The following conflicts are explicit implementation gates. Claude must prefer a frontend service adapter when the existing backend can satisfy the requirement safely. When verified evidence proves that the frontend cannot meet a required behavior without data loss, unsafe guesses, or a missing operation, Claude may make the smallest backend adjustment that closes only that gap. The discrepancy, rejected frontend-only option, exact backend and frontend changes, compatibility impact, and verification must be documented in this file and `README.md` before the change is treated as complete:

- The grading sheet requires `GET /api/account/{id}?type={user_type}`. The current controller exposes `GET /api/account/{id}` without a `type` query.
- The grading sheet labels the account update as a POST to `/api/account/{id}`. The current controller exposes `PUT /api/account/{id}?type={type}`.
- The grading sheet names order fields `sendSMS` and `sendEmail`. The current Java DTO explicitly maps snake-case JSON fields `send_sms` and `send_email`.
- The current order API separates courier assignment from a broad order update whose DTO requires unrelated order fields. The project decision fixes the operation order, but the Courier feature must still verify and document the exact safe request bodies and responses before implementation. **Resolved:** a status-only `PUT /api/order/{id}/status` endpoint was added (minimum-change policy) so a status change never round-trips `restaurant_rating`; see §10.4 and the README backend-adjustment record.

The grading checklist also contains a generic instruction to create a new private repository, while the M14 business brief and coach walkthrough explicitly describe this module as a continuation of the M13 repository. The confirmed project decision is to continue in the existing M13 repository and not create a second repository.

For each resolved gate, Claude must update the relevant feature specification with the official requirement, verified existing-backend method, path, query, request body, response envelope, error behavior, and evidence source. First define the safest frontend-only adaptation. If that is insufficient, record why, identify the minimum backend adjustment and smallest affected file set, update this file and `README.md`, add focused backend tests, then update the frontend service boundary to the resulting verified contract. Do not use this exception for cleanup, renaming, broad refactoring, speculative hardening, or unrelated API redesign.

### 1.2 Confirmed project decisions

- Continue the existing M13 repository for M14.
- Prefer frontend service adapters, but permit the minimum backend adjustment when verified frontend requirements cannot otherwise be implemented safely. Every adjustment must be narrowly scoped, tested, and documented in this specification, the relevant feature spec, `README.md`, Postman when API-facing, and the private implementation log.
- For a pending delivery acceptance, update the order to status ID 2 and then assign the active courier. On the courier's later status action, update the assigned order to status ID 3. Verify the safe HTTP bodies/responses before coding.
- Status IDs are confirmed as `1 = PENDING`, `2 = IN PROGRESS`, and `3 = DELIVERED`.
- Repair dirty status-2/status-3 rows with null courier IDs by assigning a valid courier; do not expose an unassigned non-pending row as eligible work.
- Use separate role routes backed by one shared Account screen/form/service implementation.
- Delivery Details follows the supplied wireframe field set and does not add unsupported personal fields.
- A pending status request displays `Updating…`, not the ambiguous status label `In Progress`.
- The two-pass AI/specification workflow remains development guidance from the coach transcript, but iteration evidence is not a grading deliverable.

## 2. Project identity

- **Project name:** Rocket Food Delivery Mobile App
- **Module:** Full-Stack Development Module 14 — Mobile Development 2
- **Project type:** Cross-platform customer and courier mobile application
- **Frontend:** React Native with Expo and Expo Router
- **Backend:** Existing Spring Boot REST API continued from Modules 12 and 13
- **Database:** MySQL through the Java backend
- **Authentication:** Email/password login with JWT-protected API requests
- **Primary users:** Customers and couriers
- **Repository strategy:** Continue the existing repository and extend the existing Expo application

Claude's implementation objective is to preserve the full Module 13 customer journey while adding role-aware login/navigation, a Courier application, shared account management, and customer notification preferences. Existing working behavior is a regression baseline, not disposable starter code.

## 3. Goal and scope

### 3.1 Goal

Implement a role-aware iOS and Android application by extending the working client in place. A completed implementation lets each supported account type reach only its permitted experience, preserves all M13 customer flows, and persists every required API/database mutation without fabricating success.

### 3.2 In scope

- Preserve every completed M13 customer flow and its verified behavior.
- Detect customer-only, courier-only, and dual-role login responses.
- Route single-role users directly to the correct app.
- Show Account Selection only to dual-role users.
- Add Customer tabs for Restaurants, Order History, and Account.
- Add Courier tabs for Order Delivery and Account.
- Display all pending orders to couriers plus only the active courier's assigned in-progress and delivered orders.
- Progress delivery status from `PENDING` to `IN PROGRESS` to `DELIVERED` and lock delivered orders.
- Display delivery details in a scrollable modal.
- Display read-only user email and editable role email/phone for customers and couriers.
- Add independent SMS and email choices to customer order confirmation.
- Match the supplied M14 wireframes, Rocket Food palette, Arial/Oswald typography, persistent authenticated header/footer, and scrolling rules.
- Update specifications, Postman evidence, README, concepts, LeetCode evidence, videos, and submission artifacts for M14.

### 3.3 Out of scope

- Replacing or creating a new repository for Module 14.
- Rebuilding working M13 functionality without a demonstrated need.
- Backend changes that do not pass the minimum-change gate or are not documented and tested as required.
- Employee or restaurant-owner mobile applications.
- A default role guess for a dual-role user.
- Editing the base user email from the mobile Account screen.
- Skipping status stages, reversing a delivery status, or changing a delivered order.
- A separate client notification request after order creation or baseline direct integration with Twilio/Notify.EU.
- Storing secrets in client code or `EXPO_PUBLIC_*` values.
- Extra-mile rating or Google Maps work before all baseline requirements pass and receive coach review.

## 4. Users and required journeys

### 4.1 Users

- **Customer:** Browses and filters restaurants, views menus, selects quantities, requests optional confirmations, creates orders, reviews order history/details, manages customer contact details, and logs out.
- **Courier:** Reviews eligible deliveries, accepts/progresses assigned work, opens delivery details, manages courier contact details, and logs out.
- **Dual-role user:** Chooses Customer or Courier after login and receives only the selected role's navigation, identity, and data.

### 4.2 Authentication journeys

```text
Valid login
├── customer_id only → Customer app
├── courier_id only  → Courier app
└── both IDs         → Account Selection → chosen role app
```

An authenticated user with neither supported role is an invalid session state. Show a safe error, clear unusable session data, and do not guess a destination.

### 4.3 Customer journey

`Login` → optional `Account Selection` → `Restaurants` → `Filters` → `Restaurant Menu` → `Quantity Selection` → `Order Confirmation + Notification Choices` → `Success/Failure` → `Order History` → `Order Details`

The Customer Account tab is reachable throughout the authenticated customer area.

### 4.4 Courier journey

`Login` → optional `Account Selection` → `Order Delivery` → `Eligible Deliveries` → `Status Progression` and/or `Delivery Details`

The Courier Account tab is reachable throughout the authenticated courier area.

## 5. Required feature specifications

Claude must implement one feature specification at a time, in the order requested by the user. Create and use these seven exactly named Module 14 feature specifications:

1. `ai/M14/features/navigation-structure.feature.md`
2. `ai/M14/features/role-based-navigation.feature.md`
3. `ai/M14/features/courier-delivery.feature.md`
4. `ai/M14/features/account-details.feature.md`
5. `ai/M14/features/order-confirmation-modal.feature.md`
6. `ai/M14/features/ui.feature.md`
7. `ai/M14/features/code-quality.feature.md`

#### Authoring status

**Feature specifications authored: 3 of 7.** Authored so far: `navigation-structure.feature.md`, `role-based-navigation.feature.md`, and `courier-delivery.feature.md`. The remaining four are planned targets, not existing files, and the Section 7 tree lists them as such. `ai/M14/features/feature-name.feature.md` is the placeholder template to copy when authoring a new spec; it is a scaffold, not a deliverable, and is not counted.

Whenever Claude authors (or finishes) one of the seven specifications, it must increment this counter and move the file name into the "authored so far" list in the same change, so the count always matches reality. Do not raise the count for a stub; a spec counts as authored only when it satisfies the required contents below and its feature-specific Definition of Done.

Each feature file is a direct prompt for Claude and must contain:

- Feature goal and explicit in/out scope.
- Requirement breakdown and complete user flow.
- Routes, pages, components, contexts, services, storage, and endpoints involved.
- Confirmed request/response fields, validation, state transitions, and expected behavior.
- Loading, empty, error, retry, duplicate-action, and session-expiry behavior where applicable.
- Exact allowed implementation files plus files that must only be inspected.
- Decision gates that tell Claude when to stop rather than guess.
- Testable acceptance criteria tied to grading rows and the evidence required to mark each item complete.
- A feature-specific Definition of Done.
- A required Claude handoff: changed files, verification commands/results, unresolved manual checks, and narrowly scoped staging/commit commands.

The eight specifications under `ai/M13/features/` remain regression contracts for retained Module 13 behavior unless an M14 requirement explicitly extends one. Claude must inspect the relevant M13 implementation/spec before editing a shared surface and must not weaken its acceptance criteria.

> **Submission paths (coach-confirmed).** The grading sheet names generic paths `ai/ai-spec.md` and `ai/features/*.feature.md`. The coach has confirmed that the module-organized paths used here — `ai/M14/ai-spec.md` and `ai/M14/features/*.feature.md` — are the accepted submission source for this repository. Author and submit at the `ai/M14/` paths only. Do not promote copies to the generic root paths and do not create divergent duplicate copies.

## 6. Technology and constraints

### 6.1 Current frontend baseline

- Expo SDK 54 (`expo ~54.0.34`), retained from the coach-approved M13 baseline.
- React Native 0.81.5.
- React 19.1.0.
- JavaScript; do not introduce TypeScript halfway through without an explicit project decision.
- Expo Router for file-based Stack and Tab layouts.
- AsyncStorage for persisted session and active-role data.
- `@expo-google-fonts/oswald` for Oswald.
- FontAwesome/vector icons for native UI icons.
- Shared environment-driven API URL.
- ngrok for physical-phone access to the local Java API.
- React Bootstrap may remain installed because it is a grading/dependency requirement, but browser-only DOM components must not be used in native screens.

### 6.2 Backend baseline

- Java 17.
- Spring Boot 3.5.11.
- Spring Security with stateless JWT protection for `/api/**`.
- MySQL 8.x connector.
- Maven Wrapper through `server/mvnw`.
- Existing API is consumed as-is by default. A backend adjustment is allowed only after verified evidence shows a frontend adapter cannot satisfy a required behavior safely; use the smallest compatible change and document it in this specification and `README.md`.

### 6.3 General constraints

- The app must work on iOS and Android through Expo.
- Protected requests use `Authorization: Bearer <accessToken>`.
- The active role determines routes, role ID, account fields, and courier/customer requests.
- Tokens and passwords never travel in route parameters.
- All quantities are non-negative integers controlled only by buttons.
- Currency uses two decimal places.
- All overflowing pages and modals are scrollable.
- Shared behavior belongs in reusable components, services, storage helpers, contexts, constants, or utilities rather than duplicated route files.

## 7. Repository architecture

Target combined structure; Claude must compare it with `rg --files` before every feature. Existing paths are implementation reality, while missing paths are authorized targets only when the active feature specification owns them:

```text
M13-rocketFoodDelivery/
├── ai/
│   ├── M13/
│   │   ├── ai-spec.md
│   │   └── features/
│   └── M14/
│       ├── ai-spec.md
│       └── features/
│           ├── navigation-structure.feature.md
│           ├── role-based-navigation.feature.md
│           ├── courier-delivery.feature.md
│           ├── account-details.feature.md
│           ├── order-confirmation-modal.feature.md
│           ├── ui.feature.md
│           └── code-quality.feature.md
├── client/
│   ├── app/
│   │   ├── _layout.js
│   │   ├── index.js
│   │   ├── selection.js
│   │   ├── customer/
│   │   │   ├── _layout.js
│   │   │   ├── account.js
│   │   │   ├── order-history.js
│   │   │   └── restaurant/
│   │   │       ├── _layout.js
│   │   │       ├── index.js
│   │   │       └── [restaurantId].js
│   │   └── courier/
│   │       ├── _layout.js
│   │       ├── index.js
│   │       └── account.js
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── services/
│   ├── storage/
│   ├── utils/
│   ├── images/restaurants/
│   ├── assets/
│   ├── .env.example
│   ├── AGENTS.md
│   └── CLAUDE.md
├── server/                     # Existing Java API; changes require separate authority
├── scripts/ngrok-phone.sh
├── support_materials_13/
├── support_materials_14/
├── LeetCode-Challenges/
├── README.md
├── RESEARCH.md
├── CONCEPTS.md
└── PostmanCollection.json
```

This tree distinguishes existing and planned paths. The seven feature files under `ai/M14/features/` are shown as planned targets; only those counted as authored in Section 5 exist today, alongside the `feature-name.feature.md` template scaffold. Claude must update this tree when an authorized implementation creates, removes, or renames a listed path. Do not claim a target file exists before it does, and do not create a target merely to make the tree appear correct.

### 7.1 Responsibility boundaries

- `app/`: Expo Router route entry points and layouts; Claude keeps business/API logic thin and delegates reusable work below.
- `components/`: Reusable visual behavior such as Account form, delivery row, status control, detail modal, result states, header, and order confirmation.
- `contexts/`: Authenticated identity, available roles, active role, session restore, and logout orchestration.
- `services/`: Shared API client and domain-specific request functions; normalize untrusted backend data here before UI consumption.
- `storage/`: Central AsyncStorage keys and validated read/write/clear helpers.
- `constants/`: Theme, typography, status mappings, currency, and stable configuration.
- `utils/`: Pure validation and formatting helpers that do not own requests, storage, or rendered state.

Before adding a file, Claude must search for an existing owner with `rg --files` and `rg`. Reuse or extend an existing module when its responsibility already matches; do not force reuse when it would merge unrelated responsibilities.

## 8. Navigation architecture

### 8.1 Root stack

- Claude must preserve `client/app/_layout.js` as the single owner of session restoration and the protected navigation boundary.
- It manages Login, Account Selection, Customer, and Courier destinations.
- Render a neutral loading state until AsyncStorage restoration finishes; do not briefly expose Login or protected content.
- Successful single-role login replaces Login with the corresponding role app.
- Successful dual-role login replaces Login with Account Selection.
- Logout clears all session/role data and replaces the protected route with Login.
- Invalid/expired sessions cannot use the back button to return to protected screens.

### 8.2 Account Selection

- `client/app/selection.js` is available only when both `customer_id` and `courier_id` exist.
- Customer persists `activeRole = customer`; the root guard then exposes Customer tabs.
- Courier persists `activeRole = courier`; the root guard then exposes Courier tabs.
- Do not default to one role or expose this screen to a single-role user.
- Claude must prevent duplicate choice writes and must not pass tokens or identity through route parameters.
- Match the supplied Account Selection wireframe: it has no role-specific tab footer or authenticated role-app header. Login and Account Selection are the two root destinations without role-app chrome; the shared logo/logout header and role footer begin only after Customer or Courier is selected.
- If an explicit coach clarification later requires a logout control or other authenticated chrome on Account Selection, reconcile that decision into this section and the navigation/UI feature specs before implementation.

### 8.3 Customer tabs

- `client/app/customer/_layout.js` contains the checklist tab labels Restaurants, Order History, and Account, in that order.
- Preserve the nested Restaurant Stack at `client/app/customer/restaurant/_layout.js`.
- Restaurant list and menu remain below the Restaurants tab.

### 8.4 Courier tabs

- `client/app/courier/_layout.js` contains Order Delivery and Account.
- Order Delivery is the courier entry screen.
- Customer routes must not appear in the Courier tab navigator.

### 8.5 Route protection

- A customer active role cannot enter Courier routes directly.
- A courier active role cannot enter Customer routes directly.
- Account Selection requires both supported role IDs.
- A restored active role must still exist in the restored role IDs.
- Role changes must occur through an authorized selection flow, not arbitrary route parameters.
- Guards must fail closed: an inconsistent session exposes no role application and is cleared or routed to Login according to the active feature contract.

## 9. Authentication, roles, and storage

### 9.1 Required session values

Centralize storage for:

- `accessToken`
- `userId`
- optional `customerId`
- optional `courierId`
- `activeRole` after direct routing or user selection

Never store the password. Never log the token.

### 9.2 Confirmed login response

`POST ${API_BASE_URL}/api/auth` returns fields used by the client:

- `success`
- `accessToken`
- `user_id`
- nullable/optional `customer_id`
- nullable/optional `courier_id`

### 9.3 Role derivation

- Non-null customer ID only: activate `customer` and route directly.
- Non-null courier ID only: activate `courier` and route directly.
- Both IDs: keep `activeRole` unset until Account Selection.
- Neither ID: reject the session as unsupported.
- Never derive role from email, hard-coded user IDs, or a route name.

### 9.4 Storage rules

- Define every storage key once, in a single module.
- Await storage reads/writes/clears that affect navigation or requests.
- Validate restored values as one coherent session, not as independent trusted strings.
- Clear all identity and role data on logout or invalid authentication, and remove a previous user's stale keys before exposing a new session.
- Treat corrupt/incomplete data as logged out.
- On protected-request authentication failure, clear stale session data and return to Login with a safe message.
- Test restoration for customer-only, courier-only, unselected dual-role, selected dual-role, partial, corrupt, and logged-out states.

## 10. Backend API contract

`${API_BASE_URL}` is the configured server origin. On a physical phone it is normally an ngrok HTTPS URL forwarding to local port 8080. All calls below except login are protected by the bearer token. Claude must keep request construction in services, map backend keys at the service boundary, and never let a screen invent a fallback response.

### 10.1 Retained M13 calls

- `POST /api/auth`
- `GET /api/restaurants` with optional `rating` and `price_range`
- `GET /api/products?restaurant={restaurantId}`
- `POST /api/orders`
- `GET /api/orders?type=customer&id={customerId}`

Keep the detailed M13 request, mapping, formatting, and failure rules in `ai/M13/ai-spec.md` unless M14 explicitly changes them.

### 10.2 Account retrieval and update

Official required retrieval URL:

```text
GET /api/account/{userId}?type={user_type}
```

Official required update path:

```text
/api/account/{userId}
```

Before Claude edits Account client behavior, the Account feature spec must record:

- Confirmed retrieval query values (`customer`, `courier`) and whether the live API accepts them.
- Confirmed update HTTP method and whether `type` is a query value or body field.
- Exact body keys for role email and phone.
- Response envelope and field names for base user email, role email, and role phone.
- Validation and error responses.

The current repository suggests a read-only base email plus role-specific nested data, and a PUT update using body fields `email` and `phone`; this is implementation evidence, not permission to override the official contract without resolution. If live evidence differs, Claude must update the spec first and identify the evidence in its handoff.

### 10.3 Courier delivery retrieval

Required visible set:

```text
all PENDING orders
+ current courier's IN PROGRESS orders
+ current courier's DELIVERED orders
```

The current backend exposes:

- `GET /api/orders/pending`
- `GET /api/orders?type=courier&id={courierId}`

If both calls are verified and used, Claude must merge and deduplicate by order ID at the service boundary. Re-check eligibility after refresh and status changes. Do not expose another courier's assigned non-pending delivery, even briefly through stale state.

Coach-walkthrough evidence warns that seed data may contain status-2 or status-3 orders with a null courier ID. Repair each dirty row by assigning a valid courier through a controlled data/API correction. Until repaired, treat it as ineligible rather than inferring assignment from status; afterward, it appears only for its assigned courier. Verify the live response shapes before finalizing the filter.

The Courier Delivery feature spec must define the Delivery Details modal's minimum wireframe fields: status, delivery address, restaurant, order date, line items, quantity, item price, and total. Do not add customer or courier personal fields unless an authoritative requirement explicitly demands them and the API safely supplies them.

### 10.4 Courier assignment and status update

Before Claude implements a status control, the verified feature spec must document the exact sequence for:

- Assigning the active courier when a pending order becomes in progress.
- Mapping status names to the backend's accepted status values or IDs.
- Persisting `PENDING` → `IN PROGRESS`.
- Persisting `IN PROGRESS` → `DELIVERED`.
- Proving delivered orders cannot advance again.

Status IDs are confirmed as `1 = PENDING`, `2 = IN PROGRESS`, and `3 = DELIVERED`. The confirmed pending-acceptance sequence is: update the order to status ID 2, then assign the active `courier_id`. On the courier's later status action, update the assigned order to status ID 3 without replacing its courier.

**Resolved (implemented and DB-verified).** The broad `PUT /api/orders/{id}` requires `restaurant_rating`, but `ApiOrderDTO` does not return it and `updateOrderFromDTO` overwrites it, so a frontend adapter could not round-trip a status change without erasing rating data. Under the minimum-backend-change policy (README “Backend Compatibility and Minimum-Change Policy”), a status-only endpoint was added:

```text
PUT /api/order/{id}/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "order_status_id": 2 | 3 }
```

- Success: `200 { "message": "Success", "data": <ApiOrderDTO> }` with only the status changed; restaurant, customer, rating, and courier are preserved.
- Errors: `404` unknown order; `400` missing/invalid or unknown status; `401/403` unauthenticated.
- Server files: `ApiUpdateOrderStatusDTO.java` (new), `OrderService.updateOrderStatusFromDTO` (reuses the existing status-only `updateOrderStatus`), `OrderApiController` (new mapping), plus 5 focused tests. The broad `PUT /api/orders/{id}`, assignment `PUT /api/order/{id}/courier`, creation, retrieval, and rating endpoints are unchanged — additive, backward-compatible, no schema/entity/security/seeder change.
- Frontend integration: `orderService.js` calls it from `acceptDelivery` (status 2, then `PUT /api/order/{id}/courier`), `markDelivered` (status 3), and `assignActiveCourier` (partial-acceptance recovery). On a partial acceptance (status 2 persisted, assignment failed), the client retains a retry-assignment action rather than refreshing the row away or claiming success.
- Verification: `./mvnw test` → 112 passed (0 failures); `PostmanCollection.json` updated. DBeaver before/after and on-device interaction remain operator manual checks.

The Courier audit verified that `ApiUpdateOrderDTO` requires `restaurant_rating`, while `ApiOrderDTO` does not return that field; a frontend round trip therefore cannot guarantee rating preservation. If live verification confirms this blocker, Claude is authorized to add the narrowest status-only backend operation that changes only `order_status_id`, reusing existing status-update service/repository behavior where safe. Preserve the existing broad order-update endpoint for compatibility. Before completion, document the final method/path/body/response, exact server files, why the frontend-only approach was unsafe, client adapter changes, compatibility impact, tests, Postman evidence, and database verification here and in `README.md`.

### 10.5 Order confirmation notifications

The user-facing choices are independent SMS and email checkboxes. The feature spec must preserve both names:

- Official grading names: `sendSMS`, `sendEmail`.
- Current backend JSON names: `send_sms`, `send_email`.

Claude must resolve the request shape before implementation and record the chosen mapping in the feature spec. Both values default to false. Only selected products are sent. Both notification booleans travel inside the order-creation POST; the baseline client makes no separate post-success notification request. The backend may act on selected options only when order creation succeeds, and a failed order must not display or imply a successful notification.

Direct Twilio SMS and Notify.EU email delivery are business-brief extra miles, not baseline client behavior. The supplied Email Template applies only if the Notify.EU extra mile is coach-approved and implemented; it then requires the Rocket Food presentation plus customer name, order ID, restaurant name, and total cost. The baseline requirement is limited to opt-in UI and verified boolean mapping in the order POST.

### 10.6 Postman minimum scope

Claude must keep the root `PostmanCollection.json` synchronized with implemented calls. It must include all retained M13 calls plus:

1. Login for customer-only, courier-only, and dual-role users.
2. Account retrieval for customer and courier.
3. Account update for customer and courier.
4. Pending deliveries.
5. Active courier's assigned deliveries.
6. Courier assignment and both allowed status transitions.
7. Delivered-state rejection/lock evidence where the API supports it.
8. Order creation with neither notification, SMS only, email only, and both.

Preconfigure base URL, token, IDs, types, parameters, paths, and bodies so graders do not edit queries. Claude must run or manually verify each changed request when the environment is available and must identify any unexecuted request honestly.

## 11. UI and design rules

### 11.1 Palette

Continue the centralized Rocket Food values established in M13:

| Name | Hex |
| --- | --- |
| Orange Red | `#DA583B` |
| Dark Charcoal | `#222126` |
| Dark Red | `#851919` |
| Muted Green | `#609475` |
| Warm Yellow / Mustard | `#F0CB67` |
| White | `#FFFFFF` |

Delivery status colors are semantic: `PENDING` red, `IN PROGRESS` orange, and `DELIVERED` green. Use centralized theme/status tokens and confirm the precise shade against the wireframe rather than adding one-off literals.

### 11.2 Typography

- Use Oswald where the wireframe requires display typography.
- Use Arial/default sans-serif for general UI.
- Define a tested platform-safe fallback because Arial availability differs across devices.
- Centralize font families and common text styles.

### 11.3 Shared layout

- Header and role-specific footer remain visible on Customer and Courier destinations.
- Login and Account Selection hide role-app header/footer chrome. This explicit Account Selection exception follows its supplied wireframe and avoids choosing a role-specific footer before a role exists.
- Header contains the Rocket Food Delivery logo and Log Out action where the wireframe shows them.
- Content is centered within the global layout.
- Pages and modals scroll when content overflows.
- Respect safe areas, keyboard obstruction, text scaling, touch targets, and small screens.

### 11.4 M14 wireframe surfaces

Claude must inspect the supplied wireframe before styling each owned surface and match:

- Account Selection.
- Order Confirmation with SMS/email checkboxes.
- Courier Delivery/Delivery History list.
- Delivery Details modal.
- Customer Account Settings.
- Courier Account Settings.

Preserve the original files under `support_materials_14/`; Claude may inspect them but must not modify them or import the PDFs directly as runtime assets.

## 12. Cross-feature behavior rules

### 12.1 Role-based login

- Failed login remains on Login and shows a useful inline error.
- Successful login persists the complete supported identity before routing.
- Single-role users never see Account Selection.
- Dual-role users must make an explicit choice.
- Role-specific screens always use the matching role ID.

### 12.2 Account details

- Display base user email as read-only.
- Display the active role's email and phone.
- Only role email and role phone are editable.
- Validate email and phone before saving.
- Disable Save while the request is pending.
- Refresh displayed values from the confirmed response or a follow-up GET.
- Preserve current values on validation or request failure.
- Keep separate Customer and Courier Account route destinations, but make them thin wrappers around one shared Account screen/form, validation flow, request service, and loading/error/save behavior. Supply role-specific labels, IDs, and values through validated session/configuration data. This satisfies the checklist and business-brief reuse rule without pretending both roles are one route.

### 12.3 Courier deliveries

- Show all pending orders and only the active courier's assigned in-progress/delivered orders.
- Do not infer assignment from status: repair dirty non-pending rows by assigning a valid courier, and exclude them from courier lists until that repair succeeds.
- Normalize backend status spelling/case once at the service boundary.
- Status order is exactly `PENDING` → `IN PROGRESS` → `DELIVERED`.
- Disable the status control and display `Updating…` while its request is pending.
- Prevent duplicate or out-of-order updates.
- Persist before treating a transition as final; roll back or refresh on failure.
- Delivered status has no further transition.
- View opens details for the selected order.
- Delivery Details displays at least status, delivery address, restaurant, order date, line items, quantity, item price, and total, matching the supplied wireframe.
- Nullable product/address data must not crash the modal or render `undefined`; customer/courier personal fields remain absent unless an authoritative requirement and safe API contract require them.

### 12.4 Customer order confirmation

- Preserve M13 product summary, totals, processing, success, failure, retry, and duplicate-submit behavior.
- SMS and email choices operate independently, allowing four combinations.
- Reset notification choices after success with the order state; preserve them during a retryable failure.
- The request shape, defaults (both false), and checkbox-to-key mapping follow Section 10.5.

### 12.5 Retained M13 behavior

Login validation, restaurant loading/filtering, menu navigation, button-only quantities, non-negative/reset quantity behavior, order totals, order history, order details, logout, currency formatting, and missing-courier handling remain required regression coverage.

## 13. Naming and organization conventions

### 13.1 JavaScript and React Native

- Variables/functions: `camelCase`.
- Components: `PascalCase`.
- True module constants: `SCREAMING_SNAKE_CASE`.
- Booleans begin with `is`, `has`, `can`, `should`, or `was`.
- Internal handlers begin with `handle`; callback props begin with `on`.
- Async service functions are verb-first, such as `fetchCourierDeliveries` and `updateAccount`.
- Hooks begin with `use` only when they obey Hook rules.
- Preserve backend JSON names at the API boundary; map to client camelCase once.

### 13.2 Files and folders

- Components: `PascalCase.js`.
- Non-component modules: `camelCase.js`.
- Expo Router files/folders: lowercase kebab-case except `_layout.js`, `index.js`, and dynamic segments.
- Feature specs: exact kebab-case names from Section 5.
- Required root deliverables: exact grading names.
- Use `customerId`, `courierId`, `userId`, `activeRole`, and `accessToken` consistently.

### 13.3 Branches and environment variables

- Feature branches: `feature/<short-kebab-case-name>`.
- Public Expo variables: `EXPO_PUBLIC_SCREAMING_SNAKE_CASE`.
- Required API variable: `EXPO_PUBLIC_API_URL`.
- Never prefix secrets with `EXPO_PUBLIC_`.

## 14. File documentation and comments

- Keep Markdown documents navigable with a Table of Contents when they are large.
- Add concise purpose/contents headers to new human-authored source files when the established project convention requires them.
- Comment why a non-obvious choice, guard, normalization, or workaround exists.
- Explain role/security boundaries, stale-response guards, status mappings, and contract workarounds where code alone is insufficient.
- Do not narrate imports, obvious assignments, JSX already explained by names, or every line.
- Remove stale comments, commented-out implementations, debug logs, and unexplained TODOs before completion.
- Do not add comments to JSON, images, PDFs, generated output, lockfiles, or third-party code.

## 15. Error, loading, and state rules

- Claude must define the state model before JSX for each remote or mutating surface; impossible combinations are a design error, not an edge case to ignore.
- Remote screens distinguish initial loading, refreshing, empty data, recoverable error, and rendered data.
- Mutating controls distinguish idle, pending, success, and error.
- Disable actions while their request is pending and restore them after retryable failure.
- Ignore or guard stale responses after role changes, logout, unmount, or a newer request.
- Treat 401/403 from protected endpoints as session failures according to the verified API behavior.
- Do not expose stack traces, raw server internals, tokens, or credentials.
- Account validation errors must not erase valid saved data.
- Delivery update failures must not leave the UI showing an unpersisted status.
- Empty eligible deliveries is a valid empty state, not an exception.
- Avoid boolean combinations that permit impossible session, modal, or request states.
- A completed acceptance criterion must identify how its success and at least one meaningful failure state were verified.

## 16. Environment variables and secrets

Use:

```dotenv
EXPO_PUBLIC_API_URL=https://example-subdomain.ngrok-free.app
```

Rules:

- Do not add a trailing slash; service paths begin with `/api`.
- Commit `.env.example` with a safe placeholder.
- Never commit `.env` or `.env.local`.
- Restart Expo after changing environment values.
- Never place database credentials, JWT signing secrets, Twilio credentials, Notify.EU credentials, email-provider credentials, or signing credentials in the mobile client.
- Appropriate reviewer setup values belong only in the separate, non-committed submission summary.

## 17. Specification-driven workflow

Claude must execute every feature in this order:

1. **Preflight:** Read this file, the exact feature spec, applicable `AGENTS.md`/`CLAUDE.md`, retained M13 specs, and the current worktree. Record unrelated changes and preserve them.
2. **Inventory:** Use `rg --files` and targeted `rg` searches to map existing owners, routes, callers, tests, and dependencies. Do not create duplicate architecture.
3. **Contract gate:** Verify required API calls in Postman or from authoritative live evidence. Record the official requirement, the existing backend's method, path, query, body, authentication, success envelope, validation, and failures in the feature spec. When they differ, attempt a safe frontend service-boundary adaptation first. If that cannot meet the requirement safely, document the evidence and proposed minimum backend adjustment in this file and `README.md` before editing server code.
4. **Plan:** Map each acceptance criterion to files and verification. For an authorized backend adjustment, identify the smallest affected server surface, compatibility behavior, focused tests, Postman update, frontend adapter, documentation, and rollback/recovery considerations. Stop decision-dependent work while any part remains unverified or undocumented.
5. **Iteration 1 — implement:** Prompt with this global spec and the active feature spec, then make the smallest cohesive change that satisfies the feature. Preserve working M13 behavior and unrelated user changes.
6. **Iteration 1 — read and verify:** Read the complete generated diff, confirm every line is understood, run targeted checks, exercise success and meaningful failure states, compare owned UI to the wireframe, and re-test affected M13 flows. Do not blindly accept generated code.
7. **Improve the specification:** Correct every missing requirement, ambiguity, incorrect result, or verification gap in the active feature spec. If iteration one appears correct, do not invent a deficiency.
8. **Iteration 2 — re-prompt:** Prompt again with this global spec and the improved feature spec. A second AI pass is coach workflow guidance before manual debugging; when iteration one required no correction, use the second pass to review the implementation against every acceptance criterion.
9. **Iteration 2 — verify:** Read the complete second-pass diff and repeat affected checks.
10. **Manual debugging:** Only after both AI/specification iterations may Claude or the developer manually debug remaining imperfections. Read, understand, and verify every manual correction.
11. **Reconcile:** Update the feature spec, this global spec, Postman, tree, and docs only where verified implementation changed their truth. Every backend adjustment must be described accurately in this file and `README.md`, including its reason, contract, files, compatibility impact, and verification.
12. **Clean:** Remove temporary logs, dead code, unused imports, stale comments, generated output, and accidental secrets; inspect the complete diff.
13. **Handoff:** Report the outcome first, list changed files, give exact checks/results and manual gaps, then provide narrowly scoped staging and copy-ready commit commands. Two-pass iteration evidence is not required for grading or handoff.
14. **Log:** After each implementation (and after any material follow-up change to it), append the handoff report to the private implementation log at `.omi/m14/IMPLEMENTATION_LOG.md` as a dated, indexed section covering outcome, contract decisions, changed files, verification results, and remaining manual checks. For every official-source/backend discrepancy, explicitly record the official contract, existing backend contract, frontend-only analysis, decision, exact frontend and any minimum backend adjustment, affected files, compatibility impact, verification evidence, and a technical-demo cue. Create the log on first use. This log is a write-only record, not a runtime dependency: it lives in the gitignored `.omi/` tree, must never be committed or promoted into a graded deliverable, and implementation must never read it to make decisions.

Claude must not change code first and knowingly leave specifications inaccurate. A spec checkbox remains unchecked until evidence exists; code presence alone is not proof of runtime behavior.

## 18. Git and commit workflow

Required branch model:

```text
feature/* → dev → main
```

- Repository remains private and coaches are collaborators.
- Create each feature branch from `dev`; merge it back into `dev` when complete.
- Do not commit directly to `main`.
- Only `main` is graded; merge verified `dev` into `main` before submission.
- Keep commits cohesive and history clear.
- Push regularly, provide at least two weekly progress updates, complete at least one review before Friday, and respond to coach check-ins within 24 hours.

Use Conventional Commit-style messages:

```text
type(optional-scope): short imperative summary
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`, `build`, and `ci`.

- Use an imperative, concise subject without a final period.
- Stage narrowly with `git add -- <exact-paths>`; do not suggest `git add .` in a mixed worktree.
- Use `git add -p -- <path>` when a file contains unrelated edits.
- AI handoffs for file-changing work provide the exact staging command first and the copy-ready commit command/message second.
- AI tools do not stage or commit unless the user explicitly asks.

## 19. Development and phone-testing commands

From `client/`:

```bash
npm install
npx expo config --type public
npx expo start
npx expo start --tunnel --clear
npx expo export --platform android
```

From `server/`:

```bash
./mvnw spring-boot:run
./mvnw test
```

Physical-phone flow:

1. Start the Java backend on port 8080.
2. Start the existing backend ngrok helper or an equivalent approved tunnel.
3. Set `EXPO_PUBLIC_API_URL` in the ignored client `.env` to the HTTPS tunnel origin.
4. Restart Expo with a clean cache.
5. Open the project in Expo Go on the same supported network/tunnel setup.
6. Test customer-only, courier-only, dual-role Customer, dual-role Courier, logout, and session restoration.

Never commit the live tunnel URL.

## 20. Testing and verification strategy

### 20.1 API-first verification

- Claude must confirm all active-feature contracts from Section 10 in Postman before dependent client mutation code.
- Verify account edits, courier assignment/status, and order creation in DBeaver where applicable.
- Test all notification boolean combinations.
- Record exact limitations; never claim an unverified call works.

### 20.2 Feature verification

- Test each acceptance criterion.
- Include success, validation, server/network failure, session expiry, duplicate tap, and retry where relevant.
- Compare each new screen/modal to the wireframe.
- Verify shared components with both customer and courier data.
- Tie every checked acceptance criterion to a command result, inspected artifact, or named manual scenario.

### 20.3 Integration and regression

- Re-run the full M13 customer journey.
- Test customer-only, courier-only, and dual-role routing.
- Test both choices for a dual-role user.
- Confirm customer/courier routes, IDs, data, and tabs do not leak across roles.
- Confirm a courier sees all pending and only their assigned non-pending deliveries.
- Confirm both status transitions persist and delivered is locked.
- Confirm account changes reload from persisted API/database values.

### 20.4 Cross-platform and repository checks

- Test iOS and Android.
- Compare safe areas, scrolling, keyboard behavior, text/font rendering, modals, icons, touch targets, and back behavior.
- Run applicable checks before merge:

```bash
git diff --check
git status --short
```

From `client/`:

```bash
npm ls --depth=0
npx expo config --type public
npx expo export --platform android
```

From `server/`, run the full backend suite after any authorized minimum backend adjustment and otherwise use it for regression verification:

```bash
./mvnw test
```

If local services prevent a check, report the exact failure and safest substitute; do not mark it passed.

## 21. Documentation and submission rules

Required committed deliverables include:

- `README.md` with title/description, tech stack, actual structure, setup, environment variables, API documentation, and author.
- `CONCEPTS.md` with three genuinely challenging M14 concepts, purpose, personal explanation of difficulty, and exact usage locations.
- `PostmanCollection.json` covering every retained and M14 endpoint with preconfigured values.
- The global M14 specification and all seven M14 feature specs at the coach-confirmed submission paths.
- Five readable accepted-solution screenshots under `LeetCode-Challenges/` for:
  - Validate Binary Search Tree
  - Exchange Seats
  - Tree Node
  - Department Top Three Salaries
  - Human Traffic of Stadium

Required Unlisted YouTube videos:

- Concepts explanation: approximately 5–10 minutes.
- Five-challenge problem-solving explanation: approximately 5–10 minutes.
- Technical demo and code overview: follow the grading sheet's 5–10 minute requirement unless a coach explicitly confirms the slide document's longer maximum.

The separate submission summary must include student name, module name, repository link, all required video links, and appropriate reviewer credentials/setup values. It must not be committed to GitHub.

The technical demo must explicitly explain any official-source/backend discrepancy encountered during implementation. For each one, show the official expectation, the original verified backend behavior, whether a frontend adapter was sufficient, and any authorized minimum backend adjustment plus its frontend integration. Demonstrate the final actual request in Postman and avoid claiming support for an unimplemented method, query, or JSON key.

Extra miles are optional only after all baseline work passes and a coach reviews it:

- `RESEARCH.md` explaining APIs used.
- Cross-platform visual consistency beyond baseline compatibility.
- Completed-order rating from 1–5 with restaurant-rating impact.
- Google Maps restaurant-list option using valid addresses.

The business brief also presents direct Twilio SMS and Notify.EU email delivery as optional extra miles. They are not guaranteed current grading-checklist credit without explicit coach confirmation. If Notify.EU work is approved, follow the supplied Email Template; neither provider integration belongs to baseline notification opt-in.

## 22. Rules for AI tools

Claude is the implementation agent for these specifications. Claude must:

- Read this file first, the relevant M14 feature spec second, and applicable repository instruction files before any edit.
- Read the M13 feature spec when modifying retained customer behavior.
- Follow Section 1 source authority.
- Inspect actual routes, services, callers, storage, DTOs, tests, and API responses before changing code.
- Keep changes within the requested feature scope and preserve unrelated user work.
- Treat official/current-backend mismatches as contract gates: verify and try the frontend service boundary first, then use only a documented minimum backend adjustment when the frontend cannot satisfy the requirement safely.
- Document every backend adjustment in this specification and `README.md` before calling it complete, and update the relevant feature spec, tests, Postman, and private implementation log.
- Follow the coach's two-pass specification guidance before manual debugging; do not present iteration evidence as a grading requirement.
- Reuse shared components and services where behavior is genuinely shared.
- Keep code junior-readable and explain non-obvious role, security, request, and transition logic.
- Update specifications when verified implementation evidence changes a contract.
- Test changes in proportion to risk and report exact results.
- Keep a visible distinction between verified current files and planned target files.
- Mark acceptance criteria complete only from evidence gathered against the current diff.
- End file-changing handoffs with the outcome, changed-file summary, exact verification, remaining manual checks, a narrowly scoped stage command, and a copy-ready commit command/message.

Claude must not:

- Modify the Java backend beyond the verified minimum required for a frontend feature, or make any backend change without the required specification, README, tests, and compatibility documentation.
- Invent or claim unimplemented endpoints, status IDs, JSON keys, screens, dependencies, or grading rules; any new minimum backend endpoint must pass the documented gate and be implemented, tested, and recorded before use.
- Break or weaken a completed M13 flow.
- Use route parameters for tokens/passwords or trust an unvalidated active role.
- Add secrets, live ngrok URLs, or reviewer credentials to tracked files.
- Duplicate customer/courier implementations when a shared component safely fits both.
- Add baseline-unrelated extras before required work passes.
- Rewrite unrelated code, delete user work, or conceal failed/skipped verification.
- Stage, commit, merge, push, contact coaches, or mutate external systems unless the user explicitly authorizes that action.
- Continue through a decision gate by choosing undocumented JSON keys, status IDs, routes, libraries, or UI behavior.

## 23. Global Definition of Done

The Module 14 project is complete only when every applicable baseline item passes with current evidence. Claude must leave unchecked anything that is planned, inferred, unrun, manually unverified, or blocked.

Sections 23.1–23.5 are the **agent-verifiable** Definition of Done: Claude can confirm each from code, commands, or committed artifacts, and is responsible for them. Section 23.6 lists **human/process** items that depend on GitHub settings, external uploads, coach interaction, or wall-clock deadlines; Claude cannot perform or verify these and must never check them on the student's behalf.

### 23.1 Repository and specifications

- [ ] History clearly follows `feature/*` → `dev` → `main`; final stable work is on `main`.
- [ ] M14 global spec and all seven exact feature specs exist at coach-confirmed grading paths and match final behavior.
- [ ] Known API-contract mismatches are resolved and recorded from live evidence.
- [ ] Every backend adjustment is the verified minimum, preserves compatibility where possible, has focused tests, and is documented in this specification and `README.md` with its final contract and verification.
- [ ] No secrets, local environment files, generated output, debug helpers, or submission summary are committed.

### 23.2 Authentication and navigation

- [ ] Customer-only login routes directly to Customer.
- [ ] Courier-only login routes directly to Courier.
- [ ] Dual-role login routes to Account Selection and both choices work.
- [ ] Invalid/no-role and expired/corrupt sessions fail safely.
- [x] Customer tabs are Restaurants, Order History, and Account. (Declared in `client/app/customer/_layout.js`; navigation-structure feature. On-device render pending.)
- [x] Courier tabs are Order Delivery and Account. (Declared in `client/app/courier/_layout.js`; navigation-structure feature. On-device render pending.)
- [ ] Nested Restaurant Stack and all retained M13 navigation continue working.
- [ ] Logout clears all identity/role data and prevents protected back navigation.

### 23.3 Account and courier functionality

- [ ] Both roles show read-only user email plus the correct role email/phone.
- [ ] Valid role email/phone changes persist; invalid/failed changes do not corrupt display.
- [ ] Account form is shared, scrollable, keyboard-safe, and duplicate-save protected.
- [ ] Courier sees all pending and only their assigned in-progress/delivered orders.
- [ ] Status colors and progression are exactly correct and persist in the database.
- [ ] Delivered orders cannot change again.
- [ ] Every View action opens the correct scrollable Delivery Details modal.

### 23.4 Customer notifications and regression

- [ ] SMS/email choices work independently and all four combinations send accurate booleans.
- [ ] Every order POST carries accurate SMS/email booleans; the backend acts on them only for a successfully created order, with no separate baseline client notification request.
- [ ] Confirmation submission is duplicate-safe and preserves correct retry/reset behavior.
- [ ] The full M13 customer journey passes without regression.

### 23.5 Design, quality, and delivery

- [ ] New and retained UI follows the palette, Arial/Oswald rules, wireframes, safe areas, and scrolling requirements.
- [ ] Shared components/services avoid unnecessary duplication.
- [ ] No dead code, unused imports, commented-out implementations, stale comments, or debug logs remain.
- [ ] Postman runs all required requests without query editing and DBeaver evidence matches mutations.
- [ ] Applicable Expo, dependency, export, server, manual, iOS, and Android checks pass or have honestly recorded blockers.
- [ ] README, CONCEPTS, and LeetCode screenshots are committed, complete, and accurate.

### 23.6 Human and process items (not agent-verifiable)

Claude must not check these on the student's behalf; they are listed so the human owner can track completion.

- [ ] Repository is private and all coaches are collaborators.
- [ ] Three unlisted YouTube videos (concepts, five-challenge walkthrough, technical demo) are recorded and linked.
- [ ] The non-committed submission summary (name, module, repo link, video links, reviewer credentials/setup) is complete.
- [ ] Two progress updates and one pre-Friday coach review are complete.
- [ ] Submission is made from final `main` by Friday at 11:59 PM.
