import type { DetBox } from "../../types/engine";

/** A single point on a precision-recall curve. */
export interface PrPoint {
  recall: number;
  precision: number;
  confidence: number;
}

/** A single operating point on a FROC curve. */
export interface FrocPoint {
  fpPerScan: number;
  sensitivity: number;
  confidence: number;
}

/** Tally of detection outcomes after matching predictions against ground truth. */
export interface MatchCounts {
  tp: number;
  fp: number;
  fn: number;
}

/** Method for interpolating average precision from a precision-recall curve. */
export type ApMethod = "voc11" | "vocAll" | "coco101";

/**
 * Intersection-over-union of two axis-aligned boxes.
 *
 * @returns Intersection area divided by union area; 0 when the boxes do not overlap.
 */
export function boxIou(a: DetBox, b: DetBox): number {
  const interLeft = Math.max(a.x, b.x);
  const interTop = Math.max(a.y, b.y);
  const interRight = Math.min(a.x + a.w, b.x + b.w);
  const interBottom = Math.min(a.y + a.h, b.y + b.h);

  const interWidth = interRight - interLeft;
  const interHeight = interBottom - interTop;
  if (interWidth <= 0 || interHeight <= 0) {
    return 0;
  }

  const intersection = interWidth * interHeight;
  const union = a.w * a.h + b.w * b.h - intersection;
  if (union <= 0) {
    return 0;
  }
  return intersection / union;
}

/** Returns predictions ordered by descending confidence (missing confidence treated as 0). */
function sortByConfidenceDesc(preds: DetBox[]): DetBox[] {
  return [...preds].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}

/**
 * Greedily assigns each prediction (highest confidence first) to the best-IoU
 * unused ground-truth box meeting the threshold. Each GT matches at most one
 * prediction; surplus predictions on an already-matched GT count as false positives.
 *
 * @returns Counts of true positives, false positives, and false negatives.
 */
export function matchDetections(
  preds: DetBox[],
  gt: DetBox[],
  opts: { iouThreshold: number },
): MatchCounts {
  const sorted = sortByConfidenceDesc(preds);
  const gtMatched = new Array<boolean>(gt.length).fill(false);

  let tp = 0;
  let fp = 0;

  for (const pred of sorted) {
    let bestIou = opts.iouThreshold;
    let bestGtIndex = -1;
    for (let i = 0; i < gt.length; i++) {
      if (gtMatched[i]) {
        continue;
      }
      const overlap = boxIou(pred, gt[i]);
      if (overlap >= bestIou) {
        bestIou = overlap;
        bestGtIndex = i;
      }
    }
    if (bestGtIndex >= 0) {
      gtMatched[bestGtIndex] = true;
      tp += 1;
    } else {
      fp += 1;
    }
  }

  const fn = gtMatched.filter((matched) => !matched).length;
  return { tp, fp, fn };
}

/**
 * Builds a precision-recall curve by sweeping predictions in descending
 * confidence and accumulating true/false positives.
 *
 * @returns One point per prediction, in descending-confidence order.
 */
export function prCurve(preds: DetBox[], gt: DetBox[], iouThreshold: number): PrPoint[] {
  const sorted = sortByConfidenceDesc(preds);
  const gtMatched = new Array<boolean>(gt.length).fill(false);

  const points: PrPoint[] = [];
  let cumTp = 0;
  let cumFp = 0;

  for (const pred of sorted) {
    let bestIou = iouThreshold;
    let bestGtIndex = -1;
    for (let i = 0; i < gt.length; i++) {
      if (gtMatched[i]) {
        continue;
      }
      const overlap = boxIou(pred, gt[i]);
      if (overlap >= bestIou) {
        bestIou = overlap;
        bestGtIndex = i;
      }
    }
    if (bestGtIndex >= 0) {
      gtMatched[bestGtIndex] = true;
      cumTp += 1;
    } else {
      cumFp += 1;
    }

    const recall = gt.length === 0 ? 0 : cumTp / gt.length;
    const denom = cumTp + cumFp;
    const precision = denom === 0 ? 0 : cumTp / denom;
    points.push({ recall, precision, confidence: pred.confidence ?? 0 });
  }

  return points;
}

/**
 * Tolerance for recall-level comparisons. The fixed-grid recall levels are built
 * by accumulating `i * step`, which introduces floating-point error (e.g.
 * `3 * 0.1 === 0.30000000000000004`). Comparing curve recalls against those
 * levels with this epsilon keeps an exact-recall point from being wrongly
 * excluded from the envelope.
 */
const RECALL_EPSILON = 1e-9;

/**
 * Precision envelope: the maximum precision among curve points whose recall is
 * at least the given recall level (0 when no such point exists). The comparison
 * tolerates floating-point error in the recall level (see RECALL_EPSILON).
 */
function precisionEnvelope(curve: { recall: number; precision: number }[], recall: number): number {
  let best = 0;
  for (const point of curve) {
    if (point.recall >= recall - RECALL_EPSILON && point.precision > best) {
      best = point.precision;
    }
  }
  return best;
}

