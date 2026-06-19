import type { MetricRow } from "./types";

/** Outcome of comparing prediction A against prediction B for one metric. */
export type Winner = "A" | "B" | "tie";

/** Per-row disagreement flags relative to the reference (first) row. */
export interface Disagreement {
  key: string;
  /** Winner differs from the reference row's winner. */
  rankFlip: boolean;
  /** Relative gap between A and B exceeds the large-gap threshold. */
  largeGap: boolean;
}

/** Small epsilon guarding against division by zero in the relative gap. */
const EPS = 1e-9;

/** Relative gap above this fraction is considered a large disagreement. */
const LARGE_GAP_THRESHOLD = 0.5;

/**
 * Decide which prediction wins a metric row, honoring its direction.
 *
 * @param row - The metric row to judge.
 * @returns "A" or "B" for the better value, or "tie" when equal.
 */
export function winner(row: MetricRow): Winner {
  if (row.a === row.b) {
    return "tie";
  }
  const aBetter = row.higherIsBetter ? row.a > row.b : row.a < row.b;
  return aBetter ? "A" : "B";
}

/**
 * Relative gap between the two values: |a - b| / max(|a|, |b|, eps).
 *
 * @param row - The metric row to measure.
 * @returns A non-negative fraction.
 */
function relativeGap(row: MetricRow): number {
  return Math.abs(row.a - row.b) / Math.max(Math.abs(row.a), Math.abs(row.b), EPS);
}

/**
 * Detect cross-metric disagreements within a set of comparison rows.
 *
 * Rank flips are measured relative to the first (reference) row, conventionally
 * Dice: a row flips when its winner differs from the reference winner. A large
 * gap is a relative gap exceeding {@link LARGE_GAP_THRESHOLD}. Pure function.
 *
 * @param rows - Metric rows to analyze.
 * @returns One disagreement record per input row, in the same order.
 */
export function detectDisagreements(rows: MetricRow[]): Disagreement[] {
  if (rows.length === 0) {
    return [];
  }
  const referenceWinner = winner(rows[0]);
  return rows.map((row) => {
    const rowWinner = winner(row);
    const rankFlip = rowWinner !== "tie" && referenceWinner !== "tie" && rowWinner !== referenceWinner;
    return {
      key: row.key,
      rankFlip,
      largeGap: relativeGap(row) > LARGE_GAP_THRESHOLD,
    };
  });
}
