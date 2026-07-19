# Palette BFF - Architecture Document

## 1. Overview

Palette BFF (Backend For Frontend) is the enterprise frontend platform foundation layer.
It serves as the single entry point for all React frontend applications, providing
centralized authentication, session management, API gateway capabilities, and
observability foundations.

## 2. Architecture Principles

1. React never communicates directly with eIDP (Enterprise Identity Provider)
2. React never stores OAuth tokens - only session cookies
3. OAuth Access Token and Refresh Token are owned exclusively by Palette BFF
4. All frontend API requests go through Palette BFF
5. Palette BFF provides stable frontend contracts
6. Business applications remain independent and decoupled

## 3. System Architecture

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

## 4. Module Structure

```
com.company.palette.bff
├── auth/              # OIDC authentication implementation
├── security/          # Spring Security configuration
├── session/           # Redis session management
├── gateway/           # Backend API proxy capability
├── context/           # Current user context
├── config/            # Runtime configuration & properties
├── system/            # System APIs (health, info)
├── audit/             # Audit framework
├── tracing/           # Request tracing & correlation
├── exception/         # Global exception handling
├── common/            # Shared utilities (ApiResponse)
└── controller/        # REST API controllers
```

## 5. API Design

### Base URL
All APIs: `/palette/api/v1`

### Endpoints

