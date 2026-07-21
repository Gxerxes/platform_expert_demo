import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  checkSession,
  login as apiLogin,
  classifyError,
  setLoggingOut,
  type SessionInfo,
  type PlatformError,
} from '@palette/api';

// ─── Types ───────────────────────────────────────────────

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  expiresAt?: string;
  error: PlatformError | null;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    loading: true,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const session: SessionInfo = await checkSession();
      setState({
        authenticated: session.authenticated,
        loading: false,
        expiresAt: session.expiresAt,
        error: null,
      });
      // Note: Do NOT auto-redirect here.
      // Protected routes will handle the redirect via ProtectedRoute component.
      // Public pages (e.g., landing page) should remain visible when not authenticated.
    } catch (err) {
      // Classify the error for user-friendly display
      const platformError = classifyError(err);
      console.error('[Palette Auth] Session check failed:', platformError);

      // For session expired / 401, let ProtectedRoute handle redirect
      if (platformError.code === 'SESSION_EXPIRED') {
        setState((prev) => ({ ...prev, authenticated: false, loading: false }));
        return;
      }

      // For all other errors (BFF down, eIDP down, timeout, etc.),
      // show the error page instead of redirecting
      setState({
        authenticated: false,
        loading: false,
        error: platformError,
      });
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
    apiLogin();
  }, []);

  const logout = useCallback(async () => {
    // Set flag to prevent axios interceptor from redirecting to login on 401
    setLoggingOut(true);

    // Reset auth state
    setState({ authenticated: false, loading: false, error: null });

    // Navigate to BFF logout endpoint (GET) which will:
    // 1. Invalidate the BFF session
    // 2. Clear the session cookie
    // 3. Redirect to Keycloak logout (which redirects back to landing page)
    // Using window.location.href ensures the browser processes Set-Cookie natively
    window.location.href = '/palette/api/v1/auth/logout';
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authenticated: state.authenticated,
        loading: state.loading,
        expiresAt: state.expiresAt,
        error: state.error,
        login,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
