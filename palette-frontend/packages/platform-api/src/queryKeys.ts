/**
 * Type-safe Query Key factory for Palette applications.
 *
 * Provides a hierarchical, composable query key system that prevents
 * key collisions and makes cache invalidation predictable.
 *
 * Usage:
 * ```ts
 * // All platform keys
 * paletteKeys.all          // ['palette']
 *
 * // Session
 * paletteKeys.session.all  // ['palette', 'session']
 * paletteKeys.session.current() // ['palette', 'session', 'current']
 *
 * // Business domain (example for a trading service)
 * const tradeKeys = createDomainKeys('trades');
 * tradeKeys.all              // ['palette', 'domain', 'trades']
 * tradeKeys.lists()          // ['palette', 'domain', 'trades', 'list']
 * tradeKeys.list({ status: 'OPEN' }) // ['palette', 'domain', 'trades', 'list', { status: 'OPEN' }]
 * tradeKeys.detail('abc-123')        // ['palette', 'domain', 'trades', 'detail', 'abc-123']
 * ```
 */

// ─── Utility Types ─────────────────────────────────────────

/**
 * A query key is always an array of serializable segments.
 */
export type QueryKey = readonly unknown[];

// ─── Platform Key Factories ────────────────────────────────

/**
 * Session-related query keys.
 */
const sessionKeys = {
  all: ['palette', 'session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
} as const;

/**
 * User context query keys.
 */
const userKeys = {
  all: ['palette', 'user'] as const,
  context: () => [...userKeys.all, 'context'] as const,
  eidpInfo: () => [...userKeys.all, 'eidp-info'] as const,
} as const;

/**
 * Config-related query keys.
 */
const configKeys = {
  all: ['palette', 'config'] as const,
  runtime: () => [...configKeys.all, 'runtime'] as const,
} as const;

/**
 * System-related query keys.
 */
const systemKeys = {
  all: ['palette', 'system'] as const,
  info: () => [...systemKeys.all, 'info'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
} as const;

/**
 * Root key factory — aggregates all platform query keys.
 */
export const paletteKeys = {
  all: ['palette'] as const,

  /** Session queries */
  session: sessionKeys,

  /** User & identity queries */
  user: userKeys,

  /** Runtime configuration queries */
  config: configKeys,

  /** System health & info queries */
  system: systemKeys,
} as const;

// ─── Domain Key Factory ────────────────────────────────────

/**
 * Create a domain-specific query key factory for business services.
 *
 * This ensures consistent key structure across all business modules
 * and enables predictable cache invalidation patterns.
 *
 * @param domain - The business domain name (e.g., 'trades', 'orders', 'tasks')
 *
 * @example
 * ```ts
 * const orderKeys = createDomainKeys('orders');
 *
 * // In a query hook:
 * useQuery({
 *   queryKey: orderKeys.list({ status: 'PENDING' }),
 *   queryFn: () => fetchOrders({ status: 'PENDING' }),
 * });
 *
 * // Invalidate all orders after mutation:
 * queryClient.invalidateQueries({ queryKey: orderKeys.all });
 *
 * // Invalidate only lists:
 * queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
 * ```
 */
export function createDomainKeys<TDomain extends string>(domain: TDomain) {
  const base = ['palette', 'domain', domain] as const;

  return {
    /** All keys for this domain — use for full invalidation */
    all: [...base] as const,

    /** All list queries for this domain */
    lists: () => [...base, 'list'] as const,

    /**
     * A specific list query with filters.
     * The filters object is included in the key for cache isolation.
     */
    list: <TFilters extends Record<string, unknown>>(filters?: TFilters) =>
      [...base, 'list', filters ?? 'all'] as const,

    /** All detail/single-item queries for this domain */
    details: () => [...base, 'detail'] as const,

    /**
     * A specific detail query by ID.
     */
    detail: (id: string | number) =>
      [...base, 'detail', id] as const,

    /**
     * Infinite query key (for paginated/infinite scroll).
     */
    infinite: <TFilters extends Record<string, unknown>>(filters?: TFilters) =>
      [...base, 'infinite', filters ?? 'all'] as const,

    /**
     * Custom sub-key for domain-specific queries.
     */
    custom: <TSub extends string>(sub: TSub, ...segments: unknown[]) =>
      [...base, sub, ...segments] as const,
  } as const;
}

/**
 * Helper type: Extract the domain key type for use in generic constraints.
 */
export type DomainKeys = ReturnType<typeof createDomainKeys<string>>;
