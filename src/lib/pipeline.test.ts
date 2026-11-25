import { describe, expect, it } from "vitest";
import { analysePipeline, PipelineInputs, ruleBasedNarrative, SAMPLE_PIPELINE, statusFor, QUARTER_DAYS } from "./pipeline";

const sample = SAMPLE_PIPELINE;

describe("analysePipeline — sample data", () => {
  const r = analysePipeline(sample);

  it("derives the quarter target and what is still needed", () => {
    expect(r.quarterTarget).toBe(600_000);
    expect(r.remainingTarget).toBe(480_000);
    expect(r.daysRemaining).toBeCloseTo(QUARTER_DAYS * 0.55, 6);
  });

  it("weights each stage by win rate and by time left", () => {
    const discovery = r.stages.find((s) => s.id === "discovery")!;
    expect(discovery.weighted).toBeCloseTo(80_000, 6);
    expect(discovery.timeFactor).toBeCloseTo(r.daysRemaining / 80, 6);
    const proposal = r.stages.find((s) => s.id === "proposal")!;
    expect(proposal.timeFactor).toBe(1); // 35-day cycle fits in ~50 days
    expect(proposal.inQuarter).toBeCloseTo(120_000, 6);
  });

  it("totals are consistent", () => {
    expect(r.totalPipeline).toBe(1_830_000);
    expect(r.weightedPipeline).toBeCloseTo(483_000, 6);
    expect(r.inQuarterPipeline).toBeLessThanOrEqual(r.weightedPipeline);
    expect(r.totalSlip).toBeCloseTo(r.weightedPipeline - r.inQuarterPipeline, 6);
    expect(r.coverage).toBeCloseTo(r.inQuarterPipeline / r.remainingTarget, 10);
    expect(r.gap).toBeCloseTo(r.remainingTarget - r.inQuarterPipeline, 6);
  });

  it("tells a non-trivial story: at risk, a small gap, discovery slipping", () => {
    expect(r.status).toBe("AT RISK");
    expect(r.dealsNeeded).toBe(Math.ceil(r.gap / 20_000));
    expect(r.biggestSlip?.id).toBe("discovery");
  });

  it("sample win rates rise and cycles shorten stage by stage", () => {
    for (let i = 1; i < sample.stages.length; i++) {
      expect(sample.stages[i].winRate).toBeGreaterThan(sample.stages[i - 1].winRate);
      expect(sample.stages[i].cycleDays).toBeLessThan(sample.stages[i - 1].cycleDays);
    }
  });
});

describe("analysePipeline — edge cases", () => {
  it("target already met", () => {
    const r = analysePipeline({ ...sample, closedWon: 700_000 });
    expect(r.remainingTarget).toBe(0);
    expect(r.status).toBe("TARGET MET");
    expect(r.gap).toBe(0);
    expect(r.dealsNeeded).toBe(0);
  });

  it("empty pipeline is critical and safe", () => {
    const empty: PipelineInputs = { ...sample, closedWon: 0, stages: sample.stages.map((s) => ({ ...s, value: 0 })) };
    const r = analysePipeline(empty);
    expect(r.status).toBe("CRITICAL");
    expect(r.biggestSlip).toBeNull();
    expect(r.dealsNeeded).toBe(Math.ceil(600_000 / 20_000));
  });

  it("end of quarter: nothing more can close", () => {
    const r = analysePipeline({ ...sample, quarterProgress: 100 });
    expect(r.daysRemaining).toBe(0);
    expect(r.inQuarterPipeline).toBe(0);
  });

  it("start of quarter: everything with a cycle under 91 days counts fully", () => {
    const r = analysePipeline({ ...sample, quarterProgress: 0 });
    expect(r.inQuarterPipeline).toBeCloseTo(r.weightedPipeline, 6);
    expect(r.biggestSlip).toBeNull();
  });

  it("ignores invalid numbers", () => {
    const r = analysePipeline({ ...sample, annualQuota: NaN, avgDealSize: -1, stages: [{ id: "proposal", value: NaN, winRate: 500, cycleDays: 0 }] });
    expect(Number.isFinite(r.coverage)).toBe(true);
    expect(r.quarterTarget).toBe(0);
    expect(r.dealsNeeded).toBe(0);
  });

  it.each([
    [1.2, 100, "ON TRACK"],
    [0.85, 100, "AT RISK"],
    [0.6, 100, "BEHIND"],
    [0.2, 100, "CRITICAL"],
    [0, 0, "TARGET MET"],
  ])("status for coverage %f", (coverage, remaining, status) => {
    expect(statusFor(coverage, remaining)).toBe(status);
  });
});

describe("ruleBasedNarrative", () => {
  it("states the status, the gap and one recommendation", () => {
    const text = ruleBasedNarrative(sample, analysePipeline(sample));
    expect(text).toMatch(/^We are at risk/);
    expect(text).toContain("The gap is");
    expect(text).toContain("Discovery");
    expect(text.match(/Recommendation:/g)).toHaveLength(1);
  });

  it("handles target met", () => {
    const input = { ...sample, closedWon: 700_000 };
    expect(ruleBasedNarrative(input, analysePipeline(input))).toContain("already closed-won");
  });
});
