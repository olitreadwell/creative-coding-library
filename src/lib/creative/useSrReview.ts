"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { newCard, nextSchedule, type Card, type Rating } from "./sr-schedule";

const STORAGE_KEY = "creative-coding-library:sr:v1";

type SrStore = Record<string, Record<string, Card>>;

type SrState = {
  cards: Record<string, Card>;
  dueChecks: string[];
};

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

function readSlugCards(slug: string, checkIds: string[]): Record<string, Card> {
  const store = readStore();
  const slugStore = store[slug] ?? {};
  const cards: Record<string, Card> = {};
  for (const id of checkIds) {
    const stored = slugStore[id];
    if (
      stored !== undefined &&
      typeof stored === "object" &&
      typeof stored.dueAt === "string" &&
      (stored.lastReviewedAt === null || typeof stored.lastReviewedAt === "string") &&
      typeof stored.stability === "number" &&
      typeof stored.difficulty === "number" &&
      typeof stored.reps === "number" &&
      typeof stored.lapses === "number" &&
      typeof stored.state === "number"
    ) {
      cards[id] = stored;
    } else {
      cards[id] = newCard(id);
    }
  }
  return cards;
}

function computeDue(cards: Record<string, Card>, checkIds: string[]): string[] {
  const now = new Date().toISOString();
  return checkIds.filter((id) => {
    const card = cards[id];
    return card === undefined || card.dueAt <= now;
  });
}

function loadState(slug: string, checkIds: string[]): SrState {
  const cards = readSlugCards(slug, checkIds);
  return { cards, dueChecks: computeDue(cards, checkIds) };
}

export type SrReviewState = {
  dueChecks: string[];
  nextDueAt: (checkId: string) => string | null;
  rate: (checkId: string, rating: Rating) => void;
};

export function useSrReview(slug: string, checkIds: string[]): SrReviewState {
  const slugRef = useRef(slug);
  const checkIdsRef = useRef(checkIds);

  const [state, setState] = useState<SrState>({ cards: {}, dueChecks: checkIds });

  useEffect(() => {
    slugRef.current = slug;
    checkIdsRef.current = checkIds;
    const refresh = () => {
      setState(loadState(slug, checkIds));
    };
    refresh();
  }, [slug, checkIds]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(loadState(slugRef.current, checkIdsRef.current));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const nextDueAt = useCallback(
    (checkId: string): string | null => {
      const card = state.cards[checkId];
      return card?.dueAt ?? null;
    },
    [state.cards],
  );

  const rate = useCallback((checkId: string, rating: Rating): void => {
    setState((prev) => {
      const card = prev.cards[checkId] ?? newCard(checkId);
      const updated = nextSchedule(card, rating);
      const nextCards = { ...prev.cards, [checkId]: updated };

      const store = readStore();
      store[slugRef.current] = {
        ...(store[slugRef.current] ?? {}),
        [checkId]: updated,
      };
      writeStore(store);

      return { cards: nextCards, dueChecks: computeDue(nextCards, checkIdsRef.current) };
    });
  }, []);

  return { dueChecks: state.dueChecks, nextDueAt, rate };
}
