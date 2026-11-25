/// <reference types="node" />
// Vercel serverless function: POST /api/narrative
//
// Writes the Pipeline Storyteller's VP-ready narrative with the Claude API.
//
// Security model
// - The Anthropic key lives only in the server environment (ANTHROPIC_API_KEY). It never reaches the browser.
// - The endpoint accepts numbers only. The prompt is built here from validated numbers and a fixed set of
//   stage names, so it cannot be used as a general-purpose proxy to the model.
// - Origin allow-list, per-IP rate limit and a bounded max_tokens keep casual abuse cheap.
//   The hard cap is the monthly spend limit set on the API key's workspace in the Claude Console.
//
// Self-contained on purpose (no imports from src/): Vercel compiles this file on its own.

type Json = Record<string, unknown>;

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

interface Res {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  json: (body: Json) => void;
}

const STAGES: Record<string, string> = {
  discovery: "Discovery",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  commit: "Commit",
};
const STATUSES = ["TARGET MET", "ON TRACK", "AT RISK", "BEHIND", "CRITICAL"];
const MAX_AMOUNT = 10_000_000_000;
const SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

export interface NarrativePayload {
  currency: string;
  status: string;
  quarterTarget: number;
  closedWon: number;
  remainingTarget: number;
  daysRemaining: number;
  totalPipeline: number;
  weightedPipeline: number;
  inQuarterPipeline: number;
  coverage: number;
  gap: number;
  dealsNeeded: number;
  avgDealSize: number;
  stages: { id: string; value: number; winRate: number; cycleDays: number; weighted: number; inQuarter: number }[];
}

function num(v: unknown, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null;
}

/** Returns a clean payload, or a string describing the first problem. */
export function validatePayload(body: unknown): NarrativePayload | string {
  if (!body || typeof body !== "object") return "Body must be a JSON object.";
  const b = body as Json;
  if (typeof b.currency !== "string" || !(b.currency in SYMBOLS)) return "Invalid currency.";
  if (typeof b.status !== "string" || !STATUSES.includes(b.status)) return "Invalid status.";

  const limits: Record<string, number> = {
    quarterTarget: MAX_AMOUNT,
    closedWon: MAX_AMOUNT,
    remainingTarget: MAX_AMOUNT,
    daysRemaining: 366,
    totalPipeline: MAX_AMOUNT,
    weightedPipeline: MAX_AMOUNT,
    inQuarterPipeline: MAX_AMOUNT,
    coverage: 10_000,
    gap: MAX_AMOUNT,
    dealsNeeded: 1_000_000,
    avgDealSize: MAX_AMOUNT,
  };
  const out: Partial<NarrativePayload> = { currency: b.currency, status: b.status };
  for (const [key, max] of Object.entries(limits)) {
    const v = num(b[key], max);
    if (v === null) return `Invalid ${key}.`;
    (out as Json)[key] = v;
  }

  if (!Array.isArray(b.stages) || b.stages.length < 1 || b.stages.length > 8) return "Invalid stages.";
  const stages: NarrativePayload["stages"] = [];
  for (const raw of b.stages) {
    if (!raw || typeof raw !== "object") return "Invalid stage.";
    const s = raw as Json;
    if (typeof s.id !== "string" || !(s.id in STAGES)) return "Invalid stage id.";
    const value = num(s.value, MAX_AMOUNT);
    const winRate = num(s.winRate, 100);
    const cycleDays = num(s.cycleDays, 3650);
    const weighted = num(s.weighted, MAX_AMOUNT);
    const inQuarter = num(s.inQuarter, MAX_AMOUNT);
    if (value === null || winRate === null || cycleDays === null || weighted === null || inQuarter === null) {
      return `Invalid numbers for stage ${s.id}.`;
    }
    stages.push({ id: s.id, value, winRate, cycleDays, weighted, inQuarter });
  }
  out.stages = stages;
  return out as NarrativePayload;
}

function money(n: number, currency: string): string {
  const s = SYMBOLS[currency] ?? "$";
  return n >= 1_000_000 ? `${s}${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${s}${Math.round(n / 1_000)}K` : `${s}${Math.round(n)}`;
}

export const SYSTEM_PROMPT =
  "You are a Revenue Operations advisor writing for a VP of Revenue who has ten seconds to read. " +
  "Write exactly 3 sentences, 50 words at most in total, as plain prose: no markdown, no bullet points, no headings. " +
  "Sentence 1: the status and the gap, with no more than two numbers. Sentence 2: the main risk, with one number. " +
  "Sentence 3: one specific recommendation that starts with a verb. Use only the numbers provided and do not invent " +
  "deals, names or causes. Write amounts with the same currency symbol as the figures provided. " +
  "Example of the expected length and style, with different numbers: \"The quarter is behind: $310K can close " +
  "against $420K still needed, a $110K gap. Most of the shortfall sits in Discovery, whose cycle runs past quarter " +
  "end. Review every Negotiation deal this week and confirm signature dates.\"";

