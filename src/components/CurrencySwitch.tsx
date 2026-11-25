import { CURRENCIES, CURRENCY_SYMBOL } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

/** Changes the symbol only: amounts are the user's own, so nothing is converted. */
export function CurrencySwitch() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label="Display currency">
      <span className="text-[11px] uppercase tracking-[0.16em] text-label">Currency</span>
      <div className="inline-flex border border-rule">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            aria-pressed={c === currency}
            title={c}
            className={`px-2.5 py-1 text-xs font-mono-tabular transition-colors ${
              c === currency ? "bg-primary text-primary-foreground" : "text-label-mid hover:text-primary"
            }`}
          >
            {CURRENCY_SYMBOL[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
