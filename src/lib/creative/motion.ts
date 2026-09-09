"use client";

import { useSyncExternalStore } from "react";

// Global, per-document motion preference. One creative sketch runs per page
// (standalone or inside the detail-page iframe), so a module-level singleton is
// the right scope: the Play/Pause control in PlayShell and the animation loops
// in each sketch read and write the same value.
//
// Default: play unless the user's OS asks to reduce motion. Either way the user
// can flip it with the toggle, so reduced-motion users can opt into animation
// and everyone can stop autoplay/looping.

let playing: boolean | null = null;
const listeners = new Set<() => void>();

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function ensureInit(): void {
  if (playing === null) playing = !prefersReducedMotion();
}

export function getPlaying(): boolean {
  ensureInit();
  return playing as boolean;
}

export function setPlaying(next: boolean): void {
  ensureInit();
  if (playing === next) return;
  playing = next;
  for (const l of listeners) l();
}

export function togglePlaying(): void {
  setPlaying(!getPlaying());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Server snapshot is "true" (we cannot read prefers-reduced-motion on the
// server). Components that render text from this value should guard with
// suppressHydrationWarning.
export function usePlaying(): boolean {
  return useSyncExternalStore(subscribe, getPlaying, () => true);
}
