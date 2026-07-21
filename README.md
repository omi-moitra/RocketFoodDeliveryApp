# Rocket Food Delivery Mobile App

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation / Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Backend Compatibility and Minimum-Change Policy](#backend-compatibility-and-minimum-change-policy)
- [Examples from This Project](#examples-from-this-project)
- [Seeded Development Data](#seeded-development-data)
- [Verification](#verification)
- [Related Documentation](#related-documentation)
- [Author / Contributors](#author--contributors)

## Project Description

Rocket Food Delivery is a cross-platform customer app for browsing restaurants, filtering by rating and price, choosing menu quantities, placing an order, and reviewing order history. It gives customers one mobile workflow while the existing Java API manages authentication, restaurant data, products, and orders.

This repository is the Module 13 mobile-development project. It contains the Expo/React Native client, the existing Spring Boot backend used by the client, project specifications, research, concept documentation, and an importable Postman collection.

## Features

- Customer login with a persisted session and protected navigation
- File-based nested navigation: root stack, customer tabs, and restaurant stack
- Restaurant browsing with combined rating and price-range filters
- Restaurant menus with guarded quantity controls and calculated totals
- Order confirmation with processing, failure/retry, and success states
- Customer order history and order-detail modal, including pending orders without a courier
- Shared loading, empty, error, and session-expiry handling
- iOS, Android, simulator, and physical-device development through Expo and ngrok

## Tech Stack

| Area | Technology |
|---|---|
| Mobile client | JavaScript, React 19.1, React Native 0.81.5 |
| Mobile tooling | Expo SDK 54, Expo Router 6, Expo Go |
| Client state/storage | React Context, component state, AsyncStorage |
| Backend | Java 17, Spring Boot 3.5.11, Spring Web, Spring Security |
| Data | MySQL 8, Spring Data JPA/Hibernate |
| Authentication | Stateless bearer-token API authentication with JWT |
| Local connectivity | Environment-based API URL and optional ngrok tunnel |
| Testing/inspection | Maven test suite, Expo device QA, Postman, DBeaver |
| Version control | Git with feature branches merged through `dev` into `main` |

Expo SDK 54 is intentional. A coach confirmed that the repository's current `expo ~54.0.34` baseline is acceptable for this submission.

## Project Structure

```text
.
├── client/
│   ├── app/                    # Expo Router screens and nested layouts
│   ├── assets/                 # App icons, logos, and menu image
│   ├── components/             # Reusable interface components and modals
│   ├── constants/              # Theme, assets, labels, and currency rules
│   ├── contexts/               # Authentication/session context
│   ├── images/restaurants/     # Six bundled restaurant images
│   ├── services/               # API requests and response validation
│   ├── storage/                # AsyncStorage session boundary
│   ├── utils/                  # Menu, label, and validation helpers
│   ├── .env.example            # Safe client environment template
│   ├── app.json                # Expo application configuration
│   ├── package.json            # Client scripts and dependencies
│   └── package-lock.json       # Locked dependency versions
├── server/
│   ├── src/main/java/          # Controllers, services, repositories, DTOs, security
│   ├── src/main/resources/     # Thymeleaf backoffice templates
│   ├── src/test/               # Spring API tests
│   └── pom.xml                 # Java and Spring dependencies
├── scripts/ngrok-phone.sh           # Physical-phone API tunnel helper
├── ai/                              # Project rules and feature specifications
├── support_materials_13/            # Supplied wireframes, palette, and images
├── LeetCode-Challenges/              # Required SQL challenge solution screenshots
├── PostmanCollection.json           # Importable mobile API request collection
├── CONCEPTS.md                      # Three project concepts and code references
└── RESEARCH.md                      # Required mobile-development research
```

The mobile route hierarchy is:

```text
Root Stack
├── Login
└── Customer Tabs
    ├── Restaurants
    │   └── Restaurant Stack
    │       ├── Restaurant List
    │       └── Restaurant Menu
    └── Order History
```

## Prerequisites

- Git
- Node.js and npm
- Java 17
- MySQL 8
- Expo Go for physical-device testing, or an iOS/Android simulator
- ngrok and a free ngrok account only when testing the API from a physical phone

## Installation / Setup

### 1. Clone the repository

```bash
git clone git@github.com:omoitra-droid/M13-rocketFoodDelivery.git
cd M13-rocketFoodDelivery
```

The repository is private, so the cloning account must have collaborator access. An HTTPS clone URL may be used instead if the account is authenticated for this repository.

### 2. Create and configure the backend database

Create the local database:

```sql
CREATE DATABASE rdelivery;
```

Create the ignored file `server/src/main/resources/application.properties` with local values:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/rdelivery
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.jpa.hibernate.ddl-auto=update
app.jwt.secret=REPLACE_WITH_A_LONG_LOCAL_DEVELOPMENT_SECRET
```

The backend seeds development data when it starts. Do not commit `application.properties` or real database/JWT credentials.

Start the API from the repository root:

```bash
cd server
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080` unless a different Spring port is configured.

### 3. Install and configure the mobile client

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `client/.env` to an origin that the selected device can reach:

```dotenv
# iOS simulator
EXPO_PUBLIC_API_URL=http://127.0.0.1:8080

# Android emulator alternative
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
```

Only one active `EXPO_PUBLIC_API_URL` assignment should remain in the file. Restart Expo with a cleared cache after changing it.

Start Expo:

```bash
npx expo start -c
```

Press `i` for the iOS simulator, `a` for the Android emulator, or scan the QR code with Expo Go after completing the physical-device tunnel setup below.

### 4. Test on a physical phone with ngrok

The phone cannot use the computer's `localhost`; the API needs a reachable network address. With the backend already running, install and authenticate ngrok once:

```bash
brew install ngrok
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

From the repository root, run:

```bash
./scripts/ngrok-phone.sh
```

The helper opens an HTTPS tunnel to port 8080, temporarily writes its public URL to `client/.env`, and restores the previous file when stopped with `Ctrl+C`. Follow its prompt to start Expo. If the phone and computer cannot connect directly for Expo's development traffic, use `npx expo start -c --tunnel` from `client/`.

## Environment Variables

| Setting | Location | Required | Purpose |
|---|---|---:|---|
| `EXPO_PUBLIC_API_URL` | `client/.env` | Yes | Base origin used for every mobile API request |
| `spring.datasource.url` | backend properties | Yes | JDBC URL for the local MySQL database |
| `spring.datasource.username` | backend properties | Yes | Local MySQL user |
| `spring.datasource.password` | backend properties | Yes | Local MySQL password |
| `app.jwt.secret` | backend properties | Yes | Local key used to sign and validate JWTs |
| ngrok authtoken | ngrok user config | Physical phone only | Allows the local API tunnel to start |

`EXPO_PUBLIC_*` values are embedded in the client bundle and must never contain secrets. Backend notification settings for Twilio and Notify.EU are optional and are not needed for the Module 13 customer flow because order requests send both notification flags as `false`. Those optional provider settings are therefore not part of the required local setup above.

## API Documentation

The client reads the configured base URL, adds the path below, and expects JSON. Except for login, `/api/**` routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Mobile use |
|---|---|---|
| `POST` | `/api/auth` | Validate email/password and return the customer session |
| `GET` | `/api/restaurants` | List restaurants; optional `rating` and `price_range` filters |
| `GET` | `/api/restaurants/{id}` | Load the selected restaurant |
| `GET` | `/api/products?restaurant={id}` | Load products for one restaurant menu |
| `POST` | `/api/orders` | Create an order with restaurant, customer, and product quantities |
| `GET` | `/api/orders?type=customer&id={id}` | Load the authenticated customer's order history |
| `GET` | `/api/orders/pending` | Load all pending orders for courier acceptance |
| `GET` | `/api/orders?type=courier&id={id}` | Load the authenticated courier's assigned orders |
| `PUT` | `/api/orders/{id}` | Update an order; courier progression echoes `restaurant_id`, `customer_id`, and the current `restaurant_rating`, changing only `order_status_id` (`2`\|`3`) |
| `PUT` | `/api/order/{id}/courier` | Assign a courier to an order; body `{ "courier_id": {id} }` |

## Backend Compatibility and Minimum-Change Policy

Module 14 uses the existing Spring Boot API by default. Frontend services should adapt verified backend request and response shapes into stable client models whenever that can satisfy the feature safely.

A backend adjustment is allowed only when repository/live evidence proves that a required frontend behavior cannot be implemented through an adapter without data loss, guessed values, or a missing operation. The adjustment must:

- Change the smallest possible controller/DTO/service surface and preserve existing API compatibility.
- Avoid unrelated cleanup, renaming, schema changes, broad refactors, or speculative redesign.
- Include focused backend tests and updated Postman requests when API-facing.
- Be integrated through the frontend service boundary rather than directly from screen code.
- Be documented in `ai/M14/ai-spec.md`, the relevant feature specification, this README, and the private implementation log before it is considered complete.

Each documented backend adjustment must identify the source discrepancy, why a frontend-only adapter was unsafe or insufficient, the exact method/path/body/response, changed server and client files, compatibility impact, tests, Postman/database evidence, and any remaining manual verification.

### Module 14 backend adjustment record

| Status | Feature | Verified discrepancy | Minimum authorized resolution |
|---|---|---|---|
| Implemented | Courier Delivery status progression | The broad `PUT /api/orders/{id}` requires `restaurant_rating`, but `ApiOrderDTO` (the order response) did **not** return that value, and `OrderService.updateOrderFromDTO` overwrites the stored rating with whatever is sent. A courier client could not read the current rating to round-trip it and would erase it by sending `null`. | Add `restaurant_rating` to the response DTO `ApiOrderDTO` (one field + one mapping line) so the client can read the current rating and echo it back through the **existing** broad `PUT /api/orders/{id}`. No new endpoint, DTO, or service method. |

**Implemented change (DTO field addition)**

- **Server change:** `dtos/order/ApiOrderDTO.java` — added nullable `Integer restaurant_rating`; `service/OrderService.java#mapOrderToDTO` — `dto.setRestaurant_rating(order.getRestaurantRating())`. That is the entire production change.
- **Endpoint used:** the existing `PUT /api/orders/{id}` (unchanged). Courier progression sends `{ restaurant_id, customer_id, order_status_id: 2|3, restaurant_rating: <current value> }`, changing only the status. Courier is not in this body, so an existing assignment is preserved.
- **Response:** `ApiOrderDTO` now includes `restaurant_rating` (nullable). All other fields unchanged.
- **Why a frontend-only adapter was insufficient:** the response never exposed `restaurant_rating`, so no adapter could rebuild the required broad-update body without guessing it; the broad update then overwrites it, causing silent data loss. Exposing the field in the response is the smallest change that removes the guess.
- **Compatibility impact:** additive only. Adding a field to a response breaks no existing consumer; the broad update, creation, retrieval, assignment, and rating endpoints, and all entities/schema/security/seeders are unchanged.
- **Frontend integration:** `client/services/orderService.js` normalizes `restaurantId`, `customerId`, and `restaurantRating`, then `acceptDelivery` (status 2 via broad update, then assign courier), `markDelivered` (status 3 via broad update), and `assignActiveCourier` (partial-acceptance recovery) build the body; screens never build it.
- **Tests:** `server/.../order/OrderApiControllerTest.java` adds `testOrderResponse_ExposesRestaurantRating` and `testUpdateOrder_PreservesRatingAndCourierWhenEchoed`. (Backend test run pending on the operator's machine; not re-run in the latest pass.)
- **Postman:** `PostmanCollection.json` includes pending, courier-scoped, broad-update→in progress, courier assignment, and broad-update→delivered requests.
- **DBeaver / native:** database before/after inspection and on-device courier interaction remain manual checks for the operator with a running device.

## Examples from This Project

### Seeded customer login

The Postman collection and mobile demo use this development-only customer account:

```text
Email: customer@gmail.com
Password: password
```

The Login screen sends those credentials to `POST /api/auth`. A successful response supplies the customer identity and bearer token used by the protected customer routes. These are local seed credentials, not production credentials.

### Browse and filter restaurants

The Restaurants screen loads the complete list with:

```http
GET /api/restaurants
Authorization: Bearer <accessToken>
```

Selecting both filters produces a request such as:

```http
GET /api/restaurants?rating=4&price_range=2
Authorization: Bearer <accessToken>
```

The screen keeps the selected filter values in component state, shows a deliberate empty state when nothing matches, and navigates with the selected restaurant's API ID rather than its position in the filtered array.

### Create an order

After the customer chooses menu quantities and confirms the modal, the client sends the backend's snake-case request contract:

```json
{
  "restaurant_id": 1,
  "customer_id": 2,
  "products": [
    {
      "id": 1,
      "quantity": 2
    }
  ],
  "send_email": false,
  "send_sms": false
}
```

The actual IDs come from the authenticated customer and loaded restaurant/menu data. The order modal accepts only a valid HTTP `201` Success response before displaying its success state. Returning to Order History refreshes the list and lets the customer open the persisted order details.

## Seeded Development Data

`server/src/main/java/com/rocketFoodDelivery/rocketFood/DataSeeder.java` runs when the Spring application starts. On a fresh database it creates the following development data:

| Data | Fresh-database seed |
|---|---|
| Users | 30 baseline users, including `both@gmail.com`, `customer@gmail.com`, and `courier@gmail.com` |
| Addresses | 30 generated addresses |
| Order statuses | `pending`, `in progress`, and `delivered` |
| Courier statuses | `free`, `busy`, `full`, and `offline` |
| Restaurants | 8 active restaurants with generated names and price ranges from 1–3 |
| Employees | 5 generated employee records |
| Customers | 8 baseline customers, followed by 5 append-only Avatar demo customers |
| Couriers | 8 active couriers with randomly assigned courier statuses |
| Products | 5–7 generated menu products per restaurant, normally 40–56 total |
| Orders | 10 generated orders with 2–4 product rows each, varied statuses, optional ratings, and no courier while pending |

The five stable Avatar customer accounts are:

| Name | Email | Password |
|---|---|---|
| Aang | `aang@gmail.com` | `password` |
| Katara | `katara@gmail.com` | `password` |
| Sokka | `sokka@gmail.com` | `password` |
| Toph Beifong | `toph@gmail.com` | `password` |
| Zuko | `zuko@gmail.com` | `password` |

Most seed methods skip a table when it already contains data. The Avatar accounts are different: any missing Avatar user/customer is appended without rewriting an existing account. Restaurant names, addresses, product details, prices, assignments, statuses, and ratings use Faker or random values, so they can differ between fresh databases. Existing or partially seeded databases can also have totals different from the fresh-database table above.

The request flow is: screen/component → client service → shared API client → Spring Security JWT filter → controller → service → repository/MySQL → JSON response → client validation → interface state.

Import [PostmanCollection.json](PostmanCollection.json) into Postman for the preconfigured mobile requests. Replace its safe collection variables with local test values as needed; never commit a live token. The exported collection is included, but a final unchanged collection run is tracked separately from this README.

## Verification

Backend tests:

```bash
cd server
./mvnw test
```

Client configuration and dependency checks:

```bash
cd client
npx expo-doctor
npm install
```

The completed manual QA covers the customer journey on iOS and Android: login and persistence, navigation, filters, menu quantities, confirmation states, order creation, history/details, logout, scrolling, keyboard behavior, and restart behavior.

## Related documentation

- [CONCEPTS.md](CONCEPTS.md) explains mobile testing/tunnels, nested Expo Router navigation, and request race conditions.
- [RESEARCH.md](RESEARCH.md) compares native and cross-platform development, React and React Native, and optional notification providers.
- [ai/ai-spec.md](ai/ai-spec.md) records repository-wide implementation rules and decisions.
- [`ai/features/`](ai/features/) contains the feature-level behavior contracts.

## Author / Contributors

Created by **Omoitra** for CodeBoxx Full-Stack Development Module 13.

- [GitHub profile](https://github.com/omoitra-droid)
- [Project repository](https://github.com/omoitra-droid/M13-rocketFoodDelivery)

No additional contributors are listed for this student project.
