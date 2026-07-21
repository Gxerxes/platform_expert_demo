/**
 * Palette Query Hooks
 *
 * Central export for all platform query hooks.
 */

// Core hooks
export { usePlatformQuery } from './usePlatformQuery';
export type { UsePlatformQueryOptions, UsePlatformQueryResult } from './usePlatformQuery';

export { usePlatformMutation } from './usePlatformMutation';
export type { UsePlatformMutationOptions, UsePlatformMutationResult } from './usePlatformMutation';

export { usePlatformInfiniteQuery } from './usePlatformInfiniteQuery';
export type {
  UsePlatformInfiniteQueryOptions,
  UsePlatformInfiniteQueryResult,
  PaginatedResponse,
} from './usePlatformInfiniteQuery';

// Pre-built platform endpoint hooks
export {
  useSession,
  useUserContext,
  useEidpUserInfo,
  useRuntimeConfig,
  useSystemInfo,
} from './usePlatformEndpoints';
