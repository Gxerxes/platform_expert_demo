import { PlatformErrorCode, type PlatformError } from '@palette/api';

interface ErrorPageProps {
  error?: PlatformError | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  onLogin?: () => void;
}

/**
 * Full-page enterprise error display.
 * Shows user-friendly messages based on error type.
 */
export function ErrorPage({ error, onRetry, onGoHome, onLogin }: ErrorPageProps) {
  if (!error) {
    return (
      <GenericErrorPage
        title="Something Went Wrong"
        message="An unexpected error occurred. Please try again."
        onRetry={onRetry}
        onGoHome={onGoHome}
      />
    );
  }

  const icon = getErrorIcon(error.code);
  const showRetry = error.recoverable && onRetry;
  const showLogin = (error.code === PlatformErrorCode.SESSION_EXPIRED) && onLogin;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Icon */}
        <div style={styles.icon}>{icon}</div>

        {/* Title */}
        <h1 style={styles.title}>{error.title}</h1>

        {/* Message */}
        <p style={styles.message}>{error.message}</p>

        {/* Technical details (collapsible) */}
        {error.details && (
          <details style={styles.details}>
            <summary style={styles.detailsSummary}>Technical Details</summary>
            <div style={styles.detailsContent}>
              <p style={styles.detailsText}>Error Code: {error.code}</p>
              <p style={styles.detailsText}>{error.details}</p>
            </div>
          </details>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          {showRetry && (
            <button onClick={onRetry} style={styles.primaryBtn}>
              Try Again
            </button>
          )}
          {showLogin && (
            <button onClick={onLogin} style={styles.primaryBtn}>
              Log In
            </button>
          )}
          {onGoHome && (
            <button onClick={onGoHome} style={styles.secondaryBtn}>
              Go to Home
            </button>
          )}
        </div>

        {/* Footer hint */}
        <p style={styles.footer}>
          If this problem persists, please contact IT Support.
        </p>
      </div>
    </div>
  );
}

// ─── Generic Error Page ──────────────────────────────────

interface GenericErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

function GenericErrorPage({ title = 'Something Went Wrong', message, onRetry, onGoHome }: GenericErrorPageProps) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <h1 style={styles.title}>{title}</h1>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.actions}>
          {onRetry && (
            <button onClick={onRetry} style={styles.primaryBtn}>
              Try Again
            </button>
          )}
          {onGoHome && (
            <button onClick={onGoHome} style={styles.secondaryBtn}>
              Go to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function getErrorIcon(code: PlatformErrorCode): string {
  switch (code) {
    case PlatformErrorCode.BFF_UNREACHABLE:
      return '🔌';
    case PlatformErrorCode.REQUEST_TIMEOUT:
      return '⏱️';
    case PlatformErrorCode.EIDP_UNAVAILABLE:
      return '🔐';
    case PlatformErrorCode.EIDP_AUTH_ERROR:
      return '🛡️';
    case PlatformErrorCode.SESSION_EXPIRED:
      return '🕐';
    case PlatformErrorCode.FORBIDDEN:
      return '🚫';
    case PlatformErrorCode.INTERNAL_ERROR:
      return '💥';
    default:
      return '⚠️';
  }
}

// ─── Styles ──────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '48px 40px',
    maxWidth: 520,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#555',
    lineHeight: 1.6,
    marginBottom: 20,
  },
  details: {
    textAlign: 'left',
    marginBottom: 20,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    padding: '8px 12px',
    backgroundColor: '#fafafa',
  },
  detailsSummary: {
    cursor: 'pointer',
    fontSize: 13,
    color: '#888',
    fontWeight: 500,
  },
  detailsContent: {
    marginTop: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
    wordBreak: 'break-all',
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtn: {
    padding: '10px 28px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#1a73e8',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 28px',
    fontSize: 14,
    fontWeight: 500,
    color: '#555',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 6,
    cursor: 'pointer',
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
  },
};
