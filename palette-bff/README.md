# Palette BFF

Enterprise Backend For Frontend (BFF) platform foundation layer.

## Overview

Palette BFF serves as the single entry point for all React frontend applications, providing:

- Centralized OIDC authentication (eIDP integration)
- Secure session management (Redis-backed)
- Enterprise API gateway with token relay
- User context API
- Platform runtime configuration
- Request tracing & observability
- Audit framework

## Architecture

```
                 Browser
                    |
              React Applications
                    |
        HTTPS + HTTP Only Cookie
                    |
                    v
          +----------------------+
          |   Palette BFF        |
          |   Spring Boot 3.x    |
          |   Java 21            |
          +----------------------+
                    |
        +-----------+------------+
        |                        |
        v                        v
 Enterprise Backend          eIDP OIDC
 Services                  Identity Provider
```

## Tech Stack

| Component        | Technology                    |
|------------------|-------------------------------|
| Runtime          | Java 21                       |
| Framework        | Spring Boot 3.3.5             |
| Security         | Spring Security 6             |
| OAuth2           | Spring OAuth2 Client          |
| Session          | Spring Session + Redis        |
| Database         | PostgreSQL 16                 |
| Cache            | Redis 7                       |
| API Docs         | OpenAPI 3 + SpringDoc         |
| Build            | Maven                         |
| Container        | Docker + Kubernetes-ready     |

## API Endpoints

| Method | Path                              | Auth | Description                    |
|--------|-----------------------------------|------|--------------------------------|
| GET    | /palette/api/v1/system/health/live  | No   | Liveness probe               |
| GET    | /palette/api/v1/system/health/ready | No   | Readiness probe              |
| GET    | /palette/api/v1/system/info         | No   | Application info             |
| GET    | /palette/api/v1/auth/login          | No   | OIDC login entry             |
| GET    | /palette/api/v1/auth/session        | No   | Auth status check            |
| GET    | /palette/api/v1/auth/me             | Yes  | User info from eIDP userinfo |
| POST   | /palette/api/v1/auth/logout         | Yes  | Logout (with eIDP logout)    |
| GET    | /palette/api/v1/context             | Yes  | User context                 |
| GET    | /palette/api/v1/config              | Yes  | Runtime config               |
| ANY    | /palette/api/v1/backend/**          | Yes  | Gateway proxy                |
| POST   | /palette/api/v1/files               | Yes  | File upload                  |
| GET    | /palette/api/v1/files/{id}          | Yes  | File download                |

## Quick Start

### Prerequisites

- Java 21+
- Maven 3.9+
- Redis 7+ (for production/docker mode)
- PostgreSQL 16+ (for production/docker mode)

### Development Mode

```bash
# Run in dev mode (no Redis required)
cd palette-bff
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Docker Deployment

```bash
# Set environment variables
export EIDP_CLIENT_ID=your-client-id
export EIDP_CLIENT_SECRET=your-client-secret
export EIDP_AUTHORIZATION_URI=https://eidp.company.com/authorize
export EIDP_TOKEN_URI=https://eidp.company.com/token
export EIDP_JWK_SET_URI=https://eidp.company.com/jwks
export EIDP_USER_INFO_URI=https://eidp.company.com/userinfo
export EIDP_LOGOUT_URI=https://eidp.company.com/end-session

# Start all services
docker-compose up -d
```

### Environment Variables

| Variable                    | Description                        | Default               |
|-----------------------------|------------------------------------|-----------------------|
| SPRING_PROFILES_ACTIVE        | Active profiles                   | dev                   |
| REDIS_HOST                  | Redis hostname                     | localhost             |
| REDIS_PORT                  | Redis port                         | 6379                  |
| DB_HOST                     | PostgreSQL hostname                | localhost             |
| DB_PORT                     | PostgreSQL port                    | 5432                  |
| EIDP_CLIENT_ID              | OAuth2 client ID                   | palette-bff           |
| EIDP_CLIENT_SECRET          | OAuth2 client secret               | (required)            |
| EIDP_AUTHORIZATION_URI      | eIDP authorization endpoint        | https://eidp.company.com/authorize |
| EIDP_TOKEN_URI              | eIDP token endpoint                | https://eidp.company.com/token |
| EIDP_JWK_SET_URI            | eIDP JWK Set endpoint              | https://eidp.company.com/jwks |
| EIDP_USER_INFO_URI          | eIDP UserInfo endpoint             | https://eidp.company.com/userinfo |
| EIDP_LOGOUT_URI             | eIDP end_session_endpoint          | (empty)               |
| EIDP_POST_LOGOUT_REDIRECT_URI | Post-logout redirect URI         | http://localhost:8080 |
| CORS_ORIGINS                | Allowed CORS origins               | http://localhost:3000 |
| COOKIE_DOMAIN               | Cookie domain                      | (empty)               |
| PALETTE_ENV                 | Environment name                   | UAT                   |

## Build

```bash
# Compile
mvn compile

# Run tests
mvn test

# Package JAR
mvn clean package -DskipTests

# Build Docker image (requires JAR built first)
docker build -t palette-bff:latest .
```

## API Documentation

When the application is running, access Swagger UI at:

```
http://localhost:8080/palette/swagger-ui.html
```

OpenAPI spec available at:

```
http://localhost:8080/palette/api-docs
```

## Project Structure

```
src/main/java/com/company/palette/bff/
├── auth/              # OIDC authentication
├── security/          # Spring Security configuration
├── session/           # Redis session management
├── gateway/           # Backend API proxy
├── context/           # User context
├── config/            # Runtime configuration
├── system/            # System APIs (health, info)
├── audit/             # Audit framework
├── tracing/           # Request tracing
├── exception/         # Global exception handling
├── common/            # Shared utilities
└── controller/        # REST controllers
```

## License

Internal use only.
