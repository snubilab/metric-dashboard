/**
 * Pure geometry helpers for the canvas editor.
 *
 * Everything here is side-effect free and grid-aware so the React component can
 * stay thin: it only wires pointer events and 2d-context drawing, delegating all
 * coordinate and hit-test math to these functions. Hit-testing mirrors the
 * pixel-center sampling convention used by the rasterizer (`inShape`), so a cell
 * that hit-tests as inside is the same cell the engine would mark in a mask.
 */

import type { Grid, Shape, Vec2 } from "../../types/engine";

/** A minimal subset of `DOMRect` — the canvas bounding box in screen space. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Integer grid coordinates of a cell. */
export interface GridPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a screen-space point (e.g. a pointer position) to integer grid-cell
 * coordinates, scaling each axis independently and clamping into bounds.
 */
export function screenToGrid(
  px: number,
  py: number,
  rect: ScreenRect,
  grid: Grid,
): GridPoint {
  const fx = (px - rect.left) / rect.width;
  const fy = (py - rect.top) / rect.height;
  const x = clamp(Math.floor(fx * grid.width), 0, grid.width - 1);
  const y = clamp(Math.floor(fy * grid.height), 0, grid.height - 1);
  return { x, y };
}

function pointInPolygon([px, py]: Vec2, pts: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i],
      [xj, yj] = pts[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Test whether grid cell (x, y) lies inside `shape`, sampling at the cell
 * center to match the rasterizer.
 */
export function hitTestShape(shape: Shape, x: number, y: number): boolean {
  const px = x + 0.5,
    py = y + 0.5;
  switch (shape.kind) {
    case "circle":
      return (px - shape.cx) ** 2 + (py - shape.cy) ** 2 <= shape.r * shape.r;
    case "box":
      return (
        px >= shape.x &&
        px < shape.x + shape.w &&
        py >= shape.y &&
        py < shape.y + shape.h
      );
    case "polygon":
      return pointInPolygon([px, py], shape.points);
  }
}

/** Return a new shape translated by (dx, dy); never mutates the input. */
export function moveShape(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.kind) {
    case "circle":
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case "box":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case "polygon":
      return {
        ...shape,
        points: shape.points.map(([px, py]): Vec2 => [px + dx, py + dy]),
      };
  }
}

/** Build a circle shape centered at (cx, cy) with radius r. */
export function addCircle(cx: number, cy: number, r: number): Shape {
  return { kind: "circle", cx, cy, r };
}

/** Build a box shape with top-left (x, y) and size (w, h). */
export function addBox(x: number, y: number, w: number, h: number): Shape {
  return { kind: "box", x, y, w, h };
}
