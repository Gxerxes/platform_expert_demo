/**
 * @palette/context — Type Definitions
 *
 * Enterprise-grade multi-tenant context types for the Palette platform.
 * Supports tenant resolution, switching, and tenant-aware context management.
 */

// ─── Tenant Types ─────────────────────────────────────────

/**
 * Tenant status in the platform.
 */
export type TenantStatus = 'active' | 'suspended' | 'pending' | 'archived';

/**
 * Represents a tenant (organization/business unit) in the platform.
 * Multi-tenant isolation ensures each tenant has its own data, configuration,
 * and user scope.
 */
export interface TenantInfo {
  /** Unique tenant identifier (e.g., 'clearing-dept', 'risk-mgmt') */
  id: string;
  /** Display name for UI */
  displayName: string;
  /** Short code used in URLs/headers (e.g., 'CLR', 'RSK') */
  code: string;
  /** Tenant status */
  status: TenantStatus;
  /** Tenant logo URL */
  logoUrl?: string;
  /** Primary contact email */
  contactEmail?: string;
  /** Tenant-specific configuration overrides */
  config?: Record<string, unknown>;
  /** Available features for this tenant */
  features?: string[];
  /** When the tenant was created (ISO 8601) */
  createdAt?: string;
}

/**
 * Strategy for resolving the current tenant.
 */
export type TenantResolutionStrategy =
  | 'url'        // Resolve from URL path (e.g., /clr/dashboard → tenant 'clr')
  | 'header'     // Resolve from HTTP header (X-Tenant-ID)
  | 'session'    // Resolve from user session/profile
  | 'localStorage' // Resolve from browser localStorage
  | 'default';   // Use default tenant

/**
 * Configuration for tenant resolution.
 */
export interface TenantResolutionConfig {
  /** Primary resolution strategy (default: 'session') */
  strategy?: TenantResolutionStrategy;
  /** Fallback strategy if primary fails (default: 'default') */
  fallbackStrategy?: TenantResolutionStrategy;
  /** Default tenant ID when no tenant can be resolved */
  defaultTenantId?: string;
  /** URL path prefix pattern for 'url' strategy (default: '/:tenantId/') */
  urlPattern?: string;
  /** localStorage key for 'localStorage' strategy (default: 'palette:tenant') */
  storageKey?: string;
  /** HTTP header name for 'header' strategy (default: 'X-Tenant-ID') */
  headerName?: string;
}

// ─── Tenant Context ───────────────────────────────────────

/**
 * Current tenant context state.
 */
export interface TenantContextState {
  /** Current active tenant */
  currentTenant: TenantInfo | null;
  /** All tenants available to the current user */
  availableTenants: TenantInfo[];
  /** Whether tenant resolution is in progress */
  loading: boolean;
  /** Error during tenant resolution */
  error: Error | null;
  /** Resolution strategy used */
  resolvedBy: TenantResolutionStrategy | null;
}

/**
 * Tenant context value exposed by ContextProvider.
 */
export interface TenantContextValue extends TenantContextState {
  /** Switch to a different tenant */
  switchTenant: (tenantId: string) => Promise<void>;
  /** Refresh tenant list from BFF */
  refreshTenants: () => Promise<void>;
  /** Check if user has access to a specific tenant */
  hasTenantAccess: (tenantId: string) => boolean;
  /** Get current tenant ID (convenience) */
  tenantId: string | null;
}

// ─── Enhanced User Context ────────────────────────────────

/**
 * Full user context including tenant information.
 * Returned by BFF /context endpoint.
 */
export interface FullUserContext {
  /** User information */
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
  };
  /** Current environment */
  environment: string;
  /** User locale preference */
  locale: string;
  /** User timezone */
  timezone: string;
  /** Current tenant (if multi-tenant) */
  tenant?: TenantInfo;
  /** Available tenants for the current user */
  availableTenants?: TenantInfo[];
}

// ─── Tenant Events ────────────────────────────────────────

/**
 * Tenant lifecycle event types.
 */
export type TenantEventType =
  | 'tenant:switched'
  | 'tenant:resolved'
  | 'tenant:access-denied'
  | 'tenant:error';

/**
 * Tenant event payload.
 */
export interface TenantEvent {
  type: TenantEventType;
  timestamp: number;
  tenantId?: string;
  previousTenantId?: string;
  error?: Error;
}
