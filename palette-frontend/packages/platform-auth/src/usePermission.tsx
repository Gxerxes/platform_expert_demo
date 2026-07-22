/**
 * @palette/auth — Permission Hooks & Components
 *
 * Declarative permission-based access control for React components.
 *
 * Usage:
 *   // Hook
 *   const { hasPermission, hasAllPermissions } = usePermission();
 *   if (hasPermission('TRADE_CREATE')) { ... }
 *
 *   // Component
 *   <RequirePermission permission="TRADE_VIEW">
 *     <TradeList />
 *   </RequirePermission>
 *
 *   // Multiple permissions (AND)
 *   <RequirePermission permission={['TRADE_VIEW', 'TRADE_EDIT']}>
 *     <TradeEditor />
 *   </RequirePermission>
 *
 *   // Any permission (OR)
 *   <RequirePermission permission={['ADMIN', 'SUPERVISOR']} mode="any">
 *     <AdminPanel />
 *   </RequirePermission>
 */

import { useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import {
  hasPermission as checkPermission,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  normalizePermissions,
  evaluatePermission,
} from './permissions';
import { authEvents } from './authEvents';
import type { PermissionMode } from './types';

// ─── usePermission Hook ───────────────────────────────────

/**
 * Hook providing permission checking utilities.
 * Returns functions to check user permissions against the current auth state.
 *
 * @example
 *   function TradeActions() {
 *     const { hasPermission, hasAllPermissions, permissions } = usePermission();
 *
 *     return (
 *       <div>
 *         {hasPermission('TRADE_CREATE') && <CreateButton />}
 *         {hasPermission('TRADE_DELETE') && <DeleteButton />}
 *         {hasAllPermissions(['TRADE_APPROVE', 'TRADE_RELEASE']) && <BatchApproveButton />}
 *       </div>
 *     );
 *   }
 */
export function usePermission() {
  const { user, hasPermission, hasAllPermissions, hasAnyPermission, getPermissions, getRoles } = useAuth();

  return useMemo(
    () => ({
      /** Whether the user has a specific permission */
      hasPermission: (permission: string) => hasPermission(permission),
      /** Whether the user has ALL specified permissions (AND) */
      hasAllPermissions: (permissions: string[]) => hasAllPermissions(permissions),
      /** Whether the user has ANY of the specified permissions (OR) */
      hasAnyPermission: (permissions: string[]) => hasAnyPermission(permissions),
      /** Whether the user has a specific role */
      hasRole: (role: string) => (user?.roles ?? []).includes(role),
      /** Whether the user has ANY of the specified roles */
      hasAnyRole: (roles: string[]) => roles.some((r) => (user?.roles ?? []).includes(r)),
      /** All user permissions */
      permissions: getPermissions(),
      /** All user roles */
      roles: getRoles(),
      /** Whether user is authenticated */
      isAuthenticated: !!user,
    }),
    [user, hasPermission, hasAllPermissions, hasAnyPermission, getPermissions, getRoles]
  );
}

// ─── RequirePermission Component ──────────────────────────

interface RequirePermissionProps {
  /** Required permission(s) */
  permission: string | string[];
  /** Check mode: 'all' (AND), 'any' (OR), 'exact' (exact match) */
  mode?: PermissionMode;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Content to render when permission is denied (optional) */
  fallback?: ReactNode;
  /** Callback when permission is denied */
  onDenied?: () => void;
}

/**
 * Declarative permission guard component.
 * Renders children only if the user has the required permission(s).
 *
 * @example
 *   // Single permission
 *   <RequirePermission permission="TRADE_VIEW">
 *     <TradeList />
 *   </RequirePermission>
 *
 *   // Multiple permissions (AND)
 *   <RequirePermission permission={['TRADE_VIEW', 'TRADE_EDIT']}>
 *     <TradeEditor />
 *   </RequirePermission>
 *
 *   // With fallback
 *   <RequirePermission permission="ADMIN" fallback={<AccessDenied />}>
 *     <AdminPanel />
 *   </RequirePermission>
 */
export function RequirePermission({
  permission,
  mode = 'all',
  children,
  fallback,
  onDenied,
}: RequirePermissionProps) {
  const { user } = useAuth();
  const requiredPermissions = normalizePermissions(permission);
  const userPermissions = user?.permissions ?? [];

  const hasAccess = evaluatePermission(userPermissions, requiredPermissions, mode);

  // If no access, emit permission denied event
  if (!hasAccess && onDenied) {
    // Use requestAnimationFrame to avoid setState during render
    requestAnimationFrame(() => {
      authEvents.emit('auth:permission-denied', {
        required: requiredPermissions,
        mode,
        userPermissions,
      });
      onDenied();
    });
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// ─── RequireRole Component ────────────────────────────────

interface RequireRoleProps {
  /** Required role(s) */
  role: string | string[];
  /** Check mode: 'any' (OR) or 'all' (AND) */
  mode?: 'any' | 'all';
  /** Content to render when role check passes */
  children: ReactNode;
  /** Content to render when role check fails */
  fallback?: ReactNode;
}

/**
 * Role-based access guard component.
 * Renders children only if the user has the required role(s).
 *
 * @example
 *   <RequireRole role="ADMIN">
 *     <AdminPanel />
 *   </RequireRole>
 *
 *   <RequireRole role={['ADMIN', 'SUPERVISOR']} mode="any">
 *     <ManagementPanel />
 *   </RequireRole>
 */
export function RequireRole({ role, mode = 'any', children, fallback }: RequireRoleProps) {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const requiredRoles = typeof role === 'string' ? [role] : role;

  const hasAccess =
    mode === 'any'
      ? requiredRoles.some((r) => userRoles.includes(r))
      : requiredRoles.every((r) => userRoles.includes(r));

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// ─── usePermissionGuard Hook ──────────────────────────────

/**
 * Hook that returns a guard function for conditional rendering.
 * Useful when you need to check permissions before rendering
 * complex conditional UI.
 *
 * @example
 *   function ActionMenu() {
 *     const guard = usePermissionGuard();
 *
 *     return (
 *       <Menu>
 *         {guard('TRADE_VIEW', <TradeMenuItem />)}
 *         {guard('TRADE_CREATE', <CreateMenuItem />)}
 *         {guard(['TRADE_APPROVE', 'TRADE_RELEASE'], <BatchMenuItem />)}
 *       </Menu>
 *     );
 *   }
 */
export function usePermissionGuard() {
  const { hasPermission, hasAllPermissions } = usePermission();

  return (permission: string | string[], element: ReactNode, mode: PermissionMode = 'all'): ReactNode | null => {
    const permissions = normalizePermissions(permission);
    const hasAccess =
      mode === 'any'
        ? permissions.some((p) => hasPermission(p))
        : hasAllPermissions(permissions);

    return hasAccess ? element : null;
  };
}
