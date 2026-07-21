/**
 * Palette 业务应用脚手架 — 核心生成器
 *
 * 包含后端和前端的所有模板文件，通过 token 替换生成标准化的业务项目。
 */

import { mkdir, writeFile, chmod } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ─── Helpers ─────────────────────────────────────────────────

function log(msg) {
  console.log(`  ${DIM}${msg}${RESET}`);
}

function logCreated(filePath) {
  console.log(`  ${GREEN}✓${RESET} ${filePath}`);
}

async function writeTpl(basePath, relPath, content, vars) {
  const fullPath = join(basePath, relPath);
  await mkdir(dirname(fullPath), { recursive: true });
  // Replace all tokens
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }
  await writeFile(fullPath, result, 'utf-8');
  logCreated(relPath);
}

// ─── Main Generator ──────────────────────────────────────────

export async function generate(config) {
  const vars = {
    // Project names
    KEBAB_NAME: config.kebabName,
    PASCAL_NAME: config.pascalName,
    CAMEL_NAME: config.camelName,
    // Entity names
    ENTITY_PASCAL: config.entityPascal,
    ENTITY_CAMEL: config.entityCamel,
    ENTITY_KEBAB: config.entityKebab,
    ENTITY_PLURAL: config.entityPlural,
    // Service/App names
    BACKEND_SERVICE_NAME: config.backendServiceName,
    FRONTEND_APP_NAME: config.frontendAppName,
    // Ports
    PORT: config.port,
    FRONTEND_PORT: config.frontendPort,
    // Java
    JAVA_PACKAGE: config.javaPackage,
    PACKAGE_PATH: config.packagePath,
    MODULE_SEGMENT: config.moduleSegment,
    FULL_PACKAGE: `${config.javaPackage}.${config.moduleSegment}`,
    // Gateway
    GATEWAY_PATH: config.gatewayPath,
    GATEWAY_ROUTE_NAME: config.gatewayRouteName,
    // Year
    YEAR: new Date().getFullYear(),
  };

  if (config.generateBackend) {
    const backendDir = join(config.outputDir, config.backendServiceName);
    if (existsSync(backendDir)) {
      throw new Error(`目录已存在: ${config.backendServiceName}。请选择不同的项目名称。`);
    }
    console.log(`\n${GREEN}生成后端服务: ${config.backendServiceName}${RESET}`);
    await generateBackend(backendDir, vars);
  }

  if (config.generateFrontend) {
    // Frontend goes into palette-frontend/apps/<frontendAppName>/
    const frontendDir = join(config.outputDir, 'palette-frontend', 'apps', config.frontendAppName);
    if (existsSync(frontendDir)) {
      throw new Error(`目录已存在: palette-frontend/apps/${config.frontendAppName}`);
    }
    console.log(`\n${GREEN}生成前端应用: ${config.frontendAppName}${RESET}`);
    await generateFrontend(frontendDir, vars);
  }
}

// ═══════════════════════════════════════════════════════════════
// BACKEND TEMPLATES
// ═══════════════════════════════════════════════════════════════

