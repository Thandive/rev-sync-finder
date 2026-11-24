import {
  Assumptions,
  CalculatorInputs,
  CalculatorResults,
  CATEGORY_LABELS,
  COST_CATEGORIES,
  formatEUR,
  formatEURExact,
  LeakageCategoryKey,
  REVENUE_CATEGORIES,
  RiskScore,
  RISK_BANDS,
  buildSummary,
} from "@/lib/calculations";
import { InfoTooltip } from "@/components/InfoTooltip";

interface Props {
  results: CalculatorResults;
  inputs: CalculatorInputs;
  assumptions: Assumptions;
}

const riskStyles: Record<RiskScore, { text: string; dot: string; border: string }> = {
  LOW: { text: "text-[hsl(var(--risk-low))]", dot: "bg-[hsl(var(--risk-low))]", border: "border-[hsl(var(--risk-low))]/50" },
  MEDIUM: { text: "text-[hsl(var(--risk-medium))]", dot: "bg-[hsl(var(--risk-medium))]", border: "border-[hsl(var(--risk-medium))]/50" },
  HIGH: { text: "text-[hsl(var(--risk-high))]", dot: "bg-[hsl(var(--risk-high))]", border: "border-[hsl(var(--risk-high))]/55" },
  CRITICAL: { text: "text-[hsl(var(--risk-critical))]", dot: "bg-[hsl(var(--risk-critical))]", border: "border-[hsl(var(--risk-critical))]/70" },
};

const share = (v: number, arr: number) => (arr > 0 ? `${((v / arr) * 100).toFixed(2)}%` : "0.00%");

const bandText = [...RISK_BANDS]
  .reverse()
  .map((b, i, all) => {
    const next = all[i + 1];
    const lo = `${(b.minRatio * 100).toFixed(0)}%`;
    return next ? `${b.score} ${lo}–${(next.minRatio * 100).toFixed(0)}%` : `${b.score} ≥ ${lo}`;
  })
  .join(" · ");

function CategoryGroup({
  title,
  tooltip,
  keys,
  results,
  max,
  subtotal,
}: {
  title: string;
  tooltip: string;
  keys: LeakageCategoryKey[];
  results: CalculatorResults;
  max: number;
  subtotal: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-border-faint pb-2 mb-4">
        <span className="text-xs uppercase tracking-[0.2em] text-label-mid inline-flex items-center gap-1.5">
          {title}
          <InfoTooltip text={tooltip} />
        </span>
        <span className="font-mono-tabular text-sm text-primary">{formatEURExact(subtotal)}</span>
      </div>
      <div className="space-y-4">
        {keys.map((k) => {
          const v = results.categories[k];
          return (
            <div key={k}>
              <div className="flex justify-between gap-3 text-xs mb-1.5">
                <span className="text-foreground/85 uppercase tracking-[0.08em]">{CATEGORY_LABELS[k]}</span>
                <span className="font-mono-tabular text-primary shrink-0">{formatEUR(v)}</span>
              </div>
              <div className="h-1.5 bg-[hsl(var(--background))] border-b border-border-faint">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(v / max) * 100}%` }} />
              </div>
              <div className="mt-1.5 text-[11px] text-label leading-snug normal-case tracking-normal">
                {results.explanations[k]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResultsPanel({ results, inputs, assumptions }: Props) {
  const { riskScore, exposureRatio, totalExposure, revenueLeakage, costToOperate, categories, topCategory } = results;
  const rs = riskStyles[riskScore];
  const summary = buildSummary(results);
  const max = Math.max(...Object.values(categories), 1);

  return (
    <div className="space-y-6">
      {/* Risk score + the one total */}
      <div className={`border-2 ${rs.border} bg-card rounded-none p-6 md:p-7`}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="text-xs uppercase tracking-[0.25em] text-label-low inline-flex items-center gap-1.5">
            Revenue risk score
            <InfoTooltip text={`Total exposure as a share of ARR. Rev-Sync's own bands: ${bandText}.`} />
          </div>
          <div className="text-xs font-mono-tabular text-label-low uppercase tracking-[0.15em]">
            {(exposureRatio * 100).toFixed(2)}% of ARR
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 ${rs.dot}`} />
          <span className={`text-5xl md:text-6xl font-bold tracking-tight font-mono ${rs.text}`}>{riskScore}</span>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs uppercase tracking-[0.14em] font-mono-tabular">
          <span className="text-label">Revenue leakage</span>
          <span className="text-right text-foreground/85">{formatEURExact(revenueLeakage)}</span>
          <span className="text-label">+ Cost to operate</span>
          <span className="text-right text-foreground/85">{formatEURExact(costToOperate)}</span>
          <span className="text-foreground/90 border-t border-border-faint pt-1.5">= Estimated annual exposure</span>
          <span className="text-right text-primary text-base border-t border-border-faint pt-1 font-semibold">
            {formatEURExact(totalExposure)}
          </span>
        </div>

        <p className="mt-5 text-sm text-foreground/80 leading-relaxed">{summary}</p>
      </div>

      {/* Primary driver */}
      <div className="border-l-2 border-primary bg-primary/5 px-4 py-3">
        <div className="text-xs uppercase tracking-[0.18em] text-label-low">Largest category</div>
        <div className="mt-1 font-mono text-sm md:text-base text-foreground/90">
          <span className="text-primary font-semibold">{CATEGORY_LABELS[topCategory]}</span>
          <span className="text-label-mid"> — </span>
          <span className="text-primary font-mono-tabular">{formatEURExact(categories[topCategory])}</span>
          <span className="text-label-low text-xs"> / yr · {share(categories[topCategory], inputs.arr)} of ARR</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="border border-border-faint bg-card p-5 rounded-none space-y-7">
        <CategoryGroup
          title="Revenue leakage"
          tooltip="Revenue that is earned but never billed, billed wrong, or written down."
          keys={REVENUE_CATEGORIES}
          results={results}
          max={max}
          subtotal={revenueLeakage}
        />
        <CategoryGroup
          title="Cost to operate"
          tooltip="Money spent or tied up to run the process: financing cost of late invoicing and people time spent reconciling."
          keys={COST_CATEGORIES}
          results={results}
          max={max}
          subtotal={costToOperate}
        />
      </div>

      {/* Downloads */}
      <div className="border border-border-faint bg-card p-5 rounded-none">
        <div className="text-xs uppercase tracking-[0.2em] text-label border-b border-border-faint pb-2 mb-3">
          Export report
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={async () => (await import("@/lib/exports")).downloadPDF(inputs, results, assumptions, summary)}
            className="flex-1 px-4 py-2.5 text-xs uppercase tracking-[0.2em] rounded-none bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={async () => (await import("@/lib/exports")).downloadCSV(inputs, results, assumptions)}
            className="flex-1 px-4 py-2.5 text-xs uppercase tracking-[0.2em] rounded-none bg-transparent border border-rule text-label-mid hover:border-primary hover:text-primary transition-colors"
          >
            Download CSV
          </button>
        </div>
        <p className="mt-3 text-[11px] text-label leading-snug">
          Both files include your inputs, the assumptions used and how each figure is calculated.
        </p>
      </div>
    </div>
  );
}
