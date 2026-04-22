import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CalculatorInputs,
  CalculatorResults,
  CATEGORY_LABELS,
  formatEURExact,
  getBenchmarks,
  LeakageCategoryKey,
} from "./calculations";

function categoryValues(r: CalculatorResults): Record<LeakageCategoryKey, number> {
  return {
    billingDelay: r.billingDelayLeakage,
    uninvoiced: r.uninvoicedLeakage,
    discrepancies: r.discrepancyLeakage,
    dataQuality: r.dataQualityLeakage,
    manualProcess: r.manualReconciliationCost,
  };
}

export function downloadCSV(inputs: CalculatorInputs, results: CalculatorResults) {
  const benches = getBenchmarks(inputs.arr);
  const cats = categoryValues(results);
  const lines: string[] = [];
  lines.push("Rev-Sync — Revenue Leakage Report");
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push("");
  lines.push("Inputs Summary");
  lines.push(`ARR (EUR),${Math.round(inputs.arr)}`);
  lines.push(`Deals per month,${inputs.dealsPerMonth}`);
  lines.push(`ACV (EUR),${Math.round(inputs.acv)}`);
  lines.push(`Billing delay (days),${inputs.delayDays}`);
  lines.push(`Uninvoiced %,${inputs.uninvoicedPct}`);
  lines.push(`Reconciliation,${inputs.reconciliation}`);
  lines.push(`Discrepancy frequency,${inputs.discrepancyFreq}`);
  lines.push(`Dirty data %,${inputs.dirtyDataPct}`);
  lines.push(`Credit note process,${inputs.creditNoteProcess}`);
  lines.push(`Systems,${inputs.systems}`);
  lines.push("");
  lines.push("Category,Estimated Leakage (EUR),% of ARR,Industry Avg (EUR)");
  (Object.keys(cats) as LeakageCategoryKey[]).forEach((k) => {
    const value = cats[k];
    const pct = inputs.arr > 0 ? ((value / inputs.arr) * 100).toFixed(2) : "0.00";
    lines.push(`${CATEGORY_LABELS[k]},${Math.round(value)},${pct}%,${Math.round(benches[k])}`);
  });
  lines.push("");
  lines.push(`Total at risk (EUR),${Math.round(results.totalAtRisk)}`);
  lines.push(`Risk score,${results.riskScore}`);

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `rev-sync-report-${stamp()}.csv`);
}

export function downloadPDF(
  inputs: CalculatorInputs,
  results: CalculatorResults,
  narrative: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  // Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("Rev-Sync", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Revenue Leakage Report", margin + 90, y);
  y += 8;
  doc.setDrawColor(0, 200, 110);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 60, y);
  y += 24;

  // Date
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 22;

  // Inputs summary
  autoTable(doc, {
    startY: y,
    head: [["Input", "Value"]],
    body: [
      ["ARR", formatEURExact(inputs.arr)],
      ["Deals / month", String(inputs.dealsPerMonth)],
      ["Average Contract Value", formatEURExact(inputs.acv)],
      ["Billing delay", `${inputs.delayDays} days`],
      ["Uninvoiced (60d)", `${inputs.uninvoicedPct}%`],
      ["Reconciliation", inputs.reconciliation],
      ["Discrepancy frequency", inputs.discrepancyFreq],
      ["Dirty data", `${inputs.dirtyDataPct}%`],
      ["Credit note process", inputs.creditNoteProcess],
      ["Revenue systems", inputs.systems],
    ],
    theme: "grid",
    headStyles: { fillColor: [20, 20, 20], textColor: [0, 255, 136] },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 28;

  // Risk Score
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text("RISK SCORE", margin, y);
  y += 22;
  const riskColors: Record<string, [number, number, number]> = {
    LOW: [0, 200, 110],
    MEDIUM: [240, 180, 0],
    HIGH: [240, 120, 0],
    CRITICAL: [220, 50, 50],
  };
  const [r, g, b] = riskColors[results.riskScore];
  doc.setFontSize(26);
  doc.setTextColor(r, g, b);
  doc.text(results.riskScore, margin, y);
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `${(results.riskRatio * 100).toFixed(2)}% of ARR · Total at risk ${formatEURExact(results.totalAtRisk)}`,
    margin + 130,
    y - 6,
  );
  y += 18;

  // Narrative
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const wrapped = doc.splitTextToSize(narrative, 500);
  doc.text(wrapped, margin, y);
  y += wrapped.length * 13 + 18;

  // Breakdown table
  const benches = getBenchmarks(inputs.arr);
  const cats = categoryValues(results);
  const rows = (Object.keys(cats) as LeakageCategoryKey[]).map((k) => {
    const value = cats[k];
    const pct = inputs.arr > 0 ? ((value / inputs.arr) * 100).toFixed(2) : "0.00";
    return [
      CATEGORY_LABELS[k],
      formatEURExact(value),
      `${pct}%`,
      formatEURExact(benches[k]),
    ];
  });
  autoTable(doc, {
    startY: y,
    head: [["Category", "Estimated Leakage", "% of ARR", "Industry Avg"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [20, 20, 20], textColor: [0, 255, 136] },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "Generated by Rev-Sync · rev-sync.app · Estimates are indicative only.",
    margin,
    pageHeight - 24,
  );

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