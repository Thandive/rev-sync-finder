import { useCallback, useState } from "react";
import { Currency, DEFAULT_CURRENCY, isCurrency } from "@/lib/currency";
import { CurrencyContext } from "@/lib/currency-context";

const STORAGE_KEY = "revsync-currency";

function readStored(): Currency {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return isCurrency(v) ? v : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

/**
 * Remembers the viewer's display currency for this visit only (sessionStorage, cleared when the
 * browser closes), so it carries across the two tools without any persistent storage on the device.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setState] = useState<Currency>(readStored);
  const setCurrency = useCallback((c: Currency) => {
    setState(c);
    try {
      sessionStorage.setItem(STORAGE_KEY, c);
    } catch {
      // storage unavailable: keep the choice for this visit only
    }
  }, []);
  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}
