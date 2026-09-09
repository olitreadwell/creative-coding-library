import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { useSrReview, type SrReviewState } from "./useSrReview";

const STORAGE_KEY = "creative-coding-library:sr:v1";
const SLUG = "test-app";
const CHECK_IDS = ["check-1", "check-2", "check-3"];

function Harness({
  slug,
  checkIds,
  onRender,
}: {
  slug: string;
  checkIds: string[];
  onRender: (state: SrReviewState) => void;
}) {
  const state = useSrReview(slug, checkIds);
  onRender(state);
  return null;
}

describe("useSrReview", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("with no prior state, dueChecks contains all checkIds", () => {
    let captured: SrReviewState | undefined;
    render(<Harness slug={SLUG} checkIds={CHECK_IDS} onRender={(s) => (captured = s)} />);
    expect(captured?.dueChecks).toEqual(expect.arrayContaining(CHECK_IDS));
    expect(captured?.dueChecks.length).toBe(CHECK_IDS.length);
  });

  it("rate(checkId, 3) removes it from dueChecks", async () => {
    let captured: SrReviewState | undefined;
    render(<Harness slug={SLUG} checkIds={CHECK_IDS} onRender={(s) => (captured = s)} />);

    await act(async () => {
      captured?.rate("check-1", 3);
    });

    expect(captured?.dueChecks).not.toContain("check-1");
    expect(captured?.dueChecks).toContain("check-2");
    expect(captured?.dueChecks).toContain("check-3");
  });

  it("nextDueAt returns a future ISO string after rating Good", async () => {
    let captured: SrReviewState | undefined;
    render(<Harness slug={SLUG} checkIds={CHECK_IDS} onRender={(s) => (captured = s)} />);

    await act(async () => {
      captured?.rate("check-2", 3);
    });

    const due = captured?.nextDueAt("check-2");
    expect(typeof due).toBe("string");
    expect(new Date(due as string).getTime()).toBeGreaterThan(Date.now());
  });

  it("mounting a second hook reads the persisted state", async () => {
    let first: SrReviewState | undefined;
    const { unmount } = render(
      <Harness slug={SLUG} checkIds={CHECK_IDS} onRender={(s) => (first = s)} />,
    );

    await act(async () => {
      first?.rate("check-1", 3);
    });
    unmount();

    let second: SrReviewState | undefined;
    render(<Harness slug={SLUG} checkIds={CHECK_IDS} onRender={(s) => (second = s)} />);

    expect(second?.dueChecks).not.toContain("check-1");
    expect(second?.dueChecks).toContain("check-2");
  });

  it("storage event from another tab updates state", async () => {
    let captured: SrReviewState | undefined;
    render(
      <Harness slug={SLUG} checkIds={["check-1"] as const} onRender={(s) => (captured = s)} />,
    );

    expect(captured?.dueChecks).toContain("check-1");

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newStore = JSON.stringify({
      [SLUG]: {
        "check-1": {
          id: "check-1",
          dueAt: futureDate,
          lastReviewedAt: new Date().toISOString(),
          stability: 4.5,
          difficulty: 5.0,
          reps: 1,
          lapses: 0,
          state: 2,
        },
      },
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

    expect(captured?.dueChecks).not.toContain("check-1");
  });

  it("malformed localStorage falls back to defaults without throwing", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{{");

    let captured: SrReviewState | undefined;
    expect(() => {
      render(<Harness slug={SLUG} checkIds={CHECK_IDS} onRender={(s) => (captured = s)} />);
    }).not.toThrow();

    expect(captured?.dueChecks.length).toBe(CHECK_IDS.length);
  });
});
