#!/usr/bin/env node

/**
 * create-palette-app — Palette 业务应用脚手架 CLI
 *
 * Usage:
 *   npx create-palette-app <project-name>
 *   create-palette-app trading-service
 *   create-palette-app order-management --backend-only
 *   create-palette-app user-portal --frontend-only
 *
 * Options:
 *   --backend-only    仅生成后端服务
 *   --frontend-only   仅生成前端应用
 *   --port <number>   后端服务端口 (默认: 8082+)
 *   --entity <name>   主实体名称 (默认: Item)
 *   --yes             跳过确认直接生成
 */

import { createInterface } from 'readline';
import { generate } from '../src/generator.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

function printBanner() {
  console.log(`
${CYAN}${BOLD}  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║     create-palette-app  v1.0.0           ║
  ║     Palette 业务应用脚手架               ║
  ║                                          ║
  ╚══════════════════════════════════════════╝${RESET}
`);
}

function printHelp() {
  console.log(`
${BOLD}Usage:${RESET}
  create-palette-app ${GREEN}<project-name>${RESET} [options]

${BOLD}Options:${RESET}
  --backend-only      仅生成后端服务
  --frontend-only     仅生成前端应用
  --port <number>     后端服务端口 (默认自动分配)
  --entity <name>     主实体名称 (默认: Item)
  --package <name>    Java 包名 (默认: com.company.palette)
  --yes               跳过确认直接生成
  -h, --help          显示帮助信息

${BOLD}Examples:${RESET}
  create-palette-app trading-service
  create-palette-app order-management --entity Order --port 8090
  create-palette-app user-portal --frontend-only
  create-palette-app report-service --backend-only --entity Report

${BOLD}Generated Structure:${RESET}
  ${DIM}<project-name>-service/     Spring Boot 后端服务${RESET}
  ${DIM}palette-frontend/apps/      前端应用 (加入 workspace)${RESET}
`);
}

function parseArgs(argv) {
  const args = {
    projectName: '',
    backendOnly: false,
    frontendOnly: false,
    port: 0,
    entity: '',
    javaPackage: 'com.company.palette',
    skipConfirm: false,
    help: false,
  };

  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--backend-only':
        args.backendOnly = true;
        break;
      case '--frontend-only':
        args.frontendOnly = true;
        break;
      case '--port':
        args.port = parseInt(argv[++i], 10) || 0;
        break;
      case '--entity':
        args.entity = argv[++i];
        break;
      case '--package':
        args.javaPackage = argv[++i];
        break;
      case '--yes':
      case '-y':
        args.skipConfirm = true;
        break;
      case '-h':
      case '--help':
        args.help = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          positional.push(arg);
        }
        break;
    }
  }

  args.projectName = positional[0] || '';
  return args;
}

function ask(question, defaultValue) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const prompt = defaultValue
      ? `${question} ${DIM}(${defaultValue})${RESET}: `
      : `${question}: `;
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function confirm(message) {
  return ask(`${message} ${GREEN}(Y/n)${RESET}`, 'Y');
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function findAvailablePort(startPort) {
  // Simple auto-increment from base
  return startPort;
}

async function main() {
  printBanner();

  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.backendOnly && args.frontendOnly) {
    console.log(`${RED}Error: --backend-only 和 --frontend-only 不能同时使用${RESET}`);
    process.exit(1);
  }

  // ─── Interactive prompts if project name not provided ────────

  let projectName = args.projectName;
  if (!projectName) {
    projectName = await ask(`${CYAN}项目名称${RESET} (例如: trading-service)`);
    if (!projectName) {
      console.log(`${RED}Error: 项目名称不能为空${RESET}`);
      process.exit(1);
    }
  }

  // Normalize project name
  projectName = toKebabCase(projectName);

  let entity = args.entity;
  if (!entity) {
    entity = await ask(`${CYAN}主实体名称${RESET} (例如: Order, Trade, Report)`, 'Item');
  }

  let port = args.port;
  if (!port) {
    const portStr = await ask(`${CYAN}后端服务端口${RESET}`, '8082');
    port = parseInt(portStr, 10) || 8082;
  }

  const javaPackage = args.javaPackage;
  const generateBackend = !args.frontendOnly;
  const generateFrontend = !args.backendOnly;

  // ─── Derived names ──────────────────────────────────────────

  const kebabName = projectName;
  const pascalName = toPascalCase(projectName);
  const camelName = toCamelCase(projectName);

  const entityPascal = toPascalCase(entity);
  const entityCamel = toCamelCase(entity);
  const entityKebab = toKebabCase(entity);
  const entityPlural = entityKebab + 's';

  // Backend service name: e.g., "trading-service" → "palette-trading-service"
  const backendServiceName = `palette-${kebabName}`;
  // Frontend app name: e.g., "palette-trading"
  const frontendAppName = `palette-${kebabName}`;
  // Gateway route path: e.g., "/backend/trading/**"
  const gatewayPath = `/backend/${kebabName}/**`;

  // Java package path segments
  const packageSegments = javaPackage.split('.');
  const packagePath = packageSegments.join('/');
  // Module segment for sub-package: e.g., "tradingservice" (Java package must be lowercase)
  const moduleSegment = camelName.toLowerCase();

  const config = {
    kebabName,
    pascalName,
    camelName,
    entityPascal,
    entityCamel,
    entityKebab,
    entityPlural,
    backendServiceName,
    frontendAppName,
    gatewayPath,
    gatewayRouteName: kebabName,
    port,
    frontendPort: 3001,
    javaPackage,
    packagePath,
    packageSegments,
    moduleSegment,
    generateBackend,
    generateFrontend,
    outputDir: process.cwd(),
  };

  // ─── Confirmation ───────────────────────────────────────────

  if (!args.skipConfirm) {
    console.log(`\n${BOLD}项目配置:${RESET}`);
    console.log(`  项目名称:     ${GREEN}${backendServiceName}${RESET}`);
    console.log(`  主实体:       ${GREEN}${entityPascal}${RESET}`);
    if (generateBackend) {
      console.log(`  后端端口:     ${GREEN}${port}${RESET}`);
      console.log(`  Java包名:     ${GREEN}${javaPackage}.${moduleSegment}${RESET}`);
    }
    if (generateFrontend) {
      console.log(`  前端应用:     ${GREEN}${frontendAppName}${RESET}`);
    }
    console.log(`  网关路由:     ${GREEN}${gatewayPath}${RESET}`);
    console.log();

    const answer = await confirm('确认生成?');
    if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
      console.log(`${YELLOW}已取消${RESET}`);
      process.exit(0);
    }
  }

  // ─── Generate ───────────────────────────────────────────────

  try {
    await generate(config);

    console.log(`\n${GREEN}${BOLD}✓ 项目生成成功!${RESET}\n`);
    console.log(`${BOLD}快速开始:${RESET}`);

    if (generateBackend) {
      console.log(`\n  ${CYAN}# 启动后端服务${RESET}`);
      console.log(`  cd ${backendServiceName}`);
      console.log(`  ./gradlew bootRun`);
    }

    if (generateFrontend) {
      console.log(`\n  ${CYAN}# 启动前端应用${RESET}`);
      console.log(`  cd palette-frontend`);
      console.log(`  pnpm install`);
      console.log(`  pnpm --filter ${frontendAppName} dev`);
    }

    console.log(`\n  ${DIM}详细文档请查看生成项目中的 README.md${RESET}\n`);
  } catch (err) {
    console.error(`\n${RED}Error: ${err.message}${RESET}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
