import type { DegeneratePolicy, Grid, Mask } from "../../types/engine";
import { diagonalMm } from "../raster/grid";
import { hd95 } from "./boundary";
import { dice } from "./overlap";

/**
 * A connected lesion component: its flat pixel indices plus a binary mask over
 * the full grid that is 1 only on those pixels.
 */
export interface Component {
  pixels: number[];
  mask: Mask;
}

/**
 * Options controlling lesion-wise matching.
 */
export interface LesionWiseOptions {
  criterion: "iou" | "centroid";
  threshold: number;
  policy?: DegeneratePolicy;
}

/**
 * Aggregated lesion-wise and voxel-wise scores.
 */
export interface LesionWiseResult {
  lesionSensitivity: number;
  lesionPrecision: number;
  lesionWiseDice: number;
  lesionWiseHd95: number;
  voxelDice: number;
  tpLesions: number;
  fpLesions: number;
  fnLesions: number;
}

const DEFAULT_POLICY: DegeneratePolicy = { emptyDice: "one", emptyDistance: "undefined" };

/**
 * Extract connected foreground components via 8-connectivity flood fill.
 *
 * BraTS 2D convention uses 8-connectivity, so diagonally-touching lesions are
 * treated as a single component.
 *
 * @param g - Grid describing dimensions.
 * @param mask - Binary mask (values 0|1).
 * @returns One {pixels, mask} per component; mask is a full-grid binary mask.
 */
export function connectedComponents(g: Grid, mask: Mask): Component[] {
  const { width, height } = g;
  const visited = new Uint8Array(width * height);
  const components: Component[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] !== 1 || visited[start] === 1) {
      continue;
    }
    const pixels: number[] = [];
    const componentMask = new Uint8Array(width * height);
    const stack = [start];
    visited[start] = 1;
    while (stack.length > 0) {
      const i = stack.pop() as number;
      pixels.push(i);
      componentMask[i] = 1;
      const x = i % width;
      const y = (i - x) / width;
      const hasLeft = x > 0;
      const hasRight = x < width - 1;
      const hasUp = y > 0;
      const hasDown = y < height - 1;
      if (hasLeft) pushNeighbor(i - 1, mask, visited, stack);
      if (hasRight) pushNeighbor(i + 1, mask, visited, stack);
      if (hasUp) pushNeighbor(i - width, mask, visited, stack);
      if (hasDown) pushNeighbor(i + width, mask, visited, stack);
      if (hasUp && hasLeft) pushNeighbor(i - width - 1, mask, visited, stack);
      if (hasUp && hasRight) pushNeighbor(i - width + 1, mask, visited, stack);
      if (hasDown && hasLeft) pushNeighbor(i + width - 1, mask, visited, stack);
      if (hasDown && hasRight) pushNeighbor(i + width + 1, mask, visited, stack);
    }
    components.push({ pixels, mask: componentMask });
  }
  return components;
}

/**
 * Queue an unvisited foreground neighbor for flood fill, marking it visited.
 */
function pushNeighbor(j: number, mask: Mask, visited: Uint8Array, stack: number[]): void {
  if (mask[j] === 1 && visited[j] === 0) {
    visited[j] = 1;
    stack.push(j);
  }
}

/**
 * Intersection-over-union of two equal-length binary component masks.
 */
function componentIou(a: Mask, b: Mask): number {
  let intersection = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    const inA = a[i] === 1;
    const inB = b[i] === 1;
    if (inA && inB) intersection++;
    if (inA || inB) union++;
  }
  return union === 0 ? 0 : intersection / union;
}

/**
 * Centroid of a component in millimeters, using grid pixel spacing.
 */
function centroidMm(g: Grid, c: Component): [number, number] {
  const [sx, sy] = g.spacingMm;
  let sumX = 0;
  let sumY = 0;
  for (const i of c.pixels) {
    const x = i % g.width;
    const y = (i - x) / g.width;
    sumX += x;
    sumY += y;
  }
  const n = c.pixels.length;
  return [(sumX / n) * sx, (sumY / n) * sy];
}

/**
 * Euclidean distance in millimeters between two centroid components.
 */
