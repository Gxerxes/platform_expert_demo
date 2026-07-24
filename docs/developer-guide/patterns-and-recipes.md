# 常见模式与示例

> 企业级前端开发中的常见场景和 Palette 推荐实现方式。

---

## 1. 数据获取

### 基础查询

```tsx
import { usePlatformQuery, paletteApi, paletteKeys } from '@palette/api';

function TradeList() {
  const { data, isLoading, error, refetch } = usePlatformQuery({
    queryKey: paletteKeys.domain('trades').list(),
    queryFn: async () => {
      const res = await paletteApi.get('/backend/clearing/trades');
      return res.data.data;
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return <DataTable data={data} columns={columns} />;
}
```

### 带参数查询

```tsx
function TradeList({ status }: { status: string }) {
  const { data } = usePlatformQuery({
    queryKey: ['trades', { status }],
    queryFn: async () => {
      const res = await paletteApi.get('/backend/clearing/trades', {
        params: { status },
      });
      return res.data.data;
    },
    enabled: !!status,  // status 有值才发起请求
  });
}
```

### 分页查询

```tsx
import { usePaginatedQuery, paletteApi } from '@palette/api';

function PaginatedTradeList() {
  const { data, page, pageSize, nextPage, prevPage, total } = usePaginatedQuery({
    queryKey: ['trades', 'paginated'],
    queryFn: async ({ page, pageSize }) => {
      const res = await paletteApi.get('/backend/clearing/trades', {
        params: { page, pageSize },
      });
      return res.data.data;
    },
    initialPage: 0,
    initialPageSize: 20,
  });

  return (
    <div>
      <DataTable data={data} />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </div>
  );
}
```

### 轮询

```tsx
import { usePolling, paletteApi } from '@palette/api';

function LiveTradeStatus({ tradeId }: { tradeId: string }) {
  const { data } = usePolling({
    queryKey: ['trades', tradeId, 'status'],
    queryFn: async () => {
      const res = await paletteApi.get(`/backend/clearing/trades/${tradeId}`);
      return res.data.data;
    },
    interval: 5000,  // 每 5 秒轮询
    enabled: true,
  });

  return <StatusBadge status={data?.status} />;
}
```

### 防抖搜索

```tsx
import { useDebouncedQuery, paletteApi } from '@palette/api';

function TradeSearch() {
  const [keyword, setKeyword] = useState('');

  const { data } = useDebouncedQuery({
    queryKey: ['trades', 'search', keyword],
    queryFn: async () => {
      const res = await paletteApi.get('/backend/clearing/trades/search', {
        params: { q: keyword },
      });
      return res.data.data;
    },
    delay: 300,  // 300ms 防抖
    enabled: keyword.length >= 2,
  });

  return (
    <div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      <SearchResults data={data} />
    </div>
  );
}
```

---

## 2. 数据变更

### 基础 Mutation

```tsx
import { usePlatformMutation, paletteApi, useQueryClient } from '@palette/api';

function CreateTradeForm() {
  const queryClient = useQueryClient();

  const mutation = usePlatformMutation({
    mutationFn: async (values: CreateTradeRequest) => {
      const res = await paletteApi.post('/backend/clearing/trades', values);
      return res.data.data;
    },
  });

  const handleSubmit = (values: CreateTradeRequest) => {
    mutation.mutate(values, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        navigate('/trades');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

### 自动缓存失效

```tsx
import { useMutationWithInvalidate, paletteApi } from '@palette/api';

const createTrade = useMutationWithInvalidate({
  mutationFn: (values) => paletteApi.post('/backend/clearing/trades', values),
  invalidateKeys: [['trades']],  // 自动失效 trades 相关缓存
});
```

### 乐观更新

```tsx
import { useOptimisticMutation, paletteApi } from '@palette/api';

const toggleStatus = useOptimisticMutation({
  mutationFn: ({ id, status }) =>
    paletteApi.put(`/backend/clearing/trades/${id}`, { status }),
  optimisticData: (old, { id, status }) =>
    old.map(t => t.id === id ? { ...t, status } : t),
  rollbackData: (old) => old,
  invalidateKeys: [['trades']],
});
```

---

## 3. 权限控制

### 声明式权限守卫

```tsx
import { RequirePermission, RequireRole } from '@palette/auth';

function AdminPanel() {
  return (
    <RequirePermission permission="ADMIN_ACCESS" fallback={<AccessDenied />}>
      <div>管理员面板内容</div>
    </RequirePermission>
  );
}

// 多权限 (AND)
<RequirePermission permission={['TRADE_VIEW', 'TRADE_APPROVE']}>
  <TradeApprovalPanel />
</RequirePermission>

// 多权限 (OR)
<RequirePermission permission={['ADMIN', 'SUPERVISOR']} mode="any">
  <ManagementPanel />
</RequirePermission>

// 角色守卫
<RequireRole role="CLEARING_USER">
  <ClearingDashboard />
</RequireRole>
```

### 编程式权限检查

```tsx
import { usePermission } from '@palette/auth';

