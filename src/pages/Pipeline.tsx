import { useState, useEffect } from "react";
import { AppNav } from "@/components/AppNav";

const STAGES = [
  { id: "discovery", label: "Discovery", defaultWinRate: 40, defaultCycle: 14 },
  { id: "qualified", label: "Qualified", defaultWinRate: 28, defaultCycle: 21 },
  { id: "proposal", label: "Proposal", defaultWinRate: 55, defaultCycle: 14 },
  { id: "negotiation", label: "Negotiation", defaultWinRate: 75, defaultCycle: 10 },
  { id: "closed", label: "Closing", defaultWinRate: 90, defaultCycle: 7 },
];

const fmt = (n) =>
  n >= 1_000_000
    ? `€${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `€${(n / 1_000).toFixed(0)}K`
    : `€${n.toFixed(0)}`;

const pct = (n) => `${Math.round(n)}%`;

function SliderInput({ label, value, onChange, min, max, step = 1, suffix = "" }) {
  return (
    <div className="mb-4">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span style={{ fontSize: 13, color: "#00ff88", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          appearance: "none",
          height: 3,
          background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${((value - min) / (max - min)) * 100}%, #1e2a1e ${((value - min) / (max - min)) * 100}%, #1e2a1e 100%)`,
          outline: "none",
          borderRadius: 2,
          cursor: "pointer",
        }}
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, prefix = "", suffix = "" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "#8892a4", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", background: "#0d1117", border: "1px solid #1e2a1e", borderRadius: 6, padding: "8px 12px" }}>
        {prefix && <span style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", marginRight: 4, fontSize: 13 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ background: "transparent", border: "none", outline: "none", color: "#e8edf3", fontFamily: "'Space Mono', monospace", fontSize: 14, width: "100%", fontWeight: 600 }}
        />
        {suffix && <span style={{ color: "#8892a4", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function HealthBar({ value, max }) {
  const pctVal = Math.min((value / max) * 100, 100);
  const color = pctVal >= 100 ? "#00ff88" : pctVal >= 70 ? "#f0c040" : pctVal >= 40 ? "#ff8c00" : "#ff4444";
  return (
    <div style={{ width: "100%", height: 6, background: "#1e2a1e", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          width: `${pctVal}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
    </div>
  );
}

export default function PipelineStoryteller() {
  const [quotaARR, setQuotaARR] = useState(1200000);
  const [avgDealSize, setAvgDealSize] = useState(18000);
  const [quarterProgress, setQuarterProgress] = useState(45);
  const [stageData, setStageData] = useState(
    STAGES.map((s) => ({ ...s, value: 0, winRate: s.defaultWinRate, cycleDays: s.defaultCycle }))
  );
  const [generated, setGenerated] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    setAnimIn(true);
  }, []);

  const updateStage = (id, field, val) => {
    setStageData((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const quarterTarget = quotaARR / 4;
  const weightedPipeline = stageData.reduce((acc, s) => acc + s.value * (s.winRate / 100), 0);
  const totalPipeline = stageData.reduce((acc, s) => acc + s.value, 0);
  const coverageRatio = quarterTarget > 0 ? weightedPipeline / quarterTarget : 0;
  const gap = Math.max(quarterTarget - weightedPipeline, 0);
  const dealsNeeded = avgDealSize > 0 ? Math.ceil(gap / avgDealSize) : 0;

  const biggestStall = [...stageData].sort((a, b) => {
    const aRisk = (a.value * (1 - a.winRate / 100)) * (a.cycleDays / 30);
    const bRisk = (b.value * (1 - b.winRate / 100)) * (b.cycleDays / 30);
    return bRisk - aRisk;
  })[0];

  const generateNarrative = async () => {
    setLoading(true);
    setGenerated(false);

    const prompt = `You are a RevOps strategic advisor. Generate a concise VP-ready pipeline narrative (3-4 sentences max). Be direct, specific, and end with ONE clear recommendation.

Context:
- Company: StaySync (SaaS, hospitality management)
- Quarter target: ${fmt(quarterTarget)}
- Weighted pipeline: ${fmt(weightedPipeline)}
- Coverage ratio: ${(coverageRatio * 100).toFixed(0)}%
- Pipeline gap to close: ${fmt(gap)}
- Deals needed to close gap: ${dealsNeeded} at avg ACV ${fmt(avgDealSize)}
- Quarter progress: ${quarterProgress}% through the quarter
- Biggest risk stage: ${biggestStall.label} (${fmt(biggestStall.value)} pipeline, ${biggestStall.winRate}% win rate, ${biggestStall.cycleDays} day avg cycle)
- Total pipeline by stage: ${stageData.map(s => `${s.label}: ${fmt(s.value)} (${s.winRate}% WR)`).join(", ")}

Write the narrative as if presenting to a VP of Revenue. Start with the bottom line. Translate numbers into business implications. End with a specific recommendation (not vague advice).`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "Unable to generate narrative.";
      setNarrative(text);
      setGenerated(true);
    } catch {
      setNarrative("Failed to generate narrative. Check your connection.");
      setGenerated(true);
    }
    setLoading(false);
  };

  const coverageColor =
    coverageRatio >= 1 ? "#00ff88" : coverageRatio >= 0.7 ? "#f0c040" : coverageRatio >= 0.4 ? "#ff8c00" : "#ff4444";

  const coverageLabel =
    coverageRatio >= 1 ? "ON TRACK" : coverageRatio >= 0.7 ? "AT RISK" : coverageRatio >= 0.4 ? "BEHIND" : "CRITICAL";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080d0a",
        fontFamily: "'DM Sans', sans-serif",
        color: "#e8edf3",
        padding: "0 0 60px",
        opacity: animIn ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <AppNav />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap');
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00ff88;
          cursor: pointer;
          box-shadow: 0 0 8px #00ff8888;
        }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::selection { background: #00ff8833; }
        * { box-sizing: border-box; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a0f0b", borderBottom: "1px solid #1a2a1a", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 10px #00ff88", animation: "pulse-dot 2s ease infinite" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00ff88", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Pipeline Intelligence
            </span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.05em", color: "#e8edf3", margin: 0 }}>
            Pipeline Coverage Storyteller
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#8892a4", letterSpacing: "0.1em" }}>POWERED BY</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#00ff88", fontWeight: 700 }}>StaySync · Q{Math.ceil(new Date().getMonth() / 3)} {new Date().getFullYear()}</div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Top metrics row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Quarter Target", value: fmt(quarterTarget), sub: `${fmt(quotaARR)} ARR / 4` },
            { label: "Weighted Pipeline", value: fmt(weightedPipeline), sub: `${pct(coverageRatio * 100)} coverage` },
            { label: "Gap to Close", value: fmt(gap), sub: `${dealsNeeded} deals needed` },
            { label: "Coverage Status", value: coverageLabel, sub: `${Math.round(quarterProgress)}% through Q`, accent: true },
          ].map((m, i) => (
            <div
              key={i}
              style={{
                background: "#0d1117",
                border: `1px solid ${m.accent ? coverageColor + "44" : "#1a2a1a"}`,
                borderRadius: 10,
                padding: "20px 18px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: m.accent ? coverageColor : "#1a2a1a" }} />
              <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#8892a4", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: m.accent ? coverageColor : "#e8edf3", marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#556066" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>

          {/* Left: Inputs */}
          <div>
            <div style={{ background: "#0d1117", border: "1px solid #1a2a1a", borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                // Global Settings
              </div>
              <NumberInput label="Annual Quota (ARR)" value={quotaARR} onChange={setQuotaARR} prefix="€" />
              <NumberInput label="Average Deal Size (ACV)" value={avgDealSize} onChange={setAvgDealSize} prefix="€" />
              <SliderInput label="Quarter Progress" value={quarterProgress} onChange={setQuarterProgress} min={0} max={100} suffix="%" />
            </div>

            <div style={{ background: "#0d1117", border: "1px solid #1a2a1a", borderRadius: 10, padding: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                // Stage Pipeline
              </div>
              {stageData.map((s) => (
                <div key={s.id} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #1a2a1a" }}>
                  <div style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#e8edf3", marginBottom: 10, fontWeight: 700 }}>{s.label}</div>
                  <NumberInput label="Pipeline Value" value={s.value} onChange={(v) => updateStage(s.id, "value", v)} prefix="€" />
                  <SliderInput label="Win Rate" value={s.winRate} onChange={(v) => updateStage(s.id, "winRate", v)} min={0} max={100} suffix="%" />
                  <SliderInput label="Avg Cycle (days)" value={s.cycleDays} onChange={(v) => updateStage(s.id, "cycleDays", v)} min={1} max={90} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visuals + Narrative */}
          <div>

            {/* Stage breakdown bars */}
            <div style={{ background: "#0d1117", border: "1px solid #1a2a1a", borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                // Weighted Pipeline by Stage
              </div>
              {stageData.map((s, i) => {
                const weighted = s.value * (s.winRate / 100);
                const barMax = Math.max(...stageData.map((x) => x.value), 1);
                const rawPct = (s.value / barMax) * 100;
                const wPct = (weighted / barMax) * 100;
                return (
                  <div key={s.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8892a4" }}>{s.label}</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#e8edf3" }}>{fmt(weighted)}</span>
                        <span style={{ fontSize: 10, color: "#556066", marginLeft: 6 }}>weighted</span>
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 20, background: "#1a2a1a", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${rawPct}%`, background: "#1e3a2a", borderRadius: 4, transition: "width 0.5s ease" }} />
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${wPct}%`, background: `linear-gradient(90deg, #00ff88, #00cc6a)`, borderRadius: 4, transition: "width 0.5s ease", boxShadow: "0 0 12px #00ff8844" }} />
                      <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#8892a4" }}>
                        {s.winRate}% WR
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Coverage meter */}
              <div style={{ marginTop: 24, padding: "16px", background: "#080d0a", borderRadius: 8, border: `1px solid ${coverageColor}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8892a4" }}>COVERAGE RATIO</span>
                  <span style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: coverageColor, fontWeight: 700 }}>
                    {(coverageRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <HealthBar value={weightedPipeline} max={quarterTarget} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: "#556066" }}>0</span>
                  <span style={{ fontSize: 10, color: "#556066" }}>Target: {fmt(quarterTarget)}</span>
                </div>
              </div>
            </div>

            {/* Risk Signals */}
            <div style={{ background: "#0d1117", border: "1px solid #1a2a1a", borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                // Risk Signals
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  {
                    label: "Biggest Stall Risk",
                    value: biggestStall.label,
                    detail: `${fmt(biggestStall.value)} · ${biggestStall.cycleDays}d avg cycle`,
                    color: "#ff8c00",
                  },
                  {
                    label: "Time Remaining",
                    value: `${100 - quarterProgress}%`,
                    detail: coverageRatio < 0.8 && (100 - quarterProgress) < 40 ? "⚠ Closing window" : "Within range",
                    color: (100 - quarterProgress) < 30 ? "#ff4444" : "#f0c040",
                  },
                  {
                    label: "Raw Pipeline",
                    value: fmt(totalPipeline),
                    detail: `vs ${fmt(quarterTarget)} target`,
                    color: totalPipeline >= quarterTarget * 3 ? "#00ff88" : "#f0c040",
                  },
                  {
                    label: "Deals to Fill Gap",
                    value: dealsNeeded === 0 ? "None" : dealsNeeded,
                    detail: dealsNeeded === 0 ? "Gap covered" : `At ${fmt(avgDealSize)} ACV`,
                    color: dealsNeeded === 0 ? "#00ff88" : dealsNeeded > 5 ? "#ff4444" : "#f0c040",
                  },
                ].map((r, i) => (
                  <div key={i} style={{ background: "#080d0a", border: `1px solid ${r.color}22`, borderLeft: `3px solid ${r.color}`, borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#8892a4", marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 18, fontFamily: "'Space Mono', monospace", color: r.color, fontWeight: 700 }}>{r.value}</div>
                    <div style={{ fontSize: 10, color: "#556066", marginTop: 2 }}>{r.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Narrative */}
            <div style={{ background: "#0d1117", border: "1px solid #1a2a1a", borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  // VP-Ready Narrative
                </div>
                <button
                  onClick={generateNarrative}
                  disabled={loading}
                  style={{
                    background: loading ? "#1a2a1a" : "#00ff88",
                    color: loading ? "#8892a4" : "#080d0a",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 18px",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? "GENERATING..." : generated ? "↺ REGENERATE" : "▶ GENERATE"}
                </button>
              </div>

              {!generated && !loading && (
                <div style={{ padding: "32px 0", textAlign: "center", color: "#556066", fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>◈</div>
                  Configure your pipeline data above, then generate a VP-ready narrative that translates the numbers into a business story.
                </div>
              )}

              {loading && (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#00ff88",
                          animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: "#556066", fontFamily: "'Space Mono', monospace" }}>
                    Analysing pipeline data...
                  </div>
                </div>
              )}

              {generated && narrative && (
                <div style={{ animation: "fade-up 0.4s ease forwards" }}>
                  <div
                    style={{
                      background: "#080d0a",
                      border: "1px solid #1a2a1a",
                      borderLeft: "3px solid #00ff88",
                      borderRadius: 6,
                      padding: 20,
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: "#c8d4dc",
                      fontStyle: "normal",
                    }}
                  >
                    {narrative}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#556066", textAlign: "right" }}>
                    Generated by Claude · StaySync RevOps Intelligence
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}