import { useEffect, useState } from "react";

const STORAGE_KEY = "revsync-cookie-consent";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable — do not show banner
    }
  }, []);

  const dismiss = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fade-in fixed bottom-4 left-4 right-4 md:left-auto md:max-w-xl z-50 border border-border-faint bg-card rounded-none p-4 md:p-5"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-[11px] text-foreground/80 leading-relaxed flex-1">
          <span className="text-primary text-[10px] uppercase tracking-[0.25em] block mb-1">
            Notice
          </span>
          We use only essential cookies to remember your preferences. No tracking, no analytics, no data stored on our servers.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => dismiss("declined")}
            className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 border border-rule rounded-none text-label-mid hover:text-foreground hover:border-foreground transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => dismiss("accepted")}
            className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-none bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}