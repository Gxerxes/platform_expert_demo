# BFF API 参考

> Palette BFF 全部 API 端点文档。Base URL: `/palette/api/v1`

---

## 端点总览

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| GET | `/system/health/live` | No | 存活探针 |
| GET | `/system/health/ready` | No | 就绪探针 |
| GET | `/system/info` | No | 应用信息 |
| GET | `/auth/login` | No | OIDC 登录入口 |
| GET | `/auth/session` | No | 会话状态检查 |
| GET | `/auth/me` | Yes | eIDP 用户信息 |
| POST | `/auth/logout` | Yes | 登出 (含 eIDP 登出) |
| GET | `/context` | Yes | 用户上下文 |
| GET | `/context/tenants` | Yes | 可用租户列表 |
| POST | `/context/tenant` | Yes | 切换租户 |
| GET | `/config` | Yes | 运行时配置 |
| POST | `/files` | Yes | 文件上传 |
| GET | `/files/{id}` | Yes | 文件下载 |
| ANY | `/backend/**` | Yes | 网关代理 |

---

## 认证端点

### GET /auth/login

发起 OIDC 登录。302 重定向到 eIDP 授权页面。

```
GET /palette/api/v1/auth/login
→ 302 Redirect → https://eidp.company.com/authorize?client_id=...
```

### GET /auth/session

检查当前会话状态。无需认证。

**Response:**
```json
{
  "data": {
    "authenticated": true,
    "expiresAt": "2026-07-24T18:00:00Z"
  }
}
```

**未认证:**
```json
{
  "data": {
    "authenticated": false,
    "loginUrl": "/palette/api/v1/auth/login"
  }
}
```

### GET /auth/me

获取 eIDP 实时用户信息。需要认证。

**Response:**
```json
{
  "data": {
    "sub": "user-uuid-123",
    "name": "John Doe",
    "preferredUsername": "john.doe",
    "email": "john@company.com",
    "emailVerified": true,
    "phoneNumber": "+86 138-0000-0000",
    "picture": "https://eidp.company.com/avatars/john.jpg",
    "locale": "zh-CN"
  }
}
```

### POST /auth/logout

登出当前会话。需要认证。

**Request:**
```
POST /palette/api/v1/auth/logout
Cookie: PALETTE_SESSION=abc123
```

**Response:**
```json
{
  "data": {
    "success": true,
    "eidpLogoutUrl": "https://eidp.company.com/end-session?id_token_hint=...&post_logout_redirect_uri=..."
  }
}
```

前端收到后应重定向到 `eidpLogoutUrl` 完成 SSO 登出。

---

## 上下文端点

### GET /context

获取当前用户上下文。需要认证。

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user-uuid-123",
      "username": "john.doe",
      "displayName": "John Doe",
      "email": "john@company.com"
    },
    "environment": "UAT",
    "locale": "en-US",
    "timezone": "Asia/Shanghai"
  }
}
```

### GET /context/tenants

获取当前用户可用的租户列表。需要认证。

**Response:**
```json
{
  "data": [
    {
      "id": "default",
      "displayName": "Default Organization",
      "code": "DEF",
      "status": "active"
    },
    {
      "id": "clearing",
      "displayName": "Clearing Department",
      "code": "CLR",
      "status": "active"
    }
  ]
}
```

### POST /context/tenant

切换活跃租户。需要认证。

**Request:**
```json
{
  "tenantId": "clearing"
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "tenantId": "clearing"
  }
}
```

---

## 配置端点

### GET /config

获取运行时配置。需要认证。

**Response:**
```json
{
  "data": {
    "application": "palette-bff",
    "version": "1.0.0",
    "environment": "UAT",
    "features": {
      "NEW_TRADE_UI": { "enabled": true, "rolloutPercentage": 50 },
      "DARK_MODE": { "enabled": false }
    }
  }
}
```

---

## 文件端点

### POST /files

上传文件。需要认证。

**Request:** `multipart/form-data`
- `file`: 文件内容 (最大 10MB)

**Response:**
```json
{
  "data": {
    "id": "file-uuid-456",
    "name": "report.pdf",
    "size": 102400,
    "contentType": "application/pdf",
    "uploadedAt": "2026-07-24T10:00:00Z"
  }
}
```

### GET /files/{id}

下载文件。需要认证。

**Response:** 文件二进制流 + `Content-Disposition` 头。

---

## 网关代理

### ANY /backend/**

代理到后端业务服务。需要认证。

**路由规则:**

```
前端请求: GET /palette/api/v1/backend/clearing/trades
    ↓ BFF 匹配路由
代理到:   GET http://clearing-service:8082/api/v1/trades
```

**BFF 自动注入的 Header:**

| Header | 说明 |
|--------|------|
| `Authorization` | `Bearer {access_token}` (从会话提取) |
| `X-User-ID` | 当前用户 ID |
| `X-Request-ID` | 请求追踪 ID |
| `X-Application-ID` | 来源应用标识 |
| `X-Channel` | 请求渠道 (web/mobile) |

### 网关路由配置

在 `application-dev.yml` 中配置:

```yaml
palette:
  gateway:
    connect-timeout: 5000       # 连接超时 (ms)
    read-timeout: 30000         # 读取超时 (ms)
    routes:
      - name: demo-service
        path: /backend/demo/**
        target: http://localhost:8081
        timeout: 30000
        methods: [GET, POST, PUT, DELETE]
      - name: clearing-service
        path: /backend/clearing/**
        target: http://localhost:8082
        timeout: 60000
        methods: [GET, POST]
```

---

## 系统端点

### GET /system/health/live

存活探针。Kubernetes 使用。

**Response:** `200 OK` (无 body)

### GET /system/health/ready

就绪探针。检查依赖服务。

**Response:**
```json
{
  "data": {
    "status": "UP",
    "components": {
      "eIDP": { "status": "UP" },
      "redis": { "status": "UP" },
      "database": { "status": "UP" }
    }
  }
}
```

### GET /system/info

应用信息。

**Response:**
```json
{
  "data": {
    "application": "palette-bff",
    "version": "1.0.0",
    "buildTime": "2026-07-24T10:00:00Z"
  }
}
```

---

## 错误格式

所有错误遵循统一格式:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "traceId": "request-trace-id",
  "timestamp": "2026-07-24T10:00:00Z"
}
```

### 错误码列表

| Code | HTTP Status | 说明 |
|------|-------------|------|
| `PALETTE_UNAUTHORIZED` | 401 | 未认证 / 会话过期 |
| `PALETTE_FORBIDDEN` | 403 | 无权限 |
| `PALETTE_NOT_FOUND` | 404 | 资源不存在 |
| `PALETTE_GATEWAY_ERROR` | 502 | 后端服务不可用 |
| `PALETTE_GATEWAY_TIMEOUT` | 504 | 后端服务超时 |
| `PALETTE_RATE_LIMITED` | 429 | 请求频率超限 |
| `PALETTE_INTERNAL_ERROR` | 500 | 内部错误 |
| `PALETTE_VALIDATION_ERROR` | 400 | 请求参数校验失败 |

---

## Swagger UI

运行时可访问交互式 API 文档:

```
http://localhost:8080/palette/swagger-ui.html
```

OpenAPI JSON:
```
http://localhost:8080/palette/api-docs
```
