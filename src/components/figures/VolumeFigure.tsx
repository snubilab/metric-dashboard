/**
 * VolumeFigure — one static example of a volume / area difference.
 *
 * Two filled blobs of clearly different size sit side by side (GT vs
 * prediction). A delta indicator between them flags the volume gap that the
 * metric reports. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "부피 예시: 크기가 다른 두 영역과 차이 표시",
    gt: "정답(GT)",
    pred: "예측 (더 작음)",
    delta: "Δ 부피",
    caption: "부피 차이 = |GT − 예측|",
  },
  en: {
    aria: "Volume example: two regions of different size with a difference indicator",
    gt: "GT",
    pred: "Pred (smaller)",
    delta: "Δ volume",
    caption: "Volume diff = |GT − pred|",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const CY = 76;
const GT_CX = 92;
const GT_R = 50;
const PRED_CX = 224;
const PRED_R = 32;

export default function VolumeFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const arrowId = "vol-arrow";

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
        <marker id={arrowId} markerWidth={8} markerHeight={8} refX={4} refY={4} orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--c-text-dim)" />
        </marker>
      </defs>

      {/* Larger GT blob */}
      <circle cx={GT_CX} cy={CY} r={GT_R} fill="var(--c-gt)" fillOpacity={0.4} stroke="var(--c-gt)" strokeWidth={2} />
      {/* Smaller prediction blob */}
      <circle
        cx={PRED_CX}
        cy={CY}
        r={PRED_R}
        fill="var(--c-pred-a)"
        fillOpacity={0.4}
        stroke="var(--c-pred-a)"
        strokeWidth={2}
      />

      {/* Delta indicator: a double-headed arrow spanning the radius difference */}
      <line
        x1={GT_CX + GT_R + 6}
        y1={CY}
        x2={PRED_CX - PRED_R - 6}
        y2={CY}
        stroke="var(--c-text-dim)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        markerStart={`url(#${arrowId})`}
        markerEnd={`url(#${arrowId})`}
      />
      <text x={(GT_CX + GT_R + PRED_CX - PRED_R) / 2} y={CY - 8} fill="var(--c-warn)" textAnchor="middle">
        {t.delta}
      </text>

      {/* Labels */}
      <text x={GT_CX} y={CY + GT_R + 18} fill="var(--c-gt)" textAnchor="middle">
        {t.gt}
      </text>
      <text x={PRED_CX} y={CY + PRED_R + 18} fill="var(--c-pred-a)" textAnchor="middle">
        {t.pred}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 8} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
