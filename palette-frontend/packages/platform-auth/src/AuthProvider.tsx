import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { checkSession, login as apiLogin, logout as apiLogout, type SessionInfo } from '@palette/api';

// ─── Types ───────────────────────────────────────────────

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  expiresAt?: string;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
  });

  const refreshSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const session: SessionInfo = await checkSession();
      setState({
        authenticated: session.authenticated,
        loading: false,
        expiresAt: session.expiresAt,
      });

      if (!session.authenticated) {
        // Not authenticated — redirect to login
        apiLogin();
      }
    } catch {
      setState({ authenticated: false, loading: false });
      apiLogin();
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(() => {
    apiLogin();
  }, []);

  const logout = useCallback(async () => {
    try {
      const result = await apiLogout();
      setState({ authenticated: false, loading: false });

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

  return (
    <AuthContext.Provider
      value={{
        authenticated: state.authenticated,
        loading: state.loading,
        expiresAt: state.expiresAt,
        login,
        logout,
        refreshSession,
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
