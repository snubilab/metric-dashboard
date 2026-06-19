/**
 * Precision-Recall curve, rendered as a dependency-free SVG.
 *
 * Both axes are fixed to the [0, 1] unit interval. The raw curve draws in the
 * Pred-A color; an optional envelope overlays as a dashed dim line; an optional
 * operating point marks a single recall/precision pair in the warn color.
 */

import { useLang } from "../../i18n/LanguageContext";
import { linearScale, niceTicks } from "./scale";

const L = {
  ko: {
    recall: "재현율",
    precision: "정밀도",
    curveLabel: "정밀도-재현율 곡선",
  },
  en: {
    recall: "Recall",
    precision: "Precision",
    curveLabel: "Precision-recall curve",
  },
} as const;

/** A single point on a precision-recall curve. */
export interface PRPoint {
  recall: number;
  precision: number;
}

interface PRCurveProps {
  /** The raw precision-recall samples, in plotting order. */
  points: PRPoint[];
  /** Optional convex/interpolated envelope drawn dashed over the raw curve. */
  envelope?: PRPoint[];
  /** Optional single operating point highlighted with a dot. */
  operatingPoint?: PRPoint;
  /** Total SVG width in px. */
  width?: number;
  /** Total SVG height in px. */
  height?: number;
}

const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };
const TICK_COUNT = 5;
const AXIS_TICK_LENGTH = 4;

function toPolylinePoints(
  pts: PRPoint[],
  x: (v: number) => number,
  y: (v: number) => number,
): string {
  return pts.map((p) => `${x(p.recall)},${y(p.precision)}`).join(" ");
}

export function PRCurve({
  points,
  envelope,
  operatingPoint,
  width = 320,
  height = 280,
}: PRCurveProps) {
  const { lang } = useLang();
  const t = L[lang];
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const x = linearScale([0, 1], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
  const ticks = niceTicks(0, 1, TICK_COUNT);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t.curveLabel}
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

      {/* Ticks + labels */}
      {ticks.map((t) => (
        <g key={`x-${t}`}>
          <line
            x1={x(t)}
            y1={MARGIN.top + plotH}
            x2={x(t)}
            y2={MARGIN.top + plotH + AXIS_TICK_LENGTH}
            stroke="var(--c-border)"
          />
          <text
            x={x(t)}
            y={MARGIN.top + plotH + AXIS_TICK_LENGTH + 12}
            textAnchor="middle"
            fill="var(--c-text-dim)"
          >
            {t}
          </text>
        </g>
      ))}
      {ticks.map((t) => (
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

      {/* Optional dashed envelope, drawn under the raw curve */}
      {envelope && envelope.length > 0 && (
        <polyline
          data-series="envelope"
          points={toPolylinePoints(envelope, x, y)}
          fill="none"
          stroke="var(--c-text-dim)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Raw precision-recall curve */}
      <polyline
        data-series="raw"
        points={toPolylinePoints(points, x, y)}
        fill="none"
        stroke="var(--c-pred-a)"
        strokeWidth={2}
      />

      {/* Optional operating point */}
      {operatingPoint && (
        <circle
          data-role="operating-point"
          cx={x(operatingPoint.recall)}
          cy={y(operatingPoint.precision)}
          r={4}
          fill="var(--c-warn)"
          stroke="var(--c-bg)"
          strokeWidth={1}
        />
      )}

      {/* Axis labels */}
      <text
        x={MARGIN.left + plotW / 2}
        y={height - 6}
        textAnchor="middle"
        fill="var(--c-text)"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {t.recall}
      </text>
      <text
        x={12}
        y={MARGIN.top + plotH / 2}
        textAnchor="middle"
        fill="var(--c-text)"
        transform={`rotate(-90 12 ${MARGIN.top + plotH / 2})`}
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {t.precision}
      </text>
    </svg>
  );
}

export default PRCurve;
