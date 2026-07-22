# Palette — Enterprise UI Platform

## Overview

> **One Platform. Infinite Applications.**  
> Palette provides a standardized frontend infrastructure and BFF middleware layer  
> for securities post-trade business teams, reducing new application delivery  
> from **6+ weeks to just 3 days**.

---

## 1. Why Palette?

### The Problem

| Pain Point | Impact |
|------------|--------|
| Each team builds auth, layout, routing, API client from scratch | 6+ weeks before first feature shipped |
| Inconsistent UX, security patterns, error handling across apps | Poor user experience; security risks |
| No shared component library | Duplicated effort; inconsistent branding |
| Frontend directly manages tokens and auth state | Security vulnerability surface |
| No standardized onboarding for new applications | High ramp-up cost for new teams |

### The Solution

```
                    ┌─────────────────────────────────────────┐
                    │         Business Applications           │
                    │                                         │
                    │  Clearing App  │  Settlement  │ Reporting│
                    └────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────────────────────────────┐
                    │          Palette SDK                     │
                    │  @palette/shell  @palette/ui             │
                    │  @palette/auth   @palette/api            │
                    │  @palette/layout @palette/config         │
                    └────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────────────────────────────┐
                    │          Palette BFF                     │
                    │  Auth │ Session │ Gateway │ Audit        │
                    └────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────────────────────────────┐
                    │     Backend Business Services            │
                    └─────────────────────────────────────────┘
```

### Value Proposition

| For Business Teams | For Platform Teams | For Leadership |
|--------------------|--------------------|----------------|
| Ship features in days, not weeks | Centralized standards enforcement | 40%+ cost reduction on frontend infra |
| Focus on business logic, not infrastructure | Single source of truth for UI patterns | Faster time-to-market |
| Enterprise-grade security out of the box | Unified monitoring & observability | Consistent user experience |
| Rich component library + Storybook | Version-controlled shared dependencies | Reduced technical debt |

---

## 2. Platform Capabilities

### 2.1 Frontend Framework

| Capability | Package | Description |
|------------|---------|-------------|
| **Application Shell** | `@palette/core` | Provider hierarchy, ErrorBoundary, lifecycle management |
| **Enterprise Layout** | `@palette/layout` | AppShell, Header, Sidebar, Breadcrumb, responsive grid |
| **UI Component Library** | `@palette/ui` | 30+ enterprise components (Form, Table, Modal, Drawer...) |
| **Theme System** | `@palette/theme` | Design tokens, Light/Dark mode, MUI customization |
| **Navigation & Routing** | `@palette/router` | Declarative route config, dynamic menu, permission filtering |
| **Authentication & Permissions** | `@palette/auth` | AuthProvider, `usePermission()`, `<RequirePermission>` |
| **API Client** | `@palette/api` | Axios + TanStack Query v5, Query Key factory, platform hooks |
| **Configuration** | `@palette/config` | Runtime config, Feature Flags, environment-aware settings |
| **User Context** | `@palette/context` | User profile, preferences, multi-tenant context |
| **Utilities** | `@palette/utils` | Logger, formatters, validators, shared helpers |
| **Internationalization** | `@palette/i18n` | Multi-language support, date/number formatting |
| **Monitoring** | `@palette/monitoring` | Error capture, Web Vitals, structured logging |

### 2.2 BFF Platform (Spring Boot 3)

| Module | Capability |
|--------|------------|
| **Authentication** | OIDC Authorization Code flow, eIDP integration, Keycloak dev mode |
| **Session Management** | HttpOnly secure cookies, Redis/InMemory dual mode, automatic expiry |
| **Token Relay** | Backend services never see frontend; BFF injects `Authorization: Bearer` |
| **API Gateway** | Route proxy, header injection (X-User-ID, X-Request-ID), rate limiting |
| **User Context** | `/context` API — user profile, permissions, preferences |
| **Runtime Config** | `/config` API — feature flags, environment settings, app metadata |
| **Audit Framework** | Event-based audit logging, interceptor-driven, structured log output |
| **Request Tracing** | End-to-end request ID propagation across services |
| **File Services** | Upload/download API with size validation and type checking |
| **Health & Info** | `/system/health`, `/system/info` for ops monitoring |

