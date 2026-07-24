# 平台包参考

> `@palette/*` 共 9 个平台包，覆盖认证、API、布局、路由、配置等全部企业级能力。

---

## @palette/core

**职责**: Provider 体系、生命周期管理、事件总线、插件系统

```tsx
import { PaletteProvider, usePlatform, usePlatformEvents, ErrorBoundary } from '@palette/core';
```

| API | 类型 | 说明 |
|-----|------|------|
| `PaletteProvider` | Component | 根 Provider，统一嵌套 Auth/Config/Context/Query |
| `usePlatform()` | Hook | 获取平台状态 (phase, health, version) |
| `usePlatformEvents()` | Hook | 订阅平台事件 |
| `usePlatformDiagnostics()` | Hook | 获取启动性能、健康诊断 |
| `usePlatformLifecycle()` | Hook | 生命周期回调 (onReady, onError) |
| `usePlatformHealth()` | Hook | 各服务健康状态 |
| `usePlatformVersion()` | Hook | 版本检测与更新提示 |
| `ErrorBoundary` | Component | 全局错误边界 (自动重试 + 降级 UI) |
| `platformEvents` | Object | 事件总线 (emit/on/off) |

**便捷重导出**: `useAuth`, `useConfig`, `usePaletteContext`, `buildRoutes`, `buildMenuRoutes` 等。

---

## @palette/auth

**职责**: OIDC 认证、权限控制、会话管理

```tsx
import { useAuth, usePermission, RequirePermission, RequireRole } from '@palette/auth';
```

### Hooks

| API | 说明 |
|-----|------|
| `useAuth()` | 认证状态: `authenticated`, `user`, `loading`, `login()`, `logout()` |
| `usePermission()` | 权限检查: `hasPermission()`, `hasAllPermissions()`, `permissions`, `roles` |
| `useUser()` | 当前用户快捷访问 |
| `useIsAuthenticated()` | 布尔值: 是否已登录 |
| `useSessionExpiry()` | 会话到期倒计时: `remainingSeconds`, `isExpiring` |
| `useIdleDetection()` | 用户空闲检测: `isIdle`, `resetIdle()` |
| `useAuthState()` | 模式匹配: 根据认证状态渲染不同 UI |

### 组件

| API | 说明 |
|-----|------|
| `<RequirePermission permission="TRADE_VIEW">` | 权限守卫 (支持 AND/OR/exact) |
| `<RequireRole role="ADMIN">` | 角色守卫 |
| `<RequireAuth>` | 认证守卫 (未登录自动跳转) |

### 权限工具函数

```tsx
import { hasPermission, hasAllPermissions, filterByPermission } from '@palette/auth';

hasPermission(userPerms, 'TRADE_VIEW');        // 单个权限
hasAllPermissions(userPerms, ['A', 'B']);      // AND
filterByPermission(items, userPerms);          // 过滤列表
```

### 权限命名规范

```
{DOMAIN}_{ACTION}

示例:
  TRADE_VIEW, TRADE_CREATE, TRADE_APPROVE
  CLEARING_ADMIN
  AUDIT_VIEW
```

通配符支持: `TRADE_*` 匹配所有 TRADE_ 开头的权限，`*` 匹配所有 (超级管理员)。

---

## @palette/api

**职责**: HTTP 客户端、TanStack Query v5 集成、业务 hooks 模式

```tsx
import { paletteApi, usePlatformQuery, usePaginatedQuery, paletteKeys } from '@palette/api';
```

### HTTP 客户端

```tsx
// GET 请求
const res = await paletteApi.get('/backend/demo/tasks');
const data = res.data.data;

// POST 请求
await paletteApi.post('/backend/demo/tasks', { title: 'New Task' });
```

### TanStack Query Hooks

| API | 说明 |
|-----|------|
| `usePlatformQuery({ queryKey, queryFn })` | 带平台默认配置的 useQuery |
| `usePlatformMutation({ mutationFn })` | 带平台默认配置的 useMutation |
| `useSession()` | 查询会话状态 |
| `useUserContext()` | 查询用户上下文 |
| `useEidpUserInfo()` | 查询 eIDP 用户信息 |
| `useRuntimeConfig()` | 查询运行时配置 |

### Query Key 工厂

