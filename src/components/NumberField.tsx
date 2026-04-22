import { useEffect, useState } from "react";

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * Controlled numeric input that allows the field to be empty mid-edit.
 * Min/max are only enforced on blur.
 */
export function NumberField({
  value,
  onChange,
  min = 0,
  max,
  className,
  id,
  ariaLabel,
}: Props) {
  const [display, setDisplay] = useState<string>(String(value));

  // Sync external changes (e.g. preset reset) into the display
  useEffect(() => {
    setDisplay((prev) => (prev === "" ? prev : String(value)));
  }, [value]);

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="number"
      inputMode="numeric"
      value={display}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = e.target.value;
        setDisplay(raw);
        if (raw === "") return; // allow blank mid-edit
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => {
        if (display === "" || !Number.isFinite(Number(display))) {
          onChange(min);
          setDisplay(String(min));
          return;
        }
        let n = Number(display);
        if (n < min) n = min;
        if (max !== undefined && n > max) n = max;
        onChange(n);
        setDisplay(String(n));
      }}
      className={className}
    />
  );
}