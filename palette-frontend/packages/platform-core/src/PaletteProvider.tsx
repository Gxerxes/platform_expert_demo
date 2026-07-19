import { type ReactNode } from 'react';
import { AuthProvider } from '@palette/auth';
import { ConfigProvider } from '@palette/config';
import { ContextProvider } from '@palette/context';
import { ErrorBoundary } from '@palette/router';

/**
 * PaletteProvider — root provider that bootstraps the entire Palette platform.
 *
 * Provider nesting order:
 *   ErrorBoundary → AuthProvider → ConfigProvider → ContextProvider → App
 */
interface PaletteProviderProps {
  children: ReactNode;
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ConfigProvider>
          <ContextProvider>
            {children}
          </ContextProvider>
        </ConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
