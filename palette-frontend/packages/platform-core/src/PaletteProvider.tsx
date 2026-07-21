import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@palette/auth';
import { ConfigProvider } from '@palette/config';
import { ContextProvider } from '@palette/context';
import { ErrorBoundary } from '@palette/router';

/**
 * PaletteProvider — root provider that bootstraps the entire Palette platform.
 *
 * Provider nesting order:
 *   ErrorBoundary → AuthProvider → (AuthenticatedGuard → ConfigProvider → ContextProvider) → App
 *
 * ConfigProvider and ContextProvider are only rendered after authentication
 * to prevent 401-triggered redirects from the axios interceptor.
 */
interface PaletteProviderProps {
  children: ReactNode;
}

/**
 * Inner guard that conditionally renders Config/Context providers
 * only when the user is authenticated.
 */
function AuthenticatedProviders({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return null; // Wait for auth check before rendering anything
  }

  if (!authenticated) {
    return <>{children}</>; // Render children (public pages) without Config/Context
  }

  return (
    <ConfigProvider>
      <ContextProvider>
        {children}
      </ContextProvider>
    </ConfigProvider>
  );
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedProviders>
          {children}
        </AuthenticatedProviders>
      </AuthProvider>
    </ErrorBoundary>
  );
}
