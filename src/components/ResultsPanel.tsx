import { CalculatorResults, formatEUR, formatEURExact } from "@/lib/calculations";

interface Props {
  results: CalculatorResults;
}

const riskStyles: Record<CalculatorResults["riskScore"], { bg: string; text: string; dot: string }> = {
  LOW: { bg: "bg-[hsl(var(--risk-low))]/10", text: "text-[hsl(var(--risk-low))]", dot: "bg-[hsl(var(--risk-low))]" },
  MEDIUM: { bg: "bg-[hsl(var(--risk-medium))]/10", text: "text-[hsl(var(--risk-medium))]", dot: "bg-[hsl(var(--risk-medium))]" },
  HIGH: { bg: "bg-[hsl(var(--risk-high))]/10", text: "text-[hsl(var(--risk-high))]", dot: "bg-[hsl(var(--risk-high))]" },
  CRITICAL: { bg: "bg-[hsl(var(--risk-critical))]/10", text: "text-[hsl(var(--risk-critical))]", dot: "bg-[hsl(var(--risk-critical))]" },
};

const insights: Record<CalculatorResults["riskScore"], string> = {
  LOW: "Quote-to-Cash hygiene looks strong. Marginal gains from automation tightening.",
  MEDIUM: "Recoverable leakage detected. Tightening invoice cadence and reconciliation will move the needle.",
  HIGH: "Material revenue is leaking. Prioritise billing automation and CRM-to-billing reconciliation this quarter.",
  CRITICAL: "Severe leakage. A Quote-to-Cash audit is overdue — the cost of inaction compounds monthly.",
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

export function ResultsPanel({ results }: Props) {
  const { billingDelayLeakage, uninvoicedLeakage, discrepancyLeakage, dataQualityLeakage, manualReconciliationCost, annualRevenueLeakage, cashFlowImpact, operationalCost, totalAtRisk, riskScore, riskRatio } = results;

  const breakdown = [
    { label: "Billing Delay", value: billingDelayLeakage },
    { label: "Uninvoiced Deals", value: uninvoicedLeakage },
    { label: "Discrepancies", value: discrepancyLeakage },
    { label: "Data Quality", value: dataQualityLeakage },
    { label: "Manual Recon Cost", value: manualReconciliationCost },
  ];
  const max = Math.max(...breakdown.map((b) => b.value), 1);

  const rs = riskStyles[riskScore];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Live Analysis</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricCard icon="💸" label="Annual Revenue Leakage" value={annualRevenueLeakage} />
          <MetricCard icon="⏱️" label="Cash Flow Impact" value={cashFlowImpact} />
          <MetricCard icon="🔧" label="Operational Cost" value={operationalCost} />
          <MetricCard icon="⚠️" label="Total Revenue at Risk" value={totalAtRisk} accent />
        </div>
      </div>

      <div className="border border-border bg-card p-5 rounded-sm">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Leakage Breakdown</div>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground">{b.label}</span>
                <span className="font-mono-tabular text-muted-foreground">{formatEUR(b.value)}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(b.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border bg-card p-5 rounded-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Risk Score</div>
          <div className="text-[11px] font-mono-tabular text-muted-foreground">
            {(riskRatio * 100).toFixed(2)}% of ARR
          </div>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm ${rs.bg}`}>
          <span className={`h-2 w-2 rounded-full ${rs.dot}`} />
          <span className={`text-sm font-semibold tracking-wider ${rs.text}`}>{riskScore}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{insights[riskScore]}</p>
      </div>
    </div>
  );
}
