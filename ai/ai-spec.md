# Rocket Food Delivery Mobile App — Global AI Specification

> Canonical project contract for the mobile application created in M13 and extended in M14. M14 behavior is treated as an update to the same product rather than a separate implementation phase.

## 1. Authority and purpose

This file is the single global AI specification for the repository. Feature specifications provide the detailed behavior for their bounded areas; current source code, tests, Postman requests, and explicitly recorded user decisions provide implementation evidence.

Priority for resolving conflicts is:

1. Current user instruction.
2. Official grading requirements and supplied materials.
3. This global specification.
4. The relevant feature specification.
5. Existing implementation evidence.

When an established decision is material, the feature specification records the choices Claude presented and the user's selection. The normative contract is written as the selected design, not as an unresolved future option.

## 2. Project identity

- **Product:** Rocket Food Delivery mobile client and Spring Boot API
- **Frontend:** Expo SDK 54, Expo Router 6, React Native 0.81, JavaScript
- **Backend:** Spring Boot, Java 17-compatible source, JPA, MySQL, JWT
- **Supported mobile roles:** Customer and Courier
- **Platforms:** iOS and Android
- **API configuration:** `EXPO_PUBLIC_API_URL`
- **Visual sources:** `client/docs/m13/` and `client/docs/m14/`

## 3. Product goal and scope

The application supports one protected food-delivery experience with role-aware navigation:

- Customers authenticate, browse/filter restaurants, inspect menus, select quantities, create orders with optional SMS/email confirmation, inspect order history/details, and edit Customer contact details.
- Couriers authenticate, view eligible deliveries, accept pending orders, progress assigned work to Delivered, inspect delivery details, and edit Courier contact details.
- Dual-role users explicitly select Customer or Courier before entering a role application.
- Logout and expired sessions clear protected identity and return to Login without a usable protected back path.

Out of scope are registration, password recovery, employee/restaurant-owner mobile roles, in-app role switching, maps/routing, direct provider configuration, rating entry, dark mode, and unrelated backend/schema redesign.

## 4. Canonical feature specifications

### Features introduced in M13 and updated by the current product

1. `ai/features/navigation-structure.feature.md` — canonical navigation feature extended for M14 roles and tabs
2. `ai/features/login-page.feature.md`
3. `ai/features/header-footer.feature.md`
4. `ai/features/restaurant-list-page.feature.md`
5. `ai/features/restaurant-menu-page.feature.md`
6. `ai/features/menu-modal-confirmation.feature.md`
7. `ai/features/order-history-page.feature.md`
8. `ai/features/order-history-modal.feature.md`

### M14 additions

1. `ai/features/role-based-navigation.feature.md`
2. `ai/features/courier-delivery.feature.md`
3. `ai/features/account-details.feature.md`
4. `ai/features/order-confirmation-modal.feature.md`
5. `ai/features/ui.feature.md`
6. `ai/features/code-quality.feature.md`

`ai/features/feature-name.feature.md` is an ignored inactive template, not a product feature. The former M14 navigation specification was merged into the original Navigation Structure feature.

At project completion, when no features remain to be implemented, delete the inactive `ai/features/feature-name.feature.md` template.

## 5. User journeys

### Authentication

- Customer-only login opens Customer Restaurants.
- Courier-only login opens Courier Order Delivery.
- Dual-role login opens Account Selection with no authenticated role chrome.
- A persisted Customer/Courier choice opens the matching tab tree.
- Invalid credentials, malformed success data, or failed persistence leave a safe retry path.

### Customer

```text
Login / Account Selection
→ Restaurants
→ optional Rating and Price filters
→ Restaurant Menu
→ quantity selection
→ Order Confirmation with SMS/email choices
→ success or retryable failure
→ Order History
→ Order Details
→ Account Settings
```

### Courier

```text
Login / Account Selection
→ Order Delivery
→ eligible Pending / assigned In Progress / assigned Delivered rows
→ status progression and/or Delivery Details
→ Account Settings
```

## 6. Navigation architecture

The canonical hierarchy is defined by `ai/features/navigation-structure.feature.md`:

```text
Root Stack
├── Login                          no valid session
├── Account Selection              dual role; no active role
├── Customer Tabs                  active Customer role
│   ├── Restaurants
│   │   └── Restaurant Stack
│   │       ├── Restaurant List
│   │       └── Restaurant Menu
│   ├── Order History
│   └── Account
└── Courier Tabs                   active Courier role
    ├── Order Delivery
    └── Account
```

- Root authorization uses mutually exclusive Expo Router `Stack.Protected` guards.
- Customer/Courier layouts also reject missing or wrong-role sessions.
- Role Tabs own the shared authenticated header and footer.
- Login and Account Selection have no role header/footer.
- Restaurant Menu receives only `restaurantId`; authentication and role identity never travel in route parameters.

