/**
 * Pure derivation of the guided Detection flow stage from drawn state.
 *
 * `detectionStage` is the single source of truth for the draw-from-scratch
 * Detection playground: it drives the STEP n/2 pill, which layer is
 * active/locked, the per-step canvas prompt, and the compare gate. It mirrors
 * segmentation's `flowStage` but honors that detection is GROUND-TRUTH vs
 * PREDICTIONS-WITH-A-CONFIDENCE-THRESHOLD — two draw steps (GT boxes, then
 * predicted boxes), then a compare/explore stage. There is no A-vs-B layer.
 *
 * It is intentionally separate from `canvasMath` because it is flow logic, not
 * geometry, and must stay unit-testable without any canvas. No metric is ever
 * graded here — the stage only describes how far the student has progressed
 * through GT -> PRED -> compare.
 */

import type { DetBox } from "../../types/engine";

/** The two drawable detection layers: ground truth and predictions. */
export type DetLayer = "GT" | "PRED";

/** The two draw stages plus the compare/explore stage. */
export type DetStage = "gt" | "preds" | "compare";

/** Minimal drawn-state slice the stage derivation needs. */
export interface DetState {
  gt: DetBox[];
  preds: DetBox[];
}

/**
 * Derive the guided detection stage purely from box counts:
 * GT empty -> 'gt'; else preds empty -> 'preds'; else 'compare'.
 */
export function detectionStage(state: DetState): DetStage {
  if (state.gt.length === 0) return "gt";
  if (state.preds.length === 0) return "preds";
  return "compare";
}

/**
 * The layer a given stage should drive. 'compare' returns `null`, meaning the
 * layer is user-chosen once the comparison has unlocked.
 */
export function stageLayer(stage: DetStage): DetLayer | null {
  switch (stage) {
    case "gt":
      return "GT";
    case "preds":
      return "PRED";
    case "compare":
      return null;
  }
}

/**
 * Layers that must be dimmed + disabled at this stage. In 'gt' the PRED layer
 * is locked so the student never draws predictions before any ground truth
 * exists; once predictions begin, nothing is locked.
 */
export function lockedLayersFor(stage: DetStage): DetLayer[] {
  switch (stage) {
    case "gt":
      return ["PRED"];
    case "preds":
      return [];
    case "compare":
      return [];
  }
}

/** 1-based step index for the STEP pill: gt->1, preds->2, compare->2. */
export function stageStep(stage: DetStage): number {
  switch (stage) {
    case "gt":
      return 1;
    case "preds":
      return 2;
    case "compare":
      return 2;
  }
}
