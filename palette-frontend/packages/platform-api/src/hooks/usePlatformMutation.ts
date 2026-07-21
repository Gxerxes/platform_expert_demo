import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { classifyError, type PlatformError } from '../errors';

/**
 * Options for `usePlatformMutation`.
 */
export type UsePlatformMutationOptions<TData, TVariables, TContext = unknown> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn'
> & {
  /** Async function that performs the mutation */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /**
   * Query keys to automatically invalidate after successful mutation.
   * Convenience option — you can also manually invalidate in onSuccess.
   *
   * @example
   * ```ts
   * invalidateOnSuccess: [orderKeys.all]
   * ```
   */
  invalidateOnSuccess?: readonly QueryKey[];
  /**
   * Query keys to automatically invalidate after failed mutation.
   */
  invalidateOnError?: readonly QueryKey[];
};

type TError = PlatformError;

/**
 * Result type for `usePlatformMutation`.
 */
export type UsePlatformMutationResult<TData, TVariables, TContext = unknown> =
  UseMutationResult<TData, TError, TVariables, TContext>;

/**
 * Platform-enhanced `useMutation` hook.
 *
 * Wraps TanStack Query's `useMutation` with:
 * - Automatic error classification into `PlatformError`
 * - Optional auto-invalidation of query keys on success/error
 * - Access to the platform QueryClient
 *
 * @example
 * ```tsx
 * const orderKeys = createDomainKeys('orders');
 *
 * const mutation = usePlatformMutation({
 *   mutationFn: (newOrder) => createOrder(newOrder),
 *   invalidateOnSuccess: [orderKeys.lists()],
 *   onSuccess: () => {
 *     toast.success('Order created');
 *   },
 * });
 *
 * // In your form:
 * mutation.mutate({ item: 'Widget', quantity: 10 });
 * ```
 */
export function usePlatformMutation<TData, TVariables, TContext = unknown>(
  options: UsePlatformMutationOptions<TData, TVariables, TContext>,
  queryClient?: QueryClient,
): UsePlatformMutationResult<TData, TVariables, TContext> {
  const defaultClient = useQueryClient();
  const client = queryClient ?? defaultClient;

  const {
    invalidateOnSuccess,
    invalidateOnError,
    onSuccess,
    onError,
    mutationFn,
    ...rest
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw classifyError(error);
      }
    },

    onSuccess: async (data, variables, onMutateResult, context) => {
      // Auto-invalidate specified query keys
      if (invalidateOnSuccess) {
        await Promise.all(
          invalidateOnSuccess.map((key) =>
            client.invalidateQueries({ queryKey: key as QueryKey }),
          ),
        );
      }

      // Call user's onSuccess handler
      onSuccess?.(data, variables, onMutateResult, context);
    },

    onError: async (error, variables, onMutateResult, context) => {
      // Auto-invalidate specified query keys on error
      if (invalidateOnError) {
        await Promise.all(
          invalidateOnError.map((key) =>
            client.invalidateQueries({ queryKey: key as QueryKey }),
          ),
        );
      }

      // Call user's onError handler
      onError?.(error, variables, onMutateResult, context);
    },

    ...rest,
  } as UseMutationOptions<TData, TError, TVariables, TContext>);
}
