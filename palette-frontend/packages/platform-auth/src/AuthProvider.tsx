/**
 * @palette/auth — AuthProvider
 *
 * Enterprise-grade authentication provider for the Palette platform.
 *
 * Features:
 * - OIDC session management via BFF
 * - User info enrichment from eIDP claims
 * - Permission & role management
 * - Auth lifecycle event emission
 * - Session expiry warning
 * - Automatic retry with configurable limits
 * - Debug logging for development
 *
 * Architecture:
 *   AuthProvider wraps the application and provides authentication context.
 *   It communicates with BFF for session validation and user info retrieval.
 *   Auth events are emitted for cross-component communication.
 *
 * Usage:
 *   <AuthProvider config={{ debug: true }}>
 *     <App />
 *   </AuthProvider>
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
import {
  checkSession,
  fetchEidpUserInfo,
  classifyError,
  setLoggingOut,
  type PlatformError,
  type SessionInfo,
  type EidpUserInfo,
} from '@palette/api';

import type {
  AuthContextValue,
  AuthProviderProps,
  AuthProviderConfig,
  AuthState,
  AuthStatus,
  PaletteUser,
} from './types';
import { authEvents } from './authEvents';
import { initAuthSync, destroyAuthSync, authSync } from './multiTabSync';
import {
  hasPermission as checkPermission,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
} from './permissions';

// ─── Constants ────────────────────────────────────────────

const DEFAULT_CONFIG: Required<AuthProviderConfig> = {
  basePath: '/palette/api/v1',
  loginPath: '/auth/login',
  logoutPath: '/auth/logout',
  sessionPath: '/auth/session',
  userInfoPath: '/auth/me',
  sessionExpiry: { enabled: false, warningBeforeSeconds: 300 },
  maxRetries: 3,
  debug: false,
};

// ─── Context ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Debug Logger ─────────────────────────────────────────

function createLogger(enabled: boolean) {
  const prefix = '[Palette Auth]';
  return {
    debug: (...args: unknown[]) => enabled && console.debug(prefix, ...args),
    info: (...args: unknown[]) => enabled && console.info(prefix, ...args),
    warn: (...args: unknown[]) => enabled && console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
}

// ─── User Enrichment ──────────────────────────────────────

/**
 * Enrich user data from eIDP UserInfo response.
 * Maps eIDP claims to PaletteUser shape.
 */
function enrichUserFromEidp(eidpInfo: EidpUserInfo): Partial<PaletteUser> {
  return {
    avatarUrl: eidpInfo.picture,
    emailVerified: eidpInfo.emailVerified,
    phoneNumber: eidpInfo.phoneNumber,
    locale: eidpInfo.locale,
    rawClaims: eidpInfo.rawClaims,
  };
}

/**
 * Extract permissions and roles from eIDP raw claims.
 * Looks for common claim names used by enterprise IdPs.
 */
function extractPermissionsAndRoles(
  rawClaims: Record<string, unknown> | undefined
): { permissions: string[]; roles: string[] } {
  if (!rawClaims) {
    return { permissions: [], roles: [] };
  }

  // Common claim names for permissions/roles in enterprise IdPs
  const permissionClaims = ['permissions', 'authorities', 'authorities', 'scope', 'scopes'];
  const roleClaims = ['roles', 'groups', 'realm_access.roles', 'resource_access'];

  let permissions: string[] = [];
  let roles: string[] = [];

  // Extract permissions
  for (const claim of permissionClaims) {
    const value = rawClaims[claim];
    if (Array.isArray(value)) {
      permissions = permissions.concat(value.filter((v) => typeof v === 'string'));
    } else if (typeof value === 'string') {
      permissions.push(value);
    }
  }

  // Extract roles
  for (const claim of roleClaims) {
    const value = rawClaims[claim];
    if (Array.isArray(value)) {
      roles = roles.concat(value.filter((v) => typeof v === 'string'));
    } else if (typeof value === 'string') {
      roles.push(value);
    }
    // Handle nested claims like realm_access.roles
    if (claim.includes('.')) {
      const parts = claim.split('.');
      let nested: unknown = rawClaims;
      for (const part of parts) {
        if (nested && typeof nested === 'object' && part in (nested as Record<string, unknown>)) {
          nested = (nested as Record<string, unknown>)[part];
        } else {
          nested = null;
          break;
        }
      }
      if (Array.isArray(nested)) {
        roles = roles.concat(nested.filter((v) => typeof v === 'string'));
      }
    }
  }

  // Deduplicate
  permissions = [...new Set(permissions)];
  roles = [...new Set(roles)];

  return { permissions, roles };
}

