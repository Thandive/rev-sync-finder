import { NavLink } from "react-router-dom";

const linkBase = "px-3 py-1.5 rounded-none uppercase tracking-[0.16em] text-xs border transition-colors whitespace-nowrap";
const linkInactive = "border-transparent text-label-low hover:text-foreground hover:border-border";
const linkActive = "border-primary text-primary";

const TOOLS = [
  { to: "/calculator", label: "Leakage Calculator", short: "Leakage" },
  { to: "/pipeline", label: "Pipeline Storyteller", short: "Pipeline" },
];

export function AppNav() {
  return (
    <div className="border-b border-border-faint bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-3 flex items-center gap-2 overflow-x-auto">
        <NavLink to="/" end className="flex items-center gap-2 shrink-0" aria-label="Rev-Sync home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="12" r="6" stroke="hsl(var(--primary))" strokeWidth="2" />
            <circle cx="15" cy="12" r="6" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
          </svg>
          <span className="text-sm font-semibold tracking-[0.08em] uppercase text-foreground">Rev-Sync</span>
        </NavLink>
        <span className="h-5 w-px bg-border mx-2 md:mx-3 shrink-0" aria-hidden="true" />
        <nav className="flex items-center gap-1.5" aria-label="Tools">
          {TOOLS.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default AppNav;
