/**
 * @palette/context — Public API
 *
 * Enterprise-grade user context and multi-tenant management
 * for the Palette platform.
 *
 * Features:
 * - User context (environment, locale, timezone)
 * - Multi-tenant resolution and switching
 * - Tenant access control
 * - Tenant lifecycle events
 *
 * @example
 *   // Basic usage
 *   import { ContextProvider, usePaletteContext } from '@palette/context';
 *
 *   <ContextProvider multiTenant tenantConfig={{ strategy: 'session' }}>
 *     <App />
 *   </ContextProvider>
 *
 *   // Consume context
 *   const { user, currentTenant, switchTenant } = usePaletteContext();
 *
 *   // Tenant-only hook
 *   const { currentTenant, availableTenants } = useTenantContext();
 *
 * @packageDocumentation
 */

// ─── Provider & Hooks ─────────────────────────────────────
export { ContextProvider, usePaletteContext, useTenantContext } from './ContextProvider';
export type { PaletteContextValue } from './ContextProvider';

// ─── Tenant Hook ──────────────────────────────────────────
export { useTenant, onTenantEvent } from './useTenant';

// ─── Types ────────────────────────────────────────────────
export type {
  TenantInfo,
  TenantStatus,
  TenantResolutionStrategy,
  TenantResolutionConfig,
  TenantContextState,
  TenantContextValue,
  FullUserContext,
  TenantEventType,
  TenantEvent,
} from './types';
