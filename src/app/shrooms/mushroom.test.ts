import { describe, it, expect } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { makeMushroom, scatterMushrooms, capColor, stemColor, spotColor } from "./mushroom";

describe("makeMushroom", () => {
  it("returns deterministic geometry for the same rng state", () => {
    const rng1 = makeRng(42);
    const rng2 = makeRng(42);
    const m1 = makeMushroom(rng1, 100, 400);
    const m2 = makeMushroom(rng2, 100, 400);
    expect(m1).toEqual(m2);
  });

  it("preserves the x and baseY arguments", () => {
    const rng = makeRng(7);
    const m = makeMushroom(rng, 250, 500);
    expect(m.x).toBe(250);
    expect(m.baseY).toBe(500);
  });

  it("keeps stemH positive", () => {
    const rng = makeRng(99);
    const m = makeMushroom(rng, 0, 300);
    expect(m.stemH).toBeGreaterThan(0);
  });

  it("keeps capRx and capRy positive", () => {
    const rng = makeRng(13);
    const m = makeMushroom(rng, 0, 300);
    expect(m.capRx).toBeGreaterThan(0);
    expect(m.capRy).toBeGreaterThan(0);
  });

  it("keeps depth in [0, 1]", () => {
    for (let seed = 0; seed < 50; seed++) {
      const rng = makeRng(seed);
      const m = makeMushroom(rng, 0, 0);
      expect(m.depth).toBeGreaterThanOrEqual(0);
      expect(m.depth).toBeLessThanOrEqual(1);
    }
  });

  it("keeps colorIdx in [0, 5]", () => {
    for (let seed = 0; seed < 50; seed++) {
      const rng = makeRng(seed);
      const m = makeMushroom(rng, 0, 0);
      expect(m.colorIdx).toBeGreaterThanOrEqual(0);
      expect(m.colorIdx).toBeLessThanOrEqual(5);
    }
  });
});

describe("scatterMushrooms", () => {
  it("returns exactly count mushrooms", () => {
    const rng = makeRng("scatter-test");
    const list = scatterMushrooms(rng, 10, 800, 600);
    expect(list).toHaveLength(10);
  });

  it("sorts mushrooms back-to-front by depth", () => {
    const rng = makeRng("depth-sort");
    const list = scatterMushrooms(rng, 20, 800, 600);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const curr = list[i];
      if (prev !== undefined && curr !== undefined) {
        expect(prev.depth).toBeLessThanOrEqual(curr.depth);
      }
    }
  });

  it("places all mushrooms within canvas width", () => {
    const rng = makeRng("bounds");
    const list = scatterMushrooms(rng, 30, 800, 600);
    for (const m of list) {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThan(800);
    }
  });
});

describe("color helpers", () => {
  it("capColor returns a hex string on dark theme", () => {
    const rng = makeRng(1);
    const m = makeMushroom(rng, 0, 0);
    const color = capColor(m, "dark");
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("capColor returns a hex string on light theme", () => {
    const rng = makeRng(2);
    const m = makeMushroom(rng, 0, 0);
    const color = capColor(m, "light");
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("stemColor differs between light and dark", () => {
    expect(stemColor("dark")).not.toBe(stemColor("light"));
  });

  it("spotColor differs between light and dark", () => {
    expect(spotColor("dark")).not.toBe(spotColor("light"));
  });
});
