import { describe, it, expect, beforeEach } from "vitest";
import { wrapText } from "./layout-text";

// Minimal CanvasRenderingContext2D stub: measureText returns width equal to
// the number of characters in the string (1 unit each). This is sufficient
// for deterministic line-break testing without a real browser canvas.
function makeCtx(charWidth = 1): CanvasRenderingContext2D {
  return {
    measureText(text: string) {
      return { width: text.length * charWidth };
    },
  } as unknown as CanvasRenderingContext2D;
}

describe("wrapText", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = makeCtx(1);
  });

  it("returns an empty array for an empty string", () => {
    expect(wrapText(ctx, "", 100)).toEqual([]);
  });

  it("returns an empty array for a whitespace-only string", () => {
    expect(wrapText(ctx, "   ", 100)).toEqual([]);
  });

  it("returns a single line when the text fits", () => {
    expect(wrapText(ctx, "hello world", 20)).toEqual(["hello world"]);
  });

  it("breaks at a word boundary when the line overflows", () => {
    // maxWidth = 5, "hello" = 5, "hello world" = 11
    const lines = wrapText(ctx, "hello world", 5);
    expect(lines).toEqual(["hello", "world"]);
  });

  it("places an overlong word on its own line", () => {
    // maxWidth = 3, "superlongword" > 3
    const lines = wrapText(ctx, "superlongword short", 3);
    expect(lines[0]).toBe("superlongword");
    expect(lines[1]).toBe("short");
  });

  it("handles multiple spaces between words (splits on whitespace)", () => {
    const lines = wrapText(ctx, "a  b  c", 100);
    expect(lines).toEqual(["a b c"]);
  });

  it("packs as many words as fit before breaking", () => {
    // Each char = 1, maxWidth = 7
    // "one" = 3, "one two" = 7, "one two three" = 13 -> break
    // "three" = 5, "three four" = 10 -> break
    // "four" = 4
    const lines = wrapText(ctx, "one two three four", 7);
    expect(lines).toEqual(["one two", "three", "four"]);
  });
});
