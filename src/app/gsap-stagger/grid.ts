export type GridCell = {
  index: number;
  row: number;
  col: number;
};

export function gridCells(cols: number, rows: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ index: r * cols + c, row: r, col: c });
    }
  }
  return cells;
}

export function centerDistance(row: number, col: number, cols: number, rows: number): number {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = col - cx;
  const dy = row - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function cellsByDistance(cols: number, rows: number): GridCell[] {
  return gridCells(cols, rows).sort((a, b) => {
    const da = centerDistance(a.row, a.col, cols, rows);
    const db = centerDistance(b.row, b.col, cols, rows);
    return da - db;
  });
}
