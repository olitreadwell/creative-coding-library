import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { useMastery } from "./useMastery";

const STORAGE_KEY = "creative-coding-library:mastery:v1";

function Harness({
  slug,
  onRender,
}: {
  slug: string;
  onRender: (state: {
    mastered: boolean;
    masteredAt: string | null;
    setMastered: (v: boolean) => void;
  }) => void;
}) {
  const state = useMastery(slug);
  onRender(state);
  return null;
}

describe("useMastery", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("returns mastered=false and masteredAt=null by default", () => {
    let captured: { mastered: boolean; masteredAt: string | null } | undefined;
    render(<Harness slug="test-slug" onRender={(s) => (captured = s)} />);
    expect(captured?.mastered).toBe(false);
    expect(captured?.masteredAt).toBeNull();
  });

  it("setMastered(true) persists to localStorage and updates masteredAt", async () => {
    let captured:
      | { mastered: boolean; masteredAt: string | null; setMastered: (v: boolean) => void }
      | undefined;
    render(<Harness slug="test-slug" onRender={(s) => (captured = s)} />);

    await act(async () => {
      captured?.setMastered(true);
    });

    expect(captured?.mastered).toBe(true);
    expect(captured?.masteredAt).not.toBeNull();

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const store = JSON.parse(raw as string) as Record<string, unknown>;
    const entry = store["test-slug"] as { mastered: boolean; masteredAt: string } | undefined;
    expect(entry?.mastered).toBe(true);
    expect(typeof entry?.masteredAt).toBe("string");
  });

  it("a second instance with the same slug reads the persisted value", async () => {
    let first:
      | { mastered: boolean; masteredAt: string | null; setMastered: (v: boolean) => void }
      | undefined;
    const { unmount } = render(<Harness slug="shared-slug" onRender={(s) => (first = s)} />);

    await act(async () => {
      first?.setMastered(true);
    });
    unmount();

    let second: { mastered: boolean; masteredAt: string | null } | undefined;
    render(<Harness slug="shared-slug" onRender={(s) => (second = s)} />);

    expect(second?.mastered).toBe(true);
    expect(second?.masteredAt).not.toBeNull();
  });

  it("storage event from another tab updates the state", async () => {
    let captured: { mastered: boolean; masteredAt: string | null } | undefined;
    render(<Harness slug="remote-slug" onRender={(s) => (captured = s)} />);

    expect(captured?.mastered).toBe(false);

    const newStore = JSON.stringify({
      "remote-slug": { mastered: true, masteredAt: "2026-06-06T00:00:00.000Z" },
    });
    localStorage.setItem(STORAGE_KEY, newStore);

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: newStore,
          storageArea: localStorage,
        }),
      );
    });

    expect(captured?.mastered).toBe(true);
    expect(captured?.masteredAt).toBe("2026-06-06T00:00:00.000Z");
  });

  it("falls back to defaults when localStorage contains malformed JSON", async () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{{");

    let captured: { mastered: boolean; masteredAt: string | null } | undefined;
    render(<Harness slug="bad-slug" onRender={(s) => (captured = s)} />);

    expect(captured?.mastered).toBe(false);
    expect(captured?.masteredAt).toBeNull();
  });
});
