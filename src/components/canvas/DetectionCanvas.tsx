/**
 * Interactive detection canvas.
 *
 * A draw-from-scratch box editor for the Detection playground. Detection is
 * GROUND-TRUTH vs PREDICTIONS-WITH-A-CONFIDENCE-THRESHOLD (never A-vs-B), so the
 * canvas has two layers — GT and PRED — and exactly one primitive, the box.
 *
 *   - GT stage    : drag-to-create a box -> onChangeGt with detBoxFromDrag (NO confidence).
 *   - PRED stage  : drag-to-create a box -> onChangePreds with detBoxFromDrag at 0.50.
 *   - select/move : box-only hit test + moveShape / resizeBoxCorner (via {kind:'box'} wrap).
 *   - delete      : filters the hit index.
 *   - confidence  : a per-selected-PRED slider (0..1 step .01) calls withConfidence;
 *                   a selected GT box shows a disabled, no-confidence state.
 *
 * The whole scene is re-colored at the live confidence threshold by a single
 * `classifyDetections` call so the picture, the counts, and the PR dot can never
 * disagree. All drawing bails when getContext returns null (jsdom). A data-theme
 * MutationObserver forces a redraw so role colors track light/dark.
 *
 * This is a NEW component (not a CanvasEditor extension) because the layer model
 * and the DetBox primitive differ; it reuses the pure mechanics from canvasMath,
 * the detectionDraw painter, and the same drag-to-create endDrag-commit pattern.
 */

import { useEffect, useRef, useState } from "react";
import { useLang } from "../../i18n/LanguageContext";
import type { DetBox, Grid } from "../../types/engine";
import type { DetLayer } from "../../topics/detection/detFlowStage";
import { CONFIDENCE_LABEL } from "../../topics/detection/detGuidedCopy";
import { drawDetectionScene } from "./detectionDraw";
import { resolveColor } from "./sceneDraw";
import {
  classifyDetections,
  detBoxFromDrag,
  withConfidence,
} from "../../engine/metrics/detClassify";
import {
  isBelowMinSize,
  normalizeBox,
  resizeBoxCorner,
  screenToGrid,
  type BoxCorner,
} from "./canvasMath";

const L = {
  ko: {
    boxTool: "박스",
    move: "선택 / 이동",
    delete: "삭제",
    canvasTools: "캔버스 도구",
    activeLayer: "활성 레이어",
    detectionEditor: "검출 편집기",
    gtLayer: "정답 (GT)",
    predLayer: "예측 (PRED)",
    noConfidence: "정답 박스에는 신뢰도가 없습니다",
    emptyHint: "박스 도구를 고른 뒤 캔버스를 눌러 드래그하세요",
  },
  en: {
    boxTool: "Box",
    move: "Select / Move",
    delete: "Delete",
    canvasTools: "Canvas tools",
    activeLayer: "Active layer",
    detectionEditor: "Detection editor",
    gtLayer: "Ground truth (GT)",
    predLayer: "Predictions (PRED)",
    noConfidence: "Ground-truth boxes carry no confidence",
    emptyHint: "Pick the box tool, then press and drag on the canvas.",
  },
} as const;

const TOOL_GLYPH = { rect: "▢", move: "↔", delete: "✕" } as const;

const ALL_LAYERS: DetLayer[] = ["GT", "PRED"];
/** Each layer's accent token. */
const LAYER_COLOR_VAR: Record<DetLayer, string> = {
  GT: "--c-gt",
  PRED: "--c-pred-a",
};
/** Confidence a freshly drawn prediction is born with (a visible mid value). */
const DEFAULT_CONFIDENCE = 0.5;
/** Canvas backing-store size in device pixels. */
const CANVAS_PX = 480;
/** Minimum drag extent (canvas px) before a create commits; smaller is a tap. */
const MIN_DRAW_PX = 6;
/** Dash for the live drag-to-create ghost (canvas px). */
const PREVIEW_DASH = [6, 4];
/** Pointer pick tolerance for grabbing a resize handle, in canvas px. */
const HANDLE_PICK_PX = 10;
/** Half-size of a square resize handle, in canvas px. */
const HANDLE_HALF_PX = 5;
/** Box handle index -> corner id (tl, tr, bl, br). */
const BOX_CORNERS: BoxCorner[] = ["tl", "tr", "bl", "br"];

