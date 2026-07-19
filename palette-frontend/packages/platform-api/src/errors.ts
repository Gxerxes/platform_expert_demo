/**
 * Platform error categories for user-friendly error handling.
 */
export enum PlatformErrorCode {
  /** BFF backend is not reachable (network error / connection refused) */
  BFF_UNREACHABLE = 'BFF_UNREACHABLE',
  /** Request timed out */
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  /** eIDP identity provider is unavailable */
  EIDP_UNAVAILABLE = 'EIDP_UNAVAILABLE',
  /** eIDP returned an authentication error */
  EIDP_AUTH_ERROR = 'EIDP_AUTH_ERROR',
  /** Session expired */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  /** Access forbidden (403) */
  FORBIDDEN = 'FORBIDDEN',
  /** Internal server error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  /** Unknown / unclassified error */
  UNKNOWN = 'UNKNOWN',
}

export interface PlatformError {
  code: PlatformErrorCode;
  title: string;
  message: string;
  recoverable: boolean;
  details?: string;
}

/**
 * Classify an Axios error into a PlatformError for display.
 */
export function classifyError(error: unknown): PlatformError {
  // Axios error shape
  const axiosErr = error as {
    response?: { status: number; data?: { code?: string; message?: string } };
    code?: string;
    message?: string;
  };

  // No response → network error (BFF not running)
  if (!axiosErr.response) {
    if (axiosErr.code === 'ECONNABORTED') {
      return {
        code: PlatformErrorCode.REQUEST_TIMEOUT,
        title: 'Request Timeout',
        message: 'The server took too long to respond. Please check your network connection and try again.',
        recoverable: true,
      };
    }
    return {
      code: PlatformErrorCode.BFF_UNREACHABLE,
      title: 'Service Unavailable',
      message: 'Unable to connect to the platform server. Please verify your network connection or contact IT support.',
      recoverable: true,
      details: axiosErr.message,
    };
  }

  const { status, data } = axiosErr.response;

  switch (status) {
    case 401:
      return {
        code: PlatformErrorCode.SESSION_EXPIRED,
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        recoverable: true,
      };

    case 403:
      return {
        code: PlatformErrorCode.FORBIDDEN,
        title: 'Access Denied',
        message: data?.message ?? 'You do not have permission to access this resource.',
        recoverable: false,
      };

    case 502:
    case 503:
    case 504:
      return {
        code: PlatformErrorCode.EIDP_UNAVAILABLE,
        title: 'Identity Provider Unavailable',
        message:
          'The authentication service is currently unavailable. Please wait a moment and try again. If the problem persists, contact IT support.',
        recoverable: true,
        details: data?.message,
      };

    case 500:
      // Check if it's an eIDP-related error from BFF
      if (data?.code?.includes('EIDP') || data?.message?.toLowerCase().includes('eidp')) {
        return {
          code: PlatformErrorCode.EIDP_AUTH_ERROR,
          title: 'Authentication Service Error',
          message:
            'The identity provider returned an error. Please try logging in again. If the problem persists, contact IT support.',
          recoverable: true,
          details: data?.message,
        };
      }
      return {
        code: PlatformErrorCode.INTERNAL_ERROR,
        title: 'Server Error',
        message: 'An unexpected error occurred on the server. Our team has been notified. Please try again later.',
        recoverable: true,
        details: data?.message,
      };

    default:
      return {
        code: PlatformErrorCode.UNKNOWN,
        title: 'Unexpected Error',
        message: data?.message ?? 'An unexpected error occurred. Please try again.',
        recoverable: true,
        details: `HTTP ${status}`,
      };
  }
}
