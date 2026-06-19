/**
 * DiceFigure — one static example of the Dice (F1) overlap idea.
 *
 * Two overlapping circles (ground truth + prediction); the lens-shaped
 * intersection is shaded to make the shared region obvious. A small mono
 * caption states Dice = 2·intersection / (GT + pred). Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "Dice 예시: 겹치는 두 원과 교집합 영역",
    gt: "정답(GT)",
    pred: "예측",
    caption: "Dice = 2·교집합 / (GT + 예측)",
  },
  en: {
    aria: "Dice example: two overlapping circles with the intersection shaded",
    gt: "GT",
    pred: "Pred",
    caption: "Dice = 2·overlap / (GT + pred)",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const GT_CX = 130;
const PRED_CX = 195;
const CY = 78;
const R = 52;

export default function DiceFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const clipId = "dice-overlap-clip";

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
        {/* The intersection is the prediction circle clipped to the GT circle. */}
        <clipPath id={clipId}>
          <circle cx={GT_CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {/* GT and prediction outlines */}
      <circle cx={GT_CX} cy={CY} r={R} fill="var(--c-gt)" fillOpacity={0.18} stroke="var(--c-gt)" strokeWidth={2} />
      <circle
        cx={PRED_CX}
        cy={CY}
        r={R}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2}
      />

      {/* Shaded intersection (prediction circle clipped to GT) */}
      <circle cx={PRED_CX} cy={CY} r={R} fill="var(--c-warn)" fillOpacity={0.42} clipPath={`url(#${clipId})`} />

      {/* Labels */}
      <text x={GT_CX - R + 6} y={CY - R - 6} fill="var(--c-gt)" textAnchor="start">
        {t.gt}
      </text>
      <text x={PRED_CX + R - 6} y={CY - R - 6} fill="var(--c-pred-a)" textAnchor="end">
        {t.pred}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 12} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