type Tool = "rect" | "move" | "delete";
type Selection = { index: number; layer: DetLayer; tool: Tool };

export interface DetectionCanvasProps {
  grid: Grid;
  gt: DetBox[];
  preds: DetBox[];
  activeLayer: DetLayer;
  iouThreshold: number;
  confidenceThreshold: number;
  onChangeGt: (next: DetBox[]) => void;
  onChangePreds: (next: DetBox[]) => void;
  /**
   * Called once at the START of an edit gesture (create / move / resize / delete
   * / confidence-drag) so the parent can snapshot undo history per-gesture rather
   * than on every emitted change — one drag or slider sweep becomes one Undo.
   */
  onEditStart?: () => void;
  lockedLayers?: DetLayer[];
  prompt?: { text: string; layer: DetLayer };
  onSelectLayer?: (layer: DetLayer) => void;
}

/** Point-in-box test at the cell center, matching the rasterizer convention. */
function hitTestBox(box: DetBox, x: number, y: number): boolean {
  const px = x + 0.5;
  const py = y + 0.5;
  return px >= box.x && px < box.x + box.w && py >= box.y && py < box.y + box.h;
}

/** The four corner handle positions of a box, ordered tl, tr, bl, br. */
function boxHandles(box: DetBox): [number, number][] {
  return [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x, box.y + box.h],
    [box.x + box.w, box.y + box.h],
  ];
}

