# @palette/api — TanStack Query Enterprise Integration Architecture

## Overview

`@palette/api` is the unified API layer for the Palette frontend platform, built on **Axios + TanStack Query v5**. It provides type-safe, composable, and ready-to-use data fetching capabilities for enterprise business applications.

## Architecture Overview

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
│  │              @palette/api Core Layer                │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │ │
│  │  │queryKeys │ │queryClient│ │ hooks/*           │  │ │
│  │  │(Factory) │ │(Factory)  │ │ usePlatformQuery  │  │ │
│  │  │          │ │           │ │ usePlatformMut... │  │ │
│  │  │          │ │           │ │ usePlatformInf... │  │ │
│  │  └──────────┘ └───────────┘ └───────────────────┘  │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                │
│  ┌─────────────────────┴──────────────────────────────┐ │
│  │              Infrastructure Layer                   │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │ │
│  │  │ client.ts│ │ endpoints │ │ errors.ts         │  │ │
│  │  │ (Axios)  │ │ (API fns) │ │ (Error classify)  │  │ │
│  │  └──────────┘ └───────────┘ └───────────────────┘  │ │
│  └─────────────────────┬──────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │ BFF API │
                    │ :8080   │
                    └─────────┘
```

## Directory Structure

```
platform-api/src/
├── client.ts                        # Axios instance + interceptors
├── endpoints.ts                     # Platform-level API functions
├── errors.ts                        # Error classification (PlatformError)
├── queryClient.ts                   # QueryClient factory + defaults
├── queryKeys.ts                     # Type-safe Query Key factory
├── PaletteQueryProvider.tsx         # React Provider + DevTools
├── hooks/
│   ├── index.ts                     # Hooks barrel export
│   ├── usePlatformQuery.ts          # Generic query hook
│   ├── usePlatformMutation.ts       # Mutation hook (auto-invalidation)
│   ├── usePlatformInfiniteQuery.ts  # Pagination / infinite scroll hook
│   └── usePlatformEndpoints.ts     # Pre-built platform hooks
└── index.ts                         # Package entry, barrel export
```

## Core Module Design

### 1. QueryClient Factory (`queryClient.ts`)

Pre-configured enterprise defaults shared across all business applications:

| Option | Default | Rationale |
|--------|---------|-----------|
| `staleTime` | 10s | Balances data freshness vs request frequency |
| `gcTime` | 5min | Memory usage vs cache hit rate |
| `refetchOnWindowFocus` | false | Prevents unexpected requests in multi-tab enterprise environments |
| `refetchOnReconnect` | false | Session may have expired; avoids invalid requests |
| `retry` | 1 (smart) | No retry on 401/403; one retry on network errors |
| Mutation `retry` | false | Write operations should not auto-retry to prevent duplicates |

**Global Error Callbacks**:
- `QueryCache.onError`: Auto-classifies errors; coordinates with interceptor for 401 redirect
- `MutationCache.onError`: Structured error logging

```ts
// Use the default singleton client
import { paletteQueryClient } from '@palette/api';

// Or create a custom client with overrides
import { createPaletteQueryClient } from '@palette/api';
const myClient = createPaletteQueryClient({
  queries: { staleTime: 30_000 },
});
```

### 2. Query Key Factory (`queryKeys.ts`)

Hierarchical, type-safe Query Key system that prevents key collisions and makes cache invalidation predictable.

**Platform-level Keys**:

```
paletteKeys.all              → ['palette']
paletteKeys.session.current() → ['palette', 'session', 'current']
paletteKeys.user.context()    → ['palette', 'user', 'context']
paletteKeys.config.runtime()  → ['palette', 'config', 'runtime']
paletteKeys.system.info()     → ['palette', 'system', 'info']
```

**Business Domain Keys** (via `createDomainKeys`):

```ts
const orderKeys = createDomainKeys('orders');

orderKeys.all                    → ['palette', 'domain', 'orders']
orderKeys.lists()                → ['palette', 'domain', 'orders', 'list']
orderKeys.list({ status: 'OPEN'}) → ['palette', 'domain', 'orders', 'list', { status: 'OPEN' }]
orderKeys.detail('abc-123')      → ['palette', 'domain', 'orders', 'detail', 'abc-123']
orderKeys.infinite({ page: 0 })  → ['palette', 'domain', 'orders', 'infinite', { page: 0 }]
orderKeys.custom('stats', '2024') → ['palette', 'domain', 'orders', 'stats', '2024']
```

**Cache Invalidation Patterns**:

```ts
// Invalidate all orders
queryClient.invalidateQueries({ queryKey: orderKeys.all });

// Invalidate only lists
queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

// Invalidate a specific filter
queryClient.invalidateQueries({ queryKey: orderKeys.list({ status: 'OPEN' }) });
```

### 3. Core Hooks

#### `usePlatformQuery<TData>`

Wraps `useQuery` with automatic error classification and enforced Query Key factory usage.

```tsx
const { data, isLoading, error } = usePlatformQuery<Order[]>({
  queryKey: orderKeys.list({ status: 'OPEN' }),
  queryFn: () => fetchOrders({ status: 'OPEN' }),
  enabled: !!user,
  staleTime: 60_000,
});

// error is typed as PlatformError with code/title/message/recoverable
if (error) {
  console.log(error.code);        // 'SESSION_EXPIRED' | 'FORBIDDEN' | ...
  console.log(error.recoverable); // true | false
}
```

#### `usePlatformMutation<TData, TVariables>`

Wraps `useMutation` with automatic cache invalidation support.

```tsx
const mutation = usePlatformMutation({
  mutationFn: (input: CreateOrderInput) => createOrder(input),
  invalidateOnSuccess: [orderKeys.lists()],  // Auto-invalidate list cache on success
  invalidateOnError: [orderKeys.all],        // Invalidate all on error
  onSuccess: (data) => {
    toast.success(`Order ${data.id} created`);
  },
});
```

#### `usePlatformInfiniteQuery<TData>`

Pagination / infinite scroll with built-in `PaginatedResponse<T>` support.

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

**Standard Paginated Response Format**:

```ts
interface PaginatedResponse<T> {
  content: T[];           // Items in current page
  page: number;           // Current page number (0-based)
  size: number;           // Items per page
  totalElements: number;  // Total items across all pages
  totalPages: number;     // Total number of pages
  hasNext: boolean;       // Whether more pages exist
}
```

### 4. Pre-built Platform Hooks

Ready-to-use hooks for platform-level data fetching:

| Hook | Endpoint | staleTime | Purpose |
|------|----------|-----------|---------|
| `useSession()` | `GET /auth/session` | 30s | Authentication status check |
| `useUserContext()` | `GET /context` | 60s | User info + environment |
| `useEidpUserInfo()` | `GET /auth/me` | 60s | eIDP identity details |
| `useRuntimeConfig()` | `GET /config` | 5min | Runtime config / Feature flags |
| `useSystemInfo()` | `GET /system/info` | 10min | Version / build info |

```tsx
// Use directly in any component
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

Application entry integration — one line to enable TanStack Query.

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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `client` | `QueryClient` | `paletteQueryClient` | Custom QueryClient instance |
| `devtools` | `boolean` | `true` | Show React Query DevTools |
| `devtoolsPosition` | `'top'\|'bottom'\|'left'\|'right'` | `'bottom'` | DevTools panel position |

## Error Handling System

```
Axios Error
    │
    ▼
classifyError()
    │
    ▼
PlatformError {
  code: PlatformErrorCode    // Enum: SESSION_EXPIRED / FORBIDDEN / BFF_UNREACHABLE / ...
  title: string              // User-readable title
  message: string            // Detailed description
  recoverable: boolean       // Whether recoverable (for UI decisions)
  details?: string           // Developer debugging info
}
```

**Error Code Mapping**:

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

## Business Onboarding Guide

### Step 1: Define Domain Keys

```ts
// src/query/keys.ts
import { createDomainKeys } from '@palette/api';

export const tradeKeys = createDomainKeys('trades');
```

### Step 2: Define API Functions

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

### Step 3: Use in Components

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

## Dependencies

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

## Design Principles

1. **Convention over Configuration**: Default QueryClient settings fit 90% of enterprise use cases
2. **End-to-End Type Safety**: Full TypeScript inference from Query Key to response data
3. **No Silent Errors**: All errors auto-classified into `PlatformError`; UI can decide based on `recoverable`
4. **Predictable Cache Invalidation**: Hierarchical Key factory enables precise invalidation scope control
5. **Zero Boilerplate**: Platform-level data (session/user/config) is one hook away
6. **Progressive Adoption**: Teams can start with `usePlatformQuery` and adopt advanced features as needed
