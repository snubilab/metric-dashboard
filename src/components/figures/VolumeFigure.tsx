/**
 * VolumeFigure — two panels contrasting a volume / area difference.
 *
 * Panel 1 ("typical"): two filled blobs of clearly different size (GT vs
 * prediction) with a delta indicator for the volume gap, centered in the panel.
 * Panel 2 ("misleading"): GT and prediction have EQUAL area (volume diff = 0)
 * yet are spatially displaced and barely overlap. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria: "부피 예시: 크기가 다른 두 영역의 차이, 그리고 부피 차이는 0이지만 위치가 완전히 다른 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    gt: "정답(GT)",
    pred: "예측",
    delta: "Δ 부피",
    caption: "부피 차이 = |GT − 예측|",
    trap: "부피 차이는 0이지만 위치가 완전히 다름",
    same: "같은 부피",
  },
  en: {
    aria: "Volume example: the difference between two differently sized regions, plus a misleading case where the volume difference is zero yet the locations are completely different",
    typical: "typical",
    misleading: "misleading",
    gt: "GT",
    pred: "Pred",
    delta: "Δ volume",
    caption: "Volume diff = |GT − pred|",
    trap: "Volume difference is 0 yet the location is completely wrong",
    same: "equal volume",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

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

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 96)`}>
        {/* Larger GT, smaller prediction, symmetric about x=0 */}
        <circle cx={-44} cy={0} r={40} fill="var(--c-gt)" fillOpacity={0.4} stroke="var(--c-gt)" strokeWidth={2} />
        <circle cx={48} cy={0} r={26} fill="var(--c-pred-a)" fillOpacity={0.4} stroke="var(--c-pred-a)" strokeWidth={2} />
        <line
          x1={-4}
          y1={0}
          x2={22}
          y2={0}
          stroke="var(--c-text-dim)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          markerStart={`url(#${arrowId})`}
          markerEnd={`url(#${arrowId})`}
        />
        <text x={9} y={-8} fill="var(--c-warn-text)" textAnchor="middle">
          {t.delta}
        </text>
        <text x={-44} y={56} fill="var(--c-gt-text)" textAnchor="middle">
          {t.gt}
        </text>
        <text x={48} y={44} fill="var(--c-pred-a-text)" textAnchor="middle">
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
          {/* GT and prediction: SAME radius (equal area), displaced so they barely overlap */}
          <circle cx={-34} cy={-8} r={30} fill="var(--c-gt)" fillOpacity={0.35} stroke="var(--c-gt)" strokeWidth={2} />
          <circle cx={34} cy={14} r={30} fill="var(--c-pred-a)" fillOpacity={0.35} stroke="var(--c-pred-a)" strokeWidth={2} />
          <text x={0} y={-44} fill="var(--c-warn-text)" textAnchor="middle" fontSize="9">
            {t.same}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn-text)" />
      </g>
    </svg>
  );
}
