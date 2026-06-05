import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { csvField, csvRow } from "../../../scripts/build-sr-deck.mjs";

describe("csvField", () => {
  it("returns plain value when no special characters", () => {
    expect(csvField("hello")).toBe("hello");
    expect(csvField("world")).toBe("world");
  });

  it("wraps in double-quotes when value contains a comma", () => {
    expect(csvField("a,b")).toBe('"a,b"');
  });

  it("wraps and escapes double-quotes per RFC 4180", () => {
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps when value contains a newline", () => {
    expect(csvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("wraps when value contains a carriage return", () => {
    expect(csvField("line1\rline2")).toBe('"line1\rline2"');
  });

  it("round-trips arbitrary strings without losing content", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const encoded = csvField(s);
        const isQuoted = encoded.startsWith('"') && encoded.endsWith('"');
        if (isQuoted) {
          const inner = encoded.slice(1, -1).replace(/""/g, '"');
          return inner === s;
        }
        return encoded === s;
      }),
    );
  });
});

describe("csvRow", () => {
  it("joins fields with commas", () => {
    expect(csvRow(["a", "b", "c"])).toBe("a,b,c");
  });

  it("quotes fields that need it", () => {
    expect(csvRow(["plain", "has,comma", "normal"])).toBe('plain,"has,comma",normal');
  });
});
