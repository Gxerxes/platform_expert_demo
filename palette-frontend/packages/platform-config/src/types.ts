/**
 * @palette/config — Type Definitions
 *
 * Enterprise-grade runtime configuration types for the Palette platform.
 * Supports typed feature flags, environment detection, config overrides,
 * and dynamic configuration management.
 */

// ─── Environment ──────────────────────────────────────────

/**
 * Supported deployment environments.
 */
export type PaletteEnvironment =
  | 'LOCAL'
  | 'DEV'
  | 'SIT'
  | 'UAT'
  | 'STAGING'
  | 'PRODUCTION'
  | 'UNKNOWN';

/**
 * Environment metadata.
 */
export interface EnvironmentInfo {
  /** Current environment name */
  name: PaletteEnvironment;
  /** Whether this is a production-like environment */
  isProduction: boolean;
  /** Whether this is a development/local environment */
  isDevelopment: boolean;
  /** Display label for UI */
  label: string;
  /** Color badge for UI (e.g., red for prod, green for dev) */
  color: string;
  /** API base URL for this environment */
  apiBaseUrl?: string;
}

// ─── Feature Flags ────────────────────────────────────────

/**
 * Feature flag value types.
 */
export type FeatureFlagValue = boolean | string | number;

/**
 * Feature flag definition with rollout rules.
 */
export interface FeatureFlag {
  /** Unique flag key */
  key: string;
  /** Flag value (true/false for boolean flags) */
  enabled: boolean;
  /** Optional variant value for multivariate flags */
  variant?: string;
  /** Rollout percentage (0-100) for gradual rollout */
  rolloutPercentage?: number;
  /** Specific user IDs or groups this flag applies to */
  targetUsers?: string[];
  /** Specific environments this flag applies to */
  targetEnvironments?: PaletteEnvironment[];
  /** Flag description for documentation */
  description?: string;
  /** When the flag was last modified */
  lastModified?: string;
}

/**
 * Feature flag evaluation context.
 * Used for percentage-based and user-targeted rollouts.
 */
export interface FlagEvaluationContext {
  /** Current user ID for user-targeted flags */
  userId?: string;
  /** Current user roles for role-based flags */
  userRoles?: string[];
  /** Current environment */
  environment?: PaletteEnvironment;
  /** Custom attributes for advanced targeting */
  attributes?: Record<string, string>;
}

/**
 * Feature flag hook return type.
 */
export interface FeatureFlagResult {
  /** Whether the flag is enabled */
  isEnabled: boolean;
  /** Variant value (for multivariate flags) */
  variant: string | undefined;
  /** The full flag definition */
  flag: FeatureFlag | undefined;
}

// ─── Runtime Configuration ────────────────────────────────

/**
 * Application metadata from BFF.
 */
export interface AppConfig {
  /** Application name */
  name: string;
  /** Application version (semver) */
  version: string;
  /** Build timestamp */
  buildTime?: string;
  /** Build commit hash */
  buildCommit?: string;
  /** Application display name */
  displayName?: string;
}

/**
 * Full runtime configuration from BFF /config endpoint.
 */
export interface RuntimeConfig {
  /** Application metadata */
  application: string;
  /** Application version */
  version: string;
  /** Current environment */
  environment: string;
  /** Feature flags from BFF */
  features: Record<string, unknown>;
  /** Additional BFF-provided config */
  settings?: Record<string, unknown>;
  /** API endpoints configuration */
  endpoints?: EndpointConfig;
  /** UI configuration */
  ui?: UIConfig;
}

/**
 * API endpoint configuration.
 */
export interface EndpointConfig {
  /** BFF base URL */
  bffBaseUrl?: string;
  /** WebSocket URL */
  wsBaseUrl?: string;
  /** File upload URL */
  fileUploadUrl?: string;
  /** Custom endpoint overrides */
  custom?: Record<string, string>;
}

/**
 * UI configuration from BFF.
 */
