/**
 * @palette/api — Business Hook Patterns
 *
 * Enterprise-grade hook patterns for common business scenarios.
 * These hooks provide reusable patterns for CRUD operations,
 * pagination, polling, optimistic updates, and debounced search.
 *
 * Features:
 * - usePaginatedQuery: Server-side pagination with cache
 * - usePolling: Periodic data refresh
 * - useDebouncedQuery: Search with debounce
 * - useOptimisticMutation: Optimistic UI updates
 * - useMutationWithInvalidate: Auto-invalidate related queries
 *
 * Usage:
 *   // Paginated list
 *   const { data, page, setPage } = usePaginatedQuery({
 *     queryKey: tradeKeys.list({ status: 'OPEN' }),
 *     queryFn: ({ page, pageSize }) => fetchTrades({ page, pageSize, status: 'OPEN' }),
 *   });
 *
 *   // Polling
 *   usePolling({
 *     queryKey: paletteKeys.system.health(),
 *     queryFn: fetchHealth,
 *     intervalMs: 30_000,
 *   });
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type { PlatformError } from './errors';

// ─── usePaginatedQuery ─────────────────────────────────────

/**
 * Pagination state and controls.
 */
export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface UsePaginatedQueryOptions<TData> {
  queryKey: QueryKey;
  queryFn: (params: PaginationState) => Promise<TData>;
  initialPage?: number;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
}

export interface UsePaginatedQueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: PlatformError | null;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

/**
 * Hook for server-side paginated queries.
 *
 * @example
 *   const { data, page, nextPage, prevPage } = usePaginatedQuery({
 *     queryKey: ['trades', 'list'],
 *     queryFn: ({ page, pageSize }) => fetchTrades({ page, pageSize }),
 *     pageSize: 20,
 *   });
 */
export function usePaginatedQuery<TData>(
  options: UsePaginatedQueryOptions<TData>
): UsePaginatedQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    initialPage = 1,
    pageSize = 20,
    enabled = true,
    staleTime = 10_000,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [currentPageSize, setPageSize] = useState(pageSize);

  const paginationParams = useMemo(() => ({ page, pageSize: currentPageSize }), [page, currentPageSize]);

  const query = useQuery<TData, PlatformError>({
    queryKey: [...queryKey, paginationParams],
    queryFn: () => queryFn(paginationParams),
    enabled,
    staleTime,
    placeholderData: (prev) => prev, // Keep previous data while loading new page
  });

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p: number) => setPage(Math.max(1, p)), []);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    page,
    pageSize: currentPageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    refetch: query.refetch,
  };
}

// ─── usePolling ────────────────────────────────────────────

export interface UsePollingOptions<TData> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  intervalMs: number;
  enabled?: boolean;
  /** Stop polling when this condition is met */
  stopWhen?: (data: TData | undefined) => boolean;
}

/**
 * Hook for periodic data polling.
 *
 * @example
 *   // Poll health endpoint every 30 seconds
 *   usePolling({
 *     queryKey: ['health'],
 *     queryFn: fetchHealth,
 *     intervalMs: 30_000,
 *   });
 *
 *   // Stop polling when task is complete
 *   usePolling({
 *     queryKey: ['task', taskId],
 *     queryFn: () => fetchTaskStatus(taskId),
 *     intervalMs: 2_000,
 *     stopWhen: (data) => data?.status === 'COMPLETED',
 *   });
 */
export function usePolling<TData>(options: UsePollingOptions<TData>) {
  const { queryKey, queryFn, intervalMs, enabled = true, stopWhen } = options;

  const [isActive, setIsActive] = useState(true);

  const query = useQuery<TData, PlatformError>({
    queryKey,
    queryFn,
    enabled: enabled && isActive,
    refetchInterval: isActive ? intervalMs : false,
    staleTime: 0, // Always consider stale for polling
  });

  // Check stop condition
  useEffect(() => {
    if (stopWhen && stopWhen(query.data)) {
      setIsActive(false);
    }
  }, [query.data, stopWhen]);

  // Reset active state when queryKey changes
  useEffect(() => {
    setIsActive(true);
  }, [queryKey]);

  return {
    ...query,
    isActive,
    stop: () => setIsActive(false),
    start: () => setIsActive(true),
  };
}

// ─── useDebouncedQuery ─────────────────────────────────────

export interface UseDebouncedQueryOptions<TData> {
  queryKey: QueryKey;
  queryFn: (searchTerm: string) => Promise<TData>;
  searchTerm: string;
  debounceMs?: number;
  minChars?: number;
  enabled?: boolean;
}

