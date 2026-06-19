/**
 * SurfaceDistanceFigure — one static example of ASSD (average symmetric surface
 * distance).
 *
 * Two roughly parallel boundaries (GT + prediction) with several short arrows
 * spanning between them. ASSD averages all those boundary-to-boundary gaps,
 * unlike Hausdorff which keeps only the worst one. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "ASSD 예시: 두 경계 사이 여러 짧은 거리의 평균",
    gt: "정답(GT)",
    pred: "예측",
    caption: "ASSD = 경계 간 거리의 평균",
  },
  en: {
    aria: "ASSD example: several short boundary distances averaged together",
    gt: "GT",
    pred: "Pred",
    caption: "ASSD = average of boundary distances",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;

/** Sample x positions where a short surface-distance arrow is drawn. */
const SAMPLE_XS = [70, 110, 150, 190, 230, 262];

/** GT boundary y at a given x — a gentle curve. */
function gtY(x: number): number {
  return 70 + 16 * Math.sin((x - 50) / 60);
}

/** Prediction boundary y at a given x — offset below GT by a varying gap. */
function predY(x: number): number {
  return gtY(x) + 22 + 8 * Math.sin((x - 50) / 38);
}

function curvePoints(yAt: (x: number) => number): string {
  const pts: string[] = [];
  for (let x = 46; x <= 282; x += 8) {
    pts.push(`${x},${yAt(x).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function SurfaceDistanceFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const arrowId = "assd-arrow";

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <defs>
        <marker id={arrowId} markerWidth={7} markerHeight={7} refX={5.5} refY={3.5} orient="auto">
          <path d="M 0 0 L 7 3.5 L 0 7 z" fill="var(--c-text-dim)" />
        </marker>
      </defs>

      {/* The two boundaries */}
      <polyline points={curvePoints(gtY)} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <polyline points={curvePoints(predY)} fill="none" stroke="var(--c-pred-a)" strokeWidth={2.5} />

      {/* Several short surface-distance arrows between the boundaries */}
      {SAMPLE_XS.map((x) => (
        <line
          key={x}
          x1={x}
          y1={gtY(x) + 2}
          x2={x}
          y2={predY(x) - 2}
          stroke="var(--c-text-dim)"
          strokeWidth={1.5}
          markerEnd={`url(#${arrowId})`}
        />
      ))}

      {/* Labels */}
      <text x={50} y={gtY(50) - 8} fill="var(--c-gt)" textAnchor="start">
        {t.gt}
      </text>
      <text x={278} y={predY(278) + 16} fill="var(--c-pred-a)" textAnchor="end">
        {t.pred}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 12} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
