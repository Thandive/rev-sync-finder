// Rev-Sync — Revenue Leakage model.
//
// Pure functions only: no React, no DOM, no side effects. Every number the UI shows
// comes from `calculate()`, so there is exactly one total and it always equals the
// sum of its categories.
//
// Every assumption the model relies on lives in `Assumptions` and is editable in the UI.
// They are working assumptions chosen to be conservative and easy to challenge,
// not sourced industry benchmarks. Amounts are in whatever currency the user works in.

import { Currency, DEFAULT_CURRENCY, formatMoney, formatMoneyExact } from "./currency";

export type ReconciliationMode = "Manual" | "Partially Automated" | "Fully Automated";
export type DiscrepancyFrequency = "Rarely" | "Occasionally" | "Frequently";
export type CreditNoteProcess = "Yes" | "Ad Hoc" | "No";
export type SystemCount = "1" | "2" | "3+";
export type RiskScore = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CalculatorInputs {
  /** Annual recurring revenue. */
  arr: number;
  /** New deals closed per month. */
  dealsPerMonth: number;
  /** Average contract value of a new deal, per year. */
  acv: number;
  /** Days from deal close (or service start) to invoice raised. */
  delayDays: number;
  /** % of closed deals still without an invoice 60 days after they should have been billed. */
  uninvoicedPct: number;
  reconciliation: ReconciliationMode;
  discrepancyFreq: DiscrepancyFrequency;
  /** % of CRM records with missing or inconsistent billing data. */
  dirtyDataPct: number;
  creditNoteProcess: CreditNoteProcess;
  systems: SystemCount;
}

export interface Assumptions {
  /** Annual cost of capital applied to cash tied up by late invoicing, %. */
  costOfCapitalPct: number;
  /** Share of deals still uninvoiced at 60 days that are never billed or collected, %. */
  uninvoicedNeverRecoveredPct: number;
  /** Share of invoices with an amount mismatch, per answer bucket, %. Midpoints of the answer labels. */
  discrepancyRatePct: Record<DiscrepancyFrequency, number>;
  /** Net value lost on a mismatched invoice (under-billing not caught, minus over-billing credited back), % of invoice. */
  discrepancyNetLossPct: number;
  /** Revenue lost on a record with bad billing data (wrong price, missed uplift, late renewal), % of that record's revenue. */
  dataQualityImpactPct: number;
  /** ARR written down each year through informal credit notes and amendments, %. */
  creditNoteWriteDownPct: Record<CreditNoteProcess, number>;
  /** Reconciliation effort per customer account per month, minutes. */
  reconMinutesPerAccount: Record<ReconciliationMode, number>;
  /** Fully loaded cost of one hour of Finance / RevOps time. */
  hourlyCost: number;
  /** How much the number of revenue systems scales reconciliation effort and data-quality impact. */
  systemsMultiplier: Record<SystemCount, number>;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  costOfCapitalPct: 8,
  uninvoicedNeverRecoveredPct: 15,
  discrepancyRatePct: { Rarely: 1, Occasionally: 6, Frequently: 15 },
  discrepancyNetLossPct: 5,
  dataQualityImpactPct: 1.5,
  creditNoteWriteDownPct: { Yes: 0.05, "Ad Hoc": 0.15, No: 0.4 },
  reconMinutesPerAccount: { Manual: 6, "Partially Automated": 3, "Fully Automated": 0.5 },
  hourlyCost: 40,
  systemsMultiplier: { "1": 0.5, "2": 1, "3+": 1.75 },
};

export const DEFAULT_INPUTS: CalculatorInputs = {
  arr: 5_000_000,
  dealsPerMonth: 10,
  acv: 20_000,
  delayDays: 15,
  uninvoicedPct: 5,
  reconciliation: "Partially Automated",
  discrepancyFreq: "Occasionally",
  dirtyDataPct: 10,
  creditNoteProcess: "Ad Hoc",
  systems: "2",
};

export type LeakageCategoryKey =
  | "uninvoiced"
  | "discrepancies"
  | "creditNotes"
  | "dataQuality"
  | "billingDelay"
  | "manualProcess";

/** Revenue that is never billed or never kept. */
export const REVENUE_CATEGORIES: LeakageCategoryKey[] = ["uninvoiced", "discrepancies", "creditNotes", "dataQuality"];
/** Money spent or tied up to run the process. */
export const COST_CATEGORIES: LeakageCategoryKey[] = ["billingDelay", "manualProcess"];
export const ALL_CATEGORIES: LeakageCategoryKey[] = [...REVENUE_CATEGORIES, ...COST_CATEGORIES];

