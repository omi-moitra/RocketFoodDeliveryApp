# Rocket Food Delivery Mobile App — Module 14 Global AI Specification

> Read this document before implementing or modifying any Module 14 feature. Use it together with the exact feature specification under `ai/M14/features/`. This specification extends the completed Module 13 customer app; it does not replace it.

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

This committed document is the self-contained, project-wide authority for Module 14 implementation. It consolidates the official grading requirements, business rules, teaching guidance, and private planning research used during drafting. A repository reader does not need access to ignored planning files to follow or apply it.

Within the committed repository, follow this order when sources conflict:

1. `ai/M14/ai-spec.md` — consolidated Module 14 project requirements and cross-feature rules.
2. The relevant exact feature specification under `ai/M14/features/` — detailed feature behavior and acceptance criteria; it may narrow this global document but may not contradict it.
3. `support_materials_14/Wireframe.pdf` and `support_materials_14/Email Template.pdf` — supplied visual and notification references.
4. `ai/M13/ai-spec.md` and the eight M13 feature specifications — retained customer behavior and established conventions.
5. `client/AGENTS.md` and `client/CLAUDE.md` — committed client-scoped working instructions; they govern how tools work in `client/`, not the product requirements themselves.
6. Existing repository code — implementation reality, but not permission to contradict a higher-priority requirement.

Drafting provenance only: this specification was created from the official M14 grading sheet, business document, slides, and project breakdown stored privately under `.omi/m14/`. Those ignored files are not part of the committed authority chain. When new official feedback changes a requirement, update this specification and the affected feature specification first so the committed repository remains self-contained.

If a conflict cannot be resolved from the committed sources, stop that decision, record the exact mismatch, and ask a coach. Do not silently choose a convenient interpretation or invent a requirement.

### 1.1 Known contract mismatches requiring verification

The following conflicts exist between the official M14 wording and the current Java code. Resolve them through live Postman tests and coach direction before implementing the dependent client feature:

- The grading sheet requires `GET /api/account/{id}?type={user_type}`. The current controller exposes `GET /api/account/{id}` without a `type` query.
- The grading sheet labels the account update as a POST to `/api/account/{id}`. The current controller exposes `PUT /api/account/{id}?type={type}`.
- The grading sheet names order fields `sendSMS` and `sendEmail`. The current Java DTO explicitly maps snake-case JSON fields `send_sms` and `send_email`.
- The current order API separates all pending orders from courier-assigned orders and does not expose one confirmed status-transition endpoint. The courier feature must document the verified request sequence, status identifiers, assignment rules, and delivered lock before implementation.

Do not change the backend merely to remove one of these mismatches unless a coach or updated official requirement explicitly authorizes that backend change.

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

Module 14 preserves the full Module 13 customer journey, adds role-aware login and navigation, adds a Courier application, adds shared account management, and extends order confirmation with notification preferences.

## 3. Goal and scope

### 3.1 Goal

Expand the working customer mobile app into a role-aware iOS and Android application. Customers retain restaurant and ordering features and gain account editing and notification choices. Couriers gain delivery visibility, status progression, delivery details, and account editing.

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
- Unapproved Java backend or database-schema changes.
- Employee or restaurant-owner mobile applications.
- A default role guess for a dual-role user.
- Editing the base user email from the mobile Account screen.
- Skipping status stages, reversing a delivery status, or changing a delivered order.
- Sending confirmation notifications when order creation fails.
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

Create and use these seven exactly named Module 14 feature specifications:

1. `ai/M14/features/navigation-structure.feature.md`
2. `ai/M14/features/role-based-navigation.feature.md`
3. `ai/M14/features/courier-delivery.feature.md`
4. `ai/M14/features/account-details.feature.md`
5. `ai/M14/features/order-confirmation-modal.feature.md`
6. `ai/M14/features/ui.feature.md`
7. `ai/M14/features/code-quality.feature.md`

Each feature file must contain:

