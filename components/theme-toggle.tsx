"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard hydration-safe mount flag (theme is only known client-side) —
    // this single synchronous update on mount is the documented next-themes pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag, not a derived-state sync loop
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className={`relative inline-flex items-center justify-center size-9 rounded-md hairline text-ink/70 hover:text-ink hover:bg-paper transition-colors duration-150 ${className ?? ""}`}
    >
      {mounted && (
        <>
          <Sun
            className={`absolute size-4 transition-all duration-300 ${isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
          />
          <Moon
            className={`absolute size-4 transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`}
          />
        </>
      )}
    </button>
  );
}
