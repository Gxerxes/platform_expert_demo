import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  checkSession,
  login as apiLogin,
  logout as apiLogout,
  classifyError,
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

      if (!session.authenticated) {
        // Not authenticated — redirect to login
        apiLogin();
      }
    } catch (err) {
      // Classify the error for user-friendly display
      const platformError = classifyError(err);
      console.error('[Palette Auth] Session check failed:', platformError);

      // For session expired / 401, redirect to login
      if (platformError.code === 'SESSION_EXPIRED') {
        apiLogin();
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
    try {
      const result = await apiLogout();
      setState({ authenticated: false, loading: false, error: null });

      // If BFF returns eIDP logout URL, redirect to it
      if (result.eidpLogoutUrl) {
        window.location.href = result.eidpLogoutUrl;
      } else {
        // Reload to trigger session check → login redirect
        window.location.reload();
      }
    } catch {
      // Even if API fails, force reload
      window.location.reload();
    }
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
