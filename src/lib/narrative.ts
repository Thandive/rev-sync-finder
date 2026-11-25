import { PipelineInputs, PipelineResults, ruleBasedNarrative } from "./pipeline";
import { Currency, DEFAULT_CURRENCY } from "./currency";

export type NarrativeSource = "ai" | "rules";

export interface NarrativeResult {
  text: string;
  source: NarrativeSource;
  /** Why the rule-based version was used, if it was. */
  reason?: string;
}

/** Numbers only — this is everything that leaves the browser when the user asks for the AI narrative. */
export function toPayload(input: PipelineInputs, r: PipelineResults, currency: Currency = DEFAULT_CURRENCY) {
  return {
    currency,
    status: r.status,
    quarterTarget: r.quarterTarget,
    closedWon: Math.max(input.closedWon || 0, 0),
    remainingTarget: r.remainingTarget,
    daysRemaining: r.daysRemaining,
    totalPipeline: r.totalPipeline,
    weightedPipeline: r.weightedPipeline,
    inQuarterPipeline: r.inQuarterPipeline,
    coverage: r.coverage,
    gap: r.gap,
    dealsNeeded: r.dealsNeeded,
    avgDealSize: Math.max(input.avgDealSize || 0, 0),
    stages: r.stages.map((s) => ({
      id: s.id,
      value: s.value,
      winRate: s.winRate,
      cycleDays: s.cycleDays,
      weighted: s.weighted,
      inQuarter: s.inQuarter,
    })),
  };
}

/**
 * Ask the serverless function for an AI narrative. Never throws: any failure returns
 * the rule-based narrative, labelled as such, so the button always produces something honest.
 */
export async function requestNarrative(
  input: PipelineInputs,
  r: PipelineResults,
  currency: Currency = DEFAULT_CURRENCY,
  fetchImpl: typeof fetch = fetch,
): Promise<NarrativeResult> {
  const fallback = (reason: string): NarrativeResult => ({
    text: ruleBasedNarrative(input, r, currency),
    source: "rules",
    reason,
  });
  try {
    const res = await fetchImpl("/api/narrative", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toPayload(input, r, currency)),
    });
    if (!res.ok) {
      const reason = res.status === 429 ? "rate limit reached" : res.status === 503 ? "AI not configured" : "AI service unavailable";
      return fallback(reason);
    }
    const data = (await res.json()) as { text?: unknown };
    if (typeof data.text !== "string" || !data.text.trim()) return fallback("empty AI response");
    return { text: data.text.trim(), source: "ai" };
  } catch {
    return fallback("AI service unreachable");
  }
}
