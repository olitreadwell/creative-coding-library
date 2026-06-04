import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useAnimationFrame } from "./useAnimationFrame";

function Harness({ onFrame }: { onFrame: (t: number) => void }) {
  useAnimationFrame(({ t }) => onFrame(t), { respectReducedMotion: false });
  return null;
}

function ReducedMotionHarness({ onFrame }: { onFrame: () => void }) {
  useAnimationFrame(() => onFrame(), { respectReducedMotion: true });
  return null;
}

describe("useAnimationFrame", () => {
  let rafCallbacks: Array<(t: number) => void>;

  beforeEach(() => {
    rafCallbacks = [];
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("invokes the callback on each frame", () => {
    const onFrame = vi.fn();
    render(<Harness onFrame={onFrame} />);
    rafCallbacks[0]?.(16);
    rafCallbacks[1]?.(32);
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it("does not start when prefers-reduced-motion matches and option is honored", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);
    const onFrame = vi.fn();
    render(<ReducedMotionHarness onFrame={onFrame} />);
    expect(rafCallbacks.length).toBe(0);
    expect(onFrame).not.toHaveBeenCalled();
  });
});
