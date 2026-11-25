import { Link } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { SiteFooter } from "@/components/SiteFooter";

type ToolCard = {
  name: string;
  description: string;
  points: string[];
  href?: string;
  status: "Live" | "Planned";
};

const TOOLS: ToolCard[] = [
  {
    name: "Revenue Leakage Calculator",
    description: "Estimate what your Quote-to-Cash process loses each year, and where.",
    points: [
      "Ten questions, one total, six categories",
      "Every figure shows its formula",
      "Editable assumptions · PDF and CSV export",
    ],
    href: "/calculator",
    status: "Live",
  },
  {
    name: "Pipeline Coverage Storyteller",
    description: "Check whether this quarter's pipeline can cover the number, and say it in plain words.",
    points: [
      "Weighted and time-adjusted coverage by stage",
      "Gap, deals needed and timing slip",
      "AI-written VP-ready narrative",
    ],
    href: "/pipeline",
    status: "Live",
  },
  {
    name: "CRM ↔ Billing Reconciliation",
    description: "Upload Salesforce and NetSuite exports, map fields, and list orphan records and value mismatches.",
    points: ["CSV upload and field mapper", "Orphan record and amount matching", "Processed in the browser"],
    status: "Planned",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground fade-in flex flex-col">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-5 md:px-8 py-12 md:py-20">
        <section className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-label mb-4">// Revenue Operations tools</div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Revenue integrity, <span className="text-primary">in numbers</span>.
          </h1>
          <p className="mt-5 text-base md:text-lg text-foreground/80 leading-relaxed">
            Free tools for RevOps and Finance teams in B2B SaaS. They run in your browser, store nothing, and show their
            working.
          </p>
        </section>

        <section className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-border-faint border border-border-faint">
          {TOOLS.map((tool) => {
            const body = (
              <>
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-label">Tool</span>
                  <span className={`text-xs uppercase tracking-[0.2em] ${tool.status === "Live" ? "text-primary" : "text-label-mid"}`}>
                    {tool.status}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug text-foreground">{tool.name}</h2>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{tool.description}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-label-mid">
                  {tool.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-primary" aria-hidden="true">›</span>
                      {p}
                    </li>
                  ))}
                </ul>
                {tool.href && (
                  <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary border-b border-primary/40 group-hover:border-primary pb-1 transition-colors">
                    Open tool <span aria-hidden="true">→</span>
                  </div>
                )}
              </>
            );
            return tool.href ? (
              <Link key={tool.name} to={tool.href} className="group block bg-card p-6 md:p-8 hover:bg-secondary transition-colors">
                {body}
              </Link>
            ) : (
              <div key={tool.name} className="bg-card/60 p-6 md:p-8">
                {body}
              </div>
            );
          })}
        </section>

        <section className="mt-12 md:mt-16 max-w-3xl border-l-2 border-primary pl-4 py-2 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-label-low leading-relaxed">
            No accounts, no tracking, no cookies. Inputs stay in your browser.
          </p>
          <p className="text-xs text-label leading-relaxed">
            The one exception is the optional AI narrative in the Pipeline Storyteller: when you ask for it, the pipeline
            figures (numbers only) are sent to an AI model to write the text.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
