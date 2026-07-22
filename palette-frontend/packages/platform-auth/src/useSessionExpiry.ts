/**
 * @palette/auth — Session Expiry Hook
 *
 * Monitors session expiry and provides countdown + warning capabilities.
 *
 * Features:
 * - Real-time countdown of remaining session time
 * - Configurable warning threshold
 * - Auto-refresh option before expiry
 * - Integration with auth event bus
 *
 * Usage:
 *   function SessionBanner() {
 *     const { remainingSeconds, isExpiringSoon, isExpired, extendSession } = useSessionExpiry({
 *       warningBeforeSeconds: 300,
 *       onWarning: () => showToast('Session expiring soon'),
 *       onExpired: () => redirectToLogin(),
 *     });
 *
 *     if (isExpired) return <SessionExpiredDialog />;
 *     if (isExpiringSoon) return <WarningBanner time={remainingSeconds} onExtend={extendSession} />;
 *     return null;
 *   }
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { authEvents } from './authEvents';
import type { SessionExpiryConfig } from './types';

// ─── Types ────────────────────────────────────────────────

interface UseSessionExpiryOptions {
  /** Seconds before expiry to trigger warning (default: 300 = 5 min) */
  warningBeforeSeconds?: number;
  /** Callback when warning threshold is reached */
  onWarning?: (remainingSeconds: number) => void;
  /** Callback when session expires */
  onExpired?: () => void;
  /** Whether to auto-refresh session before expiry (default: false) */
  autoRefresh?: boolean;
  /** Seconds before expiry to auto-refresh (default: 60) */
  autoRefreshBeforeSeconds?: number;
  /** Update interval in milliseconds (default: 1000) */
  intervalMs?: number;
}

interface UseSessionExpiryResult {
  /** Remaining seconds until session expires */
  remainingSeconds: number;
  /** Total session duration in seconds */
  totalSeconds: number;
  /** Progress percentage (0-100, where 100 = just started) */
  progressPercent: number;
  /** Whether session is in the warning zone */
  isExpiringSoon: boolean;
  /** Whether session has expired */
  isExpired: boolean;
  /** Whether session expiry monitoring is active */
  isActive: boolean;
  /** Manually extend/refresh the session */
  extendSession: () => Promise<void>;
  /** Formatted remaining time string (e.g., "4:32") */
  formattedTime: string;
}

// ─── Helpers ──────────────────────────────────────────────

/**
 * Parse ISO 8601 timestamp to milliseconds.
 */
function parseExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  const timestamp = new Date(expiry).getTime();
  if (isNaN(timestamp)) return null;
  return timestamp;
}

/**
 * Format seconds to MM:SS or HH:MM:SS string.
 */
function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// ─── Hook ─────────────────────────────────────────────────

/**
 * Monitor session expiry with countdown and warning capabilities.
 */
export function useSessionExpiry(options: UseSessionExpiryOptions = {}): UseSessionExpiryResult {
  const {
    warningBeforeSeconds = 300,
    onWarning,
    onExpired,
    autoRefresh = false,
    autoRefreshBeforeSeconds = 60,
    intervalMs = 1000,
  } = options;

  const { expiresAt, authenticated, refreshSession } = useAuth();
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const warningFiredRef = useRef(false);
  const autoRefreshFiredRef = useRef(false);
  const onWarningRef = useRef(onWarning);
  const onExpiredRef = useRef(onExpired);

  // Keep callback refs up to date
  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // Calculate expiry timestamp
  const expiryMs = useMemo(() => parseExpiry(expiresAt), [expiresAt]);

  // Reset state when expiry changes
  useEffect(() => {
    warningFiredRef.current = false;
    autoRefreshFiredRef.current = false;
    setIsExpired(false);

    if (!expiryMs || !authenticated) {
      setIsActive(false);
      setRemainingSeconds(0);
      setTotalSeconds(0);
      return;
    }

    setIsActive(true);
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiryMs - now) / 1000));
    setRemainingSeconds(remaining);
    setTotalSeconds(remaining); // Initial total is the remaining time
  }, [expiryMs, authenticated]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || isExpired) return;

    const interval = setInterval(() => {
      if (!expiryMs) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryMs - now) / 1000));
      setRemainingSeconds(remaining);

      // Check if expired
      if (remaining <= 0) {
        setIsExpired(true);
        setIsActive(false);
        authEvents.emit('auth:session-expired', { expiresAt });
        onExpiredRef.current?.();
        return;
      }

      // Check warning threshold
      if (remaining <= warningBeforeSeconds && !warningFiredRef.current) {
        warningFiredRef.current = true;
        authEvents.emit('auth:session-expired', { warning: true, remainingSeconds: remaining });
        onWarningRef.current?.(remaining);
      }

      // Auto-refresh
      if (autoRefresh && remaining <= autoRefreshBeforeSeconds && !autoRefreshFiredRef.current) {
        autoRefreshFiredRef.current = true;
        refreshSession().catch((err) => {
          console.error('[Palette Auth] Auto-refresh failed:', err);
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isActive, isExpired, expiryMs, warningBeforeSeconds, autoRefresh, autoRefreshBeforeSeconds, intervalMs, refreshSession]);

  // Extend session
  const extendSession = useCallback(async () => {
    await refreshSession();
    warningFiredRef.current = false;
    autoRefreshFiredRef.current = false;
    setIsExpired(false);
  }, [refreshSession]);

  // Calculate progress
  const progressPercent = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  }, [remainingSeconds, totalSeconds]);

  // Warning zone check
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= warningBeforeSeconds;

  return {
    remainingSeconds,
    totalSeconds,
    progressPercent,
    isExpiringSoon,
    isExpired,
    isActive,
    extendSession,
    formattedTime: formatTime(remainingSeconds),
  };
}
