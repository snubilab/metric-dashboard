/**
 * DetectionBoard — the detection Playground centerpiece.
 *
 * A confidence-threshold slider sweeps an operating point along both a
 * precision-recall curve and a FROC curve. Three metric numerals make the
 * distinction concrete:
 *   - F1 *moves* with the threshold (it scores one operating point).
 *   - AP is *fixed* across the threshold (it integrates the whole curve) but
 *     switches with the interpolation method (VOC 11-point / all-points / COCO
 *     101-point).
 *   - AP@[.5:.95] averages AP across the COCO IoU sweep.
 * Live TP/FP/FN counts plus precision and recall track the current threshold.
 *
 * All visual values come from design-system tokens.
 */

import { useMemo, useState } from "react";
import type { DetBox } from "../types/engine";
import {
  type ApMethod,
  averagePrecision,
  averagePrecisionRange,
  frocCurve,
  matchDetections,
  prCurve,
} from "../engine/metrics/detection";
import { PRCurve, type PRPoint } from "./charts/PRCurve";
import { FROCCurve, type FROCPoint } from "./charts/FROCCurve";
import { AnimatedMetricBlock } from "./minisims/AnimatedMetricBlock";

export interface DetectionBoardProps {
  /** Ground-truth objects (no confidence). */
  gt: DetBox[];
  /** Predicted boxes with confidences. */
  preds: DetBox[];
  /** IoU threshold for a match. Defaults to 0.5. */
  iouThreshold?: number;
}

const AP_METHODS: { value: ApMethod; label: string }[] = [
  { value: "voc11", label: "VOC 11-point" },
  { value: "vocAll", label: "VOC all-points" },
  { value: "coco101", label: "COCO 101-point" },
];

/** Predictions whose confidence clears the operating threshold. */
function aboveThreshold(preds: DetBox[], threshold: number): DetBox[] {
  return preds.filter((p) => (p.confidence ?? 0) >= threshold);
}

function f1Score(precision: number, recall: number): number {
  const denom = precision + recall;
  return denom === 0 ? 0 : (2 * precision * recall) / denom;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

const countStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-lg)",
  color: "var(--c-text)",
};

function Count({ tone, label, value, dataCount }: {
  tone: string;
  label: string;
  value: number;
  dataCount: string;
}) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <span style={{ ...labelStyle, color: `var(${tone})` }}>{label}</span>
      <span data-count={dataCount} style={countStyle}>
        {value}
      </span>
    </span>
  );
}

export function DetectionBoard({ gt, preds, iouThreshold = 0.5 }: DetectionBoardProps) {
  const [threshold, setThreshold] = useState(0);
  const [apMethod, setApMethod] = useState<ApMethod>("coco101");

  // The full PR curve — independent of the operating threshold, so AP is fixed.
  const curve = useMemo(() => prCurve(preds, gt, iouThreshold), [preds, gt, iouThreshold]);
  const prPoints: PRPoint[] = curve.map((p) => ({ recall: p.recall, precision: p.precision }));

  // FROC treats the board as a single scan.
  const froc = useMemo(() => frocCurve([preds], [gt], iouThreshold), [preds, gt, iouThreshold]);
  const frocPoints: FROCPoint[] = froc.map((p) => ({
    fpPerScan: p.fpPerScan,
    sensitivity: p.sensitivity,
  }));

  // Live counts at the operating threshold.
  const thresholded = useMemo(() => aboveThreshold(preds, threshold), [preds, threshold]);
  const counts = useMemo(
    () => matchDetections(thresholded, gt, { iouThreshold }),
    [thresholded, gt, iouThreshold],
  );
  const recall = gt.length === 0 ? 0 : counts.tp / gt.length;
  const precision = counts.tp + counts.fp === 0 ? 0 : counts.tp / (counts.tp + counts.fp);
  const f1 = f1Score(precision, recall);

  // The operating point slides along the PR curve with the threshold.
  const prOperating: PRPoint = { recall, precision };

  const ap = useMemo(() => averagePrecision(curve, apMethod), [curve, apMethod]);
  const apRange = useMemo(
    () => averagePrecisionRange(preds, gt, apMethod),
    [preds, gt, apMethod],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        fontFamily: "var(--font-ui)",
        color: "var(--c-text)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <span style={labelStyle}>Confidence threshold</span>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              aria-label="Confidence threshold"
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", minWidth: "4ch" }}>
              {threshold.toFixed(2)}
            </span>
          </span>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <span style={labelStyle}>AP interpolation method</span>
          <select
            aria-label="AP interpolation method"
            value={apMethod}
            onChange={(e) => setApMethod(e.target.value as ApMethod)}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--c-text)",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-2)",
            }}
          >
            {AP_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)" }}>
        <AnimatedMetricBlock dataMetric="f1" label="F1 (at threshold)" value={f1} decimals={3} />
        <AnimatedMetricBlock dataMetric="ap" label="AP (fixed)" value={ap} decimals={3} />
        <AnimatedMetricBlock dataMetric="ap-range" label="AP@[.5:.95]" value={apRange} decimals={3} />
      </div>

      <div style={{ display: "flex", gap: "var(--space-8)" }}>
        <Count tone="--c-gt" label="TP" value={counts.tp} dataCount="tp" />
        <Count tone="--c-warn" label="FP" value={counts.fp} dataCount="fp" />
        <Count tone="--c-text-dim" label="FN" value={counts.fn} dataCount="fn" />
        <AnimatedMetricBlock dataMetric="precision" label="Precision (at thr.)" value={precision} decimals={2} />
        <AnimatedMetricBlock dataMetric="recall" label="Recall (at thr.)" value={recall} decimals={2} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)" }}>
        <PRCurve points={prPoints} operatingPoint={prOperating} />
        <FROCCurve points={frocPoints} />
      </div>

      <p
        style={{
          maxWidth: "52ch",
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--c-text-dim)",
        }}
      >
        The threshold slides the operating point and changes F1, precision, and
        recall — but AP integrates the whole curve, so it stays fixed as you
        slide. AP only changes when you switch the interpolation method.
      </p>
    </div>
  );
}

export default DetectionBoard;
