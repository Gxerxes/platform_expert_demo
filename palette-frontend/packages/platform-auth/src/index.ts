/**
 * @palette/auth
 *
 * Enterprise-grade authentication and authorization module for the Palette platform.
 *
 * Features:
 * - OIDC-based authentication via BFF
 * - User info enrichment from eIDP claims
 * - Permission & role-based access control
 * - Session expiry monitoring
 * - Auth lifecycle event bus
 * - Declarative guard components
 *
 * @example
 *   // Basic usage
 *   import { AuthProvider, useAuth, RequirePermission } from '@palette/auth';
 *
 *   <AuthProvider config={{ debug: true }}>
 *     <App />
 *   </AuthProvider>
 *
 *   // In a component
 *   function MyComponent() {
 *     const { user, hasPermission } = useAuth();
 *     return hasPermission('TRADE_VIEW') ? <TradeList /> : <AccessDenied />;
 *   }
 *
 *   // Declarative permission guard
 *   <RequirePermission permission="TRADE_CREATE">
 *     <CreateButton />
 *   </RequirePermission>
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
