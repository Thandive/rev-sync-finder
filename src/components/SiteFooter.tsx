export function SiteFooter({ note }: { note?: string }) {
  return (
    <footer className="border-t border-border-faint mt-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col items-center text-center gap-4">
        <p className="text-sm text-foreground/80 max-w-xl leading-relaxed">
          Built by Thandive Sila · Revenue Operations &amp; Systems · 8+ years in B2B SaaS
        </p>
        <div className="flex gap-5 text-xs uppercase tracking-[0.2em]">
          <a
            href="https://www.linkedin.com/in/thandive"
            target="_blank"
            rel="noopener noreferrer"
            className="text-label-low hover:text-primary transition-colors"
          >
            LinkedIn
          </a>
        </div>
        <p className="text-xs text-label leading-relaxed max-w-2xl">
          {note ??
            "Estimates come from your inputs and the working assumptions shown on each page. Indicative only, not financial advice."}
        </p>
      </div>
    </footer>
  );
}
