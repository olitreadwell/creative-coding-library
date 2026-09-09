import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MasteryButton } from "./MasteryButton";

describe("MasteryButton", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders with aria-pressed=false initially", () => {
    render(<MasteryButton slug="test-concept" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("click toggles aria-pressed to true then back to false", async () => {
    render(<MasteryButton slug="toggle-concept" />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("renders understandWhen text when provided", () => {
    render(
      <MasteryButton
        slug="understand-concept"
        understandWhen="You can explain closures without notes."
      />,
    );
    expect(screen.getByText("You can explain closures without notes.")).toBeInTheDocument();
  });

  it("does not render understandWhen paragraph when not provided", () => {
    render(<MasteryButton slug="no-subtitle" />);
    expect(screen.queryByText(/You can explain/)).not.toBeInTheDocument();
  });
});
