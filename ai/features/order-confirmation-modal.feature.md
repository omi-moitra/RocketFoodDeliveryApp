# AI Feature Specification — Order Confirmation Modal

> Current-state contract for independent SMS/email confirmation choices within the existing Customer order-confirmation flow.

## 1. Feature identity

- **Feature:** Order Confirmation Notification Options
- **Component:** `client/components/OrderConfirmationModal.js`
- **Endpoint:** `POST /api/orders`
- **Area:** Customer order review, opt-in state, request mapping, result handling

## 2. Goal

Before placing an order, a customer can independently request confirmation by SMS and/or email. The chosen booleans travel in the same create-order request as the products. Notification choices never create a separate request, never imply provider delivery, and do not alter the established order summary, total, submission, or quantity-reset behavior.

## 3. Implemented scope

- Two independent accessible checkboxes:
  - `By Phone (SMS)` → `sendSMS`
  - `By Email` → `sendEmail`
- Both choices default to `false` for a fresh order.
- All four combinations are supported.
- Choices are frozen for each in-flight submission.
- Processing disables both checkboxes and Confirm.
- Retry retains the draft and allows either choice to change.
- Closing before success preserves the unconsumed draft choices.
- Closing a successful order resets both choices with the consumed product quantities.
- The service sends both booleans using the canonical backend JSON keys.
- Backend notification services run only after successful order creation and only for enabled flags.

Out of scope are provider setup, delivery guarantees, provider status UI, notification history, phone/email editing, and direct client calls to SMS/email providers.

## 4. UI contract

The modal presents, in focus and visual order:

1. title and Close;
2. selected product summary;
3. independent SMS and email choices;
4. total;
5. Confirm Order or the current result state.

Each checkbox is one minimum-size touch target with `accessibilityRole="checkbox"` and a checked state. A selected box uses fill plus a check mark, so state is not communicated by color alone.

The modal state machine is:

```text
idle → processing → success
  └──────────────→ error → processing (retry)
```

- `idle`: choices and Confirm are available.
- `processing`: choices and Confirm are disabled; one frozen request is active.
- `error`: failure copy is shown; products and choices remain editable for retry.
- `success`: confirmation choices and Confirm are removed; success copy and Close remain.

## 5. Request contract

`orderService.createOrder` reads the current token and `customerId` from stored session data and sends:

```http
POST /api/orders
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "restaurant_id": 1,
  "customer_id": 1,
  "products": [
    { "id": 1, "quantity": 2 }
  ],
  "sendSMS": false,
  "sendEmail": false
}
```

The notification truth table is:

| UI choices | `sendSMS` | `sendEmail` |
| --- | ---: | ---: |
| Neither | `false` | `false` |
| SMS only | `true` | `false` |
| Email only | `false` | `true` |
| Both | `true` | `true` |

The service uses strict `=== true` mapping, so missing values, truthy strings, or other nonboolean values never become an unintended opt-in.

## 6. Backend contract

`ApiCreateOrderDTO` treats camelCase as canonical:

- Java `sendEmail` uses Jackson's default `sendEmail` property.
- Java `sendSms` uses `@JsonProperty("sendSMS")` to preserve the acronym.
- Primitive boolean fields default to `false`.
- Legacy HTTP keys `send_sms` and `send_email` are intentionally unsupported.
- Database column naming remains unchanged.

After the order and product rows are created, `OrderService.createOrder` invokes email and SMS notification work only when the corresponding persisted request flag is true. The client success state means the order was created; it does not promise downstream provider delivery.

## 7. Submission and lifecycle rules

- A ref lock closes the interval before React renders the disabled state, so rapid double taps send one POST.
- The current choices are copied into local attempt values before awaiting the request.
- Closing, hiding, or unmounting aborts the active request and ignores late responses.
- An invalid restaurant ID or empty positive-quantity selection enters the error state without a request.
- HTTP 401/403 invokes centralized unauthorized cleanup.
- Other safe failures show:
  - `Your order was not processed successfully.`
  - `Please try again.`
- Success shows:
  - `Thank you!`
  - `Your order has been received.`
- Only closing from success invokes `onOrderCreated`, which resets menu quantities and notification choices.

## 8. Interfaces

| File | Responsibility |
| --- | --- |
| `client/components/OrderConfirmationModal.js` | Choice state, accessibility, attempt snapshot, result lifecycle |
| `client/app/customer/restaurant/[restaurantId].js` | Product selection, modal visibility, post-success quantity reset |
| `client/services/orderService.js` | Request validation and canonical JSON construction |
| `client/storage/authStorage.js` | Current token and Customer identity |
| `server/.../dtos/order/ApiCreateOrderDTO.java` | Canonical camelCase notification fields |
| `server/.../service/OrderService.java` | Persists flags and conditionally invokes notifications |

## 9. Decision record

Claude established that the earlier snake_case DTO properties caused official camelCase values to be silently ignored. The presented choices were a backward-compatible alias, a frontend-only snake_case adapter, or canonical camelCase properties. The user initially selected aliases, then explicitly revised the decision: camelCase is canonical and legacy snake_case HTTP keys are not retained. The implementation therefore uses `sendSMS` and `sendEmail` end to end, with focused DTO serialization/deserialization tests.

## 10. Acceptance criteria

- [x] SMS and email are independent, unchecked by default, and accessible.
- [x] All four boolean combinations map exactly to one create-order POST.
- [x] The request includes canonical `sendSMS` and `sendEmail` booleans.
- [x] Legacy snake_case HTTP notification keys are not part of the contract.
- [x] Duplicate Confirm taps cannot send duplicate requests.
- [x] Processing freezes the attempt and disables notification changes.
- [x] Failure preserves products and choices; retry uses the current visible choices.
- [x] Close before success preserves choices; successful close resets them.
- [x] Unauthorized responses use the shared sign-out path.
- [x] Focused backend tests cover camelCase input/output, defaults, and ignored legacy keys; all 4 passed during the 2026-07-21 specification re-audit.
- [x] Postman contains the four canonical request combinations without committed secrets.
- [ ] Native checkbox, modal overflow, abort, retry, and reset behavior require representative iOS/Android verification.
- [ ] DBeaver confirmation of all four persisted combinations remains an operator check.

## 11. Verification boundary

The four DTO serialization/deserialization tests and request construction establish the canonical JSON contract. The DB-backed suite could not start during the 2026-07-21 specification re-audit because local MySQL was unavailable; this does not alter the focused test result and is not treated as a fresh integration pass. Expo export establishes buildability. These checks do not prove platform interaction, downstream provider delivery, or database observations outside the tests.
