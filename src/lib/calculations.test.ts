import { describe, expect, it } from "vitest";
import {
  ALL_CATEGORIES,
  Assumptions,
  calculate,
  CalculatorInputs,
  COST_CATEGORIES,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INPUTS,
  REVENUE_CATEGORIES,
  arrToSlider,
  buildSummary,
  formatMoney,
  formatMoneyExact,
  scoreFor,
  sliderToArr,
} from "./calculations";

const base: CalculatorInputs = { ...DEFAULT_INPUTS };
const sum = (r: ReturnType<typeof calculate>, keys = ALL_CATEGORIES) =>
  keys.reduce((s, k) => s + r.categories[k], 0);

describe("calculate — one consistent total", () => {
  it("total equals the sum of every category and of the two subtotals", () => {
    const r = calculate(base);
    expect(r.totalExposure).toBeCloseTo(sum(r), 6);
    expect(r.revenueLeakage).toBeCloseTo(sum(r, REVENUE_CATEGORIES), 6);
    expect(r.costToOperate).toBeCloseTo(sum(r, COST_CATEGORIES), 6);
    expect(r.totalExposure).toBeCloseTo(r.revenueLeakage + r.costToOperate, 6);
  });

  it("exposure ratio is total / ARR", () => {
    const r = calculate(base);
    expect(r.exposureRatio).toBeCloseTo(r.totalExposure / base.arr, 10);
  });

  it("default inputs give the documented figures", () => {
    const r = calculate(base);
    // 10 deals × 12 × €20K = €2.4M new bookings; €5M / €20K = 250 accounts
    expect(r.newBookings).toBe(2_400_000);
    expect(r.accounts).toBe(250);
    expect(r.categories.uninvoiced).toBeCloseTo(2_400_000 * 0.05 * 0.15, 6); // 18,000
    expect(r.categories.discrepancies).toBeCloseTo(5_000_000 * 0.06 * 0.05, 6); // 15,000
    expect(r.categories.creditNotes).toBeCloseTo(5_000_000 * 0.0015, 6); // 7,500
    expect(r.categories.dataQuality).toBeCloseTo(5_000_000 * 0.1 * 0.015 * 1, 6); // 7,500
    expect(r.categories.billingDelay).toBeCloseTo(2_400_000 * (15 / 365) * 0.08, 6); // ≈ 7,890
    expect(r.categories.manualProcess).toBeCloseTo(250 * 12 * (3 / 60) * 1 * 40, 6); // 6,000
    expect(Math.round(r.totalExposure)).toBe(61_890);
    expect(r.riskScore).toBe("MEDIUM");
    expect(r.topCategory).toBe("uninvoiced");
  });
});

describe("calculate — every one of the ten inputs moves the result", () => {
  const r0 = calculate(base);
  const changes: [string, Partial<CalculatorInputs>][] = [
    ["arr", { arr: 10_000_000 }],
    ["dealsPerMonth", { dealsPerMonth: 20 }],
    ["acv", { acv: 40_000 }],
    ["delayDays", { delayDays: 45 }],
    ["uninvoicedPct", { uninvoicedPct: 15 }],
    ["reconciliation", { reconciliation: "Manual" }],
    ["discrepancyFreq", { discrepancyFreq: "Frequently" }],
    ["dirtyDataPct", { dirtyDataPct: 30 }],
    ["creditNoteProcess", { creditNoteProcess: "No" }],
    ["systems", { systems: "3+" }],
  ];
  it.each(changes)("%s changes the total", (_name, change) => {
    const r1 = calculate({ ...base, ...change });
    expect(r1.totalExposure).not.toBeCloseTo(r0.totalExposure, 2);
  });
});

