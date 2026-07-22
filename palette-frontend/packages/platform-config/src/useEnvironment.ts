/**
 * @palette/config — Environment Utilities
 *
 * Environment detection and environment-specific behavior.
 * Provides typed environment info with UI display helpers.
 *
 * Usage:
 *   const env = useEnvironment();
 *   if (env.isProduction) { disableDevTools(); }
 *
 *   // Environment badge in header
 *   <EnvironmentBadge />
 */

import type { PaletteEnvironment, EnvironmentInfo } from './types';

// ─── Environment Registry ─────────────────────────────────

/**
 * Environment metadata definitions.
 */
const ENVIRONMENT_MAP: Record<PaletteEnvironment, Omit<EnvironmentInfo, 'name'>> = {
  LOCAL: {
    isProduction: false,
    isDevelopment: true,
    label: 'Local',
    color: '#6c757d', // gray
  },
  DEV: {
    isProduction: false,
    isDevelopment: true,
    label: 'Development',
    color: '#198754', // green
  },
  SIT: {
    isProduction: false,
    isDevelopment: true,
    label: 'SIT',
    color: '#0dcaf0', // cyan
  },
  UAT: {
    isProduction: false,
    isDevelopment: false,
    label: 'UAT',
    color: '#ffc107', // yellow/amber
  },
  STAGING: {
    isProduction: false,
    isDevelopment: false,
    label: 'Staging',
    color: '#fd7e14', // orange
  },
  PRODUCTION: {
    isProduction: true,
    isDevelopment: false,
    label: 'Production',
    color: '#dc3545', // red
  },
  UNKNOWN: {
    isProduction: false,
    isDevelopment: false,
    label: 'Unknown',
    color: '#6c757d', // gray
  },
};

// ─── Environment Parsing ──────────────────────────────────

/**
 * Parse environment string to typed PaletteEnvironment.
 */
export function parseEnvironment(env: string | undefined | null): PaletteEnvironment {
  if (!env) return 'UNKNOWN';

  const normalized = env.toUpperCase().trim();

  const mapping: Record<string, PaletteEnvironment> = {
    LOCAL: 'LOCAL',
    DEV: 'DEV',
    DEVELOPMENT: 'DEV',
    SIT: 'SIT',
    UAT: 'UAT',
    STG: 'STAGING',
    STAGING: 'STAGING',
    PRE: 'STAGING',
    PREPROD: 'STAGING',
    PROD: 'PRODUCTION',
    PRODUCTION: 'PRODUCTION',
    PRD: 'PRODUCTION',
  };

  return mapping[normalized] ?? 'UNKNOWN';
}

/**
 * Get full environment info from environment string.
 */
export function getEnvironmentInfo(env: string | undefined | null): EnvironmentInfo {
  const parsed = parseEnvironment(env);
  const meta = ENVIRONMENT_MAP[parsed];

  return {
    name: parsed,
    ...meta,
  };
}

// ─── Environment Utilities ────────────────────────────────

/**
 * Check if current environment is production-like.
 */
export function isProductionEnvironment(env: string | undefined | null): boolean {
  const info = getEnvironmentInfo(env);
  return info.isProduction;
}

/**
 * Check if current environment is development-like.
 */
export function isDevelopmentEnvironment(env: string | undefined | null): boolean {
  const info = getEnvironmentInfo(env);
  return info.isDevelopment;
}

/**
 * Get environment-specific value.
 * Returns different values based on environment.
 *
 * @example
 *   const apiUrl = getEnvironmentValue(environment, {
 *     PRODUCTION: 'https://api.prod.company.com',
 *     STAGING: 'https://api.staging.company.com',
 *     default: 'https://api.dev.company.com',
 *   });
 */
export function getEnvironmentValue<T>(
  env: string | undefined | null,
  values: Partial<Record<PaletteEnvironment, T>> & { default?: T }
): T | undefined {
  const parsed = parseEnvironment(env);
  return values[parsed] ?? values.default;
}

/**
 * Check if a feature should be enabled in the current environment.
 * Useful for environment-specific feature toggles.
 *
 * @example
 *   if (isFeatureEnabledInEnvironment('DEV_TOOLS', environment)) {
 *     showDevTools();
 *   }
 */
export function isFeatureEnabledInEnvironment(
  feature: string,
  env: string | undefined | null,
  enabledEnvironments: PaletteEnvironment[] = ['DEV', 'LOCAL']
): boolean {
  const parsed = parseEnvironment(env);
  return enabledEnvironments.includes(parsed);
}

// ─── Environment Badge Helpers ────────────────────────────

/**
 * Get badge display props for an environment.
 */
export function getEnvironmentBadgeProps(env: string | undefined | null): {
  label: string;
  backgroundColor: string;
  textColor: string;
  visible: boolean;
} {
  const info = getEnvironmentInfo(env);

  // Don't show badge for production (it's the default)
  if (info.name === 'PRODUCTION') {
    return {
      label: '',
      backgroundColor: 'transparent',
      textColor: 'transparent',
      visible: false,
    };
  }

  // Determine text color based on background brightness
  const textColor = info.name === 'UAT' ? '#000000' : '#ffffff';

  return {
    label: info.label,
    backgroundColor: info.color,
    textColor,
    visible: true,
  };
}

// ─── Debug Helpers ────────────────────────────────────────

/**
 * Check if debug mode should be enabled.
 * Debug mode is enabled in non-production environments or when explicitly set.
 */
export function shouldEnableDebug(
  env: string | undefined | null,
  explicitDebug?: boolean
): boolean {
  if (explicitDebug !== undefined) return explicitDebug;
  return isDevelopmentEnvironment(env);
}

/**
 * Check if React DevTools should be shown.
 */
export function shouldShowDevTools(env: string | undefined | null): boolean {
  return isDevelopmentEnvironment(env);
}

/**
 * Check if console logging should be enabled.
 */
export function shouldEnableConsole(env: string | undefined | null): boolean {
  return !isProductionEnvironment(env);
}
