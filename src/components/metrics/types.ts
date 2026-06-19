/**
 * A single comparable metric row across predictions A and B.
 *
 * Used by the metrics table, disagreement detection, and the engine hook.
 */
export interface MetricRow {
  /** Stable identifier (e.g. "dice", "hd95"). */
  key: string;
  /** Human-readable label for display. */
  label: string;
  /** Value for prediction A. */
  a: number;
  /** Value for prediction B. */
  b: number;
  /** Unit suffix shown next to the value (e.g. "mm"); omitted for unitless ratios. */
  unit?: string;
  /** Whether a higher value indicates a better result. */
  higherIsBetter: boolean;
}
