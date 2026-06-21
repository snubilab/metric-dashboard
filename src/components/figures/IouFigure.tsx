/**
 * IouFigure — two panels contrasting Intersection-over-Union (Jaccard).
 *
 * Panel 1 ("typical"): two overlapping circles with the lens intersection
 * shaded and the union outlined, centered in the panel. Panel 2 ("misleading"):
 * two masks with decent overlap (high IoU) yet a clearly wrong boundary the
 * region ratio never reveals. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria: "IoU 예시: 교집합과 합집합의 비, 그리고 IoU가 높아도 경계 오차를 드러내지 못하는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    intersection: "교집합",
    union: "합집합",
    caption: "IoU = 교집합 / 합집합",
    trap: "IoU가 높아도 경계 오차는 드러나지 않음",
    bad: "경계 오차",
  },
  en: {
    aria: "IoU example: intersection over union, plus a misleading case where a high IoU still hides a clearly wrong boundary",
    typical: "typical",
    misleading: "misleading",
    intersection: "intersection",
    union: "union",
    caption: "IoU = intersection / union",
    trap: "High IoU still hides boundary error",
    bad: "bad edge",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

export default function IouFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const clipId = "iou-intersection-clip";

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
        <clipPath id={clipId}>
          <circle cx={-26} cy={0} r={34} />
        </clipPath>
      </defs>

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 102)`}>
        {/* Union outline (dashed) */}
        <circle cx={-26} cy={0} r={34} fill="none" stroke="var(--c-text-dim)" strokeWidth={2} strokeDasharray="5 3" />
        <circle cx={26} cy={0} r={34} fill="none" stroke="var(--c-text-dim)" strokeWidth={2} strokeDasharray="5 3" />
        {/* Faint per-circle fills */}
        <circle cx={-26} cy={0} r={34} fill="var(--c-gt)" fillOpacity={0.12} />
        <circle cx={26} cy={0} r={34} fill="var(--c-pred-a)" fillOpacity={0.12} />
        {/* Shaded intersection */}
        <circle cx={26} cy={0} r={34} fill="var(--c-warn)" fillOpacity={0.45} clipPath={`url(#${clipId})`} />
        <text x={0} y={4} fill="var(--c-text)" textAnchor="middle">
          {t.intersection}
        </text>
        <text x={0} y={-42} fill="var(--c-text-dim)" textAnchor="middle">
          {t.union}
        </text>
      </g>
      <SvgPanelCaption text={t.caption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-text-dim)" />

      {/* ----- Panel 2: misleading ----- */}
      <g transform={`translate(${PANEL_W}, 0)`} data-role="misleading">
        <text x={PANEL_CX} y={TAG_Y} fill="var(--c-warn)" textAnchor="middle">
          {t.misleading}
        </text>
        <SvgWarnMark x={PANEL_W - 14} y={TAG_Y} />

        <g transform={`translate(${PANEL_CX}, 96)`}>
          {/* GT square mask */}
          <rect x={-44} y={-34} width={62} height={62} fill="var(--c-gt)" fillOpacity={0.16} stroke="var(--c-gt)" strokeWidth={2} />
          {/* Prediction: decent overlap (high IoU) but a jagged, clearly wrong boundary */}
          <path
            d="M -28 -30 L 30 -34 L 22 -2 L 38 26 L -18 30 L -26 4 Z"
            fill="var(--c-pred-a)"
            fillOpacity={0.22}
            stroke="var(--c-warn)"
            strokeWidth={2.5}
          />
          <text x={30} y={-40} fill="var(--c-warn)" textAnchor="middle" fontSize="9">
            {t.bad}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn)" />
      </g>
    </svg>
  );
}
