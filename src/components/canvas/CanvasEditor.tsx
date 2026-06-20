/**
 * Interactive segmentation canvas.
 *
 * Renders the ground-truth and prediction layers onto a single 2d canvas, each
 * drawn in its colorblind-safe Okabe-Ito data color (token-driven, never
 * hardcoded) with a translucent fill plus a solid stroke. A thin toolbar adds
 * circles/boxes, switches the active layer, and toggles move/delete tools.
 *
 * All geometry lives in `canvasMath` so this component stays a thin shell over
 * pointer events and `CanvasRenderingContext2D` drawing.
 */

import { useEffect, useRef, useState } from "react";
import { useLang } from "../../i18n/LanguageContext";
import type { Grid, Shape, Vec2 } from "../../types/engine";
import { readableTextOn } from "./colorContrast";
import {
  circleFromDrag,
  handlePositions,
  hitTestHandle,
  hitTestShape,
  isBelowMinSize,
  moveShape,
  pathToPolygon,
  rectFromDrag,
  resizeBoxCorner,
  resizeCircle,
  scalePolygon,
  screenToGrid,
  type BoxCorner,
} from "./canvasMath";

/** The three editable overlay layers; A/B mirror the prediction ids. */
export type Layer = "GT" | "A" | "B";

const L = {
  ko: {
    circle: "원",
    rect: "사각형",
    pencil: "연필",
    move: "선택 / 이동",
    delete: "삭제",
    canvasTools: "캔버스 도구",
    activeLayer: "활성 레이어",
    segmentationEditor: "분할 편집기",
    predictionA: "예측 A",
    predictionB: "예측 B",
    show: "표시",
    hide: "숨김",
    emptyHint: '도형이 없습니다 — 도구를 고른 뒤 캔버스를 눌러 드래그하세요',
  },
  en: {
    circle: "Circle",
    rect: "Rectangle",
    pencil: "Pencil",
    move: "Select / Move",
    delete: "Delete",
    canvasTools: "Canvas tools",
    activeLayer: "Active layer",
    segmentationEditor: "Segmentation editor",
    predictionA: "Prediction A",
    predictionB: "Prediction B",
    show: "Show",
    hide: "Hide",
    emptyHint: "No shapes — pick a tool, then press and drag on the canvas.",
  },
} as const;

/**
 * Affordance glyphs prefixed to each tool label (unicode, not emoji). The
 * bilingual text label follows the glyph.
 */
const TOOL_GLYPH = {
  circle: "◯", // ◯
  rect: "▢", // ▢
  pencil: "✎", // ✎
  move: "↔", // ↔
  delete: "✕", // ✕
} as const;

interface PredictionInput {
  id: "A" | "B";
  shapes: Shape[];
}

export interface CanvasEditorProps {
  grid: Grid;
  gt: Shape[];
  predictions: PredictionInput[];
  activeLayer: Layer;
  onChange: (layer: Layer, shapes: Shape[]) => void;
  /**
   * Layers to draw; defaults to all three. Ignored when `visibleLayers` is
   * provided (which takes precedence).
   */
  showLayers?: Layer[];
  /**
   * Layers currently drawn. Takes precedence over `showLayers` when provided;
   * defaults to all three when neither is set.
   */
  visibleLayers?: Layer[];
  /**
   * When provided, an eye/visibility toggle is rendered beside each layer
   * button and clicking it calls this with the layer. When omitted, no eye
   * toggles render (backward compatible).
   */
  onToggleLayerVisibility?: (layer: Layer) => void;
  /**
   * Layers that are locked for the guided flow: their layer buttons render
   * dimmed and `disabled` (+ aria-disabled) but are NEVER hidden, so the
   * three-layer mental model still forms. Omitted → all layers enabled.
   */
  lockedLayers?: Layer[];
  /**
   * Step-specific, layer-colored prompt shown over an empty canvas. Replaces
   * the static empty hint when set; falls back to the legacy hint when absent.
   */
  prompt?: { text: string; layer: Layer };
  /**
   * Pure "switch active layer" callback. When provided, clicking a layer chip
   * calls this instead of `onChange`, so a parent can derive `activeLayer`
   * without an edit being recorded. When absent, the legacy onChange path runs.
   */
  onSelectLayer?: (layer: Layer) => void;
}

