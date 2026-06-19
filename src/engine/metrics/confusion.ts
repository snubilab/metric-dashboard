import type { Mask } from "../../types/engine";

export interface ConfusionCounts {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

/**
 * Count confusion-matrix cells between two equal-length binary masks.
 *
 * @param gt - Ground-truth mask (values 0|1).
 * @param pred - Predicted mask (values 0|1).
 * @returns Counts of true/false positives and negatives.
 */
export function confusion(gt: Mask, pred: Mask): ConfusionCounts {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (let i = 0; i < gt.length; i++) {
    const g = gt[i];
    const p = pred[i];
    if (g && p) {
      tp++;
    } else if (!g && p) {
      fp++;
    } else if (g && !p) {
      fn++;
    } else {
      tn++;
    }
  }
  return { tp, fp, fn, tn };
}
