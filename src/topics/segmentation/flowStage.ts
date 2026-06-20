/**
 * Pure derivation of the guided flow stage from engine state.
 *
 * `flowStage` is the single source of truth for the draw-from-scratch guided
 * experience: it drives the STEP n/3 pill, which layer is active/locked, the
 * per-step canvas prompt, and the metrics gate. It is intentionally separate
 * from `canvasMath` because it is segmentation-flow logic, not geometry, and
 * must stay unit-testable without any canvas.
 *
 * No metric is ever graded here — the stage only describes how far the student
 * has progressed through GT -> A -> B -> compare.
 */

import type { EngineState } from "../../types/engine";
import type { Layer } from "../../components/canvas/CanvasEditor";

/** The four stages of the guided draw-from-scratch flow. */
export type FlowStage = "gt" | "a" | "b" | "compare";

/** True when a prediction layer with the given id has no committed shapes. */
function predictionEmpty(
  predictions: EngineState["predictions"],
  id: "A" | "B",
): boolean {
  const layer = predictions.find((p) => p.id === id);
  return (layer?.shapes.length ?? 0) === 0;
}

/**
 * Derive the guided flow stage purely from shape counts:
 * GT empty -> 'gt'; else A empty -> 'a'; else B empty -> 'b'; else 'compare'.
 * A missing prediction entry counts as empty.
 */
export function flowStage(
  state: Pick<EngineState, "gt" | "predictions">,
): FlowStage {
  if (state.gt.length === 0) return "gt";
  if (predictionEmpty(state.predictions, "A")) return "a";
  if (predictionEmpty(state.predictions, "B")) return "b";
  return "compare";
}

/**
 * The layer a given stage should drive. 'compare' returns `null`, meaning the
 * layer is user-chosen once the comparison has unlocked.
 */
export function stageLayer(stage: FlowStage): Layer | null {
  switch (stage) {
    case "gt":
      return "GT";
    case "a":
      return "A";
    case "b":
      return "B";
    case "compare":
      return null;
  }
}

/**
 * Layers that must be dimmed + disabled at this stage — the layers *after* the
 * current one, so a student never draws into a layer they haven't reached.
 */
export function lockedLayersFor(stage: FlowStage): Layer[] {
  switch (stage) {
    case "gt":
      return ["A", "B"];
    case "a":
      return ["B"];
    case "b":
      return [];
    case "compare":
      return [];
  }
}

/** 1-based step index for the STEP pill: gt->1, a->2, b->3, compare->3. */
export function stageStep(stage: FlowStage): number {
  switch (stage) {
    case "gt":
      return 1;
    case "a":
      return 2;
    case "b":
      return 3;
    case "compare":
      return 3;
  }
}
