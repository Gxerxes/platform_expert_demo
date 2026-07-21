# create-palette-app — Palette 业务应用脚手架

一键生成符合 Palette 平台规范的业务应用项目，包含完整的后端 (Spring Boot) 和前端 (React) 模板。

## 快速开始

```bash
# 在项目根目录下运行
node palette-create/bin/create-palette-app.js <project-name>

# 示例：生成交易服务
node palette-create/bin/create-palette-app.js trading-service --entity Trade --port 8090
```

## 命令行参数

```
create-palette-app <project-name> [options]
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `<project-name>` | 项目名称 (kebab-case) | 交互式输入 |
| `--entity <name>` | 主实体名称 (PascalCase) | `Item` |
| `--port <number>` | 后端服务端口 | `8082` |
| `--package <name>` | Java 基础包名 | `com.company.palette` |
| `--backend-only` | 仅生成后端服务 | - |
| `--frontend-only` | 仅生成前端应用 | - |
| `--yes` / `-y` | 跳过确认提示 | - |
| `--help` / `-h` | 显示帮助 | - |

## 使用示例

### 完整生成 (前端 + 后端)

```bash
node palette-create/bin/create-palette-app.js trading-service --entity Trade --port 8090
```

生成内容：
- `palette-trading-service/` — Spring Boot 后端服务 (端口 8090)
- `palette-frontend/apps/palette-trading-service/` — React 前端应用

### 仅生成后端

```bash
node palette-create/bin/create-palette-app.js report-service --backend-only --entity Report
```

### 仅生成前端

```bash
node palette-create/bin/create-palette-app.js user-portal --frontend-only --entity User
```

### 交互式模式

不传参数时进入交互式模式，逐步提示输入：

```bash
node palette-create/bin/create-palette-app.js
```

## 生成的项目结构

### 后端服务

```
palette-<name>-service/
├── build.gradle                          # Gradle 构建配置
├── settings.gradle
├── Dockerfile                            # Docker 构建文件
├── .gitignore
├── src/main/java/<package>/<module>/
│   ├── <Name>Application.java            # Spring Boot 启动类
│   ├── config/
│   │   └── WebConfig.java                # CORS 配置 (开发用)
│   ├── entity/
│   │   └── <Entity>.java                 # JPA 实体 (含审计字段)
│   ├── repository/
│   │   └── <Entity>Repository.java       # Spring Data JPA
│   ├── service/
│   │   └── <Entity>Service.java          # 业务逻辑层
│   ├── controller/
│   │   └── <Entity>Controller.java       # REST API 控制器
│   ├── dto/
│   │   ├── Create<Entity>Request.java    # 创建请求 DTO
│   │   ├── Update<Entity>Request.java    # 更新请求 DTO
│   │   └── <Entity>Response.java         # 响应 DTO
│   └── exception/
│       ├── ResourceNotFoundException.java
│       └── GlobalExceptionHandler.java
├── src/main/resources/
│   ├── application.yml                   # 开发配置 (H2 内存库)
│   └── application-prod.yml              # 生产配置 (PostgreSQL)
└── src/test/java/
    └── <Name>ApplicationTests.java
```

### 前端应用

```
palette-frontend/apps/palette-<name>/
├── package.json                          # 依赖声明 (引用 @palette/* 包)
├── tsconfig.json                         # TypeScript 配置
├── vite.config.ts                        # Vite 构建配置 (含 BFF 代理)
├── index.html
├── src/
│   ├── main.tsx                          # 入口文件
│   ├── app/
│   │   └── App.tsx                       # 路由注册 (PaletteProvider)
│   ├── api/
│   │   └── <entity>Api.ts                # API 调用层 (通过 BFF 网关)
│   └── pages/
│       ├── <Entity>ListPage.tsx           # 列表页 (筛选/删除)
│       ├── <Entity>DetailPage.tsx         # 详情页 (查看)
│       └── <Entity>CreatePage.tsx         # 创建页 (表单校验)
```

## 命名转换规则

脚手架自动将输入名称转换为各场景所需格式：

| 输入 | kebab-case | PascalCase | camelCase | 用途 |
|------|------------|------------|-----------|------|
| `trading-service` | `trading-service` | `TradingService` | `tradingService` | 项目/类名 |
| `--entity Trade` | `trade` | `Trade` | `trade` | 实体/文件名 |

**Java 包名规则：** 自动转全小写 (Java 包名规范要求)

```
输入: trading-service
包路径: com/company/palette/tradingservice/
```

## 生成后的接入步骤

### 1. 注册 BFF 网关路由

在 `palette-bff/src/main/resources/application-dev.yml` 中添加：

```yaml
palette:
  gateway:
    routes:
      - name: <project-name>
        path: /backend/<project-name>/**
        target: http://localhost:<port>
```

### 2. 启动后端服务

```bash
cd palette-<project-name>-service
./gradlew bootRun
```

### 3. 安装前端依赖并启动

```bash
cd palette-frontend
pnpm install
pnpm --filter palette-<project-name> dev
```

### 4. 访问应用

- 前端: `https://localhost:3001/<entity-plural>`
- 后端 API: `http://localhost:<port>/api/v1/<entity-plural>`
- 通过网关: `https://localhost:3001/palette/api/v1/backend/<project-name>/<entity-plural>`

## 内置模板特性

### 后端模板

- **标准分层:** Controller → Service → Repository
- **响应格式:** 统一 `{ "data": ... }` 信封
- **错误处理:** `GlobalExceptionHandler` 覆盖 404/400/500
- **审计字段:** `createdAt` / `updatedAt` 自动填充
- **部分更新:** Update DTO 所有字段可选
- **Bean Validation:** `@NotBlank`, `@Size` 等校验
- **数据库:** 开发用 H2，生产用 PostgreSQL

### 前端模板

- **平台集成:** 使用 `PaletteProvider` + `AppShell`
- **路由注册:** 声明式 `PaletteRouteConfig`
- **API 调用:** 通过 `paletteApi` 走 BFF 网关
- **页面模式:** 列表 / 详情 / 创建 三页结构
- **状态管理:** Loading / Error / Data 三态处理
- **TypeScript:** 完整类型定义

## 技术架构

```
                    Browser
                       │
                 React Frontend
                 (palette-<name>)
                       │
              HTTPS + Cookie (PALETTE_SESSION)
                       │
                       ▼
              ┌────────────────┐
              │  Palette BFF   │  ← 认证 + Token 透传
              │  (Gateway)     │
              └────────────────┘
                       │
              Authorization: Bearer <token>
              X-User-ID, X-Request-ID
                       │
                       ▼
              ┌────────────────┐
              │  Backend       │  ← 业务逻辑
              │  Service       │
              └────────────────┘
                       │
                  Database (H2/PostgreSQL)
```

## 参考

- [Palette Demo Service](../palette-demo-service/) — 完整的任务管理示例实现
- [Palette BFF Architecture](../palette-bff/docs/architecture.md) — BFF 架构文档
- [Palette Frontend Packages](../palette-frontend/packages/) — 平台共享包
