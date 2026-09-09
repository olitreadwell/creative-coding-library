/**
 * Wraps a string into lines that fit within `maxWidth` CSS pixels.
 *
 * Uses Canvas 2D's measureText for accurate glyph metrics. Returns an
 * empty array when the text is empty or the context is unavailable.
 *
 * @param ctx    - A 2D rendering context (used only for measurement).
 * @param text   - The string to wrap.
 * @param maxWidth - Maximum line width in CSS pixels.
 * @returns Array of line strings.
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text.trim()) return [];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // A single word wider than maxWidth still gets its own line.
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}