/** Each layer's fill/stroke color comes from a token custom property. */
const LAYER_COLOR_VAR: Record<Layer, string> = {
  GT: "--c-gt",
  A: "--c-pred-a",
  B: "--c-pred-b",
};

const ALL_LAYERS: Layer[] = ["GT", "A", "B"];
/** Translucent fill — kept light so overlapping layers don't blend into mud. */
const FILL_ALPHA = 0.18;
/** Distinct stroke dash per layer so coincident outlines stay distinguishable
 * (GT solid, A dashed, B dotted) — when B's outline sits on GT's, the solid
 * green still shows between B's dots. */
const LAYER_DASH: Record<Layer, number[]> = {
  GT: [],
  A: [9, 6],
  B: [2, 5],
};
/** Short on-canvas tag drawn near each shape so every blob is identifiable. */
const LAYER_TAG: Record<Layer, string> = { GT: "GT", A: "A", B: "B" };
/** Height of a tag chip in canvas px. */
const TAG_CHIP_H = 16;
/** Vertical gap kept between de-collided tag chips, in canvas px. */
const TAG_CHIP_GAP = 3;
/** Corner radius of a tag chip in canvas px. */
const TAG_CHIP_RADIUS = 4;
/** Canvas backing-store size in device pixels (independent of CSS layout). */
const CANVAS_PX = 480;
/** Half-size of a square resize handle, in canvas pixels. */
const HANDLE_HALF_PX = 5;
/** Pointer pick tolerance for grabbing a resize handle, in canvas pixels. */
const HANDLE_PICK_PX = 10;
/** Box handle index -> corner id, matching `handlePositions` ordering. */
const BOX_CORNERS: BoxCorner[] = ["tl", "tr", "bl", "br"];

type Tool = "circle" | "rect" | "pencil" | "move" | "delete";

/** Drop drag-path points whose grid cell duplicates their predecessor. */
const DRAW_SIMPLIFY_EPS = 0;
/** Minimum drag extent (canvas px) for a circle/rect create; smaller is a tap. */
const MIN_DRAW_PX = 6;
/** Dash pattern for the live drag-to-create ghost (canvas px). */
const PREVIEW_DASH = [6, 4];

function shapesForLayer(
  layer: Layer,
  gt: Shape[],
  predictions: PredictionInput[],
): Shape[] {
  if (layer === "GT") return gt;
  return predictions.find((p) => p.id === layer)?.shapes ?? [];
}

function resolveColor(el: HTMLElement, cssVar: string): string {
  const value = getComputedStyle(el).getPropertyValue(cssVar).trim();
  return value || `var(${cssVar})`;
}