### 2.3 Developer Experience

| Tool | Purpose |
|------|---------|
| **Scaffolding CLI** | `create-palette-app` — generate new app with one command |
| **Storybook** | Interactive component documentation and visual testing |
| **Developer Portal** | Guides, API reference, migration docs, FAQ |
| **Page Templates** | List/Detail/Form patterns ready to customize |
| **OpenAPI Codegen** | Auto-generate TypeScript types from BFF OpenAPI spec |

---

## 3. Technology Stack

### Frontend

| Category | Technology | Why |
|----------|------------|-----|
| Framework | **React 18** | Industry standard, concurrent features, Suspense |
| Language | **TypeScript 5 (strict)** | Type safety, better IDE support, fewer runtime errors |
| Build | **Vite 5** | Fast HMR, optimized builds, native ESM |
| Package Mgmt | **pnpm workspace** | Efficient monorepo, strict isolation, fast installs |
| Data Fetching | **TanStack Query v5** | Enterprise caching, auto-retry, DevTools, type-safe |
| HTTP Client | **Axios** | Interceptors, request/response transformation |
| UI Foundation | **MUI 5** | Enterprise-grade components, accessibility, theming |
| Styling | **Tailwind CSS** | Utility-first, responsive, consistent design system |
| Forms | **React Hook Form + Zod** | Performant forms, schema validation, type inference |
| State | **Redux Toolkit** | Predictable state, DevTools, middleware ecosystem |
| Testing | **Vitest + Testing Library** | Fast, Vite-native, user-centric testing |
| Docs | **Storybook** | Component isolation, visual regression, living docs |

### Backend (BFF)

| Category | Technology | Why |
|----------|------------|-----|
| Framework | **Spring Boot 3.3** | Latest LTS ecosystem, auto-configuration |
| Language | **Java 21** | LTS, Virtual Threads, GraalVM native image |
| Security | **Spring Security 6** | OAuth2 Client, method security, CSRF protection |
| Session | **Spring Session + Redis** | Distributed sessions, production-proven |
| API Docs | **OpenAPI 3 + SpringDoc** | Auto-generated, interactive Swagger UI |
| Database | **PostgreSQL 16** (prod) / **H2** (dev) | Reliable production DB; zero-config development |
| Container | **Docker** | Consistent environments, K8s-ready |
| Metrics | **Micrometer + Prometheus** | Industry-standard observability |

---

## 4. Architecture Highlights

### Security Model

```
┌──────────────┐    Cookie     ┌──────────────┐    Bearer    ┌──────────────┐
│   Browser    │◄─────────────►│  Palette BFF │─────────────►│   Backend    │
│              │  (HttpOnly)   │              │   Token       │   Service    │
│  NO tokens   │               │  Token relay │               │  No auth     │
│  in JS code  │               │  + headers   │               │  logic needed│
└──────────────┘               └──────────────┘               └──────────────┘
```

**Key Principles:**
- Frontend **never** holds access tokens — only HttpOnly session cookies
- BFF handles all token lifecycle (refresh, expiry, rotation)
- Backend services read BFF-injected headers — no auth logic needed
- Automatic session expiry detection + redirect to login

### Request Flow

```
1. User clicks "Submit" in Clearing App
        │
2. React component calls usePlatformMutation()
        │
3. paletteApi.post('/clearing/trades', data)
        │  Cookie: PALETTE_SESSION=abc123
        ▼
4. Palette BFF receives request
        │  ✓ Validates session
        │  ✓ Extracts user from session
        │  ✓ Injects Authorization: Bearer <token>
        │  ✓ Injects X-User-ID: user@example.com
        │  ✓ Injects X-Request-ID: req-uuid-789
        ▼
5. Clearing Service processes request
        │  Returns { "data": { ... } }
        ▼
6. BFF forwards response to browser
        │  TanStack Query updates cache
        │  UI re-renders automatically
```

