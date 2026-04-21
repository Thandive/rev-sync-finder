

## Add Cookie Notice Banner

Add a lightweight, dismissible cookie notice that appears at the bottom of the page on first visit and remembers the user's choice via `localStorage`.

### What the user will see

- On first visit, a slim banner slides in at the bottom of the viewport.
- Banner text: "We use only essential cookies to remember your preferences. No tracking, no analytics, no data stored on our servers."
- Two actions: **Accept** (primary, electric green) and **Decline** (ghost button).
- Either choice dismisses the banner and persists the decision — banner does not reappear on future visits.
- Styled to match the existing clinical dark aesthetic (bg `#0a0a0a`, border, mono-tabular accent text).

```text
┌──────────────────────────────────────────────────────────────┐
│  We use only essential cookies...        [Decline] [Accept]  │
└──────────────────────────────────────────────────────────────┘
```

### Note on accuracy

The current footer says "No cookies. No data stored." Since this banner introduces a `localStorage` entry (technically client-side storage, not a cookie, but commonly disclosed), the footer line will be softened to: "No tracking. No backend. All calculations run client-side."

### Technical details

- **New file:** `src/components/CookieNotice.tsx` — a self-contained component using `useState` + `useEffect` to read/write `localStorage` key `revsync-cookie-consent` (`"accepted" | "declined"`).
- **Mount point:** Rendered once inside `src/pages/Index.tsx` at the end of the root `div`, fixed-positioned at `bottom-0` with `z-50`.
- **Styling:** Tailwind only — `fixed bottom-4 left-4 right-4 md:left-auto md:max-w-xl`, existing `border-border`, `bg-background`, `text-foreground`, primary button reuses the green accent.
- **Animation:** Subtle fade-in via the existing `fade-in` class — consistent with the "no animations except subtle fade-in" rule.
- **Footer copy update:** One-line change in `src/pages/Index.tsx` footer disclaimer area.
- No new dependencies. No backend. No third-party cookie service.

