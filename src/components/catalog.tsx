"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { AppMeta } from "@/lib/creative/registry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONCEPTS_INLINE_THRESHOLD = 12;
const LIBRARIES_INLINE_THRESHOLD = 6;

function hueFromSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return h;
}

type Sort = "oldest" | "newest" | "level" | "name";

const SORT_LABELS: Record<Sort, string> = {
  oldest: "Oldest first",
  newest: "Newest first",
  level: "Level",
  name: "Name (A–Z)",
};

const SORT_KEYS = Object.keys(SORT_LABELS) as Sort[];

function isSort(v: string | null): v is Sort {
  return v !== null && (SORT_KEYS as string[]).includes(v);
}

function compareApps(a: AppMeta, b: AppMeta, sort: Sort): number {
  switch (sort) {
    case "newest":
      return (
        b.builtAt.localeCompare(a.builtAt) || b.level - a.level || a.title.localeCompare(b.title)
      );
    case "level":
      return a.level - b.level || a.title.localeCompare(b.title);
    case "name":
      return a.title.localeCompare(b.title);
    case "oldest":
    default:
      return (
        a.builtAt.localeCompare(b.builtAt) || a.level - b.level || a.title.localeCompare(b.title)
      );
  }
}

function MultiFilterRow({
  label,
  options,
  active,
  onToggle,
  onClear,
}: {
  label: string;
  options: string[];
  active: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium tracking-wide text-foreground/70 uppercase">
        {label}
      </span>
      <Chip selected={active.length === 0} onClick={onClear}>
        all
      </Chip>
      {options.map((opt) => (
        <Chip key={opt} selected={active.includes(opt)} onClick={() => onToggle(opt)}>
          {opt}
        </Chip>
      ))}
    </div>
  );
}

function SingleFilterRow({
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
  const [thumbOk, setThumbOk] = useState(true);
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
          {thumbOk ? (
            <Image
              src={`/thumbnails/${app.slug}.png`}
              alt={`Preview of ${app.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              onError={() => setThumbOk(false)}
            />
          ) : null}
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

function parseMulti(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").filter(Boolean);
}

function serializeMulti(values: string[]): string {
  return values.join(",");
}

function CatalogInner({ apps }: { apps: readonly AppMeta[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const libraries = useMemo(() => [...new Set(apps.map((a) => a.library))].sort(), [apps]);
  const levels = useMemo(() => [...new Set(apps.map((a) => String(a.level)))].sort(), [apps]);
  const concepts = useMemo(() => [...new Set(apps.flatMap((a) => a.concepts))].sort(), [apps]);

  const activeLibraries = useMemo(() => parseMulti(params.get("library")), [params]);
  const activeLevel = params.get("level");
  const activeConcepts = useMemo(() => parseMulti(params.get("concept")), [params]);
  const sort: Sort = isSort(params.get("sort")) ? (params.get("sort") as Sort) : "oldest";
  const query = params.get("q") ?? "";

  const showFiltersDefault =
    libraries.length < LIBRARIES_INLINE_THRESHOLD ||
    levels.length <= 3 ||
    concepts.length < CONCEPTS_INLINE_THRESHOLD;
  const [showFilters, setShowFilters] = useState(showFiltersDefault);

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  function setQuery(value: string) {
    updateParams({ q: value || null });
  }

  function setSort(value: Sort) {
    updateParams({ sort: value === "oldest" ? null : value });
  }

  function toggleLibrary(value: string) {
    const next = activeLibraries.includes(value)
      ? activeLibraries.filter((v) => v !== value)
      : [...activeLibraries, value];
    updateParams({ library: next.length ? serializeMulti(next) : null });
  }

  function clearLibraries() {
    updateParams({ library: null });
  }

  function setLevel(value: string | null) {
    updateParams({ level: value });
  }

  function toggleConcept(value: string) {
    const next = activeConcepts.includes(value)
      ? activeConcepts.filter((v) => v !== value)
      : [...activeConcepts, value];
    updateParams({ concept: next.length ? serializeMulti(next) : null });
  }

  function clearConcepts() {
    updateParams({ concept: null });
  }

  function clearAll() {
    router.replace("?", { scroll: false });
  }

  const activeCount = activeLibraries.length + (activeLevel ? 1 : 0) + activeConcepts.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps
      .filter((a) => {
        if (activeLibraries.length > 0 && !activeLibraries.includes(a.library)) return false;
        if (activeLevel && String(a.level) !== activeLevel) return false;
        if (activeConcepts.length > 0 && !activeConcepts.some((c) => a.concepts.includes(c)))
          return false;
        if (q) {
          const hay =
            `${a.title} ${a.description} ${a.library} ${a.concepts.join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => compareApps(a, b, sort));
  }, [apps, activeLibraries, activeLevel, activeConcepts, sort, query]);

  return (
    <section aria-label="App catalog">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-foreground/50"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps..."
              aria-label="Search apps"
              className="w-full rounded-md border border-border bg-background py-1.5 pr-3 pl-8 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 rounded-full bg-foreground px-1.5 text-xs text-background">
                {activeCount}
              </span>
            )}
          </button>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2.5 rounded-lg border border-border p-3">
            <MultiFilterRow
              label="library"
              options={libraries}
              active={activeLibraries}
              onToggle={toggleLibrary}
              onClear={clearLibraries}
            />
            <SingleFilterRow
              label="level"
              options={levels}
              active={activeLevel}
              onPick={setLevel}
            />
            <MultiFilterRow
              label="concept"
              options={concepts}
              active={activeConcepts}
              onToggle={toggleConcept}
              onClear={clearConcepts}
            />
          </div>
        )}
      </div>

      <p className="mb-4 text-sm text-foreground/70" aria-live="polite">
        Showing {filtered.length} of {apps.length} app{apps.length === 1 ? "" : "s"}.
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-foreground/60">No apps match these filters.</p>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear filters
          </button>
        </div>
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

export function Catalog({ apps }: { apps: readonly AppMeta[] }) {
  return (
    <Suspense
      fallback={
        <section aria-label="App catalog">
          <p className="text-sm text-foreground/70">Loading catalog...</p>
        </section>
      }
    >
      <CatalogInner apps={apps} />
    </Suspense>
  );
}
