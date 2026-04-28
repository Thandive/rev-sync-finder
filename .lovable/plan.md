## Visibility, Footer & Link Cleanup

Three focused changes: brighten dim text, remove the Portfolio link, and recenter the footer with Thandive Sila linked to thandive.com.

### 1. Brighten secondary text + bump size

The terminal aesthetic relies on dimmed gray labels (`text-label`, `text-label-low`, `text-label-mid` → all in the #444–#666 range). The user finds these too faint. Solution: redefine the dim tokens in `src/index.css` so the existing class names automatically become brighter app-wide, plus nudge a few small font sizes up.

**Token remap in `src/index.css` `:root`:**
- `--label-low: 0 0% 88%` (was 40% / #666 → now matches `--foreground`)
- `--label-mid: 0 0% 80%` (was 33% / #555)
- `--label: 0 0% 65%` (was 27% / #444 — kept slightly dimmer for true micro-captions like the disclaimer/footnotes, but far more readable than #444)

This single change brightens every `text-label-*` usage across `Index.tsx`, `ResultsPanel.tsx`, `V2Panel.tsx`, `CookieNotice.tsx`, `SegmentedControl.tsx` without touching call sites.

**Size bumps (targeted, in `Index.tsx` and `ResultsPanel.tsx`):**
- Hero subtitle paragraph: `text-xs md:text-sm` → `text-sm md:text-base`
- Risk Score narrative paragraph: `text-xs` → `text-sm`
- Leakage breakdown row labels/values: `text-[11px]` → `text-xs` (12px)
- Footer "Built by…" line: `text-[11px]` → `text-sm`
- The 10px ALL-CAPS terminal labels (section headers, metric captions, slider min/max) stay at 10px — they're intentional micro-typography and bumping them would break the Bloomberg aesthetic.

### 2. Remove "View Portfolio"

Delete the entire `<a href="https://www.revenue.thandive.com">View Portfolio</a>` block in the footer of `src/pages/Index.tsx`.

### 3. Centered footer with Thandive Sila link

Replace the current `flex md:justify-between` footer layout with a fully centered stack. "Thandive Sila" becomes a link to `https://thandive.com` (new tab, `rel="noopener noreferrer"`, accent hover).

**New footer structure (`src/pages/Index.tsx`):**
```
<footer> (border-t)
  max-w-7xl mx-auto px-... py-8
  flex flex-col items-center text-center gap-4
    <p>  Built by <a href="https://thandive.com" …>Thandive Sila</a>. · Revenue & Billing Operations · 8+ years in B2B SaaS  </p>
    <div flex gap-5> LinkedIn </div>     ← only LinkedIn remains
    <p> Estimates are indicative only … </p>
```

Everything centers horizontally regardless of viewport. LinkedIn link keeps its existing styling (now brighter via the token remap).

### Files touched

- `src/index.css` — remap `--label`, `--label-mid`, `--label-low` HSL values
- `src/pages/Index.tsx` — footer rewrite (center, remove Portfolio, link Thandive Sila), font-size bumps on hero subtitle and footer "Built by" line
- `src/components/ResultsPanel.tsx` — font-size bumps on narrative + breakdown rows

### Out of scope

- No changes to calculations, state, or data flow
- No changes to the 10px uppercase micro-labels (intentional design)
- No new dependencies
- Dark theme and `#00ff88` accent fully preserved
