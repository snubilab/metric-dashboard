/**
 * Dice-vs-IoU relation plot, rendered as a dependency-free SVG.
 *
 * Plots the closed-form relation Dice = 2*IoU / (1 + IoU) across IoU in [0, 1]
 * in the Pred-A color, with an optional dot at the current IoU in the warn
 * color. Both axes span the [0, 1] unit interval.
 */

import { linearScale, niceTicks } from "./scale";

interface RelationPlotProps {
  /** Optional current IoU in [0, 1]; highlighted with a dot. */
  current?: number;
  /** Total SVG width in px. */
  width?: number;
  /** Total SVG height in px. */
  height?: number;
}

const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };
const TICK_COUNT = 5;
const AXIS_TICK_LENGTH = 4;
const CURVE_SAMPLES = 64;

/** The closed-form Dice score implied by an IoU value. */
function diceFromIou(iou: number): number {
  return (2 * iou) / (1 + iou);
}

export function RelationPlot({
  current,
  width = 320,
  height = 280,
}: RelationPlotProps) {
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const x = linearScale([0, 1], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
  const ticks = niceTicks(0, 1, TICK_COUNT);

  const curve: string[] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i += 1) {
    const iou = i / CURVE_SAMPLES;
    curve.push(`${x(iou)},${y(diceFromIou(iou))}`);
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Dice versus IoU relation"
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

      {/* Relation curve */}
      <polyline
        data-series="relation"
        points={curve.join(" ")}
        fill="none"
        stroke="var(--c-pred-a)"
        strokeWidth={2}
      />

      {/* Optional current-value dot */}
      {current !== undefined && (
        <circle
          data-role="current-point"
          cx={x(current)}
          cy={y(diceFromIou(current))}
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
        IoU
      </text>
      <text
        x={12}
        y={MARGIN.top + plotH / 2}
        textAnchor="middle"
        fill="var(--c-text)"
        transform={`rotate(-90 12 ${MARGIN.top + plotH / 2})`}
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Dice
      </text>
    </svg>
  );
}

export default RelationPlot;
