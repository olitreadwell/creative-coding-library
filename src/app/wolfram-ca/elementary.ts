/**
 * Pure Wolfram elementary cellular automaton math.
 * No DOM imports — safe to run in any environment.
 *
 * An elementary CA is a 1D binary grid where each cell's next state is
 * determined by itself and its two immediate neighbors. The rule is encoded
 * as an 8-bit number (0-255): each of the 8 possible 3-cell neighborhoods
 * maps to a bit in that number.
 *
 * Neighborhoods and their bit positions:
 *   111 -> bit 7   110 -> bit 6   101 -> bit 5   100 -> bit 4
 *   011 -> bit 3   010 -> bit 2   001 -> bit 1   000 -> bit 0
 */

/**
 * Computes the next row of a Wolfram elementary CA.
 *
 * Neighbors wrap around (toroidal boundary): the leftmost cell's left
 * neighbor is the rightmost cell, and vice versa.
 *
 * @param row - Current generation as a Uint8Array of 0/1 values
 * @param rule - Wolfram rule number in [0, 255]
 * @returns New Uint8Array of the same length representing the next generation
 * @example
 * const seed = firstRow(11, 'center');
 * const next = nextRow(seed, 90); // one step of rule 90
 */
export function nextRow(row: Uint8Array, rule: number): Uint8Array {
  const len = row.length;
  const out = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    // Wraparound neighbors.
    const left = row[(i - 1 + len) % len] as number;
    const center = row[i] as number;
    const right = row[(i + 1) % len] as number;

    // The neighborhood index is a 3-bit number: left is MSB, right is LSB.
    const neighborhood = (left << 2) | (center << 1) | right;

    // Extract the corresponding bit from the rule byte.
    out[i] = (rule >> neighborhood) & 1;
  }

  return out;
}

/**
 * Creates the initial row for a CA simulation.
 *
 * @param width - Number of cells in the row (must be >= 1)
 * @param seed - Either "center" (a single 1 in the middle) or a bit pattern
 *               as a plain number whose binary representation fills the row
 *               right-aligned. Defaults to "center".
 * @returns Uint8Array of 0/1 values of length `width`
 * @example
 * firstRow(7, 'center') // => [0,0,0,1,0,0,0]
 * firstRow(4, 0b1010)   // => [1,0,1,0]
 */
export function firstRow(width: number, seed: "center" | number = "center"): Uint8Array {
  const row = new Uint8Array(width);

  if (seed === "center") {
    const mid = Math.floor(width / 2);
    row[mid] = 1;
    return row;
  }

  // Fill right-aligned binary representation of `seed` into the row.
  for (let i = 0; i < width; i++) {
    const bitPos = width - 1 - i;
    row[i] = (seed >> bitPos) & 1;
  }

  return row;
}
