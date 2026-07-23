# Palette Enterprise UI Platform — Development Plan

> **Document Version**: 1.0  
> **Last Updated**: 2025-07-21  
> **Status**: In Progress  
> **Target**: Production-Ready Enterprise Platform

---

## 1. Executive Summary

Palette is an enterprise-grade frontend platform that provides a standardized UI common framework and Backend-for-Frontend (BFF) middleware layer for securities post-trade business teams. Through platformization, it eliminates the cost of duplicated infrastructure development across teams, unifies enterprise technical standards, and reduces new application delivery cycles from **6+ weeks to just a few days**.

### 1.1 Project Objectives

| Dimension | Goal |
|-----------|------|
| **Efficiency** | Reduce new application delivery from 6 weeks to 3–5 days |
| **Quality** | Unify security standards, error handling, and user experience |
| **Cost** | Eliminate cross-team duplicated effort; save 40%+ on frontend infrastructure investment |
| **Governance** | Establish a platform-based application management system with registration, monitoring, and audit capabilities |

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 + TypeScript 5 (strict mode) |
| Build Tool | Vite 5 |
| Package Management | pnpm workspace (Monorepo) |
| Data Fetching | TanStack Query v5 + Axios |
| UI Components | MUI 5 + Tailwind CSS |
| State Management | Redux Toolkit |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library + Storybook |
| Backend Framework | Spring Boot 3.3.5 + Java 21 |
| Security | Spring Security 6 + OAuth2 Client |
| Session | Spring Session + Redis |
| Database | PostgreSQL 16 |
| API Documentation | OpenAPI 3 + SpringDoc |
| Containerization | Docker + Kubernetes-ready |

---

## 2. Current Status Assessment (as of 2025-07-21)

### 2.1 Completion Overview

| Module | Completion | Status |
|--------|------------|--------|
| **BFF Foundation Layer** | 100% | 🟢 Full implementation: Permission system + Dynamic routing + Rate limiting + Core gateway |
| **Frontend Monorepo** | 90% | 🟢 Structure complete, pnpm workspace operational |
| **@palette/core** | 90% | 🟢 Enterprise-grade: Lifecycle management + Plugin system + Event bus + Version/Health monitoring |
| **@palette/auth** | 85% | 🟢 Enterprise-grade: AuthProvider, usePermission, RequirePermission, useSessionExpiry |
| **@palette/api** | 80% | 🟢 TanStack Query integration complete; missing business hook patterns |
| **@palette/layout** | 55% | 🟡 AppShell/Header/Sidebar basics complete; missing responsive design |
| **@palette/router** | 40% | 🟡 Basic route registration; missing dynamic menu/permission routes |
| **@palette/ui** | 30% | 🟡 Basic components (Button/Loading/Error); missing component library system |
| **@palette/config** | 90% | 🟢 Enterprise-grade: ConfigProvider + Feature Flag system + Environment detection |
| **@palette/context** | 60% | 🟡 ContextProvider complete; missing multi-tenancy |
| **@palette/utils** | 50% | 🟡 Basic utility functions |
| **Demo Application** | 85% | 🟢 Full frontend/backend demo implemented; backend compiles |
| **Scaffolding CLI** | 80% | 🟢 CLI tool complete, tests passing |
| **CI/CD** | 0% | 🔴 Not started |
| **Documentation** | 40% | 🟡 BFF README + architecture docs; missing developer docs |
| **Test Coverage** | 10% | 🔴 BFF has basic tests; no frontend tests |

### 2.2 Completed Core Capabilities

**BFF (Spring Boot 3)**:
- ✅ OIDC authentication integration (eIDP)
- ✅ Secure session management (Redis/InMemory dual mode)
- ✅ API gateway proxy (Token Relay)
- ✅ User context API
- ✅ Runtime configuration distribution
- ✅ End-to-end request tracing
- ✅ Audit framework
- ✅ Global exception handling
- ✅ Health/Info system APIs
- ✅ File upload/download
- ✅ Docker deployment support
- ✅ Permission aggregation module (eIDP claims extraction)
- ✅ Dynamic route management (priority merging + runtime config)
- ✅ Rate limiting filter (sliding window algorithm)
- ✅ Basic unit tests (4 test classes)

