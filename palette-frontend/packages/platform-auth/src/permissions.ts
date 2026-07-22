/**
 * @palette/auth — Permission Utilities
 *
 * Enterprise-grade permission evaluation utilities.
 * Supports AND/OR/exact matching, wildcard permissions,
 * and role-based permission derivation.
 *
 * Permission Naming Convention:
 *   <DOMAIN>_<ACTION>
 *   Examples: TRADE_VIEW, TRADE_CREATE, CLEARING_ADMIN
 *
 * Wildcard Support:
 *   TRADE_* matches TRADE_VIEW, TRADE_CREATE, etc.
 *   * matches all permissions (super admin)
 */

import type { PermissionMode } from './types';

// ─── Core Permission Checks ───────────────────────────────

/**
 * Check if a single permission matches against a permission set.
 * Supports wildcard patterns (e.g., 'TRADE_*').
 */
export function matchesPermission(userPermission: string, requiredPermission: string): boolean {
  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Wildcard: user has '*' (super admin)
  if (userPermission === '*') {
    return true;
  }

  // Wildcard pattern: 'TRADE_*' matches 'TRADE_VIEW'
  if (userPermission.endsWith('*')) {
    const prefix = userPermission.slice(0, -1);
    return requiredPermission.startsWith(prefix);
  }

  return false;
}

/**
 * Check if user has a specific permission.
 */
export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.some((userPerm) => matchesPermission(userPerm, permission));
}

/**
 * Check if user has ALL specified permissions (AND logic).
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every((required) => hasPermission(userPermissions, required));
}

/**
 * Check if user has ANY of the specified permissions (OR logic).
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some((required) => hasPermission(userPermissions, required));
}

/**
 * Check if user has EXACTLY the specified permissions (no more, no less).
 */
export function hasExactPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.length !== requiredPermissions.length) {
    return false;
  }
  return hasAllPermissions(userPermissions, requiredPermissions);
}

/**
 * Evaluate permission based on mode.
 */
export function evaluatePermission(
  userPermissions: string[],
  requiredPermissions: string[],
  mode: PermissionMode = 'all'
): boolean {
  switch (mode) {
    case 'all':
      return hasAllPermissions(userPermissions, requiredPermissions);
    case 'any':
      return hasAnyPermission(userPermissions, requiredPermissions);
    case 'exact':
      return hasExactPermissions(userPermissions, requiredPermissions);
    default:
      return false;
  }
}

// ─── Permission Normalization ─────────────────────────────

/**
 * Normalize permission input to a string array.
 * Accepts a single string or an array of strings.
 */
export function normalizePermissions(permissions: string | string[]): string[] {
  if (typeof permissions === 'string') {
    return [permissions];
  }
  return permissions.filter((p) => typeof p === 'string' && p.length > 0);
}

// ─── Role Utilities ───────────────────────────────────────

/**
 * Check if user has a specific role.
 */
export function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles.
 */
export function hasAnyRole(userRoles: string[], roles: string[]): boolean {
  return roles.some((role) => userRoles.includes(role));
}

// ─── Permission Filtering ─────────────────────────────────

/**
 * Filter a list of items by permission.
 * Each item can have a `permission` property that will be checked.
 *
 * Example:
 *   const menuItems = filterByPermission(items, userPermissions);
 */
export function filterByPermission<T extends { permission?: string | string[] }>(
  items: T[],
  userPermissions: string[]
): T[] {
  return items.filter((item) => {
    // No permission requirement → always visible
    if (!item.permission) {
      return true;
    }

    const required = normalizePermissions(item.permission);
    return hasAnyPermission(userPermissions, required);
  });
}

// ─── Common Permission Constants ──────────────────────────

/**
 * Well-known permission constants for the Palette platform.
 * Business applications should define their own domain-specific permissions.
 */
export const PalettePermissions = {
  /** View platform dashboard */
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  /** Access admin panel */
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  /** Manage user permissions */
  USER_MANAGE: 'USER_MANAGE',
  /** View audit logs */
  AUDIT_VIEW: 'AUDIT_VIEW',
  /** Manage system configuration */
  CONFIG_MANAGE: 'CONFIG_MANAGE',
} as const;

/**
 * Type for Palette platform permissions.
 */
export type PalettePermission = (typeof PalettePermissions)[keyof typeof PalettePermissions];
