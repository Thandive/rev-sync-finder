import { NavLink } from "react-router-dom";

const linkBase =
  "px-3 py-1.5 uppercase tracking-[0.18em] text-xs border transition-colors";
const linkInactive = "border-transparent text-label-low hover:text-foreground";
const linkActive = "border-primary text-primary";

export function AppNav() {
  return (
    <div className="border-b border-border-faint bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase tracking-[0.25em] text-label mr-2 shrink-0">
          RevOps Suite //
        </span>
        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Home
          </NavLink>
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
            Pipeline Storyteller
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

export default AppNav;