async function generateBackend(base, v) {
  const javaBase = `src/main/java/${v.PACKAGE_PATH}/${v.MODULE_SEGMENT}`;
  const resBase = 'src/main/resources';
  const testBase = `src/test/java/${v.PACKAGE_PATH}/${v.MODULE_SEGMENT}`;

  // ─── Build files ───────────────────────────────────────────

  await writeTpl(base, 'build.gradle', TPL_BUILD_GRADLE, v);
  await writeTpl(base, 'settings.gradle', TPL_SETTINGS_GRADLE, v);
  await writeTpl(base, '.gitignore', TPL_GITIGNORE, v);
  await writeTpl(base, 'Dockerfile', TPL_DOCKERFILE, v);

  // ─── Application config ────────────────────────────────────

  await writeTpl(base, `${resBase}/application.yml`, TPL_APP_YML, v);
  await writeTpl(base, `${resBase}/application-prod.yml`, TPL_APP_PROD_YML, v);

  // ─── Java source ───────────────────────────────────────────

  await writeTpl(base, `${javaBase}/${v.PASCAL_NAME}Application.java`, TPL_APPLICATION_JAVA, v);
  await writeTpl(base, `${javaBase}/config/WebConfig.java`, TPL_WEB_CONFIG, v);
  await writeTpl(base, `${javaBase}/entity/${v.ENTITY_PASCAL}.java`, TPL_ENTITY_JAVA, v);
  await writeTpl(base, `${javaBase}/repository/${v.ENTITY_PASCAL}Repository.java`, TPL_REPOSITORY_JAVA, v);
  await writeTpl(base, `${javaBase}/service/${v.ENTITY_PASCAL}Service.java`, TPL_SERVICE_JAVA, v);
  await writeTpl(base, `${javaBase}/controller/${v.ENTITY_PASCAL}Controller.java`, TPL_CONTROLLER_JAVA, v);
  await writeTpl(base, `${javaBase}/dto/Create${v.ENTITY_PASCAL}Request.java`, TPL_CREATE_REQUEST, v);
  await writeTpl(base, `${javaBase}/dto/Update${v.ENTITY_PASCAL}Request.java`, TPL_UPDATE_REQUEST, v);
  await writeTpl(base, `${javaBase}/dto/${v.ENTITY_PASCAL}Response.java`, TPL_RESPONSE_DTO, v);
  await writeTpl(base, `${javaBase}/exception/ResourceNotFoundException.java`, TPL_NOT_FOUND_EX, v);
  await writeTpl(base, `${javaBase}/exception/GlobalExceptionHandler.java`, TPL_GLOBAL_HANDLER, v);

  // ─── Test ──────────────────────────────────────────────────

  await writeTpl(base, `${testBase}/${v.PASCAL_NAME}ApplicationTests.java`, TPL_APP_TEST, v);

  log(`后端服务生成完成`);
}

// ═══════════════════════════════════════════════════════════════
// FRONTEND TEMPLATES
// ═══════════════════════════════════════════════════════════════

