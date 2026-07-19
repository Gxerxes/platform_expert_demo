import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchUserContext, type UserContext, type UserInfo } from '@palette/api';

interface PaletteContextValue {
  user: UserInfo | null;
  environment: string;
  locale: string;
  timezone: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ContextContext = createContext<PaletteContextValue>({
  user: null,
  environment: 'UNKNOWN',
  locale: 'en-US',
  timezone: 'UTC',
  loading: true,
  refresh: async () => {},
});

interface ContextProviderProps {
  children: ReactNode;
}

export function ContextProvider({ children }: ContextProviderProps) {
  const [ctx, setCtx] = useState<Omit<PaletteContextValue, 'refresh'>>({
    user: null,
    environment: 'UNKNOWN',
    locale: 'en-US',
    timezone: 'UTC',
    loading: true,
  });

  const refresh = async () => {
    try {
      const data: UserContext = await fetchUserContext();
      setCtx({
        user: data.user,
        environment: data.environment,
        locale: data.locale,
        timezone: data.timezone,
        loading: false,
      });
    } catch (err) {
      console.warn('[Palette Context] Failed to load user context:', err);
      setCtx((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ContextContext.Provider value={{ ...ctx, refresh }}>
      {children}
    </ContextContext.Provider>
  );
}

export function usePaletteContext(): PaletteContextValue {
  return useContext(ContextContext);
}
