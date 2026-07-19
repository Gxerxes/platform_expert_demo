export { paletteApi, setUnauthorizedHandler, setErrorHandler } from './client';
export type { ApiError, ApiResponse } from './client';
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
