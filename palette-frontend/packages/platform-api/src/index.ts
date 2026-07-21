export { paletteApi, setUnauthorizedHandler, setErrorHandler, setLoggingOut } from './client';
export type { ApiError, ApiResponse } from './client';
export { PlatformErrorCode, classifyError } from './errors';
export type { PlatformError } from './errors';
export {
  checkSession,
  login,
  logout,
  fetchUserContext,
  fetchEidpUserInfo,
  fetchRuntimeConfig,
  fetchSystemInfo,
} from './endpoints';
export type {
  SessionInfo,
  LogoutResponse,
  UserInfo,
  UserContext,
  EidpUserInfo,
  RuntimeConfig,
  SystemInfo,
} from './endpoints';
