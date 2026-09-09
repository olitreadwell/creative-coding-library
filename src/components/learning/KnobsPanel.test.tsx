import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { KnobsPanel } from "./KnobsPanel";

beforeAll(() => {
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      constructor(type: string, params?: PointerEventInit) {
        super(type, params);
      }
    }
    Object.defineProperty(window, "PointerEvent", {
      value: PointerEventPolyfill,
      writable: true,
    });
  }
});

describe("KnobsPanel", () => {
  it("renders the panel title", () => {
    render(<KnobsPanel knobs={[]} onChange={vi.fn()} title="Test Controls" />);
    expect(screen.getByText("Test Controls")).toBeInTheDocument();
  });

  it("renders default title when none provided", () => {
    render(<KnobsPanel knobs={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Controls")).toBeInTheDocument();
  });

  it("renders a number knob label", () => {
    const knob = {
      kind: "number" as const,
      key: "speed",
      label: "Speed",
      min: 0,
      max: 10,
      step: 0.5,
      value: 3,
    };
    render(<KnobsPanel knobs={[knob]} onChange={vi.fn()} />);
    expect(screen.getByText("Speed")).toBeInTheDocument();
  });

  it("renders a select knob label", () => {
    const knob = {
      kind: "select" as const,
      key: "palette",
      label: "Palette",
      options: ["cool", "warm", "mono"],
      value: "cool",
    };
    render(<KnobsPanel knobs={[knob]} onChange={vi.fn()} />);
    expect(screen.getByText("Palette")).toBeInTheDocument();
  });

  it("renders a toggle knob", () => {
    const knob = {
      kind: "toggle" as const,
      key: "grid",
      label: "Show grid",
      value: false,
    };
    render(<KnobsPanel knobs={[knob]} onChange={vi.fn()} />);
    expect(screen.getByText("Show grid")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls onChange with key and boolean when toggle fires", () => {
    const onChange = vi.fn();
    const knob = {
      kind: "toggle" as const,
      key: "grid",
      label: "Show grid",
      value: false,
    };
    render(<KnobsPanel knobs={[knob]} onChange={onChange} />);
    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkbox) {
      fireEvent.click(checkbox);
    } else {
      const switchEl = screen.getByRole("switch");
      fireEvent.click(switchEl);
    }
    expect(onChange).toHaveBeenCalledWith("grid", true);
  });

  it("renders multiple knobs", () => {
    const knobs = [
      { kind: "number" as const, key: "speed", label: "Speed", min: 0, max: 10, value: 3 },
      { kind: "toggle" as const, key: "grid", label: "Show grid", value: true },
      {
        kind: "select" as const,
        key: "palette",
        label: "Palette",
        options: ["a", "b"],
        value: "a",
      },
    ];
    render(<KnobsPanel knobs={knobs} onChange={vi.fn()} />);
    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(screen.getByText("Show grid")).toBeInTheDocument();
    expect(screen.getByText("Palette")).toBeInTheDocument();
  });
});
