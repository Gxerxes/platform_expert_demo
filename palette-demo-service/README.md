# Palette Demo Service — 任务管理系统

基于 Palette 平台的 **业务应用参考实现**，展示如何在 Palette 平台上构建一个完整的前后端业务模块。

## 业务场景

任务管理 (Task Management) — 完整的 CRUD 业务应用，涵盖：

- 任务创建 / 查看 / 编辑 / 删除
- 按状态、优先级、负责人筛选
- 部分更新 (Partial Update) 模式
- 标准错误处理与校验

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Java 21 |
| 框架 | Spring Boot 3.3.5 |
| 数据库 | H2 (开发) / PostgreSQL (生产) |
| ORM | Spring Data JPA |
| 校验 | Bean Validation (Jakarta) |
| 构建 | Gradle 8.10 |
| 容器化 | Docker |

## 项目结构

```
palette-demo-service/
├── build.gradle
├── settings.gradle
├── Dockerfile
├── src/main/java/com/company/palette/demo/
│   ├── DemoServiceApplication.java      # 启动类
│   ├── config/
│   │   └── WebConfig.java               # CORS 配置 (开发用)
│   ├── entity/
│   │   └── Task.java                    # JPA 实体 (含审计字段)
│   ├── repository/
│   │   └── TaskRepository.java          # 数据访问层 (动态过滤查询)
│   ├── service/
│   │   └── TaskService.java             # 业务逻辑层 (CRUD + 部分更新)
│   ├── controller/
│   │   └── TaskController.java          # REST API 控制器
│   ├── dto/
│   │   ├── CreateTaskRequest.java       # 创建请求 DTO
│   │   ├── UpdateTaskRequest.java       # 更新请求 DTO
│   │   └── TaskResponse.java            # 响应 DTO
│   └── exception/
│       ├── ResourceNotFoundException.java    # 404 异常
│       └── GlobalExceptionHandler.java       # 全局异常处理
├── src/main/resources/
│   ├── application.yml                  # 开发配置 (H2)
│   └── application-prod.yml             # 生产配置 (PostgreSQL)
└── src/test/java/
    └── DemoApplicationTests.java
```

## 快速启动

```bash
# 编译并启动
cd palette-demo-service
./gradlew bootRun

# 服务地址: http://localhost:8081
# H2 Console: http://localhost:8081/h2-console
```

## API 设计

### 直接访问

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/v1/tasks` | 列表查询 (支持 `status`/`priority`/`assignee` 过滤) |
| `GET` | `/api/v1/tasks/{id}` | 获取单个任务 |
| `POST` | `/api/v1/tasks` | 创建任务 |
| `PUT` | `/api/v1/tasks/{id}` | 更新任务 (部分更新) |
| `DELETE` | `/api/v1/tasks/{id}` | 删除任务 |

### 通过 BFF 网关访问

当前端通过 Palette BFF 网关调用时，路径为：

```
GET  /palette/api/v1/backend/demo/tasks
POST /palette/api/v1/backend/demo/tasks
PUT  /palette/api/v1/backend/demo/tasks/{id}
DELETE /palette/api/v1/backend/demo/tasks/{id}
```

BFF 网关负责：
1. 验证 Session Cookie (PALETTE_SESSION)
2. 注入 `Authorization: Bearer <access_token>`
3. 注入 `X-User-ID`, `X-Request-ID` 等 Header
4. 转发到 `http://localhost:8081/api/v1/tasks`

### 请求/响应格式

**创建任务** `POST /api/v1/tasks`

```json
// Request
{
  "title": "Implement login flow",
  "description": "Integrate with eIDP using OIDC",
  "priority": "HIGH",
  "assignee": "john.doe",
  "dueDate": "2026-08-01T00:00:00"
}

// Response (201 Created)
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement login flow",
    "description": "Integrate with eIDP using OIDC",
    "status": "TODO",
    "priority": "HIGH",
    "assignee": "john.doe",
    "dueDate": "2026-08-01T00:00:00",
    "createdBy": null,
    "createdAt": "2026-07-21T10:00:00",
    "updatedAt": "2026-07-21T10:00:00"
  }
}
```

**更新任务** `PUT /api/v1/tasks/{id}` (部分更新，只传需要修改的字段)

```json
// Request
{
  "status": "IN_PROGRESS",
  "priority": "CRITICAL"
}

// Response (200 OK)
{
  "data": { ... }
}
```

**错误响应** (标准 Palette 错误格式)

```json
{
  "code": "DEMO_NOT_FOUND",
  "message": "Task not found with id: xxx",
  "timestamp": "2026-07-21T10:00:00Z"
}
```

## 关键设计模式

### 1. 标准分层架构

```
Controller → Service → Repository → Database
     ↕           ↕
   DTO        Entity
```

- **Controller** 只负责 HTTP 协议、参数校验、响应封装
- **Service** 承载业务逻辑，管理事务边界
- **Repository** 数据访问，利用 Spring Data JPA 派生查询
- **DTO** 与 Entity 分离，避免内部模型泄露

### 2. 标准响应信封

所有 API 统一使用 `{ "data": ... }` 格式：

```java
// 成功
ResponseEntity.ok(Map.of("data", result));

// 错误 (由 GlobalExceptionHandler 统一处理)
{ "code": "...", "message": "...", "timestamp": "..." }
```

### 3. 部分更新模式

Update DTO 所有字段可选，Service 层逐字段判断：

```java
if (request.getTitle() != null) {
    task.setTitle(request.getTitle());
}
```

### 4. 审计字段自动填充

通过 JPA `@PrePersist` / `@PreUpdate` 回调自动管理 `createdAt` / `updatedAt`。

### 5. BFF 网关集成

后端服务无需关心认证逻辑。BFF 网关会：
- 验证前端请求的 Session Cookie
- 将 OAuth Access Token 以 `Authorization` Header 透传
- 注入 `X-User-ID` 供后端获取当前用户

## 配置说明

### 开发环境 (默认)

- 使用 H2 内存数据库，无需额外安装
- JPA 自动建表 (`ddl-auto: update`)
- H2 Console 可用

### 生产环境 (`--spring.profiles.active=prod`)

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `DB_HOST` | PostgreSQL 主机 | `localhost` |
| `DB_PORT` | PostgreSQL 端口 | `5432` |
| `DB_NAME` | 数据库名 | `palette_demo` |
| `DB_USERNAME` | 数据库用户 | `postgres` |
| `DB_PASSWORD` | 数据库密码 | `postgres` |

## Docker 构建

```bash
# 先构建 JAR
./gradlew bootJar

# 构建 Docker 镜像
docker build -t palette-demo-service .

# 运行
docker run -p 8081:8081 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=postgres \
  palette-demo-service
```

## 业务团队参考

当你需要创建新的业务服务时，请参考本 demo 的以下模式：

| 需要实现 | 参考文件 |
|----------|----------|
| 定义数据模型 | `entity/Task.java` |
| 数据访问 | `repository/TaskRepository.java` |
| 业务逻辑 | `service/TaskService.java` |
| REST API | `controller/TaskController.java` |
| 请求/响应 DTO | `dto/*.java` |
| 错误处理 | `exception/GlobalExceptionHandler.java` |
| 响应格式 | 所有 Controller 方法中的 `Map.of("data", ...)` |
| 网关路由注册 | `palette-bff/src/main/resources/application-dev.yml` |
