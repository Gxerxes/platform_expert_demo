# 快速入门

> 从零到第一个 Palette 业务页面，15 分钟完成。

## 前置条件

| 工具 | 版本 | 安装 |
|------|------|------|
| Node.js | 18+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |
| Java | 21+ | https://adoptium.net |
| Docker | 20+ | 用于启动 Keycloak |

## 1. 启动基础设施

```bash
# 克隆项目
git clone <repo-url> && cd platform_expert_demo

# 启动 Keycloak (OIDC Provider)
docker-compose -f docker-compose-keycloak.yml up -d

# 验证 Keycloak
open http://localhost:8888
# 用户名: admin / 密码: admin
```

## 2. 启动 BFF 网关

```bash
cd palette-bff
./gradlew bootRun --args='--spring.profiles.active=dev'
```

BFF 启动在 `http://localhost:8080`。开发模式使用 InMemory Session，无需 Redis。

## 3. 启动 Demo 后端

```bash
cd palette-demo-service
./gradlew bootRun
```

Demo 服务启动在 `http://localhost:8081`。

## 4. 启动前端应用

```bash
cd palette-frontend
pnpm install

# 启动 Demo 应用
pnpm --filter palette-demo dev
# → https://localhost:3001
```

## 5. 创建你的第一个业务页面

### 5.1 创建页面组件

在 `palette-frontend/apps/palette-demo/src/pages/` 下创建 `HelloPage.tsx`:

```tsx
import { useAuth, usePermission } from '@palette/auth';
import { usePaletteContext } from '@palette/context';

export default function HelloPage() {
  const { user } = useAuth();
  const { environment } = usePaletteContext();
  const { hasPermission } = usePermission();

  return (
    <div style={{ padding: 24 }}>
      <h1>Hello, {user?.displayName}!</h1>
      <p>当前环境: {environment}</p>
      {hasPermission('ADMIN_ACCESS') && <p>你是管理员</p>}
    </div>
  );
}
```

### 5.2 注册路由

在 `apps/palette-demo/src/app/App.tsx` 中添加路由:

```tsx
import { lazy } from 'react';
import { buildMenuRoutes, type MenuRouteConfig } from '@palette/router';

const HelloPage = lazy(() => import('../pages/HelloPage'));

const routes: MenuRouteConfig[] = [
  // ... 已有路由
  {
    path: '/hello',
    component: HelloPage,
    menu: { title: 'Hello', icon: { emoji: '👋' }, order: 20 },
    permission: { permissions: 'DASHBOARD_VIEW' },
  },
];

const router = createBrowserRouter(buildMenuRoutes(routes));
```

### 5.3 调用后端 API

```tsx
import { paletteApi } from '@palette/api';
import { usePlatformQuery } from '@palette/api';

function TaskList() {
  const { data, isLoading } = usePlatformQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await paletteApi.get('/backend/demo/tasks');
      return res.data.data;
    },
  });

  if (isLoading) return <Loading />;
  return <ul>{data?.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

## 6. 下一步

- 📖 阅读 [平台包参考](./packages-reference.md) 了解所有可用 API
- 🏗️ 查看 [业务接入指南](./business-onboarding.md) 完成完整应用接入
- 🎨 参考 [常见模式](./patterns-and-recipes.md) 学习企业级最佳实践

---

## 常见问题

**Q: 为什么前端访问 `https://localhost:3001` 报证书错误？**  
A: 开发环境使用自签名证书，在浏览器中点击"高级 → 继续访问"即可。

**Q: BFF 启动报 Keycloak 连接失败？**  
A: 确保 Docker 中 Keycloak 已启动。开发模式使用 `http://localhost:8888`。

**Q: 如何添加新的后端服务路由？**  
A: 在 `palette-bff/src/main/resources/application-dev.yml` 的 `palette.gateway.routes` 中添加路由配置。详见 [BFF API 参考](./bff-api-reference.md#网关路由配置)。
