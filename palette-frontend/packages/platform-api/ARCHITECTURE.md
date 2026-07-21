# @palette/api — TanStack Query 企业级集成架构

## 概述

`@palette/api` 是 Palette 前端平台的统一 API 层，基于 **Axios + TanStack Query v5** 构建，为企业级业务应用提供类型安全、可组合、开箱即用的数据获取能力。

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    Business Application                  │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ useSession │  │ usePlatform  │  │ usePlatform      │ │
│  │ useUser    │  │ Query        │  │ Mutation         │ │
│  └─────┬─────┘  └──────┬───────┘  └────────┬─────────┘ │
│        │               │                    │           │
│  ┌─────┴───────────────┴────────────────────┴─────────┐ │
│  │              PaletteQueryProvider                   │ │
│  │         (QueryClientProvider + DevTools)            │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                │
│  ┌─────────────────────┴──────────────────────────────┐ │
│  │              @palette/api 核心层                    │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │ │
│  │  │ queryKeys│ │queryClient│ │ hooks/*           │  │ │
│  │  │ (工厂)   │ │ (工厂)    │ │ usePlatformQuery  │  │ │
│  │  │          │ │           │ │ usePlatformMut... │  │ │
│  │  │          │ │           │ │ usePlatformInf... │  │ │
│  │  └──────────┘ └───────────┘ └───────────────────┘  │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                │
│  ┌─────────────────────┴──────────────────────────────┐ │
│  │              基础设施层                              │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │ │
│  │  │ client.ts│ │endpoints  │ │ errors.ts         │  │ │
│  │  │ (Axios)  │ │ (API函数) │ │ (错误分类)         │  │ │
│  │  └──────────┘ └───────────┘ └───────────────────┘  │ │
│  └─────────────────────┬──────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │ BFF API │
                    │ :8080   │
                    └─────────┘
```

## 目录结构

```
platform-api/src/
├── client.ts                        # Axios 实例 + 拦截器
├── endpoints.ts                     # 平台级 API 函数
├── errors.ts                        # 错误分类 (PlatformError)
├── queryClient.ts                   # QueryClient 工厂 + 默认配置
├── queryKeys.ts                     # 类型安全 Query Key 工厂
├── PaletteQueryProvider.tsx         # React Provider + DevTools
├── hooks/
│   ├── index.ts                     # Hooks 统一导出
│   ├── usePlatformQuery.ts          # 通用查询 hook
│   ├── usePlatformMutation.ts       # Mutation hook (自动失效)
│   ├── usePlatformInfiniteQuery.ts  # 分页/无限滚动 hook
│   └── usePlatformEndpoints.ts     # 平台级预构建 hooks
└── index.ts                         # 包入口，统一导出
```

## 核心模块设计

### 1. QueryClient 工厂 (`queryClient.ts`)

预配置企业级默认选项，所有业务应用共享：

| 配置项 | 默认值 | 设计理由 |
|--------|--------|----------|
| `staleTime` | 10s | 平衡数据新鲜度与请求频率 |
| `gcTime` | 5min | 内存占用 vs 缓存命中率 |
| `refetchOnWindowFocus` | false | 企业多 Tab 场景避免意外请求 |
| `refetchOnReconnect` | false | Session 可能已过期，避免无效请求 |
| `retry` | 1次 (智能) | 401/403 不重试，网络错误重试一次 |
| Mutation `retry` | false | 写操作不自动重试，防止重复提交 |

**全局错误回调**:
- `QueryCache.onError`: 自动分类错误，401 时配合拦截器跳转登录
- `MutationCache.onError`: 结构化日志输出

```ts
// 使用默认 client
import { paletteQueryClient } from '@palette/api';

// 或自定义覆盖
import { createPaletteQueryClient } from '@palette/api';
const myClient = createPaletteQueryClient({
  queries: { staleTime: 30_000 },
});
```

### 2. Query Key 工厂 (`queryKeys.ts`)

分层、类型安全的 Query Key 系统，防止 key 冲突，使缓存失效可预测。

**平台级 Keys**:

```
paletteKeys.all              → ['palette']
paletteKeys.session.current() → ['palette', 'session', 'current']
paletteKeys.user.context()    → ['palette', 'user', 'context']
paletteKeys.config.runtime()  → ['palette', 'config', 'runtime']
paletteKeys.system.info()     → ['palette', 'system', 'info']
```

**业务域 Keys** (通过 `createDomainKeys`):

```ts
const orderKeys = createDomainKeys('orders');

orderKeys.all                    → ['palette', 'domain', 'orders']
orderKeys.lists()                → ['palette', 'domain', 'orders', 'list']
orderKeys.list({ status: 'OPEN'}) → ['palette', 'domain', 'orders', 'list', { status: 'OPEN' }]
orderKeys.detail('abc-123')      → ['palette', 'domain', 'orders', 'detail', 'abc-123']
orderKeys.infinite({ page: 0 })  → ['palette', 'domain', 'orders', 'infinite', { page: 0 }]
orderKeys.custom('stats', '2024') → ['palette', 'domain', 'orders', 'stats', '2024']
```

**缓存失效模式**:

```ts
// 失效所有 orders
queryClient.invalidateQueries({ queryKey: orderKeys.all });

// 仅失效列表
queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

// 仅失效特定筛选
queryClient.invalidateQueries({ queryKey: orderKeys.list({ status: 'OPEN' }) });
```

### 3. 核心 Hooks

#### `usePlatformQuery<TData>`

封装 `useQuery`，自动错误分类 + 强制使用 Query Key 工厂。

```tsx
const { data, isLoading, error } = usePlatformQuery<Order[]>({
  queryKey: orderKeys.list({ status: 'OPEN' }),
  queryFn: () => fetchOrders({ status: 'OPEN' }),
  enabled: !!user,
  staleTime: 60_000,
});

// error 类型为 PlatformError，包含 code/title/message/recoverable
if (error) {
  console.log(error.code);    // 'SESSION_EXPIRED' | 'FORBIDDEN' | ...
  console.log(error.recoverable); // true | false
}
```

#### `usePlatformMutation<TData, TVariables>`

封装 `useMutation`，支持自动缓存失效。

```tsx
const mutation = usePlatformMutation({
  mutationFn: (input: CreateOrderInput) => createOrder(input),
  invalidateOnSuccess: [orderKeys.lists()],  // 成功后自动失效列表缓存
  invalidateOnError: [orderKeys.all],        // 失败后失效全量缓存
  onSuccess: (data) => {
    toast.success(`Order ${data.id} created`);
  },
});
```

#### `usePlatformInfiniteQuery<TData>`

分页/无限滚动，内置 `PaginatedResponse<T>` 支持。

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  usePlatformInfiniteQuery<PaginatedResponse<Order>>({
    queryKey: orderKeys.infinite({ status: 'OPEN' }),
    queryFn: ({ pageParam }) => fetchOrders({ page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
  });
```

**标准分页响应格式**:

```ts
interface PaginatedResponse<T> {
  content: T[];           // 当前页数据
  page: number;           // 当前页码 (0-based)
  size: number;           // 每页条数
  totalElements: number;  // 总记录数
  totalPages: number;     // 总页数
  hasNext: boolean;       // 是否有下一页
}
```

### 4. 平台级预构建 Hooks

开箱即用的平台数据获取 hooks：

| Hook | 数据源 | staleTime | 用途 |
|------|--------|-----------|------|
| `useSession()` | `GET /auth/session` | 30s | 登录状态检查 |
| `useUserContext()` | `GET /context` | 60s | 用户信息 + 环境 |
| `useEidpUserInfo()` | `GET /auth/me` | 60s | eIDP 身份详情 |
| `useRuntimeConfig()` | `GET /config` | 5min | 运行时配置/Feature Flags |
| `useSystemInfo()` | `GET /system/info` | 10min | 版本/构建信息 |

```tsx
// 业务组件直接使用
function Header() {
  const { data: user } = useUserContext();
  const { data: config } = useRuntimeConfig();

  return (
    <header>
      <span>{user?.user.displayName}</span>
      {config?.features['new-feature'] && <NewFeatureBadge />}
    </header>
  );
}
```

### 5. PaletteQueryProvider

应用入口集成，一行代码接入 TanStack Query。

```tsx
import { PaletteQueryProvider } from '@palette/api';

function App() {
  return (
    <PaletteProvider>
      <PaletteQueryProvider devtools={true}>
        <AppShell />
      </PaletteQueryProvider>
    </PaletteProvider>
  );
}
```

**Props**:

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `client` | `QueryClient` | `paletteQueryClient` | 自定义 QueryClient |
| `devtools` | `boolean` | `true` | 是否显示 DevTools |
| `devtoolsPosition` | `'top'\|'bottom'\|'left'\|'right'` | `'bottom'` | DevTools 面板位置 |

## 错误处理体系

```
Axios Error
    │
    ▼
classifyError()
    │
    ▼
PlatformError {
  code: PlatformErrorCode    // 枚举: SESSION_EXPIRED / FORBIDDEN / BFF_UNREACHABLE / ...
  title: string              // 用户可读标题
  message: string            // 详细描述
  recoverable: boolean       // 是否可恢复 (用于 UI 决策)
  details?: string           // 开发调试信息
}
```

**错误码映射**:

| HTTP Status | PlatformErrorCode | recoverable |
|-------------|-------------------|-------------|
| (no response, timeout) | `REQUEST_TIMEOUT` | true |
| (no response, network) | `BFF_UNREACHABLE` | true |
| 401 | `SESSION_EXPIRED` | true |
| 403 | `FORBIDDEN` | false |
| 502/503/504 | `EIDP_UNAVAILABLE` | true |
| 500 (eIDP related) | `EIDP_AUTH_ERROR` | true |
| 500 (other) | `INTERNAL_ERROR` | true |
| other | `UNKNOWN` | true |

## 业务接入指南

### Step 1: 定义 Domain Keys

```ts
// src/query/keys.ts
import { createDomainKeys } from '@palette/api';

export const tradeKeys = createDomainKeys('trades');
```

### Step 2: 定义 API 函数

```ts
// src/api/tradeApi.ts
import { paletteApi, type ApiResponse } from '@palette/api';

export async function fetchTrades(filters: TradeFilters) {
  const res = await paletteApi.get<ApiResponse<Trade[]>>(
    '/backend/trading/trades', { params: filters }
  );
  return res.data.data;
}
```

### Step 3: 在组件中使用

```tsx
// src/pages/TradeListPage.tsx
import { usePlatformQuery, usePlatformMutation } from '@palette/api';
import { tradeKeys } from '../query/keys';
import { fetchTrades, cancelTrade } from '../api/tradeApi';

function TradeListPage() {
  const { data: trades, isLoading } = usePlatformQuery({
    queryKey: tradeKeys.list({ status: 'ACTIVE' }),
    queryFn: () => fetchTrades({ status: 'ACTIVE' }),
  });

  const cancelMutation = usePlatformMutation({
    mutationFn: (id: string) => cancelTrade(id),
    invalidateOnSuccess: [tradeKeys.lists()],
  });

  if (isLoading) return <Spinner />;
  return <TradeTable data={trades} onCancel={cancelMutation.mutate} />;
}
```

## 依赖关系

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.62.0",
    "axios": "^1.7.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.62.0",
    "@types/react": "^18.3.1",
    "typescript": "^5.5.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
```

## 设计原则

1. **约定优于配置**: 默认 QueryClient 配置适合 90% 的企业场景
2. **类型安全全链路**: 从 Query Key 到响应数据，全程 TypeScript 推导
3. **错误不吞没**: 所有错误自动分类为 `PlatformError`，UI 可基于 `recoverable` 决策
4. **缓存失效可预测**: 通过 Key 工厂的层级结构，精确控制失效范围
5. **零样板代码**: 平台级数据 (session/user/config) 一行 hook 搞定
6. **渐进式接入**: 业务团队可以从 `usePlatformQuery` 开始，按需使用高级特性
