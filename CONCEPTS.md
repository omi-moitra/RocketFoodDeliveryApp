# Module 13 – Mobile Development 1

## Table of Contents

1. [Purpose](#-purpose)
2. [Concept 01 — Mobile Testing with Expo, Simulators, and Tunnels](#️-concept---01)
3. [Concept 02 — File-Based Nested Navigation Layouts](#️-concept---02)
4. [Concept 03 — Race Conditions, Stale Responses, and Cancellation](#️-concept---03)

## 🎯 Purpose

This log explains three of the most challenging concepts I applied while building the Module 13 Rocket Food Delivery mobile app. Each entry identifies the concept, its purpose in the project, why it was difficult to understand or implement, and where it appears in the current code.

---

## ✏️ Concept - 01

**🔤 Name:**

Mobile testing with Expo, simulators, physical devices, and tunnels

**🎯 Purpose:**

This setup lets me run the React Native app through Expo, test it in an iOS or Android simulator, and test it on a physical phone. The simulator can use a local API origin, but a physical phone cannot use the Mac's `localhost` as if it were its own. An ngrok tunnel gives the phone a temporary public HTTPS address that forwards requests to the API running locally on port `8080`. Expo can also use its own separate tunnel when the phone cannot reliably load the JavaScript bundle over the local network.

**❓ Why it was challenging:**

No single step was extremely complicated, but coordinating all the moving parts was challenging. I needed the local API process, the ngrok process, Expo's development server, the simulator or Expo Go, and the correct `EXPO_PUBLIC_API_URL` to agree at the same time. A free ngrok URL may change after a restart, and Expo may keep an older environment value in its cache. That led to long periods of waiting for the app to load, only to discover that one process had stopped or one URL was stale.

The tunnel itself was also difficult to picture at first. It is not a database connection and it does not move the API onto the phone. It acts like a temporary public doorway: the phone sends an HTTPS request to the ngrok address, and ngrok forwards that request to port `8080` on my development machine. I also had to distinguish this API tunnel from Expo's `--tunnel` option, which helps deliver the app's JavaScript bundle. The project helper script made the workflow more manageable by starting ngrok, reading its public URL, temporarily updating `client/.env`, reminding me to restart Expo with a clean cache, and restoring the simulator configuration when the tunnel closes.

**📍 Where (file & line):**

- `scripts/ngrok-phone.sh:25–70` — checks the local port, starts ngrok, discovers the HTTPS URL, updates `client/.env`, prints the Expo commands, and restores the original environment when stopped.
- `client/.env.example:1–3` — documents the environment-driven API origin without committing a live tunnel URL.
- `client/services/apiClient.js:45–79` — reads and validates `EXPO_PUBLIC_API_URL` before building request URLs.
- `client/package.json:5–9` — Expo commands for starting the project on Android, iOS, or web.
- `ai/ai-spec.md:770–857` — distinguishes the Expo bundle tunnel from the ngrok API tunnel and documents the physical-device workflow.

---

## ✏️ Concept - 02

**🔤 Name:**

File-based nested navigation layouts with Expo Router

**🎯 Purpose:**

Route files inside `client/app/` define the app's screens, while each `_layout.js` defines the navigator or shared frame surrounding the routes in its folder. The root layout restores authentication and protects the public and customer route trees. The customer layout supplies the shared header and footer tabs. The restaurant layout stacks an individual menu over the restaurant list so Back returns to the existing list and its filters.

**❓ Why it was challenging:**

The complete navigation system is not written in one file that I can read from top to bottom. Part of it is implied by folders and special filenames. A restaurant menu is inside three navigation levels at the same time: the root stack, the customer tabs, and the restaurant stack.

At first, I treated each screen as if it owned its entire page. The important realization was that only the innermost route content changes while the outer layouts remain mounted. That is why authenticated screens keep the same header and footer, why Login sits outside that shared frame, and why the restaurant stack can return to the list without rebuilding the whole customer interface. Understanding the folder tree became just as important as reading the components themselves.

**📍 Where (file & line):**

- `client/app/_layout.js:24–74` — font/session startup, error boundary, and protected public/customer routes.
- `client/app/customer/_layout.js:38–80` — logged-out redirect, shared header, and Restaurants/Order History tabs.
- `client/app/customer/restaurant/_layout.js` — restaurant list/menu stack.
- `client/app/customer/restaurant/[restaurantId].js` — dynamic restaurant-menu route.

---

## ✏️ Concept - 03

**🔤 Name:**

Race conditions, stale responses, and request cancellation

**🎯 Purpose:**

These defenses stop rapid taps from starting concurrent order submissions, prevent a slow response for restaurant A from overwriting restaurant B's newer menu, and prevent a response from updating a modal or screen after it has closed. They make the mobile interface behave predictably even when requests finish in an unexpected order.

**❓ Why it was challenging:**

Request timing is mostly invisible. The app can behave perfectly on a fast connection and then fail only when two taps happen close together or one response takes longer than another. I originally thought disabling a button would be enough, but React applies that disabled state during a render, so a second press event can arrive before the new render finishes.

I learned that three different client-side problems need three different defenses. A synchronous lock ref blocks another submission immediately inside the handler. A request counter allows only the newest menu or history request to update state. `AbortController` cancels work when a modal closes, a filter changes, or a screen loses focus. Understanding which protection belongs to which timing problem was more useful than treating them all as one generic loading fix.

**📍 Where (file & line):**

- `client/components/OrderConfirmationModal.js:50–51, 83–138` — synchronous submission lock, cancellation, and guarded state updates.
- `client/services/apiClient.js:87–105` — external abort-signal and timeout plumbing.
- `client/app/customer/restaurant/[restaurantId].js:61, 83–116` — newest-request counter and stale menu-response guard.
- `client/app/customer/order-history.js:52, 65–79` — the same newest-request protection during focus refreshes.

---
