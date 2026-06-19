/**
 * Free-response ROC (FROC) curve, rendered as a dependency-free SVG.
 *
 * The x-axis is a base-10 log scale of false positives per scan; the y-axis is
 * sensitivity on [0, 1]. The curve draws in the GT color. Operating points
 * (default: the LUNA16 set) are drawn as vertical guide ticks.
 */

import { linearScale, logScale } from "./scale";

/** A single point on a FROC curve. */
export interface FROCPoint {
  fpPerScan: number;
  sensitivity: number;
}

interface FROCCurveProps {
  /** The FROC samples, in ascending false-positive order. */
  points: FROCPoint[];
  /** False-positive rates to mark as vertical guides. Defaults to LUNA16. */
  operatingPoints?: number[];
  /** Total SVG width in px. */
  width?: number;
  /** Total SVG height in px. */
  height?: number;
}

/** The LUNA16 competition operating points (false positives per scan). */
const LUNA16_OPERATING_POINTS = [0.125, 0.25, 0.5, 1, 2, 4, 8] as const;

const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };
const AXIS_TICK_LENGTH = 4;
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

function formatFp(fp: number): string {
  return fp < 1 ? String(fp) : String(Math.round(fp));
}

export function FROCCurve({
  points,
  operatingPoints = [...LUNA16_OPERATING_POINTS],
  width = 320,
  height = 280,
}: FROCCurveProps) {
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;

  // Log x-domain spans the operating points so guides always sit inside.
  const fpMin = Math.min(...operatingPoints);
  const fpMax = Math.max(...operatingPoints);
  const x = logScale([fpMin, fpMax], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);

  // Clamp into the log domain: fpPerScan of 0 would map to -Infinity (log of 0),
  // and values beyond the axis would fall outside the plot. Points at or below
  // fpMin sit on the left axis; points above fpMax sit on the right axis.
  const clampFp = (fp: number) => Math.min(Math.max(fp, fpMin), fpMax);

  const curvePoints = points
    .map((p) => `${x(clampFp(p.fpPerScan))},${y(p.sensitivity)}`)
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="FROC curve"
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      {/* Axes frame */}
      <line
        x1={MARGIN.left}
        y1={MARGIN.top}
        x2={MARGIN.left}
        y2={MARGIN.top + plotH}
        stroke="var(--c-border)"
      />
      <line
        x1={MARGIN.left}
        y1={MARGIN.top + plotH}
        x2={MARGIN.left + plotW}
        y2={MARGIN.top + plotH}
        stroke="var(--c-border)"
      />

      {/* Y ticks + labels */}
      {Y_TICKS.map((t) => (
        <g key={`y-${t}`}>
          <line
            x1={MARGIN.left - AXIS_TICK_LENGTH}
            y1={y(t)}
            x2={MARGIN.left}
            y2={y(t)}
            stroke="var(--c-border)"
          />
          <text
            x={MARGIN.left - AXIS_TICK_LENGTH - 4}
            y={y(t) + 3}
            textAnchor="end"
            fill="var(--c-text-dim)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* Operating-point vertical guides + log x labels */}
      {operatingPoints.map((fp) => (
        <g key={`op-${fp}`}>
          <line
            data-role="operating-point-marker"
            x1={x(fp)}
            y1={MARGIN.top}
            x2={x(fp)}
            y2={MARGIN.top + plotH}
            stroke="var(--c-border)"
            strokeDasharray="2 4"
          />
          <text
            x={x(fp)}
            y={MARGIN.top + plotH + AXIS_TICK_LENGTH + 12}
            textAnchor="middle"
            fill="var(--c-text-dim)"
          >
            {formatFp(fp)}
          </text>
        </g>
      ))}

      {/* FROC curve */}
      <polyline
        data-series="froc"
        points={curvePoints}
        fill="none"
        stroke="var(--c-gt)"
        strokeWidth={2}
      />

      {/* Axis labels */}
      <text
        x={MARGIN.left + plotW / 2}
        y={height - 6}
        textAnchor="middle"
        fill="var(--c-text)"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        False positives per scan
      </text>
      <text
        x={12}
        y={MARGIN.top + plotH / 2}
        textAnchor="middle"
        fill="var(--c-text)"
        transform={`rotate(-90 12 ${MARGIN.top + plotH / 2})`}
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Sensitivity
      </text>
    </svg>
  );
}

export default FROCCurve;
