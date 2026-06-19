import { useMemo } from "react";
import type { EngineState } from "../../types/engine";
import type { MetricRow } from "./types";
import { computeSegMetrics, type SegMetrics } from "./computeSegMetrics";

/** Display configuration for one metric, keyed to a SegMetrics field. */
interface MetricSpec {
  key: keyof SegMetrics;
  label: string;
  higherIsBetter: boolean;
  unit?: string;
}

/**
 * Ordered metric definitions. Dice is first so it serves as the reference row
 * for rank-flip detection downstream. Distance metrics carry the "mm" unit and
 * are lower-is-better; volume difference is also lower-is-better.
 */
const METRIC_SPECS: readonly MetricSpec[] = [
  { key: "dice", label: "Dice", higherIsBetter: true },
  { key: "iou", label: "IoU", higherIsBetter: true },
  { key: "sensitivity", label: "Sensitivity", higherIsBetter: true },
  { key: "precision", label: "Precision", higherIsBetter: true },
  { key: "nsd", label: "Surface Dice", higherIsBetter: true },
  { key: "hd95", label: "HD95", higherIsBetter: false, unit: "mm" },
  { key: "assd", label: "ASSD", higherIsBetter: false, unit: "mm" },
  { key: "volRel", label: "Rel. Volume Diff", higherIsBetter: false },
];

/**
 * Compute the A-vs-B segmentation metric rows for the current engine state.
 *
 * Memoized on the engine state so re-renders that do not change inputs reuse
 * the prior result.
 *
 * @param state - The engine state to evaluate.
 * @returns The assembled comparison rows.
 */
export function useEngineMetrics(state: EngineState): { rows: MetricRow[] } {
  const rows = useMemo<MetricRow[]>(() => {
    const a = computeSegMetrics(state, "A");
    const b = computeSegMetrics(state, "B");
    return METRIC_SPECS.map((spec) => ({
      key: spec.key,
      label: spec.label,
      a: a[spec.key],
      b: b[spec.key],
      unit: spec.unit,
      higherIsBetter: spec.higherIsBetter,
    }));
  }, [state]);

  return { rows };
}
