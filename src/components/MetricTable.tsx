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
import type { Lang } from "../i18n/LanguageContext";
import { AnimatedMetric } from "./AnimatedMetric";
import { detectDisagreements, winner } from "./metrics/detectDisagreements";
import type { Disagreement, Winner } from "./metrics/detectDisagreements";
import { localizedMetricLabel } from "./metrics/metricLabel";
import { metricMeaning } from "./metrics/metricMeaning";
import type { MetricRow } from "./metrics/types";

const L = {
  ko: {
    metric: "지표",
    predictionA: "예측 A",
    predictionB: "예측 B",
    rankingDisagreement: "순위 불일치",
    disagreementMarker: "지표 순위 불일치",
    higherIsBetter: "높을수록 우세",
    lowerIsBetter: "낮을수록 우세",
    boldLegend: "굵게 = 해당 지표에서 앞섬",
    leadsA: "A 우세",
    leadsB: "B 우세",
    tie: "대등",
    notComparable: "비교 불가",
  },
  en: {
    metric: "Metric",
    predictionA: "Prediction A",
    predictionB: "Prediction B",
    rankingDisagreement: "Ranking disagreement",
    disagreementMarker: "metric ranking disagreement",
    higherIsBetter: "higher value leads",
    lowerIsBetter: "lower value leads",
    boldLegend: "Bold = leads on this metric",
    leadsA: "A leads",
    leadsB: "B leads",
    tie: "tie",
    notComparable: "n/a",
  },
} as const;

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
  /**
   * When true, each row gains a relative "leads" chip (A 우세 / B 우세 / 비슷 /
   * 비교 불가) and a plain-language meaning caption. The chip is colored to the
   * leading prediction, not a quality grade. Defaults to false so the shared
   * ScenariosView consumer renders unchanged.
   */
  showRelativeCue?: boolean;
  /**
   * When true, each A/B value cell draws a proportional tinted bar behind the
   * number (length = |value| / max(|a|,|b|) within the row, A in Pred-A, B in
   * Pred-B) — folding the per-metric bar comparison INTO the table instead of a
   * separate chart. Defaults to false so other consumers render a plain table.
   */
  showBars?: boolean;
}

/** Smallest denominator so an all-zero row doesn't divide by zero. */
const BAR_EPS = 1e-9;

/** A value cell's in-row bar fraction (0..1), guarding non-finite values. */
function barFraction(value: number, a: number, b: number): number {
  if (!Number.isFinite(value)) return 0;
  const fa = Number.isFinite(a) ? Math.abs(a) : 0;
  const fb = Number.isFinite(b) ? Math.abs(b) : 0;
  const denom = Math.max(fa, fb, BAR_EPS);
  return Math.min(Math.abs(value) / denom, 1);
}

/** Which prediction leads a row, or "na" when a value is non-finite. */
type Lead = Winner | "na";

/** A relative-cue chip's localized label and its token color. */
interface RelativeCue {
  label: string;
  color: string;
}

/**
 * The relative lead for a row, guarding against non-finite values so a NaN never
 * produces a misleading winner. {@link winner} only reports "tie" on equality,
 * so NaN must be detected up front.
 */
function relativeLead(row: MetricRow): Lead {
  if (!Number.isFinite(row.a) || !Number.isFinite(row.b)) {
    return "na";
  }
  return winner(row);
}

/** The localized chip text + token color for a relative lead. */
function relativeCue(lead: Lead, t: (typeof L)[Lang]): RelativeCue {
  switch (lead) {
    case "A":
      return { label: t.leadsA, color: "var(--c-pred-a-text)" };
    case "B":
      return { label: t.leadsB, color: "var(--c-pred-b-text)" };
    case "tie":
      return { label: t.tie, color: "var(--c-text-dim)" };
    default:
      return { label: t.notComparable, color: "var(--c-text-dim)" };
  }
}

const chipStyle = (color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  marginLeft: "var(--space-2)",
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-sm)",
  border: `1px solid ${color}`,
  color,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  lineHeight: 1.6,
});

const meaningStyle: React.CSSProperties = {
  marginTop: "var(--space-1)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  fontWeight: 400,
  color: "var(--c-text-dim)",
  whiteSpace: "normal",
};

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
  color: "var(--c-warn-text)",
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

/** A value cell's number drawn over a proportional, tinted in-row bar. */
function ValueWithBar({
  value,
  unit,
  color,
  fraction,
}: {
  value: number;
  unit?: string;
  color: string;
  fraction: number;
}) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        justifyContent: "flex-end",
        alignItems: "center",
        minWidth: "100%",
      }}
    >
      {fraction > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "1.1em",
            width: `${fraction * 100}%`,
            background: color,
            opacity: 0.2,
            borderRadius: "var(--radius-sm)",
          }}
        />
      )}
      <span style={{ position: "relative" }}>
        <AnimatedMetric value={value} unit={unit} decimals={DECIMALS} size="sm" />
      </span>
    </span>
  );
}

export function MetricTable({
  rows,
  showRelativeCue = false,
  showBars = false,
}: MetricTableProps) {
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
            <th scope="col" style={valueHeadCell("var(--c-pred-a-text)")}>
              A
            </th>
            <th scope="col" style={valueHeadCell("var(--c-pred-b-text)")}>
              B
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowWinner = winner(row);
            const flagged = isFlagged(disagreements[index]);
            const cue = showRelativeCue ? relativeCue(relativeLead(row), t) : null;
            const meaning = showRelativeCue ? metricMeaning(row.key, lang) : "";
            return (
              <tr
                key={row.key}
                style={{
                  borderBottom: "1px solid var(--c-border)",
                  borderLeft: flagged ? "3px solid var(--c-warn)" : "3px solid transparent",
                }}
              >
                <th scope="row" style={metricCellStyle}>
                  {localizedMetricLabel(row.key, row.label, lang)}
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
                  {cue && <span style={chipStyle(cue.color)}>{cue.label}</span>}
                  {meaning && <div style={meaningStyle}>{meaning}</div>}
                </th>
                <td style={valueCellStyle("A", rowWinner, flagged)}>
                  {showBars ? (
                    <ValueWithBar
                      value={row.a}
                      unit={row.unit}
                      color="var(--c-pred-a)"
                      fraction={barFraction(row.a, row.a, row.b)}
                    />
                  ) : (
                    <AnimatedMetric value={row.a} unit={row.unit} decimals={DECIMALS} size="sm" />
                  )}
                </td>
                <td style={valueCellStyle("B", rowWinner, flagged)}>
                  {showBars ? (
                    <ValueWithBar
                      value={row.b}
                      unit={row.unit}
                      color="var(--c-pred-b)"
                      fraction={barFraction(row.b, row.a, row.b)}
                    />
                  ) : (
                    <AnimatedMetric value={row.b} unit={row.unit} decimals={DECIMALS} size="sm" />
                  )}
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
