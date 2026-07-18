# Rocket Food Delivery Mobile App — Global AI Specification

> This document must be read before implementing or modifying any feature. Use it together with the exact feature specification under `ai/features/`.

## Table of Contents

1. [Document authority](#1-document-authority)
2. [Project identity](#2-project-identity)
3. [Goal and scope](#3-goal-and-scope)
4. [Users and customer journey](#4-users-and-customer-journey)
5. [Required feature specifications](#5-required-feature-specifications)
6. [Technology and constraints](#6-technology-and-constraints)
7. [Repository architecture](#7-repository-architecture)
8. [Navigation architecture](#8-navigation-architecture)
9. [Backend API contract](#9-backend-api-contract)
10. [Authentication and client storage](#10-authentication-and-client-storage)
11. [UI and design rules](#11-ui-and-design-rules)
12. [Feature behavior rules](#12-feature-behavior-rules)
13. [Naming conventions](#13-naming-conventions)
14. [File headers and per-file TOCs](#14-file-headers-and-per-file-tocs)
15. [Inline-comment rules](#15-inline-comment-rules)
16. [Error, loading, and state rules](#16-error-loading-and-state-rules)
17. [Environment variables and secrets](#17-environment-variables-and-secrets)
18. [Specification-driven workflow](#18-specification-driven-workflow)
19. [Git branches and pull workflow](#19-git-branches-and-pull-workflow)
20. [Commit-message standard](#20-commit-message-standard)
21. [Expo development commands](#21-expo-development-commands)
22. [Testing on a physical phone](#22-testing-on-a-physical-phone)
23. [Testing and verification strategy](#23-testing-and-verification-strategy)
24. [Documentation and submission rules](#24-documentation-and-submission-rules)
25. [Rules for AI tools](#25-rules-for-ai-tools)
26. [Global Definition of Done](#26-global-definition-of-done)

## 1. Document authority

When sources conflict, follow this order:

1. `.omi/FSD Grading Sheets (Shared) - m13.csv` — final grading authority.
2. `.omi/Module_13-Codeboxx_FSD.md` — business requirements and constraints.
3. `.omi/m13_slides.md` and `.omi/M13_Transcript.md` — teaching guidance and workflow.
4. `support_materials_13/Design/` and `support_materials_13/Images/` — visual source material.
5. Existing repository code — implementation reality, but not permission to contradict a higher-priority requirement.

If a conflict cannot be resolved from those sources, stop that decision, record the question, and ask a coach. Do not invent a requirement.

Resolved Expo version decision:

- The business document says Expo SDK `~55`, while the generated client uses Expo SDK 54.
- A coach confirmed on July 16, 2026 that Expo SDK 54 is acceptable for this submission.
- Keep the current `expo ~54.0.34` baseline and use SDK 54-compatible packages and documentation.

## 2. Project identity

- **Project name:** Rocket Food Delivery Mobile App
- **Module:** Full-Stack Development Module 13 — Mobile Development 1
- **Project type:** Cross-platform customer mobile application
- **Frontend:** React Native with Expo
- **Backend:** Existing Spring Boot REST API from Module 12
- **Database:** MySQL through the existing Java backend
- **Primary user:** Rocket Food Delivery customer
- **Repository shape:** One repository containing `client/`, `server/`, specifications, documentation, evidence, and support materials

The mobile client lets an authenticated customer browse restaurants, filter results, inspect a menu, select product quantities, create an order, and inspect order history.

## 3. Goal and scope

### 3.1 Goal

Build a functional iOS and Android customer application that matches the supplied wireframe and color scheme and consumes the existing Java API through authenticated HTTP requests.

### 3.2 In scope

- Email/password login.
- JWT and current-customer persistence using AsyncStorage.
- Root stack, customer tabs, and nested restaurant stack.
- Shared header with logo and Log Out button.
- Footer tabs for Restaurants and Order History.
- Restaurant list with rating and price filters.
- Restaurant menu with button-only quantity controls.
- Order confirmation modal and order creation.
- Order history table and order-detail modal.
- Environment-driven API base URL and ngrok phone testing.
- Exact wireframe colors, supplied assets, fonts, scrolling, loading, empty, success, and failure states.
- Required AI specifications, Postman collection, research, README, concepts, LeetCode evidence, videos, and submission artifacts.

### 3.3 Out of scope

- Modifying the Java backend for Module 13 features.
- Changing the database schema or seeded API contract.
- Courier mobile workflows; those belong to a later module.
- Employee or restaurant-owner mobile workflows.
- New authentication mechanisms or backend endpoints.
- Unrequested features, design systems, state libraries, or architectural layers.
- Storing secrets in client code, Git, or `EXPO_PUBLIC_*` variables.
- Extra miles before all baseline requirements pass and a coach has reviewed them.

## 4. Users and customer journey

### 4.1 User

- **Customer:** Logs in, browses restaurants, filters restaurants, views menus, selects quantities, creates orders, reviews order history, views details, and logs out.

### 4.2 Required journey

`Login` → `Restaurants` → optional `Rating/Price Filters` → `Restaurant Menu` → `Quantity Selection` → `Order Confirmation Modal` → `Processing` → `Success or Failure` → `Order History` → `Order Detail Modal`

Every screen transition must preserve the correct authentication and customer context without exposing the token in route parameters.

## 5. Required feature specifications

Exactly these eight feature specifications are graded:

1. `ai/features/navigation-structure.feature.md`
2. `ai/features/header-footer.feature.md`
3. `ai/features/login-page.feature.md`
4. `ai/features/restaurant-list-page.feature.md`
5. `ai/features/restaurant-menu-page.feature.md`
6. `ai/features/menu-modal-confirmation.feature.md`
7. `ai/features/order-history-page.feature.md`
8. `ai/features/order-history-modal.feature.md`

Each feature file must contain:

- Feature goal and in/out scope.
- Requirements breakdown and complete user flow.
- Pages, components, services, storage, and endpoints involved.
- Data fields, validation, state transitions, and expected behavior.
- Testable acceptance criteria.
- A feature-specific Definition of Done.

The generic `ai/features/feature-name.feature.md` is a drafting template only. It is not one of the eight graded feature files and must not remain as a substitute for them.

## 6. Technology and constraints

### 6.1 Current frontend baseline

- Expo SDK 54 (`expo ~54.0.34`), confirmed as acceptable by a coach on July 16, 2026.
- React Native 0.81.5.
- React 19.1.0.
- JavaScript blank template; do not introduce TypeScript halfway through without an explicit project decision.
- Expo Router for the required file-based `_layout` structure.
- AsyncStorage for persisted login/customer data.
- FontAwesome for UI icons.
- React Native Reanimated where required by Expo Router/navigation dependencies.
- React Bootstrap is listed by the grading sheet and must be installed/documented; do not use browser-only DOM components inside native screens.
- Environment-driven API URL.
- ngrok for access from a physical phone.

### 6.2 Backend baseline

- Java 17.
- Spring Boot 3.5.11.
- Spring Security with stateless JWT protection for `/api/**`.
- MySQL 8.x connector.
- Maven Wrapper through `server/mvnw`.

### 6.3 General constraints

- The app must run on iOS and Android through Expo.
- The existing Java API is consumed as-is.
- The UI must follow the wireframe rather than an invented design.
- All protected requests use `Authorization: Bearer <accessToken>`.
- Quantities are integers controlled only by buttons and can never be negative.
- All menu pages use `RestaurantMenu.jpg`.
- Restaurant images live under `client/images/restaurants/` to satisfy the graded `/images/restaurants` location.
- All prices shown to users use standard currency formatting with two decimal places.

## 7. Repository architecture

Current repository structure (submission-facing paths; ignored private planning files and the
separate untracked submission summary are intentionally excluded):

```text
M13-rocketFoodDelivery/
├── ai/
│   ├── ai-spec.md
│   └── features/
│       ├── navigation-structure.feature.md
│       ├── header-footer.feature.md
│       ├── login-page.feature.md
│       ├── restaurant-list-page.feature.md
│       ├── restaurant-menu-page.feature.md
│       ├── menu-modal-confirmation.feature.md
│       ├── order-history-page.feature.md
│       └── order-history-modal.feature.md
├── client/
│   ├── app/
│   │   ├── _layout.js
│   │   ├── index.js
│   │   └── customer/
│   │       ├── _layout.js
│   │       ├── order-history.js
│   │       └── restaurant/
│   │           ├── _layout.js
│   │           ├── index.js
│   │           └── [restaurantId].js
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── services/
│   ├── storage/
│   ├── utils/
│   ├── images/
│   │   └── restaurants/
│   ├── assets/
│   ├── .env.example
│   ├── app.json
│   ├── package.json
│   └── package-lock.json
├── server/                     # Existing Java application; do not modify for Module 13
├── scripts/
│   └── ngrok-phone.sh
├── support_materials_13/       # Original design/reference resources
├── LeetCode-Challenges/
├── README.md
├── RESEARCH.md
├── CONCEPTS.md
└── PostmanCollection.json
```

This is the implemented shape. Update this section whenever a real path changes. Do not let the
specification drift away from the repository.

### 7.1 Client responsibilities

- `app/`: Expo Router routes and layouts.
- `components/`: Reusable visual components such as header, restaurant card, quantity stepper, loading state, and modals.
- `constants/`: Theme colors, typography, spacing, and stable configuration constants.
- `services/`: HTTP request helpers and feature-specific API functions.
- `storage/`: AsyncStorage keys and authentication/customer read-write helpers.
- `images/restaurants/`: Supplied restaurant images at the graded path.
- `assets/`: App icon, logos, static menu image, and fonts.

## 8. Navigation architecture

Use Expo Router's file-based layouts because the grading sheet requires exact `_layout` files.

### 8.1 Root stack

- Location: `client/app/_layout.js`.
- Contains Login and the authenticated customer application.
- Login is the initial unauthenticated route.
- Successful authentication replaces Login with the customer area.
- Logout clears stored authentication and replaces the current route with Login.

### 8.2 Customer tabs

- Location: `client/app/customer/_layout.js`.
- Bottom tabs: Restaurants and Order History.
- Restaurants is the left tab.
- Order History is the right tab.
- Footer/tab navigation is visible throughout the authenticated customer area.

### 8.3 Restaurant stack

- Location: `client/app/customer/restaurant/_layout.js`.
- Restaurant List is the stack entry.
- Clicking a restaurant image opens that restaurant's menu.
- Back navigation returns to the restaurant list without corrupting filter or authentication state.
- Entering a different restaurant creates fresh quantity state initialized to zero.

## 9. Backend API contract

The API base URL is represented below as `${API_BASE_URL}`. On a physical phone it is an ngrok HTTPS URL forwarding to local port 8080.

### 9.1 Authentication

`POST ${API_BASE_URL}/api/auth`

- Public; no bearer token.
- Request body:

```json
{
  "email": "customer@example.com",
  "password": "password"
}
```

- Successful response fields used by the client:
  - `success`
  - `accessToken`
  - `user_id`
  - `customer_id`
- Incorrect credentials return HTTP 401 with `success: false`.

### 9.2 Restaurants and filters

`GET ${API_BASE_URL}/api/restaurants`

- Protected by bearer token.
- Optional query parameters:
  - `rating=<integer>`
  - `price_range=<integer>`
- Omit both parameters to return all restaurants.
- Include either parameter for a single filter.
- Include both parameters for combined filtering.
- Restaurant data includes `id`, `name`, `price_range`, and `rating`.

Optional detail call if the final feature uses it:

`GET ${API_BASE_URL}/api/restaurants/{id}`

### 9.3 Restaurant products/menu

`GET ${API_BASE_URL}/api/products?restaurant={restaurantId}`

- Protected by bearer token.
- The `restaurant` query parameter scopes products to the selected restaurant.
- Product data includes `id`, `restaurant_id`, `name`, `description`, and integer `cost`; map `restaurant_id` to `restaurantId` at the client service boundary.
- The current source-based rule treats seeded `cost` values as whole-dollar integers because `DataSeeder` creates values from `5` through `24`; the shared formatter therefore displays `9` as `$9.00` without division.
- Live confirmation completed during the order-confirmation feature (2026-07-15): `GET /api/products` against the running backend showed untouched seeded products with whole-dollar integer costs (10–24). A few locally modified rows (for example `Updated Burger`, cost `1499`) were created by earlier backend test runs and are not seeded-contract evidence. The `whole-dollars` formatter rule stands.

### 9.4 Create order

`POST ${API_BASE_URL}/api/orders`

- Protected by bearer token.
- Request body:

```json
{
  "restaurant_id": 1,
  "customer_id": 1,
  "products": [
    {
      "id": 10,
      "quantity": 2
    }
  ],
  "send_email": false,
  "send_sms": false
}
```

- Send only products whose quantity is greater than zero.
- Disable repeated submission while the request is pending.
- Treat a created response as success; handle validation, authentication, network, and server failures explicitly.

### 9.5 Current-customer order history

`GET ${API_BASE_URL}/api/orders?type=customer&id={customerId}`

- Protected by bearer token.
- `type` must be exactly `customer` for this app.
- `id` is the authenticated customer's `customer_id`, not `user_id`.
- Returned order data includes:
  - Order ID and creation date.
  - Status.
  - Customer and restaurant fields.
  - Nullable courier ID/name.
  - Products with ID, name, quantity, unit cost, and total cost.
  - Order total cost.
- Use the selected returned order object for the detail modal; do not invent a detail endpoint unless implementation evidence requires one.

### 9.6 Postman minimum scope

The Module 13 collection must cover, at minimum:

1. Successful and failed `POST /api/auth`.
2. Unfiltered `GET /api/restaurants`.
3. Rating-only, price-only, and combined restaurant filters.
4. `GET /api/products?restaurant={restaurantId}`.
5. Successful and failed `POST /api/orders`.
6. `GET /api/orders?type=customer&id={customerId}`.

Add every additional endpoint actually called by the app. Preconfigure parameters and scripts so graders do not need to edit queries manually.

## 10. Authentication and client storage

### 10.1 Stored values

Use centralized storage keys for:

- Access token.
- User ID if needed.
- Customer ID.

Do not store the password. Do not log the access token.

### 10.2 Authentication flow

1. Validate email and password are present.
2. Submit credentials to `/api/auth`.
3. On success, persist `accessToken`, `user_id`, and `customer_id`.
4. Enter the customer application.
5. Read the token through one shared API helper for protected requests.
6. On logout, clear all authentication/customer keys and replace the route with Login.
7. On HTTP 401 or 403 from a protected endpoint, clear stale authentication and return to Login with an appropriate message. Live evidence (2026-07-15, order-confirmation feature): the backend has no custom `AuthenticationEntryPoint` and no per-role rules on `/api/**`, so Spring Security's default reports missing/invalid/expired tokens as HTTP 403.

### 10.3 Storage rules

- Define storage key names once; never duplicate raw strings across screens.
- Await every AsyncStorage operation that affects navigation or API calls.
- Handle missing/corrupt storage as a logged-out state.
- Route parameters may contain public IDs needed for navigation, but never the token or password.

## 11. UI and design rules

### 11.1 Exact palette

Centralize and use these graded values:

| Name | Hex | RGBA |
| --- | --- | --- |
| Orange Red | `#DA583B` | `rgba(218, 88, 59, 1)` |
| Dark Charcoal | `#222126` | `rgba(33, 33, 38, 1)` |
| Dark Red | `#851919` | `rgba(132, 25, 25, 1)` |
| Muted Green | `#609475` | `rgba(96, 148, 116, 1)` |
| Warm Yellow / Mustard | `#F0CB67` | `rgba(240, 203, 103, 1)` |
| White | `#FFFFFF` | `rgba(255, 255, 255, 1)` |

Do not replace them with approximate colors.

### 11.2 Fonts

- Use Oswald where shown in the wireframe.
- Use the requested Arial/default sans-serif treatment elsewhere.
- Because Arial availability differs by platform, define and test an explicit platform-safe fallback rather than silently rendering inconsistently.

### 11.3 Shared layout

- Header and footer are visible on every page except Login.
- Header contains the Rocket Food Delivery logo and Log Out button.
- Footer contains Restaurants and Order History tabs.
- Overflow content is scrollable.
- Respect safe areas, keyboard obstruction, touch-target size, and small phone screens.
- Match each supplied screen and modal closely rather than applying generic styling.

### 11.4 Assets

- Preserve the original support materials under `support_materials_13/`.
- Copy runtime restaurant images to `client/images/restaurants/`.
- Use `RestaurantMenu.jpg` on every restaurant menu.
- Choose the approved app logo version and use it consistently.
- Do not rename specifically required assets without updating every reference and confirming grading expectations.

## 12. Feature behavior rules

### 12.1 Login

- Credentials are email and password.
- Incorrect credentials display an inline error above the Login button.
- A failed login does not navigate.
- A successful login stores authentication/customer data and enters Restaurants.

### 12.2 Restaurant list and filters

- All restaurants display initially.
- Rating and Price controls show placeholder values when unselected.
- Support rating only, price only, both, and neither.
- Clicking the restaurant image opens its menu.
- Include loading, empty, error, and retry behavior.

### 12.3 Restaurant menu

- Every quantity starts at zero.
- Quantities change only through plus/minus buttons.
- Minus cannot reduce a value below zero.
- Quantities reset when the customer changes restaurants.
- Create Order is disabled while all quantities are zero.
- Clicking enabled Create Order opens the confirmation modal.

### 12.4 Confirmation modal

- Show accurate selected product names, quantities, unit prices, and totals.
- Format currency consistently, for example `$20.95`.
- During submission, disable the action and display `Processing Order…`.
- On success, hide the action and show a green checkmark with a success message.
- On failure, restore Confirm Order and show a red X with a useful failure message.
- Prevent duplicate requests.

### 12.5 Order history

- Load orders for the current `customer_id`.
- Display a structured table with exact headings: `Order`, `Status`, and `View`.
- View opens the selected order's detail modal.
- The modal shows correct date, status, courier name, products, prices, and totals.
- A missing courier is a valid pending state and must never render as `undefined` or crash.

## 13. Naming conventions

### 13.1 General

- Names must communicate domain purpose, not implementation accidents.
- Avoid unexplained abbreviations such as `data2`, `obj`, `tmp`, `res1`, or `thing`.
- Use the same business term everywhere: `restaurantId`, `customerId`, `orderHistory`, and `accessToken`.
- Preserve backend JSON keys at the API boundary; map them to client camelCase once when beneficial.

### 13.2 JavaScript and React Native

- Variables and functions: `camelCase`.
- Components: `PascalCase`.
- Constants: `SCREAMING_SNAKE_CASE` for true module-level constants.
- Boolean names begin with `is`, `has`, `can`, `should`, or `was`.
- Event handlers defined inside a component begin with `handle`, such as `handleLogin`.
- Callback props begin with `on`, such as `onRestaurantPress`.
- Async API functions use verb-first names, such as `fetchRestaurants`, `createOrder`, and `authenticateCustomer`.
- Hooks begin with `use` only when they obey React Hook rules.
- Style keys use semantic camelCase names, such as `loginButton`, not `redBox`.

### 13.3 Files and folders

- React components: `PascalCase.js`, for example `RestaurantCard.js`.
- Non-component modules: `camelCase.js`, for example `apiClient.js` and `authStorage.js`.
- Expo Router route folders/files: lowercase kebab-case except reserved names such as `_layout.js`, `index.js`, and dynamic `[restaurantId].js`.
- Feature specifications: exact graded kebab-case filenames listed in Section 5.
- New image assets: lowercase kebab-case unless a required supplied filename must remain exact.
- Required root deliverables use exact grading names: `README.md`, `RESEARCH.md`, `CONCEPTS.md`, and `PostmanCollection.json`.

### 13.4 Environment variables

- Public Expo values: `EXPO_PUBLIC_SCREAMING_SNAKE_CASE`.
- Required API variable: `EXPO_PUBLIC_API_URL`.
- Never prefix a secret with `EXPO_PUBLIC_`; those values are embedded in the client bundle.

### 13.5 Git branches

- Feature branches: `feature/<short-kebab-case-name>`.
- Examples: `feature/navigation-structure`, `feature/login-page`, `feature/order-history`.
- Do not use spaces, uppercase letters, ticket-free personal names, or vague names such as `feature/stuff`.

## 14. File headers and per-file TOCs

Every human-authored file must begin with a short purpose header and a contents map appropriate to its file type. Keep the map synchronized when sections materially change.

### 14.1 JavaScript/TypeScript source

Use a leading block comment:

```js
/**
 * File: RestaurantList.js
 * Purpose: Loads, filters, and displays restaurants for the customer.
 * Contents:
 * 1. Imports and constants
 * 2. RestaurantList component
 * 3. Data loading and filter handlers
 * 4. Styles
 */
```

For a very small file, a compact contents line is acceptable:

```js
/** Purpose: Registers the Expo root component. Contents: imports, registration. */
```

### 14.2 Markdown

- Begin with one clear H1 title.
- Add a `## Table of Contents` with anchor links when the file has three or more major sections.
- Short Markdown files with fewer than three sections may use a one-line HTML comment containing `Purpose` and `Contents`.
- Feature specifications must use a visible Markdown TOC because they contain multiple required sections.

### 14.3 Java source

The Module 13 backend is read-only. If a separately authorized Java change occurs, use a class-level Javadoc header with purpose and contents/responsibilities. Do not sweep the provided server merely to add TOCs.

### 14.4 Formats that cannot contain comments

Do not corrupt strict or generated formats to satisfy the TOC rule.

The inline TOC requirement does not apply inside:

- JSON files such as `package.json`, `app.json`, and Postman exports.
- Lockfiles.
- Images, fonts, PDFs, JARs, and other binaries.
- Generated build output.
- Third-party dependencies.

For an authored JSON file whose structure needs explanation, document its contents in the nearest README/spec rather than adding invalid comments or fake configuration keys.

## 15. Inline-comment rules

### 15.1 What to comment

- Explain why non-obvious logic or a business rule exists.
- Explain API-shape conversions, currency conversions, race-condition prevention, storage sequencing, and platform-specific behavior.
- Explain why a dependency workaround is necessary.
- Add a short comment above logic that enforces a surprising grading requirement.
- Give every named function a concise contract that states what it does, where it is used, why it exists, and how to read its name aloud. A short JSDoc block is preferred so the explanation stays attached to the function.
- Explain a variable or related group of variables when its role, lifetime, units, allowed values, or business meaning is not immediately clear. State and ref variables that coordinate asynchronous work require this context.

### 15.2 What not to comment

- Do not narrate obvious syntax, such as `// increment quantity` above `quantity + 1`.
- Do not annotate every import, style property, JSX prop, loop counter, or self-explanatory temporary merely to increase comment count.
- Do not leave stale comments that disagree with code.
- Do not use comments to hide unclear names or oversized functions; improve the code first.
- Do not paste prompts, conversations, secrets, tokens, passwords, or personal URLs into comments.
- Do not add large decorative comment banners that make files harder to scan.

### 15.3 Comment style

- Prefer a short comment immediately above the relevant block.
- Write complete, direct sentences.
- Keep comments accurate when behavior changes.
- Use `TODO(owner/context): action` only for real tracked follow-up work; remove it before submission unless the limitation is intentionally documented.
- Use JSDoc only where parameter/return contracts or reusable APIs benefit from it.
- For the required function reading line, split camelCase and PascalCase into spoken words and keep technical terms natural. Example: `authenticateCustomer` is read aloud as “authenticate customer,” while `API` is spoken as “A-P-I.”

## 16. Error, loading, and state rules

- Each remote screen distinguishes initial loading, refreshing, empty result, recoverable error, and rendered data.
- Disable actions while their request is pending.
- Never leave a button permanently disabled after a failed request.
- Display user-safe messages; do not expose stack traces or raw server internals.
- Log only development-safe diagnostic context and remove temporary logs before submission.
- Treat HTTP 401 and 403 from protected endpoints as authentication/session failures.
- Treat no filter results as an empty result, not an API error.
- Keep quantity state local to the selected restaurant/menu flow.
- Keep modal request states explicit, for example `idle`, `processing`, `success`, and `error`.
- Avoid boolean combinations that permit impossible states.

## 17. Environment variables and secrets

### 17.1 Client variable

Use:

```dotenv
EXPO_PUBLIC_API_URL=https://example-subdomain.ngrok-free.app
```

Rules:

- Do not add a trailing `/`; service functions add paths beginning with `/api`.
- Commit `.env.example` with a safe placeholder.
- Do not commit `.env` or `.env.local`.
- Restart Expo after changing environment values.
- Never store database credentials, JWT signing secrets, Twilio secrets, Notify.EU secrets, or signing credentials in the mobile client.

### 17.2 Backend secrets

- The supplied backend currently owns database, JWT-signing, Twilio, and Notify.EU configuration.
- Do not expose those values in the client or README.
- If local reviewer credentials are needed, put only appropriate instructions in the separate, non-committed submission summary.

## 18. Specification-driven workflow

Use this sequence for every feature:

1. Read the grading rows, wireframe, this global spec, and the relevant feature spec.
2. Update the feature spec before implementation if requirements or actual API evidence changed.
3. Create a feature branch from `dev`.
4. Prompt an AI tool with both `ai/ai-spec.md` and the exact feature spec.
5. Review every generated line before accepting it.
6. Run the feature's acceptance tests and compare the UI to the wireframe.
7. If the result is incomplete, improve the feature spec and perform a second spec-driven iteration.
8. After two spec iterations, manually debug remaining issues with focused logs, inspection, and small fixes.
9. Update/remove logs and stale comments.
10. Update docs/specs/tests to match the final behavior.
11. Commit cohesive changes and merge the completed feature into `dev` through the required review workflow.

Do not change code first and leave the specifications inaccurate.

## 19. Git branches and pull workflow

Required model:

```text
feature/* → dev → main
```

Rules:

- The GitHub repository is private during development.
- Add every coach as a collaborator.
- `main` is production-ready and is the only graded branch.
- `dev` is the integration branch.
- Create every `feature/*` branch from current `dev`.
- Merge completed features back into `dev`.
- Do not commit directly to `main`.
- Before submission, merge all completed features into `dev`, verify `dev`, then merge `dev` into `main`.
- The commit graph must visibly demonstrate feature → dev → main.
- Push regularly and provide at least two progress updates per week.
- Schedule at least one project review before Friday and respond to coaches within 24 hours.

Before merging:

- Review the diff.
- Confirm no secrets or generated files are staged.
- Run relevant tests/checks.
- Confirm the feature spec and global spec match reality.
- Confirm the feature acceptance criteria pass.

## 20. Commit-message standard

Use Conventional Commit-style messages:

```text
type(optional-scope): short imperative summary
```

Allowed common types:

- `feat`: new user-facing capability.
- `fix`: bug correction.
- `docs`: documentation/specification only.
- `test`: tests or test fixtures only.
- `refactor`: internal restructuring without behavior change.
- `style`: formatting only, not UI feature styling.
- `chore`: repository maintenance.
- `build`: dependency/build configuration.
- `ci`: automation configuration.

Rules:

- Use a concise imperative summary: `add`, `implement`, `prevent`, `document`.
- Start the summary with lowercase unless an exact proper name requires capitals.
- Do not end the subject with a period.
- Keep the subject near 72 characters or fewer.
- Use a meaningful scope when it helps, such as `client`, `auth`, `orders`, `docs`, or `api-spec`.
- One commit should represent one cohesive purpose.
- Use a body when the reason, risk, migration, or verification is not obvious.
- Mention verification in the body for risky or substantial changes.
- After every completed task that changes repository files, the AI's final handoff must include at least one copy-ready proposed commit based on the actual completed diff.
- For each proposed commit, present the exact staging command first and the copy-ready commit message immediately after it.
- Staging commands must use `git add -- <exact-paths>` or another narrowly scoped equivalent. Do not suggest `git add .`, `git add -A` without pathspecs, or any command that would stage unrelated user changes.
- When an in-scope file also contains unrelated existing edits, use `git add -p -- <path>` and state which hunk(s) belong to the proposed commit instead of staging the entire file.
- When the completed work contains multiple independent purposes, provide an ordered staging-command/commit-message pair for each cohesive commit and identify the files or change group that belongs with each pair.
- The AI must not create the commit unless the user explicitly asks it to commit; providing a proposed message does not authorize staging or committing files.
- When no repository file changed, the AI must state `No commit needed` instead of inventing a commit message.

Examples:

```text
feat(auth): persist customer session after login
feat(restaurants): add rating and price filters
fix(orders): prevent duplicate confirmation requests
docs(ai-spec): define Expo phone-testing workflow
test(client): cover zero-quantity order behavior
chore(gitignore): exclude Expo-generated files
```

Avoid:

```text
updates
fixed stuff
WIP
final final changes
```

## 21. Expo development commands

Run commands from `client/` unless stated otherwise.

### 21.1 Install

```bash
cd client
npm install
```

Use `npx expo install <package>` for Expo/React Native packages so Expo selects compatible versions.

### 21.2 Validate configuration

```bash
npx expo config --type public
npm ls --depth=0
```

### 21.3 Start locally

```bash
npm start
```

Equivalent:

```bash
npx expo start
```

### 21.4 Start with tunnel and clean cache

```bash
npx expo start --tunnel --clear
```

Use this for physical-device Expo loading when LAN mode is unreliable. This Expo tunnel serves the JavaScript bundle; it does not replace the separate ngrok tunnel to the Java backend.

### 21.5 Platform shortcuts

```bash
npm run android
npm run ios
npm run web
```

Web/inspect mode is useful for layout checks but does not replace iOS and Android verification.

### 21.6 Bundle/export smoke test

```bash
npx expo export --platform android
```

Also export/test iOS when the local toolchain and time allow. Generated `dist/` output must remain ignored.

## 22. Testing on a physical phone

Two connections are involved:

1. The phone loads the Expo JavaScript bundle from the Expo development server.
2. The mobile app calls the Java API through a public ngrok HTTPS URL.

### 22.1 Start the Java backend

From the repository root:

```bash
cd server
./mvnw spring-boot:run
```

Confirm the backend responds locally on port 8080 before introducing ngrok.

### 22.2 Start the backend tunnel

In another terminal:

```bash
ngrok http 8080
```

Copy the generated HTTPS forwarding URL. The URL normally changes when a free ngrok tunnel restarts.

### 22.3 Configure the client

Create/update `client/.env`:

```dotenv
EXPO_PUBLIC_API_URL=https://your-current-ngrok-url.ngrok-free.app
```

Do not commit this file.

### 22.4 Start Expo for the phone

```bash
cd client
npx expo start --tunnel --clear
```

Then:

1. Install/open Expo Go on the phone.
2. Ensure Expo Go supports the project's confirmed SDK version.
3. Scan the terminal/browser QR code.
4. Wait for the bundle to load.
5. Test the complete customer journey against the ngrok-backed Java API.

### 22.5 Phone troubleshooting order

1. Verify `http://localhost:8080` requests work in Postman on the computer.
2. Verify the ngrok HTTPS endpoint works in Postman without changing the request path/body.
3. Verify `EXPO_PUBLIC_API_URL` contains the current URL and no trailing slash.
4. Restart Expo with `--clear` after changing `.env`.
5. Confirm the fetch URL has `/api/...` exactly once.
6. Confirm protected calls include the bearer token.
7. Confirm the phone has internet access and Expo Go is compatible with the SDK.
8. Inspect client logs without printing secrets.

### 22.6 Required phone test scenarios

- Valid and invalid login.
- Restaurant loading and all four filter combinations: none, rating, price, both.
- Restaurant image navigation.
- Quantity plus/minus, zero floor, restaurant-change reset, and disabled Create Order.
- Successful and failed order submission states.
- Order-history loading and detail modal.
- Pending order with no courier.
- Logout and subsequent protected-route behavior.
- App reload/session behavior.

## 23. Testing and verification strategy

### 23.1 Before implementation

- Verify the relevant Java endpoint in Postman.
- Record its method, path, parameters, body, success response, failure response, and authentication requirement in the feature spec.
- Confirm the UI behavior from the wireframe and grading row.

### 23.2 Per feature

- Test every acceptance criterion.
- Test at least one success and one meaningful failure path.
- Test loading, empty, and retry behavior for remote data.
- Compare the finished screen/modal to the wireframe.
- Run on at least one native platform during development.

### 23.3 Integration

- Complete the entire customer journey without manually changing stored values or requests.
- Confirm a newly created order appears in Order History.
- Confirm customer data never leaks across login sessions.
- Confirm navigation state and quantities behave correctly after back/tab navigation.

### 23.4 Cross-platform

- Test on iOS and Android before submission.
- Compare font rendering, safe areas, scrolling, keyboard behavior, modals, icon alignment, and touch targets.
- Cross-platform visual identity is baseline-compatible; identical polished behavior can qualify as an extra mile only after coach review.

### 23.5 Repository checks

Run applicable checks before merging:

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

From `server/`, use read-only verification unless backend modification is separately authorized:

```bash
./mvnw test
```

If backend tests require unavailable local services, record the exact limitation and use the safest compile/package or Postman verification available; never claim a failed or skipped check passed.

## 24. Documentation and submission rules

Required committed root deliverables:

- `README.md`
- `RESEARCH.md`
- `CONCEPTS.md`
- `PostmanCollection.json`
- `ai/ai-spec.md`
- Eight exact feature specifications
- `LeetCode-Challenges/<challenge-name>.png` for all five assigned SQL challenges

README sections:

- Project title and clear description.
- Tech stack.
- Actual project structure.
- Installation/setup.
- Environment variables.
- API documentation.
- Author.
- Explicit `Not applicable` explanation for any graded section that truly does not apply.

Video requirements:

- Concepts video: 5–10 minutes, YouTube Unlisted.
- Five-challenge problem-solving video: 5–10 minutes, YouTube Unlisted.
- Technical demo and code overview: 5–10 minutes, YouTube Unlisted.

The submission summary:

- Is submitted separately as `.txt`, `.md`, `.docx`, or a public-view Google Doc.
- Contains student name, module name, repository link, every required video link, and appropriate reviewer credentials/instructions.
- Must not be committed to GitHub.

Only `main` is graded. Submit before Friday at 11:59 PM.

## 25. Rules for AI tools

AI tools must:

- Read this file first and the relevant feature spec second.
- Follow the source authority in Section 1.
- Inspect existing code and API contracts before proposing changes.
- Keep changes inside the requested feature scope.
- Use junior-readable code and explain non-obvious decisions.
- Preserve unrelated user changes.
- Update the feature spec when implementation evidence changes the contract.
- Add the required file purpose/contents header to new human-authored source files.
- Add meaningful inline comments only where Section 15 permits them.
- Test changes in proportion to risk and report exact results.
- End every completed file-changing handoff with the ordered, narrowly scoped staging command followed by its copy-ready commit message, as required by Section 20.

AI tools must not:

- Modify the Java backend unless the user and project authority explicitly allow it.
- Invent endpoints, JSON fields, dependencies, screens, or grading rules.
- Add secrets, credentials, or live ngrok URLs to tracked files.
- Replace exact wireframe behavior with generic components or styling.
- Add extra features before baseline requirements are complete.
- Rewrite unrelated code, delete user work, or conceal failing checks.
- Treat the generic feature template's `/docs/ai/...` placeholder path as authoritative; the grading sheet requires `ai/ai-spec.md` and `ai/features/*.feature.md`.

## 26. Global Definition of Done

The project is complete only when all applicable items below pass.

### 26.1 Repository and workflow

- [ ] The repository is private and all coaches are collaborators.
- [x] Feature work visibly followed `feature/*` → `dev` → `main`.
- [x] No direct implementation commits were made to `main`.
- [ ] `main` contains the final stable version and is pushed.
- [x] Git contains no secrets, local environment files, generated output, or submission summary.

### 26.2 Specifications and code quality

- [x] `ai/ai-spec.md` is current and was used before feature work.
- [x] All eight exact feature specs exist and match final behavior.
- [x] Human-authored source/docs contain the required purpose/contents header or Markdown TOC where supported.
- [x] Naming and inline comments follow Sections 13–15.
- [x] No debug code, stale comments, unexplained TODOs, or dead code remains.

### 26.3 Functionality

- [x] Email/password login succeeds with valid credentials.
- [x] Invalid credentials show an inline error above Login.
- [x] JWT and customer identity persist and protected requests use the bearer token.
- [x] Header/footer visibility, logo, logout, and three-level navigation work.
- [x] All restaurants load by default.
- [x] Rating, price, and combined filters work with placeholders when unset.
- [x] Restaurant-image navigation opens the correct menu.
- [x] Quantities start/reset at zero, use buttons only, and never become negative.
- [x] Create Order disables at zero and opens the correct modal when enabled.
- [x] Confirmation details and currency values are accurate.
- [x] Processing, success, failure, retry, and duplicate-submission behavior work.
- [x] Order History shows Order, Status, and View.
- [x] The detail modal shows correct date, status, courier, products, prices, and totals.
- [x] Missing courier data displays safely.

### 26.4 Design and platforms

- [ ] Every graded page/modal matches the wireframe.
- [x] Every color uses the exact graded palette.
- [x] Supplied assets and `/images/restaurants` are present.
- [x] Header/footer and scrolling rules are satisfied.
- [x] The full journey works on iOS and Android.
- [x] The full journey works on a physical phone through Expo and ngrok when phone testing is used.

### 26.5 Testing and deliverables

- [x] Postman covers every Module 13 endpoint used by the mobile app with preconfigured parameters and no query edits.
- [ ] Expo configuration, dependency, bundle/export, and applicable automated/manual checks pass.
- [x] `README.md`, `RESEARCH.md`, `CONCEPTS.md`, and `PostmanCollection.json` are complete.
- [x] All five LeetCode screenshots exist.
- [ ] Concepts, LeetCode, and technical-demo videos are 5–10 minutes, Unlisted, and accessible.
- [x] The separate submission summary contains all required links and information but is not in Git.
- [ ] Both required progress updates are complete.
- [x] Coach review is complete.
- [ ] The platform submission is completed before Friday at 11:59 PM.