## 7. Authentication and session contract

`POST /api/auth` receives email/password and returns a success payload normalized to:

```js
{
  accessToken: string,
  userId: number,
  customerId: number | null,
  courierId: number | null,
  activeRole: 'customer' | 'courier' | null,
}
```

- Token, positive user ID, and at least one supported positive role ID are required.
- A single available role is derived and persisted.
- Both roles require explicit selection and initially persist no active role.
- Stored active role is valid only when its matching ID exists.
- A replacement login clears stale values before saving the new identity.
- Corrupt, partial, or unsupported storage is cleared and resolves to Login.
- Passwords are never persisted.
- Logout and protected HTTP 401/403 handling share centralized, serialized cleanup.

Storage keys are owned only by `client/storage/authStorage.js`; transitions are coordinated by `client/contexts/AuthContext.js`.

## 8. API contracts

Except for login, mobile `/api/**` calls include `Authorization: Bearer <accessToken>`. The client validates success envelopes and normalizes snake_case backend data at service boundaries.

### Authentication and Customer browsing

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth` | Authenticate and return user/role identity |
| `GET` | `/api/restaurants` | List restaurants; optional `rating` and `price_range` |
| `GET` | `/api/restaurants/{id}` | Load the selected restaurant |
| `GET` | `/api/products?restaurant={id}` | Load products for one menu |
| `GET` | `/api/orders?type=customer&id={customerId}` | Load Customer order history |

### Order creation

`POST /api/orders` sends:

```json
{
  "restaurant_id": 1,
  "customer_id": 1,
  "products": [{ "id": 1, "quantity": 2 }],
  "sendSMS": false,
  "sendEmail": false
}
```

- Only positive-quantity products are sent.
- Customer identity comes from storage at request time.
- `sendSMS` and `sendEmail` are independent literal booleans and canonical camelCase HTTP keys.
- Missing flags default to false; legacy `send_sms`/`send_email` HTTP keys are unsupported.
- One Confirm action sends one order request; notification work is not a separate client request.

### Courier delivery

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/orders/pending` | Load every available pending order |
| `GET` | `/api/orders?type=courier&id={courierId}` | Load the active courier's assigned orders |
| `PUT` | `/api/orders/{orderId}` | Broad update used to set status ID 2 or 3 while echoing existing required fields |
| `PUT` | `/api/order/{orderId}/courier` | Assign `{ "courier_id": courierId }` |

Status progression is Pending ID `1` → In Progress ID `2` → Delivered ID `3` → locked. Pending acceptance updates status first, then assigns the courier. A status-success/assignment-failure state exposes retry assignment and is not reported as full success.

The order response includes `restaurant_rating`; the Courier client round-trips it with `restaurant_id` and `customer_id` through the established broad update so a status action does not erase unrelated order data.

### Account

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/account/{userId}?type={role}` | Return full account; query accepted/ignored, client selects active role |
| `POST` | `/api/account/{userId}` | Update active-role email/phone using official body |

The POST body is:

```json
{
  "account_type": "customer",
  "account_email": "customer@example.com",
  "account_phone": "555-0100"
}
```

Primary user email is read-only and never submitted. The client validates both top-level `userId` and the active nested role ID before displaying or accepting response data. Existing Account PUT behavior remains unchanged for compatibility.

## 9. Implemented API decisions

### Courier status safety

Claude identified that the broad order update required `restaurant_rating` but the response omitted it. The user selected the smallest compatibility solution: expose the existing rating in `ApiOrderDTO` and map it in `OrderService`, allowing lossless use of the existing endpoint without a new status API.

### Account update

Claude presented frontend PUT, POST alias, and official POST-body approaches. The user selected `POST /api/account/{userId}` with `{ account_type, account_email, account_phone }`, implemented as one controller mapping delegating to the existing service. GET and PUT remain unchanged.

### Notification keys

Claude presented snake_case adaptation, camelCase aliases, and canonical camelCase. After initially selecting aliases, the user revised the decision: `sendSMS` and `sendEmail` are canonical; legacy snake_case HTTP keys are not accepted.

## 10. UI and accessibility contract

### Palette

The shared theme owns:

- Orange Red `#DA583B`
- Dark Charcoal `#222126`
- Dark Red `#851919`
- Muted Green `#609475`
- Warm Yellow `#F0CB67`
- White `#FFFFFF`

Delivery status uses red Pending, orange In Progress, and green Delivered with visible labels so color is never the only meaning.

### Typography

- Display text uses bundled Oswald Regular/SemiBold.
- iOS/default body text uses native Arial.
- Android uses bundled `Arimo_400Regular`, selected by the user as an Arial-metric-compatible face because Android does not provide Arial.
- Fonts load at root before route content; a load failure falls back safely.

### Layout and interaction

