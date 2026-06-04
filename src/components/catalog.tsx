"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AppMeta } from "@/lib/creative/registry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function hueFromSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return h;
}

type Filters = {
  library: string | null;
  level: string | null;
  concept: string | null;
};

function FilterRow({
  label,
  options,
  active,
  onPick,
}: {
  label: string;
  options: string[];
  active: string | null;
  onPick: (value: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium tracking-wide text-foreground/70 uppercase">
        {label}
      </span>
      <Chip selected={active === null} onClick={() => onPick(null)}>
        all
      </Chip>
      {options.map((opt) => (
        <Chip
          key={opt}
          selected={active === opt}
          onClick={() => onPick(active === opt ? null : opt)}
        >
          {opt}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        (selected
          ? "border-foreground bg-foreground text-background"
          : "border-border text-foreground/70 hover:text-foreground hover:bg-accent")
      }
    >
      {children}
    </button>
  );
}

function AppCard({ app }: { app: AppMeta }) {
  const hue = hueFromSlug(app.slug);
  return (
    <Link
      href={`/${app.slug}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-0 overflow-hidden pt-0 ring-1 ring-foreground/10 transition group-hover:ring-foreground/30">
        <div
          className="relative aspect-16/10 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 60% 22%), hsl(${(hue + 60) % 360} 55% 14%))`,
          }}
        >
          <Image
            src={`/thumbnails/${app.slug}.png`}
            alt={`Preview of ${app.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <CardHeader className="pt-4">
          <CardTitle>{app.title}</CardTitle>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5 pt-3 pb-4">
          <Badge variant="secondary">{app.library}</Badge>
          <Badge variant="outline">L{app.level}</Badge>
          {app.concepts.slice(0, 3).map((c) => (
            <Badge key={c} variant="outline">
              {c}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}

export function Catalog({ apps }: { apps: readonly AppMeta[] }) {
  const [filters, setFilters] = useState<Filters>({ library: null, level: null, concept: null });

  const libraries = useMemo(() => [...new Set(apps.map((a) => a.library))].sort(), [apps]);
  const levels = useMemo(() => [...new Set(apps.map((a) => String(a.level)))].sort(), [apps]);
  const concepts = useMemo(() => [...new Set(apps.flatMap((a) => a.concepts))].sort(), [apps]);

  const filtered = useMemo(
    () =>
      apps
        .filter((a) => {
          if (filters.library && a.library !== filters.library) return false;
          if (filters.level && String(a.level) !== filters.level) return false;
          if (filters.concept && !a.concepts.includes(filters.concept)) return false;
          return true;
        })
        .slice()
        .sort((a, b) => a.level - b.level || a.title.localeCompare(b.title)),
    [apps, filters],
  );

  return (
    <section aria-label="App catalog">
      <div className="mb-6 space-y-2.5">
        <FilterRow
          label="library"
          options={libraries}
          active={filters.library}
          onPick={(v) => setFilters((f) => ({ ...f, library: v }))}
        />
        <FilterRow
          label="level"
          options={levels}
          active={filters.level}
          onPick={(v) => setFilters((f) => ({ ...f, level: v }))}
        />
        <FilterRow
          label="concept"
          options={concepts}
          active={filters.concept}
          onPick={(v) => setFilters((f) => ({ ...f, concept: v }))}
        />
      </div>

      <p className="mb-4 text-sm text-foreground/70" aria-live="polite">
        Showing {filtered.length} of {apps.length} app{apps.length === 1 ? "" : "s"}.
      </p>

      {filtered.length === 0 ? (
        <p className="text-foreground/60">No apps match these filters.</p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <li key={app.slug}>
              <AppCard app={app} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