// ─── Provider ─────────────────────────────────────────────

export function AuthProvider({ children, config }: AuthProviderProps) {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const logger = useMemo(() => createLogger(mergedConfig.debug), [mergedConfig.debug]);
  const maxRetries = mergedConfig.maxRetries;

  const [state, setState] = useState<AuthState>({
    status: 'idle',
    loading: true,
    authenticated: false,
    user: null,
    expiresAt: null,
    error: null,
    retryCount: 0,
  });

  // Track mounted state to prevent setState after unmount
  const mountedRef = useRef(true);
  const refreshSessionRef = useRef<() => Promise<void>>();

  useEffect(() => {
    mountedRef.current = true;
    logger.debug('AuthProvider mounted');

    // Initialize multi-tab sync
    initAuthSync({
      onLogin: () => {
        logger.debug('Login detected in another tab, refreshing session...');
        refreshSessionRef.current?.();
      },
      onLogout: () => {
        logger.debug('Logout detected in another tab');
        if (mountedRef.current) {
          setState({
            status: 'unauthenticated',
            loading: false,
            authenticated: false,
            user: null,
            expiresAt: null,
            error: null,
            retryCount: 0,
          });
        }
      },
      onSessionExpired: () => {
        logger.debug('Session expired in another tab');
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            status: 'expired' as AuthStatus,
            loading: false,
            authenticated: false,
            user: null,
          }));
        }
      },
    });

    return () => {
      mountedRef.current = false;
      destroyAuthSync();
      logger.debug('AuthProvider unmounted');
    };
  }, [logger]);

  // ── Session Refresh ────────────────────────────────────

  const refreshSession = useCallback(async () => {
    logger.debug('Refreshing session...');

    if (!mountedRef.current) return;

    setState((prev) => ({
      ...prev,
      status: 'checking' as AuthStatus,
      loading: true,
      error: null,
    }));

    try {
      // Step 1: Check session with BFF
      const session: SessionInfo = await checkSession();
      logger.debug('Session check result:', session);

      if (!session.authenticated) {
        // Not authenticated
        if (mountedRef.current) {
          setState({
            status: 'unauthenticated',
            loading: false,
            authenticated: false,
            user: null,
            expiresAt: null,
            error: null,
            retryCount: 0,
          });
        }
        return;
      }

      // Step 2: Fetch user info from eIDP via BFF
      let user: PaletteUser | null = null;
      try {
        const eidpInfo: EidpUserInfo = await fetchEidpUserInfo();
        const { permissions, roles } = extractPermissionsAndRoles(eidpInfo.rawClaims);
        const enrichment = enrichUserFromEidp(eidpInfo);

        user = {
          id: eidpInfo.sub,
          username: eidpInfo.preferredUsername ?? eidpInfo.name ?? '',
          displayName: eidpInfo.name ?? eidpInfo.preferredUsername ?? '',
          email: eidpInfo.email ?? '',
          roles,
          permissions,
          ...enrichment,
        };

        logger.debug('User info enriched:', user);
      } catch (userInfoError) {
        logger.warn('Failed to fetch user info, continuing with basic session:', userInfoError);
        // Continue with basic session info even if user info fetch fails
      }

      // Step 3: Update state
      if (mountedRef.current) {
        setState({
          status: 'authenticated',
          loading: false,
          authenticated: true,
          user,
          expiresAt: session.expiresAt ?? null,
          error: null,
          retryCount: 0,
        });

        // Emit login event
        authEvents.emit('auth:login', { user, expiresAt: session.expiresAt });
        // Broadcast to other tabs
        authSync?.broadcastLogin({ user, expiresAt: session.expiresAt });
        logger.info('User authenticated:', user?.username);
      }
    } catch (err) {
      const platformError = classifyError(err);
      logger.error('Session check failed:', platformError);

      if (!mountedRef.current) return;

      // Handle session expired
      if (platformError.code === 'SESSION_EXPIRED') {
        setState((prev) => ({
          ...prev,
          status: 'expired' as AuthStatus,
          loading: false,
          authenticated: false,
          user: null,
          expiresAt: null,
          error: null,
        }));
        authEvents.emit('auth:session-expired');
        return;
      }

      // Handle retryable errors
      const currentRetryCount = state.retryCount;
      if (currentRetryCount < maxRetries && platformError.recoverable) {
        logger.debug(`Retrying session check (${currentRetryCount + 1}/${maxRetries})...`);
        setState((prev) => ({
          ...prev,
          retryCount: prev.retryCount + 1,
        }));
        // Retry after a delay
        setTimeout(() => {
          if (mountedRef.current) {
            refreshSession();
          }
        }, 1000 * (currentRetryCount + 1)); // Exponential backoff
        return;
      }

      // Non-recoverable or max retries exceeded
      setState({
        status: 'error',
        loading: false,
        authenticated: false,
        user: null,
        expiresAt: null,
        error: platformError,
        retryCount: currentRetryCount + 1,
      });
      authEvents.emit('auth:error', { error: platformError });
    }
  }, [logger, maxRetries, state.retryCount]);

  // Keep ref in sync
  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  // Initial session check on mount
  useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ──────────────────────────────────────────────

  const login = useCallback(
    (returnUrl?: string) => {
      logger.debug('Initiating login...', { returnUrl });
      setState((prev) => ({ ...prev, error: null }));

      const loginUrl = `${mergedConfig.basePath}${mergedConfig.loginPath}`;
      const redirectUrl = returnUrl
        ? `${loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
        : loginUrl;

      window.location.href = redirectUrl;
    },
    [logger, mergedConfig.basePath, mergedConfig.loginPath]
  );

  // ── Logout ─────────────────────────────────────────────

  const logout = useCallback(async () => {
    logger.debug('Initiating logout...');

    // Prevent axios interceptor from redirecting on 401
    setLoggingOut(true);

    // Clear auth state
    setState({
      status: 'unauthenticated',
      loading: false,
      authenticated: false,
      user: null,
      expiresAt: null,
      error: null,
      retryCount: 0,
    });

    // Emit logout event
    authEvents.emit('auth:logout', { user: state.user });
    // Broadcast to other tabs
    authSync?.broadcastLogout();

    // Navigate to BFF logout endpoint
    const logoutUrl = `${mergedConfig.basePath}${mergedConfig.logoutPath}`;
    window.location.href = logoutUrl;
  }, [logger, mergedConfig.basePath, mergedConfig.logoutPath, state.user]);

  // ── Clear Error ────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, status: prev.authenticated ? 'authenticated' : 'unauthenticated' }));
  }, []);

  // ── Permission Helpers ─────────────────────────────────

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!state.user) return false;
      return checkPermission(state.user.permissions, permission);
    },
    [state.user]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!state.user) return false;
      return checkAllPermissions(state.user.permissions, permissions);
    },
    [state.user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!state.user) return false;
      return checkAnyPermission(state.user.permissions, permissions);
    },
    [state.user]
  );

  const getPermissions = useCallback((): string[] => {
    return state.user?.permissions ?? [];
  }, [state.user]);

  const getRoles = useCallback((): string[] => {
    return state.user?.roles ?? [];
  }, [state.user]);

  // ── Context Value ──────────────────────────────────────

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      // State
      status: state.status,
      loading: state.loading,
      authenticated: state.authenticated,
      user: state.user,
      expiresAt: state.expiresAt,
      error: state.error,
      // Actions
      login,
      logout,
      refreshSession,
      clearError,
      // Permissions
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      getPermissions,
      getRoles,
    }),
    [state, login, logout, refreshSession, clearError, hasPermission, hasAllPermissions, hasAnyPermission, getPermissions, getRoles]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 *
 * @throws Error if used outside AuthProvider
 *
 * @example
 *   function MyComponent() {
 *     const { authenticated, user, login, logout } = useAuth();
 *     if (!authenticated) return <LoginButton onClick={login} />;
 *     return <UserProfile user={user} onLogout={logout} />;
 *   }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      '[@palette/auth] useAuth must be used within an AuthProvider. ' +
        'Wrap your application with <AuthProvider> to fix this.'
    );
  }
  return context;
}

/**
 * Hook to access current user.
 * Returns null if not authenticated.
 *
 * @example
 *   function Header() {
 *     const user = useUser();
 *     return user ? <span>{user.displayName}</span> : null;
 *   }
 */
export function useUser(): PaletteUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if authenticated.
 *
 * @example
 *   function Nav() {
 *     const isAuthenticated = useIsAuthenticated();
 *     return isAuthenticated ? <UserMenu /> : <LoginButton />;
 *   }
 */
export function useIsAuthenticated(): boolean {
  const { authenticated } = useAuth();
  return authenticated;
}
