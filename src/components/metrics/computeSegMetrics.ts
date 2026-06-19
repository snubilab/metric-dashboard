import type { EngineState, Mask } from "../../types/engine";
import { rasterize } from "../../engine/raster/rasterize";
import { dice, iou, sensitivity, precision } from "../../engine/metrics/overlap";
import { hd95, assd, surfaceDice } from "../../engine/metrics/boundary";
import { relativeVolumeDiff } from "../../engine/metrics/volume";

/** Default NSD boundary tolerance in millimeters when the state omits one. */
const DEFAULT_NSD_TOLERANCE_MM = 2;

/** Segmentation metrics computed for a single prediction against ground truth. */
export interface SegMetrics {
  dice: number;
  iou: number;
  sensitivity: number;
  precision: number;
  hd95: number;
  assd: number;
  /** Normalized surface Dice at the state's NSD tolerance. */
  nsd: number;
  /** Relative volume (area) difference: (pred - gt) / gt. */
  volRel: number;
}

/**
 * Rasterize ground truth and the chosen prediction layer, then compute the
 * full segmentation metric suite for that prediction.
 *
 * @param state - Engine state with grid, ground truth, predictions, and policy.
 * @param predId - Which prediction layer to evaluate ("A" or "B").
 * @returns The segmentation metrics for the selected prediction.
 */
export function computeSegMetrics(state: EngineState, predId: "A" | "B"): SegMetrics {
  const { grid, policy } = state;
  const gtMask: Mask = rasterize(grid, state.gt);
  const layer = state.predictions.find((p) => p.id === predId);
  const predMask: Mask = rasterize(grid, layer ? layer.shapes : []);
  const toleranceMm = state.nsdToleranceMm ?? DEFAULT_NSD_TOLERANCE_MM;

  return {
    dice: dice(gtMask, predMask, policy),
    iou: iou(gtMask, predMask, policy),
    sensitivity: sensitivity(gtMask, predMask, policy),
    precision: precision(gtMask, predMask, policy),
    hd95: hd95(grid, gtMask, predMask, policy),
    assd: assd(grid, gtMask, predMask, policy),
    nsd: surfaceDice(grid, gtMask, predMask, toleranceMm, policy),
    volRel: relativeVolumeDiff(grid, gtMask, predMask),
  };
}
