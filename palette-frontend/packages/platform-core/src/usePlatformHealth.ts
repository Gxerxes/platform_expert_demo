/**
 * @palette/core — usePlatformHealth
 *
 * Hook for monitoring platform health status.
 * Periodically checks BFF health endpoint and
 * provides service-level health information.
 *
 * Features:
 * - Periodic health polling
 * - Per-service health status
 * - Degraded mode detection
 * - Event emission on health changes
 *
 * Usage:
 *   const { status, services, checkedAt } = usePlatformHealth();
 *   if (status === 'degraded') return <WarningBanner />;
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { platformEvents } from './platformEvents';
import type {
  PlatformHealthStatus,
  ServiceHealth,
  HealthCheckResponse,
} from './types';

// ─── Constants ────────────────────────────────────────────

const DEFAULT_HEALTH_ENDPOINT = '/palette/api/v1/system/health';
const DEFAULT_CHECK_INTERVAL = 30 * 1000; // 30 seconds

// ─── Default State ───────────────────────────────────────

const DEFAULT_HEALTH: PlatformHealthStatus = {
  status: 'unknown',
  services: [],
  checkedAt: 0,
  checkIntervalMs: DEFAULT_CHECK_INTERVAL,
};

// ─── Health Fetch ────────────────────────────────────────

async function fetchHealth(endpoint: string): Promise<PlatformHealthStatus> {
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const responseTime = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data: HealthCheckResponse = await response.json();

    // Map BFF health response to our format
    const services: ServiceHealth[] = (data.checks || []).map((check) => ({
      name: check.name,
      status: mapServiceStatus(check.status),
      responseTimeMs: responseTime,
      lastUpAt: check.status === 'UP' ? Date.now() : undefined,
    }));

    // Determine overall status
    let overallStatus: PlatformHealthStatus['status'] = 'healthy';
    if (data.status === 'DOWN') {
      overallStatus = 'unhealthy';
    } else if (data.status === 'DEGRADED' || services.some((s) => s.status === 'degraded')) {
      overallStatus = 'degraded';
    } else if (services.some((s) => s.status === 'down')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services,
      checkedAt: Date.now(),
      checkIntervalMs: DEFAULT_CHECK_INTERVAL,
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);

    return {
      status: 'unhealthy',
      services: [
        {
          name: 'bff',
          status: 'down',
          responseTimeMs: responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      checkedAt: Date.now(),
      checkIntervalMs: DEFAULT_CHECK_INTERVAL,
    };
  }
}

function mapServiceStatus(
  status: string
): ServiceHealth['status'] {
  switch (status) {
    case 'UP': return 'up';
    case 'DOWN': return 'down';
    case 'DEGRADED': return 'degraded';
    default: return 'unknown';
  }
}

// ─── Hook ────────────────────────────────────────────────

interface UsePlatformHealthOptions {
  /** Health check endpoint */
  endpoint?: string;
  /** Check interval (ms). 0 to disable polling. */
  checkIntervalMs?: number;
  /** Enable health checking */
  enabled?: boolean;
  /** Callback when health status changes */
  onStatusChange?: (status: PlatformHealthStatus['status'], prevStatus: PlatformHealthStatus['status']) => void;
}

interface UsePlatformHealthReturn extends PlatformHealthStatus {
  /** Manually trigger a health check */
  checkHealth: () => Promise<void>;
  /** Whether a check is currently in progress */
  checking: boolean;
  /** Whether all services are healthy */
  isHealthy: boolean;
  /** Get a specific service's health */
  getServiceHealth: (name: string) => ServiceHealth | undefined;
}

export function usePlatformHealth(
  options: UsePlatformHealthOptions = {}
): UsePlatformHealthReturn {
  const {
    endpoint = DEFAULT_HEALTH_ENDPOINT,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL,
    enabled = true,
    onStatusChange,
  } = options;

  const [health, setHealth] = useState<PlatformHealthStatus>(DEFAULT_HEALTH);
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const prevStatusRef = useRef<PlatformHealthStatus['status']>('unknown');
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Health check function
  const checkHealth = useCallback(async () => {
    if (!enabled) return;

    setChecking(true);
    try {
      const newHealth = await fetchHealth(endpoint);

      if (mountedRef.current) {
        setHealth(newHealth);

        // Check for status change
        if (newHealth.status !== prevStatusRef.current) {
          const prevStatus = prevStatusRef.current;
          prevStatusRef.current = newHealth.status;

          // Emit event
          platformEvents.emit('platform:health-change', {
            status: newHealth.status,
            prevStatus,
            services: newHealth.services,
          });

          // Call callback
          onStatusChangeRef.current?.(newHealth.status, prevStatus);
        }
      }
    } finally {
      if (mountedRef.current) {
        setChecking(false);
      }
    }
  }, [endpoint, enabled]);

  // Initial check + interval
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkHealth();

    // Set up polling interval
    if (checkIntervalMs > 0) {
      intervalRef.current = setInterval(checkHealth, checkIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkHealth, checkIntervalMs, enabled]);

  // Computed values
  const isHealthy = health.status === 'healthy';

  const getServiceHealth = useCallback(
    (name: string): ServiceHealth | undefined => {
      return health.services.find((s) => s.name === name);
    },
    [health.services]
  );

  return {
    ...health,
    checkHealth,
    checking,
    isHealthy,
    getServiceHealth,
  };
}

/**
 * Simple hook to check if the platform is healthy.
 * Returns boolean — true if all services are up.
 */
export function useIsPlatformHealthy(): boolean {
  const { isHealthy } = usePlatformHealth({ enabled: true });
  return isHealthy;
}