export interface CategoryResult {
  key: LeakageCategoryKey;
  value: number;
  /** Plain-language formula with the actual numbers, shown under each bar. */
  explain: string;
}

export interface CalculatorResults {
  categories: Record<LeakageCategoryKey, number>;
  explanations: Record<LeakageCategoryKey, string>;
  /** Annual value of new contracts: deals / month × 12 × ACV. */
  newBookings: number;
  /** Approximate number of customer accounts billed: ARR / ACV. */
  accounts: number;
  revenueLeakage: number;
  costToOperate: number;
  /** The one total. Always equals revenueLeakage + costToOperate. */
  totalExposure: number;
  /** totalExposure / ARR. */
  exposureRatio: number;
  riskScore: RiskScore;
  topCategory: LeakageCategoryKey;
}

/** Risk bands on total exposure as a share of ARR. Rev-Sync's own bands, not an external standard. */
export const RISK_BANDS: { score: RiskScore; minRatio: number }[] = [
  { score: "CRITICAL", minRatio: 0.06 },
  { score: "HIGH", minRatio: 0.03 },
  { score: "MEDIUM", minRatio: 0.01 },
  { score: "LOW", minRatio: 0 },
];

export function scoreFor(ratio: number): RiskScore {
  for (const band of RISK_BANDS) {
    if (ratio >= band.minRatio) return band.score;
  }
  return "LOW";
}

const pct = (n: number) => n / 100;

/** Clamp to a finite, non-negative number. Keeps the model total-safe against blank or bad input. */
export function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function calculate(
  inputs: CalculatorInputs,
  assumptions: Assumptions = DEFAULT_ASSUMPTIONS,
  currency: Currency = DEFAULT_CURRENCY,
): CalculatorResults {
  const arr = safe(inputs.arr);
  const dealsPerMonth = safe(inputs.dealsPerMonth);
  const acv = safe(inputs.acv);
  const delayDays = safe(inputs.delayDays);
  const uninvoicedPct = safe(inputs.uninvoicedPct);
  const dirtyDataPct = safe(inputs.dirtyDataPct);
  const a = assumptions;

  const newBookings = dealsPerMonth * 12 * acv;
  const accounts = acv > 0 ? arr / acv : 0;
  const systemsFactor = safe(a.systemsMultiplier[inputs.systems]);

  // 1. Uninvoiced deals — only the share never recovered is lost revenue.
  const uninvoiced =
    newBookings * pct(uninvoicedPct) * pct(safe(a.uninvoicedNeverRecoveredPct));

  // 2. Invoice discrepancies — every recurring invoice can be wrong, so the base is ARR.
  const discrepancyRate = safe(a.discrepancyRatePct[inputs.discrepancyFreq]);
  const discrepancies = arr * pct(discrepancyRate) * pct(safe(a.discrepancyNetLossPct));

  // 3. Credit notes and amendments handled informally.
  const creditRate = safe(a.creditNoteWriteDownPct[inputs.creditNoteProcess]);
  const creditNotes = arr * pct(creditRate);

  // 4. Data quality — more systems, more places for the record to diverge.
  const dataQuality = arr * pct(dirtyDataPct) * pct(safe(a.dataQualityImpactPct)) * systemsFactor;

  // 5. Billing delay — financing cost of cash collected later than it should be.
  const cashTiedUp = newBookings * (delayDays / 365);
  const billingDelay = cashTiedUp * pct(safe(a.costOfCapitalPct));

  // 6. Manual reconciliation — effort scales with accounts and with systems to reconcile.
  const reconMinutes = safe(a.reconMinutesPerAccount[inputs.reconciliation]);
  const reconHours = accounts * 12 * (reconMinutes / 60) * systemsFactor;
  const manualProcess = reconHours * safe(a.hourlyCost);

  const categories: Record<LeakageCategoryKey, number> = {
    uninvoiced,
    discrepancies,
    creditNotes,
    dataQuality,
    billingDelay,
    manualProcess,
  };

  const e = (n: number) => formatMoney(n, currency);
  const explanations: Record<LeakageCategoryKey, string> = {
    uninvoiced: `${e(newBookings)} new bookings × ${fmtPct(uninvoicedPct)} uninvoiced × ${fmtPct(a.uninvoicedNeverRecoveredPct)} never recovered`,
    discrepancies: `${e(arr)} ARR × ${fmtPct(discrepancyRate)} invoices mismatched × ${fmtPct(a.discrepancyNetLossPct)} net loss`,
    creditNotes: `${e(arr)} ARR × ${fmtPct(creditRate)} written down via informal credit notes`,
    dataQuality: `${e(arr)} ARR × ${fmtPct(dirtyDataPct)} bad records × ${fmtPct(a.dataQualityImpactPct)} impact × ${systemsFactor} (systems)`,
    billingDelay: `${e(cashTiedUp)} cash tied up (${delayDays} days of new bookings) × ${fmtPct(a.costOfCapitalPct)} cost of capital`,
    manualProcess: `${Math.round(accounts)} accounts × 12 × ${reconMinutes} min × ${systemsFactor} (systems) = ${Math.round(reconHours)} h × ${e(a.hourlyCost)}/h`,
  };

  const revenueLeakage = REVENUE_CATEGORIES.reduce((s, k) => s + categories[k], 0);
  const costToOperate = COST_CATEGORIES.reduce((s, k) => s + categories[k], 0);
  const totalExposure = revenueLeakage + costToOperate;
  const exposureRatio = arr > 0 ? totalExposure / arr : 0;

  const topCategory = ALL_CATEGORIES.reduce(
    (best, k) => (categories[k] > categories[best] ? k : best),
    ALL_CATEGORIES[0],
  );

  return {
    categories,
    explanations,
    newBookings,
    accounts,
    revenueLeakage,
    costToOperate,
    totalExposure,
    exposureRatio,
    riskScore: scoreFor(exposureRatio),
    topCategory,
  };
}

