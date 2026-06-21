/**
 * Shared shape-drawing primitives for the segmentation canvases.
 *
 * Extracted from `CanvasEditor` so that read-only views (Scenarios, mini-sims)
 * render GT/A/B shapes IDENTICALLY to the interactive Playground: the same
 * translucent fills, per-layer dashes, and solid contrast-picked tag chips with
 * the same de-collision pass.
 *
 * All canvas drawing assumes a non-null 2d context (callers must guard for
 * jsdom). The badge layout (`placeTagBadges`) is a PURE function with no canvas
 * dependency, so it stays unit-testable.
 */

import type { Grid, Shape, Vec2 } from "../../types/engine";
import { readableTextOn } from "./colorContrast";

/** The three drawable overlay layers; A/B mirror the prediction ids. */
export type Layer = "GT" | "A" | "B";

/** Each layer's fill/stroke color comes from a token custom property. */
export const LAYER_COLOR_VAR: Record<Layer, string> = {
  GT: "--c-gt",
  A: "--c-pred-a",
  B: "--c-pred-b",
};

/** Translucent fill — kept light so overlapping layers don't blend into mud. */
export const FILL_ALPHA = 0.18;

/**
 * Distinct stroke dash per layer so coincident outlines stay distinguishable
 * (GT solid, A dashed, B dotted) — when B's outline sits on GT's, the solid
 * green still shows between B's dots.
 */
export const LAYER_DASH: Record<Layer, number[]> = {
  GT: [],
  A: [9, 6],
  B: [2, 5],
};

/** Short on-canvas tag drawn near each shape so every blob is identifiable. */
export const LAYER_TAG: Record<Layer, string> = { GT: "GT", A: "A", B: "B" };

/** Height of a tag chip in canvas px. */
export const TAG_CHIP_H = 16;
/** Vertical gap kept between de-collided tag chips, in canvas px. */
export const TAG_CHIP_GAP = 3;
/** Corner radius of a tag chip in canvas px. */
export const TAG_CHIP_RADIUS = 4;

const ALL_LAYERS: Layer[] = ["GT", "A", "B"];

interface PredictionInput {
  id: "A" | "B";
  shapes: Shape[];
}

/** Read a CSS custom property off an element, falling back to `var(...)`. */
export function resolveColor(el: HTMLElement, cssVar: string): string {
  const value = getComputedStyle(el).getPropertyValue(cssVar).trim();
  return value || `var(${cssVar})`;
}

