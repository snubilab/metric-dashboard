/**
 * DetectionMetricTable — a read-only, bilingual `Metric | Value` summary of one
 * detection scene (ground truth vs. a single prediction set).
 *
 * Unlike segmentation's `MetricTable`, detection compares ground truth against a
 * single prediction set, so there is no A/B; the table is two columns. The count
 * rows (TP/FP/FN) and precision/recall/F1 track the operating confidence
 * threshold; AP50 and AP@[.5:.95] integrate the whole curve and so use ALL
 * predictions regardless of the threshold.
 *
 * Cell/header/legend styling mirrors `MetricTable` (token-based, metric label
 * left, value right, mono numerals). A legend below explains the box colors used
 * by `DetectionScenePreview`. No absolute good/bad grade words appear.
 *
 * All visual values come from the design-system token custom properties.
 */

import { useLang } from "../i18n/LanguageContext";
import type { DetBox } from "../types/engine";
import {
  averagePrecision,
  averagePrecisionRange,
  matchDetections,
  prCurve,
} from "../engine/metrics/detection";

export interface DetectionMetricTableProps {
  /** Ground-truth objects (no confidence). */
  gt: DetBox[];
  /** Predicted boxes with confidences. */
  preds: DetBox[];
  /** IoU threshold for a match; defaults to 0.5. */
  iouThreshold?: number;
  /** Operating confidence threshold; defaults to 0 (every prediction counts). */
  threshold?: number;
}

const L = {
  ko: {
    metric: "지표",
    value: "값",
    tp: "참양성 (TP)",
    fp: "위양성 (FP)",
    fn: "위음성 (FN)",
    precision: "정밀도",
    recall: "재현율",
    f1: "F1",
    ap50: "AP50",
    apRange: "AP@[.5:.95]",
    legendMatched: "정답 · 일치",
    legendFp: "위양성",
    legendMissed: "놓침",
  },
  en: {
    metric: "Metric",
    value: "Value",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    precision: "Precision",
    recall: "Recall",
    f1: "F1",
    ap50: "AP50",
    apRange: "AP@[.5:.95]",
    legendMatched: "GT · matched",
    legendFp: "false positive",
    legendMissed: "missed",
  },
} as const;

/** AP interpolation used for the AP50 / AP-range rows. */
const AP_METHOD = "coco101" as const;

/** Decimal places for the count, ratio, and AP rows respectively. */
const COUNT_DP = 0;
const RATIO_DP = 2;
const AP_DP = 3;

/** Predictions whose confidence clears the operating threshold. */
function aboveThreshold(preds: DetBox[], threshold: number): DetBox[] {
  return preds.filter((p) => (p.confidence ?? 0) >= threshold);
}

/** F1 of a precision/recall pair; 0 when both are 0 (guards divide-by-zero). */
function f1Score(precision: number, recall: number): number {
  const denom = precision + recall;
  return denom === 0 ? 0 : (2 * precision * recall) / denom;
}

/** A single rendered row: localized label, formatted value, and a stable key. */
interface Row {
  key: string;
  label: string;
  value: string;
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const headCellBase: React.CSSProperties = {
  textAlign: "left",
  padding: "var(--space-2) var(--space-3)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
  borderBottom: "1px solid var(--c-border)",
};

const valueHeadCell: React.CSSProperties = {
  ...headCellBase,
  textAlign: "right",
};

const metricCellStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  whiteSpace: "nowrap",
};

const valueCellStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  textAlign: "right",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  fontVariantNumeric: "tabular-nums",
  color: "var(--c-text)",
};

const legendStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-4)",
  marginTop: "var(--space-3)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const legendItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
};

const swatchStyle = (color: string): React.CSSProperties => ({
  width: "var(--space-3)",
  height: "var(--space-3)",
  borderRadius: "var(--radius-sm)",
  background: color,
  flex: "0 0 auto",
});

export function DetectionMetricTable({
  gt,
  preds,
  iouThreshold = 0.5,
  threshold = 0,
}: DetectionMetricTableProps) {
  const { lang } = useLang();
  const t = L[lang];

  // Count-based rows track the operating threshold (same filter as the panel).
  const thresholded = aboveThreshold(preds, threshold);
  const counts = matchDetections(thresholded, gt, { iouThreshold });
  const precision = counts.tp + counts.fp === 0 ? 0 : counts.tp / (counts.tp + counts.fp);
  const recall = gt.length === 0 ? 0 : counts.tp / gt.length;
  const f1 = f1Score(precision, recall);

  // AP rows integrate the whole curve, so they use ALL predictions.
  const ap50 = averagePrecision(prCurve(preds, gt, 0.5), AP_METHOD);
  const apRange = averagePrecisionRange(preds, gt, AP_METHOD);

  const rows: Row[] = [
    { key: "tp", label: t.tp, value: counts.tp.toFixed(COUNT_DP) },
    { key: "fp", label: t.fp, value: counts.fp.toFixed(COUNT_DP) },
    { key: "fn", label: t.fn, value: counts.fn.toFixed(COUNT_DP) },
    { key: "precision", label: t.precision, value: precision.toFixed(RATIO_DP) },
    { key: "recall", label: t.recall, value: recall.toFixed(RATIO_DP) },
    { key: "f1", label: t.f1, value: f1.toFixed(RATIO_DP) },
    { key: "ap50", label: t.ap50, value: ap50.toFixed(AP_DP) },
    { key: "apRange", label: t.apRange, value: apRange.toFixed(AP_DP) },
  ];

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th scope="col" style={headCellBase}>
                {t.metric}
              </th>
              <th scope="col" style={valueHeadCell}>
                {t.value}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} style={{ borderBottom: "1px solid var(--c-border)" }}>
                <th scope="row" style={metricCellStyle}>
                  {row.label}
                </th>
                <td data-metric={row.key} style={valueCellStyle}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={legendStyle}>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-gt-text)")} />
          {t.legendMatched}
        </span>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-warn-text)")} />
          {t.legendFp}
        </span>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-text-dim)")} />
          {t.legendMissed}
        </span>
      </div>
    </div>
  );
}

export default DetectionMetricTable;
