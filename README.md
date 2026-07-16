# Rocket Food Delivery Mobile App

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

## Tech stack

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

## Project structure

```text
.
├── client/
│   ├── app/                    # Expo Router screens and nested layouts
│   ├── components/             # Reusable interface components and modals
│   ├── contexts/               # Authentication/session context
│   ├── services/               # API requests and response validation
│   ├── storage/                # AsyncStorage session boundary
│   ├── constants/ and utils/   # Theme, assets, labels, and validation
│   └── .env.example            # Safe client environment template
├── server/
│   ├── src/main/java/          # Controllers, services, repositories, DTOs, security
│   ├── src/main/resources/     # Thymeleaf backoffice templates
│   ├── src/test/               # Spring API tests
│   └── pom.xml                 # Java and Spring dependencies
├── scripts/ngrok-phone.sh           # Physical-phone API tunnel helper
├── ai/                              # Project rules and feature specifications
├── support_materials_13/            # Supplied wireframes, palette, and images
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

## Installation and local setup

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

## Configuration and secrets

| Setting | Location | Required | Purpose |
|---|---|---:|---|
| `EXPO_PUBLIC_API_URL` | `client/.env` | Yes | Base origin used for every mobile API request |
| `spring.datasource.url` | backend properties | Yes | JDBC URL for the local MySQL database |
| `spring.datasource.username` | backend properties | Yes | Local MySQL user |
| `spring.datasource.password` | backend properties | Yes | Local MySQL password |
| `app.jwt.secret` | backend properties | Yes | Local key used to sign and validate JWTs |
| ngrok authtoken | ngrok user config | Physical phone only | Allows the local API tunnel to start |

`EXPO_PUBLIC_*` values are embedded in the client bundle and must never contain secrets. Backend notification settings for Twilio and Notify.EU are optional and are not needed for the Module 13 customer flow because order requests send both notification flags as `false`. Those optional provider settings are therefore not part of the required local setup above.

## Mobile API overview

The client reads the configured base URL, adds the path below, and expects JSON. Except for login, `/api/**` routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Mobile use |
|---|---|---|
| `POST` | `/api/auth` | Validate email/password and return the customer session |
| `GET` | `/api/restaurants` | List restaurants; optional `rating` and `price_range` filters |
| `GET` | `/api/restaurants/{id}` | Load the selected restaurant |
| `GET` | `/api/products?restaurant={id}` | Load products for one restaurant menu |
| `POST` | `/api/orders` | Create an order with restaurant, customer, and product quantities |
| `GET` | `/api/orders?type=customer&id={id}` | Load the authenticated customer's order history |

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

## Author

Created by **Omoitra** for CodeBoxx Full-Stack Development Module 13.

- [GitHub profile](https://github.com/omoitra-droid)
- [Project repository](https://github.com/omoitra-droid/M13-rocketFoodDelivery)

