/**
 * @palette/config — ConfigProvider
 *
 * Enterprise-grade runtime configuration provider for the Palette platform.
 *
 * Features:
 * - Fetches runtime config from BFF /config endpoint
 * - Typed feature flag system with evaluation engine
 * - Environment detection with metadata
 * - Config override support (runtime overrides)
 * - Config caching with TTL
 * - Deep path value access (e.g., 'ui.theme.primaryColor')
 * - Debug logging for development
 * - Fallback config when BFF is unreachable
 *
 * Usage:
 *   <ConfigProvider config={{ debug: true, cacheTtlMs: 300000 }}>
 *     <App />
 *   </ConfigProvider>
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { fetchRuntimeConfig, type RuntimeConfig } from '@palette/api';

import type {
  ConfigContextValue,
  ConfigProviderProps,
  ConfigProviderConfig,
  ConfigState,
  ConfigStatus,
  EnvironmentInfo,
  FeatureFlag,
  FlagEvaluationContext,
} from './types';
import { parseFeatureFlags, evaluateFlag } from './featureFlags';
import { getEnvironmentInfo } from './useEnvironment';

// ─── Constants ────────────────────────────────────────────

const DEFAULT_CONFIG: ConfigProviderConfig = {
  configEndpoint: '/config',
  debug: false,
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  autoRefresh: true,
};

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  application: 'palette',
  version: '0.0.0',
  environment: 'UNKNOWN',
  features: {},
};

// ─── Context ──────────────────────────────────────────────

const ConfigContext = createContext<ConfigContextValue | null>(null);

// ─── Debug Logger ─────────────────────────────────────────

function createLogger(enabled: boolean) {
  const prefix = '[Palette Config]';
  return {
    debug: (...args: unknown[]) => enabled && console.debug(prefix, ...args),
    info: (...args: unknown[]) => enabled && console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
}

// ─── Deep Get Utility ─────────────────────────────────────

/**
 * Get a value from an object by dot-separated path.
 * @example getValue({ ui: { theme: { color: 'blue' } } }, 'ui.theme.color') → 'blue'
 */
