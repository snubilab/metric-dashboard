import type { RegressionPoint } from "../../types/engine";
import { useLang } from "../../i18n/LanguageContext";

interface RegressionPlotProps {
  readonly points: readonly RegressionPoint[];
  readonly pointsB?: readonly RegressionPoint[];
  readonly ariaLabel?: string;
  readonly onAddPoint?: (point: RegressionPoint) => void;
}

const L = {
  ko: { target: "목표값", prediction: "예측값", empty: "그래프를 클릭해 점 추가" },
  en: { target: "Target", prediction: "Prediction", empty: "Click plot to add points" },
} as const;

const WIDTH = 340;
const HEIGHT = 260;
const MARGIN = { top: 20, right: 20, bottom: 42, left: 56 };
const POINT_R = 4;

function finiteValues(points: readonly RegressionPoint[]): number[] {
  return points.flatMap((point) => [point.target, point.prediction]);
}

function domain(points: readonly RegressionPoint[], pointsB: readonly RegressionPoint[]): [number, number] {
  const values = [...finiteValues(points), ...finiteValues(pointsB)].filter(Number.isFinite);
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function scale(value: number, input: [number, number], output: [number, number]): number {
  const [inMin, inMax] = input;
  const [outMin, outMax] = output;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function unscale(value: number, input: [number, number], output: [number, number]): number {
  const [outMin, outMax] = output;
  const [inMin, inMax] = input;
  return inMin + ((value - outMin) / (outMax - outMin)) * (inMax - inMin);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function PointLayer({
  points,
  color,
  input,
}: {
  readonly points: readonly RegressionPoint[];
  readonly color: string;
  readonly input: [number, number];
}) {
  const x = (value: number) => scale(value, input, [MARGIN.left, WIDTH - MARGIN.right]);
  const y = (value: number) => scale(value, input, [HEIGHT - MARGIN.bottom, MARGIN.top]);
  return (
    <>
      {points.map((point, index) => (
        <circle
          key={`${point.target}-${point.prediction}-${index}`}
          cx={x(point.target)}
          cy={y(point.prediction)}
          r={POINT_R}
          fill={color}
          fillOpacity={0.78}
        />
      ))}
    </>
  );
}

export function RegressionPlot({ points, pointsB = [], ariaLabel, onAddPoint }: RegressionPlotProps) {
  const { lang } = useLang();
  const t = L[lang];
  const d = domain(points, pointsB);
  const x = (value: number) => scale(value, d, [MARGIN.left, WIDTH - MARGIN.right]);
  const y = (value: number) => scale(value, d, [HEIGHT - MARGIN.bottom, MARGIN.top]);
  const ticks = [d[0], (d[0] + d[1]) / 2, d[1]];
  const isInteractive = onAddPoint !== undefined;

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>): void {
    if (!onAddPoint) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const svgY = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    const plotX = clamp(svgX, MARGIN.left, WIDTH - MARGIN.right);
    const plotY = clamp(svgY, MARGIN.top, HEIGHT - MARGIN.bottom);
    onAddPoint({
      target: unscale(plotX, d, [MARGIN.left, WIDTH - MARGIN.right]),
      prediction: unscale(plotY, d, [HEIGHT - MARGIN.bottom, MARGIN.top]),
    });
  }

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={ariaLabel ?? `${t.target} ${t.prediction}`}
      onPointerDown={handlePointerDown}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", cursor: isInteractive ? "crosshair" : "default" }}
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--c-surface-2)" rx={8} />
      <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={HEIGHT - MARGIN.bottom} stroke="var(--c-border)" />
      <line x1={MARGIN.left} y1={HEIGHT - MARGIN.bottom} x2={WIDTH - MARGIN.right} y2={HEIGHT - MARGIN.bottom} stroke="var(--c-border)" />
      <line
        x1={x(d[0])}
        y1={y(d[0])}
        x2={x(d[1])}
        y2={y(d[1])}
        stroke="var(--c-gt)"
        strokeDasharray="4 4"
        strokeWidth={2}
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <text x={x(tick)} y={HEIGHT - 22} textAnchor="middle" fill="var(--c-text-dim)">
            {tick.toFixed(1)}
          </text>
          <text x={MARGIN.left - 8} y={y(tick) + 3} textAnchor="end" fill="var(--c-text-dim)">
            {tick.toFixed(1)}
          </text>
        </g>
      ))}
      <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" fill="var(--c-text)">
        {t.target}
      </text>
      <text
        x={18}
        y={HEIGHT / 2}
        textAnchor="middle"
        fill="var(--c-text)"
        transform={`rotate(-90 18 ${HEIGHT / 2})`}
      >
        {t.prediction}
      </text>
      {points.length === 0 && pointsB.length === 0 ? (
        <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fill="var(--c-text-dim)">
          {t.empty}
        </text>
      ) : null}
      <PointLayer points={points} color="var(--c-pred-a)" input={d} />
      <PointLayer points={pointsB} color="var(--c-pred-b)" input={d} />
    </svg>
  );
}
