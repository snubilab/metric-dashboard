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

import { AnimatedMetric } from "./AnimatedMetric";
import { detectDisagreements, winner } from "./metrics/detectDisagreements";
import type { Disagreement, Winner } from "./metrics/detectDisagreements";
import type { MetricRow } from "./metrics/types";

/** Decimal places used for every value cell; metrics here read naturally at 2 dp. */
const DECIMALS = 2;

/** Marker glyph for a flagged row (NOT an emoji). */
const WARN_GLYPH = "△"; // △ WHITE UP-POINTING TRIANGLE

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
  const disagreements = detectDisagreements(rows);

  return (
    <div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th scope="col" style={headCellBase}>
              Metric
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
                  {row.label}
                  {flagged && (
                    <span
                      style={markerStyle}
                      role="img"
                      aria-label="metric ranking disagreement"
                    >
                      <span aria-hidden="true">{WARN_GLYPH}</span>
                    </span>
                  )}
                </th>
                <td style={valueCellStyle("A", rowWinner, flagged)}>
                  <AnimatedMetric value={row.a} unit={row.unit} decimals={DECIMALS} />
                </td>
                <td style={valueCellStyle("B", rowWinner, flagged)}>
                  <AnimatedMetric value={row.b} unit={row.unit} decimals={DECIMALS} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={legendStyle}>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-pred-a)")} />
          Prediction A
        </span>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-pred-b)")} />
          Prediction B
        </span>
        <span style={legendItemStyle}>
          <span aria-hidden="true" style={swatchStyle("var(--c-warn)")} />
          Ranking disagreement
        </span>
      </div>
    </div>
  );
}

export default MetricTable;
