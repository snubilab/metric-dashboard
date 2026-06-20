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

/**
 * Order two drag corners into a normalized axis-aligned box with always-positive
 * width/height: `x = min(ax, bx)`, `y = min(ay, by)`, `w = |ax - bx|`,
 * `h = |ay - by|`. Handles all four diagonal drag directions identically and
 * never mutates its inputs.
 */
export function normalizeBox(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    w: Math.abs(ax - bx),
    h: Math.abs(ay - by),
  };
}

/**
 * Build a box from a drag's two corners. The normalized drag bbox *is* the box,
 * so the result is direction-agnostic. No min-size enforcement here — that guard
 * lives in the component release path (see `isBelowMinSize`) so the same
 * threshold also governs the circle. Pure; never mutates.
 */
export function rectFromDrag(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Extract<Shape, { kind: "box" }> {
  const { x, y, w, h } = normalizeBox(ax, ay, bx, by);
  return { kind: "box", x, y, w, h };
}

/**
 * Inscribe a TRUE circle in a drag's normalized bbox: centered at the bbox
 * center with `r = min(w, h) / 2`. Honest given `Shape['circle']` carries a
 * single radius — a free non-square drag persists as a circle, never an ellipse.
 * `r` may be 0 for a tap; the component-level min-size guard rejects that before
 * commit. Pure; never mutates.
 */
export function circleFromDrag(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Extract<Shape, { kind: "circle" }> {
  const { x, y, w, h } = normalizeBox(ax, ay, bx, by);
  return { kind: "circle", cx: x + w / 2, cy: y + h / 2, r: Math.min(w, h) / 2 };
}

/**
 * Pure predicate: is the drag's normalized bbox below the minimum draw size on
 * either axis? Returns `w < minGrid || h < minGrid`. The boundary is strict —
 * exactly `minGrid` on both axes is NOT below (commits). Callers convert a pixel
 * threshold to grid units and use `true` to discard a stray tap before emitting.
 */
export function isBelowMinSize(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minGrid: number,
): boolean {
  const { w, h } = normalizeBox(ax, ay, bx, by);
  return w < minGrid || h < minGrid;
}

/** Options controlling how a freehand drag path becomes a polygon. */
export interface PathToPolygonOptions {
  /** Minimum distinct points required to form a polygon (default 3). */
  minPoints?: number;
  /**
   * Maximum Chebyshev distance below which a point is treated as a
   * near-duplicate of its predecessor and dropped (default 0, i.e. only exact
   * consecutive duplicates collapse).
   */
  simplifyEps?: number;
}

const DEFAULT_MIN_POINTS = 3;

/** Smallest radius a circle may shrink to, so it never collapses to a point. */
const MIN_CIRCLE_RADIUS = 1;

/** Resize a circle to `newR`, clamping to a minimum radius. Never mutates. */
export function resizeCircle(
  circle: Extract<Shape, { kind: "circle" }>,
  newR: number,
): Extract<Shape, { kind: "circle" }> {
  return { ...circle, r: Math.max(MIN_CIRCLE_RADIUS, newR) };
}

/** The four resizable corners of a box. */
export type BoxCorner = "tl" | "tr" | "bl" | "br";

/**
 * Move one corner of a box to (gx, gy) and return a normalized box (always
 * positive width/height). The opposite corner stays anchored; if the dragged
 * corner crosses it, the box flips and is re-normalized rather than inverting.
 * Never mutates the input.
 */
export function resizeBoxCorner(
  box: Extract<Shape, { kind: "box" }>,
  corner: BoxCorner,
  gx: number,
  gy: number,
): Extract<Shape, { kind: "box" }> {
  const left = box.x;
  const top = box.y;
  const right = box.x + box.w;
  const bottom = box.y + box.h;

  // Anchor is the corner diagonally opposite the one being dragged.
  const anchorX = corner === "tl" || corner === "bl" ? right : left;
  const anchorY = corner === "tl" || corner === "tr" ? bottom : top;

  const x = Math.min(anchorX, gx);
  const y = Math.min(anchorY, gy);
  const w = Math.abs(anchorX - gx);
  const h = Math.abs(anchorY - gy);
  return { kind: "box", x, y, w, h };
}

/** The centroid (mean of vertices) of a polygon's points. */
function polygonCentroid(points: Vec2[]): Vec2 {
  let sx = 0;
  let sy = 0;
  for (const [px, py] of points) {
    sx += px;
    sy += py;
  }
  return [sx / points.length, sy / points.length];
}

/**
 * Scale a polygon about its centroid by `factor`. Never mutates the input.
 */
export function scalePolygon(
  polygon: Extract<Shape, { kind: "polygon" }>,
  factor: number,
): Extract<Shape, { kind: "polygon" }> {
  const [cx, cy] = polygonCentroid(polygon.points);
  return {
    ...polygon,
    points: polygon.points.map(([px, py]): Vec2 => [
      cx + (px - cx) * factor,
      cy + (py - cy) * factor,
    ]),
  };
}

/** Axis-aligned bounds of a list of points. */
function pointsBounds(points: Vec2[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [px, py] of points) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * The resize-handle anchor points for a shape, in grid coordinates.
 *
 * - circle: one handle on its right edge (`[cx + r, cy]`).
 * - box: four corner handles, ordered tl, tr, bl, br (matching `BoxCorner`).
 * - polygon: four corners of its axis-aligned bounding box (tl, tr, bl, br).
 */
export function handlePositions(shape: Shape): Vec2[] {
  switch (shape.kind) {
    case "circle":
      return [[shape.cx + shape.r, shape.cy]];
    case "box":
      return [
        [shape.x, shape.y],
        [shape.x + shape.w, shape.y],
        [shape.x, shape.y + shape.h],
        [shape.x + shape.w, shape.y + shape.h],
      ];
    case "polygon": {
      const { minX, minY, maxX, maxY } = pointsBounds(shape.points);
      return [
        [minX, minY],
        [maxX, minY],
        [minX, maxY],
        [maxX, maxY],
      ];
    }
  }
}

/**
 * Hit-test a shape's resize handles. Returns the index into `handlePositions`
 * of the first handle within `radiusGrid` grid units of (gx, gy), or null when
 * none is close enough. `radiusGrid` is the pick tolerance expressed in grid
 * coordinates (callers convert a pixel radius via the canvas scale).
 */
export function hitTestHandle(
  shape: Shape,
  gx: number,
  gy: number,
  radiusGrid: number,
): number | null {
  const handles = handlePositions(shape);
  const r2 = radiusGrid * radiusGrid;
  for (let i = 0; i < handles.length; i++) {
    const [hx, hy] = handles[i];
    const dx = hx - gx;
    const dy = hy - gy;
    if (dx * dx + dy * dy <= r2) return i;
  }
  return null;
}

/**
 * Build a polygon shape from a freehand drag path of grid points.
 *
 * Consecutive points closer than `simplifyEps` (Chebyshev distance) collapse
 * into one, removing the jitter a pointer drag leaves behind. If fewer than
 * `minPoints` distinct points survive, the path is rejected (`null`) so a stray
 * tap never produces a degenerate shape. Never mutates the input path.
 */
export function pathToPolygon(
  points: Vec2[],
  opts: PathToPolygonOptions = {},
): Shape | null {
  const minPoints = opts.minPoints ?? DEFAULT_MIN_POINTS;
  const eps = opts.simplifyEps ?? 0;

  const simplified: Vec2[] = [];
  for (const [px, py] of points) {
    const prev = simplified[simplified.length - 1];
    if (prev && Math.abs(px - prev[0]) <= eps && Math.abs(py - prev[1]) <= eps) {
      continue;
    }
    simplified.push([px, py]);
  }

  if (simplified.length < minPoints) return null;
  return { kind: "polygon", points: simplified };
}