- Feature goal and explicit in/out scope.
- Requirement breakdown and complete user flow.
- Routes, pages, components, contexts, services, storage, and endpoints involved.
- Confirmed request/response fields, validation, state transitions, and expected behavior.
- Loading, empty, error, retry, duplicate-action, and session-expiry behavior where applicable.
- Testable acceptance criteria tied to the grading rows.
- A feature-specific Definition of Done.

The eight specifications under `ai/M13/features/` remain the behavior authority for retained Module 13 features unless an M14 requirement explicitly extends one. M14 changes must not weaken their acceptance criteria.

> The grading sheet names submission paths as `ai/ai-spec.md` and `ai/features/*.feature.md`. This module-organized file is the M14 authoring source requested for this repository. Before submission, confirm with the project owner or coach whether M14 specs must also be promoted to those root grading paths; do not create divergent duplicate copies.

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
- Existing API is consumed as-is unless a separately recorded authority approves a change.

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

Target combined structure; create M14 paths only when their feature is implemented:

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

This tree distinguishes existing and planned paths. Update it when implementation chooses a different real path. Do not claim that a target file already exists before it does.

### 7.1 Responsibility boundaries

- `app/`: Expo Router route entry points and layouts; keep business/API logic thin.
- `components/`: Reusable visual behavior such as Account form, delivery row, status control, detail modal, result states, header, and order confirmation.
- `contexts/`: Authenticated identity, available roles, active role, session restore, and logout orchestration.
- `services/`: Shared API client and domain-specific request functions.
- `storage/`: Central AsyncStorage keys and validated read/write/clear helpers.
- `constants/`: Theme, typography, status mappings, currency, and stable configuration.
- `utils/`: Pure validation, normalization, and formatting helpers.

## 8. Navigation architecture

### 8.1 Root stack

- `client/app/_layout.js` owns session restoration and the protected navigation boundary.
- It manages Login, Account Selection, Customer, and Courier destinations.
- Do not route until AsyncStorage restoration finishes.
- Successful single-role login replaces Login with the corresponding role app.
- Successful dual-role login replaces Login with Account Selection.
- Logout clears all session/role data and replaces the protected route with Login.
- Invalid/expired sessions cannot use the back button to return to protected screens.

### 8.2 Account Selection

- `client/app/selection.js` is available only when both `customer_id` and `courier_id` exist.
- Customer sets `activeRole = customer` and routes to Customer tabs.
- Courier sets `activeRole = courier` and routes to Courier tabs.
- Do not default to one role or expose this screen to a single-role user.

### 8.3 Customer tabs

- `client/app/customer/_layout.js` contains Restaurants, Order History, and Account, in that order unless the wireframe dictates otherwise.
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

- Define keys once.
- Await storage operations that affect navigation or requests.
- Validate restored values as one coherent session, not as independent trusted strings.
- Clear all identity and role data on logout or invalid authentication.
- Treat corrupt/incomplete data as logged out.
- On protected-request authentication failure, clear stale session data and return to Login with a safe message.

## 10. Backend API contract

`${API_BASE_URL}` is the configured server origin. On a physical phone it is normally an ngrok HTTPS URL forwarding to local port 8080. All calls below except login are protected by the bearer token.

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

Before implementation, the Account feature spec must record:

- Confirmed retrieval query values (`customer`, `courier`) and whether the live API accepts them.
- Confirmed update HTTP method and whether `type` is a query value or body field.
- Exact body keys for role email and phone.
- Response envelope and field names for base user email, role email, and role phone.
- Validation and error responses.

The current repository suggests a read-only base email plus role-specific nested data, and a PUT update using body fields `email` and `phone`; this is implementation evidence, not permission to override the official contract without resolution.

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

If both calls are used, merge and deduplicate by order ID at the service boundary. Re-check eligibility after refresh and status changes. Do not expose another courier's assigned non-pending delivery.

### 10.4 Courier assignment and status update

The verified feature spec must document the exact sequence for:

- Assigning the active courier when a pending order becomes in progress.
- Mapping status names to the backend's accepted status values or IDs.
- Persisting `PENDING` → `IN PROGRESS`.
- Persisting `IN PROGRESS` → `DELIVERED`.
- Proving delivered orders cannot advance again.