export interface UIConfig {
  /** Page title prefix */
  titlePrefix?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Favicon URL */
  faviconUrl?: string;
  /** Default locale */
  defaultLocale?: string;
  /** Supported locales */
  supportedLocales?: string[];
  /** Theme configuration */
  theme?: ThemeConfig;
}

/**
 * Theme configuration.
 */
export interface ThemeConfig {
  /** Default color mode */
  defaultMode?: 'light' | 'dark' | 'auto';
  /** Primary brand color */
  primaryColor?: string;
  /** Custom CSS variables */
  cssVariables?: Record<string, string>;
}

// ─── Config State ─────────────────────────────────────────

/**
 * Configuration loading status.
 */
export type ConfigStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Complete config state managed by ConfigProvider.
 */
export interface ConfigState {
  /** Loading status */
  status: ConfigStatus;
  /** Whether config is being loaded */
  loading: boolean;
  /** Runtime configuration from BFF */
  config: RuntimeConfig | null;
  /** Parsed feature flags */
  featureFlags: Map<string, FeatureFlag>;
  /** Environment info */
  environment: EnvironmentInfo;
  /** Error if config loading failed */
  error: Error | null;
  /** Config load timestamp */
  loadedAt: number | null;
}

// ─── Config Context ───────────────────────────────────────

/**
 * Value exposed by ConfigContext.
 */
export interface ConfigContextValue {
  // ── State ──
  /** Current loading status */
  status: ConfigStatus;
  /** Whether config is loading */
  loading: boolean;
  /** Runtime configuration */
  config: RuntimeConfig | null;
  /** Environment info */
  environment: EnvironmentInfo;
  /** Config error */
  error: Error | null;

  // ── Feature Flags ──
  /** Check if a feature flag is enabled */
  isEnabled: (key: string) => boolean;
  /** Get feature flag variant */
  getVariant: (key: string) => string | undefined;
  /** Get all feature flags */
  getFeatureFlags: () => Map<string, FeatureFlag>;

  // ── Actions ──
  /** Manually refresh config from BFF */
  refresh: () => Promise<void>;
  /** Override a config value at runtime */
  setOverride: (key: string, value: unknown) => void;
  /** Clear all config overrides */
  clearOverrides: () => void;
  /** Get a config value by path (e.g., 'ui.theme.primaryColor') */
  getValue: <T = unknown>(path: string, defaultValue?: T) => T;
}

// ─── Provider Props ───────────────────────────────────────

/**
 * Configuration options for ConfigProvider.
 */
export interface ConfigProviderConfig {
  /** BFF config endpoint path (default: '/config') */
  configEndpoint?: string;
  /** Static config overrides (merged with BFF config) */
  overrides?: Record<string, unknown>;
  /** Feature flag evaluation context */
  flagContext?: FlagEvaluationContext;
  /** Enable debug logging */
  debug?: boolean;
  /** Config cache TTL in milliseconds (default: 5 minutes) */
  cacheTtlMs?: number;
  /** Whether to auto-refresh config on mount (default: true) */
  autoRefresh?: boolean;
  /** Fallback config when BFF is unreachable */
  fallbackConfig?: Partial<RuntimeConfig>;
}

/**
 * ConfigProvider component props.
 */
export interface ConfigProviderProps {
  children: React.ReactNode;
  /** Provider configuration */
  config?: ConfigProviderConfig;
}

// ─── Well-known Config Keys ──────────────────────────────

/**
 * Well-known configuration keys for the Palette platform.
 * Business applications can extend this interface.
 */
export interface PaletteConfigKeys {
  'app.name': string;
  'app.version': string;
  'app.environment': PaletteEnvironment;
  'ui.titlePrefix': string;
  'ui.logoUrl': string;
  'ui.defaultLocale': string;
  'ui.theme.defaultMode': 'light' | 'dark' | 'auto';
  'ui.theme.primaryColor': string;
  'endpoints.bffBaseUrl': string;
  'endpoints.wsBaseUrl': string;
}
