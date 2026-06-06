"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apps } from "@/lib/creative/registry.generated";
import { Catalog } from "@/components/catalog";
import { JourneyView } from "@/components/journey/JourneyView";
import { ThemeToggle } from "@/components/theme-toggle";

type View = "journey" | "catalog";

function ViewToggle({ current, onChange }: { current: View; onChange: (v: View) => void }) {
  return (
    <div role="group" aria-label="View" className="flex rounded-md border border-border text-sm">
      {(["journey", "catalog"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={current === v}
          onClick={() => onChange(v)}
          className={[
            "px-3 py-1.5 first:rounded-l-md last:rounded-r-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10",
            current === v
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:text-foreground hover:bg-accent",
          ].join(" ")}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get("view");
  const view: View = raw === "catalog" ? "catalog" : "journey";

  function setView(v: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "journey") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            creative-coding-library
          </h1>
          <p className="mt-2 text-sm text-foreground/70 sm:text-base">
            30 generative-art sketches. Built to be broken.
          </p>
          <p className="mt-1 max-w-2xl text-sm text-foreground/50">
            Each sketch teaches one concept. Predict what it does, run it, break it, fix it, explain
            it.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mb-6">
        <ViewToggle current={view} onChange={setView} />
      </div>

      {view === "journey" ? <JourneyView apps={apps} /> : <Catalog apps={apps} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
