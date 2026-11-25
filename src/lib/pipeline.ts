// Rev-Sync — Pipeline coverage model.
// Pure functions, so the same logic is easy to test and to reason about.

import { Currency, DEFAULT_CURRENCY, formatMoney } from "./currency";

export type StageId = "discovery" | "qualified" | "proposal" | "negotiation" | "commit";

export interface StageInput {
  id: StageId;
  /** Open pipeline value in this stage. */
  value: number;
  /** Probability a deal in this stage closes-won, %. */
  winRate: number;
  /** Average days from this stage to close. */
  cycleDays: number;
}

export interface PipelineInputs {
  /** Annual new-business quota. */
  annualQuota: number;
  /** Average deal size. */
  avgDealSize: number;
  /** % of the quarter already elapsed. */
  quarterProgress: number;
  /** Closed-won this quarter so far. */
  closedWon: number;
  stages: StageInput[];
}

export type CoverageStatus = "TARGET MET" | "ON TRACK" | "AT RISK" | "BEHIND" | "CRITICAL";

export interface StageResult extends StageInput {
  label: string;
  weighted: number;
  /** Share of this stage expected to close inside the quarter, given days remaining (0–1). */
  timeFactor: number;
  /** Weighted value expected to close this quarter. */
  inQuarter: number;
  /** Weighted value expected to win, but not before quarter end (cycle longer than time left). */
  slip: number;
}

export interface PipelineResults {
  quarterTarget: number;
  remainingTarget: number;
  daysRemaining: number;
  totalPipeline: number;
  weightedPipeline: number;
  /** Weighted pipeline expected to close before quarter end. */
  inQuarterPipeline: number;
  /** inQuarterPipeline / remainingTarget. */
  coverage: number;
  /** totalPipeline / remainingTarget — the classic "3× coverage" view. */
  rawCoverage: number;
  gap: number;
  dealsNeeded: number;
  status: CoverageStatus;
  stages: StageResult[];
  /** Stage with the most weighted pipeline slipping past quarter end; null when nothing slips. */
  biggestSlip: StageResult | null;
  /** Weighted pipeline expected to win but after quarter end. */
  totalSlip: number;
}

export const QUARTER_DAYS = 91;

export const STAGE_LABELS: Record<StageId, string> = {
  discovery: "Discovery",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  commit: "Commit",
};

export const STAGE_ORDER: StageId[] = ["discovery", "qualified", "proposal", "negotiation", "commit"];

/** Sample data so the page tells a story on first load. Win rates rise stage by stage; cycles shorten. */
export const SAMPLE_PIPELINE: PipelineInputs = {
  annualQuota: 2_400_000,
  avgDealSize: 20_000,
  quarterProgress: 45,
  closedWon: 120_000,
  stages: [
    { id: "discovery", value: 800_000, winRate: 10, cycleDays: 80 },
    { id: "qualified", value: 450_000, winRate: 20, cycleDays: 60 },
    { id: "proposal", value: 300_000, winRate: 40, cycleDays: 35 },
    { id: "negotiation", value: 180_000, winRate: 60, cycleDays: 20 },
    { id: "commit", value: 100_000, winRate: 85, cycleDays: 10 },
  ],
};

const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(safe(n), lo), hi);

export function statusFor(coverage: number, remainingTarget: number): CoverageStatus {
  if (remainingTarget <= 0) return "TARGET MET";
  if (coverage >= 1) return "ON TRACK";
  if (coverage >= 0.8) return "AT RISK";
  if (coverage >= 0.5) return "BEHIND";
  return "CRITICAL";
}

