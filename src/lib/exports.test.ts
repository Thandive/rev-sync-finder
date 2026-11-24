import { describe, expect, it } from "vitest";
import { calculate, DEFAULT_ASSUMPTIONS, DEFAULT_INPUTS } from "./calculations";
import { buildCSV } from "./exports";

describe("buildCSV", () => {
  const results = calculate(DEFAULT_INPUTS);
  const csv = buildCSV(DEFAULT_INPUTS, results, DEFAULT_ASSUMPTIONS, new Date("2026-11-24T00:00:00Z"));
  const lines = csv.split("\n");

  it("has one total that matches the screen", () => {
    const total = lines.find((l) => l.startsWith("Total,"));
    expect(total).toBe(`Total,Estimated annual exposure,${Math.round(results.totalExposure)},1.39%`);
    expect(lines).toContain("Risk score,MEDIUM");
  });

  it("lists all ten inputs and the assumptions used", () => {
    const inputStart = lines.indexOf("Input,Value");
    const assumptionStart = lines.indexOf("Assumption,Value");
    expect(assumptionStart - inputStart - 2).toBe(10);
    expect(csv).toContain("Uninvoiced deals never recovered,15%");
  });

  it("explains every category and quotes cells that contain commas", () => {
    expect(csv).toContain("Revenue leakage,Uninvoiced deals,18000,0.36%");
    expect(csv).toMatch(/"Rev-Sync's own, chosen to be conservative|own, chosen/);
    for (const line of lines.filter((l) => l.startsWith("Revenue leakage,") || l.startsWith("Cost to operate,"))) {
      expect(line.split(",").length).toBeGreaterThanOrEqual(5);
    }
  });
});
