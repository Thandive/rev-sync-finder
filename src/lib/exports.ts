import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ALL_CATEGORIES,
  Assumptions,
  CalculatorInputs,
  CalculatorResults,
  CATEGORY_LABELS,
  COST_CATEGORIES,
  REVENUE_CATEGORIES,
} from "./calculations";
import { Currency, formatMoneyExact } from "./currency";

export const ASSUMPTIONS_NOTE =
  "Figures are estimates from the inputs and working assumptions listed here. The assumptions are Rev-Sync's own, chosen to be conservative and editable; they are not sourced industry benchmarks.";

function shareOfArr(value: number, arr: number): string {
  return arr > 0 ? `${((value / arr) * 100).toFixed(2)}%` : "0.00%";
}

export function inputRows(inputs: CalculatorInputs, currency: Currency): [string, string][] {
  const money = (n: number) => formatMoneyExact(n, currency);
  return [
    ["ARR", money(inputs.arr)],
    ["Deals closed / month", String(inputs.dealsPerMonth)],
    ["Average contract value", money(inputs.acv)],
    ["Days from close to invoice", `${inputs.delayDays}`],
    ["% deals uninvoiced at 60 days", `${inputs.uninvoicedPct}%`],
    ["CRM ↔ billing reconciliation", inputs.reconciliation],
    ["Invoice mismatch frequency", inputs.discrepancyFreq],
    ["% CRM records with bad data", `${inputs.dirtyDataPct}%`],
    ["Credit note / amendment process", inputs.creditNoteProcess],
    ["Systems holding revenue data", inputs.systems],
  ];
}