async function generateFrontend(base, v) {
  await writeTpl(base, 'package.json', TPL_FE_PACKAGE_JSON, v);
  await writeTpl(base, 'tsconfig.json', TPL_FE_TSCONFIG, v);
  await writeTpl(base, 'vite.config.ts', TPL_FE_VITE_CONFIG, v);
  await writeTpl(base, 'vite-env.d.ts', TPL_FE_VITE_ENV, v);
  await writeTpl(base, 'index.html', TPL_FE_INDEX_HTML, v);
  await writeTpl(base, 'src/main.tsx', TPL_FE_MAIN_TSX, v);
  await writeTpl(base, 'src/app/App.tsx', TPL_FE_APP_TSX, v);
  await writeTpl(base, `src/api/${v.ENTITY_CAMEL}Api.ts`, TPL_FE_API_TS, v);
  await writeTpl(base, `src/pages/${v.ENTITY_PASCAL}ListPage.tsx`, TPL_FE_LIST_PAGE, v);
  await writeTpl(base, `src/pages/${v.ENTITY_PASCAL}DetailPage.tsx`, TPL_FE_DETAIL_PAGE, v);
  await writeTpl(base, `src/pages/${v.ENTITY_PASCAL}CreatePage.tsx`, TPL_FE_CREATE_PAGE, v);

  log(`前端应用生成完成`);
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE STRINGS
// ═══════════════════════════════════════════════════════════════

// ─── Backend: build.gradle ───────────────────────────────────

const TPL_BUILD_GRADLE = `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.5'
    id 'io.spring.dependency-management' version '1.1.6'
}

group = '{{JAVA_PACKAGE}}'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    // Web
    implementation 'org.springframework.boot:spring-boot-starter-web'

    // JPA / Database
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    // Validation
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    // H2 Database (Development)
    runtimeOnly 'com.h2database:h2'

    // PostgreSQL (Production)
    runtimeOnly 'org.postgresql:postgresql'

    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    // Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
`;

const TPL_SETTINGS_GRADLE = `rootProject.name = '{{BACKEND_SERVICE_NAME}}'
`;

const TPL_GITIGNORE = `build/
.gradle/
!gradle/wrapper/gradle-wrapper.jar
!gradle/wrapper/gradle-wrapper.properties
*.class
*.jar
*.war
*.log
.idea/
*.iml
target/
`;

const TPL_DOCKERFILE = `FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY build/libs/*.jar app.jar

EXPOSE {{PORT}}

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
`;

// ─── Backend: application.yml ────────────────────────────────

const TPL_APP_YML = `server:
  port: {{PORT}}

spring:
  application:
    name: {{BACKEND_SERVICE_NAME}}

  datasource:
    url: jdbc:h2:mem:{{CAMEL_NAME}}db
    driver-class-name: org.h2.Driver
    username: sa
    password:

  h2:
    console:
      enabled: true
      path: /h2-console

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    {{FULL_PACKAGE}}: DEBUG
`;

const TPL_APP_PROD_YML = `spring:
  datasource:
    url: jdbc:postgresql://\${DB_HOST:localhost}:\${DB_PORT:5432}/\${DB_NAME:{{CAMEL_NAME}}}
    driver-class-name: org.postgresql.Driver
    username: \${DB_USERNAME:postgres}
    password: \${DB_PASSWORD:postgres}

  h2:
    console:
      enabled: false

  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
`;

// ─── Backend: Java source templates ──────────────────────────

const TPL_APPLICATION_JAVA = `package {{FULL_PACKAGE}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class {{PASCAL_NAME}}Application {

    public static void main(String[] args) {
        SpringApplication.run({{PASCAL_NAME}}Application.class, args);
    }
}
`;

const TPL_WEB_CONFIG = `package {{FULL_PACKAGE}}.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration.
 * In production, this service sits behind Palette BFF gateway.
 * This CORS config is for direct access during development only.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000", "https://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
`;

const TPL_ENTITY_JAVA = `package {{FULL_PACKAGE}}.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * {{ENTITY_PASCAL}} entity — standard JPA entity with audit fields.
 *
 * Customize the fields below to match your business domain.
 */
@Entity
@Table(name = "{{ENTITY_PLURAL}}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class {{ENTITY_PASCAL}} {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private {{ENTITY_PASCAL}}Status status;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = {{ENTITY_PASCAL}}Status.ACTIVE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum {{ENTITY_PASCAL}}Status {
        ACTIVE, INACTIVE, ARCHIVED
    }
}
`;

const TPL_REPOSITORY_JAVA = `package {{FULL_PACKAGE}}.repository;

import {{FULL_PACKAGE}}.entity.{{ENTITY_PASCAL}};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * {{ENTITY_PASCAL}} repository — Spring Data JPA.
 *
 * Add custom query methods as needed.
 */
@Repository
public interface {{ENTITY_PASCAL}}Repository extends JpaRepository<{{ENTITY_PASCAL}}, String> {

    List<{{ENTITY_PASCAL}}> findAllByOrderByCreatedAtDesc();

    List<{{ENTITY_PASCAL}}> findByStatusOrderByCreatedAtDesc({{ENTITY_PASCAL}}.{{ENTITY_PASCAL}}Status status);
}
`;

const TPL_SERVICE_JAVA = `package {{FULL_PACKAGE}}.service;

import {{FULL_PACKAGE}}.dto.Create{{ENTITY_PASCAL}}Request;
import {{FULL_PACKAGE}}.dto.Update{{ENTITY_PASCAL}}Request;
import {{FULL_PACKAGE}}.dto.{{ENTITY_PASCAL}}Response;
import {{FULL_PACKAGE}}.entity.{{ENTITY_PASCAL}};
import {{FULL_PACKAGE}}.exception.ResourceNotFoundException;
import {{FULL_PACKAGE}}.repository.{{ENTITY_PASCAL}}Repository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * {{ENTITY_PASCAL}} service — business logic layer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class {{ENTITY_PASCAL}}Service {

    private final {{ENTITY_PASCAL}}Repository repository;

    public {{ENTITY_PASCAL}}Response create(Create{{ENTITY_PASCAL}}Request request, String createdBy) {
        {{ENTITY_PASCAL}} entity = {{ENTITY_PASCAL}}.builder()
            .name(request.getName())
            .description(request.getDescription())
            .createdBy(createdBy)
            .build();

        entity = repository.save(entity);
        log.info("{{ENTITY_PASCAL}} created: id={}", entity.getId());
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public {{ENTITY_PASCAL}}Response get(String id) {
        {{ENTITY_PASCAL}} entity = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("{{ENTITY_PASCAL}}", id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<{{ENTITY_PASCAL}}Response> list(String status) {
        List<{{ENTITY_PASCAL}} entities;
        if (status != null) {
            entities = repository.findByStatusOrderByCreatedAtDesc(
                {{ENTITY_PASCAL}}.{{ENTITY_PASCAL}}Status.valueOf(status));
        } else {
            entities = repository.findAllByOrderByCreatedAtDesc();
        }
        return entities.stream().map(this::toResponse).toList();
    }

    public {{ENTITY_PASCAL}}Response update(String id, Update{{ENTITY_PASCAL}}Request request) {
        {{ENTITY_PASCAL}} entity = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("{{ENTITY_PASCAL}}", id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getStatus() != null) entity.setStatus({{ENTITY_PASCAL}}.{{ENTITY_PASCAL}}Status.valueOf(request.getStatus()));

        entity = repository.save(entity);
        log.info("{{ENTITY_PASCAL}} updated: id={}", entity.getId());
        return toResponse(entity);
    }

    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("{{ENTITY_PASCAL}}", id);
        }
        repository.deleteById(id);
        log.info("{{ENTITY_PASCAL}} deleted: id={}", id);
    }

    private {{ENTITY_PASCAL}}Response toResponse({{ENTITY_PASCAL}} entity) {
        return {{ENTITY_PASCAL}}Response.builder()
            .id(entity.getId())
            .name(entity.getName())
            .description(entity.getDescription())
            .status(entity.getStatus().name())
            .createdBy(entity.getCreatedBy())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }
}
`;

const TPL_CONTROLLER_JAVA = `package {{FULL_PACKAGE}}.controller;

import {{FULL_PACKAGE}}.dto.Create{{ENTITY_PASCAL}}Request;
import {{FULL_PACKAGE}}.dto.Update{{ENTITY_PASCAL}}Request;
import {{FULL_PACKAGE}}.dto.{{ENTITY_PASCAL}}Response;
import {{FULL_PACKAGE}}.service.{{ENTITY_PASCAL}}Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * {{ENTITY_PASCAL}} REST Controller.
 *
 * API Design:
 * - Base path: /api/v1/{{ENTITY_PLURAL}}
 * - Standard { "data": ... } response envelope
 * - When behind Palette BFF, accessed via: /palette/api/v1/backend/{{KEBAB_NAME}}/{{ENTITY_PLURAL}}
 *
 * The BFF gateway handles authentication and token relay.
 */
@RestController
@RequestMapping("/api/v1/{{ENTITY_PLURAL}}")
@RequiredArgsConstructor
public class {{ENTITY_PASCAL}}Controller {

    private final {{ENTITY_PASCAL}}Service service;

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody Create{{ENTITY_PASCAL}}Request request,
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        var result = service.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("data", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("data", service.get(id)));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(Map.of("data", service.list(status)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable String id,
            @Valid @RequestBody Update{{ENTITY_PASCAL}}Request request) {
        return ResponseEntity.ok(Map.of("data", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("data", Map.of("success", true)));
    }
}
`;

const TPL_CREATE_REQUEST = `package {{FULL_PACKAGE}}.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Create{{ENTITY_PASCAL}}Request {

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be less than 200 characters")
    private String name;

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;
}
`;

const TPL_UPDATE_REQUEST = `package {{FULL_PACKAGE}}.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Update{{ENTITY_PASCAL}}Request {

    @Size(max = 200, message = "Name must be less than 200 characters")
    private String name;

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    private String status;  // ACTIVE, INACTIVE, ARCHIVED
}
`;

const TPL_RESPONSE_DTO = `package {{FULL_PACKAGE}}.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class {{ENTITY_PASCAL}}Response {

    private String id;
    private String name;
    private String description;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
`;

const TPL_NOT_FOUND_EX = `package {{FULL_PACKAGE}}.exception;

public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String resourceId;

    public ResourceNotFoundException(String resourceName, String resourceId) {
        super(String.format("%s not found with id: %s", resourceName, resourceId));
        this.resourceName = resourceName;
        this.resourceId = resourceId;
    }

    public String getResourceName() { return resourceName; }
    public String getResourceId() { return resourceId; }
}
`;

const TPL_GLOBAL_HANDLER = `package {{FULL_PACKAGE}}.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler — follows Palette standard error response format.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "{{CAMEL_NAME}}_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining("; "));
        return buildResponse(HttpStatus.BAD_REQUEST, "{{CAMEL_NAME}}_VALIDATION_ERROR", details);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "{{CAMEL_NAME}}_BAD_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "{{CAMEL_NAME}}_INTERNAL_ERROR", ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String code, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(status).body(body);
    }
}
`;

const TPL_APP_TEST = `package {{FULL_PACKAGE}};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class {{PASCAL_NAME}}ApplicationTests {

    @Test
    void contextLoads() {
    }
}
`;

// ─── Frontend templates ──────────────────────────────────────

const TPL_FE_PACKAGE_JSON = `{
  "name": "{{FRONTEND_APP_NAME}}",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@palette/api": "workspace:*",
    "@palette/auth": "workspace:*",
    "@palette/config": "workspace:*",
    "@palette/context": "workspace:*",
    "@palette/core": "workspace:*",
    "@palette/layout": "workspace:*",
    "@palette/router": "workspace:*",
    "@palette/ui": "workspace:*",
    "@palette/utils": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-basic-ssl": "^2.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
`;

const TPL_FE_TSCONFIG = `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src", "vite-env.d.ts"],
  "references": [
    { "path": "../../packages/platform-core" },
    { "path": "../../packages/platform-api" },
    { "path": "../../packages/platform-auth" },
    { "path": "../../packages/platform-config" },
    { "path": "../../packages/platform-context" },
    { "path": "../../packages/platform-layout" },
    { "path": "../../packages/platform-router" },
    { "path": "../../packages/platform-ui" },
    { "path": "../../packages/platform-utils" }
  ]
}
`;

const TPL_FE_VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: {{FRONTEND_PORT}},
    https: true,
    proxy: {
      '/palette': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
`;

const TPL_FE_VITE_ENV = `/// <reference types="vite/client" />
`;

const TPL_FE_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Palette {{PASCAL_NAME}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const TPL_FE_MAIN_TSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

const TPL_FE_APP_TSX = `import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PaletteProvider, buildRoutes } from '@palette/core';
import { AppShell } from '@palette/layout';
import type { PaletteRouteConfig } from '@palette/core';

// ─── Lazy-loaded pages ───────────────────────────────────

const {{ENTITY_PASCAL}}ListPage = lazy(() => import('../pages/{{ENTITY_PASCAL}}ListPage'));
const {{ENTITY_PASCAL}}DetailPage = lazy(() => import('../pages/{{ENTITY_PASCAL}}DetailPage'));
const {{ENTITY_PASCAL}}CreatePage = lazy(() => import('../pages/{{ENTITY_PASCAL}}CreatePage'));

// ─── Route configuration ─────────────────────────────────

const routes: PaletteRouteConfig[] = [
  {
    path: '/{{ENTITY_PLURAL}}',
    component: AppShell as any,
    protected: true,
    children: [
      {
        path: '/{{ENTITY_PLURAL}}',
        component: {{ENTITY_PASCAL}}ListPage,
        protected: true,
      },
      {
        path: '/{{ENTITY_PLURAL}}/create',
        component: {{ENTITY_PASCAL}}CreatePage,
        protected: true,
      },
      {
        path: '/{{ENTITY_PLURAL}}/:id',
        component: {{ENTITY_PASCAL}}DetailPage,
        protected: true,
      },
    ],
  },
];

const router = createBrowserRouter(buildRoutes(routes));

// ─── App Entry ───────────────────────────────────────────

export default function App() {
  return (
    <PaletteProvider>
      <RouterProvider router={router} />
    </PaletteProvider>
  );
}
`;

const TPL_FE_API_TS = `import { paletteApi } from '@palette/api';
import type { ApiResponse } from '@palette/api';

// ─── Types ──────────────────────────────────────────────

export interface {{ENTITY_PASCAL}} {
  id: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Create{{ENTITY_PASCAL}}Payload {
  name: string;
  description?: string;
}

export interface Update{{ENTITY_PASCAL}}Payload {
  name?: string;
  description?: string;
  status?: string;
}

// ─── API Calls ──────────────────────────────────────────
// All calls go through Palette BFF gateway.
// Path: /palette/api/v1/backend/{{KEBAB_NAME}}/{{ENTITY_PLURAL}}

const GATEWAY_BASE = '/backend/{{KEBAB_NAME}}/{{ENTITY_PLURAL}}';

export async function fetch{{ENTITY_PASCAL}}s(): Promise<{{ENTITY_PASCAL}}[]> {
  const response = await paletteApi.get<ApiResponse<{{ENTITY_PASCAL}}[]>>(GATEWAY_BASE);
  return response.data.data;
}

export async function fetch{{ENTITY_PASCAL}}(id: string): Promise<{{ENTITY_PASCAL}}> {
  const response = await paletteApi.get<ApiResponse<{{ENTITY_PASCAL}}>>(\`\${GATEWAY_BASE}/\${id}\`);
  return response.data.data;
}

export async function create{{ENTITY_PASCAL}}(payload: Create{{ENTITY_PASCAL}}Payload): Promise<{{ENTITY_PASCAL}}> {
  const response = await paletteApi.post<ApiResponse<{{ENTITY_PASCAL}}>>(GATEWAY_BASE, payload);
  return response.data.data;
}

export async function update{{ENTITY_PASCAL}}(id: string, payload: Update{{ENTITY_PASCAL}}Payload): Promise<{{ENTITY_PASCAL}}> {
  const response = await paletteApi.put<ApiResponse<{{ENTITY_PASCAL}}>>(\`\${GATEWAY_BASE}/\${id}\`, payload);
  return response.data.data;
}

export async function delete{{ENTITY_PASCAL}}(id: string): Promise<void> {
  await paletteApi.delete(\`\${GATEWAY_BASE}/\${id}\`);
}
`;

const TPL_FE_LIST_PAGE = `import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@palette/layout';
import { Loading, ErrorState } from '@palette/ui';
import { fetch{{ENTITY_PASCAL}}s, delete{{ENTITY_PASCAL}} } from '../api/{{ENTITY_CAMEL}}Api';
import type { {{ENTITY_PASCAL}} } from '../api/{{ENTITY_CAMEL}}Api';

/**
 * {{ENTITY_PASCAL}} List Page
 */
export default function {{ENTITY_PASCAL}}ListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<{{ENTITY_PASCAL}}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetch{{ENTITY_PASCAL}}s());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await delete{{ENTITY_PASCAL}}(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { alert('Failed to delete'); }
  };

  if (loading) return <PageContainer title="{{ENTITY_PASCAL}} Management"><Loading /></PageContainer>;
  if (error) return <PageContainer title="{{ENTITY_PASCAL}} Management"><ErrorState message={error} onRetry={load} /></PageContainer>;

  return (
    <PageContainer title="{{ENTITY_PASCAL}} Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>{{ENTITY_PASCAL}}s</h2>
        <button style={btnPrimary} onClick={() => navigate('/{{ENTITY_PLURAL}}/create')}>+ New {{ENTITY_PASCAL}}</button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>No items found.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <a href="#" onClick={e => { e.preventDefault(); navigate(\`/{{ENTITY_PLURAL}}/\${item.id}\`); }} style={{ color: '#0d6efd' }}>
                    {item.name}
                  </a>
                </td>
                <td style={tdStyle}>{item.status}</td>
                <td style={tdStyle}>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button style={linkBtn} onClick={() => navigate(\`/{{ENTITY_PLURAL}}/\${item.id}\`)}>View</button>
                  <button style={{...linkBtn, color: '#dc3545'}} onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageContainer>
  );
}

const btnPrimary: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8f9fa', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #dee2e6' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: 14 };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0d6efd', marginRight: 8 };
`;

const TPL_FE_DETAIL_PAGE = `import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@palette/layout';
import { Loading, ErrorState } from '@palette/ui';
import { fetch{{ENTITY_PASCAL}}, update{{ENTITY_PASCAL}} } from '../api/{{ENTITY_CAMEL}}Api';
import type { {{ENTITY_PASCAL}} } from '../api/{{ENTITY_CAMEL}}Api';

/**
 * {{ENTITY_PASCAL}} Detail Page
 */
export default function {{ENTITY_PASCAL}}DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<{{ENTITY_PASCAL}} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setItem(await fetch{{ENTITY_PASCAL}}(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <PageContainer title="{{ENTITY_PASCAL}} Detail"><Loading /></PageContainer>;
  if (error || !item) return <PageContainer title="{{ENTITY_PASCAL}} Detail"><ErrorState message={error ?? 'Not found'} onRetry={() => navigate('/{{ENTITY_PLURAL}}')} /></PageContainer>;

  return (
    <PageContainer title="{{ENTITY_PASCAL}} Detail">
      <button style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', marginBottom: 16 }} onClick={() => navigate('/{{ENTITY_PLURAL}}')}>
        ← Back to List
      </button>
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 12 }}>{item.name}</h2>
        <p style={{ color: '#495057' }}>{item.description || 'No description'}</p>
        <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#6c757d', marginTop: 16 }}>
          <span>Status: <strong>{item.status}</strong></span>
          <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </PageContainer>
  );
}
`;

const TPL_FE_CREATE_PAGE = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@palette/layout';
import { create{{ENTITY_PASCAL}} } from '../api/{{ENTITY_CAMEL}}Api';

/**
 * {{ENTITY_PASCAL}} Create Page
 */
export default function {{ENTITY_PASCAL}}CreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const item = await create{{ENTITY_PASCAL}}({ name: form.name.trim(), description: form.description.trim() || undefined });
      navigate(\`/{{ENTITY_PLURAL}}/\${item.id}\`);
    } catch { alert('Failed to create'); }
    finally { setSubmitting(false); }
  };

  return (
    <PageContainer title="Create {{ENTITY_PASCAL}}">
      <button style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', marginBottom: 16 }} onClick={() => navigate('/{{ENTITY_PLURAL}}')}>
        ← Back
      </button>
      <form style={{ backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: 500 }} onSubmit={handleSubmit}>
        <label style={label}>Name *</label>
        <input style={{...input, borderColor: errors.name ? '#dc3545' : '#dee2e6'}} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        {errors.name && <span style={{ color: '#dc3545', fontSize: 12 }}>{errors.name}</span>}
        <label style={label}>Description</label>
        <textarea style={{...input, minHeight: 80}} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </button>
          <button type="button" style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={() => navigate('/{{ENTITY_PLURAL}}')}>
            Cancel
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#495057', marginBottom: 4, marginTop: 12 };
const input: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #dee2e6', fontSize: 14, boxSizing: 'border-box' as const };
`;