function ActionBar() {
  const { hasPermission, hasAllPermissions } = usePermission();

  return (
    <div>
      {hasPermission('TRADE_CREATE') && <CreateButton />}
      {hasPermission('TRADE_DELETE') && <DeleteButton />}
      {hasAllPermissions(['TRADE_APPROVE', 'TRADE_RELEASE']) && (
        <BatchActionButton />
      )}
    </div>
  );
}
```

### 权限路由

```tsx
import { type MenuRouteConfig } from '@palette/router';

const routes: MenuRouteConfig[] = [
  {
    path: '/admin',
    component: AdminPage,
    menu: { title: '管理', icon: { emoji: '⚙️' } },
    permission: {
      permissions: 'ADMIN_ACCESS',
      mode: 'all',
      roles: 'ADMIN',
      roleMode: 'any',
    },
  },
];
```

---

## 4. 配置与 Feature Flag

### 运行时配置

```tsx
import { useConfig, useEnvironment } from '@palette/config';

function AppHeader() {
  const { config, environment } = useConfig();
  const env = useEnvironment();

  return (
    <header>
      <span>{config?.application} v{config?.version}</span>
      <EnvironmentBadge
        label={env.label}
        color={env.color}  // prod=red, dev=green, uat=orange
      />
    </header>
  );
}
```

### Feature Flag

```tsx
import { useFeatureFlag } from '@palette/config';

function TradeUI() {
  const { isEnabled } = useFeatureFlag('NEW_TRADE_UI');

  if (isEnabled('NEW_TRADE_UI')) {
    return <NewTradeUI />;
  }
  return <LegacyTradeUI />;
}
```

---

## 5. 错误处理

### 全局错误边界

```tsx
import { ErrorBoundary } from '@palette/core';

function App() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorPage
          error={error}
          onRetry={resetError}
          onHome={() => navigate('/')}
        />
      )}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### API 错误分类

```tsx
import { usePlatformQuery, paletteApi, classifyError, PlatformErrorCode } from '@palette/api';

function DataPage() {
  const { data, error } = usePlatformQuery({
    queryKey: ['trades'],
    queryFn: () => paletteApi.get('/backend/clearing/trades'),
  });

  if (error) {
    const classified = classifyError(error);

    switch (classified.code) {
      case PlatformErrorCode.UNAUTHORIZED:
        return <LoginPage />;
      case PlatformErrorCode.NETWORK_ERROR:
        return <NetworkError onRetry={refetch} />;
      case PlatformErrorCode.TIMEOUT:
        return <TimeoutError />;
      default:
        return <GenericError error={classified} />;
    }
  }
}
```

---

## 6. 多租户

### 租户切换器

```tsx
import { useTenantContext } from '@palette/context';

function TenantSwitcher() {
  const { currentTenant, availableTenants, switchTenant } = useTenantContext();

  if (!currentTenant) return null;

  return (
    <select
      value={currentTenant.id}
      onChange={(e) => switchTenant(e.target.value)}
    >
      {availableTenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.displayName}
        </option>
      ))}
    </select>
  );
}
```

### 租户感知数据获取

```tsx
import { useTenantContext } from '@palette/context';
import { usePlatformQuery, paletteApi } from '@palette/api';

function TenantTradeList() {
  const { tenantId } = useTenantContext();

  const { data } = usePlatformQuery({
    queryKey: ['trades', tenantId],
    queryFn: async () => {
      const res = await paletteApi.get('/backend/clearing/trades', {
        headers: { 'X-Tenant-ID': tenantId ?? undefined },
      });
      return res.data.data;
    },
    enabled: !!tenantId,
  });
}
```

---

## 7. 会话管理

### 会话到期预警

```tsx
import { useSessionExpiry } from '@palette/auth';

function SessionWarning() {
  const { remainingSeconds, isExpiring, refreshSession } = useSessionExpiry({
    warningThreshold: 300,  // 5 分钟前开始提醒
  });

  if (!isExpiring) return null;

  return (
    <div className="session-warning">
      <p>会话将在 {Math.floor(remainingSeconds / 60)} 分钟后过期</p>
      <button onClick={refreshSession}>续期</button>
    </div>
  );
}
```

### 空闲检测

```tsx
import { useIdleDetection, useAuth } from '@palette/auth';

function IdleMonitor() {
  const { logout } = useAuth();
  const { isIdle } = useIdleDetection({
    idleTimeout: 900,  // 15 分钟无操作
    onIdle: () => logout(),
  });

  if (isIdle) {
    return <div>您已长时间未操作，将自动登出</div>;
  }
  return null;
}
```

---

## 8. 事件通信

### 跨模块事件

```tsx
import { platformEvents } from '@palette/core';

// 模块 A: 发送事件
platformEvents.emit('trade:created', { tradeId: '123' });

// 模块 B: 监听事件
useEffect(() => {
  const off = platformEvents.on('trade:created', (payload) => {
    console.log('New trade:', payload.tradeId);
    refetchTradeList();
  });
  return off;  // cleanup
}, []);
```

---

*更多模式请参考 Demo 应用源码: `palette-frontend/apps/palette-demo/`*
