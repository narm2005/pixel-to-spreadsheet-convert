import { createContext, Fragment, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { setCurrency } from "@/lib/utils";

// Settings an admin can change in the app: currency and Premium prices.
export interface AppConfig {
  currency: string;
  currency_symbol: string;
  premium_monthly: number;
  premium_yearly: number;
  currencies: string[];
}

const DEFAULTS: AppConfig = {
  currency: import.meta.env.VITE_CURRENCY || "INR",
  currency_symbol: "₹",
  premium_monthly: 199,
  premium_yearly: 1999,
  currencies: ["INR"],
};
const CACHE_KEY = "slickreceipts-config";

const readCache = (): AppConfig => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

const ConfigContext = createContext<{ config: AppConfig; reload: () => Promise<void>; apply: (c: AppConfig) => void }>({
  config: DEFAULTS,
  reload: async () => undefined,
  apply: () => undefined,
});

export const AppConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const c = readCache();
    setCurrency(c.currency);
    return c;
  });

  const apply = useCallback((c: AppConfig) => {
    setCurrency(c.currency);
    setConfig(c);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch {
      /* storage blocked: fine */
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      apply(await api.get<AppConfig>("/config"));
    } catch {
      /* backend asleep or offline: keep what we have */
    }
  }, [apply]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Amounts are formatted outside React state, so re-render the app when the currency changes.
  return (
    <ConfigContext.Provider value={{ config, reload, apply }}>
      <Fragment key={config.currency}>{children}</Fragment>
    </ConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(ConfigContext);
