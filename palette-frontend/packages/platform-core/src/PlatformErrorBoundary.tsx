/**
 * @palette/core — PlatformErrorBoundary
 *
 * Enterprise-grade error boundary with:
 * - Automatic retry with configurable limits
 * - Error reporting integration
 * - Graceful degradation UI
 * - Different rendering for development vs production
 * - Platform event bus integration
 *
 * Usage:
 *   <PlatformErrorBoundary onError={(e) => reportToSentry(e)}>
 *     <App />
 *   </PlatformErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { platformEvents } from './platformEvents';
import type { PlatformFatalError } from './types';

// ─── Types ────────────────────────────────────────────────

interface PlatformErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI when error occurs */
  fallback?: ReactNode | ((error: PlatformFatalError, reset: () => void) => ReactNode);
  /** Callback when error is caught */
  onError?: (error: PlatformFatalError, errorInfo: ErrorInfo) => void;
  /** Maximum auto-retry attempts (default: 3) */
  maxRetries?: number;
  /** Enable debug mode with detailed error info */
  debug?: boolean;
}

interface PlatformErrorBoundaryState {
  hasError: boolean;
  error: PlatformFatalError | null;
  retryCount: number;
  isRetrying: boolean;
}

// ─── Error Classification ────────────────────────────────

function classifyReactError(error: Error): PlatformFatalError {
  const message = error.message || '';
  let code = 'RENDER_ERROR';
  let recoverable = true;

  // Classify common React errors
  if (message.includes('Minified React error') || message.includes('Rendering')) {
    code = 'REACT_RENDER_ERROR';
  } else if (message.includes('Loading chunk') || message.includes('Loading CSS')) {
    code = 'CHUNK_LOAD_ERROR';
    recoverable = true;
  } else if (message.includes('Network')) {
    code = 'NETWORK_ERROR';
  } else if (message.includes('permission') || message.includes('denied')) {
    code = 'PERMISSION_ERROR';
    recoverable = false;
  }

  return {
    code,
    title: 'Application Error',
    message: error.message || 'An unexpected error occurred',
    cause: error,
    recoverable,
    timestamp: Date.now(),
    details: error.stack,
  };
}

// ─── Component ───────────────────────────────────────────

export class PlatformErrorBoundary extends Component<
  PlatformErrorBoundaryProps,
  PlatformErrorBoundaryState
> {
  constructor(props: PlatformErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PlatformErrorBoundaryState> {
    return {
      hasError: true,
      error: classifyReactError(error),
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const platformError = classifyReactError(error);

    // Emit to platform event bus
    platformEvents.emit('platform:error', platformError);

    // Call custom onError handler
    this.props.onError?.(platformError, errorInfo);

    // Log in development
    if (this.props.debug) {
      console.error('[Palette Core] Error caught by PlatformErrorBoundary:', {
        error: platformError,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      });
    }
  }

  // ── Retry Logic ──────────────────────────────────────

  private handleRetry = (): void => {
    const maxRetries = this.props.maxRetries ?? 3;

    if (this.state.retryCount >= maxRetries) {
      // Max retries exceeded, do full page reload
      window.location.reload();
      return;
    }

    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
      isRetrying: true,
    }));

    // Reset retry flag after a short delay
    setTimeout(() => {
      this.setState({ isRetrying: false });
    }, 1000);
  };

  // ── Reset ────────────────────────────────────────────

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  // ── Render ───────────────────────────────────────────

  render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    // Custom fallback (render prop)
    if (typeof this.props.fallback === 'function') {
      return this.props.fallback(this.state.error, this.handleReset);
    }

    // Custom fallback (static element)
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default error UI
    return this.renderDefaultErrorUI();
  }

  private renderDefaultErrorUI(): ReactNode {
    const { error, retryCount, isRetrying } = this.state;
    if (!error) return this.props.children;
    const maxRetries = this.props.maxRetries ?? 3;
    const canRetry = error.recoverable && retryCount < maxRetries;
    const icon = getErrorIcon(error.code);

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f7fa',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: 520,
            padding: 40,
            backgroundColor: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* Error Icon */}
          <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>

          {/* Title */}
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1a1a2e',
              marginBottom: 8,
              margin: '0 0 8px 0',
            }}
          >
            {error.title}
          </h2>

          {/* Message */}
          <p
            style={{
              fontSize: 14,
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 20,
              margin: '0 0 20px 0',
            }}
          >
            {error.message}
          </p>

          {/* Retry indicator */}
          {isRetrying && (
            <div
              style={{
                padding: '8px 16px',
                marginBottom: 16,
                backgroundColor: '#e8f4fd',
                borderRadius: 6,
                fontSize: 13,
                color: '#1a73e8',
              }}
            >
              Retrying... (attempt {retryCount + 1}/{maxRetries})
            </div>
          )}

          {/* Error details (debug mode) */}
          {this.props.debug && error.details && (
            <details
              style={{
                textAlign: 'left',
                marginBottom: 16,
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                backgroundColor: '#fafafa',
              }}
            >
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>
                Error Details
              </summary>
              <p
                style={{
                  fontSize: 11,
                  color: '#c00',
                  fontFamily: 'monospace',
                  marginTop: 8,
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {error.code}: {error.details}
              </p>
            </details>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isRetrying}
                style={{
                  padding: '10px 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: isRetrying ? '#93c5fd' : '#1a73e8',
                  border: 'none',
                  borderRadius: 6,
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            <button
              onClick={() => {
                this.handleReset();
                window.location.href = '/';
              }}
              style={{
                padding: '10px 28px',
                fontSize: 14,
                color: '#555',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>

          {/* Retry count indicator */}
          {retryCount > 0 && (
            <p style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
              Retry attempts: {retryCount}/{maxRetries}
            </p>
          )}

          {/* Support message */}
          <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
            If this problem persists, please contact IT Support.
          </p>
        </div>
      </div>
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────

function getErrorIcon(code: string): string {
  switch (code) {
    case 'CHUNK_LOAD_ERROR': return '📦';
    case 'NETWORK_ERROR': return '🌐';
    case 'PERMISSION_ERROR': return '🚫';
    case 'REACT_RENDER_ERROR': return '⚛️';
    case 'RENDER_ERROR': return '💥';
    default: return '⚠️';
  }
}
