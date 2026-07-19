import { Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { useAuth } from '@palette/auth';

// ─── Loading Fallback ────────────────────────────────────

function DefaultLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div>Loading...</div>
    </div>
  );
}

// ─── Protected Route Wrapper ─────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <DefaultLoading />;
  }

  if (!authenticated) {
    return <Navigate to="/palette/api/v1/auth/login" replace />;
  }

  return <>{children}</>;
}

// ─── Route Configuration Types ───────────────────────────

export interface PaletteRouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType>;
  children?: PaletteRouteConfig[];
  protected?: boolean;
}

// ─── Route Builder ───────────────────────────────────────

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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666' }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              marginTop: 16,
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: '#fff',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
