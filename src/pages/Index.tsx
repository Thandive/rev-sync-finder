import { Link } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { CookieNotice } from "@/components/CookieNotice";

type ToolCard = {
  name: string;
  description: string;
  href: string;
  status?: string;
};

const TOOLS: ToolCard[] = [
  {
    name: "Revenue Leakage Calculator",
    description:
      "Quantify annual revenue leakage across your Quote-to-Cash stack in under 2 minutes.",
    href: "/calculator",
  },
  {
    name: "Pipeline Coverage Storyteller",
    description:
      "Translate pipeline data into a VP-ready narrative with gap analysis and AI-generated recommendations.",
    href: "/pipeline",
    status: "WIP",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground fade-in flex flex-col">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-5 md:px-8 py-12 md:py-20">
        <section className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-label mb-4">
            // RevOps Suite
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            RevOps Intelligence <span className="text-primary">Suite</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-foreground/80 leading-relaxed">
            Client-side tools for Revenue Operations professionals. No data stored.
          </p>
        </section>

        <section className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-px bg-border-faint border border-border-faint">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              to={tool.href}
              className="group block bg-card p-6 md:p-8 hover:bg-secondary transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <span className="text-xs uppercase tracking-[0.2em] text-label">
                  Tool
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-primary">
                  {tool.status ?? "Live"}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug text-foreground">
                {tool.name}{tool.status === "WIP" ? " (WIP)" : ""}
              </h2>
              <p className="mt-3 text-sm md:text-base text-foreground/80 leading-relaxed">
                {tool.description}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary border-b border-primary/40 group-hover:border-primary pb-1 transition-colors">
                Open tool
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-12 md:mt-16 max-w-2xl border-l-2 border-primary pl-4 py-2">
          <p className="text-xs uppercase tracking-[0.2em] text-label-low leading-relaxed">
            All calculations run in your browser. Inputs never leave your device.
          </p>
        </section>
      </main>

      <footer className="border-t border-border-faint mt-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col items-center text-center gap-4">
          <p className="text-sm text-foreground/80 max-w-xl leading-relaxed">
            Built by{" "}
            <a
              href="https://thandive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Thandive Sila
            </a>
            . · Revenue & Billing Operations
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
          <p className="text-xs text-label leading-relaxed uppercase tracking-[0.12em]">
            Estimates are indicative only and based on industry benchmarks. Not financial advice.
          </p>
        </div>
      </footer>
      <CookieNotice />
    </div>
  );
};

export default Index;
