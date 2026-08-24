import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { AppMeta, AppLevel } from "@/lib/creative/registry";

const mockReplace = vi.fn();
let mockSearchParamsString = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
  useRouter: () => ({ replace: mockReplace }),
}));

import { JourneyList } from "./JourneyList";

const MASTERY_KEY = "creative-coding-library:mastery:v1";

function makeApp(slug: string, opts: { prereqs?: string[]; level?: AppLevel } = {}): AppMeta {
  const { prereqs = [], level = 1 } = opts;
  return {
    slug,
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `${slug} description`,
    library: "p5",
    concepts: [`concept-${slug}`],
    level,
    technique: "canvas",
    license: "MIT",
    commercialUse: "personal-only",
    kind: "creative",
    builtAt: "2026-01-01",
    prereqs,
    understandWhen: `You get ${slug} when you can do it.`,
  };
}

beforeEach(() => {
  localStorage.clear();
  mockSearchParamsString = "";
  mockReplace.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("JourneyList — level grouping", () => {
  it("renders L1, L2, L3 headings for apps at each level", () => {
    const apps: AppMeta[] = [
      makeApp("alpha", { level: 1 }),
      makeApp("beta", { level: 2 }),
      makeApp("gamma", { level: 3 }),
    ];

    render(<JourneyList apps={apps} />);

    expect(screen.getByText("L1: Start here")).toBeInTheDocument();
    expect(screen.getByText("L2: More control")).toBeInTheDocument();
    expect(screen.getByText("L3: Complex systems")).toBeInTheDocument();
  });

  it("skips a level section when no apps belong to that level", () => {
    const apps: AppMeta[] = [makeApp("alpha", { level: 1 }), makeApp("gamma", { level: 3 })];

    render(<JourneyList apps={apps} />);

    expect(screen.getByText("L1: Start here")).toBeInTheDocument();
    expect(screen.queryByText("L2: More control")).toBeNull();
    expect(screen.getByText("L3: Complex systems")).toBeInTheDocument();
  });

  it("renders each app title as a link to its slug", () => {
    const apps: AppMeta[] = [makeApp("my-app", { level: 1 })];

    render(<JourneyList apps={apps} />);

    const link = screen.getByRole("link", { name: /My-app/i });
    expect(link).toHaveAttribute("href", "/my-app");
  });
});

describe("JourneyList — topological order", () => {
  it("shows a prereq app before its dependent in the same level", () => {
    const apps: AppMeta[] = [
      makeApp("dep", { level: 1, prereqs: ["base"] }),
      makeApp("base", { level: 1 }),
    ];

    render(<JourneyList apps={apps} />);

    const items = screen.getAllByRole("listitem");
    const slugs = items.map((li) => {
      const link = li.querySelector("a");
      return link?.getAttribute("href")?.replace("/", "") ?? "";
    });

    const baseIdx = slugs.indexOf("base");
    const depIdx = slugs.indexOf("dep");
    expect(baseIdx).toBeGreaterThanOrEqual(0);
    expect(depIdx).toBeGreaterThanOrEqual(0);
    expect(baseIdx).toBeLessThan(depIdx);
  });

  it("sorts alphabetically by title when two apps have equal prereq depth and level", () => {
    const apps: AppMeta[] = [makeApp("zebra", { level: 1 }), makeApp("apple", { level: 1 })];

    render(<JourneyList apps={apps} />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href") ?? "");

    const appleIdx = hrefs.indexOf("/apple");
    const zebraIdx = hrefs.indexOf("/zebra");
    expect(appleIdx).toBeLessThan(zebraIdx);
  });
});

describe("JourneyList — locked state", () => {
  it("shows Locked hint when a prereq is unmastered", () => {
    const apps: AppMeta[] = [
      makeApp("prereq-one", { level: 1 }),
      makeApp("advanced", { level: 2, prereqs: ["prereq-one"] }),
    ];

    render(<JourneyList apps={apps} />);

    const lockedHint = screen.getByText(/Locked — needs:/i);
    expect(lockedHint).toBeInTheDocument();
    expect(lockedHint.textContent).toMatch(/Prereq-one/);
  });

  it("does not show Locked hint when all prereqs are mastered", () => {
    localStorage.setItem(
      MASTERY_KEY,
      JSON.stringify({ foundation: { mastered: true, masteredAt: "2026-01-01T00:00:00.000Z" } }),
    );

    const apps: AppMeta[] = [
      makeApp("foundation", { level: 1 }),
      makeApp("advanced", { level: 2, prereqs: ["foundation"] }),
    ];

    render(<JourneyList apps={apps} />);

    expect(screen.queryByText(/Locked — needs:/i)).toBeNull();
  });
});

describe("JourneyList — mastery state", () => {
  it("renders MasteryButton for each app", () => {
    const apps: AppMeta[] = [makeApp("solo", { level: 1 })];

    render(<JourneyList apps={apps} />);

    const button = screen.getByRole("button", { name: /Mark as understood/i });
    expect(button).toBeInTheDocument();
  });

  it("reflects mastered state from localStorage", () => {
    localStorage.setItem(
      MASTERY_KEY,
      JSON.stringify({ solo: { mastered: true, masteredAt: "2026-01-01T00:00:00.000Z" } }),
    );

    const apps: AppMeta[] = [makeApp("solo", { level: 1 })];

    render(<JourneyList apps={apps} />);

    const button = screen.getByRole("button", { name: /I get this/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});

describe("JourneyList — visibility toggle", () => {
  it("defaults to Show all (renders locked cards)", () => {
    const apps: AppMeta[] = [
      makeApp("base", { level: 1 }),
      makeApp("locked-app", { level: 2, prereqs: ["base"] }),
    ];

    render(<JourneyList apps={apps} />);

    expect(screen.getByText(/Locked — needs:/i)).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /Locked — Locked-app/i })).toBeInTheDocument();
  });

  it("clicking Hide locked updates URL param to locked=hide", () => {
    const apps: AppMeta[] = [makeApp("solo", { level: 1 })];

    render(<JourneyList apps={apps} />);

    const hideBtn = screen.getByRole("button", { name: /Hide locked/i });
    fireEvent.click(hideBtn);

    expect(mockReplace).toHaveBeenCalledWith("?locked=hide");
  });

  it("with locked=hide, locked cards are not rendered", () => {
    mockSearchParamsString = "locked=hide";

    const apps: AppMeta[] = [
      makeApp("base", { level: 1 }),
      makeApp("locked-app", { level: 2, prereqs: ["base"] }),
    ];

    render(<JourneyList apps={apps} />);

    expect(screen.queryByText(/Locked — needs:/i)).toBeNull();
    expect(screen.queryByRole("listitem", { name: /Locked — Locked-app/i })).toBeNull();
  });

  it("Open anyway link navigates to the app slug", () => {
    const apps: AppMeta[] = [
      makeApp("base", { level: 1 }),
      makeApp("locked-app", { level: 2, prereqs: ["base"] }),
    ];

    render(<JourneyList apps={apps} />);

    const openAnywayLink = screen.getByRole("link", { name: /Open anyway/i });
    expect(openAnywayLink).toHaveAttribute("href", "/locked-app");
  });

  it("aria-label on locked card includes unmastered prereq title", () => {
    const apps: AppMeta[] = [
      makeApp("pointer-flow", { level: 1 }),
      makeApp("boids", { level: 2, prereqs: ["pointer-flow"] }),
    ];

    render(<JourneyList apps={apps} />);

    const lockedItem = screen.getByRole("listitem", { name: /Locked — Boids/i });
    expect(lockedItem.getAttribute("aria-label")).toMatch(/unmastered prereqs: Pointer-flow/i);
  });

  it("shows hidden count message when all apps in a level are locked and filter is hide", () => {
    mockSearchParamsString = "locked=hide";

    const apps: AppMeta[] = [
      makeApp("base", { level: 1 }),
      makeApp("locked-app", { level: 2, prereqs: ["base"] }),
    ];

    render(<JourneyList apps={apps} />);

    expect(screen.getByText(/locked app.? hidden in this level/i)).toBeInTheDocument();
  });

  it("clicking Show all removes locked param from URL", () => {
    mockSearchParamsString = "locked=hide";

    const apps: AppMeta[] = [makeApp("solo", { level: 1 })];

    render(<JourneyList apps={apps} />);

    const showAllBtn = screen.getByRole("button", { name: /Show all/i });
    fireEvent.click(showAllBtn);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
