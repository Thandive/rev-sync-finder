import { cn } from "@/lib/utils";

interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}

export function SegmentedControl<T extends string>({ options, value, onChange, labels }: Props<T>) {
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
              "px-3 py-2 text-[11px] uppercase tracking-[0.14em] rounded-none border transition-colors leading-tight",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
              active
                ? "border-primary text-primary bg-transparent"
                : "bg-transparent text-label-mid border-rule hover:border-primary/60 hover:text-primary"
            )}
          >
            {labels?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}
