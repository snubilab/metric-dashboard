import type { Grid, Mask } from "../../types/engine";

/**
 * Area of the foreground region in square millimeters.
 *
 * @param g - Grid providing pixel spacing in millimeters.
 * @param mask - Binary mask (values 0|1).
 * @returns Foreground pixel count scaled by the per-pixel area (sx * sy).
 */
export function areaMm2(g: Grid, mask: Mask): number {
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) count++;
  }
  return count * g.spacingMm[0] * g.spacingMm[1];
}

/**
 * Absolute volume (area) difference between prediction and ground truth.
 *
 * @param g - Grid providing pixel spacing in millimeters.
 * @param gt - Ground-truth mask (values 0|1).
 * @param pred - Predicted mask (values 0|1).
 * @returns |area(pred) - area(gt)| in square millimeters.
 */
export function absoluteVolumeDiffMm2(g: Grid, gt: Mask, pred: Mask): number {
  return Math.abs(areaMm2(g, pred) - areaMm2(g, gt));
}

/**
 * Relative volume (area) difference between prediction and ground truth.
 *
 * @param g - Grid providing pixel spacing in millimeters.
 * @param gt - Ground-truth mask (values 0|1).
 * @param pred - Predicted mask (values 0|1).
 * @returns (area(pred) - area(gt)) / area(gt), or NaN when the GT area is 0.
 */
export function relativeVolumeDiff(g: Grid, gt: Mask, pred: Mask): number {
  const gtArea = areaMm2(g, gt);
  if (gtArea === 0) {
    return NaN;
  }
  return (areaMm2(g, pred) - gtArea) / gtArea;
}
