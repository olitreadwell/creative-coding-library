import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallCheck } from "./RecallCheck";

const checks = [
  { q: "What is the main axis?", a: "The axis set by flex-direction." },
  { q: "What does align-items control?", a: "Alignment on the cross axis." },
  { q: "When is justify-content inert?", a: "When items fill the row." },
];

describe("RecallCheck", () => {
  it("renders all questions", () => {
    render(<RecallCheck checks={checks} />);
    for (const { q } of checks) {
      expect(screen.getByText(q)).toBeInTheDocument();
    }
  });

  it("does not show any answers before interaction", () => {
    render(<RecallCheck checks={checks} />);
    for (const { a } of checks) {
      expect(screen.queryByText(a)).not.toBeInTheDocument();
    }
  });

  it("shows the answer for the clicked item only", () => {
    render(<RecallCheck checks={checks} />);
    const buttons = screen.getAllByRole("button", { name: "Show answer" });
    fireEvent.click(buttons[1]!);
    expect(screen.queryByText("The axis set by flex-direction.")).not.toBeInTheDocument();
    expect(screen.getByText("Alignment on the cross axis.")).toBeInTheDocument();
    expect(screen.queryByText("When items fill the row.")).not.toBeInTheDocument();
  });

  it("toggling one item does not toggle others", () => {
    render(<RecallCheck checks={checks} />);
    const buttons = screen.getAllByRole("button", { name: "Show answer" });
    fireEvent.click(buttons[0]!);
    for (const { a } of checks.slice(1)) {
      expect(screen.queryByText(a)).not.toBeInTheDocument();
    }
  });

  it("hides the answer when toggled a second time", () => {
    render(<RecallCheck checks={checks} />);
    const buttons = screen.getAllByRole("button", { name: "Show answer" });
    fireEvent.click(buttons[0]!);
    expect(screen.getByText("The axis set by flex-direction.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide answer" }));
    expect(screen.queryByText("The axis set by flex-direction.")).not.toBeInTheDocument();
  });
});
