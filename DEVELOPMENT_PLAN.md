# Palette Enterprise UI Platform — Development Plan

> **Document Version**: 1.0  
> **Last Updated**: 2025-07-21  
> **Status**: In Progress  
> **Target**: Production-Ready Enterprise Platform

---

## 1. Executive Summary

Palette 是企业级前端平台，为证券后清算业务团队提供标准化的 UI 公共框架和 BFF 中间层。通过平台化建设，消除各业务团队重复搭建基础设施的成本，统一企业级技术标准，将新应用交付周期从 **6+ 周缩短至数天**。

### 1.1 项目目标

| 维度 | 目标 |
|------|------|
| **效率** | 新业务应用交付周期从 6 周缩短至 3-5 天 |
| **质量** | 统一安全标准、错误处理、用户体验 |
| **成本** | 消除跨团队重复开发，预计节省 40%+ 前端基础设施投入 |
| **治理** | 建立平台化应用管理体系，支持应用注册/监控/审计 |

### 1.2 技术选型

| 层级 | 技术栈 |
|------|--------|
| 前端框架 | React 18 + TypeScript 5 (strict mode) |
| 构建工具 | Vite 5 |
| 包管理 | pnpm workspace (Monorepo) |
| 数据获取 | TanStack Query v5 + Axios |
| UI 组件 | MUI 5 + Tailwind CSS |
| 状态管理 | Redux Toolkit |
| 表单 | React Hook Form + Zod |
| 测试 | Vitest + Testing Library + Storybook |
| 后端框架 | Spring Boot 3.3.5 + Java 21 |
| 安全 | Spring Security 6 + OAuth2 Client |
| 会话 | Spring Session + Redis |
| 数据库 | PostgreSQL 16 |
| 文档 | OpenAPI 3 + SpringDoc |
| 容器化 | Docker + Kubernetes-ready |

---

## 2. Current Status Assessment (截至 2025-07-21)

### 2.1 完成度总览

| 模块 | 完成度 | 状态 |
|------|--------|------|
| **BFF 基础层** | 100% | 🟢 完整实现：权限系统 + 动态路由 + 速率限制 + 核心网关 |
| **前端 Monorepo 基础** | 90% | 🟢 结构完整，pnpm workspace 运行中 |
| **@palette/core** | 90% | 🟢 企业级：生命周期管理 + 插件系统 + 事件总线 + 版本/健康监控 |
| **@palette/auth** | 85% | 🟢 企业级权限控制：AuthProvider, usePermission, RequirePermission, useSessionExpiry |
| **@palette/api** | 95% | 🟢 企业级：TanStack Query v5 + 核心 hooks + 业务模式 (分页/轮询/乐观更新/防抖搜索) |
| **@palette/layout** | 55% | 🟡 AppShell/Header/Sidebar 基础完成，缺少响应式 |
| **@palette/router** | 100% | 🟢 企业级：动态菜单 + 权限路由守卫 + Feature Flag 过滤 + 模块注册 |
| **@palette/ui** | 30% | 🟡 基础组件 (Button/Loading/Error)，缺少组件库体系 |
| **@palette/config** | 90% | 🟢 企业级：ConfigProvider + Feature Flag 系统 + 环境检测 |
| **@palette/context** | 100% | 🟢 企业级多租户：租户解析/切换 + 多策略支持 + 租户事件总线 |
| **@palette/utils** | 50% | 🟡 基础工具函数 |
| **Demo 应用** | 85% | 🟢 前后端 Demo 完整实现，后端编译通过 |
| **脚手架工具** | 80% | 🟢 CLI 工具完成，测试通过 |
| **CI/CD** | 0% | 🔴 未开始 |
| **文档体系** | 40% | 🟡 BFF README + 架构文档，缺少开发者文档 |
| **测试覆盖** | 10% | 🔴 BFF 有基础测试，前端无测试 |

### 2.2 已完成的核心能力

**BFF (Spring Boot 3)**:
- ✅ OIDC 认证集成 (eIDP)
- ✅ 安全会话管理 (Redis/InMemory 双模式)
- ✅ API 网关代理 (Token Relay)
- ✅ 用户上下文 API
- ✅ 多租户上下文 API (租户列表/租户切换)
- ✅ 运行时配置分发
- ✅ 全链路请求追踪
- ✅ 审计框架
- ✅ 全局异常处理
- ✅ Health/Info 系统 API
- ✅ 文件上传/下载
- ✅ Docker 部署支持
- ✅ 权限聚合模块 (eIDP claims 提取)
- ✅ 动态路由管理 (优先级合并 + 运行时配置)
- ✅ 速率限制过滤器 (滑动窗口算法)
- ✅ 基础单元测试 (4 个测试类)

