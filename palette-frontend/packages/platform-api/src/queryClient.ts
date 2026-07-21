import { QueryClient, QueryCache, MutationCache, type DefaultOptions } from '@tanstack/react-query';
import { classifyError, PlatformErrorCode } from './errors';

/**
 * Development mode flag. Replace with your bundler's define.
 * Vite: import.meta.env.DEV | Webpack: process.env.NODE_ENV === 'development'
 */
declare const __DEV__: boolean;

/**
 * Default options for all queries in the Palette platform.
 * These can be overridden per-query or per-component.
 */
const defaultQueryOptions: DefaultOptions['queries'] = {
  /**
   * Data is considered stale after 10 seconds.
   * Stale data triggers background refetch but is still served from cache.
   */
  staleTime: 10_000,

  /**
   * Inactive queries are garbage collected after 5 minutes.
   * Balances memory usage with cache hit rate.
   */
  gcTime: 5 * 60_000,

  /**
   * Disable automatic refetch on window focus for enterprise apps.
   * Prevents unexpected network traffic in multi-tab environments.
   */
  refetchOnWindowFocus: false,

  /**
   * Retry once on failure. Enterprise BFF calls are generally reliable,
   * but transient network issues warrant a single retry.
   */
  retry: (failureCount, error) => {
    if (failureCount >= 1) return false;
    // Don't retry on auth errors (401/403) or client errors
    const platformErr = classifyError(error);
    if (
      platformErr.code === PlatformErrorCode.SESSION_EXPIRED ||
      platformErr.code === PlatformErrorCode.FORBIDDEN
    ) {
      return false;
    }
    return true;
  },

  /**
   * Don't refetch when reconnecting network — Palette queries
   * are typically behind authenticated sessions that may have expired.
   */
  refetchOnReconnect: false,
};

/**
 * Default options for mutations.
 */
const defaultMutationOptions: DefaultOptions['mutations'] = {
  /**
   * Mutations don't retry by default — failed writes should be
   * explicitly retried by the user to avoid duplicate operations.
   */
  retry: false,
};

/**
 * Query cache global callbacks.
 * Useful for centralized error logging and monitoring.
 */
const queryCache = new QueryCache({
  onError: (error, query) => {
    const platformErr = classifyError(error);

    // Log structured error for monitoring
    if (__DEV__) {
      console.warn(
        `[Palette Query] Error on "${String(query.queryKey[0])}":`,
        platformErr,
      );
    }

    // Session expired → global handler will redirect
    if (platformErr.code === PlatformErrorCode.SESSION_EXPIRED) {
      // The Axios interceptor already handles the redirect.
      // This is just for additional logging.
      console.info('[Palette Query] Session expired, auth handler will redirect.');
    }
  },
});

/**
 * Mutation cache global callbacks.
 */
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    const platformErr = classifyError(error);

    if (__DEV__) {
      console.warn(
        `[Palette Query] Mutation error on "${mutation.options.mutationKey?.join('.')}":`,
        platformErr,
      );
    }
  },
});

/**
 * Create a pre-configured QueryClient for Palette applications.
 *
 * Usage:
 * ```ts
 * // Use the singleton default client
 * import { paletteQueryClient } from '@palette/api';
 *
 * // Or create a custom client with overrides
 * import { createPaletteQueryClient } from '@palette/api';
 * const myClient = createPaletteQueryClient({ staleTime: 30_000 });
 * ```
 */
export function createPaletteQueryClient(
  overrides?: Partial<DefaultOptions>,
): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...defaultQueryOptions,
        ...overrides?.queries,
      },
      mutations: {
        ...defaultMutationOptions,
        ...overrides?.mutations,
      },
    },
    queryCache,
    mutationCache,
  });
}

/**
 * Default singleton QueryClient instance.
 * Suitable for most Palette applications.
 */
export const paletteQueryClient = createPaletteQueryClient();
