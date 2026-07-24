/**
 * @palette/auth
 *
 * Enterprise-grade authentication and authorization module for the Palette platform.
 *
 * Features:
 * - OIDC-based authentication via BFF
 * - User info enrichment from eIDP claims
 * - Permission & role-based access control
 * - Session expiry monitoring with countdown
 * - Auth lifecycle event bus
 * - Declarative guard components
 * - Pattern matching for auth states
 * - User idle detection for security
 * - Multi-tab synchronization
 * - HOC support for class components
 *
 * @example
 *   // Basic usage
 *   import { AuthProvider, useAuth, RequirePermission } from '@palette/auth';
 *
 *   <AuthProvider config={{ debug: true }}>
 *     <App />
 *   </AuthProvider>
 *
 *   // Pattern matching
 *   import { useAuthState } from '@palette/auth';
 *   const ui = useAuthState({
 *     authenticated: () => <Dashboard />,
 *     unauthenticated: () => <Login />,
 *     _: () => <Loading />,
 *   });
 *
 *   // Idle detection
 *   import { useIdleDetection } from '@palette/auth';
 *   const { isIdle, resetIdle } = useIdleDetection({
 *     idleTimeout: 900,
 *     onIdle: () => logout(),
 *   });
 *
 * @packageDocumentation
 */

// ─── Provider & Core Hooks ────────────────────────────────
export { AuthProvider, useAuth, useUser, useIsAuthenticated } from './AuthProvider';

// ─── Permission Hooks & Components ────────────────────────
export {
  usePermission,
  usePermissionGuard,
  RequirePermission,
  RequireRole,
} from './usePermission';

// ─── Session Expiry ───────────────────────────────────────
export { useSessionExpiry } from './useSessionExpiry';

// ─── Auth Guard Components ────────────────────────────────
export { RequireAuth, RequireAuthOrPublic } from './RequireAuth';

// ─── Auth State Pattern Matching ──────────────────────────
export { useAuthState, useAuthGate } from './useAuthState';
export type { AuthStateContext, AuthStateHandlers, AuthGateConfig } from './useAuthState';

// ─── Idle Detection ───────────────────────────────────────
export { useIdleDetection } from './useIdleDetection';
export type { ActivityEvent, UseIdleDetectionOptions, UseIdleDetectionResult } from './useIdleDetection';

// ─── Multi-Tab Sync ───────────────────────────────────────
export {
  createMultiTabSync,
  initAuthSync,
  destroyAuthSync,
  authSync,
} from './multiTabSync';
export type {
  SyncMessageType,
  SyncMessage,
  MultiTabSyncConfig,
  MultiTabSync,
} from './multiTabSync';

// ─── HOC for Class Components ─────────────────────────────
export { withAuth, withPermission, withAuthAndPermission } from './withAuth';
export type { WithAuthProps, WithPermissionProps } from './withAuth';

// ─── Event Bus ────────────────────────────────────────────
export { authEvents } from './authEvents';

// ─── Permission Utilities ─────────────────────────────────
export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasExactPermissions,
  evaluatePermission,
  normalizePermissions,
  hasRole,
  hasAnyRole,
  filterByPermission,
  matchesPermission,
  PalettePermissions,
} from './permissions';

// ─── Types ────────────────────────────────────────────────
export type {
  // User & Identity
  PaletteUser,
  // Auth State
  AuthStatus,
  AuthState,
  AuthContextValue,
  // Session
  SessionInfo,
  SessionExpiryConfig,
  // Permissions
  PermissionMode,
  PermissionCheckConfig,
  // Events
  AuthEvent,
  AuthEventType,
  AuthEventListener,
  // Provider
  AuthProviderConfig,
  AuthProviderProps,
} from './types';

export type { PalettePermission as Permission } from './permissions';
