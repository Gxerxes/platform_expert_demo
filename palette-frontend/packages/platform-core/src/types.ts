/**
 * @palette/core — Type Definitions
 *
 * Core type system for the Palette platform lifecycle,
 * plugin system, version management, and health monitoring.
 */

import type { ReactNode } from 'react';

// ─── Platform Lifecycle ──────────────────────────────────

/**
 * Platform initialization phases.
 * Each phase represents a distinct stage in the boot sequence.
 */
export type PlatformPhase =
  | 'idle'           // Before initialization starts
  | 'initializing'   // Core services starting
  | 'authenticating' // Waiting for auth check
  | 'configuring'    // Loading runtime config
  | 'contextualizing'// Loading user context
  | 'ready'          // All systems operational
  | 'degraded'       // Running with non-critical failures
  | 'error';         // Critical failure, cannot continue

/**
 * Lifecycle callbacks for platform-level events.
 */
export interface PlatformLifecycleCallbacks {
  /** Called when platform reaches 'ready' phase */
  onReady?: (info: PlatformReadyInfo) => void;
  /** Called when platform enters 'error' phase */
  onError?: (error: PlatformFatalError) => void;
  /** Called when platform enters 'degraded' phase */
  onDegraded?: (issues: PlatformIssue[]) => void;
  /** Called on every phase transition */
  onPhaseChange?: (phase: PlatformPhase, prevPhase: PlatformPhase) => void;
  /** Called when user session expires */
  onSessionExpired?: () => void;
  /** Called before page unload for cleanup */
  onBeforeUnload?: () => void | Promise<void>;
}

/**
 * Information available when platform is ready.
 */
export interface PlatformReadyInfo {
  /** Time taken to reach ready state (ms) */
  bootTimeMs: number;
  /** Platform version */
  version: string;
  /** Current environment */
  environment: string;
  /** Authenticated user ID (if authenticated) */
  userId: string | null;
  /** List of plugins that were loaded */
  loadedPlugins: string[];
}

// ─── Platform Plugin System ──────────────────────────────

/**
 * A platform plugin that can hook into the lifecycle.
 * Plugins allow business teams to extend platform behavior
 * without modifying core code.
 */
export interface PlatformPlugin {
  /** Unique plugin identifier */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Called during platform initialization */
  install?: (context: PluginContext) => void | Promise<void>;
  /** Called when platform reaches ready state */
  onReady?: (context: PluginContext) => void;
  /** Called on platform teardown / hot reload */
  destroy?: () => void | Promise<void>;
  /** Plugin dependencies (other plugin names) */
  dependencies?: string[];
}

/**
 * Context provided to plugins during installation.
 */
export interface PluginContext {
  /** Access to platform event bus */
  events: PlatformEventBus;
  /** Access to platform configuration */
  getConfig: <T = unknown>(key: string, defaultValue?: T) => T;
  /** Register a cleanup function */
  registerCleanup: (fn: () => void) => void;
  /** Report a non-fatal issue */
  reportIssue: (issue: Omit<PlatformIssue, 'timestamp'>) => void;
  /** Platform version */
  version: string;
  /** Current environment */
  environment: string;
}

// ─── Platform Events ─────────────────────────────────────

/**
 * All platform event types.
 */
export type PlatformEventType =
  | 'platform:boot-start'
  | 'platform:ready'
  | 'platform:error'
  | 'platform:degraded'
  | 'platform:phase-change'
  | 'platform:session-expired'
  | 'platform:config-loaded'
  | 'platform:context-loaded'
  | 'platform:plugin-loaded'
  | 'platform:plugin-error'
  | 'platform:version-check'
  | 'platform:health-change'
  | 'platform:before-unload';

/**
 * Platform event structure.
 */
export interface PlatformEvent {
  type: PlatformEventType;
  timestamp: number;
  payload?: unknown;
}

/**
 * Platform event listener function.
 */
export type PlatformEventListener = (event: PlatformEvent) => void;

/**
 * Platform event bus interface (implemented by platformEvents singleton).
 */
export interface PlatformEventBus {
  on(eventType: PlatformEventType, listener: PlatformEventListener): () => void;
  once(eventType: PlatformEventType, listener: PlatformEventListener): () => void;
  emit(eventType: PlatformEventType, payload?: unknown): void;
  off(eventType?: PlatformEventType): void;
  listenerCount(eventType: PlatformEventType): number;
  getHistory(): ReadonlyArray<PlatformEvent>;
  clearHistory(): void;
}

