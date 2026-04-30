import { NavLink } from "react-router-dom";

const linkBase =
  "px-4 py-1.5 rounded-full uppercase tracking-[0.18em] text-xs border transition-colors whitespace-nowrap";
const linkInactive =
  "border-transparent text-label-low hover:text-foreground hover:border-border";
const linkActive =
  "bg-primary text-primary-foreground border-primary hover:text-primary-foreground";

export function AppNav() {
  return (
    <div className="border-b border-border-faint bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
        <NavLink
          to="/"
          end
          className="text-xs uppercase tracking-[0.25em] font-semibold text-foreground shrink-0"
        >
          RevSync Suite
        </NavLink>
        <span className="h-5 w-px bg-border mx-3 shrink-0" aria-hidden="true" />
        <nav className="flex items-center gap-2">
          <NavLink
            to="/calculator"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Revenue Leakage Calculator
          </NavLink>
          <NavLink
            to="/pipeline"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Pipeline Storyteller (WIP)
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

export default AppNav;