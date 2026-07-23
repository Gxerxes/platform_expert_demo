/**
 * @palette/core — PaletteProvider
 *
 * Enterprise-grade root provider that bootstraps the entire Palette platform.
 *
 * Features:
 * - Ordered provider nesting (ErrorBoundary → Auth → Config → Context)
 * - Platform lifecycle management with phase tracking
 * - Plugin system for extensibility
 * - Boot performance measurement
 * - Debug logging for development
 * - Graceful degradation on non-critical failures
 * - Event bus integration for cross-module communication
 *
 * Provider nesting order:
 *   PlatformErrorBoundary → PlatformContext → AuthProvider → (AuthenticatedGuard → ConfigProvider → ContextProvider) → App
 *
 * Lifecycle phases:
 *   idle → initializing → authenticating → configuring → contextualizing → ready
 *
 * Usage:
 *   <PaletteProvider
 *     config={{
 *       debug: true,
 *       plugins: [myPlugin],
 *       lifecycle: { onReady: (info) => console.log('Ready!', info) },
 *     }}
 *   >
 *     <App />
 *   </PaletteProvider>
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
import { AuthProvider, useAuth } from '@palette/auth';
import { ConfigProvider } from '@palette/config';
import { ContextProvider } from '@palette/context';
import { ErrorBoundary } from '@palette/router';

import { platformEvents } from './platformEvents';
import type {
  PaletteProviderConfig,
  PlatformContextValue,
  PlatformState,
  PlatformPhase,
  PlatformFatalError,
  PlatformIssue,
  PlatformPlugin,
  PlatformVersionInfo,
  PlatformHealthStatus,
  PlatformDiagnostics,
  PluginContext,
  PlatformReadyInfo,
} from './types';

// ─── Constants ────────────────────────────────────────────

const DEFAULT_CONFIG: Required<
  Pick<PaletteProviderConfig, 'debug' | 'healthCheckIntervalMs' | 'autoVersionCheck'>
> = {
  debug: false,
  healthCheckIntervalMs: 30000,
  autoVersionCheck: true,
};

// ─── Platform Context ────────────────────────────────────

const PlatformContext = createContext<PlatformContextValue | null>(null);

// ─── Debug Logger ────────────────────────────────────────

function createLogger(enabled: boolean) {
  const prefix = '[Palette Core]';
  return {
    debug: (...args: unknown[]) => enabled && console.debug(prefix, ...args),
    info: (...args: unknown[]) => enabled && console.info(prefix, ...args),
    warn: (...args: unknown[]) => enabled && console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
}

// ─── Plugin Loader ───────────────────────────────────────

function loadPlugins(
  plugins: PlatformPlugin[],
  context: PluginContext,
  logger: ReturnType<typeof createLogger>
): { loaded: string[]; cleanups: Array<() => void> } {
  const loaded: string[] = [];
  const cleanups: Array<() => void> = [];

  // Sort by dependencies (simple topological sort)
  const sorted = topologicalSort(plugins);

  for (const plugin of sorted) {
    try {
      logger.debug(`Loading plugin: ${plugin.name}@${plugin.version}`);

      if (plugin.install) {
        // Note: install is sync in this implementation for simplicity
        const result = plugin.install(context);
        if (result instanceof Promise) {
          // Fire-and-forget async install
          result.catch((err) => {
            logger.error(`Plugin ${plugin.name} install failed:`, err);
            platformEvents.emit('platform:plugin-error', {
              plugin: plugin.name,
              phase: 'install',
              error: String(err),
            });
          });
        }
      }

      if (plugin.destroy) {
        cleanups.push(plugin.destroy);
      }

      loaded.push(plugin.name);
      platformEvents.emit('platform:plugin-loaded', { name: plugin.name, version: plugin.version });
      logger.debug(`Plugin loaded: ${plugin.name}`);
    } catch (err) {
      logger.error(`Plugin ${plugin.name} failed to load:`, err);
      platformEvents.emit('platform:plugin-error', {
        plugin: plugin.name,
        phase: 'install',
        error: String(err),
      });
    }
  }

  return { loaded, cleanups };
}

/**
 * Simple topological sort for plugin dependencies.
 */
