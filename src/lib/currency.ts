// Display currency. The models are currency-agnostic: users enter their own amounts,
// so switching currency changes the symbol only. Nothing is converted.

export type Currency = "USD" | "EUR" | "GBP";

export const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];
export const DEFAULT_CURRENCY: Currency = "USD";
export const CURRENCY_SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€", GBP: "£" };

export function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (CURRENCIES as string[]).includes(v);
}

/** Compact amount: $1.25M, $18.0K (or $18K with kDecimals = 0), $950. */
export function formatMoney(n: number, currency: Currency = DEFAULT_CURRENCY, kDecimals = 1): string {
  const sym = CURRENCY_SYMBOL[currency];
  if (!Number.isFinite(n)) return `${sym}0`;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(kDecimals)}K`;
  return `${sign}${sym}${Math.round(abs).toLocaleString("en-US")}`;
}

/** Whole amount with thousands separators: $69,390. */
export function formatMoneyExact(n: number, currency: Currency = DEFAULT_CURRENCY): string {
  const sym = CURRENCY_SYMBOL[currency];
  if (!Number.isFinite(n)) return `${sym}0`;
  const sign = n < 0 ? "-" : "";
  return `${sign}${sym}${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
}
