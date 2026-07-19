import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchRuntimeConfig, type RuntimeConfig } from '@palette/api';

const defaultConfig: RuntimeConfig = {
  application: 'palette',
  version: '0.0.0',
  environment: 'UNKNOWN',
  features: {},
};

const ConfigContext = createContext<RuntimeConfig>(defaultConfig);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<RuntimeConfig>(defaultConfig);

  useEffect(() => {
    fetchRuntimeConfig()
      .then(setConfig)
      .catch((err) => {
        console.warn('[Palette Config] Failed to load runtime config:', err);
      });
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): RuntimeConfig {
  return useContext(ConfigContext);
}