export function analysePipeline(input: PipelineInputs): PipelineResults {
  const quarterTarget = safe(input.annualQuota) / 4;
  const remainingTarget = Math.max(quarterTarget - safe(input.closedWon), 0);
  const progress = clamp(input.quarterProgress, 0, 100);
  const daysRemaining = QUARTER_DAYS * (1 - progress / 100);

  const stages: StageResult[] = input.stages.map((s) => {
    const value = safe(s.value);
    const winRate = clamp(s.winRate, 0, 100);
    const cycleDays = Math.max(safe(s.cycleDays), 1);
    const weighted = value * (winRate / 100);
    // Deals whose typical path to close is longer than the time left only partly land this quarter.
    const timeFactor = Math.min(daysRemaining / cycleDays, 1);
    const inQuarter = weighted * timeFactor;
    return {
      ...s,
      value,
      winRate,
      cycleDays,
      label: STAGE_LABELS[s.id] ?? s.id,
      weighted,
      timeFactor,
      inQuarter,
      slip: weighted - inQuarter,
    };
  });

  const totalPipeline = stages.reduce((a, s) => a + s.value, 0);
  const weightedPipeline = stages.reduce((a, s) => a + s.weighted, 0);
  const inQuarterPipeline = stages.reduce((a, s) => a + s.inQuarter, 0);
  const coverage = remainingTarget > 0 ? inQuarterPipeline / remainingTarget : 0;
  const rawCoverage = remainingTarget > 0 ? totalPipeline / remainingTarget : 0;
  const gap = Math.max(remainingTarget - inQuarterPipeline, 0);
  const avg = safe(input.avgDealSize);
  const dealsNeeded = avg > 0 ? Math.ceil(gap / avg) : 0;

  const slipping = stages.filter((s) => s.slip > 0.5);
  const biggestSlip = slipping.length ? slipping.reduce((a, b) => (b.slip > a.slip ? b : a)) : null;
  const totalSlip = stages.reduce((a, s) => a + s.slip, 0);

  return {
    quarterTarget,
    remainingTarget,
    daysRemaining,
    totalPipeline,
    weightedPipeline,
    inQuarterPipeline,
    coverage,
    rawCoverage,
    gap,
    dealsNeeded,
    status: statusFor(coverage, remainingTarget),
    stages,
    biggestSlip,
    totalSlip,
  };
}

/** Compact amount for the pipeline view: $1.83M, $480K. */
export function fmtMoney(n: number, currency: Currency = DEFAULT_CURRENCY): string {
  return formatMoney(n, currency, 0);
}

/** Rule-based narrative: always available, used when the AI narrative is not. */
export function ruleBasedNarrative(
  input: PipelineInputs,
  r: PipelineResults,
  currency: Currency = DEFAULT_CURRENCY,
): string {
  const money = (n: number) => fmtMoney(n, currency);
  const pctCov = Math.round(r.coverage * 100);
  const days = Math.round(r.daysRemaining);
  if (r.status === "TARGET MET") {
    return `The quarter target of ${money(r.quarterTarget)} is already closed-won with ${days} days to go. Everything still in pipeline is upside, so the priority is protecting next quarter: keep ${money(r.totalPipeline)} of open pipeline moving rather than pulling deals forward.`;
  }
  const lead =
    r.status === "ON TRACK"
      ? `We are on track: ${money(r.inQuarterPipeline)} of weighted pipeline can realistically close in the ${days} days left, ${pctCov}% of the ${money(r.remainingTarget)} still needed.`
      : `We are ${r.status === "AT RISK" ? "at risk" : r.status === "BEHIND" ? "behind" : "critically short"}: only ${money(r.inQuarterPipeline)} of weighted pipeline can realistically close in the ${days} days left, ${pctCov}% of the ${money(r.remainingTarget)} still needed.`;
  const gap = r.gap > 0 ? ` The gap is ${money(r.gap)}, about ${r.dealsNeeded} deal${r.dealsNeeded === 1 ? "" : "s"} at ${money(input.avgDealSize)}.` : "";
  const risk = r.biggestSlip
    ? ` Timing is the main risk in ${r.biggestSlip.label}: ${money(r.biggestSlip.slip)} of weighted pipeline there is likely to close after quarter end, because its ${r.biggestSlip.cycleDays}-day cycle is longer than the ${days} days left.`
    : ` Timing is not the constraint: every stage's typical cycle fits inside the ${days} days left.`;
  // Where the in-quarter number actually sits: the late stage with the most value expected to close.
  const anchor = r.stages
    .filter((s) => s.id === "proposal" || s.id === "negotiation" || s.id === "commit")
    .filter((s) => s.inQuarter > 0)
    .sort((a, b) => b.inQuarter - a.inQuarter)[0];
  const window = days >= 14 ? "the next two weeks" : "the remaining days";
  const action = anchor
    ? r.status === "ON TRACK"
      ? ` Recommendation: protect the ${money(anchor.inQuarter)} expected from ${anchor.label} with weekly deal reviews, and do not discount to pull later deals forward.`
      : ` Recommendation: spend ${window} on ${anchor.label}, where ${money(anchor.inQuarter)} of this quarter's number sits, and qualify out stalled early-stage deals so the forecast only counts what can close.`
    : ` Recommendation: there is no late-stage pipeline to close this quarter, so reset the forecast now and focus on building ${money(r.gap)} of qualified pipeline for next quarter.`;
  return lead + gap + risk + action;
}