Current code includes `PUT /api/order/{id}/courier` for assignment and a broad `PUT /api/orders/{id}` update, but the latter expects additional order fields. Do not send guessed values or rely on a destructive broad update until Postman confirms the safe contract.

### 10.5 Order confirmation notifications

The user-facing choices are independent SMS and email checkboxes. The feature spec must preserve both names:

- Official grading names: `sendSMS`, `sendEmail`.
- Current backend JSON names: `send_sms`, `send_email`.

Resolve the request shape before implementation and record the chosen mapping. Both default to false. Only selected products are sent. Notifications are requested only as part of a successfully created order. A failed order must not trigger a success notification.

### 10.6 Postman minimum scope

The root `PostmanCollection.json` must include all retained M13 calls plus:

1. Login for customer-only, courier-only, and dual-role users.
2. Account retrieval for customer and courier.
3. Account update for customer and courier.
4. Pending deliveries.
5. Active courier's assigned deliveries.
6. Courier assignment and both allowed status transitions.
7. Delivered-state rejection/lock evidence where the API supports it.
8. Order creation with neither notification, SMS only, email only, and both.

Preconfigure base URL, token, IDs, types, parameters, paths, and bodies so graders do not edit queries.

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

- Header and role-specific footer remain visible on authenticated pages.
- Login hides both header and footer.
- Account Selection follows its supplied wireframe; do not assume the standard tabs belong there.
- Header contains the Rocket Food Delivery logo and Log Out action where the wireframe shows them.
- Content is centered within the global layout.
- Pages and modals scroll when content overflows.
- Respect safe areas, keyboard obstruction, text scaling, touch targets, and small screens.

### 11.4 M14 wireframe surfaces

Match these supplied surfaces closely:

- Account Selection.
- Order Confirmation with SMS/email checkboxes.
- Courier Delivery/Delivery History list.
- Delivery Details modal.
- Customer Account Settings.
- Courier Account Settings.

Preserve the original files under `support_materials_14/` and do not modify them as runtime assets.

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
- Share the Account form/logic between roles instead of duplicating it.

### 12.3 Courier deliveries

- Show all pending orders and only the active courier's assigned in-progress/delivered orders.
- Normalize backend status spelling/case once at the service boundary.
- Status order is exactly `PENDING` → `IN PROGRESS` → `DELIVERED`.
- Disable the status control and display `In Progress` while its request is pending.
- Prevent duplicate or out-of-order updates.
- Persist before treating a transition as final; roll back or refresh on failure.
- Delivered status has no further transition.
- View opens details for the selected order.
- Nullable courier/product/address data must not crash the modal or render `undefined`.

### 12.4 Customer order confirmation

- Preserve M13 product summary, totals, processing, success, failure, retry, and duplicate-submit behavior.
- SMS and email choices operate independently, allowing four combinations.
- Both choices default to false for a new order form.
- Reset notification choices after success with the order state.
- Preserve choices during a retryable failure.
- Request booleans must match the visible checkbox states.

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

For every feature:

1. Read the grading rows, this global spec, the exact feature spec, the relevant wireframe, and retained M13 rules.
2. Verify every required API call in Postman before client implementation.
3. Record method, path, parameters, body, authentication, success, validation, and failure shapes in the feature spec.
4. Resolve source/API mismatches or record the coach-approved decision.
5. Create the feature branch from current `dev`.
6. Implement only the feature-spec scope with reusable project conventions.
7. Test every acceptance criterion, including meaningful failure and duplicate-action cases.
8. Compare the UI to the supplied wireframe on a native platform.
9. Re-test affected M13 behavior.
10. Update specs, code, Postman, and documentation so they describe one final reality.
11. Remove temporary logging/dead code, inspect the diff, and merge the completed feature into `dev`.

Do not change code first and knowingly leave the specifications inaccurate.

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

