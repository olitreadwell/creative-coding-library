"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlaying } from "./motion";

export type FrameInfo = {
  t: number;
  dt: number;
  frame: number;
};

export type AnimationFrameOptions = {
  // Pause when the page is not visible (default: true).
  pauseWhenHidden?: boolean;
  // When paused (reduced motion default, or the user stopped motion) and the
  // sketch has not animated yet, how many frames to run synchronously to compose
  // a static still (default: 1). Accumulation sketches (flow fields, reaction
  // diffusion) need many frames before a single frame looks meaningful, so they
  // pass a higher count. The browser only paints once, after the loop finishes,
  // so this stays motion-free.
  reducedMotionFrames?: number;
};

// Drives a sketch's render callback. Whether it animates is governed by the
// shared motion store (see ./motion): autoplay+loop unless the user's OS asks to
// reduce motion, and flippable by the PlayShell Play/Pause control. When not
// playing, the sketch still composes a static still so the canvas isn't blank.
export function useAnimationFrame(
  callback: (info: FrameInfo) => void,
  options: AnimationFrameOptions = {},
): void {
  const { pauseWhenHidden = true, reducedMotionFrames = 1 } = options;
  const playing = usePlaying();
  const cbRef = useRef(callback);
  useLayoutEffect(() => {
    cbRef.current = callback;
  });
  // Tracks whether the loop has ever run, so pausing a running animation freezes
  // the last frame rather than recomposing a still over it.
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!playing) {
      if (!startedRef.current) {
        // Never animated: compose a static still so the canvas shows something.
        const steps = Math.max(1, Math.floor(reducedMotionFrames));
        const dt = 1 / 60;
        for (let i = 0; i < steps; i++) {
          cbRef.current({ t: i * dt, dt, frame: i });
        }
      }
      // Paused: freeze (no requestAnimationFrame).
      return;
    }

    startedRef.current = true;

    let raf = 0;
    let start = 0;
    let last = 0;
    let frame = 0;
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      if (start === 0) {
        start = now;
        last = now;
      }
      const t = (now - start) / 1000;
      const dt = (now - last) / 1000;
      last = now;
      cbRef.current({ t, dt, frame });
      frame += 1;
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (!pauseWhenHidden) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        // Reset timing so dt doesn't jump after a long pause.
        start = 0;
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playing, pauseWhenHidden, reducedMotionFrames]);
}