/** Average precision via fixed-grid interpolation over the given recall levels. */
function interpolatedAp(
  curve: { recall: number; precision: number }[],
  recallLevels: number[],
): number {
  const sum = recallLevels.reduce((acc, r) => acc + precisionEnvelope(curve, r), 0);
  return sum / recallLevels.length;
}

/** Generates an inclusive sequence of recall levels from 0 to 1 with the given step. */
function recallGrid(step: number): number[] {
  const levels: number[] = [];
  const count = Math.round(1 / step);
  for (let i = 0; i <= count; i++) {
    levels.push(i * step);
  }
  return levels;
}

/** Area under the right-monotone precision envelope, integrated over recall in [0, 1]. */
function areaUnderEnvelope(curve: { recall: number; precision: number }[]): number {
  const thresholds = Array.from(new Set(curve.map((point) => point.recall))).sort((a, b) => a - b);
  let area = 0;
  let previousRecall = 0;
  for (const recall of thresholds) {
    area += (recall - previousRecall) * precisionEnvelope(curve, recall);
    previousRecall = recall;
  }
  return area;
}

/**
 * Average precision computed from a precision-recall curve.
 *
 * @param method - voc11 (11-point), coco101 (101-point), or vocAll (area under
 *                 the precision envelope).
 */
export function averagePrecision(
  curve: { recall: number; precision: number }[],
  method: ApMethod,
): number {
  switch (method) {
    case "voc11":
      return interpolatedAp(curve, recallGrid(0.1));
    case "coco101":
      return interpolatedAp(curve, recallGrid(0.01));
    case "vocAll":
      return areaUnderEnvelope(curve);
  }
}

const COCO_IOU_THRESHOLDS = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];

/**
 * Average precision averaged across the COCO IoU thresholds (0.50 to 0.95 in
 * steps of 0.05), recomputing the precision-recall curve at each threshold.
 */
export function averagePrecisionRange(
  preds: DetBox[],
  gt: DetBox[],
  method: ApMethod = "coco101",
): number {
  const sum = COCO_IOU_THRESHOLDS.reduce(
    (acc, threshold) => acc + averagePrecision(prCurve(preds, gt, threshold), method),
    0,
  );
  return sum / COCO_IOU_THRESHOLDS.length;
}

/** Collects every detection confidence across all scans, deduplicated and sorted descending. */
function uniqueConfidencesDesc(detectionsPerScan: DetBox[][]): number[] {
  const confidences = new Set<number>();
  for (const scan of detectionsPerScan) {
    for (const det of scan) {
      confidences.add(det.confidence ?? 0);
    }
  }
  return [...confidences].sort((a, b) => b - a);
}

/**
 * Free-response ROC curve. For each confidence threshold (every distinct
 * detection confidence, swept high to low), detections with confidence at or
 * above the threshold are matched one-to-one against each scan's ground truth.
 *
 * @returns Operating points sorted by ascending false positives per scan.
 */
export function frocCurve(
  detectionsPerScan: DetBox[][],
  gtPerScan: DetBox[][],
  iouThreshold = 0.5,
): FrocPoint[] {
  const scanCount = gtPerScan.length;
  const totalGt = gtPerScan.reduce((acc, scan) => acc + scan.length, 0);
  const thresholds = uniqueConfidencesDesc(detectionsPerScan);

  const points: FrocPoint[] = [];
  for (const threshold of thresholds) {
    let totalTp = 0;
    let totalFp = 0;
    for (let scan = 0; scan < scanCount; scan++) {
      const dets = (detectionsPerScan[scan] ?? []).filter(
        (det) => (det.confidence ?? 0) >= threshold,
      );
      const counts = matchDetections(dets, gtPerScan[scan], { iouThreshold });
      totalTp += counts.tp;
      totalFp += counts.fp;
    }
    const sensitivity = totalGt === 0 ? 0 : totalTp / totalGt;
    const fpPerScan = scanCount === 0 ? 0 : totalFp / scanCount;
    points.push({ fpPerScan, sensitivity, confidence: threshold });
  }

  return points.sort((a, b) => a.fpPerScan - b.fpPerScan);
}

/**
 * Maximum sensitivity among FROC points operating at or below the given
 * false-positives-per-scan budget; 0 when no point fits the budget.
 */
export function sensitivityAtFp(froc: FrocPoint[], fp: number): number {
  let best = 0;
  for (const point of froc) {
    if (point.fpPerScan <= fp && point.sensitivity > best) {
      best = point.sensitivity;
    }
  }
  return best;
}

const LUNA16_FP_POINTS = [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8];

/** LUNA16 competition score: mean sensitivity across the seven standard FP-per-scan budgets. */
export function luna16Score(froc: FrocPoint[]): number {
  const sum = LUNA16_FP_POINTS.reduce((acc, fp) => acc + sensitivityAtFp(froc, fp), 0);
  return sum / LUNA16_FP_POINTS.length;
}
