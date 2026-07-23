/**
 * @palette/core — usePlatformLifecycle
 *
 * Hook for subscribing to platform lifecycle events.
 * Allows components to react to platform state transitions
 * without directly accessing the platform context.
 *
 * Usage:
 *   usePlatformLifecycle({
 *     onReady: (info) => console.log('Ready in', info.bootTimeMs, 'ms'),
 *     onError: (error) => reportError(error),
 *     onSessionExpired: () => showSessionModal(),
 *   });
 */

import { useEffect, useRef } from 'react';
import { platformEvents } from './platformEvents';
import type {
  PlatformLifecycleCallbacks,
  PlatformReadyInfo,
  PlatformFatalError,
  PlatformIssue,
  PlatformPhase,
} from './types';

/**
 * Subscribe to platform lifecycle events.
 * Callbacks are automatically cleaned up on unmount.
 *
 * @param callbacks - Lifecycle event callbacks
 *
 * @example
 *   function App() {
 *     usePlatformLifecycle({
 *       onReady: (info) => {
 *         analytics.track('platform_ready', { bootTime: info.bootTimeMs });
 *       },
 *       onSessionExpired: () => {
 *         showNotification('Session expired. Please log in again.');
 *       },
 *     });
 *
 *     return <Router />;
 *   }
 */
export function usePlatformLifecycle(callbacks: PlatformLifecycleCallbacks): void {
  // Use refs to avoid re-subscribing when callback references change
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // ── onReady ────────────────────────────────────────
    if (callbacksRef.current.onReady) {
      const unsub = platformEvents.on('platform:ready', (event) => {
        callbacksRef.current.onReady?.(event.payload as PlatformReadyInfo);
      });
      unsubscribers.push(unsub);
    }

    // ── onError ────────────────────────────────────────
    if (callbacksRef.current.onError) {
      const unsub = platformEvents.on('platform:error', (event) => {
        callbacksRef.current.onError?.(event.payload as PlatformFatalError);
      });
      unsubscribers.push(unsub);
    }

    // ── onDegraded ─────────────────────────────────────
    if (callbacksRef.current.onDegraded) {
      const unsub = platformEvents.on('platform:degraded', (event) => {
        callbacksRef.current.onDegraded?.(event.payload as PlatformIssue[]);
      });
      unsubscribers.push(unsub);
    }

    // ── onPhaseChange ──────────────────────────────────
    if (callbacksRef.current.onPhaseChange) {
      const unsub = platformEvents.on('platform:phase-change', (event) => {
        const { phase, prevPhase } = event.payload as { phase: PlatformPhase; prevPhase: PlatformPhase };
        callbacksRef.current.onPhaseChange?.(phase, prevPhase);
      });
      unsubscribers.push(unsub);
    }

    // ── onSessionExpired ───────────────────────────────
    if (callbacksRef.current.onSessionExpired) {
      const unsub = platformEvents.on('platform:session-expired', () => {
        callbacksRef.current.onSessionExpired?.();
      });
      unsubscribers.push(unsub);
    }

    // ── onBeforeUnload ─────────────────────────────────
    if (callbacksRef.current.onBeforeUnload) {
      const handleBeforeUnload = () => {
        callbacksRef.current.onBeforeUnload?.();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      unsubscribers.push(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      });
    }

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []); // Empty deps — callbacks accessed via ref
}

/**
 * Hook that returns the current platform phase.
 * Re-renders when phase changes.
 *
 * @example
 *   function StatusBar() {
 *     const phase = usePlatformPhase();
 *     if (phase === 'initializing') return <Spinner />;
 *     if (phase === 'error') return <ErrorPage />;
 *     return <App />;
 *   }
 */
export function usePlatformPhase(): PlatformPhase {
  const [phase, setPhase] = React.useState<PlatformPhase>('idle');

  React.useEffect(() => {
    // Listen for phase changes
    const unsub = platformEvents.on('platform:phase-change', (event) => {
      const { phase: newPhase } = event.payload as { phase: PlatformPhase };
      setPhase(newPhase);
    });

    // Check if already ready (event may have fired before this hook)
    const history = platformEvents.getHistoryByType('platform:ready');
    if (history.length > 0) {
      setPhase('ready');
    }

    const errorHistory = platformEvents.getHistoryByType('platform:error');
    if (errorHistory.length > 0) {
      setPhase('error');
    }

    return unsub;
  }, []);

  return phase;
}

/**
 * Hook that returns whether the platform is ready.
 *
 * @example
 *   function App() {
 *     const isReady = useIsPlatformReady();
 *     if (!isReady) return <LoadingScreen />;
 *     return <MainApp />;
 *   }
 */
export function useIsPlatformReady(): boolean {
  const phase = usePlatformPhase();
  return phase === 'ready' || phase === 'degraded';
}

// Need React import for useState/useEffect in usePlatformPhase
import React from 'react';
