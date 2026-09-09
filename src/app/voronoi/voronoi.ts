/** Pure Voronoi helpers. No DOM imports — safe in any environment. */

export type Site = {
  x: number;
  y: number;
};

/**
 * Returns the index of the site closest to (x, y) using squared Euclidean
 * distance. Returns -1 when `sites` is empty.
 *
 * @param x - Query point x coordinate.
 * @param y - Query point y coordinate.
 * @param sites - Array of sites to search.
 * @returns Index of the nearest site, or -1 if sites is empty.
 *
 * @example
 * const idx = nearestSiteIndex(10, 20, [{ x: 0, y: 0 }, { x: 10, y: 20 }]);
 * // idx === 1
 */
export function nearestSiteIndex(x: number, y: number, sites: readonly Site[]): number {
  if (sites.length === 0) return -1;

  let best = 0;
  let bestDist2 = Infinity;

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    if (!site) continue;
    const dx = site.x - x;
    const dy = site.y - y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < bestDist2) {
      bestDist2 = dist2;
      best = i;
    }
  }

  return best;
}
