

## Update Footer Content

Edit the footer in `src/pages/Index.tsx` to replace the existing text and links with the new copy and real URLs.

### New footer structure

- **Line 1 (attribution):** "Built by Thandive Sila. · Revenue & Billing Operations · 8+ years in B2B SaaS"
- **Links row:**
  - LinkedIn → `https://www.linkedin.com/in/thandive` (opens in new tab)
  - Portfolio → `https://www.revenue.thandive.com` (opens in new tab)
- **Line 2 (disclaimer, smaller/muted):** "Estimates are indicative only and based on industry benchmarks. Not financial advice."

### Layout

Keep the existing two-part footer layout (text left, links right on desktop; stacked on mobile). Add the disclaimer as a third row spanning the full width below both, in muted small text, to keep it visually distinct from the attribution.

```text
┌─────────────────────────────────────────────────────────────┐
│ Built by Thandive Sila. · Revenue & ...   [LinkedIn] [Portfolio] │
│ Estimates are indicative only and based on ... Not financial advice. │
└─────────────────────────────────────────────────────────────┘
```

### Technical details

- File touched: `src/pages/Index.tsx` (footer block only).
- Links use `target="_blank"` and `rel="noopener noreferrer"` since they point to external sites.
- Reuse existing Tailwind classes (`text-xs`, `text-muted-foreground`, `hover:text-primary`) for visual consistency — no new styles or dependencies.

