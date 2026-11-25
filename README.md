# Rev-Sync

Free Revenue Operations tools for B2B SaaS teams. Live at **[rev-sync.app](https://rev-sync.app)**.

| Tool | What it answers |
|---|---|
| [Revenue Leakage Calculator](https://rev-sync.app/calculator) | How much does our Quote-to-Cash process lose each year, and where? |
| [Pipeline Coverage Storyteller](https://rev-sync.app/pipeline) | Can this quarter's pipeline cover the number, and how do I say that to a VP? |

Both tools run in the browser and store nothing. The one exception is the optional AI narrative, described below.

Amounts display in USD by default, with a switch for EUR and GBP. The switch changes the symbol only: you enter your own figures, so nothing is converted.

Built by [Thandive Sila](https://www.linkedin.com/in/thandive): 8+ years running billing and revenue operations (Salesforce, NetSuite, Zuora) in B2B SaaS. The models encode the failure points I have seen in real Quote-to-Cash stacks.

---

## Revenue Leakage Calculator

Ten inputs go in. One total comes out, split into six categories. Each category shows its formula with the user's own numbers, so every figure can be checked by hand.

| Group | Category | Formula |
|---|---|---|
| Revenue leakage | Uninvoiced deals | new bookings × % uninvoiced at 60 days × % never recovered |
| | Invoice discrepancies | ARR × % invoices mismatched (by answer) × net loss per mismatch |
| | Informal credit notes | ARR × write-down rate (by credit-note process answer) |
| | CRM data quality | ARR × % bad records × impact per record × systems factor |
| Cost to operate | Billing delay | new bookings × days to invoice ÷ 365 × cost of capital |
| | Manual reconciliation | accounts (ARR ÷ ACV) × 12 × minutes per account × systems factor ÷ 60 × hourly cost |

*New bookings = deals per month × 12 × ACV.*

**Total exposure = revenue leakage + cost to operate.** The risk score is total exposure as a share of ARR: LOW below 1%, MEDIUM 1–3%, HIGH 3–6%, CRITICAL 6% and above.

### Working assumptions

The model needs some rates nobody can answer from memory, such as how many late deals are never billed. These are **working assumptions**: Rev-Sync's own, chosen to be conservative. They are not sourced industry benchmarks, and the UI says so. Every one of them is editable in the *Working assumptions* panel, and both exports list the values used.

| Assumption | Default |
|---|---|
| Uninvoiced deals never billed or collected | 15% |
| Invoices mismatched: Rarely / Occasionally / Frequently | 1% / 6% / 15% (midpoints of the answer labels) |
| Net value lost on a mismatched invoice | 5% |
| ARR written down via informal credit notes: Yes / Ad hoc / No | 0.05% / 0.15% / 0.4% |
| Revenue lost on a record with bad billing data | 1.5% |
| Cost of capital | 8% / year |
| Reconciliation effort: Manual / Partial / Automated | 6 / 3 / 0.5 min per account per month |
| Systems factor: 1 / 2 / 3+ | × 0.5 / 1 / 1.75 |
| Loaded hourly cost | 40 (in the selected currency) |

With the default inputs ($5M ARR, 10 deals a month at $20K) the estimate is **$61,890 a year, 1.24% of ARR, MEDIUM**.

Exports: PDF and CSV, each with inputs, assumptions, every category with its formula, subtotals and the total.

## Pipeline Coverage Storyteller

- **Quarter target** = annual quota ÷ 4; **still needed** = target − closed-won this quarter.
- **Weighted pipeline** = Σ stage value × stage win rate.
- **Time-adjusted (can close this quarter)**: a stage whose average days-to-close is longer than the days left only partly lands this quarter. Each stage's weighted value is multiplied by min(days left ÷ days to close, 1).
- **Coverage** = time-adjusted weighted pipeline ÷ still needed. ≥100% on track · 80–99% at risk · 50–79% behind · <50% critical.
- **Timing slip** = the stage with the most weighted value expected to win, but after quarter end.

The page loads with sample data (win rates rise and cycles shorten stage by stage) so it tells a story on first view.

### VP-ready narrative (AI)

`Generate` calls a Vercel serverless function, [`api/narrative.ts`](api/narrative.ts), which calls the Claude API (Anthropic).

- The API key lives only in the server environment. It is never sent to the browser.
- The browser sends **numbers only**. The function validates every field (type, range, allowed stage ids) and builds the prompt itself, so the endpoint cannot be used as a general-purpose proxy to the model.
- Origin allow-list, per-IP rate limit (5 a minute, 40 a day per instance), `max_tokens: 400`, 9-second timeout. The hard cost cap is the monthly spend limit on the API key's workspace.
- If the function is unavailable, not configured or rate-limited, the page shows a **rule-based narrative** built from the same numbers, labelled as such. The button always produces something, and always says which kind it is.

## Stack

React 18 · TypeScript · Vite · Tailwind · Vitest. Hosted on Vercel (static site + one Node serverless function). Fonts are self-hosted; the site makes no third-party requests.

```
api/narrative.ts            serverless function (Claude API call, validation, rate limit)
src/lib/calculations.ts     leakage model (pure functions)
src/lib/pipeline.ts         pipeline model + rule-based narrative (pure functions)
src/lib/narrative.ts        client: calls the function, falls back to rules
src/lib/exports.ts          PDF and CSV export (loaded on demand)
src/pages/                  Index, Calculator, Pipeline
src/components/             ResultsPanel, AssumptionsPanel, shared UI
```

## Run locally

```sh
npm install
npm run dev        # http://localhost:8080 (the AI narrative falls back to rules without the function)
npm test           # 60 tests: models, exports, the function and the client fallback
npm run lint
npm run build
```

To run the serverless function locally, use `vercel dev` with `ANTHROPIC_API_KEY` set (see [`.env.example`](.env.example)).

## Deploy

Vercel builds from `main`. Environment variables (Project → Settings → Environment Variables):

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | for the AI narrative | Server-side only. Never prefix with `VITE_`. |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-haiku-5-5`. |
| `ALLOWED_ORIGINS` | no | Defaults to `https://rev-sync.app,https://www.rev-sync.app`. |

## Roadmap

- **CRM ↔ billing reconciliation**: upload Salesforce and NetSuite CSV exports, map fields, list orphan records and value mismatches, processed in the browser.

---

Estimates are indicative only and not financial advice.
