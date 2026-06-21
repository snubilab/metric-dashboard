import type { DetBox } from "../../types/engine";
import type { MetricRow } from "./types";
import {
  averagePrecision,
  averagePrecisionRange,
  matchDetections,
  prCurve,
} from "../../engine/metrics/detection";

/** Scalar detection scores for one prediction set against the shared ground truth. */
interface DetScores {
  recall: number;
  precision: number;
  f1: number;
  ap50: number;
  apRange: number;
}

/**
 * Compute the scalar detection scores for one prediction set against the shared
 * ground truth at the given IoU threshold. Counts come from {@link matchDetections};
 * AP rows integrate the precision-recall curve. The divide-by-zero guards mirror
 * DetectionMetricsPanel exactly.
 *
 * @param gt - Ground-truth objects (no confidence).
 * @param preds - Predicted boxes with confidences.
 * @param iouThreshold - IoU threshold for a match.
 * @returns Recall, precision, F1, AP50, and AP@[.5:.95] for this prediction set.
 */
function scoreSide(gt: DetBox[], preds: DetBox[], iouThreshold: number): DetScores {
  const counts = matchDetections(preds, gt, { iouThreshold });
  const recall = gt.length === 0 ? 0 : counts.tp / gt.length;
  const precision = counts.tp + counts.fp === 0 ? 0 : counts.tp / (counts.tp + counts.fp);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const ap50 = averagePrecision(prCurve(preds, gt, 0.5), "coco101");
  const apRange = averagePrecisionRange(preds, gt, "coco101");
  return { recall, precision, f1, ap50, apRange };
}

/** Display configuration for one detection metric, keyed to a DetScores field. */
interface MetricSpec {
  key: string;
  label: string;
  field: keyof DetScores;
}

/**
 * Ordered metric definitions. Recall is first so it serves as the reference row
 * for rank-flip detection downstream. All detection metrics are higher-is-better
 * unitless ratios.
 */
const METRIC_SPECS: readonly MetricSpec[] = [
  { key: "recall", label: "Recall", field: "recall" },
  { key: "precision", label: "Precision", field: "precision" },
  { key: "f1", label: "F1", field: "f1" },
  { key: "ap50", label: "AP50", field: "ap50" },
  { key: "apRange", label: "AP@[.5:.95]", field: "apRange" },
];

/**
 * Turn a detection A-vs-B comparison into the ordered MetricRow[] consumed by the
 * shared MetricTable. Each side is scored from its own prediction set against the
 * shared ground truth at the same IoU threshold. Pure function (no React).
 *
 * @param gt - Ground-truth objects shared by both detectors.
 * @param predsA - Prediction set for detector A.
 * @param predsB - Prediction set for detector B.
 * @param iouThreshold - IoU threshold for a match (default 0.5).
 * @returns The five comparison rows (recall, precision, f1, ap50, apRange) in order.
 */
export function detComparisonRows(
  gt: DetBox[],
  predsA: DetBox[],
  predsB: DetBox[],
  iouThreshold = 0.5,
): MetricRow[] {
  const a = scoreSide(gt, predsA, iouThreshold);
  const b = scoreSide(gt, predsB, iouThreshold);
  return METRIC_SPECS.map((spec) => ({
    key: spec.key,
    label: spec.label,
    a: a[spec.field],
    b: b[spec.field],
    higherIsBetter: true,
  }));
}
