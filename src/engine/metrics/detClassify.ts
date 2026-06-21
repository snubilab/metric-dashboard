import type { DetBox } from "../../types/engine";
import { boxIou } from "./detection";
import { normalizeBox } from "../../components/canvas/canvasMath";

/** Role of a prediction at the live confidence threshold. */
export type PredRole = "tp" | "fp" | "below";

/** Role of a ground-truth box after matching above-threshold predictions. */
export type GtRole = "matched" | "fn";

/**
 * Per-box roles and outcome counts at one operating point. `counts` are
 * byte-identical to `matchDetections(aboveThreshold(preds, T), gt, { iouThreshold })`.
 */
export interface Classification {
  predRoles: PredRole[];
  gtRoles: GtRole[];
  counts: { tp: number; fp: number; fn: number };
}

/**
 * Classifies every prediction and ground-truth box at the live confidence
 * threshold, replicating `matchDetections`' exact greedy logic so the counts can
 * never disagree with the metrics panel.
 *
 * Predictions with confidence >= `confidenceThreshold` are ABOVE and enter the
 * greedy match; the rest get role "below" and never affect counts. The greedy
 * loop mirrors `matchDetections` verbatim: predictions are scanned in descending
 * confidence (missing confidence treated as 0); per prediction the best unused GT
 * is found with `bestIou` seeded at `iouThreshold` and updated whenever
 * `overlap >= bestIou`, so on an exact IoU tie the LAST (highest-index) GT wins.
 *
 * @returns predRoles aligned to `preds` input order, gtRoles aligned to `gt`
 *          input order, and the matching counts.
 */
export function classifyDetections(
  preds: DetBox[],
  gt: DetBox[],
  opts: { iouThreshold: number; confidenceThreshold: number },
): Classification {
  const predRoles = new Array<PredRole>(preds.length);

  // Filter to ABOVE while keeping a stable map back to the original index.
  // Same `>=` boundary as detection.ts's aboveThreshold.
  const above: { box: DetBox; originalIndex: number }[] = [];
  for (let i = 0; i < preds.length; i++) {
    if ((preds[i].confidence ?? 0) >= opts.confidenceThreshold) {
      above.push({ box: preds[i], originalIndex: i });
    } else {
      predRoles[i] = "below";
    }
  }

  // Sort ABOVE by descending confidence (missing -> 0), same as sortByConfidenceDesc.
  const sorted = [...above].sort((a, b) => (b.box.confidence ?? 0) - (a.box.confidence ?? 0));

  const gtMatched = new Array<boolean>(gt.length).fill(false);
  let tp = 0;
  let fp = 0;

  for (const { box, originalIndex } of sorted) {
    let bestIou = opts.iouThreshold;
    let bestGtIndex = -1;
    for (let i = 0; i < gt.length; i++) {
      if (gtMatched[i]) {
        continue;
      }
      const overlap = boxIou(box, gt[i]);
      if (overlap >= bestIou) {
        bestIou = overlap;
        bestGtIndex = i;
      }
    }
    if (bestGtIndex >= 0) {
      gtMatched[bestGtIndex] = true;
      tp += 1;
      predRoles[originalIndex] = "tp";
    } else {
      fp += 1;
      predRoles[originalIndex] = "fp";
    }
  }

  const gtRoles: GtRole[] = gtMatched.map((matched) => (matched ? "matched" : "fn"));
  const fn = gtRoles.filter((role) => role === "fn").length;

  return { predRoles, gtRoles, counts: { tp, fp, fn } };
}

/**
 * Builds a `DetBox` from a drag's two corners via `normalizeBox` (direction
 * agnostic). Includes `confidence` only when provided — ground-truth omits it,
 * predictions pass their value. Pure; never mutates.
 */
export function detBoxFromDrag(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  confidence?: number,
): DetBox {
  const { x, y, w, h } = normalizeBox(ax, ay, bx, by);
  return confidence === undefined ? { x, y, w, h } : { x, y, w, h, confidence };
}

/**
 * Returns a new `DetBox` with the given confidence and unchanged geometry. The
 * original box is not mutated. Used by the per-box confidence slider.
 */
export function withConfidence(box: DetBox, confidence: number): DetBox {
  return { ...box, confidence };
}
