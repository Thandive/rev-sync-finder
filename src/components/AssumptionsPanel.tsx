import { NumberField } from "@/components/NumberField";
import {
  Assumptions,
  CreditNoteProcess,
  DEFAULT_ASSUMPTIONS,
  DiscrepancyFrequency,
  ReconciliationMode,
  SystemCount,
} from "@/lib/calculations";

interface Props {
  value: Assumptions;
  onChange: (next: Assumptions) => void;
}

const inputClass =
  "w-full bg-transparent border-0 border-b border-rule rounded-none px-0 py-1.5 text-sm font-mono-tabular text-primary " +
  "focus:outline-none focus:border-primary transition-colors";

function Row({ label, unit, children }: { label: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_6.5rem] items-end gap-4">
      <div className="text-xs text-label-mid leading-snug">
        {label} <span className="text-label">({unit})</span>
      </div>
      {children}
    </div>
  );
}

function Num({
  value,
  onChange,
  max,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  ariaLabel: string;
}) {
  return (
    <NumberField
      value={value}
      min={0}
      max={max}
      step="any"
      inputMode="decimal"
      ariaLabel={ariaLabel}
      onChange={onChange}
      className={inputClass}
    />
  );
}

function Group<K extends string>({
  title,
  unit,
  keys,
  values,
  onChange,
  max,
}: {
  title: string;
  unit: string;
  keys: readonly K[];
  values: Record<K, number>;
  onChange: (next: Record<K, number>) => void;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-label-mid leading-snug">
        {title} <span className="text-label">({unit})</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }}>
        {keys.map((k) => (
          <label key={k} className="block">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-label mb-0.5">{k}</span>
            <Num value={values[k]} max={max} ariaLabel={`${title}: ${k}`} onChange={(n) => onChange({ ...values, [k]: n })} />
          </label>
        ))}
      </div>
    </div>
  );
}

const FREQ: readonly DiscrepancyFrequency[] = ["Rarely", "Occasionally", "Frequently"];
const CREDIT: readonly CreditNoteProcess[] = ["Yes", "Ad Hoc", "No"];
const RECON: readonly ReconciliationMode[] = ["Manual", "Partially Automated", "Fully Automated"];
const SYSTEMS: readonly SystemCount[] = ["1", "2", "3+"];

export function AssumptionsPanel({ value, onChange }: Props) {
  const set = <K extends keyof Assumptions>(key: K, v: Assumptions[K]) => onChange({ ...value, [key]: v });
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_ASSUMPTIONS);

  return (
    <details className="group border border-border-faint bg-card rounded-none">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-4 select-none">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/85">Working assumptions</div>
          <div className="text-xs text-label mt-1 normal-case tracking-normal">
            {isDefault ? "Defaults in use. Open to see and edit every number the model relies on." : "Edited. Results use your values."}
          </div>
        </div>
        <span className="text-primary text-sm transition-transform group-open:rotate-90" aria-hidden="true">
          ▸
        </span>
      </summary>

      <div className="px-4 pb-5 pt-1 space-y-5 border-t border-border-faint">
        <p className="pt-3 text-xs text-label-low leading-relaxed">
          These are Rev-Sync's own working assumptions, chosen to be conservative and easy to challenge. They are not
          sourced industry benchmarks. Replace them with your own numbers when you have them.
        </p>

        <Row label="Uninvoiced deals never billed or collected" unit="%">
          <Num value={value.uninvoicedNeverRecoveredPct} max={100} ariaLabel="Uninvoiced deals never recovered" onChange={(n) => set("uninvoicedNeverRecoveredPct", n)} />
        </Row>
        <Group title="Invoices with an amount mismatch, by answer" unit="% of invoices" keys={FREQ} values={value.discrepancyRatePct} max={100} onChange={(v) => set("discrepancyRatePct", v)} />
        <Row label="Net value lost on a mismatched invoice" unit="% of invoice">
          <Num value={value.discrepancyNetLossPct} max={100} ariaLabel="Net loss on mismatched invoice" onChange={(n) => set("discrepancyNetLossPct", n)} />
        </Row>
        <Group title="ARR written down via informal credit notes, by answer" unit="% of ARR" keys={CREDIT} values={value.creditNoteWriteDownPct} max={100} onChange={(v) => set("creditNoteWriteDownPct", v)} />
        <Row label="Revenue lost on a record with bad billing data" unit="% of its revenue">
          <Num value={value.dataQualityImpactPct} max={100} ariaLabel="Impact of a bad CRM record" onChange={(n) => set("dataQualityImpactPct", n)} />
        </Row>
        <Row label="Cost of capital on cash collected late" unit="% / year">
          <Num value={value.costOfCapitalPct} max={100} ariaLabel="Cost of capital" onChange={(n) => set("costOfCapitalPct", n)} />
        </Row>
        <Group title="Reconciliation effort, by answer" unit="min / account / month" keys={RECON} values={value.reconMinutesPerAccount} onChange={(v) => set("reconMinutesPerAccount", v)} />
        <Group title="Systems factor on reconciliation and data quality" unit="×" keys={SYSTEMS} values={value.systemsMultiplier} onChange={(v) => set("systemsMultiplier", v)} />
        <Row label="Loaded cost of one Finance / RevOps hour" unit="€">
          <Num value={value.hourlyCost} ariaLabel="Hourly cost" onChange={(n) => set("hourlyCost", n)} />
        </Row>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_ASSUMPTIONS)}
          disabled={isDefault}
          className="text-xs uppercase tracking-[0.2em] px-3 py-2 border border-rule rounded-none text-label-mid hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Reset to defaults
        </button>
      </div>
    </details>
  );
}
