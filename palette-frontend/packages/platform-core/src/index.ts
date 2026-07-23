/**
 * @palette/core — Public API
 *
 * Root package for the Palette enterprise UI platform.
 * Provides the PaletteProvider, lifecycle management,
 * event bus, error handling, version management, and health monitoring.
 */

// ─── Provider ────────────────────────────────────────────
export { PaletteProvider, usePlatform, usePlatformEvents, usePlatformDiagnostics } from './PaletteProvider';

// ─── Error Boundary ──────────────────────────────────────
export { PlatformErrorBoundary } from './PlatformErrorBoundary';

// ─── Event Bus ───────────────────────────────────────────
export { platformEvents } from './platformEvents';

// ─── Lifecycle Hooks ─────────────────────────────────────
export {
  usePlatformLifecycle,
  usePlatformPhase,
  useIsPlatformReady,
} from './usePlatformLifecycle';

// ─── Version Management ──────────────────────────────────
export { usePlatformVersion, usePlatformVersionString } from './usePlatformVersion';

// ─── Health Monitoring ───────────────────────────────────
export { usePlatformHealth, useIsPlatformHealthy } from './usePlatformHealth';

// ─── Re-export from other packages for convenience ───────
export { useAuth } from '@palette/auth';
export { useConfig, useFeatureFlag, useEnvironment } from '@palette/config';
export { usePaletteContext } from '@palette/context';
export { ErrorBoundary, buildRoutes } from '@palette/router';

// ─── Type exports ────────────────────────────────────────
export type { PaletteRouteConfig } from '@palette/router';

export type {
  // Lifecycle
  PlatformPhase,
  PlatformLifecycleCallbacks,
  PlatformReadyInfo,
  // Plugin
  PlatformPlugin,
  PluginContext,
  // Events
  PlatformEventType,
  PlatformEvent,
  PlatformEventListener,
  PlatformEventBus,
  // Errors
  PlatformFatalError,
  PlatformIssue,
  // State
  PlatformState,
  PlatformContextValue,
  // Version
  PlatformVersionInfo,
  VersionCheckResponse,
  // Health
  PlatformHealthStatus,
  ServiceHealth,
  HealthCheckResponse,
  // Diagnostics
  PlatformDiagnostics,
  // Config
  PaletteProviderConfig,
} from './types';
