import { cn } from "@/lib/utils";

interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-3 py-2.5 text-xs font-medium rounded-sm border transition-colors",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:border-primary/50 hover:text-primary"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
