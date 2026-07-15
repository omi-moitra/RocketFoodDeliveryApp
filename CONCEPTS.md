# Module 13 – Mobile Development 1

## Table of Contents

1. [Purpose](#-purpose)
2. [Concept 01 — Explicit State Machines for Async UI](#️-concept---01)
3. [Concept 02 — Race Conditions, Stale Responses, and AbortController](#️-concept---02)
4. [Concept 03 — File-Based Nested Navigation Layouts](#️-concept---03)
5. [Concept 04 — Validating and Normalizing API Data at a Service Boundary](#️-concept---04)
6. [Concept 05 — Token-Based Session Lifecycle on a Device](#️-concept---05)

## 🎯 Purpose

This log lists the most challenging concepts applied in the Module 13 project. Each entry gives the concept's name, its purpose within the project, why it was challenging, and where it lives in the code (file and line). Five concepts are logged — more than the required three — so the strongest three can be chosen for the explanation video.

---

## ✏️ Concept - 01

**🔤 Name:**

Explicit state machines for asynchronous UI (instead of multiple booleans)

**🎯 Purpose:**

The order confirmation modal must move through exactly one lifecycle: `idle → processing → success`, or `error → processing` again on retry. Modeling this as **one state variable** with four named values drives everything the user sees — the disabled "Processing Order…" button, the green checkmark that replaces the button on success, and the red X with retry on failure.

**❓ Why it was challenging:**

A state machine is code that can only ever be in *one* of a short, fixed list of named situations (states), with rules about which state may move to which — like a traffic light that is always exactly green, yellow, or red, and only changes along allowed paths. The challenge is that the obvious way to track an async request is separate true/false flags like `isLoading`, `isSuccess`, and `hasError`. Three flags allow eight combinations, and most are contradictions: nothing stops `isLoading` and `isSuccess` from both being `true` after a bug, which is like a traffic light showing green and red at once — the UI would show a spinner and a success message together. Storing one `submissionState` value instead makes those broken combinations impossible to even write, and every render decision becomes one simple question: "which state am I in right now?" The difficulty is recognizing this pattern up front, because the boolean version looks fine until timing bugs appear.

**📍 Where (file & line):**

`client/components/OrderConfirmationModal.js:45` (the single state value) and the state-driven action area in the same file; the same pattern scales up in `client/app/customer/order-history.js` (`resolving/loading/ready/empty/error/refreshing`).

---

## ✏️ Concept - 02

**🔤 Name:**

Race conditions: duplicate requests, stale responses, and AbortController

**🎯 Purpose:**

Guarantees that rapid double-taps on "Confirm Order" can never create two real orders, that a slow response for restaurant A never overwrites restaurant B's menu after quick navigation, and that a response arriving after a screen closes never updates unmounted state or crashes the app.

**❓ Why it was challenging:**

Networks make timing invisible: everything works on a fast connection, then breaks in ways that are hard to reproduce on a slow one. Three separate defenses are needed, and a disabled button alone is not one of them: (1) a **synchronous lock ref** inside the submit handler, because React re-renders (and therefore the `disabled` prop) arrive *after* a second tap can already fire; (2) a **request counter**, so only the newest request is allowed to commit its result and any late "stale" response is ignored; (3) **AbortController**, so closing a modal or leaving a screen actively cancels the in-flight request. The subtle part is that these solve three *different* problems — duplicate orders, stale data overwriting fresh data, and updates leaking into unmounted screens — so removing any one of them reopens a specific bug.

**📍 Where (file & line):**

`client/services/apiClient.js:84–95` (abort + timeout plumbing), `client/app/customer/restaurant/[restaurantId].js:97` (stale-request counter), `client/app/customer/order-history.js:67` (same guard for focus refreshes), and the submit lock in `client/components/OrderConfirmationModal.js`.

---

## ✏️ Concept - 03

**🔤 Name:**

File-based nested navigation layouts (Expo Router `_layout.js`)

**🎯 Purpose:**

Every file in `client/app/` automatically becomes a screen, and each `_layout.js` wraps all the screens in its folder — like picture frames inside picture frames. The root layout provides the session context and fonts, the customer layout provides the shared header/footer tabs and redirects logged-out users, and the restaurant layout stacks the menu on top of the list so back-navigation keeps the filters.

**❓ Why it was challenging:**

Navigation here is not one file that can be read top to bottom — it is *implied by the folder structure*, which is invisible until the convention is understood. The tricky part is the nesting: a menu screen is simultaneously wrapped by three layouts, and each has exactly one job (auth gate → header/footer frame → stack behavior). The key insight is that when the user navigates, only the innermost content swaps while the surrounding frames persist — that is why the header and footer never flicker, and why Login (which sits outside the customer folder) is the only screen without them.

**📍 Where (file & line):**

`client/app/_layout.js` (root: AuthProvider + fonts), `client/app/customer/_layout.js:42` (the `<Redirect>` route guard + tabs), `client/app/customer/restaurant/_layout.js` (list/menu stack).

---

## ✏️ Concept - 04

**🔤 Name:**

Validating and normalizing API responses at a service boundary

**🎯 Purpose:**

Each feature service (`orderService`, `productService`, `restaurantService`) checks the `{ message: "Success", data: ... }` envelope, validates every field, converts the backend's `snake_case` to the client's `camelCase` once, and classifies failures into safe categories. Screens never see raw JSON — only clean objects or a small set of known error codes.

**❓ Why it was challenging:**

The temptation is to trust the backend and render `order.restaurant_name` directly. But real testing showed why the boundary matters: some orders legitimately have `courier_name: null` (no courier assigned yet), and rendering that naively produces the literal text "undefined" or a crash — which the grading sheet explicitly checks. Live testing against the running API also disproved two assumptions: the backend rejects bad tokens with HTTP **403**, not the 401 the docs implied, and product costs are whole dollars, not cents. The lesson: verify the real contract with live requests, handle it in *one* place, and let every screen trust the normalized shape.

**📍 Where (file & line):**

`client/services/orderService.js:185` (`normalizeCustomerOrder`, nullable courier rule), `client/services/orderService.js:127` (the verified 401/403 classification), `client/constants/currency.js` (the single documented whole-dollars formatting rule).

---

## ✏️ Concept - 05

**🔤 Name:**

Token-based session lifecycle with on-device storage (JWT + AsyncStorage)

**🎯 Purpose:**

Login exchanges email/password for an access token and customer ID, which are persisted in AsyncStorage so the app remembers the user across restarts. Every protected request attaches `Authorization: Bearer <token>`. Log Out — or any protected request answered with 401/403 — clears the stored session and returns to Login through one shared transition.

**❓ Why it was challenging:**

The session lives in three places at once — the backend's signed token, the device's storage, and React's in-memory state — and keeping them synchronized is the whole challenge. That means getting the order of operations right (clear storage *before* dropping the in-memory session so route guards close cleanly), covering failure cases (corrupt or partial storage must count as fully logged out, never half logged in), and respecting security rules that are easy to violate by accident: the token must never appear in route parameters, logs, or component props, so services read it from the shared storage boundary at request time instead of passing it around.

**📍 Where (file & line):**

`client/storage/authStorage.js:48` (`getStoredSession` and its validation rules), `client/contexts/AuthContext.js:101` (`handleUnauthorized`, the shared sign-out), `client/services/apiClient.js` (bearer-token transport).

---
