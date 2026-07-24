/**
 * @palette/router — Dynamic Menu Routes Hook
 *
 * Converts MenuRouteConfig[] into ResolvedMenuItem[] by:
 * 1. Filtering routes by user permissions
 * 2. Filtering routes by feature flags
 * 3. Sorting by menu order
 * 4. Resolving active state based on current location
 *
 * Usage:
 *   const menuItems = useMenuRoutes(routeConfigs);
 *   // Render menuItems in Sidebar
 */

import { useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useAuth, hasAnyPermission, hasAllPermissions, hasAnyRole } from '@palette/auth';
import { useConfig } from '@palette/config';
import type { MenuRouteConfig, ResolvedMenuItem, RoutePermission } from './types';

// ─── Permission Evaluation ────────────────────────────────

function checkRoutePermission(
  permission: RoutePermission | undefined,
  userPermissions: string[],
  userRoles: string[],
): boolean {
  if (!permission) return true;

  // Check permissions
  if (permission.permissions) {
    const perms = Array.isArray(permission.permissions)
      ? permission.permissions
      : [permission.permissions];
    const mode = permission.mode ?? 'all';

    const permResult =
      mode === 'all'
        ? hasAllPermissions(userPermissions, perms)
        : hasAnyPermission(userPermissions, perms);

    if (!permResult) return false;
  }

  // Check roles
  if (permission.roles) {
    const roles = Array.isArray(permission.roles) ? permission.roles : [permission.roles];
    const roleMode = permission.roleMode ?? 'any';

    const roleResult =
      roleMode === 'any'
        ? hasAnyRole(userRoles, roles)
        : roles.every((r) => userRoles.includes(r));

    if (!roleResult) return false;
  }

  return true;
}

// ─── Route Filtering ──────────────────────────────────────

function filterRoutesByPermission(
  routes: MenuRouteConfig[],
  userPermissions: string[],
  userRoles: string[],
): MenuRouteConfig[] {
  return routes
    .filter((route) => checkRoutePermission(route.permission, userPermissions, userRoles))
    .map((route) => ({
      ...route,
      children: route.children
        ? filterRoutesByPermission(route.children, userPermissions, userRoles)
        : undefined,
    }));
}

function filterRoutesByFeatureFlag(
  routes: MenuRouteConfig[],
  isEnabled: (key: string) => boolean,
): MenuRouteConfig[] {
  return routes
    .filter((route) => !route.featureFlag || isEnabled(route.featureFlag))
    .map((route) => ({
      ...route,
      children: route.children
        ? filterRoutesByFeatureFlag(route.children, isEnabled)
        : undefined,
    }));
}

// ─── Menu Resolution ──────────────────────────────────────

function resolveMenuItems(
  routes: MenuRouteConfig[],
  currentPath: string,
  parentPath: string = '',
): ResolvedMenuItem[] {
  return routes
    .filter((route) => route.menu && !route.menu.hidden)
    .map((route) => {
      const fullPath = parentPath
        ? `${parentPath}/${route.path}`.replace(/\/+/g, '/')
        : route.path;

      const children = route.children
        ? resolveMenuItems(route.children, currentPath, fullPath)
        : [];

      const isActive =
        matchPath({ path: fullPath, end: true }, currentPath) !== null ||
        children.some((c) => c.active);

      return {
        key: fullPath,
        title: route.menu!.title,
        path: fullPath,
        icon: route.menu!.icon,
        order: route.menu!.order ?? 100,
        hidden: false,
        badge: route.menu!.badge,
        badgeColor: route.menu!.badgeColor,
        externalUrl: route.menu!.externalUrl,
        hasChildren: children.length > 0,
        collapsible: route.menu!.collapsible ?? false,
        defaultCollapsed: route.menu!.defaultCollapsed ?? false,
        children,
        active: isActive,
      };
    })
    .sort((a, b) => a.order - b.order);
}

// ─── useMenuRoutes Hook ───────────────────────────────────

/**
 * Hook that converts route configurations into resolved menu items.
 * Automatically filters by user permissions and feature flags,
 * and resolves active state based on current location.
 *
 * @param routes - MenuRouteConfig array to process
 * @returns Resolved menu items ready for rendering
 *
 * @example
 *   const routes: MenuRouteConfig[] = [
 *     {
 *       path: '/dashboard',
 *       component: DashboardPage,
 *       menu: { title: 'Dashboard', icon: { emoji: '📊' }, order: 10 },
 *     },
 *     {
 *       path: '/admin',
 *       component: AdminPage,
 *       menu: { title: 'Admin', icon: { emoji: '⚙️' }, order: 90 },
 *       permission: { permissions: 'ADMIN_ACCESS' },
 *     },
 *   ];
 *
 *   function AppNavigation() {
 *     const menuItems = useMenuRoutes(routes);
 *     return <Sidebar items={menuItems} />;
 *   }
 */
export function useMenuRoutes(routes: MenuRouteConfig[]): ResolvedMenuItem[] {
  const location = useLocation();
  const { user } = useAuth();
  const { isEnabled } = useConfig();

  const userPermissions = user?.permissions ?? [];
  const userRoles = user?.roles ?? [];

  return useMemo(() => {
    // Step 1: Filter by feature flags
    const flagFiltered = filterRoutesByFeatureFlag(routes, isEnabled);

    // Step 2: Filter by permissions
    const permFiltered = filterRoutesByPermission(flagFiltered, userPermissions, userRoles);

    // Step 3: Resolve to menu items
    return resolveMenuItems(permFiltered, location.pathname);
  }, [routes, isEnabled, userPermissions, userRoles, location.pathname]);
}

// ─── Utility Exports ──────────────────────────────────────

/**
 * Filter route configs by permission (non-hook version).
 * Useful for SSR or build-time route filtering.
 */
export { filterRoutesByPermission, filterRoutesByFeatureFlag };
