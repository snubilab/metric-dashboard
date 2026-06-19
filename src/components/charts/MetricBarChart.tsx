/**
 * MetricBarChart — a dependency-free SVG horizontal bar chart comparing
 * predictions A and B across a set of metrics.
 *
 * Each metric occupies one row with two bars (A in Pred-A, B in Pred-B). Bars
 * are normalized WITHIN their row — length = |value| / max(|a|, |b|, eps) — so
 * metrics on different scales (0-1 ratios vs. mm distances) compare fairly per
 * row rather than against each other. Raw values are printed at the bar ends in
 * the mono font; a ↑/↓ glyph marks whether higher is better. Rows flagged by
 * {@link detectDisagreements} get a warn accent. A small A/B legend sits on top.
 *
 * All visual values come from design tokens; the chart hardcodes no colors.
 */

import type { MetricRow } from "../metrics/types";
import { detectDisagreements } from "../metrics/detectDisagreements";
import { localizedMetricLabel } from "../metrics/metricLabel";
import { useLang } from "../../i18n/LanguageContext";

interface MetricBarChartProps {
  rows: MetricRow[];
  /** Total SVG width in px. */
  width?: number;
}

const L = {
  ko: {
    chartLabel: "지표별 A 대 B 막대 비교",
    legend: "A 대 B",
    higherBetter: "↑ 높을수록 좋음",
    lowerBetter: "↓ 낮을수록 좋음",
  },
  en: {
    chartLabel: "Per-metric A vs B bar comparison",
    legend: "A vs B",
    higherBetter: "↑ higher is better",
    lowerBetter: "↓ lower is better",
  },
} as const;

const EPS = 1e-9;
const LABEL_W = 96;
const VALUE_W = 96;
const ROW_H = 40;
const BAR_H = 12;
const BAR_GAP = 4;
const TOP_PAD = 36;
const SIDE_PAD = 12;
const SWATCH = 10;

/** Format a raw value with its optional unit for the mono end-label. */
function formatValue(row: MetricRow, value: number): string {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return row.unit ? `${text} ${row.unit}` : text;
}

export function MetricBarChart({ rows, width = 420 }: MetricBarChartProps) {
  const { lang } = useLang();
  const t = L[lang];

  const flags = detectDisagreements(rows);
  const flaggedKeys = new Set(
    flags.filter((f) => f.rankFlip || f.largeGap).map((f) => f.key),
  );

  const plotX = LABEL_W + SIDE_PAD;
  const plotW = Math.max(width - LABEL_W - VALUE_W - SIDE_PAD * 2, 1);
  const height = TOP_PAD + rows.length * ROW_H;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t.chartLabel}
      style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}
    >
      {/* Legend */}
      <g data-role="legend">
        <rect x={SIDE_PAD} y={10} width={SWATCH} height={SWATCH} fill="var(--c-pred-a)" />
        <text x={SIDE_PAD + SWATCH + 4} y={10 + SWATCH} fill="var(--c-text)">
          A
        </text>
        <rect x={SIDE_PAD + 36} y={10} width={SWATCH} height={SWATCH} fill="var(--c-pred-b)" />
        <text x={SIDE_PAD + 36 + SWATCH + 4} y={10 + SWATCH} fill="var(--c-text)">
          B
        </text>
        <text x={SIDE_PAD + 84} y={10 + SWATCH} fill="var(--c-text-dim)">
          {t.legend}
        </text>
      </g>

      {rows.map((row, index) => {
        const rowTop = TOP_PAD + index * ROW_H;
        const denom = Math.max(Math.abs(row.a), Math.abs(row.b), EPS);
        const aLen = (Math.abs(row.a) / denom) * plotW;
        const bLen = (Math.abs(row.b) / denom) * plotW;
        const flagged = flaggedKeys.has(row.key);
        const labelColor = flagged ? "var(--c-warn)" : "var(--c-text)";
        const aTop = rowTop;
        const bTop = rowTop + BAR_H + BAR_GAP;
        const dirGlyph = row.higherIsBetter ? "↑" : "↓";

        return (
          <g key={row.key} data-role="metric-row" data-flagged={flagged}>
            {/* Row label + direction glyph */}
            <text
              x={SIDE_PAD}
              y={rowTop + BAR_H}
              fill={labelColor}
              style={{ fontWeight: flagged ? 600 : 400 }}
            >
              {localizedMetricLabel(row.key, row.label, lang)}
            </text>
            <text
              x={SIDE_PAD}
              y={rowTop + BAR_H + BAR_GAP + BAR_H}
              fill="var(--c-text-dim)"
              aria-label={row.higherIsBetter ? t.higherBetter : t.lowerBetter}
            >
              {dirGlyph}
            </text>

            {/* A bar */}
            <rect
              data-series="a"
              x={plotX}
              y={aTop}
              width={aLen}
              height={BAR_H}
              fill="var(--c-pred-a)"
              stroke={flagged ? "var(--c-warn)" : "none"}
              strokeWidth={flagged ? 1 : 0}
              rx={2}
            />
            <text
              x={plotX + plotW + 6}
              y={aTop + BAR_H - 2}
              fill="var(--c-text)"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {formatValue(row, row.a)}
            </text>

            {/* B bar */}
            <rect
              data-series="b"
              x={plotX}
              y={bTop}
              width={bLen}
              height={BAR_H}
              fill="var(--c-pred-b)"
              stroke={flagged ? "var(--c-warn)" : "none"}
              strokeWidth={flagged ? 1 : 0}
              rx={2}
            />
            <text
              x={plotX + plotW + 6}
              y={bTop + BAR_H - 2}
              fill="var(--c-text)"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {formatValue(row, row.b)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default MetricBarChart;