function centroidDistanceMm(g: Grid, a: Component, b: Component): number {
  const [ax, ay] = centroidMm(g, a);
  const [bx, by] = centroidMm(g, b);
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/**
 * A candidate GT/Pred pairing with its matching score (IoU or -distance).
 */
interface Candidate {
  gtIndex: number;
  predIndex: number;
  score: number;
}

/**
 * Build all admissible GT/Pred candidate pairs above (or within) threshold.
 *
 * For "iou", `score` is IoU and pairs require IoU >= threshold AND IoU > 0, so
 * spatially disjoint components are never matched even when threshold is 0.
 * For "centroid", `score` is the negated distance (so larger is better) and
 * pairs require centroid distance <= threshold.
 */
function buildCandidates(
  g: Grid,
  gtComponents: Component[],
  predComponents: Component[],
  opts: LesionWiseOptions,
): Candidate[] {
  const candidates: Candidate[] = [];
  for (let gi = 0; gi < gtComponents.length; gi++) {
    for (let pi = 0; pi < predComponents.length; pi++) {
      if (opts.criterion === "iou") {
        const iouValue = componentIou(gtComponents[gi].mask, predComponents[pi].mask);
        if (iouValue >= opts.threshold && iouValue > 0) {
          candidates.push({ gtIndex: gi, predIndex: pi, score: iouValue });
        }
      } else {
        const distance = centroidDistanceMm(g, gtComponents[gi], predComponents[pi]);
        if (distance <= opts.threshold) {
          candidates.push({ gtIndex: gi, predIndex: pi, score: -distance });
        }
      }
    }
  }
  return candidates;
}

/**
 * A confirmed one-to-one match between a GT and a Pred component.
 */
interface Match {
  gtIndex: number;
  predIndex: number;
}

/**
 * Greedily match GT and Pred components one-to-one by best score first.
 */
function greedyMatch(candidates: Candidate[]): Match[] {
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  const usedGt = new Set<number>();
  const usedPred = new Set<number>();
  const matches: Match[] = [];
  for (const c of ordered) {
    if (usedGt.has(c.gtIndex) || usedPred.has(c.predIndex)) {
      continue;
    }
    usedGt.add(c.gtIndex);
    usedPred.add(c.predIndex);
    matches.push({ gtIndex: c.gtIndex, predIndex: c.predIndex });
  }
  return matches;
}

/**
 * Mean of an array, or NaN when empty.
 */
function meanOrNaN(values: number[]): number {
  if (values.length === 0) {
    return NaN;
  }
  let sum = 0;
  for (const v of values) {
    sum += v;
  }
  return sum / values.length;
}

/**
 * Compute lesion-wise detection and overlap metrics alongside voxel Dice.
 *
 * GT and Pred are split into connected components and matched one-to-one
 * greedily by IoU (criterion "iou") or by centroid distance (criterion
 * "centroid").
 *
 * Following BraTS-METS lesion-wise scoring, missed (FN) and spurious (FP)
 * lesions are penalized: lesion-wise Dice averages each matched pair's Dice
 * together with a 0 for every unmatched GT/Pred lesion, and lesion-wise HD95
 * averages each matched pair's HD95 together with a worst-case penalty of the
 * grid diagonal (in millimeters) for every unmatched GT/Pred lesion. When there
 * are no lesions at all, both lesion-wise scores are NaN.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param gt - Ground-truth binary mask.
 * @param pred - Predicted binary mask.
 * @param opts - Matching criterion, threshold, and optional degenerate policy.
 * @returns Lesion-wise and voxel-wise scores plus lesion TP/FP/FN counts.
 */
export function lesionWise(g: Grid, gt: Mask, pred: Mask, opts: LesionWiseOptions): LesionWiseResult {
  const policy = opts.policy ?? DEFAULT_POLICY;
  const gtComponents = connectedComponents(g, gt);
  const predComponents = connectedComponents(g, pred);
  const candidates = buildCandidates(g, gtComponents, predComponents, opts);
  const matches = greedyMatch(candidates);

  const totalGt = gtComponents.length;
  const totalPred = predComponents.length;
  const tpLesions = matches.length;
  const unmatchedLesions = totalGt - tpLesions + (totalPred - tpLesions);

  const matchedDice = matches.map((m) =>
    dice(gtComponents[m.gtIndex].mask, predComponents[m.predIndex].mask, policy),
  );
  const matchedHd95 = matches.map((m) =>
    hd95(g, gtComponents[m.gtIndex].mask, predComponents[m.predIndex].mask, policy),
  );

  const worstCaseHd95 = diagonalMm(g);
  const penalizedDice = [...matchedDice, ...Array<number>(unmatchedLesions).fill(0)];
  const penalizedHd95 = [...matchedHd95, ...Array<number>(unmatchedLesions).fill(worstCaseHd95)];

  return {
    lesionSensitivity: totalGt === 0 ? 0 : tpLesions / totalGt,
    lesionPrecision: totalPred === 0 ? 0 : tpLesions / totalPred,
    lesionWiseDice: meanOrNaN(penalizedDice),
    lesionWiseHd95: meanOrNaN(penalizedHd95),
    voxelDice: dice(gt, pred, policy),
    tpLesions,
    fpLesions: totalPred - tpLesions,
    fnLesions: totalGt - tpLesions,
  };
}