function getNestedValue<T = unknown>(obj: Record<string, unknown> | null | undefined, path: string): T | undefined {
  if (!obj || !path) return undefined;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

// ─── Config Cache ─────────────────────────────────────────

interface ConfigCache {
  config: RuntimeConfig;
  timestamp: number;
}

let configCache: ConfigCache | null = null;

// ─── Provider ─────────────────────────────────────────────

export function ConfigProvider({ children, config: providerConfig }: ConfigProviderProps) {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...providerConfig }), [providerConfig]);
  const logger = useMemo(() => createLogger(mergedConfig.debug), [mergedConfig.debug]);

  const [state, setState] = useState<ConfigState>(() => {
    // Check cache first
    if (configCache && Date.now() - configCache.timestamp < mergedConfig.cacheTtlMs!) {
      logger.debug('Using cached config');
      return {
        status: 'loaded',
        loading: false,
        config: configCache.config,
        featureFlags: parseFeatureFlags(configCache.config.features),
        environment: getEnvironmentInfo(configCache.config.environment),
        error: null,
        loadedAt: configCache.timestamp,
      };
    }

    return {
      status: 'idle',
      loading: true,
      config: null,
      featureFlags: new Map(),
      environment: getEnvironmentInfo(undefined),
      error: null,
      loadedAt: null,
    };
  });

  // Runtime overrides
  const [overrides, setOverrides] = useState<Record<string, unknown>>(
    mergedConfig.overrides ?? {}
  );

  // Track mounted state
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Load Config ────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    // Check cache
    if (configCache && Date.now() - configCache.timestamp < mergedConfig.cacheTtlMs!) {
      logger.debug('Config cache hit, skipping fetch');
      if (mountedRef.current) {
        setState({
          status: 'loaded',
          loading: false,
          config: configCache.config,
          featureFlags: parseFeatureFlags(configCache.config.features),
          environment: getEnvironmentInfo(configCache.config.environment),
          error: null,
          loadedAt: configCache.timestamp,
        });
      }
      return;
    }

    logger.debug('Loading runtime config from BFF...');

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, status: 'loading' as ConfigStatus, loading: true, error: null }));
    }

    try {
      const config = await fetchRuntimeConfig();
      logger.debug('Config loaded:', config);

      // Update cache
      configCache = { config, timestamp: Date.now() };

      if (mountedRef.current) {
        setState({
          status: 'loaded',
          loading: false,
          config,
          featureFlags: parseFeatureFlags(config.features),
          environment: getEnvironmentInfo(config.environment),
          error: null,
          loadedAt: Date.now(),
        });
        logger.info(`Config loaded for environment: ${config.environment}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to load runtime config:', error);

      // Use fallback config if provided
      if (mergedConfig.fallbackConfig) {
        const fallback = { ...DEFAULT_RUNTIME_CONFIG, ...mergedConfig.fallbackConfig };
        logger.debug('Using fallback config');

        if (mountedRef.current) {
          setState({
            status: 'loaded',
            loading: false,
            config: fallback,
            featureFlags: parseFeatureFlags(fallback.features),
            environment: getEnvironmentInfo(fallback.environment),
            error: null,
            loadedAt: Date.now(),
          });
        }
        return;
      }

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          status: 'error' as ConfigStatus,
          loading: false,
          error,
        }));
      }
    }
  }, [logger, mergedConfig.cacheTtlMs, mergedConfig.fallbackConfig]);

  // Auto-load on mount
  useEffect(() => {
    if (mergedConfig.autoRefresh) {
      loadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Config Actions ─────────────────────────────────────

  const refresh = useCallback(async () => {
    // Invalidate cache
    configCache = null;
    await loadConfig();
  }, [loadConfig]);

  const setOverride = useCallback(
    (key: string, value: unknown) => {
      logger.debug(`Setting override: ${key} =`, value);
      setOverrides((prev) => ({ ...prev, [key]: value }));
    },
    [logger]
  );

  const clearOverrides = useCallback(() => {
    logger.debug('Clearing all overrides');
    setOverrides(mergedConfig.overrides ?? {});
  }, [logger, mergedConfig.overrides]);

  const getValue = useCallback(
    <T = unknown>(path: string, defaultValue?: T): T => {
      // Check overrides first
      if (path in overrides) {
        return overrides[path] as T;
      }

      // Then check config
      if (state.config) {
        const value = getNestedValue<T>(state.config as unknown as Record<string, unknown>, path);
        if (value !== undefined) return value;
      }

      return defaultValue as T;
    },
    [state.config, overrides]
  );

  // ── Feature Flag Helpers ───────────────────────────────

  const flagContext = useMemo<FlagEvaluationContext>(
    () => ({
      ...mergedConfig.flagContext,
      environment: state.environment.name,
    }),
    [mergedConfig.flagContext, state.environment.name]
  );

  const isEnabled = useCallback(
    (key: string): boolean => {
      const flag = state.featureFlags.get(key);
      return evaluateFlag(flag, flagContext);
    },
    [state.featureFlags, flagContext]
  );

  const getVariant = useCallback(
    (key: string): string | undefined => {
      const flag = state.featureFlags.get(key);
      if (!flag || !evaluateFlag(flag, flagContext)) return undefined;
      return flag.variant;
    },
    [state.featureFlags, flagContext]
  );

  const getFeatureFlags = useCallback(() => state.featureFlags, [state.featureFlags]);

  // ── Merged Config (with overrides) ─────────────────────

  const mergedRuntimeConfig = useMemo<RuntimeConfig | null>(() => {
    if (!state.config) return null;

    // Apply overrides to features
    const merged = { ...state.config };
    if (Object.keys(overrides).length > 0) {
      merged.features = { ...merged.features };
      for (const [key, value] of Object.entries(overrides)) {
        if (key.startsWith('features.')) {
          const flagKey = key.replace('features.', '');
          merged.features[flagKey] = value;
        }
      }
    }

    return merged;
  }, [state.config, overrides]);

  // ── Context Value ──────────────────────────────────────

  const contextValue = useMemo<ConfigContextValue>(
    () => ({
      // State
      status: state.status,
      loading: state.loading,
      config: mergedRuntimeConfig,
      environment: state.environment,
      error: state.error,
      // Feature Flags
      isEnabled,
      getVariant,
      getFeatureFlags,
      // Actions
      refresh,
      setOverride,
      clearOverrides,
      getValue,
    }),
    [state, mergedRuntimeConfig, isEnabled, getVariant, getFeatureFlags, refresh, setOverride, clearOverrides, getValue]
  );

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────

/**
 * Hook to access the full config context.
 */
export function useConfigContext(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error(
      '[@palette/config] useConfigContext must be used within a ConfigProvider. ' +
        'Wrap your application with <ConfigProvider> to fix this.'
    );
  }
  return context;
}

/**
 * Hook to access runtime configuration.
 * Returns the config object or default config if not yet loaded.
 */
export function useConfig(): RuntimeConfig {
  const context = useContext(ConfigContext);
  return context?.config ?? DEFAULT_RUNTIME_CONFIG;
}

/**
 * Hook to check if a feature flag is enabled.
 *
 * @example
 *   const isEnabled = useFeatureFlag('NEW_TRADE_UI');
 *   if (isEnabled) return <NewUI />;
 */
export function useFeatureFlag(key: string): boolean {
  const context = useContext(ConfigContext);
  if (!context) return false;
  return context.isEnabled(key);
}

/**
 * Hook to get a config value by path.
 *
 * @example
 *   const primaryColor = useConfigValue<string>('ui.theme.primaryColor', '#1a73e8');
 */
export function useConfigValue<T = unknown>(path: string, defaultValue?: T): T {
  const context = useContext(ConfigContext);
  if (!context) return defaultValue as T;
  return context.getValue<T>(path, defaultValue);
}

/**
 * Hook to access environment info.
 */
export function useEnvironment(): EnvironmentInfo {
  const context = useContext(ConfigContext);
  return context?.environment ?? getEnvironmentInfo(undefined);
}

/**
 * Hook to check if running in production.
 */
export function useIsProduction(): boolean {
  const env = useEnvironment();
  return env.isProduction;
}

/**
 * Hook to check if running in development.
 */
export function useIsDevelopment(): boolean {
  const env = useEnvironment();
  return env.isDevelopment;
}