// ─── Platform Error Types ────────────────────────────────

/**
 * Fatal platform error that prevents normal operation.
 */
export interface PlatformFatalError {
  /** Error code */
  code: string;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  message: string;
  /** Underlying error (if any) */
  cause?: Error;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Additional details for debugging */
  details?: string;
}

/**
 * Non-critical platform issue (degraded mode).
 */
export interface PlatformIssue {
  /** Issue source (which module/plugin) */
  source: string;
  /** Issue severity */
  severity: 'low' | 'medium' | 'high';
  /** Issue description */
  message: string;
  /** Timestamp */
  timestamp: number;
}

// ─── Platform State ──────────────────────────────────────

/**
 * Complete platform state exposed via context.
 */
export interface PlatformState {
  /** Current initialization phase */
  phase: PlatformPhase;
  /** Whether platform is fully ready */
  ready: boolean;
  /** Whether platform is in degraded mode */
  degraded: boolean;
  /** Boot time in milliseconds */
  bootTimeMs: number;
  /** Active issues (degraded mode) */
  issues: PlatformIssue[];
  /** Last fatal error (if any) */
  error: PlatformFatalError | null;
}

/**
 * Platform context value provided to all children.
 */
export interface PlatformContextValue extends PlatformState {
  /** Platform event bus */
  events: PlatformEventBus;
  /** Platform version info */
  version: PlatformVersionInfo;
  /** Platform health status */
  health: PlatformHealthStatus;
  /** Retry after error */
  retry: () => void;
  /** Get platform diagnostic info */
  getDiagnostics: () => PlatformDiagnostics;
}

// ─── Version Management ──────────────────────────────────

/**
 * Platform version information.
 */
export interface PlatformVersionInfo {
  /** Current platform version */
  current: string;
  /** Latest available version (if known) */
  latest: string | null;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Version check timestamp */
  checkedAt: number | null;
  /** Release notes URL */
  releaseNotesUrl: string | null;
}

/**
 * Version check response from BFF.
 */
export interface VersionCheckResponse {
  current: string;
  latest: string;
  updateAvailable: boolean;
  releaseNotesUrl?: string;
  minSupportedVersion?: string;
  forceUpdate?: boolean;
}

// ─── Health Monitoring ───────────────────────────────────

/**
 * Platform health status.
 */
export interface PlatformHealthStatus {
  /** Overall health */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  /** Individual service health */
  services: ServiceHealth[];
  /** Last check timestamp */
  checkedAt: number;
  /** Check interval in ms */
  checkIntervalMs: number;
}

/**
 * Individual service health check result.
 */
export interface ServiceHealth {
  /** Service name */
  name: string;
  /** Service health status */
  status: 'up' | 'down' | 'degraded' | 'unknown';
  /** Response time in ms */
  responseTimeMs?: number;
  /** Error message (if down) */
  error?: string;
  /** Last successful check */
  lastUpAt?: number;
}

/**
 * Health check endpoint response from BFF.
 */
export interface HealthCheckResponse {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  checks: Array<{
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
    details?: Record<string, unknown>;
  }>;
}

// ─── Platform Diagnostics ────────────────────────────────

/**
 * Diagnostic information for debugging.
 */
export interface PlatformDiagnostics {
  /** Platform version */
  version: string;
  /** Environment */
  environment: string;
  /** Boot time */
  bootTimeMs: number;
  /** Current phase */
  phase: PlatformPhase;
  /** Active issues count */
  issueCount: number;
  /** Plugin count */
  pluginCount: number;
  /** User agent */
  userAgent: string;
  /** Timestamp */
  timestamp: number;
  /** Memory usage (if available) */
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  /** Navigation timing */
  timing?: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
  };
}

// ─── PaletteProvider Props ───────────────────────────────

/**
 * Configuration for PaletteProvider.
 */
export interface PaletteProviderConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Platform plugins to install */
  plugins?: PlatformPlugin[];
  /** Lifecycle callbacks */
  lifecycle?: PlatformLifecycleCallbacks;
  /** Health check interval (ms). 0 to disable. */
  healthCheckIntervalMs?: number;
  /** Version check endpoint */
  versionEndpoint?: string;
  /** Enable automatic version checking */
  autoVersionCheck?: boolean;
  /** Custom loading component */
  loadingFallback?: ReactNode;
  /** Custom error component */
  errorFallback?: (error: PlatformFatalError, onRetry: () => void) => ReactNode;
}
