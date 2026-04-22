export function V2Panel() {
  return (
    <div className="border border-border bg-card/50 rounded-sm p-8 md:p-12 text-center fade-in">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-primary/60 text-primary text-[10px] font-mono-tabular uppercase tracking-[0.25em] mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Coming Soon
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground/80 mb-4">
        Reconciliation Engine
      </h2>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        V2 will support direct CSV upload from Salesforce and NetSuite, automated
        field mapping, and orphan record identification — moving from leakage
        estimation to actual system reconciliation.
      </p>
      <div className="mt-8 inline-flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground">
        <span>Notify me when V2 launches:</span>
        <a
          href="https://www.linkedin.com/in/thandive"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono-tabular"
        >
          linkedin.com/in/thandive
        </a>
      </div>
    </div>
  );
}