export function assumptionRows(inputs: CalculatorInputs, a: Assumptions, currency: Currency): [string, string][] {
  return [
    ["Cost of capital", `${a.costOfCapitalPct}% / yr`],
    ["Uninvoiced deals never recovered", `${a.uninvoicedNeverRecoveredPct}%`],
    [`Invoices mismatched (${inputs.discrepancyFreq})`, `${a.discrepancyRatePct[inputs.discrepancyFreq]}%`],
    ["Net loss on a mismatched invoice", `${a.discrepancyNetLossPct}%`],
    ["Impact of a bad CRM record", `${a.dataQualityImpactPct}% of its revenue`],
    [`ARR written down (credit process: ${inputs.creditNoteProcess})`, `${a.creditNoteWriteDownPct[inputs.creditNoteProcess]}%`],
    [`Reconciliation effort (${inputs.reconciliation})`, `${a.reconMinutesPerAccount[inputs.reconciliation]} min / account / month`],
    [`Systems factor (${inputs.systems})`, `× ${a.systemsMultiplier[inputs.systems]}`],
    ["Loaded hourly cost", formatMoneyExact(a.hourlyCost, currency)],
  ];
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCSV(
  inputs: CalculatorInputs,
  results: CalculatorResults,
  assumptions: Assumptions,
  currency: Currency,
  generatedAt: Date = new Date(),
): string {
  const rows: (string | number)[][] = [];
  rows.push(["Rev-Sync Revenue Leakage Report"]);
  rows.push(["Generated", generatedAt.toISOString()]);
  rows.push(["Currency", currency]);
  rows.push([]);
  rows.push(["Input", "Value"]);
  inputRows(inputs, currency).forEach((r) => rows.push(r));
  rows.push([]);
  rows.push(["Assumption", "Value"]);
  assumptionRows(inputs, assumptions, currency).forEach((r) => rows.push(r));
  rows.push([]);
  rows.push(["Group", "Category", `Estimated annual exposure (${currency})`, "% of ARR", "How it is calculated"]);
  for (const k of ALL_CATEGORIES) {
    const group = REVENUE_CATEGORIES.includes(k) ? "Revenue leakage" : "Cost to operate";
    rows.push([group, CATEGORY_LABELS[k], Math.round(results.categories[k]), shareOfArr(results.categories[k], inputs.arr), results.explanations[k]]);
  }
  rows.push([]);
  rows.push(["Subtotal", "Revenue leakage", Math.round(results.revenueLeakage), shareOfArr(results.revenueLeakage, inputs.arr)]);
  rows.push(["Subtotal", "Cost to operate", Math.round(results.costToOperate), shareOfArr(results.costToOperate, inputs.arr)]);
  rows.push(["Total", "Estimated annual exposure", Math.round(results.totalExposure), shareOfArr(results.totalExposure, inputs.arr)]);
  rows.push(["Risk score", results.riskScore]);
  rows.push([]);
  rows.push([ASSUMPTIONS_NOTE]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadCSV(
  inputs: CalculatorInputs,
  results: CalculatorResults,
  assumptions: Assumptions,
  currency: Currency,
) {
  // Byte-order mark so Excel opens UTF-8 (€, £, ↔) correctly
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + buildCSV(inputs, results, assumptions, currency)], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `rev-sync-report-${stamp()}.csv`);
}

/** jsPDF's built-in fonts are Latin-1 only; swap characters it cannot draw. */
function pdfText(s: string): string {
  return s.replace(/↔/g, "<->").replace(/×/g, "x").replace(/[–—]/g, "-").replace(/€/g, "EUR ");
}

export function downloadPDF(
  inputs: CalculatorInputs,
  results: CalculatorResults,
  assumptions: Assumptions,
  currency: Currency,
  summary: string,
) {
  const money = (n: number) => formatMoneyExact(n, currency);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  const tableStyle = {
    theme: "grid" as const,
    headStyles: { fillColor: [20, 20, 20] as [number, number, number], textColor: [0, 255, 136] as [number, number, number] },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin, bottom: 44 },
  };
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("Rev-Sync", margin, y);
  const wordmarkWidth = doc.getTextWidth("Rev-Sync");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Revenue Leakage Report", margin + wordmarkWidth + 12, y);
  y += 8;
  doc.setDrawColor(0, 200, 110);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 60, y);
  y += 22;
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)}`, margin, y);
  y += 26;

  // Risk score and total
  const riskColors: Record<string, [number, number, number]> = {
    LOW: [0, 170, 95],
    MEDIUM: [210, 160, 0],
    HIGH: [230, 110, 0],
    CRITICAL: [210, 50, 50],
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...riskColors[results.riskScore]);
  doc.text(results.riskScore, margin, y);
  const scoreWidth = doc.getTextWidth(results.riskScore);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(
    pdfText(`Estimated annual exposure ${money(results.totalExposure)} (${shareOfArr(results.totalExposure, inputs.arr)} of ARR)`),
    margin + scoreWidth + 16,
    y - 8,
  );
  y += 20;
  doc.setFontSize(10);
  const wrapped = doc.splitTextToSize(pdfText(summary), width);
  doc.text(wrapped, margin, y);
  y += wrapped.length * 13 + 14;

  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [["Category", "Annual exposure", "% of ARR", "How it is calculated"]],
    body: [
      ...REVENUE_CATEGORIES.map((k) => [CATEGORY_LABELS[k], money(results.categories[k]), shareOfArr(results.categories[k], inputs.arr), results.explanations[k]]),
      [{ content: "Revenue leakage", styles: { fontStyle: "bold" as const } }, money(results.revenueLeakage), shareOfArr(results.revenueLeakage, inputs.arr), ""],
      ...COST_CATEGORIES.map((k) => [CATEGORY_LABELS[k], money(results.categories[k]), shareOfArr(results.categories[k], inputs.arr), results.explanations[k]]),
      [{ content: "Cost to operate", styles: { fontStyle: "bold" as const } }, money(results.costToOperate), shareOfArr(results.costToOperate, inputs.arr), ""],
      [{ content: "Total exposure", styles: { fontStyle: "bold" as const } }, money(results.totalExposure), shareOfArr(results.totalExposure, inputs.arr), ""],
    ].map((row) => row.map((c) => (typeof c === "string" ? pdfText(c) : c))),
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 80 }, 2: { cellWidth: 55 } },
  });
  y = lastY() + 18;

  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [["Input", "Value"]],
    body: inputRows(inputs, currency).map((r) => r.map(pdfText)),
  });
  y = lastY() + 18;

  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [["Working assumption", "Value"]],
    body: assumptionRows(inputs, assumptions, currency).map((r) => r.map(pdfText)),
    foot: [[{ content: ASSUMPTIONS_NOTE, colSpan: 2 }]],
    showFoot: "lastPage",
    footStyles: { fillColor: [245, 245, 245], textColor: [90, 90, 90], fontStyle: "normal" },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Generated by Rev-Sync - rev-sync.app - Estimates are indicative only. Not financial advice.", margin, pageHeight - 24);
  }

  doc.save(`rev-sync-report-${stamp()}.pdf`);
}

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
