"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// True when this page is rendered inside an iframe (the detail-page embed).
// useSyncExternalStore reads a client-only value with no hydration mismatch.
function useIsEmbedded(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => window.self !== window.top,
    () => false,
  );
}

type PlayShellProps = {
  /** App slug; the Back link points to the detail page at /<slug>. */
  slug: string;
  title: string;
  /** Attribution shown in the footer (standalone only). */
  attribution: ReactNode;
  /** Optional controls rendered in the header (buttons, sliders). */
  controls?: ReactNode;
  /** Accessible description of the visual for screen readers. */
  visualLabel: string;
  /** The canvas / interactive visual. */
  children: ReactNode;
};

/**
 * Standard chrome for every /play sketch. When embedded in the detail page's
 * iframe it renders only the visual (no header/footer), so the detail page's
 * own header is the single source of chrome. Standalone it shows a theme-aware
 * header (Back to detail, title, controls, theme toggle) and an attribution
 * footer.
 */
export function PlayShell({
  slug,
  title,
  attribution,
  controls,
  visualLabel,
  children,
}: PlayShellProps) {
  const embedded = useIsEmbedded();

  if (embedded) {
    return (
      <main className="h-dvh w-full bg-background" aria-label={visualLabel}>
        {children}
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium tracking-wide">{title}</h1>
        {controls}
        <ThemeToggle />
      </header>

      <section className="relative min-h-0 flex-1" aria-label={visualLabel}>
        {children}
      </section>

      <footer className="shrink-0 border-t border-border px-4 py-3 text-xs text-foreground/70 sm:px-6">
        {attribution}
      </footer>
    </main>
  );
}
