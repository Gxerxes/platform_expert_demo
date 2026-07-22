/**
 * @palette/config
 *
 * Enterprise-grade runtime configuration and feature flag management
 * for the Palette platform.
 *
 * Features:
 * - Runtime configuration from BFF with caching
 * - Typed feature flag system with evaluation engine
 * - Environment detection and metadata
 * - Config override support
 * - Deep path value access
 * - Debug logging
 *
 * @example
 *   // Basic usage
 *   import { ConfigProvider, useConfig, useFeatureFlag } from '@palette/config';
 *
 *   <ConfigProvider config={{ debug: true }}>
 *     <App />
 *   </ConfigProvider>
 *
 *   // In a component
 *   function MyComponent() {
 *     const config = useConfig();
 *     const isNewUIEnabled = useFeatureFlag('NEW_UI');
 *     return isNewUIEnabled ? <NewUI /> : <OldUI />;
 *   }
 *
 * @packageDocumentation
 */

// ─── Provider & Core Hooks ────────────────────────────────
export {
  ConfigProvider,
  useConfigContext,
  useConfig,
  useFeatureFlag,
  useConfigValue,
  useEnvironment,
  useIsProduction,
  useIsDevelopment,
} from './ConfigProvider';

// ─── Feature Flag System ──────────────────────────────────
export {
  parseFeatureFlags,
  evaluateFlag,
  evaluateFlagResult,
  useFeatureFlags,
  FeatureFlagComponent,
  flagExists,
  getEnabledFlags,
  getDisabledFlags,
  mergeFlagMaps,
} from './featureFlags';

// ─── Environment Utilities ────────────────────────────────
export {
  parseEnvironment,
  getEnvironmentInfo,
  isProductionEnvironment,
  isDevelopmentEnvironment,
  getEnvironmentValue,
  isFeatureEnabledInEnvironment,
  getEnvironmentBadgeProps,
  shouldEnableDebug,
  shouldShowDevTools,
  shouldEnableConsole,
} from './useEnvironment';

// ─── Types ────────────────────────────────────────────────
export type {
  // Environment
  PaletteEnvironment,
  EnvironmentInfo,
  // Feature Flags
  FeatureFlag,
  FeatureFlagValue,
  FeatureFlagResult,
  FlagEvaluationContext,
  // Config
  AppConfig,
  RuntimeConfig,
  EndpointConfig,
  UIConfig,
  ThemeConfig,
  // State
  ConfigStatus,
  ConfigState,
  ConfigContextValue,
  // Provider
  ConfigProviderConfig,
  ConfigProviderProps,
  // Well-known keys
  PaletteConfigKeys,
} from './types';
