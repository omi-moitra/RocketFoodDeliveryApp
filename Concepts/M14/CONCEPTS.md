<a id="top"></a>

# Module 14 – Mobile Development 2

## Table of Contents

1. [Purpose](#purpose)
2. [Concept 01 — Role-Aware Authentication as a Guarded State Machine](#concept-01--role-aware-authentication-as-a-guarded-state-machine)
3. [Concept 02 — Multi-Request Delivery Transitions and Partial-Failure Recovery](#concept-02--multi-request-delivery-transitions-and-partial-failure-recovery)
4. [Concept 03 — Shared Role-Specific Forms with Authoritative Server State](#concept-03--shared-role-specific-forms-with-authoritative-server-state)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Purpose

This log explains three of the most challenging concepts I applied while extending Rocket Food Delivery for Module 14. Each concept identifies its purpose in the project, explains in my own words why it was difficult to understand or implement, and points to the exact locations where it appears in the current code.

---

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Concept 01 — Role-Aware Authentication as a Guarded State Machine

**Name:**

Role-aware authentication, persistent session state, and protected navigation

**Purpose:**

Module 14 allows three valid kinds of login: a customer-only user enters the Customer app, a courier-only user enters the Courier app, and a user with both roles must first choose which account type to use. The app therefore treats authentication as more than a logged-in/logged-out boolean. A session contains a token, a user ID, optional customer and courier IDs, and an active role. Those values determine whether the only accessible root screen is Login, Account Selection, the Customer route tree, or the Courier route tree.

The authentication service accepts a response only when it contains a valid token, user ID, and at least one supported role ID. Storage then derives an active role for a single-role account or deliberately leaves it empty for a dual-role account. On startup, stored values are normalized and checked as one coherent state before any protected screen renders. Expo Router's protected groups expose exactly the route tree that matches that validated state. A dual-role choice is persisted before the navigation state changes, so relaunching the app restores the same role safely.

**Why it was challenging:**

This was challenging because several fields have to agree before the session is safe. For example, `activeRole: "courier"` is not valid unless the same session also has a courier ID. A token by itself is not enough, and a dual-role session with no active role is not corrupt—it is a valid temporary state that belongs on Account Selection. In contrast, a single-role stored session with no active role is incomplete and must fail closed. I had to stop thinking of authentication as one boolean and instead picture a small state machine with strict transitions.

It was also difficult to coordinate persistence and navigation without showing the wrong screen briefly. The app must wait for both session restoration and font loading. The role must be saved successfully before context updates, because the root navigator reacts immediately to context and removes the old route tree. Clearing partial or contradictory storage was equally important: otherwise values left by a previous login could grant access to the wrong role. Centralizing these transitions in the authentication context and storage boundary helped me keep individual screens from inventing their own role rules.

**Where (file & line):**

- `client/services/authService.js:43–96` — validates the login response, accepts either supported role ID, and maps the role-capable session.
- `client/storage/authStorage.js:74–114` — derives a single-role state and rejects incoherent restored role combinations.
- `client/storage/authStorage.js:121–208` — restores, validates, clears, and persists the complete session as one boundary.
- `client/storage/authStorage.js:210–235` — validates and persists a dual-role user's explicit selection.
- `client/contexts/AuthContext.js:31–119` — restores the session and owns sign-in, role-selection, logout, and expiry transitions.
- `client/app/_layout.js:50–86` — waits for startup state and exposes exactly one protected root route tree.
- `client/app/selection.js:45–71` — fails closed for an invalid session and saves one role choice under a duplicate-tap lock.

---

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Concept 02 — Multi-Request Delivery Transitions and Partial-Failure Recovery

**Name:**

Courier delivery state transitions, ownership filtering, and recovery from partial success

**Purpose:**

The Courier app displays all pending orders and only the in-progress or delivered orders assigned to the active courier. A courier advances an order through the verified lifecycle `PENDING → IN PROGRESS → DELIVERED`, represented by backend status IDs `1 → 2 → 3`. The client normalizes backend data into stable internal status tokens, rejects malformed rows, merges the pending and courier-specific responses, removes duplicates, and applies a final ownership filter before displaying anything.

Accepting a pending delivery is not one atomic backend operation. The existing API requires the client to update the order to status 2 and then call a second endpoint to assign the active courier. If both requests succeed, the returned server object replaces the row and the complete list refreshes in the background. If the first succeeds but assignment fails, the app reports a partial state and offers a focused assignment retry. Marking a delivery complete is allowed only when it is already in progress and owned by the active courier.

**Why it was challenging:**

The hardest part was understanding that one button press can produce three different outcomes: no change, complete success, or partial success. A normal catch block would treat every error as if nothing happened, but that would be false after the status update succeeded. The order would already be in progress on the server, and refreshing immediately could make it disappear from the pending list before it had a courier. I needed an explicit `partial` error and recovery action so the interface tells the truth and can finish only the missing assignment step.

Concurrency made the workflow more complicated. Rapid taps or two simultaneous row actions could send conflicting status changes. A synchronous ref lock prevents that before React has time to render a disabled state, while an abort controller stops an in-flight request from updating an unmounted screen. The UI uses the persisted response rather than guessing the next status optimistically, then reloads the list to reconcile ownership and eligibility with the server.

The read path was another important part of the same concept. Dirty data can contain an in-progress or delivered order with no courier, and stale responses can overlap. I could not assume that a status automatically proves ownership. Fetching both lists, allowing the courier-scoped row to win during deduplication, and explicitly checking `delivery.courierId === courierId` prevents another courier's order or an unassigned non-pending order from appearing.

**Where (file & line):**

- `client/constants/deliveryStatus.js:10–35` — separates internal status tokens, display labels, backend spellings, and numeric IDs.
- `client/services/orders/courierDeliveries.js:65–139` — validates and normalizes each backend delivery before it can reach the UI.
- `client/services/orders/courierDeliveries.js:172–228` — loads two order lists, deduplicates them, and applies status/ownership eligibility rules.
- `client/services/orders/courierDeliveries.js:278–327` — adapts status and courier assignment to the two existing backend endpoints.
- `client/services/orders/courierDeliveries.js:329–410` — performs acceptance, throws a recoverable partial error, retries assignment, and guards delivery completion.
- `client/app/courier/index.js:88–174` — owns the single-mutation lock, cancellation, updating/error/partial states, and server reconciliation.
- `client/app/courier/index.js:176–197` — selects the legal next transition and exposes the partial-assignment retry.

---

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Concept 03 — Shared Role-Specific Forms with Authoritative Server State

**Name:**

Reusable role-aware Account form with draft state and server-authoritative updates

**Purpose:**

Customers and couriers need separate Account routes because they live in different tab navigators, but both routes require the same interface and behavior. Each route is therefore a thin wrapper that passes its expected role to one shared `AccountScreen`. The shared screen loads the user's read-only primary email and the active role's editable email and phone. A shared service checks that the expected route role, active session role, user ID, and corresponding role ID all agree before it makes a request or exposes response data.

The form keeps two kinds of data: the last account object confirmed by the server and the user's current drafts. This makes it possible to calculate whether the form is dirty, disable unnecessary submissions, preserve edits after a retryable failure, and replace both the snapshot and drafts with the normalized server response after a successful update. Client validation stops an invalid email or phone before a request is sent, while the service repeats validation at the API boundary.

**Why it was challenging:**

Sharing a screen is more involved than copying the same form into two files. The component has to be generic enough for either role without weakening authorization. I had to distinguish the top-level `userId`, which scopes the account endpoint, from `customerId` or `courierId`, which proves ownership of the nested role details. The response also has a different nested object depending on the active role. Checking all of these values before returning a normalized account prevents the Customer route from accidentally displaying Courier contact information, or the reverse.

Managing saved values and editable drafts was also subtle. If I stored only the text inputs, I could not reliably know whether anything changed or whether a successful response actually persisted the submitted values. If Account automatically reloaded every time it regained focus, a response could overwrite unsaved typing. The screen therefore skips a focus reload while dirty, cancels obsolete loads, numbers requests so only the newest response can update state, and trusts the normalized response—not the submitted draft—as proof of success.

Finally, saving has its own small state machine. An immediate ref lock blocks duplicate presses before the disabled button re-renders. Validation errors, request errors, unauthorized responses, cancellation, and success each need different behavior. Keeping that orchestration in one shared screen means both roles receive the same protection and avoids two Account implementations drifting apart.

**Where (file & line):**

- `client/app/customer/account.js:8–16` — configures the shared Account screen for the Customer route.
- `client/app/courier/account.js:8–16` — configures the same screen for the Courier route.
- `client/components/AccountScreen.js:57–103` — defines shared role-aware state, saved/draft separation, dirty tracking, and cleanup.
- `client/components/AccountScreen.js:105–172` — reloads on focus without overwriting dirty drafts and rejects stale or cancelled responses.
- `client/components/AccountScreen.js:195–260` — validates and saves under a duplicate-submit lock while preserving drafts on failure.
- `client/components/AccountScreen.js:284–386` — renders role-specific labels, read-only identity, editable fields, and explicit save states.
- `client/services/accountService.js:29–99` — validates session ownership and normalizes only the active role's account data.
- `client/services/accountService.js:101–160` — performs the role-aware read and update requests and returns authoritative normalized responses.

---

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
