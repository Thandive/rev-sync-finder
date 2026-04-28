import {
  CalculatorInputs,
  CalculatorResults,
  CATEGORY_LABELS,
  formatEUR,
  formatEURExact,
  getBenchmarks,
  LeakageCategoryKey,
  RECOMMENDATIONS,
} from "@/lib/calculations";
import { downloadCSV, downloadPDF } from "@/lib/exports";
import { InfoTooltip } from "@/components/InfoTooltip";

interface Props {
  results: CalculatorResults;
  inputs: CalculatorInputs;
  showBenchmarks: boolean;
}

const riskStyles: Record<CalculatorResults["riskScore"], { text: string; dot: string; border: string }> = {
  LOW:      { text: "text-[hsl(var(--risk-low))]",      dot: "bg-[hsl(var(--risk-low))]",      border: "border-[hsl(var(--risk-low))]/50" },
  MEDIUM:   { text: "text-[hsl(var(--risk-medium))]",   dot: "bg-[hsl(var(--risk-medium))]",   border: "border-[hsl(var(--risk-medium))]/50" },
  HIGH:     { text: "text-[hsl(var(--risk-high))]",     dot: "bg-[hsl(var(--risk-high))]",     border: "border-[hsl(var(--risk-high))]/55" },
  CRITICAL: { text: "text-[hsl(var(--risk-critical))]", dot: "bg-[hsl(var(--risk-critical))]", border: "border-[hsl(var(--risk-critical))]/70" },
};

const scoreMeaning: Record<CalculatorResults["riskScore"], string> = {
  LOW: "Your Quote-to-Cash hygiene looks strong — leakage sits within healthy bounds.",
  MEDIUM: "Recoverable leakage detected. The bleed is meaningful but not yet structural.",
  HIGH: "Material revenue is leaking. The pattern points to systemic gaps rather than one-off errors.",
  CRITICAL: "Severe leakage. The cost of inaction compounds every billing cycle.",
};

function MetricCard({
  label,
  value,
  accent = false,
  tooltip,
  subtitle,
}: {
  label: string;
  value: number;
  accent?: boolean;
  tooltip?: string;
  subtitle?: string;
}) {
  return (
    <div className="border border-border-faint bg-card p-5 rounded-none">
      <div className="text-xs uppercase tracking-[0.18em] text-label-low inline-flex items-center gap-1.5">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] text-label normal-case tracking-normal leading-snug">
          {subtitle}
        </div>
      )}
      <div className={`mt-3 font-mono font-semibold text-primary ${accent ? "text-3xl md:text-4xl" : "text-2xl"}`}>
        {formatEUR(value)}
      </div>
      <div className="mt-1 text-xs text-label font-mono-tabular uppercase tracking-[0.12em]">
        {formatEURExact(value)} / yr
      </div>
    </div>
  );
}

