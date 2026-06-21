/**
 * Read-only detection scene preview.
 *
 * Renders ground-truth and prediction boxes IDENTICALLY to the interactive
 * detection board by reusing `drawDetectionScene`: GT/matched in green, false
 * positives in red, missed (FN) dimmed. Per-box role/confidence chips are shown
 * only for sparse scenes; a dense scene drops them so they don't pile up and clip
 * at the small preview's edges (the role colors still carry the picture). No
 * toolbar, no pointer handlers; used by Scenarios to show a static detection so
 * the box visual mirrors how segmentation Scenarios show a `ShapeCanvas`.
 *
 * Token-styled and jsdom-safe (getContext null → bail). Redraws on a light/dark
 * theme toggle via the same MutationObserver-on-data-theme pattern as the
 * editor, so canvas colors track the active theme.
 *
 * @remarks Tokens only — never a hardcoded color/font.
 */

import { useEffect, useRef, useState } from "react";
import type { DetBox, Grid } from "../../types/engine";
import { classifyDetections } from "../../engine/metrics/detClassify";
import { drawDetectionScene } from "./detectionDraw";

export interface DetectionScenePreviewProps {
  grid: Grid;
  gt: DetBox[];
  preds: DetBox[];
  /** IoU threshold for a match; defaults to 0.5. */
  iouThreshold?: number;
  /** Operating confidence threshold; defaults to 0 (every prediction counts). */
  threshold?: number;
  /** Max rendered width in CSS px; defaults to 300. */
  maxPx?: number;
  /** Accessible name for the canvas (bilingual text is the caller's job). */
  ariaLabel: string;
}

/** Canvas backing-store size in device pixels (independent of CSS layout). */
const CANVAS_PX = 320;

/**
 * Above this many boxes the per-box confidence chips pile up and clip at the
 * edges of the small preview, so a dense scene (e.g. a high-false-positive CAD
 * card) drops them and lets the role colors carry the picture. Sparse scenes
 * keep their clean chips.
 */
const CHIP_DENSITY_LIMIT = 8;

export function DetectionScenePreview({
  grid,
  gt,
  preds,
  iouThreshold = 0.5,
  threshold = 0,
  maxPx,
  ariaLabel,
}: DetectionScenePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A light/dark theme switch flips the document's data-theme; canvas colors are
  // read from CSS tokens at draw time, so bump a counter on every change and
  // feed it into the draw effect's deps to force a recolor.
  const [themeVersion, setThemeVersion] = useState(0);
  useEffect(() => {
    if (
      typeof MutationObserver === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }
    const observer = new MutationObserver(() => setThemeVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // jsdom returns null here; bail so tests exercise behavior, not pixels.
    if (!ctx) return;
    const classification = classifyDetections(preds, gt, {
      iouThreshold,
      confidenceThreshold: threshold,
    });
    const showChips = gt.length + preds.length <= CHIP_DENSITY_LIMIT;
    drawDetectionScene(ctx, canvas, { grid, gt, preds, classification, showChips });
  }, [grid, gt, preds, iouThreshold, threshold, themeVersion]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      aria-label={ariaLabel}
      role="img"
      style={{
        width: "100%",
        maxWidth: `${maxPx ?? 300}px`,
        aspectRatio: `${grid.width} / ${grid.height}`,
        display: "block",
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-md)",
      }}
    />
  );
}

export default DetectionScenePreview;
