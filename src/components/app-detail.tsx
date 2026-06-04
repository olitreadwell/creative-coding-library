"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Maximize2 } from "lucide-react";
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
  const [fullScreen, setFullScreen] = useState(false);
  const playHref = `/${meta.slug}/play`;

  const headerBtn =
    "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-3 sm:gap-3 sm:px-6">
        {fullScreen ? (
          <button
            type="button"
            onClick={() => setFullScreen(false)}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Catalog</span>
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate px-2 text-center text-sm font-medium tracking-wide sm:text-base">
          {meta.title}
        </h1>
        {!fullScreen && (
          <button type="button" onClick={() => setFullScreen(true)} className={headerBtn}>
            <Maximize2 className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Full screen</span>
          </button>
        )}
        <a href={playHref} target="_blank" rel="noopener noreferrer" className={headerBtn}>
          <ExternalLink className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">New tab</span>
        </a>
        <ThemeToggle />
      </header>

      {fullScreen ? (
        <iframe
          src={`${playHref}?embed=controls`}
          title={`Live example: ${meta.title}`}
          className="min-h-0 w-full flex-1 border-0 bg-background"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="order-2 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 lg:order-1 lg:w-[36%] lg:max-w-2xl lg:shrink-0">
            <p className="mb-5 max-w-prose text-base text-foreground/80">{meta.description}</p>
            <div className="mb-5 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{meta.library}</Badge>
              <Badge variant="outline">Level {meta.level}</Badge>
              {meta.concepts.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="how">How it works</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="max-w-prose">
                {synopsis}
              </TabsContent>
              <TabsContent value="how" className="max-w-prose">
                {tutorial}
              </TabsContent>
            </Tabs>
          </div>

          <div className="order-1 h-[67svh] min-h-0 border-b border-border lg:order-2 lg:h-auto lg:flex-1 lg:border-b-0 lg:border-l">
            <iframe
              src={`${playHref}?embed=controls`}
              title={`Live preview of ${meta.title}`}
              className="h-full w-full border-0 bg-background"
            />
          </div>
        </div>
      )}
    </div>
  );
}
