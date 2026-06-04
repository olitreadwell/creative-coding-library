"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Mode = "standalone" | "preview" | "controls";

// Detects how this /play page is being shown:
// - standalone: opened directly (full chrome).
// - preview: embedded with no bottom bar (visual only).
// - controls: embedded with the bottom bar (attribution + configurable options).
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
  /** Attribution shown at the bottom-left of the bottom bar. */
  attribution: ReactNode;
  /** Configurable options (buttons, sliders) shown at the bottom-right. */
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

  // Single bottom bar: attribution on the left, configurable options on the right.
  const bottomBar = (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-background px-4 py-2 sm:px-6">
      <div className="min-w-0 flex-1 text-xs text-foreground/70">{attribution}</div>
      {controls != null ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{controls}</div>
      ) : null}
    </div>
  );

  // Embedded with no bottom bar: just the visual.
  if (mode === "preview") {
    return (
      <main className="relative h-dvh w-full bg-background" aria-label={visualLabel}>
        {children}
      </main>
    );
  }

  // Embedded with the bottom bar (attribution + controls).
  if (mode === "controls") {
    return (
      <main className="flex h-dvh w-full flex-col bg-background text-foreground">
        {visual}
        {bottomBar}
      </main>
    );
  }

  // Standalone: header (Back to detail, title, theme) + visual + bottom bar.
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
      {bottomBar}
    </main>
  );
}
