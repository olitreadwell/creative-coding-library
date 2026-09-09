"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePlaying, togglePlaying } from "@/lib/creative/motion";

type Mode = "standalone" | "preview" | "controls";

// Detects how this /play page is being shown:
// - standalone: opened directly (full chrome).
// - preview: embedded with no bottom bar (visual only).
// - controls: embedded with the bottom bar (attribution + configurable options).
//
// The server snapshot is "controls": it carries no header, so the embedded
// detail-page iframe never flashes the standalone back-bar during hydration.
// A directly-opened page upgrades to "standalone" on the client.
function useMode(): Mode {
  return useSyncExternalStore(
    () => () => {},
    () => {
      if (window.self === window.top) return "standalone";
      const embed = new URLSearchParams(window.location.search).get("embed");
      return embed === "controls" ? "controls" : "preview";
    },
    () => "controls",
  );
}

const motionBtnClass =
  "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1 text-sm text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Global Play/Pause for the sketch's motion. usePlaying() reads the shared store
// via useSyncExternalStore: the server snapshot is "playing", so SSR and the
// first client render agree (no hydration mismatch), then the real
// reduced-motion-aware value applies right after.
function MotionToggle() {
  const playing = usePlaying();

  return (
    <button
      type="button"
      onClick={() => togglePlaying()}
      aria-pressed={playing}
      aria-label={playing ? "Pause animation" : "Play animation"}
      className={motionBtnClass}
    >
      {playing ? (
        <Pause className="size-4" aria-hidden="true" />
      ) : (
        <Play className="size-4" aria-hidden="true" />
      )}
      <span>{playing ? "Pause" : "Play"}</span>
    </button>
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
  /** Whether the sketch animates. Static sketches hide the Play/Pause toggle. */
  animated?: boolean;
  children: ReactNode;
};

export function PlayShell({
  slug,
  title,
  attribution,
  controls,
  visualLabel,
  animated = true,
  children,
}: PlayShellProps) {
  const mode = useMode();
  const showHeader = mode === "standalone";
  const showBottomBar = mode !== "preview";

  // One stable, keyed tree across all modes. Switching mode only toggles the
  // header/bottom-bar; the visual keeps its identity (key="visual") so the
  // canvas never remounts and its size-fit logic measures a settled layout.
  return (
    <main className="flex h-dvh w-full flex-col bg-background text-foreground">
      {showHeader ? (
        <header
          key="header"
          className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 sm:gap-3 sm:px-6"
        >
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
      ) : null}

      <div key="visual" className="relative min-h-0 flex-1" aria-label={visualLabel} role="group">
        {children}
      </div>

      {showBottomBar ? (
        <div
          key="bottombar"
          className="flex max-h-[45dvh] shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 overflow-y-auto border-t border-border bg-background px-4 py-2 sm:px-6"
        >
          <div className="min-w-[8rem] shrink text-xs text-foreground/70">{attribution}</div>
          <div className="flex min-w-0 grow flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {animated ? <MotionToggle /> : null}
            {controls}
          </div>
        </div>
      ) : null}
    </main>
  );
}
