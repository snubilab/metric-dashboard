/**
 * MetricTable — a per-metric comparison of predictions A and B.
 *
 * One row per metric, three columns: Metric | A | B. The A / B headers carry the
 * Okabe-Ito prediction colors so the column allegiance is unambiguous everywhere
 * the same tokens appear (canvas, charts, legends). Each value cell delegates to
 * {@link AnimatedMetric} so numerals tween and stay tabular-aligned.
 *
 * The side that wins a row (per {@link winner}) gets a subtle left-border accent
 * in its prediction color. Rows whose ranking disagrees with the reference metric
 * (a rank flip) or whose A/B gap is large are marked with a warn badge and a warn
 * left border, surfacing the cases where "which model is better" depends on which
 * metric you trust.
 *
 * All visual values come from the design-system token custom properties.
 */

import { useLang } from "../i18n/LanguageContext";
import { AnimatedMetric } from "./AnimatedMetric";
import { detectDisagreements, winner } from "./metrics/detectDisagreements";
import type { Disagreement, Winner } from "./metrics/detectDisagreements";
import type { MetricRow } from "./metrics/types";

const L = {
  ko: {
    metric: "지표",
    predictionA: "예측 A",
    predictionB: "예측 B",
    rankingDisagreement: "순위 불일치",
    disagreementMarker: "지표 순위 불일치",
    higherIsBetter: "높을수록 좋음",
    lowerIsBetter: "낮을수록 좋음",
    boldLegend: "굵게 = 해당 지표에서 더 우수",
  },
  en: {
    metric: "Metric",
    predictionA: "Prediction A",
    predictionB: "Prediction B",
    rankingDisagreement: "Ranking disagreement",
    disagreementMarker: "metric ranking disagreement",
    higherIsBetter: "higher is better",
    lowerIsBetter: "lower is better",
    boldLegend: "Bold = better on this metric",
  },
} as const;

/**
 * Korean labels for metric rows, keyed by MetricRow.key. Acronyms / proper-noun
 * metric names (Dice, IoU, HD95, ASSD) are intentionally kept as-is; only the
 * worded metric names are localized. Unknown keys fall back to row.label.
 */
const KO_METRIC_LABELS: Record<string, string> = {
  sensitivity: "민감도",
  precision: "정밀도",
  nsd: "표면 Dice (NSD)",
  surfaceDice: "표면 Dice (NSD)",
  volRel: "상대 부피차",
  volumeDiff: "상대 부피차",
};

/** Decimal places used for every value cell; metrics here read naturally at 2 dp. */
const DECIMALS = 2;

/** Marker glyph for a flagged row (NOT an emoji). */
const WARN_GLYPH = "△"; // △ WHITE UP-POINTING TRIANGLE

/** Direction glyphs: ↑ when higher is better, ↓ when lower is better. */
const DIRECTION_UP_GLYPH = "↑"; // ↑ UPWARDS ARROW
const DIRECTION_DOWN_GLYPH = "↓"; // ↓ DOWNWARDS ARROW

interface MetricTableProps {
  /** Comparison rows; the first row is the reference for rank-flip detection. */
  rows: MetricRow[];
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

const valueHeadCell = (color: string): React.CSSProperties => ({
  ...headCellBase,
  textAlign: "right",
  color,
});

const metricCellStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  whiteSpace: "nowrap",
};

const valueCellBase: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  textAlign: "right",
};

const directionStyle: React.CSSProperties = {
  marginLeft: "var(--space-1)",
  color: "var(--c-text-dim)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
};

const markerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-1)",
  marginLeft: "var(--space-2)",
  padding: "0 var(--space-1)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--c-warn)",
  color: "var(--c-warn)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  lineHeight: 1.4,
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

/** True when this row should carry the warn marker / border. */
function isFlagged(disagreement: Disagreement): boolean {
  return disagreement.rankFlip || disagreement.largeGap;
}

/** Left-border accent for a value cell: warn when flagged, else the winner's color. */
function valueCellAccent(side: Winner, rowWinner: Winner, flagged: boolean): string {
  if (flagged && side === rowWinner) {
    return "var(--c-warn)";
  }
  if (side === rowWinner) {
    return side === "A" ? "var(--c-pred-a)" : "var(--c-pred-b)";
  }
  return "transparent";
}

function valueCellStyle(side: Winner, rowWinner: Winner, flagged: boolean): React.CSSProperties {
  const isWinner = side === rowWinner;
  return {
    ...valueCellBase,
    borderLeft: `3px solid ${valueCellAccent(side, rowWinner, flagged)}`,
    fontWeight: isWinner ? 600 : 400,
  };
}

export function MetricTable({ rows }: MetricTableProps) {
  const { lang } = useLang();
  const t = L[lang];
  const disagreements = detectDisagreements(rows);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th scope="col" style={headCellBase}>
              {t.metric}
            </th>
            <th scope="col" style={valueHeadCell("var(--c-pred-a)")}>
              A
            </th>
            <th scope="col" style={valueHeadCell("var(--c-pred-b)")}>
              B
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowWinner = winner(row);
            const flagged = isFlagged(disagreements[index]);
            return (
              <tr
                key={row.key}
                style={{
                  borderBottom: "1px solid var(--c-border)",
                  borderLeft: flagged ? "3px solid var(--c-warn)" : "3px solid transparent",
                }}
              >
                <th scope="row" style={metricCellStyle}>
                  {lang === "ko" ? KO_METRIC_LABELS[row.key] ?? row.label : row.label}
                  <span
                    style={directionStyle}
                    role="img"
                    aria-label={row.higherIsBetter ? t.higherIsBetter : t.lowerIsBetter}
                  >
                    <span aria-hidden="true">
                      {row.higherIsBetter ? DIRECTION_UP_GLYPH : DIRECTION_DOWN_GLYPH}
                    </span>
                  </span>
                  {flagged && (
                    <span
                      style={markerStyle}
                      role="img"
                      aria-label={t.disagreementMarker}
                    >
                      <span aria-hidden="true">{WARN_GLYPH}</span>
                    </span>
                  )}
                </th>
                <td style={valueCellStyle("A", rowWinner, flagged)}>
                  <AnimatedMetric value={row.a} unit={row.unit} decimals={DECIMALS} size="sm" />
                </td>
                <td style={valueCellStyle("B", rowWinner, flagged)}>
                  <AnimatedMetric value={row.b} unit={row.unit} decimals={DECIMALS} size="sm" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div style={legendStyle}>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-pred-a)")} />
          {t.predictionA}
        </span>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-pred-b)")} />
          {t.predictionB}
        </span>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-warn)")} />
          {t.rankingDisagreement}
        </span>
        <span style={legendItemStyle}>
          <span style={{ fontWeight: 600 }}>{t.boldLegend}</span>
        </span>
      </div>
    </div>
  );
}

export default MetricTable;
