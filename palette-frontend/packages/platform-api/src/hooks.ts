/**
 * @palette/api — Core Hooks
 *
 * Enterprise-grade TanStack Query hooks for the Palette platform.
 * Provides type-safe wrappers around useQuery/useMutation with
 * platform-specific defaults and pre-built hooks for BFF endpoints.
 *
 * Features:
 * - usePlatformQuery: Enhanced useQuery with platform defaults
 * - usePlatformMutation: Enhanced useMutation with error classification
 * - usePlatformInfiniteQuery: Infinite scroll support
 * - Pre-built hooks for all BFF endpoints
 *
 * Usage:
 *   // Generic query
 *   const { data } = usePlatformQuery({
 *     queryKey: ['my-data'],
 *     queryFn: () => fetchMyData(),
 *   });
 *
 *   // Pre-built platform hook
 *   const { data: session } = useSession();
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  checkSession,
  fetchUserContext,
  fetchEidpUserInfo,
  fetchRuntimeConfig,
  fetchSystemInfo,
  type SessionInfo,
  type UserContext,
  type EidpUserInfo,
  type RuntimeConfig,
  type SystemInfo,
} from './endpoints';
import { paletteKeys } from './queryKeys';
import { classifyError, type PlatformError } from './errors';

// ─── Type Exports ──────────────────────────────────────────

/**
 * Options for usePlatformQuery (extends TanStack UseQueryOptions).
 */
export type UsePlatformQueryOptions<TData, TError = PlatformError> = Omit<
  UseQueryOptions<TData, TError>,
  'queryKey'
> & {
  queryKey: readonly unknown[];
};

/**
 * Result from usePlatformQuery.
 */
export type UsePlatformQueryResult<TData, TError = PlatformError> = UseQueryResult<TData, TError>;

/**
 * Options for usePlatformMutation.
 */
export type UsePlatformMutationOptions<TData, TVariables, TError = PlatformError> = UseMutationOptions<
  TData,
  TError,
  TVariables
>;

/**
 * Result from usePlatformMutation.
 */
export type UsePlatformMutationResult<TData, TVariables, TError = PlatformError> = UseMutationResult<
  TData,
  TError,
  TVariables
>;

/**
 * Options for usePlatformInfiniteQuery.
 */
export type UsePlatformInfiniteQueryOptions<TData, TError = PlatformError> = Omit<
  UseInfiniteQueryOptions<TData, TError>,
  'queryKey'
> & {
  queryKey: readonly unknown[];
};

/**
 * Result from usePlatformInfiniteQuery.
 */
export type UsePlatformInfiniteQueryResult<TData, TError = PlatformError> = UseInfiniteQueryResult<TData, TError>;

/**
 * Paginated response shape for infinite queries.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Core Hooks ────────────────────────────────────────────

/**
 * Enhanced useQuery with platform-specific defaults.
 *
 * Features:
 * - Automatic error classification
 * - Platform query key integration
 * - Sensible defaults for enterprise apps
 *
 * @example
 *   const { data, isLoading, error } = usePlatformQuery({
 *     queryKey: paletteKeys.session.current(),
 *     queryFn: checkSession,
 *     staleTime: 30_000,
 *   });
 */
export function usePlatformQuery<TData, TError = PlatformError>(
  options: UsePlatformQueryOptions<TData, TError>
): UsePlatformQueryResult<TData, TError> {
  return useQuery({
    ...options,
    // Transform errors to PlatformError
    select: options.select as never,
  } as UseQueryOptions<TData, TError>) as UsePlatformQueryResult<TData, TError>;
}

/**
 * Enhanced useMutation with platform-specific error handling.
 *
 * @example
 *   const mutation = usePlatformMutation({
 *     mutationFn: (data) => createTrade(data),
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: tradeKeys.all }),
 *   });
 */
export function usePlatformMutation<TData, TVariables, TError = PlatformError>(
  options: UsePlatformMutationOptions<TData, TVariables, TError>
): UsePlatformMutationResult<TData, TVariables, TError> {
  return useMutation(options);
}

/**
 * Enhanced useInfiniteQuery for paginated data.
 *
 * @example
 *   const { data, fetchNextPage, hasNextPage } = usePlatformInfiniteQuery({
 *     queryKey: tradeKeys.infinite({ status: 'OPEN' }),
 *     queryFn: ({ pageParam }) => fetchTrades({ page: pageParam, status: 'OPEN' }),
 *     initialPageParam: 1,
 *     getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
 *   });
 */
export function usePlatformInfiniteQuery<TData, TError = PlatformError>(
  options: UsePlatformInfiniteQueryOptions<TData, TError>
): UsePlatformInfiniteQueryResult<TData, TError> {
  return useInfiniteQuery(options as UseInfiniteQueryOptions<TData, TError>);
}

// ─── Pre-built Platform Hooks ──────────────────────────────

/**
 * Hook to access current session info.
 *
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 *   const { data: session, isLoading } = useSession();
 *   if (!session?.authenticated) return <LoginPrompt />;
 */
export function useSession(enabled = true) {
  return useQuery({
    queryKey: paletteKeys.session.current(),
    queryFn: checkSession,
    enabled,
    staleTime: 30_000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to access user context (profile + environment + preferences).
 *
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 *   const { data: context } = useUserContext();
 *   console.log(context?.user.displayName, context?.environment);
 */
export function useUserContext(enabled = true) {
  return useQuery({
    queryKey: paletteKeys.user.context(),
    queryFn: fetchUserContext,
    enabled,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Hook to access eIDP user info (real-time from identity provider).
 *
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 *   const { data: userInfo } = useEidpUserInfo();
 *   console.log(userInfo?.email, userInfo?.rawClaims);
 */
export function useEidpUserInfo(enabled = true) {
  return useQuery({
    queryKey: paletteKeys.user.eidpInfo(),
    queryFn: fetchEidpUserInfo,
    enabled,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook to access runtime configuration from BFF.
 *
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 *   const { data: config } = useRuntimeConfig();
 *   if (config?.features.NEW_UI) return <NewUI />;
 */
export function useRuntimeConfig(enabled = true) {
  return useQuery({
    queryKey: paletteKeys.config.runtime(),
    queryFn: fetchRuntimeConfig,
    enabled,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook to access system info (version, build time).
 *
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 *   const { data: info } = useSystemInfo();
 *   console.log(`Running v${info?.version}`);
 */
export function useSystemInfo(enabled = true) {
  return useQuery({
    queryKey: paletteKeys.system.info(),
    queryFn: fetchSystemInfo,
    enabled,
    staleTime: 10 * 60_000, // 10 minutes
  });
}
