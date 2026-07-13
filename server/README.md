# RocketFood Delivery — Java REST API

> **Backend REST API for the RocketFood Delivery mobile application**

## Project Description

RocketFood Delivery Server is a Spring Boot REST API that powers the RocketFood mobile app. It manages the full delivery lifecycle: user authentication, restaurant and product browsing, order creation and tracking, and courier assignment. It is designed to be consumed by a React Native mobile client via HTTP over a local network or an ngrok tunnel.

## Features

- 🔐 JWT-based authentication for customers, couriers, and employees
- 🍽️ Restaurant and product management (CRUD)
- 📦 Order creation, status tracking, and rating
- 🚴 Courier assignment and status management
- 🌱 Automated database seeding with Faker for development
- 🛡️ Spring Security with stateless session management
- ✅ Full integration test suite per API controller

## Tech Stack

- **Language:** Java 17
- **Framework:** Spring Boot 3.1.12
- **Security:** Spring Security + JWT (jjwt 0.9.1)
- **Database:** MySQL 8
- **ORM:** Spring Data JPA / Hibernate
- **Templating:** Thymeleaf (backoffice views)
- **Utilities:** Lombok, JavaFaker
- **Build:** Maven (Maven Wrapper included)
- **Testing:** Spring Boot Test (JUnit)

## Project Structure

```
serverJAVA/
├── src/
│   ├── main/
│   │   ├── java/com/rocketFoodDelivery/rocketFood/
│   │   │   ├── controller/
│   │   │   │   ├── api/          # REST API controllers
│   │   │   │   ├── backoffice/   # Thymeleaf backoffice controllers
│   │   │   │   └── advice/       # Global exception handlers
│   │   │   ├── models/           # JPA entities (User, Order, Restaurant, ...)
│   │   │   ├── repository/       # Spring Data JPA repositories
│   │   │   ├── service/          # Business logic layer
│   │   │   ├── dtos/             # Request/response DTOs
│   │   │   ├── security/         # JWT filter, JwtUtil, SecurityConfig
│   │   │   ├── exception/        # Custom exception classes
│   │   │   ├── util/             # ResponseBuilder utility
│   │   │   ├── DataSeeder.java   # Database seeder (Faker)
│   │   │   └── RocketFoodApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/                 # Integration tests per controller
├── assets/
│   └── RocketFood_API.postman_collection.json
├── pom.xml
└── mvnw
```

## Prerequisites

- Java 17+ ([Download via SDKMAN](https://sdkman.io/) or [Adoptium](https://adoptium.net/))
- Maven 3.8+ (or use the included `./mvnw` wrapper)
- MySQL 8+ ([Download](https://dev.mysql.com/downloads/))
- Git ([Download](https://git-scm.com/downloads))

Optional:
- [ngrok](https://ngrok.com/) — to expose the local server to the mobile device

## Installation / Setup

```bash
# Clone the repository
git clone https://github.com/ETGLap/Codeboxx_FSD_Completed_Projects.git

# Navigate to the server directory
cd serverJAVA

# Create the MySQL database
mysql -u root -p -e "CREATE DATABASE rdelivery;"

# Configure your database credentials in:
# src/main/resources/application.properties

# Install dependencies and run
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`

## Environment Variables

All configuration is done in `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/rdelivery
spring.datasource.username=root
spring.datasource.password=your_password

# Seeding (comment out to disable auto-seeding on startup)
spring.profiles.active=manual-seeding
```

> ⚠️ Never commit real credentials. Add `application.properties` to `.gitignore` or use environment variable substitution for production.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth` | Authenticate and receive a JWT token |
| `GET` | `/api/restaurants` | List all restaurants |
| `POST` | `/api/restaurants` | Create a restaurant |
| `PUT` | `/api/restaurants/{id}` | Update a restaurant |
| `DELETE` | `/api/restaurants/{id}` | Delete a restaurant |
| `GET` | `/api/orders` | Get orders by customer or restaurant |
| `POST` | `/api/orders` | Create a new order |
| `PUT` | `/api/orders/{id}` | Update order status or rating |
| `GET` | `/api/products` | List products |
| `POST` | `/api/products` | Create a product |
| `GET` | `/api/couriers` | List couriers |
| `GET` | `/api/customers` | List customers |

A full Postman collection is available at `assets/RocketFood_API.postman_collection.json`.

## Tests

```bash
# Run all tests
./mvnw test
```

Integration tests are located in `src/test/java/` and cover all API controllers:
`Auth`, `Restaurant`, `Order`, `Product`, `Courier`, `Customer`, `Employee`, `User`, `Address`, `OrderStatus`, `CourierStatus`, `ProductOrder`

## Author

**Etienne Lapointe** - [@ETGLap](https://github.com/ETGLap)

## License

This project is licensed under the MIT License.

```
MIT License - Copyright (c) 2026
```
