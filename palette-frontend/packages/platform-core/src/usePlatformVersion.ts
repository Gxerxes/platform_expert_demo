/**
 * @palette/core — usePlatformVersion
 *
 * Hook for platform version management.
 * Checks for available updates and provides version info.
 *
 * Features:
 * - Periodic version check against BFF
 * - Update availability detection
 * - Force update support
 * - Manual refresh capability
 *
 * Usage:
 *   const { current, updateAvailable, latest } = usePlatformVersion();
 *   if (updateAvailable) return <UpdateBanner />;
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { platformEvents } from './platformEvents';
import type { PlatformVersionInfo, VersionCheckResponse } from './types';

// ─── Constants ────────────────────────────────────────────

const DEFAULT_VERSION_ENDPOINT = '/palette/api/v1/system/info';
const DEFAULT_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

// ─── Module-level Cache ──────────────────────────────────

let versionCache: { info: PlatformVersionInfo; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Default State ───────────────────────────────────────

const DEFAULT_VERSION_INFO: PlatformVersionInfo = {
  current: '0.0.0',
  latest: null,
  updateAvailable: false,
  checkedAt: null,
  releaseNotesUrl: null,
};

// ─── Version Fetch ───────────────────────────────────────

async function fetchVersionInfo(endpoint: string): Promise<PlatformVersionInfo> {
  // Check cache first
  if (versionCache && Date.now() - versionCache.timestamp < CACHE_TTL) {
    return versionCache.info;
  }

  try {
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Version check failed: ${response.status}`);
    }

    const data = await response.json();

    // BFF /system/info returns { version, ... }
    const info: PlatformVersionInfo = {
      current: data.version || data.app?.version || '0.0.0',
      latest: data.latestVersion || data.version || null,
      updateAvailable: false, // Server determines this
      checkedAt: Date.now(),
      releaseNotesUrl: data.releaseNotesUrl || null,
    };

    // Check if force update is needed
    if (data.forceUpdate && data.minSupportedVersion) {
      const currentParts = info.current.split('.').map(Number);
      const minParts = data.minSupportedVersion.split('.').map(Number);

      if (compareVersions(currentParts, minParts) < 0) {
        info.updateAvailable = true;
      }
    }

    // Update cache
    versionCache = { info, timestamp: Date.now() };

    // Emit event
    platformEvents.emit('platform:version-check', info);

    return info;
  } catch (error) {
    // Silently fail — version check is non-critical
    console.debug('[Palette Core] Version check failed:', error);
    return {
      ...DEFAULT_VERSION_INFO,
      checkedAt: Date.now(),
    };
  }
}

/**
 * Compare two semver arrays.
 * Returns -1, 0, or 1.
 */
function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const aPart = a[i] || 0;
    const bPart = b[i] || 0;
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  return 0;
}

// ─── Hook ────────────────────────────────────────────────

interface UsePlatformVersionOptions {
  /** Version check endpoint */
  endpoint?: string;
  /** Auto-check interval (ms). 0 to disable. */
  checkIntervalMs?: number;
  /** Enable version checking */
  enabled?: boolean;
}

interface UsePlatformVersionReturn extends PlatformVersionInfo {
  /** Manually trigger a version check */
  checkForUpdate: () => Promise<void>;
  /** Whether a check is currently in progress */
  checking: boolean;
  /** Whether force update is required */
  forceUpdate: boolean;
}

export function usePlatformVersion(
  options: UsePlatformVersionOptions = {}
): UsePlatformVersionReturn {
  const {
    endpoint = DEFAULT_VERSION_ENDPOINT,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL,
    enabled = true,
  } = options;

  const [versionInfo, setVersionInfo] = useState<PlatformVersionInfo>(() => {
    // Initialize from cache if available
    if (versionCache && Date.now() - versionCache.timestamp < CACHE_TTL) {
      return versionCache.info;
    }
    return DEFAULT_VERSION_INFO;
  });
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Version check function
  const checkForUpdate = useCallback(async () => {
    if (!enabled) return;

    setChecking(true);
    try {
      const info = await fetchVersionInfo(endpoint);
      if (mountedRef.current) {
        setVersionInfo(info);
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
    checkForUpdate();

    // Set up interval
    if (checkIntervalMs > 0) {
      intervalRef.current = setInterval(checkForUpdate, checkIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkForUpdate, checkIntervalMs, enabled]);

  // Determine force update
  const forceUpdate = useMemo(() => {
    // Force update if version check indicates it
    return versionInfo.updateAvailable && versionInfo.current === '0.0.0';
  }, [versionInfo]);

  return {
    ...versionInfo,
    checkForUpdate,
    checking,
    forceUpdate,
  };
}

/**
 * Simple hook to get just the current version string.
 */
export function usePlatformVersionString(): string {
  const { current } = usePlatformVersion({ enabled: true, checkIntervalMs: 0 });
  return current;
}