**前端平台**:
- ✅ Monorepo 结构 (pnpm workspace)
- ✅ 9 个平台包 (@palette/*)
- ✅ PaletteProvider 嵌套体系
- ✅ 平台生命周期管理 (阶段追踪 + 启动性能测量)
- ✅ 平台事件总线 (跨模块通信)
- ✅ 插件系统 (可扩展架构)
- ✅ 增强型错误边界 (自动重试 + 降级 UI)
- ✅ 版本检测与更新提示
- ✅ 平台健康监控 Hook
- ✅ Axios 客户端 + 拦截器
- ✅ TanStack Query v5 企业级集成
- ✅ Query Key 工厂系统
- ✅ 平台级预构建 Hooks (useSession, useUserContext, useEidpUserInfo, useRuntimeConfig)
- ✅ 业务 hooks 模式 (usePaginatedQuery, usePolling, useDebouncedQuery)
- ✅ 乐观更新模式 (useOptimisticMutation)
- ✅ 自动缓存失效 Mutation (useMutationWithInvalidate)
- ✅ 增强状态检测 (useQueryWithStatus)
- ✅ 错误分类体系 (PlatformError)
- ✅ 基础布局组件 (AppShell/Header/Sidebar)
- ✅ 基础 UI 组件 (Button/Loading/Error/EmptyState)
- ✅ 声明式路由注册
- ✅ 完整 Demo 应用 (任务管理)
- ✅ 脚手架 CLI 工具
- ✅ @palette/auth 企业级增强 (权限Hook, RequirePermission, useSessionExpiry)
- ✅ @palette/config 企业级增强 (Feature Flag, 环境检测)
- ✅ @palette/api TanStack Query v5 + 脚手架 CLI 集成
- ✅ @palette/router 企业级增强 (动态菜单, 权限路由守卫, buildMenuRoutes)
- ✅ @palette/context 多租户支持 (租户解析/切换, 多策略, 租户事件总线)

---

## 3. Development Roadmap — Week by Week

### Phase 1: Foundation Hardening (Week 1-3)
**目标**: 补齐核心框架的缺失功能，达到可演示的 MVP 状态

---

#### Week 1 (07/21 - 07/25) — BFF 安全与网关增强

**目标**: 完善 BFF 安全体系和网关能力

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 1.1 | 权限聚合模块 — 实现 `PermissionService`，从 eIDP token claims 提取权限，提供 `GET /palette/api/v1/auth/permissions` 端点 | P0 | 2d | `permission/PermissionService.java`, `PermissionController.java` |
| 1.2 | 网关路由动态配置 — 从数据库/配置中心加载路由规则，替代硬编码 YAML | P0 | 2d | `gateway/GatewayRouteRepository.java`, `DynamicRouteService.java` |
| 1.3 | 速率限制过滤器 — 基于 Redis 的滑动窗口限流 | P1 | 1d | `gateway/RateLimitFilter.java` |
| 1.4 | BFF 集成测试 — 补充网关代理、Session 管理的集成测试 | P1 | 1d | `test/` 下集成测试类 |

**交付物**:
- 权限 API 可用
- 网关路由支持动态加载
- 限流保护
- 测试覆盖率提升至 40%

**周报要点**: BFF 安全体系补全，网关能力从"可用"提升到"生产就绪"

---

#### Week 2 (07/28 - 08/01) — 前端权限与路由增强

**目标**: 前端权限控制体系和动态路由

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 2.1 | `@palette/auth` 权限 Hook — `usePermission()`, `<RequirePermission>` 组件 | P0 | 2d | `hooks.ts`, `RequirePermission.tsx` |
| 2.2 | 权限路由守卫 — 基于权限动态过滤菜单和路由 | P0 | 2d | `platform-router` 增强 |
| 2.3 | `@palette/context` 多环境切换 — 支持 UAT/Staging/Production 环境上下文 | P1 | 1d | `ContextProvider.tsx` 增强 |
| 2.4 | 前端权限 Demo — 在 Demo 应用中展示权限控制 | P1 | 1d | Demo 页面更新 |

**交付物**:
```tsx
// 权限控制示例
<RequirePermission permission="CLEARING_VIEW">
  <ClearingPage />
</RequirePermission>

// 权限 Hook
const { hasPermission } = usePermission();
if (hasPermission('TRADE_CREATE')) { ... }
```

**周报要点**: 前端权限体系建立，支持声明式权限控制和动态菜单

---

#### Week 3 (08/04 - 08/08) — UI 组件库基础 + 主题系统

**目标**: 建立企业级 UI 组件库框架和主题系统

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 3.1 | 主题系统 — Design Token 体系、Light/Dark Mode、MUI 主题定制 | P0 | 2d | `@palette/theme` 包 |
| 3.2 | 核心组件 — Form/Input/Select/Modal/Dialog/Table/Card | P0 | 2d | `@palette/ui` 组件扩展 |
| 3.3 | 表单集成 — React Hook Form + Zod 校验 + 错误展示 | P1 | 1d | `@palette/ui` Form 组件 |
| 3.4 | Storybook 配置 — 组件文档化 + 交互式预览 | P1 | 1d | `.storybook/` 配置 + Stories |

**交付物**:
- `@palette/theme` 包 (Design Tokens + Light/Dark)
- 10+ 核心 UI 组件
- Storybook 可访问 `http://localhost:6006`
- 表单方案标准化

**周报要点**: UI 组件库框架建立，业务团队可通过 Storybook 浏览和使用组件

---

### Phase 2: Platform Maturity (Week 4-6)
**目标**: 补齐企业级平台能力，达到单业务团队接入条件

---

#### Week 4 (08/11 - 08/15) — 国际化 + 通知系统

**目标**: 多语言支持和全局通知能力

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 4.1 | 国际化框架 — `@palette/i18n` 包，基于 react-i18next | P0 | 2d | 新包 + Provider |
| 4.2 | 中文/英文语言包 — 平台级翻译 + 业务扩展机制 | P0 | 1d | `locales/zh-CN.json`, `locales/en-US.json` |
| 4.3 | 全局通知系统 — Toast/Notification/Snackbar 统一管理 | P1 | 1d | `@palette/ui` Notification 组件 |
| 4.4 | 日期/数字国际化 — 时区处理、货币格式化 | P2 | 1d | `@palette/utils` 扩展 |

**交付物**:
```tsx
// 国际化使用
import { useTranslation } from '@palette/i18n';

function MyPage() {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
}
```

**周报要点**: 平台支持中英文切换，通知系统统一

---

#### Week 5 (08/18 - 08/22) — 监控/日志/错误上报

**目标**: 建立前端可观测性体系

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 5.1 | 前端错误监控 — `@palette/monitoring` 包，全局错误捕获 + 上报 | P0 | 2d | 新包 + ErrorBoundary 增强 |
| 5.2 | 性能监控 — Web Vitals (LCP/FID/CLS) 采集 | P1 | 1d | `performance.ts` |
| 5.3 | 结构化日志 — 前端日志框架，支持日志级别/上下文/上报 | P1 | 1d | `@palette/utils/logger` |
| 5.4 | BFF 监控增强 — Micrometer + Prometheus metrics 暴露 | P1 | 1d | BFF actuator 配置 |

**交付物**:
- `@palette/monitoring` 包
- 前端错误自动捕获 + 上报
- Web Vitals 数据采集
- BFF Prometheus metrics

**周报要点**: 前端可观测性建立，生产环境问题可追踪

---

#### Week 6 (08/25 - 08/29) — 测试体系 + CI/CD 基础

**目标**: 建立自动化测试和持续交付流水线

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 6.1 | 前端单元测试 — Vitest + Testing Library 覆盖核心包 | P0 | 2d | `__tests__/` 各包测试 |
| 6.2 | BFF 测试补全 — Service/Controller 层测试覆盖 | P0 | 1d | BFF 测试类 |
| 6.3 | CI Pipeline — GitHub Actions / Jenkins pipeline 定义 | P0 | 1d | `.github/workflows/` 或 `Jenkinsfile` |
| 6.4 | 代码质量门禁 — ESLint + Prettier + SonarQube 集成 | P1 | 1d | CI 中的质量检查步骤 |

**交付物**:
```yaml
# CI Pipeline 流程
Lint → TypeCheck → Test → Build → Deploy(Staging)
  ↓         ↓        ↓       ↓
ESLint   tsc     Vitest   Docker
         noEmit  +Coverage  Build
```
- 前端核心包测试覆盖率 > 60%
- BFF 测试覆盖率 > 50%
- CI Pipeline 可运行

**周报要点**: 质量保障体系建立，代码变更可自动验证

---

### Phase 3: Business Enablement (Week 7-9)
**目标**: 首个业务团队成功接入，验证平台价值

---

#### Week 7 (09/01 - 09/05) — 脚手架 + 开发者体验

**目标**: 完善开发者工具链和文档

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 7.1 | 脚手架增强 — 支持选择功能模块 (i18n/monitoring/权限) | P0 | 2d | `palette-create` 升级 |
| 7.2 | 开发者文档门户 — 使用 VitePress/Docusaurus 搭建 | P0 | 2d | `docs/` 站点 |
| 7.3 | API 文档自动生成 — BFF OpenAPI → 前端类型生成 | P1 | 1d | openapi-typescript 集成 |
| 7.4 | 最佳实践模板 — CRUD 页面模板、列表/详情/表单模板 | P1 | 1d | `templates/` 目录 |

**交付物**:
- 脚手架 CLI 支持模块选择
- 开发者文档站点上线
- API 类型自动生成
- 3+ 页面模板 (List/Detail/Form)

**周报要点**: 开发者体验完善，新团队可自助接入

---

#### Week 8 (09/08 - 09/12) — 首个业务应用接入 (Clearing/结算)

**目标**: 实际业务团队使用 Palette 构建应用

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 8.1 | Clearing App 后端 — 基于脚手架创建结算服务 | P0 | 2d | `palette-clearing-service/` |
| 8.2 | Clearing App 前端 — 结算业务页面开发 | P0 | 2d | `apps/palette-clearing/` |
| 8.3 | BFF 路由注册 — 结算服务网关配置 | P0 | 0.5d | `application-dev.yml` |
| 8.4 | 联调测试 — 端到端功能验证 | P0 | 1d | 测试报告 |
| 8.5 | 问题收集 — 记录接入过程中的痛点 | P1 | 0.5d | 反馈清单 |

**交付物**:
- 结算应用可运行
- 接入过程文档化
- 问题清单 + 改进计划

**周报要点**: 首个业务应用成功接入，验证平台交付能力

---

#### Week 9 (09/15 - 09/19) — 平台优化 + 性能调优

**目标**: 基于业务接入反馈优化平台

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 9.1 | 前端 Bundle 优化 — 代码分割、Tree Shaking、懒加载 | P0 | 2d | 构建配置优化 |
| 9.2 | BFF 性能调优 — 连接池/缓存/响应压缩 | P1 | 1d | BFF 配置优化 |
| 9.3 | 平台 API 修复 — 基于接入反馈的 Bug 修复 | P0 | 2d | Bug fixes |
| 9.4 | 组件库完善 — 基于反馈补充组件 | P1 | 1d | 新增/改进组件 |

**交付物**:
- 前端首屏加载 < 2s
- BFF P99 延迟 < 200ms
- 接入问题清零

**周报要点**: 平台性能和稳定性优化，业务团队满意度提升

---

### Phase 4: Enterprise Capability (Week 10-12)
**目标**: 建立企业级高级能力，支持多团队规模化接入

---

#### Week 10 (09/22 - 09/26) — 微前端 + 模块联邦

**目标**: 支持大型应用的微前端架构

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 10.1 | Module Federation 配置 — Vite + @module-federation/vite | P0 | 2d | 配置 + 示例 |
| 10.2 | 应用注册表 — 运行时应用注册和导航集成 | P0 | 2d | `@palette/core` 增强 |
| 10.3 | 共享依赖管理 — 避免重复加载 React/MUI 等 | P1 | 1d | Webpack/Vite 共享配置 |

**交付物**:
```tsx
// 微前端应用注册
// host app
import { registerRemoteModule } from '@palette/core';

await registerRemoteModule('clearing', {
  remoteEntry: 'http://cdn/clearing/remoteEntry.js',
  routes: ['/clearing/*'],
  menuItems: [{ label: 'Settlement', path: '/clearing' }],
});
```

**周报要点**: 微前端能力建立，支持大型应用拆分和独立部署

---

#### Week 11 (09/29 - 10/03) — Feature Flag + 运行时配置

**目标**: 完善运行时配置和灰度发布能力

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 11.1 | Feature Flag 系统 — `useFeatureFlag()` Hook + 管理 API | P0 | 2d | `@palette/config` 增强 |
| 11.2 | 灰度发布支持 — 基于用户/环境/百分比的 Feature 控制 | P1 | 2d | Feature Flag 后端 |
| 11.3 | 运行时配置管理后台 — 配置查看/修改界面 | P2 | 1d | 管理页面 |

**交付物**:
```tsx
// Feature Flag 使用
const { isEnabled } = useFeatureFlag('NEW_CLEARING_UI');

if (isEnabled('NEW_CLEARING_UI')) {
  return <NewClearingUI />;
}
return <LegacyClearingUI />;
```

**周报要点**: Feature Flag 系统上线，支持灰度发布

---

#### Week 12 (10/06 - 10/10) — 文档完善 + 平台治理

**目标**: 完善文档体系和治理规范

| # | 任务 | 优先级 | 预估 | 产出 |
|---|------|--------|------|------|
| 12.1 | 开发者指南 — 接入文档、API Reference、FAQ | P0 | 2d | 文档站点完善 |
| 12.2 | 迁移指南 — 现有应用迁移到 Palette 的步骤 | P0 | 1d | Migration Guide |
| 12.3 | 平台治理规范 — 版本策略/发布流程/SLA | P1 | 1d | Governance Doc |
| 12.4 | 培训材料 — 团队培训 PPT + 录屏 | P1 | 1d | Training Materials |

**交付物**:
- 完整开发者文档站点
- 迁移指南 (Before/After 对比)
- 平台治理规范文档
- 培训材料包

**周报要点**: 文档和治理体系完善，具备推广条件

---

## 4. Milestone Summary

| Milestone | 目标日期 | 关键交付 | 验收标准 |
|-----------|----------|----------|----------|
| **M1: Core MVP** | Week 3 (08/08) | 权限体系 + UI 组件库 + 主题系统 | 完整的前后端 Demo 可演示 |
| **M2: Platform Ready** | Week 6 (08/29) | i18n + 监控 + 测试 + CI/CD | 单团队可接入状态 |
| **M3: Business Validated** | Week 9 (09/19) | 首个业务应用上线 + 性能优化 | Clearing App 生产可用 |
| **M4: Enterprise Scale** | Week 12 (10/10) | 微前端 + Feature Flag + 文档 | 多团队规模化接入 |

---

## 5. Risk Assessment

| # | 风险 | 影响 | 概率 | 缓解措施 |
|---|------|------|------|----------|
| R1 | eIDP 集成依赖外部团队配合 | 高 | 中 | 提前沟通排期；开发阶段使用 Keycloak 模拟 |
| R2 | 业务团队接入意愿不足 | 高 | 中 | 通过 Demo + 培训展示价值；选择配合度高的团队 |
| R3 | 前端微前端方案技术风险 | 中 | 中 | 先 PoC 验证；备选方案: iframe 隔离 |
| R4 | 跨团队代码规范不统一 | 中 | 高 | CI 强制 lint + code review 流程 |
| R5 | 性能目标不达标 | 中 | 低 | 早期引入性能监控；定期性能回归测试 |
| R6 | Redis/PostgreSQL 基础设施未就绪 | 高 | 低 | 开发模式不依赖外部服务 (InMemory/H2) |

---

## 6. Team & Resource

| 角色 | 人数 | 职责 |
|------|------|------|
| 平台架构师 (Tech Lead) | 1 | 架构设计、技术决策、代码审查 |
| 前端开发工程师 | 2 | 平台包开发、UI 组件、工具链 |
| 后端开发工程师 | 1 | BFF 开发、安全集成、网关 |
| QA 工程师 | 1 | 测试策略、自动化测试、质量门禁 |
| (兼职) 业务团队代表 | 1 | 需求反馈、接入验证 |

---

## 7. Weekly Report Template

每周汇报使用以下结构:

```markdown
## Palette 平台周报 — Week X (MM/DD - MM/DD)

### 本周完成
- [任务1]: 产出/结果
- [任务2]: 产出/结果

### 关键指标
| 指标 | 目标 | 当前 | 趋势 |
|------|------|------|------|
| BFF 测试覆盖率 | >50% | X% | ↑ |
| 前端核心包测试覆盖率 | >60% | X% | ↑ |
| 平台包数量 | 12 | X | - |
| 业务接入应用数 | 1 | X | - |

### 风险 & 阻塞
- [风险描述] → [缓解措施]

### 下周计划
- [计划1]
- [计划2]

### Demo / 截图
(如有可演示功能，附截图或录屏链接)
```

---

## 8. Success Metrics

| 指标 | 基线 (当前) | M1 目标 | M4 目标 |
|------|-------------|---------|---------|
| 新应用搭建时间 | 6+ 周 | 2 周 | 3 天 |
| 代码复用率 | 0% | 40% | 70%+ |
| BFF API 测试覆盖 | 20% | 50% | 80% |
| 前端核心包测试覆盖 | 0% | 30% | 70% |
| 业务接入应用数 | 0 (仅 Demo) | 0 | 2+ |
| 平台包数量 | 9 | 11 | 13+ |
| 开发者满意度 | N/A | - | >80% |

---

## 9. Appendix

### A. 项目结构 (目标状态)

```
palette-platform/
├── palette-bff/                          # BFF 网关 (Spring Boot 3)
│   ├── src/main/java/.../bff/
│   │   ├── auth/                         # OIDC 认证
│   │   ├── security/                     # Spring Security
│   │   ├── session/                      # 会话管理
│   │   ├── gateway/                      # API 网关
│   │   ├── permission/                   # ★ 权限聚合
│   │   ├── context/                      # 用户上下文
│   │   ├── config/                       # 运行时配置
│   │   ├── audit/                        # 审计框架
│   │   ├── tracing/                      # 请求追踪
│   │   ├── exception/                    # 异常处理
│   │   └── system/                       # 系统 API
│   └── docker-compose.yml
│
├── palette-frontend/                     # 前端 Monorepo
│   ├── apps/
│   │   ├── palette-portal/               # 平台主应用
│   │   ├── palette-demo/                 # Demo 应用
│   │   ├── palette-clearing/             # ★ 结算应用 (首个业务)
│   │   └── palette-storybook/            # ★ 组件文档站
│   ├── packages/
│   │   ├── platform-core/                # @palette/core — Provider 体系
│   │   ├── platform-auth/                # @palette/auth — 认证 + 权限
│   │   ├── platform-api/                 # @palette/api — API 客户端 + TanStack Query
│   │   ├── platform-layout/              # @palette/layout — 布局组件
│   │   ├── platform-router/              # @palette/router — 路由框架
│   │   ├── platform-ui/                  # @palette/ui — 组件库
│   │   ├── platform-config/              # @palette/config — 配置管理
│   │   ├── platform-context/             # @palette/context — 用户上下文
│   │   ├── platform-utils/               # @palette/utils — 工具函数
│   │   ├── platform-theme/               # ★ @palette/theme — 主题系统
│   │   ├── platform-i18n/                # ★ @palette/i18n — 国际化
│   │   └── platform-monitoring/          # ★ @palette/monitoring — 监控
│   └── docs/                             # ★ 开发者文档站
│
├── palette-create/                       # 脚手架 CLI
├── palette-demo-service/                 # Demo 后端
└── docs/                                 # 项目文档
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT_PLAN.md               # 本文档
    └── developer-guide/                  # 开发者指南
```

### B. 技术决策记录 (ADR)

| ADR# | 决策 | 理由 |
|------|------|------|
| ADR-001 | TanStack Query v5 作为数据获取方案 | 企业级缓存、自动重试、DevTools、类型安全 |
| ADR-002 | pnpm workspace 管理 Monorepo | 高效依赖解析、严格的包隔离 |
| ADR-003 | Spring Boot 3 + Java 21 | LTS 版本、Virtual Threads、GraalVM 支持 |
| ADR-004 | BFF Session Cookie 方案 | 前端不持有 Token，安全性更高 |
| ADR-005 | MUI + Tailwind CSS 混合方案 | MUI 提供企业级组件，Tailwind 提供灵活样式 |
| ADR-006 | H2 开发模式 + PostgreSQL 生产模式 | 降低开发门槛，生产可靠性 |

---

*Document maintained by the Palette Platform Team.*