export function ResultsPanel({ results, inputs, showBenchmarks }: Props) {
  const {
    billingDelayLeakage,
    uninvoicedLeakage,
    discrepancyLeakage,
    dataQualityLeakage,
    manualReconciliationCost,
    annualRevenueLeakage,
    cashFlowImpact,
    operationalCost,
    totalAtRisk,
    riskScore,
    riskRatio,
  } = results;

  const benchmarks = getBenchmarks(inputs.arr);

  const breakdown: { key: LeakageCategoryKey; value: number; benchmark: number }[] = [
    { key: "billingDelay", value: billingDelayLeakage, benchmark: benchmarks.billingDelay },
    { key: "uninvoiced", value: uninvoicedLeakage, benchmark: benchmarks.uninvoiced },
    { key: "discrepancies", value: discrepancyLeakage, benchmark: benchmarks.discrepancies },
    { key: "dataQuality", value: dataQualityLeakage, benchmark: benchmarks.dataQuality },
    { key: "manualProcess", value: manualReconciliationCost, benchmark: benchmarks.manualProcess },
  ];
  const max = Math.max(
    ...breakdown.map((b) => Math.max(b.value, showBenchmarks ? b.benchmark : 0)),
    1,
  );

  const rs = riskStyles[riskScore];

  // Highest leakage category drives the recommendation
  const top = breakdown.reduce((a, b) => (b.value > a.value ? b : a), breakdown[0]);
  const narrative = `${scoreMeaning[riskScore]} The largest contributor is ${CATEGORY_LABELS[top.key]} at ${formatEUR(top.value)} per year. ${RECOMMENDATIONS[top.key]}`;

  // Split totals — leakage excludes billing delay (informational) and ops cost
  const estimatedRevenueLeakage = uninvoicedLeakage + discrepancyLeakage + dataQualityLeakage;
  const estimatedOperationalWaste = manualReconciliationCost;
  const combinedExposure = estimatedRevenueLeakage + estimatedOperationalWaste;

  return (
    <div className="space-y-6">
      {/* HERO — Risk Score */}
      <div
        className={`border-2 ${rs.border} bg-card rounded-none p-6 md:p-7 ${
          riskScore === "CRITICAL" ? "pulse-critical" : ""
        }`}
        style={
          riskScore === "CRITICAL"
            ? { boxShadow: "0 0 20px hsl(var(--risk-critical) / 0.25)" }
            : undefined
        }
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.25em] text-label-low">
            Revenue Risk Score
          </div>
          <div className="text-xs font-mono-tabular text-label-low uppercase tracking-[0.15em]">
            {(riskRatio * 100).toFixed(2)}% of ARR
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 ${rs.dot}`} />
          <span className={`text-5xl md:text-6xl font-bold tracking-tight font-mono ${rs.text}`}>
            {riskScore}
          </span>
        </div>
        <div className="mt-3 text-xs font-mono-tabular text-label-low uppercase tracking-[0.18em]">
          Total at risk &nbsp;·&nbsp;
          <span className="text-primary normal-case tracking-normal text-sm">
            {formatEURExact(totalAtRisk)}
          </span>
          &nbsp;/&nbsp;yr
        </div>
        <p className="mt-5 text-sm text-foreground/80 leading-relaxed">{narrative}</p>
      </div>

      {/* Primary driver callout */}
      <div className="border-l-2 border-primary bg-primary/5 px-4 py-3">
        <div className="text-xs uppercase tracking-[0.18em] text-label-low">
          Primary leakage driver
        </div>
        <div className="mt-1 font-mono text-sm md:text-base text-foreground/90">
          <span className="text-primary font-semibold">{CATEGORY_LABELS[top.key]}</span>
          <span className="text-label-mid"> — </span>
          <span className="text-primary font-mono-tabular">{formatEURExact(top.value)}</span>
          <span className="text-label-low text-xs"> / yr</span>
        </div>
      </div>

      {/* Metric cards */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-label border-b border-border-faint pb-2 mb-3">
          Live Analysis
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border-faint border border-border-faint">
          <MetricCard label="Annual Revenue Leakage" value={annualRevenueLeakage} />
          <MetricCard
            label="Billing Delay Cost"
            value={cashFlowImpact}
            tooltip="Estimated cost of capital tied up in delayed invoicing. Shown as a standalone informational metric — not included in the totals below."
          />
          <MetricCard label="Operational Cost" value={operationalCost} />
          <MetricCard label="Estimated Revenue Leakage" value={estimatedRevenueLeakage} accent />
        </div>

        {/* Split summary lines */}
        <div className="mt-3 border border-border-faint bg-card rounded-none divide-y divide-border-faint">
          <div className="flex items-baseline justify-between px-4 py-2.5">
            <span className="text-xs uppercase tracking-[0.18em] text-label">
              Estimated Revenue Leakage
            </span>
            <span className="font-mono-tabular text-primary text-sm">
              {formatEURExact(estimatedRevenueLeakage)} / yr
            </span>
          </div>
          <div className="flex items-baseline justify-between px-4 py-2.5">
            <span className="text-xs uppercase tracking-[0.18em] text-label">
              Estimated Operational Waste
            </span>
            <span className="font-mono-tabular text-primary text-sm">
              {formatEURExact(estimatedOperationalWaste)} / yr
            </span>
          </div>
          <div className="flex items-baseline justify-between px-4 py-2.5 bg-primary/5">
            <span className="text-xs uppercase tracking-[0.18em] text-foreground/80 inline-flex items-center gap-1.5">
              Combined Exposure
              <InfoTooltip text="Sum of Estimated Revenue Leakage (Uninvoiced + Discrepancies + Data Quality) and Estimated Operational Waste (Manual Recon Cost). Excludes Billing Delay Cost, which is shown as informational only." />
            </span>
            <span className="font-mono-tabular text-primary text-sm font-semibold">
              {formatEURExact(combinedExposure)} / yr
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="border border-border-faint bg-card p-5 rounded-none">
        <div className="flex items-center justify-between mb-4 border-b border-border-faint pb-2">
          <div className="text-xs uppercase tracking-[0.2em] text-label">
            Leakage Breakdown
          </div>
          {showBenchmarks && (
            <div className="flex items-center gap-3 text-xs font-mono-tabular text-label-low uppercase tracking-[0.12em]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-primary" /> Your estimate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 border border-label-mid" /> Industry avg
              </span>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {breakdown.map((b) => (
            <div key={b.key}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground/80 uppercase tracking-[0.1em]">
                  {CATEGORY_LABELS[b.key]}
                </span>
                <span className="font-mono-tabular text-primary">
                  {formatEUR(b.value)}
                  {showBenchmarks && (
                    <span className="ml-2 text-label">
                      · avg {formatEUR(b.benchmark)}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-2 bg-[hsl(var(--background))] border-b border-border-faint overflow-visible">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(b.value / max) * 100}%` }}
                />
                {showBenchmarks && (
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-px bg-label-mid"
                    style={{ left: `${(b.benchmark / max) * 100}%` }}
                    aria-label="Industry average benchmark"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        {showBenchmarks && (
          <p className="mt-4 pt-3 border-t border-border-faint text-xs text-label-low leading-relaxed normal-case tracking-normal">
            Industry averages are ARR-scaled estimates derived from published B2B SaaS billing audit benchmarks. Intended as directional reference only.
          </p>
        )}
      </div>

      {/* Downloads */}
      <div className="border border-border-faint bg-card p-5 rounded-none">
        <div className="text-xs uppercase tracking-[0.2em] text-label border-b border-border-faint pb-2 mb-3">
          Export Report
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => downloadPDF(inputs, results, narrative)}
            className="flex-1 px-4 py-2.5 text-xs uppercase tracking-[0.2em] rounded-none bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => downloadCSV(inputs, results)}
            className="flex-1 px-4 py-2.5 text-xs uppercase tracking-[0.2em] rounded-none bg-transparent border border-rule text-label-mid hover:border-primary hover:text-primary transition-colors"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
