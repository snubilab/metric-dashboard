/**
 * NsdFigure — two panels contrasting the Normalized Surface Dice tolerance band.
 *
 * Panel 1 ("typical"): a reference boundary with a tolerance band of width tau;
 * sample points inside the band count as OK, the few outside count against NSD,
 * centered in the panel. Panel 2 ("misleading"): a loose tolerance band so a
 * clearly bad boundary still scores a high NSD. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria: "NSD 예시: 허용 오차 띠 안의 경계점 비율, 그리고 허용오차가 크면 나쁜 경계도 통과하는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    tau: "허용 오차 τ",
    caption: "NSD@τ = 띠 안 경계점 비율",
    trap: "허용오차가 크면 나쁜 경계도 통과",
    loose: "넓은 τ",
  },
  en: {
    aria: "NSD example: fraction of boundary inside the tolerance band, plus a misleading case where a loose tolerance lets a bad boundary pass",
    typical: "typical",
    misleading: "misleading",
    tau: "tolerance τ",
    caption: "NSD@τ = fraction of boundary in band",
    trap: "A loose tolerance lets a bad boundary pass",
    loose: "wide τ",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

const X0 = -72;
const X1 = 72;
const TAU_TIGHT = 12;
const TAU_LOOSE = 30;

function refY(x: number): number {
  return 18 * Math.sin(x / 40);
}
function badY(x: number): number {
  // A clearly wrong, jagged boundary that still sits within a loose band.
  return refY(x) + 22 * Math.sin(x / 11);
}

function curvePoints(yAt: (x: number) => number, offset: number): string {
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += 6) {
    pts.push(`${x},${(yAt(x) + offset).toFixed(1)}`);
  }
  return pts.join(" ");
}

function bandPolygon(tau: number): string {
  const top = curvePoints(refY, -tau);
  const bottom = curvePoints(refY, tau).split(" ").reverse().join(" ");
  return `${top} ${bottom}`;
}

const SAMPLES: { x: number; dy: number }[] = [
  { x: -54, dy: 4 },
  { x: -30, dy: -6 },
  { x: -6, dy: 18 },
  { x: 18, dy: -5 },
  { x: 42, dy: -20 },
  { x: 60, dy: 3 },
];

export default function NsdFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 96)`}>
        <polygon
          points={bandPolygon(TAU_TIGHT)}
          fill="var(--c-gt)"
          fillOpacity={0.14}
          stroke="var(--c-text-dim)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <polyline points={curvePoints(refY, 0)} fill="none" stroke="var(--c-text)" strokeWidth={2} />
        {SAMPLES.map((s) => {
          const inBand = Math.abs(s.dy) <= TAU_TIGHT;
          return (
            <circle
              key={s.x}
              cx={s.x}
              cy={refY(s.x) + s.dy}
              r={4}
              fill={inBand ? "var(--c-gt)" : "var(--c-warn)"}
              stroke="var(--c-surface)"
              strokeWidth={1}
            />
          );
        })}
        {/* Lifted into the empty upper-right corner, clear of the boundary dots and band edge */}
        <text x={X1 - 2} y={refY(X1) - TAU_TIGHT - 18} fill="var(--c-text-dim)" textAnchor="end">
          {t.tau}
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
          {/* A loose tolerance band swallows the bad boundary */}
          <polygon
            points={bandPolygon(TAU_LOOSE)}
            fill="var(--c-warn)"
            fillOpacity={0.1}
            stroke="var(--c-warn)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {/* Reference and a clearly bad, jagged prediction — both inside the band */}
          <polyline points={curvePoints(refY, 0)} fill="none" stroke="var(--c-gt)" strokeWidth={2} />
          <polyline points={curvePoints(badY, 0)} fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />
          <text x={X1 - 2} y={refY(X1) - TAU_LOOSE - 4} fill="var(--c-warn)" textAnchor="end" fontSize="9">
            {t.loose}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn)" />
      </g>
    </svg>
  );
}
