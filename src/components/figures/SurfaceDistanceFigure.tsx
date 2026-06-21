/**
 * SurfaceDistanceFigure — two panels contrasting ASSD (average symmetric
 * surface distance).
 *
 * Panel 1 ("typical"): two roughly parallel boundaries with several short
 * arrows whose lengths ASSD averages, centered in the panel. Panel 2
 * ("misleading"): boundaries are mostly aligned but one large local deviation
 * is diluted by the average. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria: "ASSD 예시: 경계 간 거리의 평균, 그리고 평균이 큰 국소 오차를 희석하는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    gt: "정답(GT)",
    pred: "예측",
    caption: "ASSD = 경계 간 거리의 평균",
    trap: "평균이 큰 국소 오차를 희석",
    spike: "국소 오차",
  },
  en: {
    aria: "ASSD example: the average of boundary distances, plus a misleading case where the mean dilutes one large local deviation",
    typical: "typical",
    misleading: "misleading",
    gt: "GT",
    pred: "Pred",
    caption: "ASSD = average of boundary distances",
    trap: "Averaging dilutes a large local error",
    spike: "local error",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

/** Panel-local x range for the boundary curves. */
const X0 = -78;
const X1 = 78;

function typicalGtY(x: number): number {
  return 6 * Math.sin(x / 26);
}
function typicalPredY(x: number): number {
  return typicalGtY(x) + 18 + 6 * Math.sin(x / 16);
}
function alignedGtY(x: number): number {
  return 4 * Math.sin(x / 30);
}
/** Aligned almost everywhere, with one large bump near x≈30. */
function alignedPredY(x: number): number {
  const bump = 36 * Math.exp(-((x - 30) ** 2) / 90);
  return alignedGtY(x) + 8 + bump;
}

function curvePoints(yAt: (x: number) => number): string {
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += 6) {
    pts.push(`${x},${yAt(x).toFixed(1)}`);
  }
  return pts.join(" ");
}

const SAMPLE_XS = [-60, -36, -12, 12, 36, 60];

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

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 92)`}>
        <polyline points={curvePoints(typicalGtY)} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
        <polyline points={curvePoints(typicalPredY)} fill="none" stroke="var(--c-pred-a)" strokeWidth={2.5} />
        {SAMPLE_XS.map((x) => (
          <line
            key={x}
            x1={x}
            y1={typicalGtY(x) + 2}
            x2={x}
            y2={typicalPredY(x) - 2}
            stroke="var(--c-text-dim)"
            strokeWidth={1.5}
            markerEnd={`url(#${arrowId})`}
          />
        ))}
        <text x={X0 + 4} y={typicalGtY(X0) - 8} fill="var(--c-gt-text)" textAnchor="start">
          {t.gt}
        </text>
        <text x={X1 - 4} y={typicalPredY(X1) + 16} fill="var(--c-pred-a-text)" textAnchor="end">
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

        <g transform={`translate(${PANEL_CX}, 86)`}>
          <polyline points={curvePoints(alignedGtY)} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
          <polyline points={curvePoints(alignedPredY)} fill="none" stroke="var(--c-pred-a)" strokeWidth={2.5} />
          {/* The single large local deviation */}
          <line
            x1={30}
            y1={alignedGtY(30) + 2}
            x2={30}
            y2={alignedPredY(30) - 2}
            stroke="var(--c-warn)"
            strokeWidth={2}
            markerEnd={`url(#${arrowId})`}
          />
          <text x={30} y={alignedPredY(30) + 14} fill="var(--c-warn-text)" textAnchor="middle" fontSize="9">
            {t.spike}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn-text)" />
      </g>
    </svg>
  );
}
