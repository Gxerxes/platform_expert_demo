/**
 * @palette/api — Public API
 *
 * Enterprise-grade API client and TanStack Query integration
 * for the Palette platform.
 *
 * Features:
 * - Centralized Axios client with interceptors
 * - Platform error classification
 * - TanStack Query v5 integration
 * - Type-safe query key factories
 * - Pre-built hooks for all BFF endpoints
 * - Business hook patterns (pagination, polling, optimistic updates)
 *
 * @example
 *   // Basic query
 *   import { usePlatformQuery, paletteKeys } from '@palette/api';
 *
 *   const { data } = usePlatformQuery({
 *     queryKey: paletteKeys.session.current(),
 *     queryFn: checkSession,
 *   });
 *
 *   // Business pattern
 *   import { usePaginatedQuery, useMutationWithInvalidate } from '@palette/api';
 *
 *   const { data, page, nextPage } = usePaginatedQuery({
 *     queryKey: ['trades'],
 *     queryFn: ({ page, pageSize }) => fetchTrades({ page, pageSize }),
 *   });
 */

// ─── Core Client ───────────────────────────────────────────
export { paletteApi, setUnauthorizedHandler, setErrorHandler, setLoggingOut } from './client';
export type { ApiError, ApiResponse } from './client';

// ─── Error Handling ────────────────────────────────────────
export { PlatformErrorCode, classifyError } from './errors';
export type { PlatformError } from './errors';

// ─── Platform Endpoints ────────────────────────────────────
export {
  checkSession,
  login,
  logout,
  fetchUserContext,
  fetchAvailableTenants,
  switchTenantApi,
  fetchEidpUserInfo,
  fetchRuntimeConfig,
  fetchSystemInfo,
} from './endpoints';
export type {
  SessionInfo,
  LogoutResponse,
  UserInfo,
  UserContext,
  TenantInfo,
  TenantSwitchResponse,
  EidpUserInfo,
  RuntimeConfig,
  SystemInfo,
} from './endpoints';

// ─── TanStack Query Integration ────────────────────────────

// QueryClient factory & singleton
export { createPaletteQueryClient, paletteQueryClient } from './queryClient';
export type { QueryClient } from '@tanstack/react-query';

// Query Key factories
export { paletteKeys, createDomainKeys } from './queryKeys';
export type { QueryKey, DomainKeys } from './queryKeys';

// React Provider
export { PaletteQueryProvider } from './PaletteQueryProvider';
export type { PaletteQueryProviderProps } from './PaletteQueryProvider';

// ─── Core Hooks ────────────────────────────────────────────
export {
  usePlatformQuery,
  usePlatformMutation,
  usePlatformInfiniteQuery,
  // Pre-built platform hooks
  useSession,
  useUserContext,
  useEidpUserInfo,
  useRuntimeConfig,
  useSystemInfo,
} from './hooks';

export type {
  UsePlatformQueryOptions,
  UsePlatformQueryResult,
  UsePlatformMutationOptions,
  UsePlatformMutationResult,
  UsePlatformInfiniteQueryOptions,
  UsePlatformInfiniteQueryResult,
  PaginatedResponse,
} from './hooks';

// ─── Business Hook Patterns ────────────────────────────────
export {
  // Pagination
  usePaginatedQuery,
  // Polling
  usePolling,
  // Debounced search
  useDebouncedQuery,
  // Optimistic updates
  useOptimisticMutation,
  // Mutation with auto-invalidation
  useMutationWithInvalidate,
  // Enhanced status
  useQueryWithStatus,
} from './businessHooks';

export type {
  // Pagination types
  PaginationState,
  UsePaginatedQueryOptions,
  UsePaginatedQueryResult,
  // Polling types
  UsePollingOptions,
  // Debounce types
  UseDebouncedQueryOptions,
  // Optimistic types
  UseOptimisticMutationOptions,
  // Mutation invalidate types
  UseMutationWithInvalidateOptions,
  // Status types
  QueryStatus,
} from './businessHooks';

// ─── Re-exports from @tanstack/react-query ─────────────────
// Convenience re-exports so consumers don't need to install
// @tanstack/react-query directly for common utilities.
export {
  useQueryClient,
  useIsFetching,
  useIsMutating,
  useQuery,
  useMutation,
  useInfiniteQuery,
  useSuspenseQuery,
  usePrefetchQuery,
  QueryClient as TanstackQueryClient,
} from '@tanstack/react-query';
