# AI Feature Specification — Navigation Structure

> Canonical current-state contract for the navigation hierarchy introduced in M13 and extended for Customer and Courier roles in M14. The M14 changes are treated as updates to the original feature.

## 1. Feature identity

- **Feature:** Combined Customer and Courier Navigation Structure
- **Area:** Expo Router, authentication, session restoration, role boundaries
- **Implementation:** Root Stack → role-specific Tabs → nested Customer Restaurant Stack
- **Canonical specification:** `ai/features/navigation-structure.feature.md`
- **M14 extension:** Account Selection, Courier tabs, Account tabs, and role-aware guards/session identity

## 2. Goal

The application exposes exactly one route tree for a resolved session: Login, Account Selection, Customer, or Courier. Customer Restaurant List and Restaurant Menu remain nested in the Restaurants tab, while Courier uses a separate protected tab tree. Invalid or cleared sessions cannot retain a protected back path.

## 3. Implemented scope

- `client/app/_layout.js` owns the only root Stack and the four mutually exclusive protected branches.
- `client/app/index.js` is the public Login route.
- `client/app/selection.js` is the dual-role Account Selection route.
- Customer tabs are Restaurants, Order History, and Account.
- Courier tabs are Order Delivery and Account.
- The Customer Restaurants tab owns the nested Restaurant List → Restaurant Menu Stack.
- Customer and Courier tab layouts own the shared authenticated header.
- Login and Account Selection have no authenticated header or footer.
- Auth storage and context persist and restore token, user identity, role identities, and active role.
- Root and role-layout guards reject missing, corrupt, or wrong-role state.

Out of scope are employee/restaurant-owner routes, an in-app role switcher, extra tabs or drawers, and role identity in route parameters.

## 4. Route contract

```text
Root Stack
├── index                          Login; no valid session
├── selection                      dual-role session; no active role
├── customer                       activeRole = customer
│   └── Customer Tabs
│       ├── restaurant             Restaurants; initial tab
│       │   └── Restaurant Stack
│       │       ├── index          Restaurant List
│       │       └── [restaurantId] Restaurant Menu
│       ├── order-history          Order History
│       └── account                Customer Account
└── courier                        activeRole = courier
    └── Courier Tabs
        ├── index                  Order Delivery; initial tab
        └── account                Courier Account
```

Only `restaurantId` is passed to Restaurant Menu. Tokens, role IDs, customer/courier objects, and passwords remain in the session/service boundary.

## 5. Session contract

The normalized session shape is:

```js
{
  accessToken: string,
  userId: number,
  customerId: number | null,
  courierId: number | null,
  activeRole: 'customer' | 'courier' | null,
}
```

- A usable session has a nonblank token, a positive user ID, and at least one positive supported role ID.
- Customer-only and courier-only sessions derive their only possible active role.
- A dual-role session initially has `activeRole = null` and must use Account Selection.
- A restored active role is valid only when its matching role ID exists.
- A new login clears stale values from the previous identity before saving the replacement.
- Corrupt, partial, unsupported, or mismatched storage is cleared and resolves to Login.
- Logout and shared unauthorized handling clear every session key before context becomes unauthenticated.

## 6. Navigation behavior

### Startup

1. The root waits for fonts and persisted session restoration.
2. Protected content does not flash during loading.
3. The validated session selects one root branch.

### Single-role login

1. Authentication returns a token, user ID, and exactly one supported role ID.
2. Storage derives and persists the matching active role.
3. Root guards expose that role's tab tree at its initial tab.

### Dual-role login

1. Authentication returns both customer and courier IDs.
2. Storage saves both IDs without choosing a role.
3. Account Selection is the only exposed route.
4. A successful persisted choice exposes the matching tab tree.

### Customer navigation

1. Restaurants opens as the initial Customer tab.
2. Restaurant List opens Menu inside the nested Restaurant Stack.
3. Back returns Menu to Restaurant List without removing the Customer header or footer.
4. Order History and Account remain sibling Customer tabs.

### Courier navigation

1. Order Delivery opens as the initial Courier tab.
2. Account is the second Courier tab.
3. Customer destinations remain outside the Courier tree.

### Logout or expiry

1. The shared session clear runs.
2. Context publishes `session = null`.
3. All protected branches close and Login becomes the only route.
4. Normal back navigation cannot restore protected content.

## 7. File ownership

| File | Responsibility |
| --- | --- |
| `client/app/_layout.js` | Providers, font/session loading, mutually exclusive root guards |
| `client/app/index.js` | Login and role-capable sign-in submission |
| `client/app/selection.js` | Persisted dual-role choice |
| `client/app/customer/_layout.js` | Customer tabs, header, and customer-role guard |
| `client/app/customer/restaurant/_layout.js` | Nested Restaurant Stack |
| `client/app/courier/_layout.js` | Courier tabs, header, and courier-role guard |
| `client/services/authService.js` | Login-response validation and normalization |
| `client/storage/authStorage.js` | Canonical storage, restoration, role selection, and clearing |
| `client/contexts/AuthContext.js` | In-memory session transitions and shared unauthorized flow |

## 8. Evolution and decisions

- M13 established Login → Customer Tabs → nested Restaurant Stack.
- M14 extended that same hierarchy with optional Account Selection, Courier Tabs, both Account destinations, role-capable session identity, and mutually exclusive root guards.
- Expo Router `Stack.Protected` guards are the source of root authorization; screens do not imperatively push themselves around session state.
- Role tabs remain separate layouts so Customer and Courier destinations cannot mix.
- Account Selection persists first and relies on guard recomputation instead of pushing a protected route early.
- The authenticated header belongs to each role Tabs navigator; the nested Restaurant Stack hides its own header.

## 9. Acceptance criteria

- [x] Root exposes only Login, Selection, Customer, or Courier for the corresponding validated state.
- [x] Customer tabs are exactly Restaurants, Order History, Account, in that order.
- [x] Courier tabs are exactly Order Delivery, Account, in that order.
- [x] Restaurant Menu remains inside the Restaurants tab with header/footer intact.
- [x] Customer-only, courier-only, and dual-role sessions normalize consistently across service, storage, context, and guards.
- [x] Stale role keys are removed on replacement login and every role key is removed on logout.
- [x] Login and Selection have no role chrome; protected destinations do.
- [x] Account and Order Delivery destinations contain their completed features rather than placeholders.
- [ ] Representative iOS/Android launch, deep-link, back, restart, and logout flows require native verification.

## 10. Verification boundary

Static inspection and successful Expo export establish route composition and buildability. They do not prove native back gestures, deep-link recovery, restoration timing, or visual layout; those remain manual device checks until exercised.
