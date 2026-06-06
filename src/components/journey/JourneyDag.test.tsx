import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import type { AppMeta } from "@/lib/creative/registry";

vi.mock("elkjs/lib/elk.bundled.js", () => {
  return {
    default: class MockELK {
      layout(graph: {
        id: string;
        children?: { id: string; width: number; height: number }[];
        edges?: { id: string; sources: string[]; targets: string[] }[];
      }) {
        const children = (graph.children ?? []).map((c, i) => ({
          ...c,
          x: i * 250,
          y: 0,
        }));
        return Promise.resolve({ ...graph, children });
      }
    },
  };
});

vi.mock("@xyflow/react", () => {
  const React = require("react");
  return {
    ReactFlow: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "react-flow" }, children),
    ReactFlowProvider: ({ children }: { children?: React.ReactNode }) => children,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    useNodesState: (initial: unknown[]) => {
      const [nodes, setNodes] = React.useState(initial);
      return [nodes, setNodes, () => {}];
    },
    useEdgesState: (initial: unknown[]) => {
      const [edges, setEdges] = React.useState(initial);
      return [edges, setEdges, () => {}];
    },
    useReactFlow: () => ({
      fitView: vi.fn(),
    }),
  };
});

import { JourneyDag } from "./JourneyDag";

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

describe("JourneyDag", () => {
  it("renders the react-flow container", () => {
    const apps: AppMeta[] = [makeApp("app-a"), makeApp("app-b", ["app-a"])];
    render(<JourneyDag apps={apps} />);
    expect(screen.getByTestId("react-flow")).toBeTruthy();
  });

  it("renders fallback list with all three node titles for A -> B -> C chain", async () => {
    const apps: AppMeta[] = [
      makeApp("app-a"),
      makeApp("app-b", ["app-a"]),
      makeApp("app-c", ["app-b"]),
    ];

    render(<JourneyDag apps={apps} />);

    const list = await screen.findByRole("list");
    const items = list.querySelectorAll("li");
    expect(items.length).toBe(3);

    const texts = Array.from(items).map((li) => li.textContent ?? "");
    expect(texts.some((t) => t.includes("App-a"))).toBe(true);
    expect(texts.some((t) => t.includes("App-b"))).toBe(true);
    expect(texts.some((t) => t.includes("App-c"))).toBe(true);
  });

  it("shows apps in topological order in the fallback list", async () => {
    const apps: AppMeta[] = [
      makeApp("app-c", ["app-b"]),
      makeApp("app-a"),
      makeApp("app-b", ["app-a"]),
    ];

    render(<JourneyDag apps={apps} />);

    const list = await screen.findByRole("list");
    const items = Array.from(list.querySelectorAll("li"));
    const titles = items.map((li) => li.querySelector("a")?.textContent ?? "");

    const aIdx = titles.indexOf("App-a");
    const bIdx = titles.indexOf("App-b");
    const cIdx = titles.indexOf("App-c");

    expect(aIdx).toBeGreaterThanOrEqual(0);
    expect(bIdx).toBeGreaterThanOrEqual(0);
    expect(cIdx).toBeGreaterThanOrEqual(0);
    expect(aIdx).toBeLessThan(bIdx);
    expect(bIdx).toBeLessThan(cIdx);
  });

  it("show as list details element is present with correct summary text", async () => {
    const apps: AppMeta[] = [makeApp("app-a"), makeApp("app-b", ["app-a"])];

    render(<JourneyDag apps={apps} />);

    await waitFor(() => {
      const details = document.querySelector("details");
      expect(details).not.toBeNull();
    });

    const details = document.querySelector("details");
    const summary = details?.querySelector("summary");
    expect(summary?.textContent).toContain("Show as list");
  });

  it("renders prereq info in the fallback list items", async () => {
    const apps: AppMeta[] = [makeApp("app-a"), makeApp("app-b", ["app-a"])];

    render(<JourneyDag apps={apps} />);

    const list = await screen.findByRole("list");
    const items = Array.from(list.querySelectorAll("li"));
    const bItem = items.find((li) => li.querySelector("a")?.textContent === "App-b");
    expect(bItem?.textContent).toContain("requires:");
    expect(bItem?.textContent).toContain("App-a");
  });
});
