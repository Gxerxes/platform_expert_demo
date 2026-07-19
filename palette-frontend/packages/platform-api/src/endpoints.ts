import { paletteApi } from './client';
import type { ApiResponse } from './client';

// ─── Auth APIs ───────────────────────────────────────────

export interface SessionInfo {
  authenticated: boolean;
  expiresAt?: string;
  loginUrl?: string;
}

export interface LogoutResponse {
  success: boolean;
  eidpLogoutUrl?: string;
}

/**
 * Check current authentication status.
 */
export async function checkSession(): Promise<SessionInfo> {
  const response = await paletteApi.get<ApiResponse<SessionInfo>>('/auth/session');
  return response.data.data;
}

/**
 * Initiate login redirect to BFF (which redirects to eIDP).
 */
export function login(): void {
  window.location.href = '/palette/api/v1/auth/login';
}

/**
 * Logout from BFF and optionally from eIDP.
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await paletteApi.post<ApiResponse<LogoutResponse>>('/auth/logout');
  return response.data.data;
}

// ─── User Context APIs ───────────────────────────────────

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export interface UserContext {
  user: UserInfo;
  environment: string;
  locale: string;
  timezone: string;
}

/**
 * Fetch current user context from BFF.
 */
export async function fetchUserContext(): Promise<UserContext> {
  const response = await paletteApi.get<ApiResponse<UserContext>>('/context');
  return response.data.data;
}

// ─── User Info (eIDP) APIs ──────────────────────────────

export interface EidpUserInfo {
  sub: string;
  name?: string;
  preferredUsername?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  picture?: string;
  locale?: string;
  rawClaims?: Record<string, unknown>;
}

/**
 * Fetch real-time user info from eIDP via BFF.
 */
export async function fetchEidpUserInfo(): Promise<EidpUserInfo> {
  const response = await paletteApi.get<ApiResponse<EidpUserInfo>>('/auth/me');
  return response.data.data;
}

// ─── Config APIs ─────────────────────────────────────────

export interface RuntimeConfig {
  application: string;
  version: string;
  environment: string;
  features: Record<string, unknown>;
}

/**
 * Fetch runtime configuration from BFF.
 */
export async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  const response = await paletteApi.get<ApiResponse<RuntimeConfig>>('/config');
  return response.data.data;
}

// ─── System APIs ─────────────────────────────────────────

export interface SystemInfo {
  application: string;
  version: string;
  buildTime: string;
}

/**
 * Fetch application info.
 */
export async function fetchSystemInfo(): Promise<SystemInfo> {
  const response = await paletteApi.get<ApiResponse<SystemInfo>>('/system/info');
  return response.data.data;
}
