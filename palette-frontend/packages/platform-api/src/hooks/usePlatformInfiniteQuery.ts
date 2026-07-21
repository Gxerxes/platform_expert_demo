import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { QueryKey } from '../queryKeys';
import { classifyError, type PlatformError } from '../errors';

/**
 * Standard paginated response shape from Palette BFF services.
 * Business services should return data in this format for infinite query support.
 */
export interface PaginatedResponse<T> {
  /** Array of items in this page */
  content: T[];
  /** Current page number (0-based) */
  page: number;
  /** Number of items per page */
  size: number;
  /** Total number of items across all pages */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages after this one */
  hasNext: boolean;
}

/**
 * Options for `usePlatformInfiniteQuery`.
 */
export interface UsePlatformInfiniteQueryOptions<TData> {
  /** Query key from paletteKeys or createDomainKeys factory */
  queryKey: QueryKey;
  /**
   * Async function that fetches a page of data.
   * Receives `pageParam` from `getNextPageParam`.
   */
  queryFn: (params: { pageParam: number }) => Promise<TData>;
  /**
   * Function that extracts the next page parameter from the last page.
   * Return `undefined` to indicate no more pages.
   *
   * @default For PaginatedResponse<T>: returns `lastPage.hasNext ? lastPage.page + 1 : undefined`
   */
  getNextPageParam?: (lastPage: TData) => number | undefined;
  /** Starting page parameter (default: 0) */
  initialPageParam?: number;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** GC time in milliseconds */
  gcTime?: number;
}

/**
 * Result type for `usePlatformInfiniteQuery`.
 */
export type UsePlatformInfiniteQueryResult<TData> =
  UseInfiniteQueryResult<TData, PlatformError>;

/**
 * Platform-enhanced `useInfiniteQuery` hook for paginated data.
 *
 * Wraps TanStack Query's `useInfiniteQuery` with:
 * - Automatic error classification
 * - Default paginated response handling
 * - Integration with the query key factory system
 *
 * @example
 * ```tsx
 * // Using with PaginatedResponse<T>
 * const orderKeys = createDomainKeys('orders');
 *
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = usePlatformInfiniteQuery<PaginatedResponse<Order>>({
 *   queryKey: orderKeys.infinite({ status: 'OPEN' }),
 *   queryFn: ({ pageParam }) => fetchOrders({ page: pageParam, size: 20 }),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) =>
 *     lastPage.hasNext ? lastPage.page + 1 : undefined,
 * });
 *
 * // Render:
 * return (
 *   <>
 *     {data?.pages.flatMap(page => page.content.map(order => (
 *       <OrderRow key={order.id} order={order} />
 *     )))}
 *     {hasNextPage && (
 *       <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *         {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *       </button>
 *     )}
 *   </>
 * );
 * ```
 */
export function usePlatformInfiniteQuery<TData>(
  options: UsePlatformInfiniteQueryOptions<TData>,
): UsePlatformInfiniteQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    getNextPageParam,
    initialPageParam = 0,
    enabled,
    staleTime,
    gcTime,
  } = options;

  // Default getNextPageParam for PaginatedResponse<T>
  const defaultGetNextPageParam = (lastPage: unknown): number | undefined => {
    const page = lastPage as PaginatedResponse<unknown>;
    if (typeof page.hasNext === 'boolean') {
      return page.hasNext ? page.page + 1 : undefined;
    }
    return undefined;
  };

  return useInfiniteQuery({
    queryKey: queryKey as string[],
    queryFn: async ({ pageParam }) => {
      try {
        return await queryFn({ pageParam: pageParam as number });
      } catch (error) {
        throw classifyError(error);
      }
    },
    initialPageParam,
    getNextPageParam: getNextPageParam ?? defaultGetNextPageParam,
    enabled,
    staleTime,
    gcTime,
  }) as UsePlatformInfiniteQueryResult<TData>;
}
