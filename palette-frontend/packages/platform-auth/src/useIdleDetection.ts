/**
 * @palette/auth — useIdleDetection
 *
 * Enterprise-grade user idle detection for session security.
 * Monitors user activity and triggers actions when user becomes idle.
 *
 * Features:
 * - Configurable idle timeout
 * - Multiple activity event listeners
 * - Warning before auto-logout
 * - Integration with auth event bus
 * - Visibility change detection (tab switching)
 * - Touch and keyboard activity tracking
 *
 * Usage:
 *   function SecurityMonitor() {
 *     const { isIdle, isWarning, remainingTime, resetIdle } = useIdleDetection({
 *       idleTimeout: 15 * 60, // 15 minutes
 *       warningTimeout: 60,   // Warn 60 seconds before logout
 *       onIdle: () => logout(),
 *       onWarning: (remaining) => showWarning(remaining),
 *     });
 *
 *     if (isWarning) return <IdleWarningDialog onExtend={resetIdle} time={remainingTime} />;
 *     return null;
 *   }
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authEvents } from './authEvents';

// ─── Types ────────────────────────────────────────────────

/**
 * Activity events to monitor.
 */
export type ActivityEvent =
  | 'mousemove'
  | 'mousedown'
  | 'keydown'
  | 'keypress'
  | 'touchstart'
  | 'scroll'
  | 'click'
  | 'focus';

/**
 * Configuration options for useIdleDetection.
 */
export interface UseIdleDetectionOptions {
  /** Seconds of inactivity before considered idle (default: 900 = 15 min) */
  idleTimeout: number;
  /** Seconds before idle to show warning (default: 60) */
  warningTimeout?: number;
  /** Callback when user becomes idle */
  onIdle?: () => void;
  /** Callback when warning threshold is reached */
  onWarning?: (remainingSeconds: number) => void;
  /** Callback when user activity resumes */
  onActive?: () => void;
  /** Activity events to listen for (default: all) */
  events?: ActivityEvent[];
  /** Whether to enable detection (default: true) */
  enabled?: boolean;
  /** Whether to pause on visibility hidden (default: true) */
  pauseOnHidden?: boolean;
  /** Throttle activity events in ms (default: 1000) */
  throttleMs?: number;
}

/**
 * Return value from useIdleDetection.
 */
export interface UseIdleDetectionResult {
  /** Whether user is currently idle */
  isIdle: boolean;
  /** Whether in warning zone (about to become idle) */
  isWarning: boolean;
  /** Seconds since last activity */
  idleSeconds: number;
  /** Seconds remaining until idle */
  remainingSeconds: number;
  /** Seconds remaining until warning (if configured) */
  warningRemainingSeconds: number;
  /** Reset idle timer (mark user as active) */
  resetIdle: () => void;
  /** Whether detection is currently active */
  isActive: boolean;
  /** Pause detection */
  pause: () => void;
  /** Resume detection */
  resume: () => void;
  /** Last activity timestamp */
  lastActivityAt: number;
}

// ─── Default Events ───────────────────────────────────────

const DEFAULT_EVENTS: ActivityEvent[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'click',
  'scroll',
  'focus',
];

// ─── Hook ─────────────────────────────────────────────────

/**
 * Detect user idle state for session security.
 *
 * @example
 *   // Basic usage
 *   const { isIdle, resetIdle } = useIdleDetection({
 *     idleTimeout: 900, // 15 minutes
 *     onIdle: () => logout(),
 *   });
 *
 * @example
 *   // With warning
 *   const { isWarning, remainingSeconds, resetIdle } = useIdleDetection({
 *     idleTimeout: 900,
 *     warningTimeout: 60,
 *     onIdle: () => autoLogout(),
 *     onWarning: (remaining) => showCountdown(remaining),
 *   });
 */
export function useIdleDetection(options: UseIdleDetectionOptions): UseIdleDetectionResult {
  const {
    idleTimeout,
    warningTimeout = 60,
    onIdle,
    onWarning,
    onActive,
    events = DEFAULT_EVENTS,
    enabled = true,
    pauseOnHidden = true,
    throttleMs = 1000,
  } = options;

  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const warningFiredRef = useRef(false);
  const idleFiredRef = useRef(false);
  const lastThrottleRef = useRef(0);
  const onIdleRef = useRef(onIdle);
  const onWarningRef = useRef(onWarning);
  const onActiveRef = useRef(onActive);

  // Keep callback refs current
  useEffect(() => { onIdleRef.current = onIdle; }, [onIdle]);
  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);
  useEffect(() => { onActiveRef.current = onActive; }, [onActive]);

  const isActive = enabled && !isPaused;
  const remainingSeconds = Math.max(0, idleTimeout - idleSeconds);
  const warningRemainingSeconds = Math.max(0, warningTimeout - Math.max(0, idleSeconds - (idleTimeout - warningTimeout)));

  // Reset idle timer
  const resetIdle = useCallback(() => {
    const now = Date.now();
    setLastActivityAt(now);
    setIdleSeconds(0);
    setIsIdle(false);
    warningFiredRef.current = false;
    idleFiredRef.current = false;
  }, []);

  // Pause/resume
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    setIsPaused(false);
    resetIdle(); // Reset on resume to avoid immediate idle
  }, [resetIdle]);

  // Activity handler (throttled)
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current < throttleMs) return;
    lastThrottleRef.current = now;

    if (isIdle) {
      // User became active again
      setIsIdle(false);
      onActiveRef.current?.();
      authEvents.emit('auth:session-refresh', { reason: 'user-active' });
    }

    setLastActivityAt(now);
    setIdleSeconds(0);
    warningFiredRef.current = false;
    idleFiredRef.current = false;
  }, [isIdle, throttleMs]);

  // Listen for activity events
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (pauseOnHidden && document.hidden) {
        pause();
      } else if (!document.hidden) {
        resume();
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (pauseOnHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [isActive, events, pauseOnHidden, handleActivity, pause, resume]);

  // Idle timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const seconds = Math.floor((now - lastActivityAt) / 1000);
      setIdleSeconds(seconds);

      // Check idle
      if (seconds >= idleTimeout && !idleFiredRef.current) {
        idleFiredRef.current = true;
        setIsIdle(true);
        authEvents.emit('auth:session-expired', { reason: 'idle-timeout', idleSeconds: seconds });
        onIdleRef.current?.();
        return;
      }

      // Check warning
      const warningThreshold = idleTimeout - warningTimeout;
      if (seconds >= warningThreshold && !warningFiredRef.current) {
        warningFiredRef.current = true;
        const remaining = idleTimeout - seconds;
        onWarningRef.current?.(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, lastActivityAt, idleTimeout, warningTimeout]);

  // Reset on enable
  useEffect(() => {
    if (enabled) {
      resetIdle();
    }
  }, [enabled, resetIdle]);

  return useMemo(
    () => ({
      isIdle,
      isWarning: !isIdle && idleSeconds >= idleTimeout - warningTimeout,
      idleSeconds,
      remainingSeconds,
      warningRemainingSeconds,
      resetIdle,
      isActive,
      pause,
      resume,
      lastActivityAt,
    }),
    [isIdle, idleSeconds, remainingSeconds, warningRemainingSeconds, resetIdle, isActive, pause, resume, lastActivityAt, idleTimeout, warningTimeout]
  );
}
