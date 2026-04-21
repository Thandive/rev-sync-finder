import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ResultsPanel } from "@/components/ResultsPanel";
import { CookieNotice } from "@/components/CookieNotice";
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
const CREDIT = ["Yes", "Ad Hoc", "No"] as const;
const SYSTEMS = ["1", "2", "3+"] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm text-foreground font-medium">{label}</label>
        {hint && <span className="text-xs font-mono-tabular text-primary">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="border-b border-border pb-2 mb-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-mono-tabular">{step}</div>
      <h2 className="text-base font-medium text-foreground mt-1">{title}</h2>
    </div>
  );
}

const Index = () => {
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
    "w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-[hsl(var(--primary))] " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0";

  const inputClass =
    "w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm font-mono-tabular text-foreground " +
    "focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground fade-in">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
            <span className="font-semibold tracking-tight">Rev-Sync</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Revenue Leakage Calculator</span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono-tabular hidden sm:block">
            v1.0 · client-side · no data stored
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-10 md:mb-12 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Find the revenue leaking out of your <span className="text-primary">Quote-to-Cash</span> stack.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            A clinical, real-time estimate based on patterns observed across B2B SaaS billing audits. Answer ten
            questions. See where the money is going.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
          {/* LEFT — inputs */}
          <div className="space-y-10">
            {/* STEP 1 */}
            <section>
              <SectionHeader step="Step 01" title="Company Baseline" />
              <div className="space-y-6">
                <Field label="Annual Recurring Revenue (ARR)" hint={formatEUR(inputs.arr)}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={arrToSlider(inputs.arr)}
                    onChange={(e) => update("arr", Math.round(sliderToArr(parseFloat(e.target.value))))}
                    className={sliderClass}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono-tabular">
                    <span>{formatEUR(ARR_MIN)}</span>
                    <span>{formatEUR(ARR_MAX)}</span>
                  </div>
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Deals closed / month">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={inputs.dealsPerMonth}
                      onChange={(e) => update("dealsPerMonth", Math.max(1, Math.min(500, +e.target.value || 0)))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Average Contract Value (€)">
                    <input
                      type="number"
                      min={0}
                      value={inputs.acv}
                      onChange={(e) => update("acv", Math.max(0, +e.target.value || 0))}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* STEP 2 */}
            <section>
              <SectionHeader step="Step 02" title="Billing Operations Health" />
              <div className="space-y-6">
                <Field label="Days from deal close to invoice raised" hint={`${inputs.delayDays} days`}>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={inputs.delayDays}
                    onChange={(e) => update("delayDays", +e.target.value)}
                    className={sliderClass}
                  />
                </Field>
                <Field label="% of closed deals with no invoice within 60 days" hint={`${inputs.uninvoicedPct}%`}>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={inputs.uninvoicedPct}
                    onChange={(e) => update("uninvoicedPct", +e.target.value)}
                    className={sliderClass}
                  />
                </Field>
                <Field label="How do you reconcile CRM and billing data?">
                  <SegmentedControl
                    options={RECON}
                    value={inputs.reconciliation}
                    onChange={(v) => update("reconciliation", v)}
                  />
                </Field>
                <Field label="How often do invoices not match the contracted amount?">
                  <SegmentedControl
                    options={FREQ}
                    value={inputs.discrepancyFreq}
                    onChange={(v) => update("discrepancyFreq", v)}
                  />
                </Field>
              </div>
            </section>

            {/* STEP 3 */}
            <section>
              <SectionHeader step="Step 03" title="Data Quality" />
              <div className="space-y-6">
                <Field label="% of CRM records with missing or inconsistent data" hint={`${inputs.dirtyDataPct}%`}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={inputs.dirtyDataPct}
                    onChange={(e) => update("dirtyDataPct", +e.target.value)}
                    className={sliderClass}
                  />
                </Field>
                <Field label="Documented process for credit notes and amendments?">
                  <SegmentedControl
                    options={CREDIT}
                    value={inputs.creditNoteProcess}
                    onChange={(v) => update("creditNoteProcess", v)}
                  />
                </Field>
                <Field label="How many systems hold revenue data in your stack?">
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
            <ResultsPanel results={results} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <p className="text-xs text-foreground max-w-xl leading-relaxed">
              Built by Thandive Sila. · Revenue & Billing Operations · 8+ years in B2B SaaS
            </p>
            <div className="flex gap-5 text-xs">
              <a
                href="https://www.linkedin.com/in/thandive"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://www.revenue.thandive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                View Portfolio
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Estimates are indicative only and based on industry benchmarks. Not financial advice.
          </p>
        </div>
      </footer>
      <CookieNotice />
    </div>
  );
};

export default Index;