/** Fill + stroke a single shape in the supplied color, with an optional dash. */
function paintShape(
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
function roundRectPath(
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
function paintTagBadge(
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
 * Outline the selected shape's bounding box (for polygons) and draw small
 * square resize handles at its anchor points, stroked in the supplied color.
 */
function paintSelection(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  color: string,
  scaleX: number,
  scaleY: number,
): void {
  // For polygons, hint the resize region with a bounding-box outline.
  if (shape.kind === "polygon") {
    const handles = handlePositions(shape);
    const [tl, , , br] = handles;
    ctx.beginPath();
    ctx.rect(
      tl[0] * scaleX,
      tl[1] * scaleY,
      (br[0] - tl[0]) * scaleX,
      (br[1] - tl[1]) * scaleY,
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const [hx, hy] of handlePositions(shape)) {
    const cx = hx * scaleX;
    const cy = hy * scaleY;
    ctx.beginPath();
    ctx.rect(
      cx - HANDLE_HALF_PX,
      cy - HANDLE_HALF_PX,
      HANDLE_HALF_PX * 2,
      HANDLE_HALF_PX * 2,
    );
    ctx.fillStyle = "var(--c-surface)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** Stroke an in-progress freehand path (no fill) in the supplied color. */
function paintStroke(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  color: string,
  scaleX: number,
  scaleY: number,
): void {
  ctx.beginPath();
  points.forEach(([px, py], i) => {
    const sx = (px + 0.5) * scaleX;
    const sy = (py + 0.5) * scaleY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function CanvasEditor({
  grid,
  gt,
  predictions,
  activeLayer,
  onChange,
  showLayers,
  visibleLayers: visibleLayersProp,
  onToggleLayerVisibility,
  lockedLayers,
  prompt,
  onSelectLayer,
}: CanvasEditorProps) {
  const { lang } = useLang();
  const t = L[lang];
  const layerLabel: Record<Layer, string> = {
    GT: "GT",
    A: t.predictionA,
    B: t.predictionB,
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("circle");
  /** Index of the selected shape in the active layer, or null when none. */
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dragRef = useRef<{ index: number; lastX: number; lastY: number } | null>(
    null,
  );
  /** Active handle drag: which shape + which handle is being dragged. */
  const resizeRef = useRef<{ index: number; handle: number } | null>(null);
  /** Live freehand path in grid coordinates while the Pencil tool is dragging. */
  const drawPathRef = useRef<Vec2[] | null>(null);
  const [drawPath, setDrawPath] = useState<Vec2[] | null>(null);
  /** Drag-to-create start corner (grid coords) for the circle/rect tools. */
  const dragStartRef = useRef<Vec2 | null>(null);
  /** Live drag-to-create ghost shape (circle or box), painted in the draw effect. */
  const [preview, setPreview] = useState<Shape | null>(null);

  // The canvas colors come from CSS tokens read at draw time, so a light/dark
  // theme switch (which flips the document's data-theme) must force a redraw —
  // otherwise the canvas keeps the previous theme's colors. Bump a counter on
  // every data-theme change and feed it into the draw effect's deps.
  const [themeVersion, setThemeVersion] = useState(0);
  useEffect(() => {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined") {
      return;
    }
    const observer = new MutationObserver(() => setThemeVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // visibleLayers takes precedence over showLayers; both default to all.
  const visibleLayers = visibleLayersProp ?? showLayers ?? ALL_LAYERS;
  const activeShapes = shapesForLayer(activeLayer, gt, predictions);

  // Show the empty-state hint when nothing is drawn: the active layer has no
  // shapes and no visible layer contributes any either. (Rendered as an HTML
  // overlay so it works under jsdom, where getContext returns null.)
  const hasVisibleShapes = visibleLayers.some(
    (layer) => shapesForLayer(layer, gt, predictions).length > 0,
  );
  const isEmpty = activeShapes.length === 0 && !hasVisibleShapes;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // jsdom returns null here; bail out so tests exercise behavior, not pixels.
    if (!ctx) return;

    const scaleX = canvas.width / grid.width;
    const scaleY = canvas.height / grid.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const layer of visibleLayers) {
      const color = resolveColor(canvas, LAYER_COLOR_VAR[layer]);
      for (const shape of shapesForLayer(layer, gt, predictions)) {
        paintShape(ctx, shape, color, scaleX, scaleY, LAYER_DASH[layer]);
      }
    }

    // Tag each shape (GT/A/B) on top so overlapping blobs are identifiable.
    // Each tag is a solid chip in the layer color with a contrast-picked glyph.
    // A good prediction overlaps GT, so their chips would land on the same spot;
    // we de-collide by placing chips bottom-up and pushing any that would overlap
    // an already-placed chip upward into free space, so every letter stays legible
    // regardless of how the shapes sit. The ring (page bg) lifts a chip off a
    // same-hue fill.
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
    // Place bottom-most first so collisions resolve by moving chips upward.
    tagRequests.sort((a, b) => b.yBottom - a.yBottom);
    const placed: { cx: number; yBottom: number; halfW: number }[] = [];
    for (const req of tagRequests) {
      let yBottom = req.yBottom;
      let moved = true;
      while (moved) {
        moved = false;
        for (const p of placed) {
          const overlapX = Math.abs(req.cx - p.cx) < req.halfW + p.halfW + 2;
          const overlapY =
            yBottom - TAG_CHIP_H < p.yBottom && yBottom > p.yBottom - TAG_CHIP_H;
          if (overlapX && overlapY) {
            yBottom = p.yBottom - TAG_CHIP_H - TAG_CHIP_GAP;
            moved = true;
          }
        }
      }
      yBottom = Math.max(yBottom, TAG_CHIP_H + 1);
      placed.push({ cx: req.cx, yBottom, halfW: req.halfW });
      paintTagBadge(ctx, req.text, req.cx, yBottom, req.color, tagRing, tagFont);
    }

    // Resize handles for the selected shape (only while the Select/Move tool is
    // active and the active layer is visible), stroked in the pred-A accent.
    if (
      tool === "move" &&
      selectedIndex != null &&
      visibleLayers.includes(activeLayer)
    ) {
      const selected = activeShapes[selectedIndex];
      if (selected) {
        paintSelection(
          ctx,
          selected,
          resolveColor(canvas, "--c-pred-a"),
          scaleX,
          scaleY,
        );
      }
    }

    // Live freehand preview, drawn on top in the active layer's color.
    if (drawPath && drawPath.length > 0) {
      paintStroke(
        ctx,
        drawPath,
        resolveColor(canvas, LAYER_COLOR_VAR[activeLayer]),
        scaleX,
        scaleY,
      );
    }

    // Live drag-to-create ghost (circle/rect), dashed, in the active layer's
    // token color. Painted inside this effect so the data-theme MutationObserver
    // redraw recolors the in-progress ghost for free.
    if (preview) {
      paintShape(
        ctx,
        preview,
        resolveColor(canvas, LAYER_COLOR_VAR[activeLayer]),
        scaleX,
        scaleY,
        PREVIEW_DASH,
      );
    }
  }, [
    grid,
    gt,
    predictions,
    visibleLayers,
    drawPath,
    preview,
    activeLayer,
    tool,
    selectedIndex,
    activeShapes,
    themeVersion,
  ]);

  // A selection belongs to one (layer, tool) context; drop it when either
  // changes so a stale index can never address a different layer's shapes.
  useEffect(() => {
    setSelectedIndex(null);
  }, [activeLayer, tool]);

  const emitActive = (next: Shape[]) => onChange(activeLayer, next);

  /** Min create-drag extent in grid units (MIN_DRAW_PX scaled back). */
  const minGrid = (MIN_DRAW_PX / CANVAS_PX) * grid.width;

  const topHitIndex = (gx: number, gy: number): number => {
    for (let i = activeShapes.length - 1; i >= 0; i--) {
      if (hitTestShape(activeShapes[i], gx, gy)) return i;
    }
    return -1;
  };

  /** Pick tolerance in grid units (pixels scaled back through the grid size). */
  const handlePickRadiusGrid = (HANDLE_PICK_PX / CANVAS_PX) * grid.width;

  /**
   * Resize the shape at `index` by dragging its handle to (gx, gy):
   * circle radius from center, box corner, or polygon scaled about its
   * centroid by the ratio of new to old distance from the bounding-box center.
   */
  const resizeShapeByHandle = (
    shape: Shape,
    handle: number,
    gx: number,
    gy: number,
  ): Shape => {
    if (shape.kind === "circle") {
      const newR = Math.hypot(gx - shape.cx, gy - shape.cy);
      return resizeCircle(shape, newR);
    }
    if (shape.kind === "box") {
      return resizeBoxCorner(shape, BOX_CORNERS[handle], gx, gy);
    }
    // polygon: scale about the bounding-box center by drag-distance ratio.
    const corners = handlePositions(shape);
    const minX = corners[0][0];
    const minY = corners[0][1];
    const maxX = corners[3][0];
    const maxY = corners[3][1];
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const [hx, hy] = corners[handle];
    const oldDist = Math.hypot(hx - midX, hy - midY);
    if (oldDist === 0) return shape;
    const newDist = Math.hypot(gx - midX, gy - midY);
    return scalePolygon(shape, newDist / oldDist);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToGrid(e.clientX, e.clientY, rect, grid);

    if (tool === "pencil") {
      const start: Vec2[] = [[x, y]];
      drawPathRef.current = start;
      setDrawPath(start);
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }

    // Drag-to-create: record the start corner in grid coords; commit on release.
    if (tool === "circle" || tool === "rect") {
      dragStartRef.current = [x, y];
      setPreview(null);
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }

    // Select/Move: first try to grab a resize handle on the current selection.
    if (tool === "move" && selectedIndex != null) {
      const selected = activeShapes[selectedIndex];
      if (selected) {
        const handle = hitTestHandle(selected, x, y, handlePickRadiusGrid);
        if (handle != null) {
          resizeRef.current = { index: selectedIndex, handle };
          canvas.setPointerCapture?.(e.pointerId);
          return;
        }
      }
    }

    const hit = topHitIndex(x, y);
    if (hit < 0) {
      // Clicking empty space clears the selection when selecting/moving.
      if (tool === "move") setSelectedIndex(null);
      return;
    }

    if (tool === "delete") {
      emitActive(activeShapes.filter((_, i) => i !== hit));
      return;
    }
    if (tool === "move") {
      setSelectedIndex(hit);
      dragRef.current = { index: hit, lastX: x, lastY: y };
      canvas.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToGrid(e.clientX, e.clientY, rect, grid);

    if (tool === "pencil") {
      const path = drawPathRef.current;
      if (!path) return;
      const last = path[path.length - 1];
      if (last && last[0] === x && last[1] === y) return;
      const next: Vec2[] = [...path, [x, y]];
      drawPathRef.current = next;
      setDrawPath(next);
      return;
    }

    // Drag-to-create: update the live ghost (visual only, never an onChange).
    if (tool === "circle" || tool === "rect") {
      const start = dragStartRef.current;
      if (!start) return;
      const shape =
        tool === "circle"
          ? circleFromDrag(start[0], start[1], x, y)
          : rectFromDrag(start[0], start[1], x, y);
      setPreview(shape);
      return;
    }

    // Resize the selected shape by dragging one of its handles.
    const resize = resizeRef.current;
    if (resize && tool === "move") {
      const nextShapes = activeShapes.map((s, i) =>
        i === resize.index ? resizeShapeByHandle(s, resize.handle, x, y) : s,
      );
      emitActive(nextShapes);
      return;
    }

    const drag = dragRef.current;
    if (!drag || tool !== "move") return;
    const dx = x - drag.lastX;
    const dy = y - drag.lastY;
    if (dx === 0 && dy === 0) return;
    const nextShapes = activeShapes.map((s, i) =>
      i === drag.index ? moveShape(s, dx, dy) : s,
    );
    dragRef.current = { index: drag.index, lastX: x, lastY: y };
    emitActive(nextShapes);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "pencil" && drawPathRef.current) {
      const polygon = pathToPolygon(drawPathRef.current, {
        simplifyEps: DRAW_SIMPLIFY_EPS,
      });
      drawPathRef.current = null;
      setDrawPath(null);
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
      if (polygon) emitActive([...activeShapes, polygon]);
      return;
    }

    // Drag-to-create commit: discard sub-min-size taps, else emit exactly one
    // onChange with the inscribed circle / normalized rect.
    if ((tool === "circle" || tool === "rect") && dragStartRef.current) {
      const start = dragStartRef.current;
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const { x, y } = rect
        ? screenToGrid(e.clientX, e.clientY, rect, grid)
        : { x: start[0], y: start[1] };
      dragStartRef.current = null;
      setPreview(null);
      canvas?.releasePointerCapture?.(e.pointerId);
      if (isBelowMinSize(start[0], start[1], x, y, minGrid)) return;
      const shape =
        tool === "circle"
          ? circleFromDrag(start[0], start[1], x, y)
          : rectFromDrag(start[0], start[1], x, y);
      emitActive([...activeShapes, shape]);
      return;
    }
    if (resizeRef.current) {
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
      resizeRef.current = null;
      return;
    }
    if (dragRef.current) {
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
      dragRef.current = null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        fontFamily: "var(--font-ui)",
        color: "var(--c-text)",
      }}
    >
      <div
        role="toolbar"
        aria-label={t.canvasTools}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <ToolButton
          glyph={TOOL_GLYPH.circle}
          label={t.circle}
          pressed={tool === "circle"}
          onClick={() => setTool("circle")}
        />
        <ToolButton
          glyph={TOOL_GLYPH.rect}
          label={t.rect}
          pressed={tool === "rect"}
          onClick={() => setTool("rect")}
        />
        <ToolButton
          glyph={TOOL_GLYPH.pencil}
          label={t.pencil}
          pressed={tool === "pencil"}
          onClick={() => setTool("pencil")}
        />
        <ToolButton
          glyph={TOOL_GLYPH.move}
          label={t.move}
          pressed={tool === "move"}
          onClick={() => setTool("move")}
        />
        <ToolButton
          glyph={TOOL_GLYPH.delete}
          label={t.delete}
          pressed={tool === "delete"}
          onClick={() => setTool("delete")}
        />

        <span
          aria-hidden="true"
          style={{
            width: "1px",
            alignSelf: "stretch",
            background: "var(--c-border)",
            margin: "0 var(--space-1)",
          }}
        />

        <div
          role="group"
          aria-label={t.activeLayer}
          style={{ display: "flex", gap: "var(--space-1)" }}
        >
          {ALL_LAYERS.map((layer) => {
            const isVisible = visibleLayers.includes(layer);
            const isLocked = lockedLayers?.includes(layer) ?? false;
            return (
              <div
                key={layer}
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <button
                  type="button"
                  aria-pressed={activeLayer === layer}
                  aria-disabled={isLocked || undefined}
                  disabled={isLocked}
                  title={layerLabel[layer]}
                  onClick={() => {
                    if (isLocked) return;
                    if (onSelectLayer) onSelectLayer(layer);
                    else
                      onChange(layer, shapesForLayer(layer, gt, predictions));
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    padding: "var(--space-1) var(--space-2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    color: isLocked ? "var(--c-text-dim)" : "var(--c-text)",
                    background:
                      activeLayer === layer
                        ? "var(--c-surface-2)"
                        : "var(--c-surface)",
                    // Locked layers read as present-but-inactive via a dashed dim
                    // border (not a near-invisible solid one crushed by opacity).
                    border:
                      activeLayer === layer
                        ? `1px solid var(${LAYER_COLOR_VAR[layer]})`
                        : isLocked
                          ? "1px dashed var(--c-text-dim)"
                          : "1px solid var(--c-border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: isLocked ? "not-allowed" : "pointer",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "var(--radius-sm)",
                      background: `var(${LAYER_COLOR_VAR[layer]})`,
                    }}
                  />
                  {layer}
                </button>
                {onToggleLayerVisibility && !isLocked && (
                  <button
                    type="button"
                    aria-pressed={isVisible}
                    title={`${isVisible ? t.hide : t.show} ${layerLabel[layer]}`}
                    aria-label={`${isVisible ? t.hide : t.show} ${layerLabel[layer]}`}
                    onClick={() => onToggleLayerVisibility(layer)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "var(--space-1)",
                      padding: "var(--space-1)",
                      fontSize: "var(--text-xs)",
                      lineHeight: 1,
                      color: isVisible ? "var(--c-text)" : "var(--c-text-dim)",
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                    }}
                  >
                    <span aria-hidden="true">{isVisible ? "\u{1F441}" : "⊘"}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: `${CANVAS_PX}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          aria-label={t.segmentationEditor}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            width: "100%",
            maxWidth: `${CANVAS_PX}px`,
            aspectRatio: `${grid.width} / ${grid.height}`,
            display: "block",
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            touchAction: "none",
            cursor: tool === "delete" ? "not-allowed" : "crosshair",
          }}
        />
        {(prompt || isEmpty) && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-3)",
              textAlign: "center",
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--c-text-dim)",
              pointerEvents: "none",
            }}
          >
            {prompt ? (
              // High-contrast prompt text (a raw layer color fails AA on the light
              // canvas); a colored dot carries the layer association instead.
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  color: "var(--c-text)",
                  fontWeight: 600,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: `var(${LAYER_COLOR_VAR[prompt.layer]})`,
                    flex: "0 0 auto",
                  }}
                />
                {prompt.text}
              </span>
            ) : (
              t.emptyHint
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  /** Affordance glyph rendered before the text label (unicode, not emoji). */
  glyph?: string;
  /**
   * Active state for the pressed tools (circle / rect / pencil / select-move /
   * delete). When true the button is styled like the active layer chip (pred-A
   * border + surface-2 bg) and `aria-pressed` is reflected.
   */
  pressed?: boolean;
}

function ToolButton({ label, onClick, glyph, pressed }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: "var(--space-1) var(--space-3)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-sm)",
        color: "var(--c-text)",
        background: pressed ? "var(--c-surface-2)" : "var(--c-surface)",
        border: pressed
          ? "1px solid var(--c-pred-a)"
          : "1px solid var(--c-border)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
      }}
    >
      {glyph && <span aria-hidden="true">{glyph}</span>}
      {label}
    </button>
  );
}

export default CanvasEditor;
