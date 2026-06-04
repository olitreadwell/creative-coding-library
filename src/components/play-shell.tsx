"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Mode = "standalone" | "preview" | "controls";

// Detects how this /play page is being shown:
// - standalone: opened directly (full chrome).
// - preview: embedded in the detail "Info" view (visual only, no chrome).
// - controls: embedded in the detail "Full screen" view (visual + a bottom
//   bar holding the configurable options).
// useSyncExternalStore reads these client-only values without a hydration
// mismatch (server snapshot = "standalone").
function useMode(): Mode {
  return useSyncExternalStore(
    () => () => {},
    () => {
      if (window.self === window.top) return "standalone";
      const embed = new URLSearchParams(window.location.search).get("embed");
      return embed === "controls" ? "controls" : "preview";
    },
    () => "standalone",
  );
}

type PlayShellProps = {
  slug: string;
  title: string;
  attribution: ReactNode;
  /** Configurable options (buttons, sliders). Shown in the bottom bar. */
  controls?: ReactNode;
  /** Accessible description of the visual for screen readers. */
  visualLabel: string;
  children: ReactNode;
};

export function PlayShell({
  slug,
  title,
  attribution,
  controls,
  visualLabel,
  children,
}: PlayShellProps) {
  const mode = useMode();

  const visual = (
    <div className="relative min-h-0 flex-1" aria-label={visualLabel} role="group">
      {children}
    </div>
  );

  const controlsBar =
    controls != null ? (
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-2 sm:px-6">
        {controls}
      </div>
    ) : null;

  // Embedded in the Info view: just the visual, no chrome.
  if (mode === "preview") {
    return (
      <main className="relative h-dvh w-full bg-background" aria-label={visualLabel}>
        {children}
      </main>
    );
  }

  // Embedded in the Full screen view: visual + bottom controls bar only.
  if (mode === "controls") {
    return (
      <main className="flex h-dvh w-full flex-col bg-background">
        {visual}
        {controlsBar}
      </main>
    );
  }

  // Standalone: full chrome.
  return (
    <main className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate px-2 text-center text-sm font-medium tracking-wide">
          {title}
        </h1>
        <ThemeToggle />
      </header>
      {visual}
      {controlsBar}
      <footer className="shrink-0 border-t border-border px-4 py-3 text-xs text-foreground/70 sm:px-6">
        {attribution}
      </footer>
    </main>
  );
}
