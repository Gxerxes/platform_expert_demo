# Palette - Enterprise Frontend Platform

Palette 是企业级前端平台基础设施，为业务团队提供标准化的开发范式和最佳实践参考。

## 项目结构

```
platform_expert_demo/
├── palette-bff/                  # BFF 网关层 (Spring Boot 3 + Java 21)
├── palette-frontend/             # 前端 Monorepo (pnpm workspace)
│   ├── apps/
│   │   ├── palette-portal/       # 平台主应用 (认证/仪表盘)
│   │   └── palette-demo/         # ★ Demo 业务应用 (任务管理)
│   └── packages/                 # 平台共享包 (@palette/*)
├── palette-demo-service/         # ★ Demo 后端服务 (Spring Boot 3 + Java 21)
└── keycloak/                     # 本地 OIDC Provider (开发用)
```

## Quick Start

### 1. 启动基础设施

```bash
# 启动 Keycloak (OIDC Provider)
docker-compose -f docker-compose-keycloak.yml up -d
```

### 2. 启动 BFF 网关

```bash
cd palette-bff
./gradlew bootRun --args='--spring.profiles.active=dev'
# → http://localhost:8080
```

### 3. 启动 Demo 后端服务

```bash
cd palette-demo-service
./gradlew bootRun
# → http://localhost:8081
# H2 Console: http://localhost:8081/h2-console
```

### 4. 启动 Demo 前端应用

```bash
cd palette-frontend
pnpm install
pnpm --filter palette-demo dev
# → https://localhost:3001
```

## 文档

| 文档 | 说明 |
|------|------|
| [开发者文档](./docs/developer-guide/README.md) | 开发者指南入口 |
| [快速入门](./docs/developer-guide/getting-started.md) | 环境搭建、项目启动、第一个页面 |
| [业务接入指南](./docs/developer-guide/business-onboarding.md) | 新业务应用完整接入流程 |
| [平台包参考](./docs/developer-guide/packages-reference.md) | 9 个 `@palette/*` 包 API 文档 |
| [BFF API 参考](./docs/developer-guide/bff-api-reference.md) | BFF 全部端点文档 |
| [常见模式与示例](./docs/developer-guide/patterns-and-recipes.md) | 企业级前端开发模式 |
| [BFF 架构文档](./palette-bff/docs/architecture.md) | BFF 架构设计与流程图 |
| [开发计划](./DEVELOPMENT_PLAN.md) | 项目进度与路线图 |

## Demo 业务场景

Demo 实现了一个 **任务管理系统 (Task Management)**，展示了如何在 Palette 平台上构建完整业务应用：

### 后端 Demo (`palette-demo-service`)

| 层级 | 文件 | 说明 |
|------|------|------|
| Entity | `entity/Task.java` | JPA 实体，含审计字段 |
| Repository | `repository/TaskRepository.java` | Spring Data JPA，含动态过滤查询 |
| Service | `service/TaskService.java` | 业务逻辑层，CRUD + 部分更新 |
| Controller | `controller/TaskController.java` | RESTful API，标准 `{ "data": ... }` 响应 |
| DTO | `dto/*.java` | 请求/响应 DTO，含 Bean Validation |
| Exception | `exception/GlobalExceptionHandler.java` | 全局异常处理，标准错误格式 |

**API 端点：**

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/tasks` | 列表查询 (支持 status/priority/assignee 过滤) |
| GET | `/api/v1/tasks/{id}` | 获取详情 |
| POST | `/api/v1/tasks` | 创建任务 |
| PUT | `/api/v1/tasks/{id}` | 更新任务 (部分更新) |
| DELETE | `/api/v1/tasks/{id}` | 删除任务 |

### 前端 Demo (`palette-demo`)

| 页面 | 路由 | 说明 |
|------|------|------|
| TaskListPage | `/tasks` | 任务列表，含筛选/删除 |
| TaskCreatePage | `/tasks/create` | 创建表单，含客户端校验 |
| TaskDetailPage | `/tasks/:id` | 任务详情 + 内联编辑 |

## 架构要点

### 前端请求流

```
React App (palette-demo)
    │
    │ GET /palette/api/v1/backend/demo/tasks
    │ Cookie: PALETTE_SESSION
    ▼
Palette BFF (Gateway)
    │
    │ 1. 验证 Session Cookie
    │ 2. 注入 Authorization: Bearer <token>
    │ 3. 注入 X-User-ID, X-Request-ID
    ▼
Demo Service (http://localhost:8081/api/v1/tasks)
```

### 关键设计模式

1. **前端不持有 Token** — 仅通过 HttpOnly Cookie 维持会话
2. **BFF 网关透传** — 后端服务无需关心认证，只读取 BFF 注入的 Header
3. **标准响应格式** — 所有 API 返回 `{ "data": ... }` 或 `{ "code", "message", "timestamp" }`
4. **Provider 嵌套** — `PaletteProvider` 统一处理 ErrorBoundary → Auth → Config → Context
5. **路由声明式注册** — 通过 `PaletteRouteConfig` 配置 protected/public 路由

### 业务团队接入清单

- [ ] 在 `palette-frontend/apps/` 下创建新的前端应用
- [ ] 在 `palette-demo-service/` 同级创建新的后端服务
- [ ] 在 BFF `application-dev.yml` 注册网关路由
- [ ] 前端使用 `@palette/*` 共享包，通过 `paletteApi` 调用网关
- [ ] 后端遵循标准响应格式和异常处理规范

## License

Internal use only.
