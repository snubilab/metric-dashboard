import type { Grid, Mask, Shape, Vec2 } from "../../types/engine";
import { index } from "./grid";

function inShape(s: Shape, x: number, y: number): boolean {
  const px = x + 0.5,
    py = y + 0.5;
  switch (s.kind) {
    case "circle":
      return (px - s.cx) ** 2 + (py - s.cy) ** 2 <= s.r * s.r;
    case "box":
      return px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h;
    case "polygon":
      return pointInPolygon([px, py], s.points);
  }
}

function pointInPolygon([px, py]: Vec2, pts: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i],
      [xj, yj] = pts[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function rasterize(g: Grid, shapes: Shape[]): Mask {
  const m = new Uint8Array(g.width * g.height);
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (shapes.some((s) => inShape(s, x, y))) m[index(g, x, y)] = 1;
    }
  }
  return m;
}