function topologicalSort(plugins: PlatformPlugin[]): PlatformPlugin[] {
  const nameMap = new Map(plugins.map((p) => [p.name, p]));
  const visited = new Set<string>();
  const result: PlatformPlugin[] = [];

  function visit(plugin: PlatformPlugin) {
    if (visited.has(plugin.name)) return;
    visited.add(plugin.name);

    // Visit dependencies first
    for (const dep of plugin.dependencies ?? []) {
      const depPlugin = nameMap.get(dep);
      if (depPlugin) {
        visit(depPlugin);
      }
    }

    result.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin);
  }

  return result;
}

// ─── Platform Context Provider ───────────────────────────

interface InternalPlatformProviderProps {
  children: ReactNode;
  config: Required<Pick<PaletteProviderConfig, 'debug' | 'healthCheckIntervalMs' | 'autoVersionCheck'>> & PaletteProviderConfig;
}

function InternalPlatformProvider({ children, config }: InternalPlatformProviderProps) {
  const logger = useMemo(() => createLogger(config.debug), [config.debug]);
  const bootStartTime = useRef(Date.now());

  const [phase, setPhase] = useState<PlatformPhase>('initializing');
  const [issues, setIssues] = useState<PlatformIssue[]>([]);
  const [error, setError] = useState<PlatformFatalError | null>(null);
  const [loadedPlugins, setLoadedPlugins] = useState<string[]>([]);
  const pluginCleanupsRef = useRef<Array<() => void>>([]);

  // ── Phase Transition Helper ──────────────────────────

  const transitionPhase = useCallback(
    (newPhase: PlatformPhase) => {
      setPhase((prevPhase) => {
        if (prevPhase !== newPhase) {
          logger.debug(`Phase: ${prevPhase} → ${newPhase}`);
          platformEvents.emit('platform:phase-change', {
            phase: newPhase,
            prevPhase,
          });
        }
        return newPhase;
      });
    },
    [logger]
  );

  // ── Plugin Initialization ────────────────────────────

  useEffect(() => {
    const plugins = config.plugins ?? [];
    if (plugins.length === 0) return;

    const pluginContext: PluginContext = {
      events: platformEvents,
      getConfig: <T = unknown>(key: string, defaultValue?: T): T => {
        // Simple config access from provider config
        const configRecord = config as unknown as Record<string, unknown>;
        return (configRecord[key] as T) ?? (defaultValue as T);
      },
      registerCleanup: (fn: () => void) => {
        pluginCleanupsRef.current.push(fn);
      },
      reportIssue: (issue) => {
        setIssues((prev) => [
          ...prev,
          { ...issue, timestamp: Date.now() },
        ]);
      },
      version: '1.0.0',
      environment: typeof window !== 'undefined' ? (window as any).__PALETTE_ENV__ || 'development' : 'server',
    };

    const { loaded, cleanups } = loadPlugins(plugins, pluginContext, logger);
    setLoadedPlugins(loaded);
    pluginCleanupsRef.current.push(...cleanups);

    return () => {
      // Cleanup plugins on unmount
      for (const cleanup of pluginCleanupsRef.current) {
        try {
          cleanup();
        } catch (err) {
          logger.error('Plugin cleanup error:', err);
        }
      }
      pluginCleanupsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Listen for Session Expiry via Auth Events ─────────

  useEffect(() => {
    // Listen for auth session-expired via the auth module's event bus
    // and re-emit as platform event
    const handleSessionExpired = () => {
      logger.debug('Platform detected session expiry');
      platformEvents.emit('platform:session-expired');
    };

    // Use DOM custom events as bridge between auth and platform event buses
    window.addEventListener('palette:auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('palette:auth:session-expired', handleSessionExpired);
    };
  }, [logger]);

  // ── Lifecycle Callbacks ──────────────────────────────

  const lifecycleRef = useRef(config.lifecycle);
  lifecycleRef.current = config.lifecycle;

  // ── Retry Handler ────────────────────────────────────

  const retry = useCallback(() => {
    logger.debug('Platform retry triggered');
    setError(null);
    setIssues([]);
    transitionPhase('initializing');
    // Re-mount will trigger re-initialization
    window.location.reload();
  }, [logger, transitionPhase]);

  // ── Diagnostics ──────────────────────────────────────

  const getDiagnostics = useCallback((): PlatformDiagnostics => {
    const diag: PlatformDiagnostics = {
      version: '1.0.0',
      environment: typeof window !== 'undefined' ? (window as any).__PALETTE_ENV__ || 'development' : 'server',
      bootTimeMs: Date.now() - bootStartTime.current,
      phase,
      issueCount: issues.length,
      pluginCount: loadedPlugins.length,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: Date.now(),
    };

    // Memory usage (if available)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      diag.memoryUsage = {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }

    // Navigation timing
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      diag.timing = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    }

    return diag;
  }, [phase, issues.length, loadedPlugins.length]);

  // ── Context Value ────────────────────────────────────

  const contextValue = useMemo<PlatformContextValue>(
    () => ({
      phase,
      ready: phase === 'ready' || phase === 'degraded',
      degraded: phase === 'degraded',
      bootTimeMs: Date.now() - bootStartTime.current,
      issues,
      error,
      events: platformEvents,
      version: {
        current: '1.0.0',
        latest: null,
        updateAvailable: false,
        checkedAt: null,
        releaseNotesUrl: null,
      },
      health: {
        status: 'unknown',
        services: [],
        checkedAt: 0,
        checkIntervalMs: config.healthCheckIntervalMs,
      },
      retry,
      getDiagnostics,
    }),
    [phase, issues, error, config.healthCheckIntervalMs, retry, getDiagnostics]
  );

  return (
    <PlatformContext.Provider value={contextValue}>
      {children}
    </PlatformContext.Provider>
  );
}

// ─── Authenticated Providers ─────────────────────────────

function AuthenticatedProviders({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return null; // Wait for auth check
  }

  if (!authenticated) {
    return <>{children}</>; // Public pages without Config/Context
  }

  return (
    <ConfigProvider>
      <ContextProvider>
        {children}
      </ContextProvider>
    </ConfigProvider>
  );
}

// ─── Main PaletteProvider ────────────────────────────────

interface PaletteProviderProps {
  children: ReactNode;
  config?: PaletteProviderConfig;
}

export function PaletteProvider({ children, config }: PaletteProviderProps) {
  const mergedConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
    }),
    [config]
  );

  const logger = useMemo(() => createLogger(mergedConfig.debug), [mergedConfig.debug]);

  // ── Boot Sequence ────────────────────────────────────

  const bootStartTime = useRef(Date.now());

  useEffect(() => {
    logger.info('Palette platform booting...');
    platformEvents.emit('platform:boot-start', { timestamp: bootStartTime.current });

    // Mark as ready after a microtask to allow child providers to initialize
    const readyTimer = setTimeout(() => {
      const bootTime = Date.now() - bootStartTime.current;
      logger.info(`Palette platform ready in ${bootTime}ms`);

      const readyInfo: PlatformReadyInfo = {
        bootTimeMs: bootTime,
        version: '1.0.0',
        environment: typeof window !== 'undefined' ? (window as any).__PALETTE_ENV__ || 'development' : 'server',
        userId: null, // Will be enriched by auth events
        loadedPlugins: mergedConfig.plugins?.map((p) => p.name) ?? [],
      };

      platformEvents.emit('platform:ready', readyInfo);

      // Call lifecycle callback
      mergedConfig.lifecycle?.onReady?.(readyInfo);
    }, 0);

    return () => clearTimeout(readyTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ───────────────────────────────────────────

  return (
    <ErrorBoundary>
      <InternalPlatformProvider config={mergedConfig}>
        <AuthProvider config={{ debug: mergedConfig.debug }}>
          <AuthenticatedProviders>
            {children}
          </AuthenticatedProviders>
        </AuthProvider>
      </InternalPlatformProvider>
    </ErrorBoundary>
  );
}

// ─── Hooks ───────────────────────────────────────────────

/**
 * Hook to access the platform context.
 * Must be used within a PaletteProvider.
 */
export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error(
      '[@palette/core] usePlatform must be used within a PaletteProvider. ' +
      'Wrap your application with <PaletteProvider> to fix this.'
    );
  }
  return context;
}

/**
 * Hook to access the platform event bus.
 */
export function usePlatformEvents() {
  return platformEvents;
}

/**
 * Hook to access platform diagnostics.
 */
export function usePlatformDiagnostics(): PlatformDiagnostics {
  const context = useContext(PlatformContext);
  if (!context) return {} as PlatformDiagnostics;
  return context.getDiagnostics();
}
