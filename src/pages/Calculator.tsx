import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ResultsPanel } from "@/components/ResultsPanel";
import { CookieNotice } from "@/components/CookieNotice";
import { InfoTooltip } from "@/components/InfoTooltip";
import { NumberField } from "@/components/NumberField";
import { V2Panel } from "@/components/V2Panel";
import { AppNav } from "@/components/AppNav";
import { Switch } from "@/components/ui/switch";
import {
  ARR_MAX,
  ARR_MIN,
  CalculatorInputs,
  arrToSlider,
  calculate,
  formatEUR,
  sliderToArr,
} from "@/lib/calculations";

const RECON = ["Manual", "Partially Automated", "Fully Automated"] as const;
const FREQ = ["Rarely", "Occasionally", "Frequently"] as const;
const FREQ_LABELS: Record<(typeof FREQ)[number], string> = {
  Rarely: "Rarely (< 2% of invoices)",
  Occasionally: "Occasionally (2–10%)",
  Frequently: "Frequently (> 10%)",
};
const CREDIT = ["Yes", "Ad Hoc", "No"] as const;
const SYSTEMS = ["1", "2", "3+"] as const;

function Field({
  label,
  hint,
  tooltip,
  children,
}: {
  label: string;
  hint?: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs uppercase tracking-[0.18em] text-label-low inline-flex items-center gap-1.5">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {hint && <span className="text-xs font-mono-tabular text-primary">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="border-b border-border-faint pb-2 mb-5 flex items-baseline justify-between">
      <div className="text-xs uppercase tracking-[0.2em] text-label">{step}</div>
      <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/80">{title}</h2>
    </div>
  );
}

const TOOLTIPS = {
  arr: "ARR anchors all leakage estimates. The larger the base, the more meaningful even small percentage leaks become in absolute euros.",
  dealsPerMonth: "Deal volume drives invoicing throughput. The more deals close, the more opportunities for handover errors between CRM and billing.",
  acv: "ACV multiplies the cost of every billing mistake. Higher ACVs mean a single missed invoice or discrepancy can represent significant revenue.",
  delayDays: "If your billing is triggered by service start date rather than deal close date, use the gap between service start and invoice date instead.",
  uninvoicedPct: "Measure from first billing date or service start date — not from deal close date. Deals with a future start date are expected to have no invoice at close.",
  reconciliation: "Manual reconciliation introduces lag and human error — both of which widen the gap between booked and billed revenue.",
  discrepancyFreq: "Invoices that don't match contracted amounts indicate broken pricing logic, stale CRM data, or weak controls between Sales and Finance.",
  dirtyDataPct: "If your CRM and billing system are integrated: look for field mapping gaps and sync errors. If the process is manual (e.g. PDF contract → ERP data entry): look for transcription errors and missing line items. Either way, poor data quality drives revenue leakage.",
  creditNoteProcess: "Without a documented process, credit notes get issued informally — creating reconciliation gaps and silent revenue write-downs.",
  systems: "More systems holding revenue data means more reconciliation surface area and more places for the source of truth to diverge.",
} as const;

type Tab = "calculator" | "reconciliation";