/** 6 → "6%", 1.5 → "1.5%", 0.05 → "0.05%". */
export function fmtPct(n: number): string {
  return `${parseFloat(safe(n).toFixed(2))}%`;
}

export { formatMoney, formatMoneyExact };

// Log-scale slider helpers — ARR 100K to 50M
export const ARR_MIN = 100_000;
export const ARR_MAX = 50_000_000;

export function sliderToArr(v: number): number {
  const minLog = Math.log10(ARR_MIN);
  const maxLog = Math.log10(ARR_MAX);
  return Math.pow(10, minLog + (v / 100) * (maxLog - minLog));
}

export function arrToSlider(arr: number): number {
  const minLog = Math.log10(ARR_MIN);
  const maxLog = Math.log10(ARR_MAX);
  const clamped = Math.min(Math.max(arr, ARR_MIN), ARR_MAX);
  return ((Math.log10(clamped) - minLog) / (maxLog - minLog)) * 100;
}

export const CATEGORY_LABELS: Record<LeakageCategoryKey, string> = {
  uninvoiced: "Uninvoiced deals",
  discrepancies: "Invoice discrepancies",
  creditNotes: "Informal credit notes",
  dataQuality: "CRM data quality",
  billingDelay: "Billing delay (cost of cash)",
  manualProcess: "Manual reconciliation",
};

export const RECOMMENDATIONS: Record<LeakageCategoryKey, string> = {
  uninvoiced:
    "Add a closed-won to invoice handover check: a daily exception report of closed deals with no billing account or invoice, owned by one named person.",
  discrepancies:
    "Reconcile contracted vs. invoiced amounts before each billing run, so price and quantity mismatches are caught before the customer sees them.",
  creditNotes:
    "Document the credit note and amendment process with an approval step and a reason code, so every write-down is visible and reportable.",
  dataQuality:
    "Make billing-critical CRM fields required at closed-won and run a scheduled hygiene report, so invoices are raised from accurate customer and price data.",
  billingDelay:
    "Trigger invoicing from the closed-won (or service start) event instead of a manual request, and track days-to-invoice as a KPI.",
  manualProcess:
    "Replace full manual reconciliation with a scheduled CRM-to-billing sync and exception-based review, so people only look at records that disagree.",
};

export const SCORE_MEANING: Record<RiskScore, string> = {
  LOW: "Leakage is small relative to ARR. Keep the controls you have and monitor the largest category.",
  MEDIUM: "Recoverable leakage. It is meaningful but concentrated, so one or two fixes would move the number.",
  HIGH: "Material leakage. The pattern points to gaps in the process, not one-off errors.",
  CRITICAL: "Severe leakage. Several controls are missing at once, and the cost repeats every billing cycle.",
};

export function buildSummary(results: CalculatorResults, currency: Currency = DEFAULT_CURRENCY): string {
  const top = results.topCategory;
  return `${SCORE_MEANING[results.riskScore]} The largest category is ${CATEGORY_LABELS[top].toLowerCase()} at ${formatMoney(
    results.categories[top],
    currency,
  )} a year. ${RECOMMENDATIONS[top]}`;
}
