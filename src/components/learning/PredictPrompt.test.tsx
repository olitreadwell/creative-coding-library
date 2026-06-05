import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PredictPrompt } from "./PredictPrompt";

describe("PredictPrompt", () => {
  it("renders the prompt text", () => {
    render(<PredictPrompt prompt="What will this output?" reveal="42" />);
    expect(screen.getByText("What will this output?")).toBeInTheDocument();
  });

  it("does not show the reveal text before clicking", () => {
    render(<PredictPrompt prompt="Predict this" reveal="The answer" />);
    expect(screen.queryByText("The answer")).not.toBeInTheDocument();
  });

  it("shows the reveal text after clicking Reveal", () => {
    render(<PredictPrompt prompt="Predict this" reveal="The answer" />);
    fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
    expect(screen.getByText("The answer")).toBeInTheDocument();
  });

  it("starts open when defaultOpen is true", () => {
    render(<PredictPrompt prompt="Already open" reveal="Shown" defaultOpen />);
    expect(screen.getByText("Shown")).toBeInTheDocument();
  });

  it("renders without a reveal prop", () => {
    render(<PredictPrompt prompt="No reveal here" />);
    expect(screen.getByText("No reveal here")).toBeInTheDocument();
  });
});
