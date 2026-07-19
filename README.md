# Palette BFF - Enterprise Frontend Platform

Enterprise Backend For Frontend (BFF) platform foundation layer.

## Overview

Palette BFF serves as the single entry point for all React frontend applications, providing:

- Centralized OIDC authentication (eIDP integration)
- Secure session management (Redis-backed)
- Enterprise API gateway with token relay
- User context & real-time UserInfo from eIDP
- Platform runtime configuration
- Request tracing & observability
- Audit framework

## Quick Links

- [Palette BFF README](palette-bff/README.md) - Detailed project documentation
- [Architecture Document](palette-bff/docs/architecture.md) - Architecture design & flows

## Quick Start

```bash
cd palette-bff
./gradlew bootRun --args='--spring.profiles.active=dev'
```

Access Swagger UI: http://localhost:8080/palette/swagger-ui.html

## License

Internal use only.
