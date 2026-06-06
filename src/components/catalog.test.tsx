import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Catalog } from "./catalog";
import type { AppMeta } from "@/lib/creative/registry";

const mockReplace = vi.fn();
const mockParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockParams,
}));

const BASE: Pick<AppMeta, "technique" | "license" | "commercialUse" | "kind"> = {
  technique: "test",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
};

const APPS: AppMeta[] = [
  {
    ...BASE,
    slug: "app-a",
    title: "App A",
    description: "First app",
    library: "p5",
    level: 1,
    builtAt: "2024-01-01",
    concepts: ["color", "noise"],
  },
  {
    ...BASE,
    slug: "app-b",
    title: "App B",
    description: "Second app",
    library: "canvas",
    level: 2,
    builtAt: "2024-02-01",
    concepts: ["animation", "color"],
  },
  {
    ...BASE,
    slug: "app-c",
    title: "App C",
    description: "Third app",
    library: "p5",
    level: 3,
    builtAt: "2024-03-01",
    concepts: ["physics"],
  },
];

beforeEach(() => {
  mockReplace.mockClear();
  for (const key of [...mockParams.keys()]) {
    mockParams.delete(key);
  }
});

describe("Catalog URL state", () => {
  it("reads initial sort from URL params", () => {
    mockParams.set("sort", "newest");
    render(<Catalog apps={APPS} />);
    expect(screen.getByLabelText("Sort")).toBeInTheDocument();
  });

  it("reads initial library filter from URL params", () => {
    mockParams.set("library", "p5");
    render(<Catalog apps={APPS} />);
    const p5Chips = screen.getAllByText("p5");
    const pressed = p5Chips.find((el) => el.closest("[aria-pressed='true']"));
    expect(pressed).toBeDefined();
  });

  it("reads initial search query from URL params", () => {
    mockParams.set("q", "first");
    render(<Catalog apps={APPS} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("first");
  });
});

describe("Catalog multi-select toggle", () => {
  it("shows all apps when no library filter is active", () => {
    render(<Catalog apps={APPS} />);
    expect(screen.getByText("App A")).toBeInTheDocument();
    expect(screen.getByText("App B")).toBeInTheDocument();
    expect(screen.getByText("App C")).toBeInTheDocument();
  });

  it("calls router.replace with library param when a library chip is clicked", () => {
    render(<Catalog apps={APPS} />);
    const chips = screen.getAllByText("p5");
    const chip = chips.find((el) => el.tagName === "BUTTON");
    expect(chip).toBeDefined();
    fireEvent.click(chip!);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("library=p5"),
      expect.anything(),
    );
  });

  it("toggling an active library removes it from the param", () => {
    mockParams.set("library", "p5");
    render(<Catalog apps={APPS} />);
    const chips = screen.getAllByText("p5");
    const chip = chips.find((el) => el.tagName === "BUTTON");
    expect(chip).toBeDefined();
    fireEvent.click(chip!);
    const call = mockReplace.mock.calls[0]?.[0] as string | undefined;
    expect(call).toBeDefined();
    const qs = new URLSearchParams(call!.replace(/^\?/, ""));
    expect(qs.get("library")).toBeNull();
  });

  it("selecting a second library appends to the param", () => {
    mockParams.set("library", "p5");
    render(<Catalog apps={APPS} />);
    const chips = screen.getAllByText("canvas");
    const chip = chips.find((el) => el.tagName === "BUTTON");
    expect(chip).toBeDefined();
    fireEvent.click(chip!);
    const call = mockReplace.mock.calls[0]?.[0] as string | undefined;
    expect(call).toBeDefined();
    const qs = new URLSearchParams(call!.replace(/^\?/, ""));
    const libs = qs.get("library")?.split(",") ?? [];
    expect(libs).toContain("p5");
    expect(libs).toContain("canvas");
  });
});

describe("Catalog clear filters", () => {
  it("does not show clear button when no filters are active", () => {
    render(<Catalog apps={APPS} />);
    expect(screen.queryByText("Clear filters")).toBeNull();
  });

  it("shows clear button when a library filter is active", () => {
    mockParams.set("library", "p5");
    render(<Catalog apps={APPS} />);
    expect(screen.getByText("Clear filters")).toBeInTheDocument();
  });

  it("clear button calls router.replace with empty params", () => {
    mockParams.set("library", "p5");
    render(<Catalog apps={APPS} />);
    const clearBtn = screen.getAllByText("Clear filters")[0];
    expect(clearBtn).toBeDefined();
    fireEvent.click(clearBtn!);
    expect(mockReplace).toHaveBeenCalledWith("?", expect.anything());
  });

  it("empty state shows clear filters action when filters are active", () => {
    mockParams.set("q", "zzznomatch");
    render(<Catalog apps={APPS} />);
    expect(screen.getByText("No apps match these filters.")).toBeInTheDocument();
    expect(screen.getAllByText("Clear filters").length).toBeGreaterThan(0);
  });
});