export function DetectionCanvas({
  grid,
  gt,
  preds,
  activeLayer,
  iouThreshold,
  confidenceThreshold,
  onChangeGt,
  onChangePreds,
  onEditStart,
  lockedLayers,
  prompt,
  onSelectLayer,
}: DetectionCanvasProps) {
  const { lang } = useLang();
  const t = L[lang];
  const layerLabel: Record<DetLayer, string> = {
    GT: t.gtLayer,
    PRED: t.predLayer,
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("rect");
  const [selection, setSelection] = useState<Selection | null>(null);
  const dragStartRef = useRef<[number, number] | null>(null);
  const [preview, setPreview] = useState<DetBox | null>(null);
  const dragRef = useRef<{ index: number; lastX: number; lastY: number } | null>(null);
  const resizeRef = useRef<{ index: number; handle: number } | null>(null);

  // A light/dark theme switch flips document data-theme; the canvas reads tokens
  // at draw time, so we must force a redraw on that change.
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

  const activeBoxes = activeLayer === "GT" ? gt : preds;
  const selectedIndex =
    selection?.layer === activeLayer && selection.tool === tool ? selection.index : null;
  const setSelectedIndex = (index: number | null) => {
    setSelection(index == null ? null : { index, layer: activeLayer, tool });
  };

  /** A history snapshot is owed before the next ACTUAL mutation of the current
   * gesture. Armed at gesture start (pointerdown / slider grab) and consumed on
   * the first real emit — so a selection-only click (e.g. tapping a box to reveal
   * its confidence slider) or a sub-min-size create never records a no-op undo. */
  const snapshotPendingRef = useRef(false);
  const consumeSnapshot = () => {
    if (snapshotPendingRef.current) {
      onEditStart?.();
      snapshotPendingRef.current = false;
    }
  };
  const emitActive = (next: DetBox[]) => {
    consumeSnapshot();
    if (activeLayer === "GT") onChangeGt(next);
    else onChangePreds(next);
  };

  const isEmpty = gt.length === 0 && preds.length === 0;
  const minGrid = (MIN_DRAW_PX / CANVAS_PX) * grid.width;
  const handlePickRadiusGrid = (HANDLE_PICK_PX / CANVAS_PX) * grid.width;

  // Match roles (TP/FP/FN/ghost) are a COMPARE-stage concept: they only make
  // sense once both a ground truth and a prediction exist. While drawing (either
  // side still empty), pass null so the painter shows plain layer identity — a
  // GT box must never read as "FN" before there is any prediction to miss it.
  // In compare, the keystone: ONE classification at the live threshold feeds
  // the painter, the counts, and the PR dot.
  const classification =
    gt.length > 0 && preds.length > 0
      ? classifyDetections(preds, gt, { iouThreshold, confidenceThreshold })
      : null;

  // Draw effect: paint the role-colored scene, then selection handles + the live
  // drag ghost on top. Recomputed on any data/threshold/theme change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom: bail so tests exercise behavior, not pixels.

    const scaleX = canvas.width / grid.width;
    const scaleY = canvas.height / grid.height;

    drawDetectionScene(ctx, canvas, { grid, gt, preds, classification });

    if (tool === "move" && selectedIndex != null) {
      const selected = activeBoxes[selectedIndex];
      if (selected) {
        const color = resolveColor(canvas, "--c-pred-a");
        for (const [hx, hy] of boxHandles(selected)) {
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
    }

    if (preview) {
      const color = resolveColor(canvas, LAYER_COLOR_VAR[activeLayer]);
      ctx.beginPath();
      ctx.rect(
        preview.x * scaleX,
        preview.y * scaleY,
        preview.w * scaleX,
        preview.h * scaleY,
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(PREVIEW_DASH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [
    grid,
    gt,
    preds,
    classification,
    activeLayer,
    tool,
    selectedIndex,
    activeBoxes,
    preview,
    themeVersion,
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToGrid(e.clientX, e.clientY, rect, grid);

    // Arm a per-gesture snapshot; it only fires if this gesture actually mutates
    // (consumed in emitActive), so selection-only clicks add no undo frame.
    snapshotPendingRef.current = true;

    if (tool === "rect") {
      dragStartRef.current = [x, y];
      setPreview(null);
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }

    if (tool === "move" && selectedIndex != null) {
      const selected = activeBoxes[selectedIndex];
      if (selected) {
        const handles = boxHandles(selected);
        const r2 = handlePickRadiusGrid * handlePickRadiusGrid;
        for (let i = 0; i < handles.length; i++) {
          const dx = handles[i][0] - x;
          const dy = handles[i][1] - y;
          if (dx * dx + dy * dy <= r2) {
            resizeRef.current = { index: selectedIndex, handle: i };
            canvas.setPointerCapture?.(e.pointerId);
            return;
          }
        }
      }
    }

    let hit = -1;
    for (let i = activeBoxes.length - 1; i >= 0; i--) {
      if (hitTestBox(activeBoxes[i], x, y)) {
        hit = i;
        break;
      }
    }
    if (hit < 0) {
      if (tool === "move") setSelectedIndex(null);
      return;
    }
    if (tool === "delete") {
      emitActive(activeBoxes.filter((_, i) => i !== hit));
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

    if (tool === "rect") {
      const start = dragStartRef.current;
      if (!start) return;
      const { x: bx, y: by, w, h } = normalizeBox(start[0], start[1], x, y);
      setPreview({ x: bx, y: by, w, h });
      return;
    }

    const resize = resizeRef.current;
    if (resize && tool === "move") {
      const next = activeBoxes.map((b, i) => {
        if (i !== resize.index) return b;
        const resized = resizeBoxCorner(
          { kind: "box", x: b.x, y: b.y, w: b.w, h: b.h },
          BOX_CORNERS[resize.handle],
          x,
          y,
        );
        return { ...b, x: resized.x, y: resized.y, w: resized.w, h: resized.h };
      });
      emitActive(next);
      return;
    }

    const drag = dragRef.current;
    if (!drag || tool !== "move") return;
    const dx = x - drag.lastX;
    const dy = y - drag.lastY;
    if (dx === 0 && dy === 0) return;
    const next = activeBoxes.map((b, i) =>
      i === drag.index ? { ...b, x: b.x + dx, y: b.y + dy } : b,
    );
    dragRef.current = { index: drag.index, lastX: x, lastY: y };
    emitActive(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "rect" && dragStartRef.current) {
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
      // GT: no confidence; PRED: born at the visible default confidence.
      const box =
        activeLayer === "GT"
          ? detBoxFromDrag(start[0], start[1], x, y)
          : detBoxFromDrag(start[0], start[1], x, y, DEFAULT_CONFIDENCE);
      emitActive([...activeBoxes, box]);
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

  const selectedBox =
    tool === "move" && selectedIndex != null ? activeBoxes[selectedIndex] : undefined;
  const showConfidence = selectedBox != null && activeLayer === "PRED";
  const showGtDisabled = selectedBox != null && activeLayer === "GT";

  const onConfidenceChange = (value: number) => {
    if (selectedIndex == null) return;
    consumeSnapshot();
    const next = preds.map((b, i) =>
      i === selectedIndex ? withConfidence(b, value) : b,
    );
    onChangePreds(next);
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
          glyph={TOOL_GLYPH.rect}
          label={t.boxTool}
          pressed={tool === "rect"}
          onClick={() => setTool("rect")}
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
            const isLocked = lockedLayers?.includes(layer) ?? false;
            return (
              <button
                key={layer}
                type="button"
                aria-pressed={activeLayer === layer}
                aria-disabled={isLocked || undefined}
                disabled={isLocked}
                title={layerLabel[layer]}
                aria-label={layerLabel[layer]}
                onClick={() => {
                  if (isLocked) return;
                  onSelectLayer?.(layer);
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
                    activeLayer === layer ? "var(--c-surface-2)" : "var(--c-surface)",
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
            );
          })}
        </div>
      </div>

      <div
        style={{ position: "relative", width: "100%", maxWidth: `${CANVAS_PX}px` }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          aria-label={t.detectionEditor}
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
              // A step prompt sits at the TOP as a banner pill so it never strikes
              // through boxes already on the canvas; the empty-state hint centers.
              alignItems: prompt ? "flex-start" : "center",
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
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  color: "var(--c-text)",
                  fontWeight: 600,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-1) var(--space-2)",
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

      {showConfidence && selectedBox && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-sm)",
            color: "var(--c-text)",
          }}
        >
          <span style={{ color: "var(--c-gt-text)", fontWeight: 600 }}>
            {CONFIDENCE_LABEL[lang]}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={selectedBox.confidence ?? 0}
            aria-label={CONFIDENCE_LABEL[lang]}
            onPointerDown={() => {
              snapshotPendingRef.current = true;
            }}
            onKeyDown={() => {
              snapshotPendingRef.current = true;
            }}
            onChange={(e) => onConfidenceChange(Number(e.target.value))}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              minWidth: "4ch",
            }}
          >
            {(selectedBox.confidence ?? 0).toFixed(2)}
          </span>
        </label>
      )}

      {showGtDisabled && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-sm)",
            color: "var(--c-text-dim)",
          }}
        >
          <span style={{ fontWeight: 600 }}>{CONFIDENCE_LABEL[lang]}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={0}
            disabled
            aria-disabled="true"
            aria-label={CONFIDENCE_LABEL[lang]}
            onChange={() => {}}
          />
          <span style={{ fontSize: "var(--text-xs)" }}>{t.noConfidence}</span>
        </label>
      )}
    </div>
  );
}

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  glyph?: string;
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
        border: pressed ? "1px solid var(--c-pred-a)" : "1px solid var(--c-border)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
      }}
    >
      {glyph && <span aria-hidden="true">{glyph}</span>}
      {label}
    </button>
  );
}

export default DetectionCanvas;
