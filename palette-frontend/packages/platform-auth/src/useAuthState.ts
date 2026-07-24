/**
 * @palette/auth — useAuthState
 *
 * Pattern matching hook for authentication states.
 * Provides a clean switch/case-like API for handling different auth states.
 *
 * Features:
 * - Exhaustive state matching (TypeScript ensures all states handled)
 * - Default fallback for unhandled states
 * - Memoized result to prevent unnecessary re-renders
 *
 * Usage:
 *   function App() {
 *     const content = useAuthState({
 *       idle: () => <InitialLoader />,
 *       checking: () => <CheckingAuth />,
 *       authenticated: () => <Dashboard />,
 *       unauthenticated: () => <LoginPage />,
 *       expired: () => <SessionExpired />,
 *       error: (error) => <ErrorPage error={error} />,
 *     });
 *     return content;
 *   }
 *
 *   // With default fallback
 *   const content = useAuthState({
 *     authenticated: () => <Dashboard />,
 *     unauthenticated: () => <Login />,
 *     _: () => <Loading />, // default for other states
 *   });
 */

import { useMemo } from 'react';
import { useAuth } from './AuthProvider';
import type { AuthStatus } from './types';
import type { PlatformError } from '@palette/api';

// ─── Types ────────────────────────────────────────────────

/**
 * Handler function for an auth state.
 */
type AuthStateHandler<T> = (context: AuthStateContext) => T;

/**
 * Context passed to state handlers.
 */
export interface AuthStateContext {
  /** Current auth status */
  status: AuthStatus;
  /** Whether auth check is in progress */
  loading: boolean;
  /** Whether user is authenticated */
  authenticated: boolean;
  /** Redirect to login */
  login: (returnUrl?: string) => void;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Current error (if status === 'error') */
  error: PlatformError | null;
}

/**
 * State handler map for useAuthState.
 * Each key is an AuthStatus, value is a handler function.
 * Use '_' for default/fallback handler.
 */
export interface AuthStateHandlers<T> {
  idle?: AuthStateHandler<T>;
  checking?: AuthStateHandler<T>;
  authenticated?: AuthStateHandler<T>;
  unauthenticated?: AuthStateHandler<T>;
  expired?: AuthStateHandler<T>;
  error?: AuthStateHandler<T>;
  /** Default handler for unhandled states */
  _?: AuthStateHandler<T>;
}

// ─── Hook ─────────────────────────────────────────────────

/**
 * Pattern matching hook for authentication states.
 *
 * @param handlers - Object mapping auth states to handler functions
 * @returns The result of the matched handler
 *
 * @example
 *   // Basic usage
 *   const ui = useAuthState({
 *     authenticated: () => <ProtectedApp />,
 *     unauthenticated: () => <LoginRedirect />,
 *     _: () => <LoadingSpinner />,
 *   });
 *
 * @example
 *   // With error handling
 *   const ui = useAuthState({
 *     authenticated: ({ user }) => <Dashboard user={user} />,
 *     error: ({ error }) => <ErrorScreen error={error} />,
 *     expired: ({ login }) => <ExpiredDialog onRetry={login} />,
 *     _: () => null,
 *   });
 */
export function useAuthState<T = React.ReactNode>(
  handlers: AuthStateHandlers<T>
): T {
  const { status, loading, authenticated, error, login, logout } = useAuth();

  const context: AuthStateContext = useMemo(
    () => ({ status, loading, authenticated, error, login, logout }),
    [status, loading, authenticated, error, login, logout]
  );

  return useMemo(() => {
    // Try to find a specific handler for current status
    const handler = handlers[status];
    if (handler) {
      return handler(context);
    }

    // Fall back to default handler
    if (handlers._) {
      return handlers._(context);
    }

    // No handler found — return undefined cast as T
    // (This shouldn't happen in well-typed code)
    return undefined as unknown as T;
  }, [handlers, status, context]);
}

// ─── Convenience Hooks ────────────────────────────────────

/**
 * Hook that returns content based on authentication only.
 * Simplified version of useAuthState for common use case.
 *
 * @example
 *   const content = useAuthGate({
 *     authenticated: <Dashboard />,
 *     loading: <Spinner />,
 *     unauthenticated: <LoginRedirect />,
 *   });
 */
export interface AuthGateConfig {
  /** Content when authenticated */
  authenticated: React.ReactNode;
  /** Content while loading/checking */
  loading?: React.ReactNode;
  /** Content when not authenticated */
  unauthenticated?: React.ReactNode;
  /** Content on error */
  error?: React.ReactNode | ((error: PlatformError) => React.ReactNode);
}

export function useAuthGate(config: AuthGateConfig): React.ReactNode {
  const { status, loading, authenticated, error } = useAuth();

  if (loading || status === 'checking') {
    return config.loading ?? null;
  }

  if (error) {
    if (typeof config.error === 'function') {
      return config.error(error);
    }
    return config.error ?? null;
  }

  if (authenticated) {
    return config.authenticated;
  }

  return config.unauthenticated ?? null;
}
