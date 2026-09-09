import { apps } from "@/lib/creative/registry.generated";
import { JourneyDag } from "@/components/journey/JourneyDag";

export default function JourneyDagPage() {
  return (
    <main className="flex h-svh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold leading-tight">Journey (DAG, experimental)</h1>
          <p className="text-xs text-foreground/60">
            React Flow + ELK auto-layout sandbox — not yet the primary view.
          </p>
        </div>
        <a
          href="#journey-dag-list"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-1 focus:text-sm focus:ring-2 focus:ring-ring"
        >
          Skip to list
        </a>
      </header>
      <JourneyDag apps={apps} />
    </main>
  );
}
