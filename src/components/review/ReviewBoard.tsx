"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AppMeta, RecallCheck } from "@/lib/creative/registry";
import { Card, CardContent } from "@/components/ui/card";
import {
  newCard,
  nextSchedule,
  type Card as SrCard,
  type Rating,
} from "@/lib/creative/sr-schedule";

const STORAGE_KEY = "creative-coding-library:sr:v1";

type SrStore = Record<string, Record<string, SrCard>>;

function readStore(): SrStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as SrStore;
  } catch {
    return {};
  }
}

function writeStore(store: SrStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable; continue with in-memory state.
  }
}

function isValidCard(value: unknown): value is SrCard {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["dueAt"] === "string" &&
    (v["lastReviewedAt"] === null || typeof v["lastReviewedAt"] === "string") &&
    typeof v["stability"] === "number" &&
    typeof v["difficulty"] === "number" &&
    typeof v["reps"] === "number" &&
    typeof v["lapses"] === "number" &&
    typeof v["state"] === "number"
  );
}

type DueEntry = {
  slug: string;
  appTitle: string;
  checkIndex: number;
  check: RecallCheck;
  dueAt: string;
};

type AllDueState = {
  cards: Map<string, Record<string, SrCard>>;
};

function loadAllCards(apps: AppMeta[]): Map<string, Record<string, SrCard>> {
  const store = readStore();
  const result = new Map<string, Record<string, SrCard>>();
  for (const app of apps) {
    const checks = app.recallChecks ?? [];
    const slugStore = store[app.slug] ?? {};
    const cards: Record<string, SrCard> = {};
    for (let i = 0; i < checks.length; i++) {
      const id = String(i);
      const stored = slugStore[id];
      cards[id] = isValidCard(stored) ? stored : newCard(id);
    }
    result.set(app.slug, cards);
  }
  return result;
}

function computeDueEntries(
  apps: AppMeta[],
  cards: Map<string, Record<string, SrCard>>,
): DueEntry[] {
  const now = new Date().toISOString();
  const due: DueEntry[] = [];
  for (const app of apps) {
    const checks = app.recallChecks ?? [];
    const slugCards = cards.get(app.slug) ?? {};
    for (let i = 0; i < checks.length; i++) {
      const id = String(i);
      const card = slugCards[id];
      if (card === undefined || card.dueAt <= now) {
        due.push({
          slug: app.slug,
          appTitle: app.title,
          checkIndex: i,
          check: checks[i] as RecallCheck,
          dueAt: card?.dueAt ?? now,
        });
      }
    }
  }
  due.sort((a, b) => (a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : 0));
  return due;
}

type UseAllDueReturn = {
  due: DueEntry[];
  rate: (slug: string, id: string, rating: Rating) => void;
  nextDueAt: (slug: string, id: string) => string | null;
};

function useAllDue(apps: AppMeta[]): UseAllDueReturn {
  const appsRef = useRef(apps);

  const [state, setState] = useState<AllDueState>(() => ({
    cards: loadAllCards(apps),
  }));

  useEffect(() => {
    appsRef.current = apps;
    const refresh = () => {
      setState({ cards: loadAllCards(apps) });
    };
    refresh();
  }, [apps]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState({ cards: loadAllCards(appsRef.current) });
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const rate = useCallback((slug: string, id: string, rating: Rating) => {
    setState((prev) => {
      const slugCards = prev.cards.get(slug) ?? {};
      const card = slugCards[id] ?? newCard(id);
      const updated = nextSchedule(card, rating);

      const store = readStore();
      store[slug] = { ...(store[slug] ?? {}), [id]: updated };
      writeStore(store);

      const nextSlugCards = { ...slugCards, [id]: updated };
      const nextCards = new Map(prev.cards);
      nextCards.set(slug, nextSlugCards);
      return { cards: nextCards };
    });
  }, []);

  const nextDueAt = useCallback(
    (slug: string, id: string): string | null => {
      return state.cards.get(slug)?.[id]?.dueAt ?? null;
    },
    [state.cards],
  );

  const due = computeDueEntries(apps, state.cards);

  return { due, rate, nextDueAt };
}

const RATINGS: { label: string; value: Rating; color: string }[] = [
  { label: "Again", value: 1, color: "text-red-600 border-red-300 hover:bg-red-50" },
  { label: "Hard", value: 2, color: "text-amber-600 border-amber-300 hover:bg-amber-50" },
  { label: "Good", value: 3, color: "text-green-600 border-green-300 hover:bg-green-50" },
  { label: "Easy", value: 4, color: "text-blue-600 border-blue-300 hover:bg-blue-50" },
];

type CardRowProps = {
  entry: DueEntry;
  onRate: (slug: string, id: string, rating: Rating) => void;
};

function CardRow({ entry, onRate }: CardRowProps) {
  const [revealed, setRevealed] = useState(false);
  const checkLabel = `${entry.appTitle}: ${entry.check.q}`;

  return (
    <div className="flex flex-col gap-2" aria-label={checkLabel}>
      <p className="font-medium">{entry.check.q}</p>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? "Hide answer" : "Show answer"}
        className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
      >
        {revealed ? "Hide" : "Show answer"}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {revealed && <p className="text-muted-foreground">{entry.check.a}</p>}
      </div>
      <div className="flex gap-1.5" role="group" aria-label="Rate this card">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={!revealed}
            onClick={() => onRate(entry.slug, String(entry.checkIndex), r.value)}
            aria-label={`Rate ${r.label}`}
            className={[
              "flex-1 min-h-[36px] rounded-md border text-[0.75rem] font-medium transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              r.color,
            ].join(" ")}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type AppGroupProps = {
  slug: string;
  title: string;
  entries: DueEntry[];
  onRate: (slug: string, id: string, rating: Rating) => void;
};

function AppGroup({ slug, title, entries, onRate }: AppGroupProps) {
  return (
    <section aria-labelledby={`app-${slug}`}>
      <h2
        id={`app-${slug}`}
        className="mb-3 text-sm font-semibold text-foreground/60 uppercase tracking-wider"
      >
        <Link href={`/${slug}`} className="hover:text-foreground transition-colors">
          {title}
        </Link>
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          {entries.map((entry) => (
            <CardRow key={`${entry.slug}-${entry.checkIndex}`} entry={entry} onRate={onRate} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

type ReviewBoardProps = {
  apps: AppMeta[];
};

export function ReviewBoard({ apps }: ReviewBoardProps) {
  const { due, rate } = useAllDue(apps);

  const appCount = new Set(due.map((e) => e.slug)).size;

  if (due.length === 0) {
    return <p className="text-sm text-foreground/60">Nothing due right now. Come back later.</p>;
  }

  const groups = new Map<string, { title: string; entries: DueEntry[] }>();
  for (const entry of due) {
    const existing = groups.get(entry.slug);
    if (existing !== undefined) {
      existing.entries.push(entry);
    } else {
      groups.set(entry.slug, { title: entry.appTitle, entries: [entry] });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-foreground/70" aria-live="polite">
        {due.length} {due.length === 1 ? "card" : "cards"} due across {appCount}{" "}
        {appCount === 1 ? "app" : "apps"}.
      </p>
      {[...groups.entries()].map(([slug, { title, entries }]) => (
        <AppGroup key={slug} slug={slug} title={title} entries={entries} onRate={rate} />
      ))}
    </div>
  );
}
