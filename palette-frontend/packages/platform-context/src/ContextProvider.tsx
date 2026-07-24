/**
 * @palette/context — ContextProvider
 *
 * Enterprise-grade context provider with multi-tenant support.
 * Combines user context (environment, locale, timezone) with
 * tenant context (resolution, switching, access control).
 *
 * Usage:
 *   <ContextProvider tenantConfig={{ strategy: 'session' }}>
 *     <App />
 *   </ContextProvider>
 *
 *   // Consume context
 *   const { user, environment, currentTenant, switchTenant } = usePaletteContext();
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchUserContext, type UserContext, type UserInfo } from '@palette/api';
import { useTenant } from './useTenant';
import type { TenantInfo, TenantResolutionConfig, TenantContextValue } from './types';

// ─── Context Value ────────────────────────────────────────

export interface PaletteContextValue {
  // ── User Context ──
  /** Current user info */
  user: UserInfo | null;
  /** Current environment (DEV/UAT/PRODUCTION) */
  environment: string;
  /** User locale preference */
  locale: string;
  /** User timezone */
  timezone: string;
  /** Whether context is loading */
  loading: boolean;
  /** Refresh context from BFF */
  refresh: () => Promise<void>;

  // ── Tenant Context ──
  /** Current active tenant */
  currentTenant: TenantInfo | null;
  /** All available tenants for current user */
  availableTenants: TenantInfo[];
  /** Whether tenant resolution is in progress */
  tenantLoading: boolean;
  /** Current tenant ID (convenience) */
  tenantId: string | null;
  /** Switch to a different tenant */
  switchTenant: (tenantId: string) => Promise<void>;
  /** Refresh tenant list from BFF */
  refreshTenants: () => Promise<void>;
  /** Check if user has access to a specific tenant */
  hasTenantAccess: (tenantId: string) => boolean;
  /** Whether multi-tenancy is enabled */
  multiTenant: boolean;
}

const ContextContext = createContext<PaletteContextValue>({
  user: null,
  environment: 'UNKNOWN',
  locale: 'en-US',
  timezone: 'UTC',
  loading: true,
  refresh: async () => {},
  currentTenant: null,
  availableTenants: [],
  tenantLoading: true,
  tenantId: null,
  switchTenant: async () => {},
  refreshTenants: async () => {},
  hasTenantAccess: () => false,
  multiTenant: false,
});

// ─── Provider ─────────────────────────────────────────────

interface ContextProviderProps {
  children: ReactNode;
  /** Enable multi-tenancy (default: false) */
  multiTenant?: boolean;
  /** Tenant resolution configuration */
  tenantConfig?: TenantResolutionConfig;
}

export function ContextProvider({
  children,
  multiTenant = false,
  tenantConfig,
}: ContextProviderProps) {
  // ── User Context State ──
  const [ctx, setCtx] = useState<Omit<PaletteContextValue, 'refresh' | keyof TenantContextValue | 'multiTenant'>>({
    user: null,
    environment: 'UNKNOWN',
    locale: 'en-US',
    timezone: 'UTC',
    loading: true,
  });

  // ── Tenant Context ──
  const tenant = useTenant(multiTenant ? tenantConfig : undefined);

  const refresh = useCallback(async () => {
    try {
      const data: UserContext = await fetchUserContext();
      setCtx({
        user: data.user,
        environment: data.environment,
        locale: data.locale,
        timezone: data.timezone,
        loading: false,
      });
    } catch (err) {
      console.warn('[Palette Context] Failed to load user context:', err);
      setCtx((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Combined Value ──
  const value: PaletteContextValue = {
    ...ctx,
    refresh,
    currentTenant: multiTenant ? tenant.currentTenant : null,
    availableTenants: multiTenant ? tenant.availableTenants : [],
    tenantLoading: multiTenant ? tenant.loading : false,
    tenantId: multiTenant ? tenant.tenantId : null,
    switchTenant: multiTenant ? tenant.switchTenant : async () => {},
    refreshTenants: multiTenant ? tenant.refreshTenants : async () => {},
    hasTenantAccess: multiTenant ? tenant.hasTenantAccess : () => true,
    multiTenant,
  };

  return (
    <ContextContext.Provider value={value}>
      {children}
    </ContextContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────

/**
 * Access the full Palette context (user + tenant).
 */
export function usePaletteContext(): PaletteContextValue {
  return useContext(ContextContext);
}

/**
 * Access only tenant-related context.
 * Convenience hook for tenant-focused components.
 */
export function useTenantContext(): Pick<
  PaletteContextValue,
  'currentTenant' | 'availableTenants' | 'tenantId' | 'switchTenant' | 'hasTenantAccess' | 'multiTenant'
> {
  const ctx = useContext(ContextContext);
  return {
    currentTenant: ctx.currentTenant,
    availableTenants: ctx.availableTenants,
    tenantId: ctx.tenantId,
    switchTenant: ctx.switchTenant,
    hasTenantAccess: ctx.hasTenantAccess,
    multiTenant: ctx.multiTenant,
  };
}
