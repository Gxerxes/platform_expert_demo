# 业务接入指南

> 新业务团队接入 Palette 平台的完整流程。预计耗时: **1-2 天**。

## 接入清单

```
1. ✅ 创建后端服务 (Spring Boot 3)
2. ✅ 注册 BFF 网关路由
3. ✅ 创建前端应用
4. ✅ 配置路由与菜单
5. ✅ 联调验证
```

---

## 1. 创建后端服务

### 1.1 项目结构

```
palette-{your-service}/
├── src/main/java/com/company/palette/{module}/
│   ├── config/           # 配置类
│   ├── controller/       # REST 控制器
│   ├── dto/              # 请求/响应 DTO
│   ├── entity/           # JPA 实体
│   ├── repository/       # Spring Data JPA
│   ├── service/          # 业务逻辑
│   └── exception/        # 异常处理
├── src/main/resources/
│   ├── application.yml
│   └── application-prod.yml
├── build.gradle
└── Dockerfile
```

### 1.2 标准响应格式

**所有 API 必须使用统一响应格式:**

```java
// 成功响应
{
    "data": { ... }
}

// 错误响应
{
    "code": "TRADE_NOT_FOUND",
    "message": "Trade with id 123 not found",
    "traceId": "req-uuid-789",
    "timestamp": "2026-07-24T10:00:00Z"
}
```

**参考实现:**

```java
@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    @GetMapping
    public ApiResponse<List<TradeDTO>> list(
            @RequestParam(required = false) String status) {
        List<Trade> trades = tradeService.findAll(status);
        return ApiResponse.success(
            trades.stream().map(TradeDTO::from).toList()
        );
    }

    @PostMapping
    public ApiResponse<TradeDTO> create(@Valid @RequestBody CreateTradeRequest req) {
        Trade trade = tradeService.create(req);
        return ApiResponse.success(TradeDTO.from(trade));
    }
}
```

### 1.3 读取 BFF 注入的 Header

后端服务**无需关心认证**，只需读取 BFF 注入的请求头:

| Header | 说明 | 示例 |
|--------|------|------|
| `X-User-ID` | 当前用户 ID (eIDP sub) | `user@example.com` |
| `X-Request-ID` | 请求追踪 ID | `req-uuid-789` |
| `X-Application-ID` | 来源应用标识 | `palette-portal` |
| `Authorization` | Bearer Token (BFF 注入) | `Bearer eyJhbG...` |

```java
@GetMapping("/my-trades")
public ApiResponse<List<TradeDTO>> myTrades(
        @RequestHeader("X-User-ID") String userId) {
    return ApiResponse.success(tradeService.findByOwner(userId));
}
```

### 1.4 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", ex.getErrorCode());
        body.put("message", ex.getMessage());
        body.put("traceId", request.getHeader("X-Request-ID"));
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(404).body(body);
    }
}
```

---

## 2. 注册 BFF 网关路由

在 `palette-bff/src/main/resources/application-dev.yml` 中添加:

```yaml
palette:
  gateway:
    routes:
      - name: {your-service}
        path: /backend/{your-service}/**
        target: http://localhost:{port}
        timeout: 30000
        methods:
          - GET
          - POST
          - PUT
          - DELETE
```

**示例 — 结算服务:**

```yaml
palette:
  gateway:
    routes:
      - name: clearing-service
        path: /backend/clearing/**
        target: http://localhost:8082
        timeout: 30000
```

前端即可通过 `/palette/api/v1/backend/clearing/**` 访问结算服务。

---

## 3. 创建前端应用

### 3.1 使用脚手架

```bash
cd palette-frontend
npx create-palette-app {your-app-name}
```

### 3.2 手动创建

```bash
mkdir -p apps/palette-{your-app}/src/{pages,api,app}
```

**`package.json`:**

```json
{
  "name": "palette-{your-app}",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@palette/core": "workspace:*",
    "@palette/auth": "workspace:*",
    "@palette/api": "workspace:*",
    "@palette/layout": "workspace:*",
    "@palette/router": "workspace:*",
    "@palette/config": "workspace:*",
    "@palette/context": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  }
}
```

**`vite.config.ts`:**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    https: true,
    proxy: {
      '/palette': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 4. 配置路由与菜单

### 4.1 定义路由配置

```tsx
// apps/palette-clearing/src/app/App.tsx
import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PaletteProvider, buildMenuRoutes, type MenuRouteConfig } from '@palette/core';
import { AppShell } from '@palette/layout';

const TradeListPage = lazy(() => import('../pages/TradeListPage'));
const TradeDetailPage = lazy(() => import('../pages/TradeDetailPage'));
const SettlementPage = lazy(() => import('../pages/SettlementPage'));

const routes: MenuRouteConfig[] = [
  {
    path: '/clearing',
    component: AppShell,
    protected: true,
    children: [
      {
        path: '/clearing',
        component: TradeListPage,
        menu: { title: '交易列表', icon: { emoji: '📋' }, order: 10 },
        permission: { permissions: 'TRADE_VIEW' },
      },
      {
        path: '/clearing/trades/:id',
        component: TradeDetailPage,
        menu: { hidden: true },  // 详情页不在菜单中
        permission: { permissions: 'TRADE_VIEW' },
      },
      {
        path: '/clearing/settlement',
        component: SettlementPage,
        menu: { title: '结算管理', icon: { emoji: '💰' }, order: 20 },
        permission: { permissions: ['SETTLEMENT_VIEW', 'SETTLEMENT_ADMIN'], mode: 'any' },
      },
    ],
  },
];

const router = createBrowserRouter(buildMenuRoutes(routes));

export default function App() {
  return (
    <PaletteProvider>
      <RouterProvider router={router} />
    </PaletteProvider>
  );
}
```

### 4.2 使用动态菜单

```tsx
import { useMenuRoutes } from '@palette/router';
import { Sidebar } from '@palette/layout';

function AppNavigation() {
  const menuItems = useMenuRoutes(routes);
  return <Sidebar items={menuItems} />;
}
```

---

## 5. 联调验证

### 5.1 检查清单

| # | 验证项 | 命令/操作 |
|---|--------|-----------|
| 1 | 后端服务启动 | `curl http://localhost:{port}/api/v1/{resource}` |
| 2 | BFF 路由可用 | `curl http://localhost:8080/palette/api/v1/backend/{service}/{resource}` |
| 3 | 前端页面渲染 | 浏览器访问 `https://localhost:{port}` |
| 4 | 认证流程 | 未登录 → 自动跳转 eIDP → 登录后返回 |
| 5 | 权限控制 | 无权限用户看不到菜单/页面 |
| 6 | API 调用 | 前端 → BFF → 后端 → 响应正常 |

### 5.2 调试技巧

```bash
# 查看 BFF 日志 (含请求追踪)
tail -f palette-bff/logs/application.log | grep X-Request-ID

# 查看网关路由匹配
curl -v http://localhost:8080/palette/api/v1/backend/clearing/trades

# 检查会话状态
curl -b "PALETTE_SESSION=xxx" http://localhost:8080/palette/api/v1/auth/session
```

---

## 接入模板速查

| 场景 | 参考 |
|------|------|
| 后端 CRUD | `palette-demo-service` (TaskController) |
| 前端页面 | `palette-demo` (TaskListPage, TaskCreatePage) |
| 路由配置 | `palette-portal/src/app/App.tsx` |
| 权限控制 | `@palette/auth` RequirePermission |
| API 调用 | `@palette/api` paletteApi + usePlatformQuery |

---

*接入过程中遇到问题？联系 `#palette-platform` 频道。*
