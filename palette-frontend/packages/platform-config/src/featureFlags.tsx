/**
 * @palette/config — Feature Flag System
 *
 * Enterprise-grade feature flag management with support for:
 * - Boolean flags (on/off)
 * - Multivariate flags (A/B testing variants)
 * - Percentage-based gradual rollout
 * - User-targeted flags (allowlist)
 * - Environment-specific flags
 * - Role-based flag evaluation
 *
 * Usage:
 *   // Hook
 *   const { isEnabled, variant } = useFeatureFlag('NEW_TRADE_UI');
 *   if (isEnabled) return <NewTradeUI />;
 *
 *   // Component
 *   <FeatureFlag flag="NEW_DASHBOARD" fallback={<OldDashboard />}>
 *     <NewDashboard />
 *   </FeatureFlag>
 *
 *   // Programmatic
 *   const enabled = evaluateFlag(flag, { userId: 'user123', environment: 'UAT' });
 */

import { useMemo, type ReactNode } from 'react';
import type {
  FeatureFlag,
  FeatureFlagResult,
  FlagEvaluationContext,
} from './types';

// ─── Flag Parsing ─────────────────────────────────────────

/**
 * Parse raw feature flag data from BFF into typed FeatureFlag objects.
 *
 * BFF may return flags in various formats:
 * - Simple boolean: { "NEW_UI": true }
 * - Object with config: { "NEW_UI": { "enabled": true, "variant": "v2" } }
 * - Array of flag definitions: [{ "key": "NEW_UI", "enabled": true }]
 */
export function parseFeatureFlags(
  raw: Record<string, unknown> | undefined
): Map<string, FeatureFlag> {
  const flags = new Map<string, FeatureFlag>();

  if (!raw || typeof raw !== 'object') {
    return flags;
  }

  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) {
      continue;
    }

    // Simple boolean: { "FLAG": true }
    if (typeof value === 'boolean') {
      flags.set(key, { key, enabled: value });
      continue;
    }

    // String value (variant): { "FLAG": "variant-a" }
    if (typeof value === 'string') {
      flags.set(key, { key, enabled: true, variant: value });
      continue;
    }

    // Number value (percentage): { "FLAG": 50 }
    if (typeof value === 'number') {
      flags.set(key, { key, enabled: value > 0, rolloutPercentage: value });
      continue;
    }

    // Object with full definition
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const flag: FeatureFlag = {
        key,
        enabled: Boolean(obj.enabled ?? obj.value ?? false),
        variant: obj.variant as string | undefined,
        rolloutPercentage: typeof obj.rolloutPercentage === 'number' ? obj.rolloutPercentage : undefined,
        targetUsers: Array.isArray(obj.targetUsers) ? obj.targetUsers as string[] : undefined,
        targetEnvironments: Array.isArray(obj.targetEnvironments) ? obj.targetEnvironments as never[] : undefined,
        description: typeof obj.description === 'string' ? obj.description : undefined,
        lastModified: typeof obj.lastModified === 'string' ? obj.lastModified : undefined,
      };
      flags.set(key, flag);
      continue;
    }
  }

  return flags;
}

// ─── Flag Evaluation ──────────────────────────────────────

/**
 * Simple hash function for consistent percentage-based rollout.
 * Returns a value between 0 and 1.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash % 100) / 100;
}

/**
 * Evaluate whether a feature flag is enabled for the given context.
 *
 * Evaluation order:
 * 1. If flag doesn't exist → false
 * 2. If flag has targetUsers and user is in list → true
 * 3. If flag has targetUsers and user is NOT in list → false
 * 4. If flag has targetEnvironments and current env matches → evaluate further
 * 5. If flag has targetEnvironments and current env doesn't match → false
 * 6. If flag has rolloutPercentage → use hash for consistent assignment
 * 7. Return flag.enabled
 */
export function evaluateFlag(
  flag: FeatureFlag | undefined,
  context: FlagEvaluationContext = {}
): boolean {
  if (!flag) return false;

  // If flag is explicitly disabled, return false regardless of other rules
  if (!flag.enabled) return false;

  // Check target users (allowlist)
  if (flag.targetUsers && flag.targetUsers.length > 0) {
    if (!context.userId) return false;
    if (!flag.targetUsers.includes(context.userId)) {
      // Check if user matches by role
      if (context.userRoles && flag.targetUsers.some((t) => context.userRoles!.includes(t))) {
        return true;
      }
      return false;
    }
    return true;
  }

  // Check target environments
  if (flag.targetEnvironments && flag.targetEnvironments.length > 0) {
    if (!context.environment) return false;
    if (!flag.targetEnvironments.includes(context.environment)) {
      return false;
    }
  }

  // Check rollout percentage (consistent hashing)
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    if (flag.rolloutPercentage <= 0) return false;

    // Use userId for consistent assignment, or random if no userId
    const hashInput = context.userId ?? `session-${Date.now()}`;
    const hashValue = hashString(`${flag.key}:${hashInput}`);
    return hashValue * 100 < flag.rolloutPercentage;
  }

  // Default: return flag enabled state
  return flag.enabled;
}

