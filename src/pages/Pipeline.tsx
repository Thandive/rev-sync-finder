import { useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { SiteFooter } from "@/components/SiteFooter";
import { NumberField } from "@/components/NumberField";
import { InfoTooltip } from "@/components/InfoTooltip";
import { inputClass, sliderClass } from "@/lib/styles";
import {
  analysePipeline,
  CoverageStatus,
  fmtEUR,
  PipelineInputs,
  SAMPLE_PIPELINE,
  StageId,
  StageInput,
  STAGE_LABELS,
} from "@/lib/pipeline";
import { NarrativeResult, requestNarrative } from "@/lib/narrative";

const statusColor: Record<CoverageStatus, string> = {
  "TARGET MET": "--risk-low",
  "ON TRACK": "--risk-low",
  "AT RISK": "--risk-medium",
  BEHIND: "--risk-high",
  CRITICAL: "--risk-critical",
};

function Label({ children, tooltip, hint }: { children: React.ReactNode; tooltip?: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-1">
      <span className="text-xs uppercase tracking-[0.16em] text-label-low inline-flex items-center gap-1.5">
        {children}
        {tooltip && <InfoTooltip text={tooltip} />}
      </span>
      {hint && <span className="text-xs font-mono-tabular text-primary">{hint}</span>}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border border-border-faint bg-card rounded-none p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-border-faint pb-2 mb-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-label-mid">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-card p-4 md:p-5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-label">{label}</div>
      <div
        className="mt-2 text-xl md:text-2xl font-semibold font-mono-tabular"
        style={{ color: color ? `hsl(var(${color}))` : undefined }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-label-mid">{sub}</div>
    </div>
  );
}

export default function PipelineStoryteller() {
  const [input, setInput] = useState<PipelineInputs>(SAMPLE_PIPELINE);
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const r = useMemo(() => analysePipeline(input), [input]);
  const color = statusColor[r.status];

  const set = <K extends keyof PipelineInputs>(key: K, v: PipelineInputs[K]) => {
    setInput((p) => ({ ...p, [key]: v }));
    setNarrative(null);
  };
  const setStage = (id: StageId, field: keyof Omit<StageInput, "id">, v: number) => {
    setInput((p) => ({ ...p, stages: p.stages.map((s) => (s.id === id ? { ...s, [field]: v } : s)) }));
    setNarrative(null);
  };

  const generate = async () => {
    setLoading(true);
    setNarrative(await requestNarrative(input, r));
    setLoading(false);
  };

  const barMax = Math.max(...r.stages.map((s) => s.value), 1);
  const days = Math.round(r.daysRemaining);

  return (
    <div className="min-h-screen bg-background text-foreground fade-in">
      <AppNav />

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-10 max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-label mb-3">// Pipeline Coverage Storyteller</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">
            Will this quarter's pipeline <span className="text-primary">cover the number</span>?
          </h1>
          <div className="mt-3 text-xs uppercase tracking-[0.2em] text-label-low">v1.1 · sample data loaded · edit any figure</div>
          <p className="mt-4 text-sm md:text-base text-label-low leading-relaxed">
            Weighted pipeline by stage, adjusted for the days left in the quarter, then turned into a short narrative a
            VP of Revenue can act on.
          </p>
        </div>

        {/* Headline metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-faint border border-border-faint mb-8">
          <Metric label="Still needed" value={fmtEUR(r.remainingTarget)} sub={`${fmtEUR(r.quarterTarget)} target − ${fmtEUR(input.closedWon)} won`} />
          <Metric label="Can close this Q" value={fmtEUR(r.inQuarterPipeline)} sub={`weighted, ${days} days left`} />
          <Metric label="Gap" value={fmtEUR(r.gap)} sub={r.dealsNeeded ? `≈ ${r.dealsNeeded} deals at ${fmtEUR(input.avgDealSize)}` : "covered"} />
          <Metric label="Status" value={r.status} sub={`${Math.round(r.coverage * 100)}% coverage`} color={color} />
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6 lg:gap-8">
          {/* Inputs (after the results on small screens) */}
          <div className="space-y-6 order-2 lg:order-1">
            <Panel
              title="Quarter"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setInput(SAMPLE_PIPELINE);
                    setNarrative(null);
                  }}
                  className="text-[11px] uppercase tracking-[0.16em] text-label hover:text-primary transition-colors"
                >
                  Reset sample
                </button>
              }
            >
              <div className="space-y-5">
                <label className="block">
                  <Label tooltip="Annual new-business quota. The quarter target is a quarter of it.">Annual quota (€)</Label>
                  <NumberField value={input.annualQuota} min={0} onChange={(n) => set("annualQuota", n)} className={inputClass} ariaLabel="Annual quota in euros" />
                </label>
                <label className="block">
                  <Label tooltip="Already closed-won this quarter. Coverage is measured against what is still needed.">Closed-won this quarter (€)</Label>
                  <NumberField value={input.closedWon} min={0} onChange={(n) => set("closedWon", n)} className={inputClass} ariaLabel="Closed-won this quarter in euros" />
                </label>
                <label className="block">
                  <Label>Average deal size (€)</Label>
                  <NumberField value={input.avgDealSize} min={0} onChange={(n) => set("avgDealSize", n)} className={inputClass} ariaLabel="Average deal size in euros" />
                </label>
                <label className="block">
                  <Label hint={`${input.quarterProgress}% · ${days} days left`}>Quarter elapsed</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={input.quarterProgress}
                    onChange={(e) => set("quarterProgress", +e.target.value)}
                    className={sliderClass}
                    aria-label="Percent of the quarter elapsed"
                  />
                </label>
              </div>
            </Panel>

            <Panel title="Open pipeline by stage">
              <div className="space-y-6">
                {input.stages.map((s) => (
                  <div key={s.id} className="space-y-3 pb-5 border-b border-border-faint last:border-0 last:pb-0">
                    <div className="text-sm font-semibold text-foreground">{STAGE_LABELS[s.id]}</div>
                    <label className="block">
                      <Label>Open value (€)</Label>
                      <NumberField value={s.value} min={0} onChange={(n) => setStage(s.id, "value", n)} className={inputClass} ariaLabel={`${STAGE_LABELS[s.id]} open value in euros`} />
                    </label>
                    <label className="block">
                      <Label hint={`${s.winRate}%`} tooltip="Probability that a deal in this stage closes-won.">Win rate</Label>
                      <input type="range" min={0} max={100} value={s.winRate} onChange={(e) => setStage(s.id, "winRate", +e.target.value)} className={sliderClass} aria-label={`${STAGE_LABELS[s.id]} win rate`} />
                    </label>
                    <label className="block">
                      <Label hint={`${s.cycleDays} d`} tooltip="Average days from this stage to close. If it is longer than the days left, only part of the stage can land this quarter.">Days to close</Label>
                      <input type="range" min={1} max={180} value={s.cycleDays} onChange={(e) => setStage(s.id, "cycleDays", +e.target.value)} className={sliderClass} aria-label={`${STAGE_LABELS[s.id]} days to close`} />
                    </label>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Outputs */}
          <div className="space-y-6 min-w-0 order-1 lg:order-2">
            <Panel title="Weighted pipeline by stage">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-label-mid mb-4">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 bg-rule" /> open</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 bg-primary/40" /> weighted</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 bg-primary" /> can close this quarter</span>
              </div>
              <div className="space-y-4">
                {r.stages.map((s) => (
                  <div key={s.id}>
                    <div className="flex justify-between gap-3 text-xs mb-1.5">
                      <span className="uppercase tracking-[0.1em] text-foreground/85">{s.label}</span>
                      <span className="font-mono-tabular text-label-mid">
                        <span className="text-primary">{fmtEUR(s.inQuarter)}</span> / {fmtEUR(s.weighted)} / {fmtEUR(s.value)}
                      </span>
                    </div>
                    <div className="relative h-3 bg-background">
                      <div className="absolute inset-y-0 left-0 bg-rule transition-all duration-300" style={{ width: `${(s.value / barMax) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-primary/40 transition-all duration-300" style={{ width: `${(s.weighted / barMax) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-primary transition-all duration-300" style={{ width: `${(s.inQuarter / barMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border border-border-faint p-4">
                <div className="flex justify-between gap-3 text-xs uppercase tracking-[0.16em] mb-2">
                  <span className="text-label-mid inline-flex items-center gap-1.5">
                    Coverage of what is still needed
                    <InfoTooltip text="Weighted pipeline that can close before quarter end, divided by the target still to win. ≥100% on track · 80–99% at risk · 50–79% behind · below 50% critical." />
                  </span>
                  <span className="font-mono-tabular" style={{ color: `hsl(var(${color}))` }}>
                    {r.remainingTarget > 0 ? `${Math.round(r.coverage * 100)}%` : "met"}
                  </span>
                </div>
                <div className="h-1.5 bg-background">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${Math.min(r.remainingTarget > 0 ? r.coverage : 1, 1) * 100}%`, background: `hsl(var(${color}))` }}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Signals">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border-faint border border-border-faint">
                <Metric
                  label="Timing slip"
                  value={r.biggestSlip ? r.biggestSlip.label : "None"}
                  sub={r.biggestSlip ? `${fmtEUR(r.biggestSlip.slip)} weighted likely to close after quarter end` : "every stage's cycle fits in the time left"}
                />
                <Metric label="Raw pipeline" value={`${r.rawCoverage.toFixed(1)}×`} sub={`${fmtEUR(r.totalPipeline)} open vs ${fmtEUR(r.remainingTarget)} needed`} />
                <Metric label="Weighted pipeline" value={fmtEUR(r.weightedPipeline)} sub={`${fmtEUR(r.totalSlip)} of it lands after this quarter`} />
                <Metric label="Deals to close the gap" value={r.dealsNeeded ? String(r.dealsNeeded) : "None"} sub={r.dealsNeeded ? `at ${fmtEUR(input.avgDealSize)}, already late-stage` : "gap covered"} />
              </div>
            </Panel>

            <Panel
              title="VP-ready narrative"
              action={
                <button
                  type="button"
                  onClick={generate}
                  disabled={loading}
                  className="px-4 py-2 text-xs uppercase tracking-[0.18em] rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Writing…" : narrative ? "Regenerate" : "Generate"}
                </button>
              }
            >
              {!narrative && !loading && (
                <p className="text-sm text-label-mid leading-relaxed">
                  Generate a 3–4 sentence summary of the numbers above, written for a VP of Revenue: the bottom line, what
                  it means, and one recommendation.
                </p>
              )}
              {loading && <p className="text-sm text-label-mid font-mono-tabular">Analysing pipeline…</p>}
              {narrative && !loading && (
                <div className="fade-in">
                  <p className="border-l-2 border-primary pl-4 text-sm md:text-base leading-relaxed text-foreground/90">{narrative.text}</p>
                  <p className="mt-3 text-[11px] text-label leading-snug">
                    {narrative.source === "ai"
                      ? "Written by Claude (Anthropic) from the figures above."
                      : `Rule-based summary from the figures above (${narrative.reason ?? "AI narrative unavailable"}).`}
                  </p>
                </div>
              )}
              <p className="mt-5 pt-3 border-t border-border-faint text-[11px] text-label leading-snug">
                The calculations run in your browser. When you click Generate, the figures above (numbers only, no names or
                text) are sent to the Claude API to write the narrative. Nothing is stored.
              </p>
            </Panel>
          </div>
        </div>
      </main>

      <SiteFooter note="Win rates, cycles and values are yours to set; the sample data is illustrative. Indicative only, not financial advice." />
    </div>
  );
}