describe("calculate — direction and bounds", () => {
  it("worse answers never reduce exposure", () => {
    const good = calculate({
      ...base,
      reconciliation: "Fully Automated",
      discrepancyFreq: "Rarely",
      creditNoteProcess: "Yes",
      systems: "1",
    });
    const bad = calculate({
      ...base,
      reconciliation: "Manual",
      discrepancyFreq: "Frequently",
      creditNoteProcess: "No",
      systems: "3+",
    });
    for (const k of ALL_CATEGORIES) expect(bad.categories[k]).toBeGreaterThanOrEqual(good.categories[k]);
    expect(bad.totalExposure).toBeGreaterThan(good.totalExposure);
  });

  it("a clean stack scores LOW; a broken one HIGH, and CRITICAL at higher deal volume", () => {
    const clean = calculate({
      ...base,
      delayDays: 0,
      uninvoicedPct: 0,
      reconciliation: "Fully Automated",
      discrepancyFreq: "Rarely",
      dirtyDataPct: 0,
      creditNoteProcess: "Yes",
      systems: "1",
    });
    expect(clean.riskScore).toBe("LOW");
    const brokenInputs: CalculatorInputs = {
      ...base,
      delayDays: 90,
      uninvoicedPct: 30,
      reconciliation: "Manual",
      discrepancyFreq: "Frequently",
      dirtyDataPct: 40,
      creditNoteProcess: "No",
      systems: "3+",
    };
    expect(calculate(brokenInputs).riskScore).toBe("HIGH"); // ≈ 5.7% of ARR
    expect(calculate({ ...brokenInputs, dealsPerMonth: 20 }).riskScore).toBe("CRITICAL");
  });

  it("is safe with zero, blank or invalid numbers", () => {
    const r = calculate({ ...base, arr: 0, acv: 0, dealsPerMonth: NaN, delayDays: -5 });
    expect(Number.isFinite(r.totalExposure)).toBe(true);
    expect(r.totalExposure).toBeGreaterThanOrEqual(0);
    expect(r.exposureRatio).toBe(0);
    expect(r.accounts).toBe(0);
  });

  it("uses the assumptions passed in", () => {
    const strict: Assumptions = { ...DEFAULT_ASSUMPTIONS, uninvoicedNeverRecoveredPct: 100 };
    const r = calculate(base, strict);
    expect(r.categories.uninvoiced).toBeCloseTo(2_400_000 * 0.05, 6);
  });

  it("billing delay is annualised (deals per month × 12)", () => {
    const r = calculate({ ...base, delayDays: 365 });
    expect(r.categories.billingDelay).toBeCloseTo(r.newBookings * 0.08, 6);
  });
});

describe("risk bands", () => {
  it.each([
    [0, "LOW"],
    [0.0099, "LOW"],
    [0.01, "MEDIUM"],
    [0.03, "HIGH"],
    [0.06, "CRITICAL"],
    [0.5, "CRITICAL"],
  ])("ratio %f → %s", (ratio, score) => {
    expect(scoreFor(ratio)).toBe(score);
  });
});

describe("helpers", () => {
  it("formats money in USD by default, and in EUR or GBP on request", () => {
    expect(formatMoney(1_250_000)).toBe("$1.25M");
    expect(formatMoney(18_000)).toBe("$18.0K");
    expect(formatMoney(950)).toBe("$950");
    expect(formatMoney(NaN)).toBe("$0");
    expect(formatMoney(18_000, "EUR")).toBe("€18.0K");
    expect(formatMoneyExact(61_890.4, "GBP")).toBe("£61,890");
  });

  it("currency changes the symbol only, never the amounts", () => {
    const usd = calculate(base, DEFAULT_ASSUMPTIONS, "USD");
    const eur = calculate(base, DEFAULT_ASSUMPTIONS, "EUR");
    expect(eur.totalExposure).toBe(usd.totalExposure);
    expect(usd.explanations.uninvoiced).toContain("$2.40M new bookings");
    expect(eur.explanations.uninvoiced).toContain("€2.40M new bookings");
  });

  it("shows small percentages exactly", () => {
    const r = calculate({ ...base, creditNoteProcess: "Yes" });
    expect(r.explanations.creditNotes).toContain("× 0.05% written down");
  });

  it("ARR slider round-trips and clamps", () => {
    expect(sliderToArr(arrToSlider(5_000_000))).toBeCloseTo(5_000_000, 0);
    expect(arrToSlider(1)).toBe(0);
    expect(arrToSlider(10_000_000_000)).toBe(100);
  });

  it("summary names the top category and its recommendation", () => {
    const s = buildSummary(calculate(base));
    expect(s).toContain("uninvoiced deals");
    expect(s).toContain("closed-won to invoice");
  });
});