- Confirm all M14 contracts from Section 10 in Postman.
- Verify account edits, courier assignment/status, and order creation in DBeaver where applicable.
- Test all notification boolean combinations.
- Record exact limitations; never claim an unverified call works.

### 20.2 Feature verification

- Test each acceptance criterion.
- Include success, validation, server/network failure, session expiry, duplicate tap, and retry where relevant.
- Compare each new screen/modal to the wireframe.
- Verify shared components with both customer and courier data.

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

From `server/`, use verification without modification unless backend changes are authorized:

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

Extra miles are optional only after all baseline work passes and a coach reviews it:

- `RESEARCH.md` explaining APIs used.
- Cross-platform visual consistency beyond baseline compatibility.
- Completed-order rating from 1–5 with restaurant-rating impact.
- Google Maps restaurant-list option using valid addresses.

## 22. Rules for AI tools

AI tools must:

- Read this file first and the relevant M14 feature spec second.
- Read the M13 feature spec when modifying retained customer behavior.
- Follow Section 1 source authority.
- Inspect actual routes, services, DTOs, and API responses before changing code.
- Keep changes within the requested feature scope and preserve unrelated user work.
- Treat official/current-backend mismatches as blockers to resolve, not invitations to guess.
- Reuse shared components and services where behavior is genuinely shared.
- Keep code junior-readable and explain non-obvious role, security, request, and transition logic.
- Update specifications when verified implementation evidence changes a contract.
- Test changes in proportion to risk and report exact results.
- End file-changing handoffs with a narrowly scoped stage command followed by a copy-ready commit command/message.

AI tools must not:

- Modify the Java backend without explicit authority.
- Invent endpoints, status IDs, JSON keys, screens, dependencies, or grading rules.
- Break or weaken a completed M13 flow.
- Use route parameters for tokens/passwords or trust an unvalidated active role.
- Add secrets, live ngrok URLs, or reviewer credentials to tracked files.
- Duplicate customer/courier implementations when a shared component safely fits both.
- Add baseline-unrelated extras before required work passes.
- Rewrite unrelated code, delete user work, or conceal failed/skipped verification.

## 23. Global Definition of Done

The Module 14 project is complete only when every applicable baseline item passes.

### 23.1 Repository and specifications

- [ ] Repository is private and all coaches are collaborators.
- [ ] History clearly follows `feature/*` → `dev` → `main`; final stable work is on `main`.
- [ ] M14 global spec and all seven exact feature specs exist at coach-confirmed grading paths and match final behavior.
- [ ] Known API-contract mismatches are resolved and recorded from live evidence.
- [ ] No secrets, local environment files, generated output, debug helpers, or submission summary are committed.

### 23.2 Authentication and navigation

- [ ] Customer-only login routes directly to Customer.
- [ ] Courier-only login routes directly to Courier.
- [ ] Dual-role login routes to Account Selection and both choices work.
- [ ] Invalid/no-role and expired/corrupt sessions fail safely.
- [ ] Customer tabs are Restaurants, Order History, and Account.
- [ ] Courier tabs are Order Delivery and Account.
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
- [ ] Notifications are requested only after successful order creation.
- [ ] Confirmation submission is duplicate-safe and preserves correct retry/reset behavior.
- [ ] The full M13 customer journey passes without regression.

### 23.5 Design, quality, and delivery

- [ ] New and retained UI follows the palette, Arial/Oswald rules, wireframes, safe areas, and scrolling requirements.
- [ ] Shared components/services avoid unnecessary duplication.
- [ ] No dead code, unused imports, commented-out implementations, stale comments, or debug logs remain.
- [ ] Postman runs all required requests without query editing and DBeaver evidence matches mutations.
- [ ] Applicable Expo, dependency, export, server, manual, iOS, and Android checks pass or have honestly recorded blockers.
- [ ] README, CONCEPTS, screenshots, three videos, and non-committed submission summary are complete and accurate.
- [ ] Two progress updates and one pre-Friday coach review are complete.
- [ ] Submission is made from final `main` by Friday at 11:59 PM.
