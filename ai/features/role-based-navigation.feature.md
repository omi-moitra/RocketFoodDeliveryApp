# AI Feature Specification — Role-Based Navigation

> Current-state contract for login role resolution, Account Selection, session persistence, and role isolation.

## 1. Feature identity

- **Feature:** Role-Based Navigation
- **Area:** Login normalization, AsyncStorage, AuthContext, Expo Router guards
- **Roles:** Customer and Courier
- **Dependency:** `navigation-structure.feature.md` (the original M13 feature updated for M14)

## 2. Goal

A successful login opens the only role the user has or asks a dual-role user to choose. The selected role is persisted and determines both visible navigation and service identity. Missing, malformed, stale, or wrong-role state fails closed without exposing the other role's routes or data.

## 3. Implemented behavior

### Authentication response

`client/services/authService.js` accepts the backend success envelope only when it contains:

- a nonblank `accessToken`;
- a positive `user_id`;
- at least one positive `customer_id` or `courier_id`.

Numeric IDs may arrive as numbers or numeric strings. Missing role IDs normalize to `null`. A response with neither supported role is rejected as malformed.

### Role derivation

| Available identity | Persisted active role | Destination |
| --- | --- | --- |
| Customer only | `customer` | Customer Restaurants |
| Courier only | `courier` | Courier Order Delivery |
| Customer and Courier | `null` until selection | Account Selection |

The app never guesses for a dual-role user.

### Account Selection

- Displays explicit Customer and Courier actions.
- Has neither authenticated header nor role tab bar.
- Locks both controls while one selection is being saved.
- Calls the shared `selectRole` context action; it does not access storage directly.
- Persists the choice before the root guard exposes protected content.
- Keeps the user on Selection with a safe retry message if persistence fails.
- Rejects a role that is not present in the current session.

### Restoration and invalid state

- Startup waits for storage restoration.
- Stored role selection is accepted only when the matching role ID is present.
- A single-role stored session derives its matching active role.
- Corrupt or partial values are cleared together and resolve to Login.
- A fresh login clears previous token, identity, role IDs, and active-role values before saving the new session.

### Logout and unauthorized responses

- Header logout and protected-request HTTP 401/403 use the same context transition.
- Duplicate clear operations share an in-flight promise.
- Storage is cleared before the in-memory session becomes null.
- Failed manual logout retains the session and allows retry rather than claiming success.
- Successful clearing closes all protected guards, so back navigation cannot reopen them.

## 4. Role isolation

- Customer layout requires `activeRole === 'customer'` and a valid `customerId`.
- Courier layout requires `activeRole === 'courier'` and a valid `courierId`.
- Account services additionally require the screen's expected role to match the stored role.
- Courier delivery services require the active Courier role and use `courierId` for ownership.
- Customer order operations use `customerId` from storage.
- No screen derives role from a pathname, tab label, email, or route parameter.
- Inactive-role account details are neither normalized for display nor submitted.

## 5. User flows

### Customer-only login

1. Login validates credentials and receives a Customer-only normalized session.
2. AuthContext persists it.
3. Storage derives `activeRole = customer`.
4. Root guards expose Customer tabs at Restaurants.

### Courier-only login

1. Login receives a Courier-only normalized session.
2. Storage derives `activeRole = courier`.
3. Root guards expose Courier tabs at Order Delivery.

### Dual-role login and choice

1. Both role IDs are persisted with no active role.
2. Root guards expose Account Selection only.
3. The user chooses Customer or Courier.
4. The choice is validated and persisted.
5. Root guards replace Selection with the chosen role tree.

### Failure recovery

- Invalid credentials or malformed success data leave Login available with a user-safe error.
- A login storage failure clears any partial replacement state and leaves Login available.
- A selection storage failure preserves the dual-role identity and Selection route for retry.
- Session expiry clears the session and returns to Login.

## 6. Interfaces

| File | Responsibility |
| --- | --- |
| `client/services/authService.js` | Validates and maps optional backend role IDs |
| `client/storage/authStorage.js` | Owns keys, normalization, derivation, save/restore/select/clear |
| `client/contexts/AuthContext.js` | Publishes session state and serialized session transitions |
| `client/app/_layout.js` | Maps validated state to one protected root branch |
| `client/app/selection.js` | Captures one explicit dual-role choice |
| `client/app/customer/_layout.js` | Enforces Customer role boundary |
| `client/app/courier/_layout.js` | Enforces Courier role boundary |

## 7. State and concurrency rules

- Login and Selection each use an immediate ref lock plus visible pending state to block duplicate taps.
- Context serializes sign-in, role selection, logout, and unauthorized cleanup.
- A late request cannot reopen a guard after logout or role change.
- Sensitive values are never logged, displayed, or passed as route parameters.
- Passwords are never persisted.

## 8. Implementation decision record

Claude audited the Navigation Structure implementation and found the role-aware service, storage, context, selection screen, and guards already conformed to this contract. The user-selected outcome was to preserve that implementation unchanged; this feature therefore required specification reconciliation rather than another navigation rewrite.

## 9. Acceptance criteria

- [x] Customer-only login opens Customer Restaurants without Selection.
- [x] Courier-only login opens Courier Order Delivery without Selection.
- [x] Dual-role login exposes Selection and no role app until a choice is persisted.
- [x] Selection prevents duplicate writes and supports safe retry.
- [x] Restored sessions validate active role against available role IDs.
- [x] Corrupt or stale role state is cleared atomically.
- [x] Customer and Courier route/service boundaries use the correct stored identities.
- [x] Logout and 401/403 share centralized cleanup.
- [x] No client implementation change was needed during the final role-navigation audit.
- [ ] Full customer-only, courier-only, both dual-role choices, native back, and restart scenarios require device verification.

## 10. Verification boundary

Code inspection verifies guards, persisted shapes, and failure branches. Device execution is still required to prove visual transitions, platform back behavior, restart restoration, and absence of transient protected content.
