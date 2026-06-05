"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export type FrameInfo = {
  t: number;
  dt: number;
  frame: number;
};

export type AnimationFrameOptions = {
  // Pause when the page is not visible (default: true).
  pauseWhenHidden?: boolean;
  // Honor prefers-reduced-motion and never start (default: true).
  respectReducedMotion?: boolean;
  // Under reduced motion, how many frames to run synchronously to compose the
  // static still (default: 1). Accumulation sketches (flow fields, reaction
  // diffusion) need many frames before a single frame looks meaningful, so they
  // pass a higher count. The browser only paints once, after the loop finishes,
  // so this stays motion-free.
  reducedMotionFrames?: number;
};

export function useAnimationFrame(
  callback: (info: FrameInfo) => void,
  options: AnimationFrameOptions = {},
): void {
  const { pauseWhenHidden = true, respectReducedMotion = true, reducedMotionFrames = 1 } = options;
  const cbRef = useRef(callback);
  useLayoutEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (respectReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // Honor reduced motion: compose a static still by advancing a fixed number
      // of frames synchronously, then stop. No animation is ever shown.
      const steps = Math.max(1, Math.floor(reducedMotionFrames));
      const dt = 1 / 60;
      for (let i = 0; i < steps; i++) {
        cbRef.current({ t: i * dt, dt, frame: i });
      }
      return;
    }

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
  }, [pauseWhenHidden, respectReducedMotion]);
}
