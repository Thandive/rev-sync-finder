import { Download, FileText } from "lucide-react";
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

interface Props {
  results: CalculatorResults;
  inputs: CalculatorInputs;
  showBenchmarks: boolean;
}

const riskStyles: Record<CalculatorResults["riskScore"], { bg: string; text: string; dot: string }> = {
  LOW: { bg: "bg-[hsl(var(--risk-low))]/10", text: "text-[hsl(var(--risk-low))]", dot: "bg-[hsl(var(--risk-low))]" },
  MEDIUM: { bg: "bg-[hsl(var(--risk-medium))]/10", text: "text-[hsl(var(--risk-medium))]", dot: "bg-[hsl(var(--risk-medium))]" },
  HIGH: { bg: "bg-[hsl(var(--risk-high))]/10", text: "text-[hsl(var(--risk-high))]", dot: "bg-[hsl(var(--risk-high))]" },
  CRITICAL: { bg: "bg-[hsl(var(--risk-critical))]/10", text: "text-[hsl(var(--risk-critical))]", dot: "bg-[hsl(var(--risk-critical))]" },
};

const scoreMeaning: Record<CalculatorResults["riskScore"], string> = {
  LOW: "Your Quote-to-Cash hygiene looks strong — leakage sits within healthy bounds.",
  MEDIUM: "Recoverable leakage detected. The bleed is meaningful but not yet structural.",
  HIGH: "Material revenue is leaking. The pattern points to systemic gaps rather than one-off errors.",
  CRITICAL: "Severe leakage. The cost of inaction compounds every billing cycle.",
};

function MetricCard({ icon, label, value, accent = false }: { icon: string; label: string; value: number; accent?: boolean }) {
  return (
    <div className="border border-border bg-card p-5 rounded-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`mt-3 font-mono-tabular font-semibold ${accent ? "text-primary text-3xl md:text-4xl" : "text-foreground text-2xl"}`}>
        {formatEUR(value)}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground font-mono-tabular">{formatEURExact(value)} / yr</div>
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

  return (
    <div className="space-y-6">
      {/* HERO — Risk Score */}
      <div
        className={`border rounded-sm p-6 md:p-8 ${rs.bg} ${riskScore === "CRITICAL" ? "pulse-critical" : ""}`}
        style={{ borderColor: `hsl(var(--${riskScoreVar(riskScore)}) / 0.35)` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Revenue Risk Score
          </div>
          <div className="text-[11px] font-mono-tabular text-muted-foreground">
            {(riskRatio * 100).toFixed(2)}% of ARR
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${rs.dot}`} />
          <span className={`text-4xl md:text-5xl font-bold tracking-tight ${rs.text}`}>
            {riskScore}
          </span>
        </div>
        <div className="mt-2 text-xs font-mono-tabular text-muted-foreground">
          Total at risk · <span className="text-foreground">{formatEURExact(totalAtRisk)}</span> / yr
        </div>
        <p className="mt-5 text-sm text-foreground/90 leading-relaxed">{narrative}</p>
      </div>

      {/* Metric cards */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Live Analysis
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricCard icon="💸" label="Annual Revenue Leakage" value={annualRevenueLeakage} />
          <MetricCard icon="⏱️" label="Cash Flow Impact" value={cashFlowImpact} />
          <MetricCard icon="🔧" label="Operational Cost" value={operationalCost} />
          <MetricCard icon="⚠️" label="Total Revenue at Risk" value={totalAtRisk} accent />
        </div>
      </div>

      {/* Breakdown */}
      <div className="border border-border bg-card p-5 rounded-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Leakage Breakdown
          </div>
          {showBenchmarks && (
            <div className="flex items-center gap-3 text-[10px] font-mono-tabular text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-primary" /> Your estimate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm border border-muted-foreground/60" /> Industry avg
              </span>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {breakdown.map((b) => (
            <div key={b.key}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground">{CATEGORY_LABELS[b.key]}</span>
                <span className="font-mono-tabular text-muted-foreground">
                  {formatEUR(b.value)}
                  {showBenchmarks && (
                    <span className="ml-2 text-muted-foreground/70">
                      · avg {formatEUR(b.benchmark)}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(b.value / max) * 100}%` }}
                />
                {showBenchmarks && (
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-muted-foreground/70"
                    style={{ left: `${(b.benchmark / max) * 100}%` }}
                    aria-label="Industry average benchmark"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downloads */}
      <div className="border border-border bg-card p-5 rounded-sm">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Export Report
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => downloadPDF(inputs, results, narrative)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <FileText className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button
            type="button"
            onClick={() => downloadCSV(inputs, results)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-sm border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground font-mono-tabular">
          Generated client-side · no data leaves your browser
        </p>
      </div>
    </div>
  );
}

function riskScoreVar(score: CalculatorResults["riskScore"]) {
  return score === "LOW"
    ? "risk-low"
    : score === "MEDIUM"
      ? "risk-medium"
      : score === "HIGH"
        ? "risk-high"
        : "risk-critical";
}