/**
 * Hook for debounced search queries.
 * Waits for user to stop typing before fetching.
 *
 * @example
 *   const [search, setSearch] = useState('');
 *   const { data: results } = useDebouncedQuery({
 *     queryKey: ['users', 'search'],
 *     queryFn: (term) => searchUsers(term),
 *     searchTerm: search,
 *     debounceMs: 300,
 *     minChars: 2,
 *   });
 */
export function useDebouncedQuery<TData>(options: UseDebouncedQueryOptions<TData>) {
  const {
    queryKey,
    queryFn,
    searchTerm,
    debounceMs = 300,
    minChars = 1,
    enabled = true,
  } = options;

  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const shouldFetch = enabled && debouncedTerm.length >= minChars;

  const query = useQuery<TData, PlatformError>({
    queryKey: [...queryKey, debouncedTerm],
    queryFn: () => queryFn(debouncedTerm),
    enabled: shouldFetch,
    staleTime: 30_000,
    placeholderData: (prev) => prev, // Show previous results while loading new search
  });

  return {
    ...query,
    debouncedTerm,
    isSearching: query.isLoading && shouldFetch,
  };
}

// ─── useOptimisticMutation ─────────────────────────────────

export interface UseOptimisticMutationOptions<TData, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, PlatformError, TVariables, TContext>, 'onMutate' | 'onError' | 'onSettled'> {
  queryKey: QueryKey;
  /** Get the optimistic data to insert into cache */
  getOptimisticData: (variables: TVariables) => TData;
  /** Called when mutation succeeds to rollback */
  onRollback?: (error: PlatformError) => void;
}

/**
 * Hook for optimistic UI updates.
 * Immediately updates cache, rolls back on error.
 *
 * @example
 *   const mutation = useOptimisticMutation({
 *     queryKey: todoKeys.detail(todoId),
 *     mutationFn: (data) => updateTodo(todoId, data),
 *     getOptimisticData: (data) => ({ ...existingTodo, ...data }),
 *     onRollback: (error) => toast.error('Failed to update'),
 *   });
 */
export function useOptimisticMutation<TData, TVariables, TContext = unknown>(
  options: UseOptimisticMutationOptions<TData, TVariables, TContext>
) {
  const { queryKey, getOptimisticData, onRollback, ...mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation<TData, PlatformError, TVariables, TContext>({
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current cache
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      const optimisticData = getOptimisticData(variables);
      queryClient.setQueryData<TData>(queryKey, optimisticData);

      return { previousData } as TContext;
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(queryKey, (context as { previousData: TData }).previousData);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── useMutationWithInvalidate ─────────────────────────────

export interface UseMutationWithInvalidateOptions<TData, TVariables>
  extends UseMutationOptions<TData, PlatformError, TVariables> {
  /** Query keys to invalidate after successful mutation */
  invalidateKeys: QueryKey[];
}

/**
 * Hook for mutations that automatically invalidate related queries.
 *
 * @example
 *   const createMutation = useMutationWithInvalidate({
 *     mutationFn: (data) => createTrade(data),
 *     invalidateKeys: [tradeKeys.all],
 *     onSuccess: () => toast.success('Trade created'),
 *   });
 */
export function useMutationWithInvalidate<TData, TVariables>(
  options: UseMutationWithInvalidateOptions<TData, TVariables>
) {
  const { invalidateKeys, onSuccess, ...mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation<TData, PlatformError, TVariables>({
    ...mutationOptions,
    onSuccess: (data, variables, context, _mutationContext) => {
      // Invalidate all specified keys
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      // Call user's onSuccess
      onSuccess?.(data, variables, context, _mutationContext);
    },
  });
}

// ─── useQueryWithStatus ────────────────────────────────────

export interface QueryStatus<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: PlatformError | null;
  /** Convenience: is in initial loading state (no data yet) */
  isInitialLoading: boolean;
  /** Convenience: is fetching in background (has data) */
  isBackgroundFetching: boolean;
}

/**
 * Hook wrapper that provides enhanced status information.
 * Useful for complex loading states.
 *
 * @example
 *   const status = useQueryWithStatus({
 *     queryKey: ['data'],
 *     queryFn: fetchData,
 *   });
 *
 *   if (status.isInitialLoading) return <Spinner />;
 *   if (status.isError) return <Error error={status.error} />;
 *   if (!status.data) return <Empty />;
 *   return <DataView data={status.data} />;
 */
export function useQueryWithStatus<TData>(
  options: Omit<UseQueryOptions<TData, PlatformError>, 'queryKey'> & { queryKey: QueryKey }
): QueryStatus<TData> {
  const query = useQuery<TData, PlatformError>(options);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error ?? null,
    isInitialLoading: query.isLoading && !query.data,
    isBackgroundFetching: query.isFetching && !!query.data,
  };
}
