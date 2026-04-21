// Rev-Sync revenue leakage calculations.
// All inputs validated; pure functions only — no side effects.

export type ReconciliationMode = "Manual" | "Partially Automated" | "Fully Automated";
export type DiscrepancyFrequency = "Rarely" | "Occasionally" | "Frequently";
export type CreditNoteProcess = "Yes" | "Ad Hoc" | "No";
export type SystemCount = "1" | "2" | "3+";

export interface CalculatorInputs {
  arr: number;
  dealsPerMonth: number;
  acv: number;
  delayDays: number;
  uninvoicedPct: number;
  reconciliation: ReconciliationMode;
  discrepancyFreq: DiscrepancyFrequency;
  dirtyDataPct: number;
  creditNoteProcess: CreditNoteProcess;
  systems: SystemCount;
}

export interface CalculatorResults {
  billingDelayLeakage: number;
  uninvoicedLeakage: number;
  discrepancyLeakage: number;
  dataQualityLeakage: number;
  manualReconciliationCost: number;
  annualRevenueLeakage: number;
  cashFlowImpact: number;
  operationalCost: number;
  totalAtRisk: number;
  riskRatio: number;
  riskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function calculate(inputs: CalculatorInputs): CalculatorResults {
  const { arr, dealsPerMonth, acv, delayDays, uninvoicedPct, reconciliation, discrepancyFreq, dirtyDataPct } = inputs;

  const billingDelayLeakage = dealsPerMonth * acv * (delayDays / 365) * 0.08;
  const uninvoicedLeakage = dealsPerMonth * 12 * acv * (uninvoicedPct / 100);

  let discrepancyLeakage = 0;
  if (discrepancyFreq === "Rarely") discrepancyLeakage = dealsPerMonth * 12 * acv * 0.03 * 0.05;
  else if (discrepancyFreq === "Occasionally") discrepancyLeakage = dealsPerMonth * 12 * acv * 0.08 * 0.08;
  else if (discrepancyFreq === "Frequently") discrepancyLeakage = dealsPerMonth * 12 * acv * 0.15 * 0.10;

  const dataQualityLeakage = arr * (dirtyDataPct / 100) * 0.015;

  let manualReconciliationCost = 0;
  if (reconciliation === "Manual") manualReconciliationCost = 8 * 52 * 35;
  else if (reconciliation === "Partially Automated") manualReconciliationCost = 4 * 52 * 35;

  const annualRevenueLeakage = billingDelayLeakage + uninvoicedLeakage + discrepancyLeakage;
  const cashFlowImpact = billingDelayLeakage;
  const operationalCost = manualReconciliationCost + dataQualityLeakage;
  const totalAtRisk = annualRevenueLeakage + operationalCost;

  const riskRatio = arr > 0 ? totalAtRisk / arr : 0;
  let riskScore: CalculatorResults["riskScore"] = "LOW";
  if (riskRatio >= 0.10) riskScore = "CRITICAL";
  else if (riskRatio >= 0.05) riskScore = "HIGH";
  else if (riskRatio >= 0.02) riskScore = "MEDIUM";

  return {
    billingDelayLeakage,
    uninvoicedLeakage,
    discrepancyLeakage,
    dataQualityLeakage,
    manualReconciliationCost,
    annualRevenueLeakage,
    cashFlowImpact,
    operationalCost,
    totalAtRisk,
    riskRatio,
    riskScore,
  };
}

export function formatEUR(n: number): string {
  if (!isFinite(n)) return "€0";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}K`;
  return `€${Math.round(n).toLocaleString("en-US")}`;
}

export function formatEURExact(n: number): string {
  return `€${Math.round(n).toLocaleString("en-US")}`;
}

// Log slider helpers — ARR €100K to €50M
export const ARR_MIN = 100_000;
export const ARR_MAX = 50_000_000;

export function sliderToArr(v: number): number {
  // v in [0, 100]
  const minLog = Math.log10(ARR_MIN);
  const maxLog = Math.log10(ARR_MAX);
  const log = minLog + (v / 100) * (maxLog - minLog);
  return Math.pow(10, log);
}

export function arrToSlider(arr: number): number {
  const minLog = Math.log10(ARR_MIN);
  const maxLog = Math.log10(ARR_MAX);
  return ((Math.log10(arr) - minLog) / (maxLog - minLog)) * 100;
}