| Category       | Method | Path                              | Auth Required |
|----------------|--------|-----------------------------------|---------------|
| Health         | GET    | /palette/api/v1/system/health/live  | No            |
| Health         | GET    | /palette/api/v1/system/health/ready | No            |
| Info           | GET    | /palette/api/v1/system/info         | No            |
| Login          | GET    | /palette/api/v1/auth/login          | No            |
| Session        | GET    | /palette/api/v1/auth/session        | No*           |
| UserInfo       | GET    | /palette/api/v1/auth/me             | Yes           |
| Logout         | POST   | /palette/api/v1/auth/logout         | Yes           |
| Context        | GET    | /palette/api/v1/context             | Yes           |
| Config         | GET    | /palette/api/v1/config              | Yes           |
| File Upload    | POST   | /palette/api/v1/files               | Yes           |
| File Download  | GET    | /palette/api/v1/files/{id}          | Yes           |
| Gateway        | ANY    | /palette/api/v1/backend/**          | Yes           |

*Session endpoint returns different response based on auth status

### Response Format

**Success:**
```json
{
    "data": { ... }
}
```

**Error:**
```json
{
    "code": "PALETTE_UNAUTHORIZED",
    "message": "Authentication required",
    "traceId": "A1B2C3D4E5F6G7H8",
    "timestamp": "2026-07-19T10:00:00Z"
}
```

## 6. Authentication Flow

### Login Flow
```
React App
    |
    | GET /palette/api/v1/auth/login
    v
Palette BFF
    |
    | 302 Redirect -> /oauth2/authorization/eidp
    v
eIDP (Enterprise Identity Provider)
    |
    | User authenticates
    v
Palette BFF (callback /login/oauth2/code/eidp)
    |
    | Exchange code for tokens
    | Store tokens in Redis session
    v
Set PALETTE_SESSION cookie (HttpOnly, Secure, SameSite)
    |
    v
React App (receives cookie only, no tokens)
```

### UserInfo Flow (GET /palette/api/v1/auth/me)
```
React App
    |
    | GET /palette/api/v1/auth/me
    | Cookie: PALETTE_SESSION
    v
Palette BFF (AuthController)
    |
    | Extract Access Token from session
    | Call eIDP UserInfo endpoint
    v
eIDP UserInfo Endpoint
    |
    | Returns OIDC claims (sub, name, email, etc.)
    v
Palette BFF
    |
    | Map claims to UserInfo response
    v
React App
    |
    | Response: { "data": { "sub": "...", "name": "...", "email": "..." } }
```

### Logout Flow (POST /palette/api/v1/auth/logout)
```
React App
    |
    | POST /palette/api/v1/auth/logout
    | Cookie: PALETTE_SESSION
    v
Palette BFF (AuthController)
    |
    | 1. Capture userId for audit
    | 2. Invalidate HTTP session
    | 3. Clear SecurityContext
    | 4. Clear session cookie
    | 5. Generate eIDP logout URL (with id_token_hint)
    | 6. Record audit event
    v
React App
    |
    | Response: { "data": { "success": true, "eidpLogoutUrl": "https://eidp.../end-session?id_token_hint=..." } }
    |
    | (Optional) Redirect browser to eidpLogoutUrl for SSO logout
```

## 7. Session Management

### Redis Session Design

**Key Pattern:** `palette:session:{sessionId}`

**Session Object:**
```json
{
    "sessionId": "uuid",
    "userId": "user-subject-id",
    "username": "john.doe",
    "displayName": "John Doe",
    "email": "john@company.com",
    "accessToken": "oauth2-access-token",
    "refreshToken": "oauth2-refresh-token",
    "tokenExpiresAt": "2026-07-19T11:00:00Z",
    "expireAt": "2026-07-19T18:00:00Z"
}
```

**Cookie Configuration:**
- Name: PALETTE_SESSION
- HttpOnly: true
- Secure: true (HTTPS only)
- SameSite: Lax
- Max-Age: 28800 (8 hours)

**Token Refresh:**
- Automatic refresh when token is expiring within 60 seconds
- Uses OAuth2 AuthorizedClientManager for refresh flow

## 8. Gateway Design

### Route Configuration
```yaml
palette:
  gateway:
    connect-timeout: 5000
    read-timeout: 30000
    routes:
      - name: trading-service
        path: /backend/trading/**
        target: http://trading-service
      - name: user-service
        path: /backend/user/**
        target: http://user-service
```

### Request Flow
1. Frontend sends: `GET /palette/api/v1/backend/trading/orders`
2. GatewayFilter matches route pattern
3. Token relay: Attaches `Authorization: Bearer {access_token}`
4. Header enrichment: Adds X-Request-ID, X-User-ID, X-Application-ID, X-Channel
5. Forwards to: `GET http://trading-service/orders`

### Error Transformation
Backend errors are transformed to standard Palette error format:
```json
{
    "code": "PALETTE_GATEWAY_ERROR",
    "message": "Backend service unavailable",
    "traceId": "A1B2C3D4E5F6G7H8",
    "timestamp": "2026-07-19T10:00:00Z"
}
```

## 9. Security Configuration

- **CSRF:** Disabled (stateless session with cookie)
- **CORS:** Configurable via `palette.security.cors`
- **Headers:** X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Session:** IF_REQUIRED policy, 30 minute timeout
- **Authentication:** OAuth2 Login with eIDP provider
- **Error Handling:** JSON responses for 401/403 (no redirects for API)

## 10. Observability

### Request Tracing
- Every request gets a unique X-Request-ID (generated or propagated)
- TracingContext stores requestId and userId in ThreadLocal
- MDC integration for structured logging

### Request Logging
Every request logs:
- requestId
- userId
- HTTP method
- URI
- Response status
- Duration (ms)

### Audit Trail
Records:
- Login events
- Logout events
- API access to sensitive endpoints

## 11. Technology Stack

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

## 12. Deployment

### Docker Compose (Development)
```bash
cd palette-bff
docker-compose up -d
```

### Environment Variables
| Variable                    | Description                    | Default              |
|-----------------------------|--------------------------------|----------------------|
| SPRING_PROFILES_ACTIVE        | Active profiles               | dev                  |
| REDIS_HOST                  | Redis hostname                 | localhost            |
| REDIS_PORT                  | Redis port                     | 6379                 |
| DB_HOST                     | PostgreSQL hostname            | localhost            |
| DB_PORT                     | PostgreSQL port                | 5432                 |
| EIDP_CLIENT_ID              | OAuth2 client ID               | palette-bff          |
| EIDP_CLIENT_SECRET          | OAuth2 client secret           | (required)           |
| EIDP_AUTHORIZATION_URI      | eIDP authorization endpoint    | https://eidp.company.com/authorize |
| EIDP_TOKEN_URI              | eIDP token endpoint            | https://eidp.company.com/token |
| EIDP_JWK_SET_URI            | eIDP JWK Set endpoint          | https://eidp.company.com/jwks |
| EIDP_USER_INFO_URI          | eIDP UserInfo endpoint         | https://eidp.company.com/userinfo |
| EIDP_LOGOUT_URI             | eIDP end_session_endpoint      | (empty)              |
| EIDP_POST_LOGOUT_REDIRECT_URI | Post-logout redirect URI     | http://localhost:8080|
| CORS_ORIGINS                | Allowed CORS origins           | http://localhost:3000|
| COOKIE_DOMAIN               | Cookie domain                  | (empty)              |
| PALETTE_ENV                 | Environment name               | UAT                  |

## 13. React Integration Contract

React applications consume only these endpoints:

```typescript
// Authentication
GET  /palette/api/v1/auth/session   // Check auth status
GET  /palette/api/v1/auth/me        // User info from eIDP UserInfo endpoint
POST /palette/api/v1/auth/logout    // Logout (returns eIDP logout URL)

// User Context
GET  /palette/api/v1/context        // Current user info + environment

// Backend Gateway
ANY  /palette/api/v1/backend/**     // Proxy to backend services

// Configuration
GET  /palette/api/v1/config         // Runtime config

// System
GET  /palette/api/v1/system/*       // Health & info
```

## 14. Future Extensions

The following capabilities will be implemented by future business modules:
- Menu management
- Permission management
- Role management
- Business workflows
- Domain services
- Business aggregation logic