### Provider Architecture

```tsx
<PaletteProvider>                    {/* Root provider */}
  <ErrorBoundary fallback={...}>     {/* Global error handling */}
    <AuthProvider>                   {/* Authentication context */}
      <ConfigProvider>               {/* Runtime configuration */}
        <ContextProvider>            {/* User context */}
          <PaletteQueryProvider>     {/* TanStack Query client */}
            <App />                  {/* Your application */}
          </PaletteQueryProvider>
        </ContextProvider>
      </ConfigProvider>
    </AuthProvider>
  </ErrorBoundary>
</PaletteProvider>
```

---

## 5. Quick Start for Business Teams

### Create a New Application

```bash
# 1. Scaffold new app
npx create-palette-app clearing

# 2. Start development
cd apps/palette-clearing
pnpm dev
# → https://localhost:3001
```

### Use Platform Capabilities

```tsx
// Fetch data with built-in caching
import { usePlatformQuery, paletteKeys } from '@palette/api';

function TradeList() {
  const { data, isLoading, error } = usePlatformQuery({
    queryKey: paletteKeys.clearing.list(),
    queryFn: () => paletteApi.get('/clearing/trades'),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return <DataTable data={data} columns={tradeColumns} />;
}
```

```tsx
// Permission-based access control
import { RequirePermission, usePermission } from '@palette/auth';

function ClearingApp() {
  return (
    <RequirePermission permission="CLEARING_VIEW">
      <Sidebar>
        <MenuItem>Trades</MenuItem>
        <MenuItem permission="CLEARING_ADMIN">Admin</MenuItem>
      </Sidebar>
      <Content>
        <Routes>
          <Route path="/trades" element={<TradeList />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Content>
    </RequirePermission>
  );
}
```

```tsx
// Runtime configuration & feature flags
import { useConfig, useFeatureFlag } from '@palette/config';

function AppHeader() {
  const { environment, appName } = useConfig();
  const { isEnabled } = useFeatureFlag('NEW_TRADE_UI');

  return (
    <Header>
      <EnvironmentBadge env={environment} />
      <span>{appName}</span>
      {isEnabled('NEW_TRADE_UI') ? <NewTradeNav /> : <LegacyNav />}
    </Header>
  );
}
```

---

## 6. What You Get Out of the Box

When your team builds on Palette, you inherit:

| Category | Included |
|----------|----------|
| **Authentication** | OIDC login/logout, session management, auto token refresh |
| **Security** | HttpOnly cookies, CSRF protection, XSS prevention, permission system |
| **Layout** | Enterprise shell (Header + Sidebar + Content), responsive design |
| **API Layer** | Axios client, TanStack Query caching, automatic error handling |
| **Error Handling** | Global ErrorBoundary, classified errors (auth/network/server/timeout) |
| **Configuration** | Runtime config from BFF, environment-aware, feature flags |
| **User Context** | User profile, preferences, tenant info available everywhere |
| **Observability** | Request tracing, error monitoring, Web Vitals, structured logging |
| **Developer Tools** | Scaffolding CLI, Storybook, page templates, API type generation |
| **CI/CD Ready** | ESLint, TypeScript strict, testing framework, Docker deployment |

---

## 7. Current Status

```
Overall Progress: ~55% toward MVP

Phase 0  Foundation      ████████████████████  90%
Phase 1  UI Framework    ████████████░░░░░░░░  60%
Phase 2  BFF Platform    ████████████████░░░░  75%
Phase 3  Enablement      ████░░░░░░░░░░░░░░░░  25%
Phase 4  Prod Ready      ██░░░░░░░░░░░░░░░░░░  10%
```

### Already Delivered

- **BFF**: Full OIDC auth, session management, API gateway, token relay, audit, tracing
- **API Client**: TanStack Query v5 integration, Query Key factory, platform hooks
- **Layout**: AppShell, Header, Sidebar, PageContainer
- **Auth**: Provider system, config distribution, user context
- **Router**: Declarative route registration, protected/public routes
- **Demo**: Complete Task Management app (frontend + backend)
- **CLI**: Scaffolding tool (`create-palette-app`)
- **Docs**: Architecture docs, API design docs

