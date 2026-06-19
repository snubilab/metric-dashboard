import type { DegeneratePolicy } from "../types/engine";

/**
 * Resolve the Dice/IoU value to report when both masks are empty.
 *
 * @param policy - Degenerate-case policy.
 * @returns 1, 0, or NaN per `policy.emptyDice`.
 */
export function resolveEmptyDice(policy: DegeneratePolicy): number {
  switch (policy.emptyDice) {
    case "one":
      return 1;
    case "zero":
      return 0;
    case "nan":
      return NaN;
  }
}

/**
 * Resolve the boundary distance to report when a mask is degenerate.
 *
 * @param policy - Degenerate-case policy.
 * @param diagonalMm - Image diagonal length in millimeters.
 * @returns NaN, the diagonal, or the fixed penalty per `policy.emptyDistance`.
 */
export function resolveEmptyDistance(policy: DegeneratePolicy, diagonalMm: number): number {
  switch (policy.emptyDistance) {
    case "undefined":
      return NaN;
    case "diagonal":
      return diagonalMm;
    case "fixed":
      return policy.fixedPenaltyMm ?? NaN;
  }
}
