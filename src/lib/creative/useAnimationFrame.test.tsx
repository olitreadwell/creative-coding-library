import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useAnimationFrame } from "./useAnimationFrame";
import { setPlaying } from "./motion";

function Harness({ onFrame }: { onFrame: (t: number) => void }) {
  useAnimationFrame(({ t }) => onFrame(t));
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

  it("loops, invoking the callback each frame, when playing", () => {
    setPlaying(true);
    const onFrame = vi.fn();
    render(<Harness onFrame={onFrame} />);
    rafCallbacks[0]?.(16);
    rafCallbacks[1]?.(32);
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it("composes a single static still and does not loop when paused", () => {
    setPlaying(false);
    const onFrame = vi.fn();
    render(<Harness onFrame={onFrame} />);
    // Paused: no rAF loop, but one still frame is painted so it isn't blank.
    expect(rafCallbacks.length).toBe(0);
    expect(onFrame).toHaveBeenCalledTimes(1);
  });
});
