import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { AppMeta } from "@/lib/creative/registry";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const MOCK_APPS: AppMeta[] = [
  {
    slug: "app-a",
    title: "App A",
    description: "First test app.",
    library: "Canvas 2D",
    concepts: ["test"],
    level: 1,
    technique: "test",
    license: "MIT",
    commercialUse: "paid-gig-safe",
    kind: "creative",
    builtAt: "2026-01-01T00:00:00Z",
    recallChecks: [
      { q: "Question A1", a: "Answer A1" },
      { q: "Question A2", a: "Answer A2" },
    ],
  },
  {
    slug: "app-b",
    title: "App B",
    description: "Second test app.",
    library: "Canvas 2D",
    concepts: ["test"],
    level: 1,
    technique: "test",
    license: "MIT",
    commercialUse: "paid-gig-safe",
    kind: "creative",
    builtAt: "2026-01-01T00:00:00Z",
    recallChecks: [
      { q: "Question B1", a: "Answer B1" },
      { q: "Question B2", a: "Answer B2" },
    ],
  },
];

const EMPTY_APPS: AppMeta[] = [
  {
    slug: "app-none",
    title: "App None",
    description: "No checks.",
    library: "Canvas 2D",
    concepts: [],
    level: 1,
    technique: "test",
    license: "MIT",
    commercialUse: "paid-gig-safe",
    kind: "creative",
    builtAt: "2026-01-01T00:00:00Z",
    recallChecks: [],
  },
];

function clearStorage() {
  localStorage.clear();
}

import { ReviewBoard } from "./ReviewBoard";

describe("ReviewBoard", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("renders all 4 cards due on mount when localStorage is empty", () => {
    render(<ReviewBoard apps={MOCK_APPS} />);

    expect(screen.getByText("Question A1")).toBeDefined();
    expect(screen.getByText("Question A2")).toBeDefined();
    expect(screen.getByText("Question B1")).toBeDefined();
    expect(screen.getByText("Question B2")).toBeDefined();

    expect(screen.getByText(/4 cards due across 2 apps/i)).toBeDefined();
  });

  it("shows app section headings linking to their routes", () => {
    render(<ReviewBoard apps={MOCK_APPS} />);

    const linkA = screen.getByRole("link", { name: "App A" });
    expect(linkA.getAttribute("href")).toBe("/app-a");

    const linkB = screen.getByRole("link", { name: "App B" });
    expect(linkB.getAttribute("href")).toBe("/app-b");
  });

  it("rating a card removes it from the due list", async () => {
    render(<ReviewBoard apps={MOCK_APPS} />);

    expect(screen.getByText("Question A1")).toBeDefined();

    const showButtons = screen.getAllByRole("button", { name: "Show answer" });
    fireEvent.click(showButtons[0] as HTMLElement);

    const goodBtn = screen.getAllByRole("button", { name: "Rate Good" });
    await act(async () => {
      fireEvent.click(goodBtn[0] as HTMLElement);
    });

    expect(screen.queryByText("Question A1")).toBeNull();
  });

  it("renders empty state when no cards are due", () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString();
    const store = {
      "app-a": {
        "0": {
          id: "0",
          dueAt: futureDate,
          lastReviewedAt: null,
          stability: 1,
          difficulty: 5,
          reps: 1,
          lapses: 0,
          state: 2,
        },
        "1": {
          id: "1",
          dueAt: futureDate,
          lastReviewedAt: null,
          stability: 1,
          difficulty: 5,
          reps: 1,
          lapses: 0,
          state: 2,
        },
      },
      "app-b": {
        "0": {
          id: "0",
          dueAt: futureDate,
          lastReviewedAt: null,
          stability: 1,
          difficulty: 5,
          reps: 1,
          lapses: 0,
          state: 2,
        },
        "1": {
          id: "1",
          dueAt: futureDate,
          lastReviewedAt: null,
          stability: 1,
          difficulty: 5,
          reps: 1,
          lapses: 0,
          state: 2,
        },
      },
    };
    localStorage.setItem("creative-coding-library:sr:v1", JSON.stringify(store));

    render(<ReviewBoard apps={MOCK_APPS} />);

    expect(screen.getByText("Nothing due right now. Come back later.")).toBeDefined();
  });

  it("empty state renders when apps have no checks", () => {
    render(<ReviewBoard apps={EMPTY_APPS} />);
    expect(screen.getByText("Nothing due right now. Come back later.")).toBeDefined();
  });
});
