"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { AppMeta, AppLevel } from "@/lib/creative/registry";
import { useMasteredSlugs } from "@/lib/creative/useMastery";
import { MasteryButton } from "@/components/learning/MasteryButton";

const LEVELS: AppLevel[] = [1, 2, 3];
const LEVEL_LABELS: Record<AppLevel, string> = {
  1: "L1: Start here",
  2: "L2: More control",
  3: "L3: Complex systems",
};

type LockedFilter = "show" | "hide";

function topoSort(apps: readonly AppMeta[]): AppMeta[] {
  const slugs = new Set(apps.map((a) => a.slug));
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const app of apps) {
    if (!inDegree.has(app.slug)) inDegree.set(app.slug, 0);
    if (!children.has(app.slug)) children.set(app.slug, []);
    for (const p of app.prereqs ?? []) {
      if (!slugs.has(p)) continue;
      inDegree.set(app.slug, (inDegree.get(app.slug) ?? 0) + 1);
      const ch = children.get(p) ?? [];
      ch.push(app.slug);
      children.set(p, ch);
    }
  }

  const bySlug = new Map(apps.map((a) => [a.slug, a]));
  const queue: AppMeta[] = apps
    .filter((a) => (inDegree.get(a.slug) ?? 0) === 0)
    .slice()
    .sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));

  const result: AppMeta[] = [];
  while (queue.length > 0) {
    const app = queue.shift()!;
    result.push(app);
    const nextCandidates: AppMeta[] = [];
    for (const childSlug of children.get(app.slug) ?? []) {
      const deg = (inDegree.get(childSlug) ?? 1) - 1;
      inDegree.set(childSlug, deg);
      if (deg === 0) {
        const child = bySlug.get(childSlug);
        if (child !== undefined) nextCandidates.push(child);
      }
    }
    nextCandidates.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
    queue.push(...nextCandidates);
  }

  for (const app of apps) {
    if (!result.includes(app)) result.push(app);
  }

  return result;
}

function prereqTitles(app: AppMeta, bySlug: Map<string, AppMeta>): string {
  const titles = (app.prereqs ?? [])
    .map((p) => bySlug.get(p)?.title ?? p)
    .filter(Boolean)
    .join(", ");
  return titles;
}

type AppRowProps = {
  app: AppMeta;
  masteredSlugs: Set<string>;
  bySlug: Map<string, AppMeta>;
};

function AppRow({ app, masteredSlugs, bySlug }: AppRowProps) {
  const missingPrereqs = (app.prereqs ?? []).filter((p) => !masteredSlugs.has(p));
  const isLocked = missingPrereqs.length > 0;
  const missing = prereqTitles({ ...app, prereqs: missingPrereqs }, bySlug);
  const primaryConcept = app.concepts[0];
  const ariaLabel = isLocked ? `Locked — ${app.title} — unmastered prereqs: ${missing}` : app.title;

  return (
    <li
      className={[
        "rounded-xl border border-foreground/10 p-4 transition hover:border-foreground/30",
        isLocked ? "opacity-50" : "",
      ].join(" ")}
      aria-label={ariaLabel}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <Link
          href={`/${app.slug}`}
          className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 rounded"
        >
          <p className="text-base font-semibold leading-snug">{app.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded border border-foreground/20 px-1.5 py-0.5 text-xs">
              L{app.level}
            </span>
            {primaryConcept !== undefined && (
              <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs">
                {primaryConcept}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-foreground/70">{app.description}</p>
          {app.understandWhen !== undefined && app.understandWhen.length > 0 && (
            <p className="mt-1.5 text-xs text-foreground/50 italic">{app.understandWhen}</p>
          )}
        </Link>
        <div className="shrink-0 sm:self-center">
          <MasteryButton slug={app.slug} understandWhen={app.understandWhen} />
        </div>
      </div>
      {isLocked && (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-foreground/50">Locked — needs: {missing}</p>
          <Link
            href={`/${app.slug}`}
            className="text-xs text-foreground/60 underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 rounded"
          >
            Open anyway
          </Link>
        </div>
      )}
    </li>
  );
}

type LockedToggleProps = {
  value: LockedFilter;
  onChange: (v: LockedFilter) => void;
};

function LockedToggle({ value, onChange }: LockedToggleProps) {
  const options: { key: LockedFilter; label: string }[] = [
    { key: "show", label: "Show all" },
    { key: "hide", label: "Hide locked" },
  ];

  return (
    <div
      role="group"
      aria-label="Locked apps visibility"
      className="flex rounded-md border border-border text-xs"
    >
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={[
            "px-2.5 py-1 first:rounded-l-md last:rounded-r-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10",
            value === key
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:text-foreground hover:bg-accent",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function JourneyList({ apps }: { apps: readonly AppMeta[] }) {
  const masteredSlugs = useMasteredSlugs();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sorted = useMemo(() => topoSort(apps), [apps]);
  const bySlug = useMemo(() => new Map(apps.map((a) => [a.slug, a])), [apps]);

  const lockedFilter: LockedFilter = searchParams.get("locked") === "hide" ? "hide" : "show";

  function setLockedFilter(v: LockedFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "show") {
      params.delete("locked");
    } else {
      params.set("locked", v);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/");
  }

  const byLevel = useMemo(() => {
    const map = new Map<AppLevel, AppMeta[]>();
    for (const app of sorted) {
      const group = map.get(app.level) ?? [];
      group.push(app);
      map.set(app.level, group);
    }
    return map;
  }, [sorted]);

  if (apps.length === 0) {
    return (
      <p className="text-foreground/60 text-sm">
        No apps yet. The builder loop will populate this as issues are picked up.
      </p>
    );
  }

  return (
    <section aria-label="Learning journey">
      <div className="mb-6 flex items-center gap-3">
        <LockedToggle value={lockedFilter} onChange={setLockedFilter} />
      </div>

      {LEVELS.map((level) => {
        const group = byLevel.get(level);
        if (group === undefined || group.length === 0) return null;

        const lockedCount = group.filter((app) => {
          const missing = (app.prereqs ?? []).filter((p) => !masteredSlugs.has(p));
          return missing.length > 0;
        }).length;

        const visible =
          lockedFilter === "hide"
            ? group.filter((app) => {
                const missing = (app.prereqs ?? []).filter((p) => !masteredSlugs.has(p));
                return missing.length === 0;
              })
            : group;

        return (
          <div key={level} className="mb-10">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground/80">
              {LEVEL_LABELS[level]}
            </h2>
            {visible.length === 0 ? (
              <p className="text-sm text-foreground/50">
                {`${lockedCount} locked ${lockedCount === 1 ? "app" : "apps"} hidden in this level. Switch to Show all.`}
              </p>
            ) : (
              <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {visible.map((app) => (
                  <AppRow key={app.slug} app={app} masteredSlugs={masteredSlugs} bySlug={bySlug} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
