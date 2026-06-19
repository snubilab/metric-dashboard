import type { Grid, Vec2 } from "../../types/engine";

export function makeGrid(width: number, height: number, spacingMm: Vec2): Grid {
  return { width, height, spacingMm };
}

export function index(g: Grid, x: number, y: number): number {
  return y * g.width + x;
}

export function diagonalMm(g: Grid): number {
  const wMm = g.width * g.spacingMm[0];
  const hMm = g.height * g.spacingMm[1];
  return Math.sqrt(wMm * wMm + hMm * hMm);
}
