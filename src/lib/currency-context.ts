import { createContext, useContext } from "react";
import { Currency, DEFAULT_CURRENCY } from "./currency";

export interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const CurrencyContext = createContext<CurrencyState>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
});

export function useCurrency(): CurrencyState {
  return useContext(CurrencyContext);
}