- `SafeAreaProvider` is installed at root.
- Long collections use established `FlatList` owners.
- Forms and fixed content use a single appropriate `ScrollView` owner.
- Account uses keyboard avoidance.
- Modal content scrolls while essential controls remain reachable by design.
- Shared touch targets are at least 48 points.
- Buttons, tabs, checkboxes, status controls, errors, successes, and pending states expose text/shape/accessibility state rather than color alone.
- Login and Selection have no authenticated chrome; protected role surfaces retain their correct header/footer.

## 11. Cross-feature behavior

- Services read current token and role identity from storage at request time.
- Screens do not receive tokens or private identities through props or route parameters.
- API responses are untrusted until envelope, IDs, field types, ownership, and required values validate.
- Request locks prevent duplicate login, selection, save, confirmation, and delivery mutations.
- Abort controllers/generation guards prevent late responses after close, blur, logout, role change, or unmount.
- HTTP 401/403 uses shared unauthorized cleanup.
- Recoverable validation, response, service, and connection failures retain user work where safe and display user-safe messages.
- Raw server details, stack traces, tokens, passwords, and secrets never enter the interface or logs.

## 12. Technology and repository boundaries

- Frontend code remains Expo/React Native JavaScript with Expo Router, Context, AsyncStorage, and the shared fetch client.
- The backend remains Spring Boot/JPA/MySQL with the existing schema.
- Frontend services adapt backend wire shapes into stable camelCase view models.
- Shared behavior belongs in reusable components, services, storage, context, constants, or utilities rather than duplicated route files.
- Dependencies are added only for demonstrated requirements; Oswald and the user-selected Android Arimo font packages are the current font dependencies.
- Original support material is never loaded directly at runtime or edited as application assets.

## 13. Environment and secrets

- Client API base URL is `EXPO_PUBLIC_API_URL` with no trailing API path requirement.
- `.env.example` documents configuration; live `.env` values are not committed.
- The mobile client talks to the Java REST API, never directly to MySQL.
- Physical-device development may use a current HTTPS tunnel; no live tunnel domain is hard-coded.
- Database credentials, JWT secrets, bearer tokens, passwords, provider keys, and private implementation logs are not committed or exposed.

## 14. Code and documentation conventions

- Files and functions use established JavaScript/Java naming conventions.
- Components/screens use PascalCase; functions/variables use camelCase; constants use descriptive stable names.
- Route filenames follow Expo Router conventions.
- Comments explain non-obvious invariants, ownership, race protection, or compatibility decisions; they do not narrate obvious syntax.
- Feature specs describe current contracts and distinguish automated evidence from manual/native verification.
- Material API decisions are documented here, in the owning feature spec, README/Postman when applicable, and the private implementation record.

## 15. Verification strategy

### Automated and static

- `git diff --check`
- `npm ls --depth=0`
- `npx expo config --type public`
- `npx expo export --platform android`, with generated output removed
- Focused backend tests for changed DTO/controller/service behavior
- Full `./mvnw test` when the configured MySQL test database is available
- JSON parsing and secret review of `PostmanCollection.json`

### Manual/native

- Customer-only, Courier-only, and both dual-role choices
- Startup restoration, logout, session expiry, back, restart, and deep-link behavior
- Complete Customer and Courier journeys
- Small-screen scrolling, keyboard, safe areas, dynamic text, landscape, and wide layouts
- Screen-reader focus/order, announcements, selected/checked states, and contrast
- Wireframe comparison for all required M14 surfaces
- DBeaver/Postman confirmation of persistence where required

Static inspection and export do not prove native interaction, visual fidelity, device safe areas, keyboard behavior, or screen-reader output.

During the 2026-07-21 specification reconciliation, the backend compiled and discovered 120 tests, but the local MySQL instance was unavailable; 116 Spring-context errors followed with zero assertion failures. The four database-independent order-notification DTO tests passed. Earlier successful DB-backed implementation evidence remains recorded in the relevant feature specs without being represented as a fresh full-suite pass.

## 16. Global Definition of Done

- [x] One canonical global AI specification describes the combined M13/M14 product.
- [x] One canonical Navigation Structure feature describes the hierarchy introduced in M13 and extended in M14.
- [x] Root guards, role persistence, Customer/Courier tabs, and shared session cleanup are implemented.
- [x] Restaurant browsing, menu selection, order creation/history, Courier delivery, Account editing, and notification choices have implemented feature contracts.
- [x] Final API decisions for courier rating preservation, Account POST, and camelCase notification keys are documented.
- [x] Palette, Oswald, and Arial/Arimo typography policies are centralized.
- [x] Postman uses nonsecret variables and documents the active mobile API calls.
- [ ] Representative native Customer/Courier journeys and cross-platform accessibility/layout checks remain to be recorded.
- [ ] Operator Postman/DBeaver checks remain where individual feature specs identify them.
