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
import type { Grid, Shape } from "../../types/engine";
import {
  addBox,
  addCircle,
  hitTestShape,
  moveShape,
  screenToGrid,
} from "./canvasMath";

/** The three editable overlay layers; A/B mirror the prediction ids. */
export type Layer = "GT" | "A" | "B";

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
  /** Layers to draw; defaults to all three. */
  showLayers?: Layer[];
}

/** Each layer's fill/stroke color comes from a token custom property. */
const LAYER_COLOR_VAR: Record<Layer, string> = {
  GT: "--c-gt",
  A: "--c-pred-a",
  B: "--c-pred-b",
};

const LAYER_LABEL: Record<Layer, string> = {
  GT: "GT",
  A: "Prediction A",
  B: "Prediction B",
};

const ALL_LAYERS: Layer[] = ["GT", "A", "B"];
const FILL_ALPHA = 0.4;
/** Canvas backing-store size in device pixels (independent of CSS layout). */
const CANVAS_PX = 480;

type Tool = "circle" | "box" | "move" | "delete";

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

export function CanvasEditor({
  grid,
  gt,
  predictions,
  activeLayer,
  onChange,
  showLayers,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("circle");
  const dragRef = useRef<{ index: number; lastX: number; lastY: number } | null>(
    null,
  );

  const visibleLayers = showLayers ?? ALL_LAYERS;
  const activeShapes = shapesForLayer(activeLayer, gt, predictions);

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
  }, [grid, gt, predictions, visibleLayers]);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToGrid(e.clientX, e.clientY, rect, grid);
    const hit = topHitIndex(x, y);
    if (hit < 0) return;

    if (tool === "delete") {
      emitActive(activeShapes.filter((_, i) => i !== hit));
      return;
    }
    if (tool === "move") {
      dragRef.current = { index: hit, lastX: x, lastY: y };
      canvas.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || tool !== "move") return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToGrid(e.clientX, e.clientY, rect, grid);
    const dx = x - drag.lastX;
    const dy = y - drag.lastY;
    if (dx === 0 && dy === 0) return;
    const next = activeShapes.map((s, i) =>
      i === drag.index ? moveShape(s, dx, dy) : s,
    );
    dragRef.current = { index: drag.index, lastX: x, lastY: y };
    emitActive(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
        aria-label="Canvas tools"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <ToolButton label="Add circle" onClick={handleAddCircle} />
        <ToolButton label="Add box" onClick={handleAddBox} />
        <ToolButton
          label="Move"
          pressed={tool === "move"}
          onClick={() => setTool("move")}
        />
        <ToolButton
          label="Delete"
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
          aria-label="Active layer"
          style={{ display: "flex", gap: "var(--space-1)" }}
        >
          {ALL_LAYERS.map((layer) => (
            <button
              key={layer}
              type="button"
              aria-pressed={activeLayer === layer}
              title={LAYER_LABEL[layer]}
              onClick={() => onChange(layer, shapesForLayer(layer, gt, predictions))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-1)",
                padding: "var(--space-1) var(--space-2)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--c-text)",
                background:
                  activeLayer === layer ? "var(--c-surface-2)" : "var(--c-surface)",
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
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        aria-label="Segmentation editor"
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
    </div>
  );
}

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  pressed?: boolean;
}

function ToolButton({ label, onClick, pressed }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      style={{
        padding: "var(--space-1) var(--space-3)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-sm)",
        color: "var(--c-text)",
        background: pressed ? "var(--c-surface-2)" : "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default CanvasEditor;
