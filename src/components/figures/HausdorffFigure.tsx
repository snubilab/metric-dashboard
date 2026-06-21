/**
 * HausdorffFigure — two panels contrasting the Hausdorff distance.
 *
 * Panel 1 ("typical"): two slightly offset boundaries with a single arrow
 * marking the worst-case boundary distance, centered in the panel. Panel 2
 * ("misleading"): near-perfect overlap spoiled by ONE stray outlier pixel far
 * away that dominates HD (HD95 trims the top 5%). Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria: "하우스도르프 예시: 두 경계의 최대 거리, 그리고 이상점 하나가 HD를 지배하는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    gt: "정답(GT)",
    pred: "예측",
    worst: "최대 거리",
    caption: "HD = 최악의 경계 거리",
    trap: "HD는 이상점 하나에 지배됨 (HD95는 상위 5%를 잘라 완화)",
    outlier: "이상점",
  },
  en: {
    aria: "Hausdorff example: the single farthest boundary distance, plus a misleading case where one stray outlier dominates HD",
    typical: "typical",
    misleading: "misleading",
    gt: "GT",
    pred: "Pred",
    worst: "max",
    caption: "HD = worst boundary distance",
    trap: "HD is dominated by a single outlier (HD95 trims the top 5%)",
    outlier: "outlier",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

export default function HausdorffFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const arrowId = "hd-arrow";

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
        <marker id={arrowId} markerWidth={9} markerHeight={9} refX={7} refY={4.5} orient="auto">
          <path d="M 0 0 L 9 4.5 L 0 9 z" fill="var(--c-text-dim)" />
        </marker>
      </defs>

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 92)`}>
        {/* Two offset blobs centered around 0 */}
        <path
          d="M -52 4 C -52 -26, -20 -32, -2 -20 C 16 -8, 12 22, -8 28 C -32 36, -52 22, -52 4 Z"
          fill="var(--c-gt)"
          fillOpacity={0.1}
          stroke="var(--c-gt)"
          strokeWidth={2}
        />
        <path
          d="M -24 6 C -24 -28, 24 -38, 50 -16 C 70 0, 60 30, 32 36 C 0 42, -24 28, -24 6 Z"
          fill="var(--c-pred-a)"
          fillOpacity={0.1}
          stroke="var(--c-pred-a)"
          strokeWidth={2}
        />
        {/* The single worst-case distance arrow */}
        <line x1={-50} y1={-2} x2={56} y2={-18} stroke="var(--c-text-dim)" strokeWidth={2} markerEnd={`url(#${arrowId})`} />
        <circle cx={-50} cy={-2} r={3} fill="var(--c-text-dim)" />
        <text x={4} y={-26} fill="var(--c-warn-text)" textAnchor="middle">
          {t.worst}
        </text>
        <text x={-46} y={44} fill="var(--c-gt-text)" textAnchor="middle">
          {t.gt}
        </text>
        <text x={42} y={50} fill="var(--c-pred-a-text)" textAnchor="middle">
          {t.pred}
        </text>
      </g>
      <SvgPanelCaption text={t.caption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-text-dim)" />

      {/* ----- Panel 2: misleading ----- */}
      <g transform={`translate(${PANEL_W}, 0)`} data-role="misleading">
        <text x={PANEL_CX} y={TAG_Y} fill="var(--c-warn-text)" textAnchor="middle">
          {t.misleading}
        </text>
        <SvgWarnMark x={PANEL_W - 14} y={TAG_Y} />

        <g transform={`translate(${PANEL_CX}, 92)`}>
          {/* Near-perfect overlap of GT and prediction */}
          <circle cx={-14} cy={8} r={34} fill="var(--c-gt)" fillOpacity={0.14} stroke="var(--c-gt)" strokeWidth={2} />
          <circle cx={-12} cy={8} r={34} fill="var(--c-pred-a)" fillOpacity={0.18} stroke="var(--c-pred-a)" strokeWidth={2} />
          {/* One stray outlier pixel far away — dominates HD */}
          <rect x={56} y={-44} width={9} height={9} fill="var(--c-warn)" stroke="var(--c-warn)" strokeWidth={1} />
          <line x1={-12} y1={4} x2={56} y2={-40} stroke="var(--c-warn)" strokeWidth={1.5} strokeDasharray="3 3" markerEnd={`url(#${arrowId})`} />
          <text x={60} y={-50} fill="var(--c-warn-text)" textAnchor="middle" fontSize="9">
            {t.outlier}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn-text)" />
      </g>
    </svg>
  );
}
