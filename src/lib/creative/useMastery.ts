"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "creative-coding-library:mastery:v1";

type MasteryEntry = {
  mastered: boolean;
  masteredAt: string;
};

type MasteryStore = Record<string, MasteryEntry>;

export type MasteryState = {
  mastered: boolean;
  masteredAt: string | null;
  setMastered: (v: boolean) => void;
};

function readStore(): MasteryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as MasteryStore;
  } catch {
    return {};
  }
}

function readEntry(slug: string): { mastered: boolean; masteredAt: string | null } {
  const store = readStore();
  const entry = store[slug];
  if (
    entry === undefined ||
    typeof entry !== "object" ||
    typeof entry.mastered !== "boolean" ||
    typeof entry.masteredAt !== "string"
  ) {
    return { mastered: false, masteredAt: null };
  }
  return { mastered: entry.mastered, masteredAt: entry.masteredAt };
}

function writeEntry(slug: string, mastered: boolean): string | null {
  if (typeof window === "undefined") return null;
  const store = readStore();
  const masteredAt = mastered ? new Date().toISOString() : (store[slug]?.masteredAt ?? "");
  store[slug] = { mastered, masteredAt };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    return null;
  }
  return masteredAt || null;
}

export function useMastery(slug: string): MasteryState {
  const slugRef = useRef(slug);

  const [state, setState] = useState<{ mastered: boolean; masteredAt: string | null }>({
    mastered: false,
    masteredAt: null,
  });

  useEffect(() => {
    slugRef.current = slug;
    const refresh = () => {
      setState(readEntry(slug));
    };
    refresh();
  }, [slug]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(readEntry(slugRef.current));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setMastered = useCallback(
    (v: boolean) => {
      const masteredAt = writeEntry(slug, v);
      setState({ mastered: v, masteredAt: v ? masteredAt : null });
    },
    [slug],
  );

  return { ...state, setMastered };
}
