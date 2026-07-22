/**
 * @palette/auth — Type Definitions
 *
 * Enterprise-grade authentication and authorization types for the Palette platform.
 * Supports OIDC-based authentication, permission-based access control,
 * session management, and auth lifecycle events.
 */

import type { PlatformError } from '@palette/api';

// ─── User & Identity ──────────────────────────────────────

/**
 * Represents an authenticated user in the Palette platform.
 * Populated from BFF user context + eIDP claims.
 */
export interface PaletteUser {
  /** Unique user identifier (from eIDP sub claim) */
  id: string;
  /** Username / login name */
  username: string;
  /** Display name for UI rendering */
  displayName: string;
  /** User email address */
  email: string;
  /** Whether email has been verified by eIDP */
  emailVerified?: boolean;
  /** User phone number (if available from eIDP) */
  phoneNumber?: string;
  /** Avatar/profile picture URL */
  avatarUrl?: string;
  /** User preferred locale (e.g., 'en-US', 'zh-CN') */
  locale?: string;
  /** Assigned roles (e.g., ['ADMIN', 'CLEARING_USER']) */
  roles: string[];
  /** Granted permissions (e.g., ['TRADE_VIEW', 'TRADE_CREATE']) */
  permissions: string[];
  /** Raw claims from eIDP token (for advanced use cases) */
  rawClaims?: Record<string, unknown>;
}

// ─── Authentication State ─────────────────────────────────

/**
 * Authentication status machine states.
 */
export type AuthStatus =
  | 'idle'           // Initial state, not yet checked
  | 'checking'       // Session check in progress
  | 'authenticated'  // User is logged in
  | 'unauthenticated'// User is not logged in
  | 'expired'        // Session has expired
  | 'error';         // An error occurred during auth check

/**
 * Complete authentication state.
 */
export interface AuthState {
  /** Current authentication status */
  status: AuthStatus;
  /** Whether a session check is in progress */
  loading: boolean;
  /** Whether the user is authenticated */
  authenticated: boolean;
  /** Currently authenticated user (null if not authenticated) */
  user: PaletteUser | null;
  /** Session expiry timestamp (ISO 8601) */
  expiresAt: string | null;
  /** Auth error (if status === 'error') */
  error: PlatformError | null;
  /** Number of times session refresh has been attempted */
  retryCount: number;
}

// ─── Session ──────────────────────────────────────────────

/**
 * Session information from BFF.
 */
export interface SessionInfo {
  /** Whether the session is valid */
  authenticated: boolean;
  /** Session expiry timestamp (ISO 8601) */
  expiresAt?: string;
  /** BFF login URL for redirect */
  loginUrl?: string;
}

/**
 * Session expiry warning configuration.
 */
export interface SessionExpiryConfig {
  /** Whether to enable expiry warnings */
  enabled: boolean;
  /** Seconds before expiry to show warning (default: 300 = 5 min) */
  warningBeforeSeconds: number;
  /** Callback when warning threshold is reached */
  onWarning?: (remainingSeconds: number) => void;
  /** Callback when session expires */
  onExpired?: () => void;
}

// ─── Permissions ──────────────────────────────────────────

/**
 * Permission check modes for RequirePermission component.
 */
export type PermissionMode = 'all' | 'any' | 'exact';

/**
 * Configuration for permission checks.
 */
export interface PermissionCheckConfig {
  /** Required permission(s) */
  permissions: string | string[];
  /** Check mode: 'all' (AND), 'any' (OR), 'exact' (exact match) */
  mode?: PermissionMode;
  /** Fallback element when permission denied */
  fallback?: React.ReactNode;
}

// ─── Auth Context ─────────────────────────────────────────

/**
 * Value exposed by AuthContext to consumers.
 */
export interface AuthContextValue {
  // ── State ──
  /** Current authentication status */
  status: AuthStatus;
  /** Whether auth check is in progress */
  loading: boolean;
  /** Whether user is authenticated */
  authenticated: boolean;
  /** Current user (null if not authenticated) */
  user: PaletteUser | null;
  /** Session expiry time */
  expiresAt: string | null;
  /** Current auth error */
  error: PlatformError | null;

  // ── Actions ──
  /** Redirect to login page */
  login: (returnUrl?: string) => void;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Manually refresh session state */
  refreshSession: () => Promise<void>;
  /** Clear current error state */
  clearError: () => void;

  // ── Permissions ──
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean;
  /** Check if user has all specified permissions */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Get all user permissions */
  getPermissions: () => string[];
  /** Get all user roles */
  getRoles: () => string[];
}

// ─── Auth Events ──────────────────────────────────────────

/**
 * Authentication lifecycle event types.
 */
export type AuthEventType =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:session-expired'
  | 'auth:session-refresh'
  | 'auth:permission-denied'
  | 'auth:error'
  | 'auth:user-changed';

/**
 * Auth event payload.
 */
export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  payload?: unknown;
}

/**
 * Auth event listener callback.
 */
export type AuthEventListener = (event: AuthEvent) => void;

// ─── Provider Props ───────────────────────────────────────

/**
 * Configuration options for AuthProvider.
 */
export interface AuthProviderConfig {
  /** BFF base path (default: '/palette/api/v1') */
  basePath?: string;
  /** Login endpoint path */
  loginPath?: string;
  /** Logout endpoint path */
  logoutPath?: string;
  /** Session check endpoint path */
  sessionPath?: string;
  /** User info endpoint path */
  userInfoPath?: string;
  /** Session expiry warning config */
  sessionExpiry?: SessionExpiryConfig;
  /** Maximum retry attempts for session refresh (default: 3) */
  maxRetries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * AuthProvider component props.
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  /** Auth configuration options */
  config?: AuthProviderConfig;
}
