import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { AppMeta } from "@/lib/creative/registry";
import { JourneyView } from "./JourneyView";

const MASTERY_KEY = "creative-coding-library:mastery:v1";

function makeApp(slug: string, prereqs: string[] = []): AppMeta {
  return {
    slug,
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `${slug} description`,
    library: "p5",
    concepts: [slug],
    level: 1,
    technique: "canvas",
    license: "MIT",
    commercialUse: "personal-only",
    kind: "creative",
    builtAt: "2026-01-01",
    prereqs,
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("JourneyView — topology", () => {
  it("places A in col 0, B in col 1, C in col 2 for a linear chain", () => {
    const apps: AppMeta[] = [
      makeApp("app-a"),
      makeApp("app-b", ["app-a"]),
      makeApp("app-c", ["app-b"]),
    ];

    render(<JourneyView apps={apps} />);

    const aLink = screen.getByRole("link", { name: /App-a/i });
    const bLink = screen.getByRole("link", { name: /App-b/i });
    const cLink = screen.getByRole("link", { name: /App-c/i });

    const aStyle = window.getComputedStyle(aLink.parentElement!);
    const bStyle = window.getComputedStyle(bLink.parentElement!);
    const cStyle = window.getComputedStyle(cLink.parentElement!);

    const aLeft = parseInt(aLink.parentElement!.style.left);
    const bLeft = parseInt(bLink.parentElement!.style.left);
    const cLeft = parseInt(cLink.parentElement!.style.left);

    void aStyle;
    void bStyle;
    void cStyle;

    expect(aLeft).toBe(0);
    expect(bLeft).toBeGreaterThan(aLeft);
    expect(cLeft).toBeGreaterThan(bLeft);
  });

  it("places all apps in col 0 when no prereqs exist", () => {
    const apps: AppMeta[] = [makeApp("alpha"), makeApp("beta"), makeApp("gamma")];

    render(<JourneyView apps={apps} />);

    const links = screen.getAllByRole("link");
    for (const link of links) {
      const left = parseInt(link.parentElement!.style.left);
      expect(left).toBe(0);
    }

    expect(screen.getByText("No prerequisites declared yet.")).toBeInTheDocument();
  });

  it("renders without throwing when a cycle exists (A prereqs B, B prereqs A)", () => {
    const apps: AppMeta[] = [makeApp("node-a", ["node-b"]), makeApp("node-b", ["node-a"])];

    expect(() => {
      render(<JourneyView apps={apps} />);
    }).not.toThrow();

    expect(screen.getByRole("link", { name: /Node-a/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Node-b/i })).toBeInTheDocument();
  });
});

describe("JourneyView — mastery styling", () => {
  it("mastered node has the journey-node--mastered class", () => {
    localStorage.setItem(
      MASTERY_KEY,
      JSON.stringify({ "base-app": { mastered: true, masteredAt: "2026-01-01T00:00:00.000Z" } }),
    );

    render(<JourneyView apps={[makeApp("base-app")]} />);

    const link = screen.getByRole("link", { name: /Base-app/i });
    expect(link.className).toContain("journey-node--mastered");
  });

  it("locked node has journey-node--locked class and accessible tooltip mentioning missing prereq", () => {
    localStorage.setItem(
      MASTERY_KEY,
      JSON.stringify({ "prereq-app": { mastered: false, masteredAt: "" } }),
    );

    const apps: AppMeta[] = [makeApp("prereq-app"), makeApp("dependent-app", ["prereq-app"])];

    render(<JourneyView apps={apps} />);

    const depLink = screen.getByRole("link", { name: /Dependent-app/i });
    expect(depLink.className).toContain("journey-node--locked");

    const describedById = depLink.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    const tooltip = document.getElementById(describedById!);
    expect(tooltip?.textContent).toMatch(/prereq-app/);
  });
});