```tsx
import { paletteKeys } from '@palette/api';

paletteKeys.session.current()     // ['session', 'current']
paletteKeys.context.current()     // ['context', 'current']
paletteKeys.config.current()      // ['config', 'current']

// 创建业务域 key
import { createDomainKeys } from '@palette/api';
const tradeKeys = createDomainKeys('trades');
tradeKeys.list()                  // ['trades', 'list']
tradeKeys.detail(id)              // ['trades', 'detail', id]
```

### 业务 Hooks 模式

| API | 说明 |
|-----|------|
| `usePaginatedQuery()` | 分页查询 (page/pageSize/nextPage) |
| `usePolling()` | 轮询 (interval/enabled) |
| `useDebouncedQuery()` | 防抖搜索 (delay) |
| `useOptimisticMutation()` | 乐观更新 |
| `useMutationWithInvalidate()` | 自动缓存失效 |
| `useQueryWithStatus()` | 增强状态检测 (idle/loading/success/error) |

---

## @palette/layout

**职责**: 企业级布局组件

```tsx
import { AppShell, Header, Sidebar, PageContainer } from '@palette/layout';
```

| 组件 | 说明 |
|------|------|
| `AppShell` | 主布局: Header + Sidebar + Content (接受 `menuItems` prop) |
| `Header` | 顶部导航栏 (用户信息、环境标识) |
| `Sidebar` | 侧边栏 (渲染 `ResolvedMenuItem[]` 动态菜单) |
| `PageContainer` | 页面容器 (标题、面包屑、操作区) |

---

## @palette/router

**职责**: 路由框架、动态菜单、权限路由

```tsx
import { buildMenuRoutes, useMenuRoutes, PermissionRoute, type MenuRouteConfig } from '@palette/router';
```

| API | 说明 |
|-----|------|
| `buildRoutes(configs)` | 基础路由构建 (向后兼容) |
| `buildMenuRoutes(configs)` | 企业路由构建 (含权限守卫) |
| `useMenuRoutes(routes)` | 动态菜单 Hook (权限过滤 + active 解析) |
| `PermissionRoute` | 权限路由守卫组件 |
| `ErrorBoundary` | 路由级错误边界 |

### MenuRouteConfig 完整字段

```tsx
interface MenuRouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType>;
  children?: MenuRouteConfig[];
  protected?: boolean;           // 默认 true
  menu?: {
    title: string;               // 菜单标题
    icon?: { emoji?: string };   // 图标
    order?: number;              // 排序 (默认 100)
    hidden?: boolean;            // 隐藏但可访问
    badge?: string;              // 徽标文字
    collapsible?: boolean;       // 可折叠分组
  };
  permission?: {
    permissions: string | string[];
    mode?: 'all' | 'any' | 'exact';
    roles?: string | string[];
  };
  featureFlag?: string;          // Feature Flag 控制
}
```

---

## @palette/config

**职责**: 运行时配置、Feature Flag、环境检测

```tsx
import { useConfig, useFeatureFlag, useEnvironment } from '@palette/config';
```

| API | 说明 |
|-----|------|
| `useConfig()` | 运行时配置: `environment`, `config`, `isEnabled()` |
| `useFeatureFlag(key)` | 单个 Flag: `isEnabled`, `variant` |
| `useEnvironment()` | 环境信息: `name`, `isProduction`, `color` |

---

## @palette/context

**职责**: 用户上下文、多租户管理

```tsx
import { usePaletteContext, useTenantContext, useTenant } from '@palette/context';
```

| API | 说明 |
|-----|------|
| `usePaletteContext()` | 完整上下文: `user`, `environment`, `locale`, `timezone`, `currentTenant` |
| `useTenantContext()` | 租户上下文: `currentTenant`, `availableTenants`, `switchTenant()` |
| `useTenant(config?)` | 独立租户 Hook (解析策略、切换、事件) |

### 多租户启用

```tsx
<ContextProvider multiTenant tenantConfig={{ strategy: 'session' }}>
  <App />
</ContextProvider>
```

---

## @palette/utils

**职责**: 工具函数

```tsx
import { formatDate, formatCurrency, generateId } from '@palette/utils';
```

---

## @palette/ui

**职责**: 基础 UI 组件

```tsx
import { PaletteButton, PaletteLoading, PaletteError, EmptyState } from '@palette/ui';
```

| 组件 | 说明 |
|------|------|
| `PaletteButton` | 按钮 (primary/secondary/danger, loading 状态) |
| `PaletteLoading` | 加载指示器 (spinner + 文字) |
| `PaletteError` | 错误展示 (分类图标 + 重试) |
| `EmptyState` | 空状态 (图标 + 描述 + 操作) |
