import { Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { type RouteObject } from 'react-router-dom';
import { useAuth } from '@palette/auth';

// ─── Loading Fallback ────────────────────────────────────

function DefaultLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e0e0e0',
            borderTopColor: '#1a73e8',
            borderRadius: '50%',
            animation: 'palette-spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <div style={{ color: '#666', fontSize: 14 }}>Loading...</div>
        <style>{`@keyframes palette-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Protected Route Wrapper ─────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authenticated, loading, error, login } = useAuth();

  if (loading) {
    return <DefaultLoading />;
  }

  // Show error page for platform errors (BFF down, eIDP down, etc.)
  if (error) {
    return <RouteErrorDisplay error={error} onRetry={login} />;
  }

  if (!authenticated) {
    // Use window.location.href for full-page redirect to backend.
    // Using React Router's <Navigate> would cause a brief flash of NotFoundPage
    // because the BFF URL is not a frontend route.
    window.location.href = '/palette/api/v1/auth/login';
    return <DefaultLoading />;
  }

  return <>{children}</>;
}

// ─── Inline error display for route-level errors ─────────

import { type PlatformError } from '@palette/api';

function RouteErrorDisplay({ error, onRetry }: { error: PlatformError; onRetry?: () => void }) {
  const icon = getErrorIcon(error.code);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f5f7fa' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: 40, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{error.title}</h2>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>{error.message}</p>
        {error.details && (
          <details style={{ textAlign: 'left', marginBottom: 16, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 6, backgroundColor: '#fafafa' }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>Details</summary>
            <p style={{ fontSize: 11, color: '#666', fontFamily: 'monospace', marginTop: 8, wordBreak: 'break-all' }}>
              {error.code}: {error.details}
            </p>
          </details>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {error.recoverable && onRetry && (
            <button onClick={onRetry} style={{ padding: '8px 24px', fontSize: 14, fontWeight: 600, color: '#fff', backgroundColor: '#1a73e8', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Try Again
            </button>
          )}
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 24px', fontSize: 14, color: '#555', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>If this problem persists, please contact IT Support.</p>
      </div>
    </div>
  );
}

function getErrorIcon(code: string): string {
  switch (code) {
    case 'BFF_UNREACHABLE': return '🔌';
    case 'REQUEST_TIMEOUT': return '⏱️';
    case 'EIDP_UNAVAILABLE': return '🔐';
    case 'EIDP_AUTH_ERROR': return '🛡️';
    case 'SESSION_EXPIRED': return '🕐';
    case 'FORBIDDEN': return '🚫';
    case 'INTERNAL_ERROR': return '💥';
    default: return '⚠️';
  }
}

// ─── Route Configuration Types ───────────────────────────

/**
 * Basic route configuration (backward compatible).
 * For enterprise features (menu, permissions), use MenuRouteConfig.
 */
export interface PaletteRouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType>;
  children?: PaletteRouteConfig[];
  protected?: boolean;
}

// ─── Route Builder (Basic) ───────────────────────────────

export function buildRoutes(configs: PaletteRouteConfig[]): RouteObject[] {
  return configs.map((config) => {
    const element = config.protected !== false ? (
      <ProtectedRoute>
        <Suspense fallback={<DefaultLoading />}>
          <config.component />
        </Suspense>
      </ProtectedRoute>
    ) : (
      <Suspense fallback={<DefaultLoading />}>
        <config.component />
      </Suspense>
    );

    const route: RouteObject = {
      path: config.path,
      element,
    };

    if (config.children) {
      route.children = buildRoutes(config.children);
    }

    return route;
  });
}

// ─── Enterprise Route Builder (with Permissions & Menu) ──

import { PermissionRoute } from './PermissionRoute';
import type { MenuRouteConfig } from './types';

/**
 * Build routes from MenuRouteConfig with permission guards.
 * Each route is wrapped with PermissionRoute when permission is specified.
 *
 * @example
 *   const routes: MenuRouteConfig[] = [
 *     {
 *       path: '/dashboard',
 *       component: DashboardPage,
 *       menu: { title: 'Dashboard', icon: { emoji: '📊' } },
 *     },
 *     {
 *       path: '/admin',
 *       component: AdminPage,
 *       menu: { title: 'Admin' },
 *       permission: { permissions: 'ADMIN_ACCESS' },
 *     },
 *   ];
 *
 *   const router = createBrowserRouter(buildMenuRoutes(routes));
 */
export function buildMenuRoutes(configs: MenuRouteConfig[]): RouteObject[] {
  return configs.map((config) => {
    let element = config.protected !== false ? (
      <ProtectedRoute>
        <Suspense fallback={<DefaultLoading />}>
          <config.component />
        </Suspense>
      </ProtectedRoute>
    ) : (
      <Suspense fallback={<DefaultLoading />}>
        <config.component />
      </Suspense>
    );

    // Wrap with permission guard
    if (config.permission) {
      element = (
        <PermissionRoute permission={config.permission}>
          {element}
        </PermissionRoute>
      );
    }

    const route: RouteObject = {
      path: config.path,
      element,
    };

    if (config.children) {
      route.children = buildMenuRoutes(config.children);
    }

    return route;
  });
}

// ─── Error Boundary Component ────────────────────────────

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Palette ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: 40, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💥</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Application Error</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
              The application encountered an unexpected error. Please try reloading the page.
            </p>
            <details style={{ textAlign: 'left', marginBottom: 16, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 6, backgroundColor: '#fafafa' }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>Error Details</summary>
              <p style={{ fontSize: 11, color: '#c00', fontFamily: 'monospace', marginTop: 8, wordBreak: 'break-all' }}>
                {this.state.error?.message}
              </p>
            </details>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                style={{ padding: '8px 24px', fontSize: 14, fontWeight: 600, color: '#fff', backgroundColor: '#1a73e8', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Reload Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                style={{ padding: '8px 24px', fontSize: 14, color: '#555', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}
              >
                Go Home
              </button>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>If this problem persists, please contact IT Support.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Re-export types and hooks ───────────────────────────

export type {
  MenuIcon,
  MenuMeta,
  RoutePermission,
  MenuRouteConfig,
  ResolvedMenuItem,
  RouteModule,
  RouteRegistryState,
} from './types';

export { PermissionRoute } from './PermissionRoute';
export { useMenuRoutes, filterRoutesByPermission, filterRoutesByFeatureFlag } from './useMenuRoutes';
