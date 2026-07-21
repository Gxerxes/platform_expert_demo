import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { QueryKey } from '../queryKeys';
import { classifyError, type PlatformError } from '../errors';

/**
 * Options for `usePlatformQuery`.
 *
 * Extends TanStack Query's `UseQueryOptions` with Palette-specific defaults
 * and enforces the use of a query key from the key factory system.
 */
export type UsePlatformQueryOptions<TData, TError = PlatformError> = Omit<
  UseQueryOptions<TData, TError, TData, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  /** Query key from paletteKeys or createDomainKeys factory */
  queryKey: QueryKey;
  /** Async function that fetches data. Errors are auto-classified. */
  queryFn: () => Promise<TData>;
};

/**
 * Result type for `usePlatformQuery`.
 * Provides `PlatformError` as the default error type.
 */
export type UsePlatformQueryResult<TData> = UseQueryResult<TData, PlatformError>;

/**
 * Platform-enhanced `useQuery` hook.
 *
 * Wraps TanStack Query's `useQuery` with:
 * - Automatic error classification into `PlatformError`
 * - Enforced query key usage from the key factory system
 * - Consistent default options from the platform QueryClient
 *
 * @example
 * ```tsx
 * // Basic usage with domain keys
 * const orderKeys = createDomainKeys('orders');
 *
 * const { data, isLoading, error } = usePlatformQuery({
 *   queryKey: orderKeys.list({ status: 'OPEN' }),
 *   queryFn: () => fetchOrders({ status: 'OPEN' }),
 * });
 *
 * // With additional options
 * const { data } = usePlatformQuery({
 *   queryKey: orderKeys.detail(id),
 *   queryFn: () => fetchOrder(id),
 *   enabled: !!id,
 *   staleTime: 60_000,
 * });
 * ```
 */
export function usePlatformQuery<TData>(
  options: UsePlatformQueryOptions<TData>,
): UsePlatformQueryResult<TData> {
  const { queryKey, queryFn, ...rest } = options;

  return useQuery<TData, PlatformError, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        throw classifyError(error);
      }
    },
    ...rest,
  } as UseQueryOptions<TData, PlatformError, TData, QueryKey>);
}