### Coming Next

- UI component library expansion (Form, Table, Modal, Dialog)
- Theme system with Light/Dark mode
- Permission hooks and dynamic menu
- Developer documentation portal + Storybook
- Monitoring, i18n, micro-frontend support

---

## 8. Roadmap

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| **Phase 0** | Week 1–2 | Foundation: Monorepo + CI/CD + Standards |
| **Phase 1** | Week 3–6 | UI Framework MVP: Shell + Layout + API + Demo |
| **Phase 2** | Week 7–9 | BFF MVP: Auth + Session + Gateway + APIs |
| **Phase 3** | Week 10–12 | Enablement: Docs + Storybook + First Team Trial |
| **Phase 4** | Week 13–16 | Production: Monitoring + Security + Performance + MVP Release |

---

## 9. Success Metrics

| Metric | Before Palette | With Palette |
|--------|---------------|--------------|
| New app setup time | 6+ weeks | **3 days** |
| Code reuse rate | 0% | **70%+** |
| Security incidents | Inconsistent | **Unified policy** |
| Developer onboarding | 2+ weeks | **1 day** |
| Cross-team consistency | None | **100% standardized** |

---

## 10. Get Involved

| Action | How |
|--------|-----|
| **Try the Demo** | Run `palette-demo` locally — see what a Palette app looks like |
| **Browse Components** | Storybook (coming soon) — interactive component documentation |
| **Start Your App** | `npx create-palette-app your-app-name` |
| **Read the Docs** | Developer portal (coming soon) — guides, API reference, FAQ |
| **Join the Channel** | `#palette-platform` — ask questions, share feedback |
| **Report Issues** | Jira project `PALETTE` — bugs, feature requests |

---

## 11. Architecture Decision Records

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | TanStack Query v5 | Enterprise caching, auto-retry, DevTools, type safety |
| ADR-002 | pnpm workspace | Efficient monorepo, strict package isolation |
| ADR-003 | Spring Boot 3 + Java 21 | LTS, Virtual Threads, GraalVM native image support |
| ADR-004 | BFF Session Cookie | Frontend never holds tokens; maximum security |
| ADR-005 | MUI + Tailwind CSS | Enterprise components + flexible utility styling |
| ADR-006 | H2 dev / PostgreSQL prod | Zero-config development; production reliability |

---

## 12. Project Structure

```
palette-platform/
│
├── palette-bff/                          # BFF Gateway (Spring Boot 3)
│   ├── auth/                             #   OIDC authentication
│   ├── security/                         #   Spring Security config
│   ├── session/                          #   Session management
│   ├── gateway/                          #   API gateway proxy
│   ├── context/                          #   User context API
│   ├── config/                           #   Runtime config API
│   ├── audit/                            #   Audit framework
│   ├── tracing/                          #   Request tracing
│   └── exception/                        #   Global exception handling
│
├── palette-frontend/                     # Frontend Monorepo
│   ├── apps/
│   │   ├── palette-portal/               #   Platform main app
│   │   └── palette-demo/                 #   Demo (Task Management)
│   └── packages/
│       ├── platform-core/                #   @palette/core
│       ├── platform-auth/                #   @palette/auth
│       ├── platform-api/                 #   @palette/api
│       ├── platform-layout/              #   @palette/layout
│       ├── platform-router/              #   @palette/router
│       ├── platform-ui/                  #   @palette/ui
│       ├── platform-config/              #   @palette/config
│       ├── platform-context/             #   @palette/context
│       └── platform-utils/               #   @palette/utils
│
├── palette-create/                       # Scaffolding CLI
└── keycloak/                             # Local OIDC (dev environment)
```

---

> **Palette** — Build less infrastructure. Ship more business value.  
>  
> *Contact: #palette-platform | Jira: PALETTE | Docs: developer-portal (coming soon)*