/**
 * Evaluate a feature flag and return full result.
 */
export function evaluateFlagResult(
  flag: FeatureFlag | undefined,
  context: FlagEvaluationContext = {}
): FeatureFlagResult {
  const isEnabled = evaluateFlag(flag, context);
  return {
    isEnabled,
    variant: flag?.variant,
    flag,
  };
}

// ─── useFeatureFlag Hook ──────────────────────────────────

/**
 * Hook to check if a feature flag is enabled.
 *
 * @param key - Feature flag key
 * @param context - Optional evaluation context override
 * @returns Feature flag result
 *
 * @example
 *   function MyComponent() {
 *     const { isEnabled, variant } = useFeatureFlag('NEW_TRADE_UI');
 *
 *     if (!isEnabled) return <LegacyTradeUI />;
 *
 *     if (variant === 'v2') return <TradeUIV2 />;
 *     return <TradeUIV1 />;
 *   }
 */
export function useFeatureFlag(
  key: string,
  flags: Map<string, FeatureFlag>,
  context: FlagEvaluationContext = {}
): FeatureFlagResult {
  return useMemo(() => {
    const flag = flags.get(key);
    return evaluateFlagResult(flag, context);
  }, [key, flags, context]);
}

/**
 * Hook to check multiple feature flags at once.
 *
 * @param keys - Array of feature flag keys
 * @returns Record of flag key → enabled state
 *
 * @example
 *   const flags = useFeatureFlags(['FLAG_A', 'FLAG_B', 'FLAG_C']);
 *   if (flags.FLAG_A && flags.FLAG_B) { ... }
 */
export function useFeatureFlags(
  keys: string[],
  flags: Map<string, FeatureFlag>,
  context: FlagEvaluationContext = {}
): Record<string, boolean> {
  return useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const key of keys) {
      const flag = flags.get(key);
      result[key] = evaluateFlag(flag, context);
    }
    return result;
  }, [keys, flags, context]);
}

// ─── FeatureFlag Component ────────────────────────────────

interface FeatureFlagComponentProps {
  /** Feature flag key */
  flag: string;
  /** Content to render when flag is enabled */
  children: ReactNode;
  /** Content to render when flag is disabled */
  fallback?: ReactNode;
  /** Specific variant to match (for multivariate flags) */
  variant?: string;
}

/**
 * Declarative feature flag component.
 *
 * @example
 *   <FeatureFlag flag="NEW_DASHBOARD" fallback={<OldDashboard />}>
 *     <NewDashboard />
 *   </FeatureFlag>
 *
 *   // With variant matching
 *   <FeatureFlag flag="TRADE_UI" variant="v2">
 *     <TradeUIV2 />
 *   </FeatureFlag>
 */
export function FeatureFlagComponent({
  flag: flagKey,
  children,
  fallback,
  variant: requiredVariant,
  flags,
  context,
}: FeatureFlagComponentProps & {
  flags: Map<string, FeatureFlag>;
  context: FlagEvaluationContext;
}) {
  const result = useFeatureFlag(flagKey, flags, context);

  if (!result.isEnabled) {
    return fallback ? <>{fallback}</> : null;
  }

  // If variant matching is required
  if (requiredVariant && result.variant !== requiredVariant) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// ─── Flag Utilities ───────────────────────────────────────

/**
 * Check if a flag exists in the flag map.
 */
export function flagExists(flags: Map<string, FeatureFlag>, key: string): boolean {
  return flags.has(key);
}

/**
 * Get all enabled flag keys.
 */
export function getEnabledFlags(flags: Map<string, FeatureFlag>): string[] {
  const enabled: string[] = [];
  flags.forEach((flag, key) => {
    if (flag.enabled) {
      enabled.push(key);
    }
  });
  return enabled;
}

/**
 * Get all disabled flag keys.
 */
export function getDisabledFlags(flags: Map<string, FeatureFlag>): string[] {
  const disabled: string[] = [];
  flags.forEach((flag, key) => {
    if (!flag.enabled) {
      disabled.push(key);
    }
  });
  return disabled;
}

/**
 * Merge multiple flag maps (later maps override earlier ones).
 */
export function mergeFlagMaps(...maps: Map<string, FeatureFlag>[]): Map<string, FeatureFlag> {
  const merged = new Map<string, FeatureFlag>();
  for (const map of maps) {
    map.forEach((flag, key) => {
      merged.set(key, flag);
    });
  }
  return merged;
}
