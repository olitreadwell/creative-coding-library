# Maze

## What it is

An animated perfect maze generator built on HTML Canvas 2D. A depth-first backtracker algorithm carves passages through a grid, cell by cell, in real time. The highlighted frontier cell shows where the algorithm currently is. When carving finishes, the complete maze is displayed. Click "New maze" to generate a fresh one with a different random seed.

## Why this concept matters

A perfect maze is a spanning tree of a grid graph: every cell is reachable from every other cell through exactly one path, with no loops. Building one is equivalent to finding a random spanning tree of the graph, which makes maze generation a concrete entry point into graph theory, depth-first search, and backtracking. These three ideas appear throughout computer science — in compilers, AI planning, puzzle solvers, and network routing.

The recursive backtracker is one of the clearest maze algorithms to read and verify: it either goes deeper (carving a new passage) or backtracks (popping the stack), and it terminates exactly when the stack is empty, which is exactly when every cell has been visited.

## Annotated key code

**Wall bitmask (`maze.ts`)**

```ts
export const WALL_N = 0b0001;
export const WALL_E = 0b0010;
export const WALL_S = 0b0100;
export const WALL_W = 0b1000;
```

Four bits per cell. Clearing a bit removes that wall. Checking a bit tells you whether the wall is still up.

**Iterative backtracker loop (`maze.ts`)**

```ts
while (stack.length > 0) {
  const current = stack[stack.length - 1];
  const dirs = shuffled(DIRECTIONS, rng);
  let carved = false;

  for (const dir of dirs) {
    if (visited[neighbour]) continue;
    cells[current].walls &= ~dir.wall;
    cells[neighbour].walls &= ~dir.opposite;
    visited[neighbour] = 1;
    stack.push(neighbour);
    carved = true;
    break;
  }

  if (!carved) stack.pop(); // dead end: backtrack
}
```

No recursion, no call-stack limit. The stack mirrors what a recursive call stack would hold.

**Spanning-tree property**

After the loop, the number of open passages equals `cols * rows - 1`. A tree connecting `N` nodes needs exactly `N - 1` edges. The maze is correct when this count matches.

**Animation replay (`play/page.tsx`)**

`carveSteps` records every carve event while building the maze. The play page replays those events frame by frame rather than re-running the algorithm, so the animation is deterministic and costs nothing extra at runtime.

## Attribution

Algorithm: recursive backtracker / randomized depth-first search.
Reference: [Wikipedia: Maze generation algorithm](https://en.wikipedia.org/wiki/Maze_generation_algorithm).
This implementation is original code, MIT licensed.
