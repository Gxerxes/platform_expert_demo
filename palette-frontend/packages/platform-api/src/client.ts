import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Standard BFF API error response format.
 */
export interface ApiError {
  code: string;
  message: string;
  traceId?: string;
  timestamp: string;
}

/**
 * Standard BFF API success wrapper.
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Callback for 401 unauthorized events.
 */
type UnauthorizedHandler = () => void;

/**
 * Callback for general error events.
 */
type ErrorHandler = (error: ApiError) => void;

let onUnauthorized: UnauthorizedHandler = () => {
  window.location.href = '/palette/api/v1/auth/login';
};

let onError: ErrorHandler = () => {
  // Default: no-op, consumers can override
};

/**
 * Set the global unauthorized handler.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

/**
 * Set the global error handler.
 */
export function setErrorHandler(handler: ErrorHandler): void {
  onError = handler;
}

/**
 * Centralized Axios instance for Palette BFF communication.
 * All API calls go through this instance.
 */
export const paletteApi: AxiosInstance = axios.create({
  baseURL: '/palette/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Request interceptor: inject platform headers.
 */
paletteApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set('X-Application-ID', 'palette-portal');
  config.headers.set('X-Channel', 'WEB');
  return config;
});

/**
 * Response interceptor: handle standard error codes.
 */
paletteApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          onUnauthorized();
          break;
        case 403:
          // Forbidden - user lacks permission
          console.warn('[Palette API] Forbidden:', data?.message);
          break;
        case 500:
          onError(data ?? { code: 'INTERNAL_ERROR', message: 'Internal server error', timestamp: new Date().toISOString() });
          break;
        default:
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('[Palette API] Request timeout');
    } else {
      console.error('[Palette API] Network error:', error.message);
    }

    return Promise.reject(error);
  },
);
