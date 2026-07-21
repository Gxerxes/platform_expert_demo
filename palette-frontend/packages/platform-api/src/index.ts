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
  fetchEidpUserInfo,
  fetchRuntimeConfig,
  fetchSystemInfo,
} from './endpoints';
export type {
  SessionInfo,
  LogoutResponse,
  UserInfo,
  UserContext,
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

// Core hooks
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
