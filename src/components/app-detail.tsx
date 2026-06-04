"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import type { AppMeta } from "@/lib/creative/registry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

type AppDetailProps = {
  meta: AppMeta;
  synopsis: ReactNode;
  tutorial: ReactNode;
};

export function AppDetail({ meta, synopsis, tutorial }: AppDetailProps) {
  // The live example fills the screen by default; minimise to read the docs.
  const [expanded, setExpanded] = useState(true);
  const playHref = `/${meta.slug}/play`;

  const headerBtn =
    "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Catalog</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium tracking-wide sm:text-base">
          {meta.title}
        </h1>

        {expanded ? (
          <>
            <a href={playHref} target="_blank" rel="noopener noreferrer" className={headerBtn}>
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New tab</span>
            </a>
            <button type="button" onClick={() => setExpanded(false)} className={headerBtn}>
              <Minimize2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Minimise</span>
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setExpanded(true)} className={headerBtn}>
            <Maximize2 className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Expand</span>
          </button>
        )}
        <ThemeToggle />
      </header>

      {expanded ? (
        <iframe
          src={playHref}
          title={`Live example: ${meta.title}`}
          className="min-h-0 w-full flex-1 border-0 bg-background"
        />
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <p className="mb-6 max-w-prose text-base text-foreground/80 sm:text-lg">
            {meta.description}
          </p>
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(320px,460px)]">
            <aside className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
              <div className="overflow-hidden rounded-xl border border-border bg-black">
                <iframe
                  src={playHref}
                  title={`Live preview of ${meta.title}`}
                  loading="lazy"
                  className="block aspect-4/3 w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
                Expand the example
              </button>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{meta.library}</Badge>
                <Badge variant="outline">Level {meta.level}</Badge>
                {meta.concepts.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
            </aside>

            <div className="order-2 min-w-0 lg:order-1">
              <Tabs defaultValue="synopsis">
                <TabsList>
                  <TabsTrigger value="synopsis">Synopsis</TabsTrigger>
                  <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
                </TabsList>
                <TabsContent value="synopsis" className="max-w-prose">
                  {synopsis}
                </TabsContent>
                <TabsContent value="tutorial" className="max-w-prose">
                  {tutorial}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
