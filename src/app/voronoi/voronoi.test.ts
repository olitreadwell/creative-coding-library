import { describe, it, expect } from "vitest";
import { nearestSiteIndex } from "./voronoi";
import type { Site } from "./voronoi";

describe("nearestSiteIndex", () => {
  it("returns -1 for an empty sites array", () => {
    expect(nearestSiteIndex(0, 0, [])).toBe(-1);
  });

  it("returns 0 for a single site", () => {
    const sites: Site[] = [{ x: 5, y: 10 }];
    expect(nearestSiteIndex(0, 0, sites)).toBe(0);
  });

  it("returns the index of the exact matching site", () => {
    const sites: Site[] = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 100, y: 200 },
    ];
    expect(nearestSiteIndex(10, 20, sites)).toBe(1);
  });

  it("returns the index of the closest site when equidistant ties are broken by first found", () => {
    const sites: Site[] = [
      { x: -5, y: 0 },
      { x: 5, y: 0 },
    ];
    // (0,0) is equidistant from both; first site wins
    expect(nearestSiteIndex(0, 0, sites)).toBe(0);
  });

  it("correctly computes nearest among many sites using Euclidean distance", () => {
    const sites: Site[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 50 },
    ];
    // (55, 48) is close to site[2] at (50,50): dist^2 = 25 + 4 = 29
    // vs site[1] at (100,0): dist^2 = 2025 + 2304 = 4329
    // vs site[0] at (0,0): dist^2 = 3025 + 2304 = 5329
    expect(nearestSiteIndex(55, 48, sites)).toBe(2);
  });

  it("handles negative coordinates", () => {
    const sites: Site[] = [
      { x: -100, y: -100 },
      { x: 0, y: 0 },
    ];
    expect(nearestSiteIndex(-90, -90, sites)).toBe(0);
    expect(nearestSiteIndex(1, 1, sites)).toBe(1);
  });

  it("handles floating-point coordinates", () => {
    const sites: Site[] = [
      { x: 0.5, y: 0.5 },
      { x: 9.5, y: 9.5 },
    ];
    expect(nearestSiteIndex(0.6, 0.7, sites)).toBe(0);
    expect(nearestSiteIndex(8.0, 9.0, sites)).toBe(1);
  });

  it("is deterministic: same inputs produce the same result", () => {
    const sites: Site[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 },
    ];
    const first = nearestSiteIndex(25, 35, sites);
    const second = nearestSiteIndex(25, 35, sites);
    expect(first).toBe(second);
  });
});
