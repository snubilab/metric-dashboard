/**
 * Read-only segmentation canvas.
 *
 * Renders GT/A/B shapes IDENTICALLY to the interactive Playground by reusing
 * `drawScene` — same translucent fills, per-layer dashes, and contrast-picked
 * tag chips with the same de-collision pass. No toolbar, no pointer handlers;
 * used by Scenarios and mini-sims to show a static segmentation.
 *
 * Token-styled and jsdom-safe (getContext null → bail). Redraws on a light/dark
 * theme toggle via the same MutationObserver-on-data-theme pattern as the
 * editor, so canvas colors track the active theme.
 */

import { useEffect, useRef, useState } from "react";
import type { Grid, Shape } from "../../types/engine";
import { drawScene, type Layer } from "./sceneDraw";

interface PredictionInput {
  id: "A" | "B";
  shapes: Shape[];
}

export interface ShapeCanvasProps {
  grid: Grid;
  gt: Shape[];
  predictions: PredictionInput[];
  /** Layers to draw; defaults to all three. */
  visibleLayers?: Layer[];
  /** Max rendered width in CSS px; defaults to 320. */
  maxPx?: number;
  /** Accessible name for the canvas (bilingual text is the caller's job). */
  ariaLabel: string;
}

/** Canvas backing-store size in device pixels (independent of CSS layout). */
const CANVAS_PX = 320;

export function ShapeCanvas({
  grid,
  gt,
  predictions,
  visibleLayers,
  maxPx,
  ariaLabel,
}: ShapeCanvasProps) {
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
    drawScene(ctx, canvas, { grid, gt, predictions, visibleLayers });
  }, [grid, gt, predictions, visibleLayers, themeVersion]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      aria-label={ariaLabel}
      role="img"
      style={{
        width: "100%",
        maxWidth: `${maxPx ?? CANVAS_PX}px`,
        aspectRatio: `${grid.width} / ${grid.height}`,
        display: "block",
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-md)",
      }}
    />
  );
}

export default ShapeCanvas;
