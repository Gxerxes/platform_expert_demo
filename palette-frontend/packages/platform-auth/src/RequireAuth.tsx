/**
 * @palette/auth — RequireAuth Component
 *
 * Route-level authentication guard with loading and error states.
 * Handles redirect to login for unauthenticated users.
 *
 * Usage:
 *   // In route configuration
 *   <RequireAuth>
 *     <ProtectedPage />
 *   </RequireAuth>
 *
 *   // With custom fallbacks
 *   <RequireAuth
 *     loading={<CustomSpinner />}
 *     errorFallback={<CustomErrorPage />}
 *     loginRedirect="/custom-login"
 *   >
 *     <AdminPage />
 *   </RequireAuth>
 */

import { type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import type { PlatformError } from '@palette/api';

// ─── Types ────────────────────────────────────────────────

interface RequireAuthProps {
  /** Protected content */
  children: ReactNode;
  /** Custom loading fallback */
  loading?: ReactNode;
  /** Custom error fallback component */
  errorFallback?: ReactNode | ((error: PlatformError) => ReactNode);
  /** Custom unauthorized fallback */
  unauthorizedFallback?: ReactNode;
  /** Custom login redirect path (default: BFF login endpoint) */
  loginRedirect?: string;
}

// ─── Default Loading ──────────────────────────────────────

function DefaultLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e9ecef',
            borderTopColor: '#0d6efd',
            borderRadius: '50%',
            animation: 'palette-auth-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ color: '#6c757d', fontSize: 14, margin: 0 }}>Verifying authentication...</p>
        <style>{`@keyframes palette-auth-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Default Error Display ────────────────────────────────

function DefaultErrorDisplay({ error, onRetry }: { error: PlatformError; onRetry?: () => void }) {
  const iconMap: Record<string, string> = {
    BFF_UNREACHABLE: '🔌',
    REQUEST_TIMEOUT: '⏱️',
    EIDP_UNAVAILABLE: '🔐',
    EIDP_AUTH_ERROR: '🛡️',
    SESSION_EXPIRED: '🕐',
    FORBIDDEN: '🚫',
    INTERNAL_ERROR: '💥',
    UNKNOWN: '⚠️',
  };

  const icon = iconMap[error.code] ?? '⚠️';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        padding: 20,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 480,
          padding: 40,
          backgroundColor: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#212529', marginBottom: 8, margin: '0 0 8px 0' }}>
          {error.title}
        </h2>
        <p style={{ fontSize: 14, color: '#6c757d', lineHeight: 1.6, marginBottom: 24 }}>
          {error.message}
        </p>

        {error.details && (
          <details
            style={{
              textAlign: 'left',
              marginBottom: 20,
              padding: '10px 14px',
              border: '1px solid #dee2e6',
              borderRadius: 8,
              backgroundColor: '#f8f9fa',
            }}
          >
            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#6c757d', userSelect: 'none' }}>
              Technical Details
            </summary>
            <p
              style={{
                fontSize: 11,
                color: '#495057',
                fontFamily: 'monospace',
                marginTop: 8,
                wordBreak: 'break-all',
              }}
            >
              {error.code}: {error.details}
            </p>
          </details>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {error.recoverable && onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#0d6efd',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0b5ed7')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0d6efd')}
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 500,
              color: '#495057',
              backgroundColor: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            Go Home
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#adb5bd' }}>
          If this problem persists, please contact IT Support.
        </p>
      </div>
    </div>
  );
}

// ─── RequireAuth Component ────────────────────────────────

/**
 * Authentication guard component for protected routes.
 *
 * Handles three states:
 * 1. Loading — while session check is in progress
 * 2. Error — when platform error occurs (BFF down, etc.)
 * 3. Unauthenticated — redirects to login
 * 4. Authenticated — renders children
 */
export function RequireAuth({
  children,
  loading,
  errorFallback,
  unauthorizedFallback,
  loginRedirect,
}: RequireAuthProps) {
  const { status, loading: isLoading, error, authenticated, login } = useAuth();

  // State 1: Loading
  if (isLoading || status === 'checking') {
    return loading ? <>{loading}</> : <DefaultLoading />;
  }

  // State 2: Error (BFF down, eIDP error, etc.)
  if (error) {
    if (errorFallback) {
      if (typeof errorFallback === 'function') {
        return <>{errorFallback(error)}</>;
      }
      return <>{errorFallback}</>;
    }
    return <DefaultErrorDisplay error={error} onRetry={login} />;
  }

  // State 3: Unauthenticated
  if (!authenticated) {
    // Show unauthorized fallback if provided
    if (unauthorizedFallback) {
      return <>{unauthorizedFallback}</>;
    }

    // Redirect to login
    if (loginRedirect) {
      window.location.href = loginRedirect;
    } else {
      // Use BFF login endpoint (which redirects to eIDP)
      window.location.href = '/palette/api/v1/auth/login';
    }

    // Show loading while redirect is processed
    return loading ? <>{loading}</> : <DefaultLoading />;
  }

  // State 4: Authenticated — render protected content
  return <>{children}</>;
}

// ─── RequireAuthOrPublic Component ────────────────────────

interface RequireAuthOrPublicProps {
  /** Protected content (shown when authenticated) */
  children: ReactNode;
  /** Public content (shown when not authenticated) */
  publicContent: ReactNode;
  /** Loading fallback */
  loading?: ReactNode;
}

/**
 * Component that shows different content based on authentication state.
 * Useful for pages that have both public and authenticated views.
 *
 * @example
 *   <RequireAuthOrPublic
 *     publicContent={<LandingPage />}
 *     loading={<Spinner />}
 *   >
 *     <Dashboard />
 *   </RequireAuthOrPublic>
 */
export function RequireAuthOrPublic({ children, publicContent, loading }: RequireAuthOrPublicProps) {
  const { authenticated, loading: isLoading, error } = useAuth();

  if (isLoading) {
    return loading ? <>{loading}</> : <DefaultLoading />;
  }

  // If there's an error, show public content (graceful degradation)
  if (error) {
    return <>{publicContent}</>;
  }

  if (!authenticated) {
    return <>{publicContent}</>;
  }

  return <>{children}</>;
}
