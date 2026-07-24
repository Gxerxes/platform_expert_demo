# Palette 开发者文档

> 本文档面向接入 Palette 平台的业务开发团队。

## 文档目录

### 入门

| 文档 | 说明 |
|------|------|
| [快速入门](./getting-started.md) | 环境搭建、项目启动、第一个页面 |
| [业务接入指南](./business-onboarding.md) | 新业务应用完整接入流程 (前端 + 后端 + BFF 路由) |

### 参考

| 文档 | 说明 |
|------|------|
| [平台包参考](./packages-reference.md) | 9 个 `@palette/*` 包的 API 文档与使用示例 |
| [BFF API 参考](./bff-api-reference.md) | BFF 全部端点、请求/响应格式、错误码 |

### 实践

| 文档 | 说明 |
|------|------|
| [常见模式与示例](./patterns-and-recipes.md) | 数据获取、权限控制、表单、错误处理等企业级模式 |

---

## 架构概览

```
┌─────────────────────────────────────────────────┐
│              你的业务应用 (React)                  │
│                                                  │
│  import { useAuth } from '@palette/auth'         │
│  import { usePlatformQuery } from '@palette/api' │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────▼────────┐
              │  @palette/* SDK │  9 个平台包
              │  core auth api  │  统一 Provider
              │  layout router  │
              │  config context │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Palette BFF    │  Spring Boot 3
              │  Auth Gateway   │  Session + Token Relay
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  你的后端服务     │  只读 BFF Header
              │  (Spring Boot)  │  无需关心认证
              └─────────────────┘
```

## Provider 嵌套顺序

所有业务应用自动继承以下 Provider 层次 (由 `PaletteProvider` 管理):

```tsx
<PaletteProvider>
  <ErrorBoundary>        {/* 全局错误捕获 */}
    <AuthProvider>       {/* 认证 + 权限 */}
      <ConfigProvider>   {/* 运行时配置 + Feature Flag */}
        <ContextProvider>{/* 用户上下文 + 多租户 */}
          <QueryProvider>{/* TanStack Query 缓存 */}
            <YourApp />
          </QueryProvider>
        </ContextProvider>
      </ConfigProvider>
    </AuthProvider>
  </ErrorBoundary>
</PaletteProvider>
```

## 关键约定

| 约定 | 说明 |
|------|------|
| **前端不持有 Token** | 仅通过 HttpOnly Cookie 维持会话 |
| **标准响应格式** | 所有 API 返回 `{ "data": ... }` |
| **BFF 路由规则** | 前端请求 `/palette/api/v1/backend/{service}/**` |
| **权限命名** | `{DOMAIN}_{ACTION}` 格式，如 `TRADE_VIEW` |
| **TypeScript strict** | 所有平台包使用 strict mode |

---

*有问题？联系 `#palette-platform` 频道或提交 Jira `PALETTE` 项目。*