export function buildPrompt(p: NarrativePayload): string {
  const amount = (n: number) => money(n, p.currency);
  const stageLines = p.stages
    .map(
      (s) =>
        `- ${STAGES[s.id]}: ${amount(s.value)} open, ${Math.round(s.winRate)}% win rate, ${Math.round(s.cycleDays)}-day average cycle to close, ` +
        `${amount(s.weighted)} weighted, ${amount(s.inQuarter)} expected to close this quarter`,
    )
    .join("\n");
  return [
    `Quarter status: ${p.status}`,
    `Quarter target: ${amount(p.quarterTarget)}; closed-won so far: ${amount(p.closedWon)}; still needed: ${amount(p.remainingTarget)}`,
    `Days left in the quarter: ${Math.round(p.daysRemaining)}`,
    `Open pipeline: ${amount(p.totalPipeline)}; weighted: ${amount(p.weightedPipeline)}; weighted and able to close before quarter end: ${amount(p.inQuarterPipeline)}`,
    `Coverage of what is still needed (time-adjusted weighted pipeline): ${Math.round(p.coverage * 100)}%`,
    `Gap: ${amount(p.gap)}, about ${Math.round(p.dealsNeeded)} deals at an average of ${amount(p.avgDealSize)}`,
    `Pipeline by stage:`,
    stageLines,
    ``,
    `Write the narrative.`,
  ].join("\n");
}

// ---- Abuse controls (best effort: memory is per serverless instance) ----
const WINDOW_MS = 60_000;
const PER_MINUTE = 5;
const PER_DAY = 40;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string, now = Date.now()): boolean {
  const day = now - 86_400_000;
  const list = (hits.get(ip) ?? []).filter((t) => t > day);
  const lastMinute = list.filter((t) => t > now - WINDOW_MS).length;
  if (lastMinute >= PER_MINUTE || list.length >= PER_DAY) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5_000) hits.clear();
  return false;
}

/**
 * Claude 5.x models think by default, and thinking tokens count toward max_tokens.
 * A short narrative needs no reasoning, so thinking is turned off on Haiku (which allows it);
 * other models keep thinking and get room for it, so the text is never cut off.
 */
export function messagesRequest(model: string, prompt: string) {
  const base = { model, system: SYSTEM_PROMPT, messages: [{ role: "user", content: prompt }] };
  return model.startsWith("claude-haiku")
    ? { ...base, max_tokens: 300, thinking: { type: "disabled" } }
    : { ...base, max_tokens: 2_000 };
}

type ContentBlock = { type: string; text?: string };

/** Joins every text block; ignores thinking and any other block types. */
export function extractText(data: { content?: ContentBlock[] }): string {
  return (data.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("")
    .trim();
}

export function resetRateLimit() {
  hits.clear();
}

function header(req: Req, name: string): string {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function originAllowed(origin: string, env: Record<string, string | undefined>): boolean {
  if (!origin) return false;
  const allowed = (env.ALLOWED_ORIGINS ?? "https://rev-sync.app,https://www.rev-sync.app")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes(origin)) return true;
  // Vercel preview deployments of this project
  if (env.VERCEL_ENV === "preview" && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  const env = process.env;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!originAllowed(header(req, "origin"), env)) {
    console.warn("Narrative refused: origin not allowed");
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const ip = header(req, "x-forwarded-for").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (rateLimited(ip)) {
    console.warn("Narrative refused: rate limit");
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Narrative refused: ANTHROPIC_API_KEY is not set");
    return res.status(503).json({ error: "AI narrative is not configured." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Body must be valid JSON." });
    }
  }
  const payload = validatePayload(body);
  if (typeof payload === "string") {
    console.warn(`Narrative refused: ${payload}`);
    return res.status(400).json({ error: payload });
  }

  const model = env.ANTHROPIC_MODEL || "claude-haiku-5-5";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9_000);
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(messagesRequest(model, buildPrompt(payload))),
    });
    if (!upstream.ok) {
      // Log status only; never log the key or the full upstream body.
      console.error(`Anthropic API error ${upstream.status}`);
      return res.status(502).json({ error: "The AI service did not respond correctly." });
    }
    const data = (await upstream.json()) as { content?: ContentBlock[]; stop_reason?: string };
    const text = extractText(data);
    if (!text) {
      console.error(`Anthropic response had no text (stop_reason: ${data.stop_reason ?? "unknown"})`);
      return res.status(502).json({ error: "Empty response from the AI service." });
    }
    return res.status(200).json({ text, model });
  } catch (err) {
    console.error(`Narrative request failed: ${(err as Error).name}`);
    return res.status(504).json({ error: "The AI service timed out." });
  } finally {
    clearTimeout(timer);
  }
}
