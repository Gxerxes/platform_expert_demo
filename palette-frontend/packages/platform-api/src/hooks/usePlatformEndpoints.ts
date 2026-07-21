/**
 * Pre-built query hooks for Palette platform endpoints.
 *
 * These hooks provide ready-to-use data fetching for all platform-level
 * APIs (session, user context, config, system info). Business applications
 * can use these directly without writing their own query definitions.
 *
 * Usage:
 * ```tsx
 * import { useSession, useUserContext, useRuntimeConfig } from '@palette/api';
 *
 * function UserProfile() {
 *   const { data: user, isLoading } = useUserContext();
 *   if (isLoading) return <Spinner />;
 *   return <span>{user?.user.displayName}</span>;
 * }
 * ```
 */

import { usePlatformQuery } from './usePlatformQuery';
import type { UsePlatformQueryOptions } from './usePlatformQuery';
import { paletteKeys } from '../queryKeys';
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
} from '../endpoints';

// ─── Session Hooks ─────────────────────────────────────────

/**
 * Query hook for current session status.
 *
 * @param options - Override default query options (e.g., `enabled`, `staleTime`)
 *
 * @example
 * ```tsx
 * const { data: session, isLoading } = useSession();
 * if (!session?.authenticated) {
 *   redirect('/login');
 * }
 * ```
 */
export function useSession(
  options?: Partial<UsePlatformQueryOptions<SessionInfo>>,
) {
  return usePlatformQuery<SessionInfo>({
    queryKey: paletteKeys.session.current(),
    queryFn: checkSession,
    staleTime: 30_000, // Session data is valid for 30s
    ...options,
  });
}

// ─── User Hooks ────────────────────────────────────────────

/**
 * Query hook for current user context (from BFF).
 *
 * @param options - Override default query options
 *
 * @example
 * ```tsx
 * const { data: context } = useUserContext();
 * console.log(`Welcome, ${context?.user.displayName}`);
 * ```
 */
export function useUserContext(
  options?: Partial<UsePlatformQueryOptions<UserContext>>,
) {
  return usePlatformQuery<UserContext>({
    queryKey: paletteKeys.user.context(),
    queryFn: fetchUserContext,
    staleTime: 60_000, // User context rarely changes, cache for 1 min
    ...options,
  });
}

/**
 * Query hook for eIDP user info (from identity provider via BFF).
 *
 * @param options - Override default query options
 *
 * @example
 * ```tsx
 * const { data: eidpUser } = useEidpUserInfo();
 * console.log(`Email: ${eidpUser?.email}`);
 * ```
 */
export function useEidpUserInfo(
  options?: Partial<UsePlatformQueryOptions<EidpUserInfo>>,
) {
  return usePlatformQuery<EidpUserInfo>({
    queryKey: paletteKeys.user.eidpInfo(),
    queryFn: fetchEidpUserInfo,
    staleTime: 60_000,
    ...options,
  });
}

// ─── Config Hooks ──────────────────────────────────────────

/**
 * Query hook for runtime configuration.
 *
 * @param options - Override default query options
 *
 * @example
 * ```tsx
 * const { data: config } = useRuntimeConfig();
 * if (config?.features['new-dashboard']) {
 *   showNewDashboard();
 * }
 * ```
 */
export function useRuntimeConfig(
  options?: Partial<UsePlatformQueryOptions<RuntimeConfig>>,
) {
  return usePlatformQuery<RuntimeConfig>({
    queryKey: paletteKeys.config.runtime(),
    queryFn: fetchRuntimeConfig,
    staleTime: 5 * 60_000, // Config is very stable, cache for 5 min
    ...options,
  });
}

// ─── System Hooks ──────────────────────────────────────────

/**
 * Query hook for system/application info.
 *
 * @param options - Override default query options
 *
 * @example
 * ```tsx
 * const { data: info } = useSystemInfo();
 * console.log(`Running v${info?.version}`);
 * ```
 */
export function useSystemInfo(
  options?: Partial<UsePlatformQueryOptions<SystemInfo>>,
) {
  return usePlatformQuery<SystemInfo>({
    queryKey: paletteKeys.system.info(),
    queryFn: fetchSystemInfo,
    staleTime: 10 * 60_000, // System info rarely changes, cache for 10 min
    ...options,
  });
}
