/**
 * DiceFigure — two panels contrasting the Dice (F1) overlap idea.
 *
 * Panel 1 ("typical"): two overlapping circles (GT + prediction) with the
 * lens-shaped intersection shaded, centered in the panel. Panel 2
 * ("misleading"): a large organ scores a near-perfect Dice while a tiny
 * separate lesion is missed entirely — the big structure dominates the score.
 * Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption } from "./detPanels";

const L = {
  ko: {
    aria: "Dice 예시: 겹치는 두 원의 교집합과, 큰 구조가 점수를 지배해 작은 병변 누락을 가리는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    gt: "정답(GT)",
    pred: "예측",
    caption: "Dice = 2·교집합 / (GT + 예측) (Dice≈0.82)",
    trap: "큰 구조가 점수를 지배해 작은 병변 누락을 가림 (Dice≈0.95)",
    miss: "누락",
  },
  en: {
    aria: "Dice example: two overlapping circles, plus a misleading case where a large structure dominates the score and hides a missed tiny lesion",
    typical: "typical",
    misleading: "misleading",
    gt: "GT",
    pred: "Pred",
    caption: "Dice = 2·overlap / (GT + pred) (Dice≈0.82)",
    trap: "A large structure dominates the score, hiding a missed small lesion (Dice≈0.95)",
    miss: "missed",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

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
          <circle cx={-30} cy={0} r={36} />
        </clipPath>
      </defs>

      {/* Divider between the two panels */}
      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 100)`}>
        {/* Content group centered at the panel's horizontal middle */}
        <g transform="translate(0, 0)">
          {/* GT and prediction outlines, symmetric about x=0 */}
          <circle cx={-30} cy={0} r={36} fill="var(--c-gt)" fillOpacity={0.18} stroke="var(--c-gt)" strokeWidth={2} />
          <circle cx={30} cy={0} r={36} fill="var(--c-pred-a)" fillOpacity={0.18} stroke="var(--c-pred-a)" strokeWidth={2} />
          {/* Shaded intersection (prediction circle clipped to GT) */}
          <circle cx={30} cy={0} r={36} fill="var(--c-warn)" fillOpacity={0.42} clipPath={`url(#${clipId})`} />
          <text x={-30} y={-44} fill="var(--c-gt)" textAnchor="middle">
            {t.gt}
          </text>
          <text x={30} y={-44} fill="var(--c-pred-a)" textAnchor="middle">
            {t.pred}
          </text>
        </g>
      </g>
      <SvgPanelCaption text={t.caption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-text-dim)" />

      {/* ----- Panel 2: misleading ----- */}
      <g transform={`translate(${PANEL_W}, 0)`} data-role="misleading">
        <text x={PANEL_CX - 8} y={TAG_Y} fill="var(--c-warn)" textAnchor="middle">
          {t.misleading}
        </text>
        {/* Warning mark */}
        <path
          d={`M ${PANEL_CX + 30} ${TAG_Y - 11} l 6 11 l -12 0 z`}
          fill="none"
          stroke="var(--c-warn)"
          strokeWidth={1.5}
        />
        <text x={PANEL_CX + 30} y={TAG_Y - 1} fill="var(--c-warn)" textAnchor="middle" fontSize="8">
          !
        </text>

        <g transform={`translate(${PANEL_CX}, 96)`}>
          {/* Large organ with near-perfect overlap (dominates Dice) */}
          <circle cx={-18} cy={0} r={42} fill="var(--c-gt)" fillOpacity={0.16} stroke="var(--c-gt)" strokeWidth={2} />
          <circle cx={-12} cy={0} r={42} fill="var(--c-pred-a)" fillOpacity={0.3} stroke="var(--c-pred-a)" strokeWidth={2} />
          {/* Tiny separate GT lesion, completely missed by prediction */}
          <circle cx={62} cy={-26} r={7} fill="var(--c-warn)" fillOpacity={0.18} stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="3 2" />
          <text x={62} y={-38} fill="var(--c-warn)" textAnchor="middle" fontSize="9">
            {t.miss}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn)" />
      </g>
    </svg>
  );
}
