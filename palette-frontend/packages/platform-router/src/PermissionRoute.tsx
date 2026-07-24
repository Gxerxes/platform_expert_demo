/**
 * @palette/router — Permission Route Guard
 *
 * Route-level permission guard that wraps route content.
 * Checks user permissions/roles before rendering the route.
 * Shows an access denied page when permission check fails.
 *
 * Usage in buildRoutes:
 *   <PermissionRoute permission={{ permissions: 'TRADE_VIEW' }}>
 *     <TradePage />
 *   </PermissionRoute>
 */

import { type ReactNode } from 'react';
import { useAuth, evaluatePermission, normalizePermissions, hasAnyRole } from '@palette/auth';
import type { RoutePermission } from './types';

// ─── Permission Route Guard ───────────────────────────────

interface PermissionRouteProps {
  /** Permission requirement */
  permission: RoutePermission;
  /** Content to render when permission check passes */
  children: ReactNode;
  /** Custom fallback when permission denied */
  fallback?: ReactNode;
}

/**
 * Route-level permission guard component.
 * Evaluates user permissions/roles before rendering children.
 * Renders an enterprise access-denied page on failure.
 */
export function PermissionRoute({ permission, children, fallback }: PermissionRouteProps) {
  const { user } = useAuth();
  const userPermissions = user?.permissions ?? [];
  const userRoles = user?.roles ?? [];

  // Check permissions
  let hasAccess = true;

  if (permission.permissions) {
    const perms = normalizePermissions(permission.permissions);
    const mode = permission.mode ?? 'all';
    hasAccess = evaluatePermission(userPermissions, perms, mode);
  }

  // Check roles
  if (hasAccess && permission.roles) {
    const roles = typeof permission.roles === 'string' ? [permission.roles] : permission.roles;
    const roleMode = permission.roleMode ?? 'any';
    hasAccess =
      roleMode === 'any'
        ? hasAnyRole(userRoles, roles)
        : roles.every((r) => userRoles.includes(r));
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return <AccessDeniedPage requiredPermissions={permission} />;
  }

  return <>{children}</>;
}

// ─── Access Denied Page ───────────────────────────────────

function AccessDeniedPage({ requiredPermissions }: { requiredPermissions: RoutePermission }) {
  const perms = requiredPermissions.permissions
    ? normalizePermissions(requiredPermissions.permissions)
    : [];
  const roles = requiredPermissions.roles
    ? typeof requiredPermissions.roles === 'string'
      ? [requiredPermissions.roles]
      : requiredPermissions.roles
    : [];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
        backgroundColor: '#f5f7fa',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 480,
          padding: 40,
          backgroundColor: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          Access Denied
        </h2>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>
          You do not have sufficient permissions to access this page.
        </p>

        {(perms.length > 0 || roles.length > 0) && (
          <details
            style={{
              textAlign: 'left',
              marginBottom: 16,
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              backgroundColor: '#fafafa',
            }}
          >
            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>
              Required Permissions
            </summary>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              {perms.length > 0 && (
                <div>
                  <strong>Permissions:</strong>{' '}
                  <code style={{ backgroundColor: '#eee', padding: '2px 6px', borderRadius: 3 }}>
                    {perms.join(', ')}
                  </code>
                </div>
              )}
              {roles.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <strong>Roles:</strong>{' '}
                  <code style={{ backgroundColor: '#eee', padding: '2px 6px', borderRadius: 3 }}>
                    {roles.join(', ')}
                  </code>
                </div>
              )}
            </div>
          </details>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              color: '#555',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: '#1a73e8',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
          Contact your administrator to request access.
        </p>
      </div>
    </div>
  );
}
