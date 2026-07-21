import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { paletteQueryClient } from './queryClient';

/**
 * Devtools button position options.
 */
export type DevtoolsPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Props for PaletteQueryProvider.
 */
export interface PaletteQueryProviderProps {
  /** React children */
  children: React.ReactNode;
  /**
   * Custom QueryClient instance.
   * If not provided, uses the platform default singleton.
   */
  client?: QueryClient;
  /**
   * Enable React Query DevTools in development.
   * @default true
   */
  devtools?: boolean;
  /**
   * Position of the DevTools floating panel.
   * @default 'bottom'
   */
  devtoolsPosition?: DevtoolsPosition;
}

/**
 * Palette Query Provider — wraps the application with TanStack Query.
 *
 * This should be placed inside the PaletteProvider (or at the same level)
 * to ensure all Palette components have access to the query client.
 *
 * @example
 * ```tsx
 * // Basic usage (uses default QueryClient)
 * import { PaletteQueryProvider } from '@palette/api';
 *
 * function App() {
 *   return (
 *     <PaletteQueryProvider>
 *       <MyApplication />
 *     </PaletteQueryProvider>
 *   );
 * }
 *
 * // With custom QueryClient
 * import { PaletteQueryProvider, createPaletteQueryClient } from '@palette/api';
 *
 * const queryClient = createPaletteQueryClient({
 *   queries: { staleTime: 30_000 },
 * });
 *
 * function App() {
 *   return (
 *     <PaletteQueryProvider client={queryClient}>
 *       <MyApplication />
 *     </PaletteQueryProvider>
 *   );
 * }
 *
 * // Full integration with PaletteProvider
 * import { PaletteProvider } from '@palette/core';
 * import { PaletteQueryProvider } from '@palette/api';
 *
 * function App() {
 *   return (
 *     <PaletteProvider>
 *       <PaletteQueryProvider>
 *         <AppShell />
 *       </PaletteQueryProvider>
 *     </PaletteProvider>
 *   );
 * }
 * ```
 */
export function PaletteQueryProvider({
  children,
  client = paletteQueryClient,
  devtools = true,
  devtoolsPosition = 'bottom',
}: PaletteQueryProviderProps) {
  const showDevtools = devtools;

  return (
    <QueryClientProvider client={client}>
      {children}
      {showDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition={devtoolsPosition as never}
        />
      )}
    </QueryClientProvider>
  );
}