/** Fill + stroke a single shape in the supplied color, with an optional dash. */
export function paintShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  color: string,
  scaleX: number,
  scaleY: number,
  dash: number[] = [],
): void {
  ctx.beginPath();
  if (shape.kind === "circle") {
    ctx.ellipse(
      shape.cx * scaleX,
      shape.cy * scaleY,
      shape.r * scaleX,
      shape.r * scaleY,
      0,
      0,
      Math.PI * 2,
    );
  } else if (shape.kind === "box") {
    ctx.rect(
      shape.x * scaleX,
      shape.y * scaleY,
      shape.w * scaleX,
      shape.h * scaleY,
    );
  } else {
    shape.points.forEach(([px, py], i) => {
      const sx = px * scaleX;
      const sy = py * scaleY;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
  }
  ctx.globalAlpha = FILL_ALPHA;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** A label-anchor point (grid coords) near the top of a shape. */
function shapeTop(shape: Shape): Vec2 {
  if (shape.kind === "circle") return [shape.cx, shape.cy - shape.r];
  if (shape.kind === "box") return [shape.x + shape.w / 2, shape.y];
  let top = shape.points[0] ?? [0, 0];
  for (const p of shape.points) if (p[1] < top[1]) top = p;
  return top;
}

/** Trace a rounded-rect path (manual so it works without ctx.roundRect). */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Draw a GT/A/B tag as a solid chip in the layer color with an auto-contrast
 * (black/white) glyph. Unlike a halo'd glyph, the chip's legibility does not
 * depend on the translucent fills behind it, so the tag reads on any overlap in
 * either theme. A thin `ring` (page background) lifts the chip off a fill of the
 * same hue. `yBottom` anchors the chip's bottom edge.
 */
export function paintTagBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  yBottom: number,
  fillColor: string,
  ring: string,
  font: string,
): void {
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const padX = 5;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const left = x - w / 2;
  const top = yBottom - TAG_CHIP_H;
  roundRectPath(ctx, left, top, w, TAG_CHIP_H, TAG_CHIP_RADIUS);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = ring;
  ctx.stroke();
  ctx.fillStyle = readableTextOn(fillColor);
  ctx.fillText(text, x, top + TAG_CHIP_H / 2 + 0.5);
}

/**
 * De-collide tag-chip positions. A good prediction overlaps GT, so their chips
 * would land on the same spot; place chips bottom-up and push any that would
 * overlap an already-placed chip upward into free space, so every letter stays
 * legible regardless of how the shapes sit. Pure (no canvas): returns positions
 * in the SAME order as `requests`.
 *
 * Positions are clamped so no chip rises above `y = chipH` (its top stays on
 * canvas).
 */
export function placeTagBadges(
  requests: { cx: number; yBottom: number; halfW: number }[],
  chipH: number,
  gap: number,
): { cx: number; yBottom: number; halfW: number }[] {
  // Place bottom-most first so collisions resolve by moving chips upward.
  const order = requests
    .map((req, index) => ({ req, index }))
    .sort((a, b) => b.req.yBottom - a.req.yBottom);

  const placed: { cx: number; yBottom: number; halfW: number }[] = [];
  const result: { cx: number; yBottom: number; halfW: number }[] = new Array(
    requests.length,
  );

  for (const { req, index } of order) {
    let yBottom = req.yBottom;
    let moved = true;
    while (moved) {
      moved = false;
      for (const p of placed) {
        const overlapX = Math.abs(req.cx - p.cx) < req.halfW + p.halfW + 2;
        const overlapY =
          yBottom - chipH < p.yBottom && yBottom > p.yBottom - chipH;
        if (overlapX && overlapY) {
          yBottom = p.yBottom - chipH - gap;
          moved = true;
        }
      }
    }
    yBottom = Math.max(yBottom, chipH + 1);
    const pos = { cx: req.cx, yBottom, halfW: req.halfW };
    placed.push(pos);
    result[index] = pos;
  }

  return result;
}

function shapesForLayer(
  layer: Layer,
  gt: Shape[],
  predictions: PredictionInput[],
): Shape[] {
  if (layer === "GT") return gt;
  return predictions.find((p) => p.id === layer)?.shapes ?? [];
}

export interface DrawSceneOptions {
  grid: Grid;
  gt: Shape[];
  predictions: PredictionInput[];
  visibleLayers?: Layer[];
}

/**
 * Clear and paint the base scene: every visible layer's shapes (with its
 * per-layer dash), then the de-collided GT/A/B tag chips on top. This is the
 * SAME visual the Playground produces for its base layers + badges; interactive
 * extras (selection handles, freehand preview, drag ghost) are layered on top
 * by the caller after this returns.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLElement,
  opts: DrawSceneOptions,
): void {
  const { grid, gt, predictions } = opts;
  const visibleLayers = opts.visibleLayers ?? ALL_LAYERS;
  const width = (canvas as HTMLCanvasElement).width;
  const height = (canvas as HTMLCanvasElement).height;
  const scaleX = width / grid.width;
  const scaleY = height / grid.height;

  ctx.clearRect(0, 0, width, height);
  for (const layer of visibleLayers) {
    const color = resolveColor(canvas, LAYER_COLOR_VAR[layer]);
    for (const shape of shapesForLayer(layer, gt, predictions)) {
      paintShape(ctx, shape, color, scaleX, scaleY, LAYER_DASH[layer]);
    }
  }

  // Tag each shape (GT/A/B) on top so overlapping blobs are identifiable. Each
  // tag is a solid chip in the layer color with a contrast-picked glyph; the
  // ring (page bg) lifts a chip off a same-hue fill.
  const tagFont = `700 13px ${resolveColor(canvas, "--font-ui") || "system-ui, sans-serif"}`;
  const tagRing = resolveColor(canvas, "--c-bg") || "#fff";
  ctx.font = tagFont;
  const tagRequests = visibleLayers.flatMap((layer) => {
    const color = resolveColor(canvas, LAYER_COLOR_VAR[layer]);
    return shapesForLayer(layer, gt, predictions).map((shape) => {
      const [gx, gy] = shapeTop(shape);
      const text = LAYER_TAG[layer];
      const halfW = (Math.ceil(ctx.measureText(text).width) + 10) / 2;
      return { text, color, cx: gx * scaleX, yBottom: gy * scaleY - 2, halfW };
    });
  });

  const positions = placeTagBadges(
    tagRequests.map(({ cx, yBottom, halfW }) => ({ cx, yBottom, halfW })),
    TAG_CHIP_H,
    TAG_CHIP_GAP,
  );
  tagRequests.forEach((req, i) => {
    const pos = positions[i];
    paintTagBadge(ctx, req.text, pos.cx, pos.yBottom, req.color, tagRing, tagFont);
  });
}
