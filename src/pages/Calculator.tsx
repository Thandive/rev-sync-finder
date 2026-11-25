import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ResultsPanel } from "@/components/ResultsPanel";
import { InfoTooltip } from "@/components/InfoTooltip";
import { NumberField } from "@/components/NumberField";
import { AppNav } from "@/components/AppNav";
import { AssumptionsPanel } from "@/components/AssumptionsPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { inputClass, sliderClass } from "@/lib/styles";
import { CurrencySwitch } from "@/components/CurrencySwitch";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import {
  ARR_MAX,
  ARR_MIN,
  Assumptions,
  CalculatorInputs,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INPUTS,
  arrToSlider,
  calculate,
  formatMoney,
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
  arr: "ARR anchors all leakage estimates. The larger the base, the more meaningful even small percentage leaks become in absolute terms.",
  dealsPerMonth: "New deals closed per month. Deals × 12 × ACV gives the annual new bookings that flow through the CRM-to-billing handover.",
  acv: "Average annual value of a new contract. Also used to estimate the number of customer accounts (ARR ÷ ACV) that need reconciling.",
  delayDays: "If your billing is triggered by service start date rather than deal close date, use the gap between service start and invoice date instead.",
  uninvoicedPct: "Measure from first billing date or service start date — not from deal close date. Deals with a future start date are expected to have no invoice at close.",
  reconciliation: "Manual reconciliation introduces lag and human error — both of which widen the gap between booked and billed revenue.",
  discrepancyFreq: "Invoices that don't match contracted amounts indicate broken pricing logic, stale CRM data, or weak controls between Sales and Finance.",
  dirtyDataPct: "If your CRM and billing system are integrated: look for field mapping gaps and sync errors. If the process is manual (e.g. PDF contract → ERP data entry): look for transcription errors and missing line items. Either way, poor data quality drives revenue leakage.",
  creditNoteProcess: "Without a documented process, credit notes get issued informally — creating reconciliation gaps and silent revenue write-downs.",
  systems: "More systems holding revenue data means more reconciliation surface area and more places for the source of truth to diverge.",
} as const;

const Calculator = () => {
  const { currency } = useCurrency();
  const sym = CURRENCY_SYMBOL[currency];
  const money = (n: number) => formatMoney(n, currency);
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);

  const update = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) =>
    setInputs((p) => ({ ...p, [key]: value }));

  const results = useMemo(() => calculate(inputs, assumptions, currency), [inputs, assumptions, currency]);

  return (
    <div className="min-h-screen bg-background text-foreground fade-in p-0">
      <AppNav />
      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-10 md:mb-12 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-label mb-3">// Revenue Leakage Calculator</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">
            Find the revenue leaking out of your <span className="text-primary">Quote-to-Cash</span> stack.
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <span className="text-xs uppercase tracking-[0.2em] text-label-low">v1.1 · runs in your browser · nothing stored</span>
            <CurrencySwitch />
          </div>
          <p className="mt-4 text-sm md:text-base text-label-low leading-relaxed">
            Answer ten questions about your billing operation. The estimate updates as you type, every figure shows
            how it is calculated, and every assumption behind it is open to edit.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
            {/* LEFT — inputs */}
            <div className="space-y-10">
              {/* Privacy notice */}
              <div className="border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs uppercase tracking-[0.15em] text-foreground/85">
                <span className="text-primary mr-1">●</span> Generated client-side · no data leaves your browser
              </div>

            {/* STEP 1 */}
            <section>
              <SectionHeader step="Section 01" title="Company Baseline" />
              <div className="space-y-6">
                <Field label="Annual Recurring Revenue (ARR)" hint={money(inputs.arr)} tooltip={TOOLTIPS.arr}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={arrToSlider(inputs.arr)}
                    onChange={(e) => update("arr", Math.round(sliderToArr(parseFloat(e.target.value))))}
                    className={sliderClass}
                    aria-label="Annual recurring revenue"
                  />
                  <div className="flex justify-between text-xs text-label font-mono-tabular mt-2">
                    <span>{money(ARR_MIN)}</span>
                    <span>{money(ARR_MAX)}</span>
                  </div>
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Deals closed / month" tooltip={TOOLTIPS.dealsPerMonth}>
                    <NumberField
                      value={inputs.dealsPerMonth}
                      min={1}
                      max={500}
                      onChange={(n) => update("dealsPerMonth", n)}
                      ariaLabel="Deals closed per month"
                      className={inputClass}
                    />
                  </Field>
                  <Field label={`Average Contract Value (${sym})`} tooltip={TOOLTIPS.acv}>
                    <NumberField
                      value={inputs.acv}
                      min={0}
                      onChange={(n) => update("acv", n)}
                      ariaLabel={`Average contract value in ${currency}`}
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
                    aria-label="Days from deal close to invoice raised"
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
                    aria-label="Percent of closed deals with no invoice within 60 days"
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
                    aria-label="Percent of CRM records with missing or inconsistent data"
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

            <AssumptionsPanel value={assumptions} onChange={setAssumptions} />
            </div>

            {/* RIGHT — results (sticky on desktop) */}
            <aside id="results" className="lg:sticky lg:top-8 lg:self-start scroll-mt-4">
              <ResultsPanel results={results} inputs={inputs} assumptions={assumptions} />
            </aside>
          </div>
      </main>

      {/* Mobile: keep the result in view while answering */}
      <a
        href="#results"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur px-5 py-3 flex items-center justify-between gap-3"
      >
        <span className="text-xs uppercase tracking-[0.16em] text-label-mid">
          <span className="font-semibold" style={{ color: `hsl(var(--risk-${results.riskScore.toLowerCase()}))` }}>
            {results.riskScore}
          </span>{" "}
          · {money(results.totalExposure)} / yr
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-primary">See breakdown ↓</span>
      </a>
      <div className="lg:hidden h-14" aria-hidden="true" />
      <SiteFooter />
    </div>
  );
};

export default Calculator;
