import type { DegeneratePolicy, Grid, Mask } from "../../types/engine";
import { edt } from "../distance/edt";
import { diagonalMm } from "../raster/grid";
import { resolveEmptyDistance } from "../policy";

/**
 * Count the foreground pixels in a mask.
 *
 * @param mask - Binary mask (values 0|1).
 * @returns Number of pixels set to 1.
 */
function foregroundCount(mask: Mask): number {
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) {
      count++;
    }
  }
  return count;
}

/**
 * Build the boundary mask of a binary mask.
 *
 * A boundary pixel is a foreground pixel (value 1) that has at least one
 * 4-neighbor that is background or lies outside the grid.
 *
 * @param g - Grid describing dimensions.
 * @param mask - Binary mask (values 0|1).
 * @returns A new mask with value 1 only at boundary pixels.
 */
export function boundaryMask(g: Grid, mask: Mask): Mask {
  const { width, height } = g;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (mask[i] !== 1) {
        continue;
      }
      const left = x === 0 || mask[i - 1] !== 1;
      const right = x === width - 1 || mask[i + 1] !== 1;
      const up = y === 0 || mask[i - width] !== 1;
      const down = y === height - 1 || mask[i + width] !== 1;
      if (left || right || up || down) {
        out[i] = 1;
      }
    }
  }
  return out;
}

/**
 * Compute the directed distance set from one boundary to another.
 *
 * For every boundary pixel of `fromMask`, sample the precomputed Euclidean
 * distance transform of `toBoundaryMask` to obtain its distance (mm) to the
 * nearest boundary pixel of the other mask.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param fromMask - Source mask whose boundary pixels are sampled.
 * @param toBoundaryMask - Boundary mask of the target, used as EDT seed.
 * @returns Array of distances in millimeters, one per source boundary pixel.
 */
export function directedDistances(g: Grid, fromMask: Mask, toBoundaryMask: Mask): number[] {
  const fromBoundary = boundaryMask(g, fromMask);
  const distField = edt(g, toBoundaryMask);
  const distances: number[] = [];
  for (let i = 0; i < fromBoundary.length; i++) {
    if (fromBoundary[i] === 1) {
      distances.push(distField[i]);
    }
  }
  return distances;
}

/**
 * Compute a percentile of an ascending-sorted array using linear interpolation
 * between the two closest ranks.
 *
 * @param sorted - Values sorted in ascending order (non-empty).
 * @param p - Percentile in [0, 100].
 * @returns The interpolated percentile value.
 */
function percentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 1) {
    return sorted[0];
  }
  const rank = (p / 100) * (n - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Mean of a non-empty numeric array.
 *
 * @param values - Numbers to average.
 * @returns Arithmetic mean.
 */
function mean(values: number[]): number {
  let sum = 0;
  for (const v of values) {
    sum += v;
  }
  return sum / values.length;
}

/**
 * Determine whether either mask is degenerate (zero foreground pixels).
 *
 * @param a - First mask.
 * @param b - Second mask.
 * @returns True if either mask has no foreground.
 */
function eitherEmpty(a: Mask, b: Mask): boolean {
  return foregroundCount(a) === 0 || foregroundCount(b) === 0;
}

/**
 * Pool both directed distance sets (A->B and B->A) into one multiset.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param a - First mask.
 * @param b - Second mask.
 * @returns Concatenation of A->B and B->A distances in millimeters.
 */
function pooledDistances(g: Grid, a: Mask, b: Mask): number[] {
  const aToB = directedDistances(g, a, boundaryMask(g, b));
  const bToA = directedDistances(g, b, boundaryMask(g, a));
  return aToB.concat(bToA);
}

/**
 * Hausdorff distance: the maximum of the two directed maximum distances.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param a - First mask.
 * @param b - Second mask.
 * @param policy - Degenerate-case policy.
 * @returns Hausdorff distance in millimeters, or the policy value if empty.
 */
export function hd(g: Grid, a: Mask, b: Mask, policy: DegeneratePolicy): number {
  if (eitherEmpty(a, b)) {
    return resolveEmptyDistance(policy, diagonalMm(g));
  }
  const aToB = directedDistances(g, a, boundaryMask(g, b));
  const bToA = directedDistances(g, b, boundaryMask(g, a));
  return Math.max(Math.max(...aToB), Math.max(...bToA));
}

/**
 * 95th-percentile Hausdorff distance over the pooled directed distance multiset.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param a - First mask.
 * @param b - Second mask.
 * @param policy - Degenerate-case policy.
 * @returns HD95 in millimeters, or the policy value if empty.
 */
export function hd95(g: Grid, a: Mask, b: Mask, policy: DegeneratePolicy): number {
  if (eitherEmpty(a, b)) {
    return resolveEmptyDistance(policy, diagonalMm(g));
  }
  const pooled = pooledDistances(g, a, b);
  pooled.sort((x, y) => x - y);
  return percentile(pooled, 95);
}

/**
 * Average surface distance: mean of the directed distance set A->B.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param a - First mask.
 * @param b - Second mask.
 * @param policy - Degenerate-case policy.
 * @returns Mean directed distance in millimeters, or the policy value if empty.
 */
export function asd(g: Grid, a: Mask, b: Mask, policy: DegeneratePolicy): number {
  if (eitherEmpty(a, b)) {
    return resolveEmptyDistance(policy, diagonalMm(g));
  }
  return mean(directedDistances(g, a, boundaryMask(g, b)));
}

/**
 * Average symmetric surface distance: mean of the pooled directed distances.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param a - First mask.
 * @param b - Second mask.
 * @param policy - Degenerate-case policy.
 * @returns Mean pooled distance in millimeters, or the policy value if empty.
 */
export function assd(g: Grid, a: Mask, b: Mask, policy: DegeneratePolicy): number {
  if (eitherEmpty(a, b)) {
    return resolveEmptyDistance(policy, diagonalMm(g));
  }
  return mean(pooledDistances(g, a, b));
}

/**
 * Normalized surface Dice: fraction of pooled boundary points within
 * `toleranceMm` of the other boundary.
 *
 * @param g - Grid describing dimensions and spacing.
 * @param a - First mask.
 * @param b - Second mask.
 * @param toleranceMm - Distance tolerance in millimeters.
 * @param policy - Degenerate-case policy.
 * @returns Fraction in [0, 1], or NaN/0 per policy if either mask is empty.
 */
export function surfaceDice(g: Grid, a: Mask, b: Mask, toleranceMm: number, policy: DegeneratePolicy): number {
  if (eitherEmpty(a, b)) {
    return policy.emptyDistance === "undefined" ? NaN : 0;
  }
  const pooled = pooledDistances(g, a, b);
  let within = 0;
  for (const d of pooled) {
    if (d <= toleranceMm) {
      within++;
    }
  }
  return within / pooled.length;
}
