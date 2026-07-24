/**
 * @palette/context — Tenant Hook
 *
 * Provides tenant resolution, switching, and access control.
 * Supports multiple resolution strategies: URL, localStorage, session, header.
 *
 * Usage:
 *   const { currentTenant, switchTenant, availableTenants } = useTenant();
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchUserContext, fetchAvailableTenants, switchTenantApi, type TenantInfo } from '@palette/api';
import type { TenantResolutionConfig, TenantResolutionStrategy, TenantContextValue, TenantEvent } from './types';

// ─── Tenant Event Bus ─────────────────────────────────────

type TenantEventListener = (event: TenantEvent) => void;
const tenantListeners = new Set<TenantEventListener>();

function emitTenantEvent(event: TenantEvent) {
  tenantListeners.forEach((listener) => {
    try { listener(event); } catch { /* ignore */ }
  });
}

/**
 * Subscribe to tenant lifecycle events.
 */
export function onTenantEvent(listener: TenantEventListener): () => void {
  tenantListeners.add(listener);
  return () => tenantListeners.delete(listener);
}

// ─── Tenant Resolution ────────────────────────────────────

function resolveFromUrl(pattern: string): string | null {
  const path = window.location.pathname;
  // Pattern like '/:tenantId/' → match first path segment
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    // Check if first segment looks like a tenant code (short, alphanumeric)
    const first = segments[0];
    if (/^[a-zA-Z][a-zA-Z0-9-]{1,20}$/.test(first)) {
      return first;
    }
  }
  return null;
}

function resolveFromLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveToLocalStorage(key: string, tenantId: string) {
  try {
    localStorage.setItem(key, tenantId);
  } catch {
    // Ignore storage errors
  }
}

// ─── Default Config ───────────────────────────────────────

const DEFAULT_CONFIG: Required<TenantResolutionConfig> = {
  strategy: 'session',
  fallbackStrategy: 'default',
  defaultTenantId: 'default',
  urlPattern: '/:tenantId/',
  storageKey: 'palette:tenant',
  headerName: 'X-Tenant-ID',
};

// ─── useTenant Hook ───────────────────────────────────────

/**
 * Hook providing multi-tenant context management.
 * Handles tenant resolution, switching, and access validation.
 *
 * @param config - Tenant resolution configuration
 * @returns Tenant context value with switching capabilities
 *
 * @example
 *   function TenantSwitcher() {
 *     const { currentTenant, availableTenants, switchTenant } = useTenant();
 *
 *     return (
 *       <select onChange={(e) => switchTenant(e.target.value)} value={currentTenant?.id}>
 *         {availableTenants.map(t => (
 *           <option key={t.id} value={t.id}>{t.displayName}</option>
 *         ))}
 *       </select>
 *     );
 *   }
 */
export function useTenant(config?: TenantResolutionConfig): TenantContextValue {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [resolvedBy, setResolvedBy] = useState<TenantResolutionStrategy | null>(null);
  const initialized = useRef(false);

  // Resolve tenant from configured strategy
  const resolveTenant = useCallback(
    (tenants: TenantInfo[], strategy: TenantResolutionStrategy): TenantInfo | null => {
      let tenantId: string | null = null;

      switch (strategy) {
        case 'url':
          tenantId = resolveFromUrl(cfg.urlPattern);
          break;
        case 'localStorage':
          tenantId = resolveFromLocalStorage(cfg.storageKey);
          break;
        case 'session':
          // Session-based resolution: use first available tenant or default
          tenantId = tenants.length > 0 ? tenants[0].id : cfg.defaultTenantId;
          break;
        case 'default':
          tenantId = cfg.defaultTenantId;
          break;
        case 'header':
          // Header-based resolution is handled by BFF, not client
          tenantId = cfg.defaultTenantId;
          break;
      }

      if (!tenantId) return null;

      // Find matching tenant
      return tenants.find((t) => t.id === tenantId) ?? null;
    },
    [cfg.urlPattern, cfg.storageKey, cfg.defaultTenantId],
  );

  // Initialize tenant context
  const initTenant = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      setLoading(true);
      setError(null);

      // Fetch available tenants from BFF
      const tenants = await fetchAvailableTenants();
      setAvailableTenants(tenants);

      // Try primary strategy
      let tenant = resolveTenant(tenants, cfg.strategy);
      let usedStrategy = cfg.strategy;

      // Fallback if primary failed
      if (!tenant && cfg.fallbackStrategy !== cfg.strategy) {
        tenant = resolveTenant(tenants, cfg.fallbackStrategy);
        usedStrategy = cfg.fallbackStrategy;
      }

      if (tenant) {
        setCurrentTenant(tenant);
        setResolvedBy(usedStrategy);
        saveToLocalStorage(cfg.storageKey, tenant.id);

        emitTenantEvent({
          type: 'tenant:resolved',
          timestamp: Date.now(),
          tenantId: tenant.id,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resolve tenant'));
      emitTenantEvent({
        type: 'tenant:error',
        timestamp: Date.now(),
        error: err instanceof Error ? err : new Error('Failed to resolve tenant'),
      });
    } finally {
      setLoading(false);
    }
  }, [cfg, resolveTenant]);

  useEffect(() => {
    initTenant();
  }, [initTenant]);

  // Switch tenant
  const switchTenant = useCallback(
    async (tenantId: string) => {
      const previousTenantId = currentTenant?.id;

      // Check access
      if (!availableTenants.some((t) => t.id === tenantId)) {
        emitTenantEvent({
          type: 'tenant:access-denied',
          timestamp: Date.now(),
          tenantId,
        });
        throw new Error(`No access to tenant: ${tenantId}`);
      }

      try {
        setLoading(true);

        // Notify BFF of tenant switch
        await switchTenantApi(tenantId);

        const tenant = availableTenants.find((t) => t.id === tenantId);
        if (tenant) {
          setCurrentTenant(tenant);
          saveToLocalStorage(cfg.storageKey, tenantId);

          emitTenantEvent({
            type: 'tenant:switched',
            timestamp: Date.now(),
            tenantId,
            previousTenantId,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to switch tenant'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentTenant, availableTenants, cfg.storageKey],
  );

  // Refresh tenant list
  const refreshTenants = useCallback(async () => {
    try {
      const tenants = await fetchAvailableTenants();
      setAvailableTenants(tenants);
    } catch (err) {
      console.warn('[Palette Tenant] Failed to refresh tenants:', err);
    }
  }, []);

  // Check tenant access
  const hasTenantAccess = useCallback(
    (tenantId: string) => availableTenants.some((t) => t.id === tenantId),
    [availableTenants],
  );

  return {
    currentTenant,
    availableTenants,
    loading,
    error,
    resolvedBy,
    switchTenant,
    refreshTenants,
    hasTenantAccess,
    tenantId: currentTenant?.id ?? null,
  };
}
