/**
 * @palette/router — Type Definitions
 *
 * Enterprise-grade dynamic menu and permission routing types.
 * Extends basic route configuration with menu metadata, permission guards,
 * and dynamic route registration capabilities.
 */

import type { ComponentType, LazyExoticComponent } from 'react';
import type { PermissionMode } from '@palette/auth';

// ─── Menu Item Types ──────────────────────────────────────

/**
 * Icon specification for menu items.
 * Supports icon class names, SVG paths, or React components.
 */
export interface MenuIcon {
  /** Icon class name (e.g., 'icon-dashboard') */
  className?: string;
  /** SVG path data for custom icons */
  svgPath?: string;
  /** Emoji fallback for quick prototyping */
  emoji?: string;
}

/**
 * Menu item metadata for sidebar/navigation rendering.
 * Attached to route configurations to drive dynamic menu generation.
 */
export interface MenuMeta {
  /** Display title for the menu item */
  title: string;
  /** Menu icon specification */
  icon?: MenuIcon;
  /** Sort order (lower = higher in menu). Default: 100 */
  order?: number;
  /** Whether to hide this item from menu (still accessible via route). Default: false */
  hidden?: boolean;
  /** Badge text (e.g., 'New', 'Beta', count) */
  badge?: string;
  /** Badge color (CSS color value) */
  badgeColor?: string;
  /** External link URL (opens in new tab) */
  externalUrl?: string;
  /** Whether to group children as a collapsible section. Default: false */
  collapsible?: boolean;
  /** Whether the section starts collapsed. Default: false */
  defaultCollapsed?: boolean;
}

// ─── Permission Guard Types ───────────────────────────────

/**
 * Permission requirement for a route or menu item.
 * When specified, the route/menu is only accessible/visible
 * to users with matching permissions.
 */
export interface RoutePermission {
  /** Required permission(s) */
  permissions: string | string[];
  /** Permission check mode: 'all' (AND), 'any' (OR), 'exact' */
  mode?: PermissionMode;
  /** Required role(s) — alternative to permission strings */
  roles?: string | string[];
  /** Role check mode: 'any' (OR) or 'all' (AND) */
  roleMode?: 'any' | 'all';
}

// ─── Enhanced Route Configuration ─────────────────────────

/**
 * Enterprise route configuration with menu and permission metadata.
 * Extends the basic route config for dynamic menu generation
 * and permission-based route filtering.
 */
export interface MenuRouteConfig {
  /** Route path pattern (e.g., '/dashboard', '/trades/:id') */
  path: string;
  /** Lazy-loaded page component */
  component: LazyExoticComponent<ComponentType>;
  /** Child routes */
  children?: MenuRouteConfig[];
  /** Whether authentication is required (default: true) */
  protected?: boolean;

  /** Menu metadata — if set, this route appears in navigation */
  menu?: MenuMeta;

  /** Permission requirement — route/menu filtered by user permissions */
  permission?: RoutePermission;

  /**
   * Feature flag key — route only active when flag is enabled.
   * Integrates with @palette/config feature flags.
   */
  featureFlag?: string;

  /**
   * Custom data attached to this route.
   * Accessible via useRouteData() hook.
   */
  data?: Record<string, unknown>;
}

// ─── Resolved Menu Item ───────────────────────────────────

/**
 * Resolved menu item after permission filtering and route matching.
 * Used by Sidebar/Navigation components for rendering.
 */
export interface ResolvedMenuItem {
  /** Unique key (derived from path) */
  key: string;
  /** Display title */
  title: string;
  /** Route path for navigation */
  path: string;
  /** Menu icon */
  icon?: MenuIcon;
  /** Sort order */
  order: number;
  /** Whether hidden from menu */
  hidden: boolean;
  /** Badge text */
  badge?: string;
  /** Badge color */
  badgeColor?: string;
  /** External URL */
  externalUrl?: string;
  /** Whether this item has children (collapsible group) */
  hasChildren: boolean;
  /** Whether the group is collapsible */
  collapsible: boolean;
  /** Whether the group starts collapsed */
  defaultCollapsed: boolean;
  /** Child menu items */
  children: ResolvedMenuItem[];
  /** Whether this item is currently active (matched by location) */
  active?: boolean;
}

// ─── Dynamic Route Registration ───────────────────────────

/**
 * Route module registration descriptor.
 * Business applications register their route modules dynamically.
 */
export interface RouteModule {
  /** Unique module identifier (e.g., 'trading', 'clearing') */
  id: string;
  /** Module display name */
  name: string;
  /** Route configurations for this module */
  routes: MenuRouteConfig[];
  /** Base path prefix for all routes in this module */
  basePath?: string;
  /** Module-level permission (all routes in module require this) */
  permission?: RoutePermission;
  /** Load priority (lower = loaded first). Default: 100 */
  priority?: number;
}

/**
 * Route registry state.
 */
export interface RouteRegistryState {
  /** Registered modules */
  modules: RouteModule[];
  /** Whether registry is ready (all modules loaded) */
  ready: boolean;
  /** Total registered route count */
  routeCount: number;
}
