import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockReplace = vi.fn();
let mockSearchParamsString = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/creative/registry.generated", () => ({
  apps: [],
}));

vi.mock("@/components/journey/JourneyList", () => ({
  JourneyList: () => <div data-testid="journey-view" />,
}));

vi.mock("@/components/catalog", () => ({
  Catalog: () => <div data-testid="catalog-view" />,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}));

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    mockSearchParamsString = "";
    mockReplace.mockClear();
  });

  it("renders Journey view by default", () => {
    render(<HomePage />);
    expect(screen.getByTestId("journey-view")).toBeDefined();
    expect(screen.queryByTestId("catalog-view")).toBeNull();
  });

  it("renders Catalog view when ?view=catalog is set", () => {
    mockSearchParamsString = "view=catalog";
    render(<HomePage />);
    expect(screen.getByTestId("catalog-view")).toBeDefined();
    expect(screen.queryByTestId("journey-view")).toBeNull();
  });

  it("clicking Catalog toggle switches view", () => {
    render(<HomePage />);
    const catalogBtn = screen.getByRole("button", { name: /catalog/i });
    fireEvent.click(catalogBtn);
    expect(mockReplace).toHaveBeenCalledWith("?view=catalog");
  });

  it("clicking Journey toggle calls replace with '/'", () => {
    mockSearchParamsString = "view=catalog";
    render(<HomePage />);
    const journeyBtn = screen.getByRole("button", { name: /journey/i });
    fireEvent.click(journeyBtn);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("toggle buttons have aria-pressed matching current view", () => {
    render(<HomePage />);
    const journeyBtn = screen.getByRole("button", { name: /journey/i });
    const catalogBtn = screen.getByRole("button", { name: /catalog/i });
    expect(journeyBtn.getAttribute("aria-pressed")).toBe("true");
    expect(catalogBtn.getAttribute("aria-pressed")).toBe("false");
  });
});