const Calculator = () => {
  const [tab, setTab] = useState<Tab>("calculator");
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  const [inputs, setInputs] = useState<CalculatorInputs>({
    arr: 5_000_000,
    dealsPerMonth: 20,
    acv: 25_000,
    delayDays: 15,
    uninvoicedPct: 5,
    reconciliation: "Partially Automated",
    discrepancyFreq: "Occasionally",
    dirtyDataPct: 10,
    creditNoteProcess: "Ad Hoc",
    systems: "2",
  });

  const update = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) =>
    setInputs((p) => ({ ...p, [key]: value }));

  const results = useMemo(() => calculate(inputs), [inputs]);

  const sliderClass =
    "w-full h-px bg-rule appearance-none cursor-pointer rounded-none " +
    "[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-rule " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 " +
    "[&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-webkit-slider-thumb]:-mt-[5px] " +
    "[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-rule " +
    "[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0";

  const inputClass =
    "w-full bg-transparent border-0 border-b border-rule rounded-none px-0 py-2 text-base font-mono-tabular text-primary " +
    "focus:outline-none focus:border-primary transition-colors placeholder:text-label";

  return (
    <div className="min-h-screen bg-background text-foreground fade-in p-0">
      <AppNav />
      {/* Header */}
      <header className="border-b border-border-faint">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="9" cy="12" r="6" stroke="hsl(var(--primary))" strokeWidth="2" />
              <circle cx="15" cy="12" r="6" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
            </svg>
            <span className="text-base font-semibold tracking-[0.05em] uppercase">Rev-Sync</span>
            <span className="hidden md:inline text-xs uppercase tracking-[0.2em] text-label-low ml-2">
              Revenue Leakage Calculator
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => setTab("calculator")}
              className={`px-3 py-1.5 rounded-none uppercase tracking-[0.18em] text-xs border transition-colors ${
                tab === "calculator"
                  ? "border-primary text-primary"
                  : "border-transparent text-label-low hover:text-foreground"
              }`}
            >
              Calculator
            </button>
            <button
              type="button"
              onClick={() => setTab("reconciliation")}
              className={`px-3 py-1.5 rounded-none uppercase tracking-[0.18em] text-xs border transition-colors inline-flex items-center gap-2 ${
                tab === "reconciliation"
                  ? "border-primary text-primary"
                  : "border-transparent text-label-low hover:text-foreground"
              }`}
            >
              Reconciliation
              <span className="text-[10px] uppercase tracking-[0.2em] border border-primary/60 text-primary px-1.5 py-0.5 rounded-none">
                Soon
              </span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-10 md:mb-12 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">
            Find the revenue leaking out of your <span className="text-primary">Quote-to-Cash</span> stack.
          </h1>
          <div className="mt-3 text-xs uppercase tracking-[0.2em] text-label-low">
            v1.0 · client-side · no data stored
          </div>
          <div className="block md:hidden text-xs uppercase tracking-[0.2em] text-label-low">
            best experienced on desktop
          </div>
          <p className="mt-4 text-sm md:text-base text-label-low leading-relaxed">
            A clinical, real-time estimate based on patterns observed across B2B SaaS billing audits. Answer ten
            questions. See where the money is going.
          </p>
        </div>

        {tab === "reconciliation" ? (
          <V2Panel />
        ) : (
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
            {/* LEFT — inputs */}
            <div className="space-y-10">
              {/* Privacy notice */}
              <div className="border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs uppercase tracking-[0.15em] text-foreground/85">
                <span className="text-primary mr-1">●</span> Generated client-side · no data leaves your browser
              </div>

              {/* Benchmark toggle */}
              <div className="flex items-center justify-between border border-border-faint bg-card rounded-none px-4 py-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-foreground/80">
                    Compare to Industry Average
                  </div>
                  <div className="text-xs text-label mt-1 uppercase tracking-[0.15em]">
                    Overlay B2B SaaS benchmarks
                  </div>
                </div>
                <Switch
                  checked={showBenchmarks}
                  onCheckedChange={setShowBenchmarks}
                  aria-label="Toggle industry benchmarks"
                />
              </div>

            {/* STEP 1 */}
            <section>
              <SectionHeader step="Section 01" title="Company Baseline" />
              <div className="space-y-6">
                <Field label="Annual Recurring Revenue (ARR)" hint={formatEUR(inputs.arr)} tooltip={TOOLTIPS.arr}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={arrToSlider(inputs.arr)}
                    onChange={(e) => update("arr", Math.round(sliderToArr(parseFloat(e.target.value))))}
                    className={sliderClass}
                  />
                  <div className="flex justify-between text-xs text-label font-mono-tabular mt-2">
                    <span>{formatEUR(ARR_MIN)}</span>
                    <span>{formatEUR(ARR_MAX)}</span>
                  </div>
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Deals closed / month" tooltip={TOOLTIPS.dealsPerMonth}>
                    <NumberField
                      value={inputs.dealsPerMonth}
                      min={1}
                      max={500}
                      onChange={(n) => update("dealsPerMonth", n)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Average Contract Value (€)" tooltip={TOOLTIPS.acv}>
                    <NumberField
                      value={inputs.acv}
                      min={0}
                      onChange={(n) => update("acv", n)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* STEP 2 */}
            <section>
              <SectionHeader step="Section 02" title="Billing Operations Health" />
              <div className="space-y-6">
                <Field label="Days from deal close to invoice raised" hint={`${inputs.delayDays} days`} tooltip={TOOLTIPS.delayDays}>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={inputs.delayDays}
                    onChange={(e) => update("delayDays", +e.target.value)}
                    className={sliderClass}
                  />
                </Field>
                <Field label="% of closed deals with no invoice within 60 days" hint={`${inputs.uninvoicedPct}%`} tooltip={TOOLTIPS.uninvoicedPct}>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={inputs.uninvoicedPct}
                    onChange={(e) => update("uninvoicedPct", +e.target.value)}
                    className={sliderClass}
                  />
                </Field>
                <Field label="How do you reconcile CRM and billing data?" tooltip={TOOLTIPS.reconciliation}>
                  <SegmentedControl
                    options={RECON}
                    value={inputs.reconciliation}
                    onChange={(v) => update("reconciliation", v)}
                  />
                </Field>
                <Field label="How often do invoices not match the contracted amount?" tooltip={TOOLTIPS.discrepancyFreq}>
                  <SegmentedControl
                    options={FREQ}
                    value={inputs.discrepancyFreq}
                    onChange={(v) => update("discrepancyFreq", v)}
                    labels={FREQ_LABELS}
                  />
                </Field>
              </div>
            </section>

            {/* STEP 3 */}
            <section>
              <SectionHeader step="Section 03" title="Data & Process Quality" />
              <div className="space-y-6">
                <Field label="% of CRM records with missing or inconsistent data" hint={`${inputs.dirtyDataPct}%`} tooltip={TOOLTIPS.dirtyDataPct}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={inputs.dirtyDataPct}
                    onChange={(e) => update("dirtyDataPct", +e.target.value)}
                    className={sliderClass}
                  />
                </Field>
                <Field label="Documented process for credit notes and amendments?" tooltip={TOOLTIPS.creditNoteProcess}>
                  <SegmentedControl
                    options={CREDIT}
                    value={inputs.creditNoteProcess}
                    onChange={(v) => update("creditNoteProcess", v)}
                  />
                </Field>
                <Field label="How many systems hold revenue data in your stack?" tooltip={TOOLTIPS.systems}>
                  <SegmentedControl
                    options={SYSTEMS}
                    value={inputs.systems}
                    onChange={(v) => update("systems", v)}
                  />
                </Field>
              </div>
            </section>
            </div>

            {/* RIGHT — results (sticky on desktop) */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <ResultsPanel results={results} inputs={inputs} showBenchmarks={showBenchmarks} />
            </aside>
          </div>
        )}
      </main>

      <footer className="border-t border-border-faint mt-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col items-center text-center gap-4">
          <p className="text-sm text-foreground/80 max-w-xl leading-relaxed">
            Built by{" "}
            <a
              href="https://thandive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Thandive Sila
            </a>
            . · Revenue & Billing Operations · 8+ years in B2B SaaS
          </p>
          <div className="flex gap-5 text-xs uppercase tracking-[0.2em]">
            <a
              href="https://www.linkedin.com/in/thandive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-low hover:text-primary transition-colors"
            >
              LinkedIn
            </a>
          </div>
          <p className="text-xs text-label leading-relaxed uppercase tracking-[0.12em]">
            Estimates are indicative only and based on industry benchmarks. Not financial advice.
          </p>
        </div>
      </footer>
      <CookieNotice />
    </div>
  );
};

export default Calculator;