**Frontend Platform**:
- ✅ Monorepo structure (pnpm workspace)
- ✅ 9 platform packages (@palette/*)
- ✅ PaletteProvider nesting hierarchy
- ✅ Platform lifecycle management (phase tracking + boot performance)
- ✅ Platform event bus (cross-module communication)
- ✅ Plugin system (extensible architecture)
- ✅ Enhanced error boundary (auto-retry + degraded UI)
- ✅ Version detection & update prompts
- ✅ Platform health monitoring hooks
- ✅ Axios client + interceptors
- ✅ TanStack Query v5 enterprise integration
- ✅ Query Key factory system
- ✅ Pre-built platform-level hooks
- ✅ Error classification system (PlatformError)
- ✅ Basic layout components (AppShell/Header/Sidebar)
- ✅ Basic UI components (Button/Loading/Error/EmptyState)
- ✅ Declarative route registration
- ✅ Complete demo application (Task Management)
- ✅ Scaffolding CLI tool
- ✅ @palette/auth enterprise enhancement (permission hooks, RequirePermission, useSessionExpiry)
- ✅ @palette/config enterprise enhancement (Feature Flags, environment detection)
- ✅ @palette/api TanStack Query v5 + scaffold CLI integration

---

## 3. Development Roadmap — Week by Week

### Phase 1: Foundation Hardening (Week 1–3)
**Objective**: Fill gaps in the core framework to reach a demonstrable MVP state

---

#### Week 1 (07/21 – 07/25) — BFF Security & Gateway Enhancement

**Objective**: Strengthen BFF security framework and gateway capabilities

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 1.1 | Permission aggregation module — Implement `PermissionService` extracting permissions from eIDP token claims; expose `GET /palette/api/v1/auth/permissions` endpoint | P0 | 2d | `permission/PermissionService.java`, `PermissionController.java` |
| 1.2 | Dynamic gateway route configuration — Load routes from database/config center instead of hardcoded YAML | P0 | 2d | `gateway/GatewayRouteRepository.java`, `DynamicRouteService.java` |
| 1.3 | Rate limiting filter — Redis-based sliding window rate limiter | P1 | 1d | `gateway/RateLimitFilter.java` |
| 1.4 | BFF integration tests — Add integration tests for gateway proxy and session management | P1 | 1d | Integration test classes under `test/` |

**Deliverables**:
- Permission API operational
- Gateway routes support dynamic loading
- Rate limiting protection
- Test coverage increased to 40%

**Weekly Report Highlight**: BFF security framework completed; gateway capability elevated from "functional" to "production-ready"

---

#### Week 2 (07/28 – 08/01) — Frontend Permission & Route Enhancement

**Objective**: Establish frontend permission control system and dynamic routing

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 2.1 | `@palette/auth` permission hooks — `usePermission()`, `<RequirePermission>` component | P0 | 2d | `hooks.ts`, `RequirePermission.tsx` |
| 2.2 | Permission route guard — Dynamically filter menus and routes based on permissions | P0 | 2d | `platform-router` enhancement |
| 2.3 | `@palette/context` multi-environment switch — Support UAT/Staging/Production context | P1 | 1d | `ContextProvider.tsx` enhancement |
| 2.4 | Frontend permission demo — Demonstrate permission control in demo app | P1 | 1d | Demo page updates |

**Deliverables**:
```tsx
// Permission control example
<RequirePermission permission="CLEARING_VIEW">
  <ClearingPage />
</RequirePermission>

// Permission hook
const { hasPermission } = usePermission();
if (hasPermission('TRADE_CREATE')) { ... }
```

**Weekly Report Highlight**: Frontend permission system established; supports declarative permission control and dynamic menus

---

#### Week 3 (08/04 – 08/08) — UI Component Library + Theme System

**Objective**: Build enterprise-grade UI component library framework and theme system

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 3.1 | Theme system — Design Token system, Light/Dark mode, MUI theme customization | P0 | 2d | `@palette/theme` package |
| 3.2 | Core components — Form/Input/Select/Modal/Dialog/Table/Card | P0 | 2d | `@palette/ui` component expansion |
| 3.3 | Form integration — React Hook Form + Zod validation + error display | P1 | 1d | `@palette/ui` Form component |
| 3.4 | Storybook setup — Component documentation + interactive preview | P1 | 1d | `.storybook/` config + Stories |

**Deliverables**:
- `@palette/theme` package (Design Tokens + Light/Dark)
- 10+ core UI components
- Storybook accessible at `http://localhost:6006`
- Standardized form solution

**Weekly Report Highlight**: UI component library framework established; business teams can browse and use components via Storybook

---

### Phase 2: Platform Maturity (Week 4–6)
**Objective**: Complete enterprise platform capabilities; ready for single business team onboarding

---

#### Week 4 (08/11 – 08/15) — Internationalization + Notification System

**Objective**: Multi-language support and global notification capability

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 4.1 | i18n framework — `@palette/i18n` package based on react-i18next | P0 | 2d | New package + Provider |
| 4.2 | Chinese/English language packs — Platform-level translations + business extension mechanism | P0 | 1d | `locales/zh-CN.json`, `locales/en-US.json` |
| 4.3 | Global notification system — Unified Toast/Notification/Snackbar management | P1 | 1d | `@palette/ui` Notification component |
| 4.4 | Date/number internationalization — Timezone handling, currency formatting | P2 | 1d | `@palette/utils` extension |

**Deliverables**:
```tsx
// i18n usage
import { useTranslation } from '@palette/i18n';

function MyPage() {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
}
```

**Weekly Report Highlight**: Platform supports Chinese/English switching; notification system unified

---

#### Week 5 (08/18 – 08/22) — Monitoring / Logging / Error Reporting

**Objective**: Establish frontend observability system

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 5.1 | Frontend error monitoring — `@palette/monitoring` package; global error capture + reporting | P0 | 2d | New package + ErrorBoundary enhancement |
| 5.2 | Performance monitoring — Web Vitals (LCP/FID/CLS) collection | P1 | 1d | `performance.ts` |
| 5.3 | Structured logging — Frontend logging framework with log levels/context/reporting | P1 | 1d | `@palette/utils/logger` |
| 5.4 | BFF monitoring enhancement — Micrometer + Prometheus metrics exposure | P1 | 1d | BFF actuator configuration |

**Deliverables**:
- `@palette/monitoring` package
- Frontend error auto-capture + reporting
- Web Vitals data collection
- BFF Prometheus metrics

**Weekly Report Highlight**: Frontend observability established; production issues traceable

---

#### Week 6 (08/25 – 08/29) — Testing Framework + CI/CD Foundation

**Objective**: Establish automated testing and continuous delivery pipeline

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 6.1 | Frontend unit tests — Vitest + Testing Library covering core packages | P0 | 2d | `__tests__/` across packages |
| 6.2 | BFF test completion — Service/Controller layer test coverage | P0 | 1d | BFF test classes |
| 6.3 | CI Pipeline — GitHub Actions / Jenkins pipeline definition | P0 | 1d | `.github/workflows/` or `Jenkinsfile` |
| 6.4 | Code quality gates — ESLint + Prettier + SonarQube integration | P1 | 1d | Quality check steps in CI |

**Deliverables**:
```yaml
# CI Pipeline Flow
Lint → TypeCheck → Test → Build → Deploy(Staging)
  ↓         ↓        ↓       ↓
ESLint   tsc     Vitest   Docker
         noEmit  +Coverage  Build
```
- Frontend core package test coverage > 60%
- BFF test coverage > 50%
- CI Pipeline operational

**Weekly Report Highlight**: Quality assurance system established; code changes automatically verified

---

### Phase 3: Business Enablement (Week 7–9)
**Objective**: First business team successfully onboarded; platform value validated

---

#### Week 7 (09/01 – 09/05) — Scaffolding + Developer Experience

**Objective**: Improve developer toolchain and documentation

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 7.1 | Scaffolding enhancement — Support feature module selection (i18n/monitoring/permissions) | P0 | 2d | `palette-create` upgrade |
| 7.2 | Developer documentation portal — Built with VitePress/Docusaurus | P0 | 2d | `docs/` site |
| 7.3 | Auto-generated API docs — BFF OpenAPI → frontend type generation | P1 | 1d | openapi-typescript integration |
| 7.4 | Best practice templates — CRUD page templates: list/detail/form | P1 | 1d | `templates/` directory |

**Deliverables**:
- Scaffolding CLI supports module selection
- Developer documentation site live
- API type auto-generation
- 3+ page templates (List/Detail/Form)

**Weekly Report Highlight**: Developer experience refined; new teams can self-service onboarding

---

#### Week 8 (09/08 – 09/12) — First Business Application Onboarding (Clearing/Settlement)

**Objective**: Real business team builds application using Palette

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 8.1 | Clearing App backend — Create settlement service via scaffolding | P0 | 2d | `palette-clearing-service/` |
| 8.2 | Clearing App frontend — Settlement business page development | P0 | 2d | `apps/palette-clearing/` |
| 8.3 | BFF route registration — Settlement service gateway configuration | P0 | 0.5d | `application-dev.yml` |
| 8.4 | Integration testing — End-to-end functionality verification | P0 | 1d | Test report |
| 8.5 | Issue collection — Document pain points during onboarding | P1 | 0.5d | Feedback list |

**Deliverables**:
- Clearing application operational
- Onboarding process documented
- Issue list + improvement plan

**Weekly Report Highlight**: First business application successfully onboarded; platform delivery capability validated

---

#### Week 9 (09/15 – 09/19) — Platform Optimization + Performance Tuning

**Objective**: Optimize platform based on business onboarding feedback

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 9.1 | Frontend bundle optimization — Code splitting, Tree Shaking, lazy loading | P0 | 2d | Build configuration optimization |
| 9.2 | BFF performance tuning — Connection pooling/caching/response compression | P1 | 1d | BFF configuration optimization |
| 9.3 | Platform API fixes — Bug fixes based on onboarding feedback | P0 | 2d | Bug fixes |
| 9.4 | Component library refinement — Add components based on feedback | P1 | 1d | New/improved components |

**Deliverables**:
- Frontend first contentful load < 2s
- BFF P99 latency < 200ms
- All onboarding issues resolved

**Weekly Report Highlight**: Platform performance and stability optimized; business team satisfaction improved

---

### Phase 4: Enterprise Capability (Week 10–12)
**Objective**: Build advanced enterprise capabilities; support multi-team scale onboarding

---

#### Week 10 (09/22 – 09/26) — Micro-Frontend + Module Federation

**Objective**: Support micro-frontend architecture for large applications

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 10.1 | Module Federation configuration — Vite + @module-federation/vite | P0 | 2d | Configuration + example |
| 10.2 | Application registry — Runtime app registration and navigation integration | P0 | 2d | `@palette/core` enhancement |
| 10.3 | Shared dependency management — Avoid duplicate loading of React/MUI etc. | P1 | 1d | Webpack/Vite shared configuration |

**Deliverables**:
```tsx
// Micro-frontend app registration
// host app
import { registerRemoteModule } from '@palette/core';

await registerRemoteModule('clearing', {
  remoteEntry: 'http://cdn/clearing/remoteEntry.js',
  routes: ['/clearing/*'],
  menuItems: [{ label: 'Settlement', path: '/clearing' }],
});
```

**Weekly Report Highlight**: Micro-frontend capability established; supports splitting and independently deploying large applications

---

#### Week 11 (09/29 – 10/03) — Feature Flags + Runtime Configuration

**Objective**: Complete runtime configuration and gradual rollout capabilities

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 11.1 | Feature Flag system — `useFeatureFlag()` Hook + management API | P0 | 2d | `@palette/config` enhancement |
| 11.2 | Gradual rollout support — User/environment/percentage-based feature control | P1 | 2d | Feature Flag backend |
| 11.3 | Runtime config management UI — Configuration view/edit interface | P2 | 1d | Admin page |

**Deliverables**:
```tsx
// Feature Flag usage
const { isEnabled } = useFeatureFlag('NEW_CLEARING_UI');

if (isEnabled('NEW_CLEARING_UI')) {
  return <NewClearingUI />;
}
return <LegacyClearingUI />;
```

**Weekly Report Highlight**: Feature Flag system live; supports gradual rollout

---

#### Week 12 (10/06 – 10/10) — Documentation + Platform Governance

**Objective**: Complete documentation system and governance standards

| # | Task | Priority | Estimate | Deliverable |
|---|------|----------|----------|-------------|
| 12.1 | Developer guide — Onboarding docs, API Reference, FAQ | P0 | 2d | Documentation site completion |
| 12.2 | Migration guide — Steps to migrate existing apps to Palette | P0 | 1d | Migration Guide |
| 12.3 | Platform governance — Versioning strategy/release process/SLA | P1 | 1d | Governance Doc |
| 12.4 | Training materials — Team training PPT + video recordings | P1 | 1d | Training Materials |

**Deliverables**:
- Complete developer documentation site
- Migration guide (Before/After comparison)
- Platform governance specification
- Training material package

**Weekly Report Highlight**: Documentation and governance system complete; ready for organization-wide rollout

---

## 4. Milestone Summary

| Milestone | Target Date | Key Deliverables | Acceptance Criteria |
|-----------|-------------|------------------|---------------------|
| **M1: Core MVP** | Week 3 (08/08) | Permission system + UI component library + Theme system | Complete frontend/backend demo presentable |
| **M2: Platform Ready** | Week 6 (08/29) | i18n + Monitoring + Testing + CI/CD | Ready for single team onboarding |
| **M3: Business Validated** | Week 9 (09/19) | First business app live + Performance optimization | Clearing App production-ready |
| **M4: Enterprise Scale** | Week 12 (10/10) | Micro-frontend + Feature Flags + Documentation | Multi-team scale onboarding |

---

## 5. Risk Assessment

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| R1 | eIDP integration depends on external team coordination | High | Medium | Early communication and scheduling; use Keycloak as mock during development |
| R2 | Insufficient business team adoption willingness | High | Medium | Demonstrate value through Demo + training; select highly cooperative teams first |
| R3 | Micro-frontend technical risk | Medium | Medium | PoC validation first; fallback: iframe isolation |
| R4 | Inconsistent code standards across teams | Medium | High | Enforce CI lint + code review process |
| R5 | Performance targets not met | Medium | Low | Introduce performance monitoring early; regular performance regression tests |
| R6 | Redis/PostgreSQL infrastructure not ready | High | Low | Dev mode does not depend on external services (InMemory/H2) |

---

## 6. Team & Resources

| Role | Headcount | Responsibilities |
|------|-----------|------------------|
| Platform Architect (Tech Lead) | 1 | Architecture design, technical decisions, code review |
| Frontend Engineer | 2 | Platform package development, UI components, toolchain |
| Backend Engineer | 1 | BFF development, security integration, gateway |
| QA Engineer | 1 | Test strategy, automated testing, quality gates |
| (Part-time) Business Team Representative | 1 | Requirements feedback, onboarding validation |

---

## 7. Weekly Report Template

Use the following structure for weekly status reporting:

```markdown
## Palette Platform Weekly Report — Week X (MM/DD – MM/DD)

### Completed This Week
- [Task 1]: Output/Result
- [Task 2]: Output/Result

### Key Metrics
| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| BFF Test Coverage | >50% | X% | ↑ |
| Frontend Core Package Coverage | >60% | X% | ↑ |
| Platform Packages | 12 | X | - |
| Onboarded Business Apps | 1 | X | - |

### Risks & Blockers
- [Risk description] → [Mitigation]

### Next Week Plan
- [Plan 1]
- [Plan 2]

### Demo / Screenshots
(If demonstrable features, attach screenshots or video links)
```

---

## 8. Success Metrics

| Metric | Baseline (Current) | M1 Target | M4 Target |
|--------|--------------------|-----------|-----------|
| New app setup time | 6+ weeks | 2 weeks | 3 days |
| Code reuse rate | 0% | 40% | 70%+ |
| BFF API test coverage | 20% | 50% | 80% |
| Frontend core package test coverage | 0% | 30% | 70% |
| Onboarded business applications | 0 (Demo only) | 0 | 2+ |
| Platform packages | 9 | 11 | 13+ |
| Developer satisfaction | N/A | - | >80% |

---

## 9. Appendix

### A. Target Project Structure

```
palette-platform/
├── palette-bff/                          # BFF Gateway (Spring Boot 3)
│   ├── src/main/java/.../bff/
│   │   ├── auth/                         # OIDC Authentication
│   │   ├── security/                     # Spring Security
│   │   ├── session/                      # Session Management
│   │   ├── gateway/                      # API Gateway
│   │   ├── permission/                   # ★ Permission Aggregation
│   │   ├── context/                      # User Context
│   │   ├── config/                       # Runtime Configuration
│   │   ├── audit/                        # Audit Framework
│   │   ├── tracing/                      # Request Tracing
│   │   ├── exception/                    # Exception Handling
│   │   └── system/                       # System APIs
│   └── docker-compose.yml
│
├── palette-frontend/                     # Frontend Monorepo
│   ├── apps/
│   │   ├── palette-portal/               # Platform Main App
│   │   ├── palette-demo/                 # Demo Application
│   │   ├── palette-clearing/             # ★ Clearing App (first business)
│   │   └── palette-storybook/            # ★ Component Documentation
│   ├── packages/
│   │   ├── platform-core/                # @palette/core — Provider hierarchy
│   │   ├── platform-auth/                # @palette/auth — Auth + Permissions
│   │   ├── platform-api/                 # @palette/api — API Client + TanStack Query
│   │   ├── platform-layout/              # @palette/layout — Layout components
│   │   ├── platform-router/              # @palette/router — Router framework
│   │   ├── platform-ui/                  # @palette/ui — Component library
│   │   ├── platform-config/              # @palette/config — Configuration
│   │   ├── platform-context/             # @palette/context — User context
│   │   ├── platform-utils/               # @palette/utils — Utilities
│   │   ├── platform-theme/               # ★ @palette/theme — Theme system
│   │   ├── platform-i18n/                # ★ @palette/i18n — Internationalization
│   │   └── platform-monitoring/          # ★ @palette/monitoring — Monitoring
│   └── docs/                             # ★ Developer Documentation
│
├── palette-create/                       # Scaffolding CLI
├── palette-demo-service/                 # Demo Backend
└── docs/                                 # Project Documentation
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT_PLAN.md               # This document
    └── developer-guide/                  # Developer Guide
```

### B. Architecture Decision Records (ADR)

| ADR# | Decision | Rationale |
|------|----------|-----------|
| ADR-001 | TanStack Query v5 for data fetching | Enterprise-grade caching, automatic retry, DevTools, type safety |
| ADR-002 | pnpm workspace for Monorepo | Efficient dependency resolution, strict package isolation |
| ADR-003 | Spring Boot 3 + Java 21 | LTS version, Virtual Threads, GraalVM support |
| ADR-004 | BFF Session Cookie approach | Frontend never holds tokens; improved security posture |
| ADR-005 | MUI + Tailwind CSS hybrid | MUI provides enterprise components; Tailwind provides flexible styling |
| ADR-006 | H2 dev mode + PostgreSQL production | Lowers development barrier; production reliability |

---

*Document maintained by the Palette Platform Team.*
