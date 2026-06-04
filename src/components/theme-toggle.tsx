"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const ORDER = ["system", "light", "dark"] as const;
type ThemeChoice = (typeof ORDER)[number];

function isThemeChoice(value: string | undefined): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // next-themes returns undefined until mounted, so server and first client
  // render both show the system icon; no setState-in-effect needed.
  const current: ThemeChoice = isThemeChoice(theme) ? theme : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length] ?? "system";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Theme: ${current}. Activate to switch to ${next}.`}
      title={`Theme: ${current}`}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
