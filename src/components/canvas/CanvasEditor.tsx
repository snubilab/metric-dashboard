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
import {
  addBox,
  addCircle,
  handlePositions,
  hitTestHandle,
  hitTestShape,
  moveShape,
  pathToPolygon,
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
    addCircle: "원 추가",
    addBox: "박스 추가",
    draw: "그리기",
    move: "선택 / 이동",
    delete: "삭제",
    canvasTools: "캔버스 도구",
    activeLayer: "활성 레이어",
    segmentationEditor: "분할 편집기",
    predictionA: "예측 A",
    predictionB: "예측 B",
    show: "표시",
    hide: "숨김",
    emptyHint: '도형이 없습니다 — "원 추가"로 시작하세요',
  },
  en: {
    addCircle: "Add circle",
    addBox: "Add box",
    draw: "Draw",
    move: "Select / Move",
    delete: "Delete",
    canvasTools: "Canvas tools",
    activeLayer: "Active layer",
    segmentationEditor: "Segmentation editor",
    predictionA: "Prediction A",
    predictionB: "Prediction B",
    show: "Show",
    hide: "Hide",
    emptyHint: 'No shapes — start with "Add circle".',
  },
} as const;

/**
 * Affordance glyphs prefixed to each tool label (unicode, not emoji). The
 * bilingual text label follows the glyph.
 */
const TOOL_GLYPH = {
  circle: "◯", // ◯
  box: "▢", // ▢
  draw: "✎", // ✎
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
}

/** Each layer's fill/stroke color comes from a token custom property. */
const LAYER_COLOR_VAR: Record<Layer, string> = {
  GT: "--c-gt",
  A: "--c-pred-a",
  B: "--c-pred-b",
};

const ALL_LAYERS: Layer[] = ["GT", "A", "B"];
const FILL_ALPHA = 0.4;
/** Canvas backing-store size in device pixels (independent of CSS layout). */
const CANVAS_PX = 480;
/** Half-size of a square resize handle, in canvas pixels. */
const HANDLE_HALF_PX = 5;
/** Pointer pick tolerance for grabbing a resize handle, in canvas pixels. */
const HANDLE_PICK_PX = 10;
/** Box handle index -> corner id, matching `handlePositions` ordering. */
const BOX_CORNERS: BoxCorner[] = ["tl", "tr", "bl", "br"];

type Tool = "circle" | "box" | "move" | "delete" | "draw";

/** Drop drag-path points whose grid cell duplicates their predecessor. */
const DRAW_SIMPLIFY_EPS = 0;

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

/** Fill + stroke a single shape in the supplied solid color. */
function paintShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  color: string,
  scaleX: number,
  scaleY: number,
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
  ctx.lineWidth = 2;
  ctx.stroke();
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
  /** Live freehand path in grid coordinates while the Draw tool is dragging. */
  const drawPathRef = useRef<Vec2[] | null>(null);
  const [drawPath, setDrawPath] = useState<Vec2[] | null>(null);

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
        paintShape(ctx, shape, color, scaleX, scaleY);
      }
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
  }, [
    grid,
    gt,
    predictions,
    visibleLayers,
    drawPath,
    activeLayer,
    tool,
    selectedIndex,
    activeShapes,
  ]);

  // A selection belongs to one (layer, tool) context; drop it when either
  // changes so a stale index can never address a different layer's shapes.
  useEffect(() => {
    setSelectedIndex(null);
  }, [activeLayer, tool]);

  const emitActive = (next: Shape[]) => onChange(activeLayer, next);

  const handleAddCircle = () => {
    const cx = grid.width / 2;
    const cy = grid.height / 2;
    const r = Math.max(2, Math.min(grid.width, grid.height) / 6);
    emitActive([...activeShapes, addCircle(cx, cy, r)]);
  };

  const handleAddBox = () => {
    const w = Math.max(2, grid.width / 4);
    const h = Math.max(2, grid.height / 4);
    const x = (grid.width - w) / 2;
    const y = (grid.height - h) / 2;
    emitActive([...activeShapes, addBox(x, y, w, h)]);
  };

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

    if (tool === "draw") {
      const start: Vec2[] = [[x, y]];
      drawPathRef.current = start;
      setDrawPath(start);
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

    if (tool === "draw") {
      const path = drawPathRef.current;
      if (!path) return;
      const last = path[path.length - 1];
      if (last && last[0] === x && last[1] === y) return;
      const next: Vec2[] = [...path, [x, y]];
      drawPathRef.current = next;
      setDrawPath(next);
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
    if (tool === "draw" && drawPathRef.current) {
      const polygon = pathToPolygon(drawPathRef.current, {
        simplifyEps: DRAW_SIMPLIFY_EPS,
      });
      drawPathRef.current = null;
      setDrawPath(null);
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
      if (polygon) emitActive([...activeShapes, polygon]);
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
          label={t.addCircle}
          onClick={handleAddCircle}
        />
        <ToolButton
          glyph={TOOL_GLYPH.box}
          label={t.addBox}
          onClick={handleAddBox}
        />
        <ToolButton
          glyph={TOOL_GLYPH.draw}
          label={t.draw}
          pressed={tool === "draw"}
          onClick={() => setTool("draw")}
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
            return (
              <div
                key={layer}
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <button
                  type="button"
                  aria-pressed={activeLayer === layer}
                  title={layerLabel[layer]}
                  onClick={() =>
                    onChange(layer, shapesForLayer(layer, gt, predictions))
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    padding: "var(--space-1) var(--space-2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    color: "var(--c-text)",
                    background:
                      activeLayer === layer
                        ? "var(--c-surface-2)"
                        : "var(--c-surface)",
                    border:
                      activeLayer === layer
                        ? `1px solid var(${LAYER_COLOR_VAR[layer]})`
                        : "1px solid var(--c-border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
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
                {onToggleLayerVisibility && (
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
        {isEmpty && (
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
            {t.emptyHint}
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
   * Active state for MODE tools (draw / select-move / delete). When true the
   * button is styled like the active layer chip (pred-A border + surface-2 bg)
   * and `aria-pressed` is reflected. Omitted for momentary action buttons
   * (add-circle / add-box), which never show a persistent active state.
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
