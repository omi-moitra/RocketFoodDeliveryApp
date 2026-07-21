# AI Feature Specification — Account Details

> Current-state contract for the shared Customer/Courier Account Settings experience and its verified account API.

## 1. Feature identity

- **Feature:** Account Details
- **Routes:** Customer Account and Courier Account tabs
- **Area:** Shared form, role-isolated account API, validation, persistence
- **Architecture:** Two protected route wrappers rendering one shared screen

## 2. Goal

An authenticated Customer or Courier can view their primary user email and edit only the email and phone belonging to the active role. Both routes use the same screen and service behavior, while session and response identity checks prevent inactive-role or another user's data from being displayed or changed.

## 3. Implemented scope

- Customer and Courier Account routes render `AccountScreen` with an explicit expected role.
- The primary user email is visible and read-only.
- The active role's email and phone are editable.
- Values are trimmed and validated before submission.
- Save is disabled for unchanged, invalid, or pending state.
- Successful updates use the authoritative response as the new saved snapshot.
- Failed saves retain the drafts and permit retry.
- Loading, retry, save progress, success, and safe error states are distinct.
- Late requests cannot update after blur, logout, role change, newer request, or unmount.
- Both role routes retain their authenticated header and correct footer.

Out of scope are changing primary email, name, address, password, inactive-role details, registration, deletion, role switching, and employee Account UI.

## 4. Display and edit contract

| Field | Customer | Courier | Editable |
| --- | --- | --- | --- |
| User Email | Top-level user email | Top-level user email | No |
| Customer Email | Active Customer email | Not shown | Yes |
| Customer Phone | Active Customer phone | Not shown | Yes |
| Courier Email | Not shown | Active Courier email | Yes |
| Courier Phone | Not shown | Active Courier phone | Yes |

Name, address, password, employee data, and the inactive supported role are not normalized into the screen model.

## 5. Read contract

```http
GET /api/account/{userId}?type={customer|courier}
Authorization: Bearer <accessToken>
```

The controller does not consume `type`; the query is accepted and the endpoint returns the full account envelope:

```json
{
  "message": "Success",
  "data": {
    "id": 1,
    "name": "User Name",
    "email": "primary@example.com",
    "customer": {
      "id": 1,
      "phone": "555-0100",
      "email": "customer@example.com",
      "address": "..."
    },
    "courier": null
  }
}
```

Role properties are omitted when null and more than one role may be present. The client selects only `data[activeRole]` and requires:

- response `data.id` equals stored `userId`;
- selected nested role exists;
- selected nested role ID equals the matching stored role ID;
- primary email, role email, and role phone are usable strings.

A mismatch fails closed as a malformed response.

## 6. Update contract

```http
POST /api/account/{userId}
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "account_type": "customer",
  "account_email": "customer@example.com",
  "account_phone": "555-0100"
}
```

- `account_type` is exactly `customer` or `courier` for the mobile routes.
- The path uses stored `userId`, not the customer/courier ID.
- The nested role ID is used for ownership verification, not routing.
- Primary email is never included in the body.
- The endpoint returns `200 { message: "Success", data: ApiAccountDTO }`.
- The response is re-normalized through the same identity checks before the UI accepts it.
- Existing `PUT /api/account/{id}?type=...` behavior remains available and unchanged.

Error behavior is `400` for missing/invalid account type or invalid input, `404` for a missing user/role, `401/403` for an unusable session, `5xx` for service failure, and a client response error for a malformed success envelope.

## 7. Validation and dirty state

- Email and phone are trimmed.
- Email must match the shared email validator.
- Phone must match the shared phone validator.
- Field-specific accessible errors appear without a request.
- `isDirty` compares current drafts with the last authoritative snapshot.
- An unchanged form sends zero requests.
- Editing after error/success returns save presentation to idle while preserving the current snapshot.
- A failed save changes neither saved values nor drafts.

## 8. Loading, save, and concurrency

- Initial load uses loading, ready, or error state.
- Focus reload refreshes authoritative data without overwriting unsaved edits incorrectly.
- A ref lock and disabled state prevent duplicate saves.
- Save displays progress and remains pending until the response is validated.
- Request generations, abort controllers, and mount guards reject stale results.
- HTTP 401/403 uses shared unauthorized cleanup.
- User-visible errors are classified and do not expose raw server details or identifiers.

## 9. Interfaces

| File | Responsibility |
| --- | --- |
| `client/app/customer/account.js` | Protected Customer wrapper; passes `expectedRole="customer"` |
| `client/app/courier/account.js` | Protected Courier wrapper; passes `expectedRole="courier"` |
| `client/components/AccountScreen.js` | Shared form, load/save state, validation, accessibility |
| `client/services/accountService.js` | Session checks, API requests, normalization, errors |
| `client/utils/validation.js` | Shared email, phone, and positive-ID validation |
| `server/.../controller/api/UserApiController.java` | GET, retained PUT, and official POST account contracts |
| `server/.../dtos/user/ApiPostAccountDTO.java` | Official POST body |

## 10. Decision record

Claude verified that GET safely accepts the official `type` query even though the controller ignores it. For updates, Claude presented three choices: use the existing PUT from the frontend, add a POST alias mirroring PUT, or implement the official POST body. The user selected the official `POST /api/account/{userId}` contract with `{ account_type, account_email, account_phone }`. The implementation adds one POST mapping that delegates to the existing account-update service; GET and PUT remain unchanged.

## 11. Acceptance criteria

- [x] Customer and Courier routes share one screen and service implementation.
- [x] Each wrapper and service requires its expected active role.
- [x] Requests use stored `userId`; nested role IDs verify ownership.
- [x] Primary email is read-only and never submitted.
- [x] Only active-role email and phone are exposed and editable.
- [x] Invalid and unchanged values send zero requests.
- [x] One pending save blocks duplicates and uses the authoritative response.
- [x] Failed saves preserve drafts and permit retry.
- [x] Late or unauthorized requests cannot publish stale Account data.
- [x] POST updates persist Customer/Courier values while preserving primary email in backend tests.
- [x] Account API tests, the full backend suite, Expo config/export, and dependency checks passed in the implementation verification record.
- [x] Postman contains nonsecret GET/POST requests for both roles.
- [ ] Native keyboard, scrolling, screen-reader, visual wireframe, and dual-role render checks remain manual.
- [ ] DBeaver before/after evidence remains an operator check.

## 12. Verification boundary

Backend tests prove endpoint behavior and database persistence exercised by those tests. During the 2026-07-21 specification re-audit, the suite compiled and discovered 120 tests but the local MySQL instance was unavailable; the resulting 116 Spring-context errors were environmental, with zero assertion failures, and are not recorded as a fresh pass. Static client inspection and Expo export prove implementation shape and buildability. They do not prove native keyboard avoidance, scrolling, screen-reader behavior, or exact visual fidelity.
