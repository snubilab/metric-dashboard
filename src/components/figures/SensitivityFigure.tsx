/**
 * SensitivityFigure — two panels contrasting recall / sensitivity.
 *
 * Panel 1 ("typical"): the GT region split into the found part (TP) and the
 * missed part (FN), centered in the panel. Panel 2 ("misleading"): the
 * prediction floods almost the whole field (gross over-segmentation) so
 * sensitivity ≈ 1.0 while precision collapses. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption } from "./detPanels";

const L = {
  ko: {
    aria: "민감도 예시: 정답 중 찾은 부분(TP)과 놓친 부분(FN), 그리고 전부 양성으로 칠해 민감도 1.0이 되는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    tp: "TP",
    fn: "FN",
    caption: "민감도 = TP / (TP + FN)",
    trap: "전부 양성으로 칠하면 민감도 1.0 — 정밀도는 붕괴",
    flood: "전부 양성",
    gt: "GT",
  },
  en: {
    aria: "Sensitivity example: GT split into found (TP) and missed (FN), plus a misleading case where flooding everything as positive makes sensitivity 1.0",
    typical: "typical",
    misleading: "misleading",
    tp: "TP",
    fn: "FN",
    caption: "Sensitivity = TP / (TP + FN)",
    trap: "Predicting everything gives sensitivity 1.0 — precision collapses",
    flood: "all positive",
    gt: "GT",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

export default function SensitivityFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const tpClipId = "sens-tp-clip";
  const fnClipId = "sens-fn-clip";

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
        <pattern id="sens-hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} fill="var(--c-warn)" fillOpacity={0.12} />
          <line x1={0} y1={0} x2={0} y2={8} stroke="var(--c-warn)" strokeWidth={2.5} />
        </pattern>
        {/* TP = left of split; FN = right of split (relative to a circle centered at 0,0 r=40) */}
        <clipPath id={tpClipId}>
          <rect x={-42} y={-42} width={56} height={84} />
        </clipPath>
        <clipPath id={fnClipId}>
          <rect x={14} y={-42} width={28} height={84} />
        </clipPath>
      </defs>

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 102)`}>
        <circle cx={0} cy={0} r={40} fill="none" stroke="var(--c-gt)" strokeWidth={2} />
        <circle cx={0} cy={0} r={40} fill="var(--c-gt)" fillOpacity={0.55} clipPath={`url(#${tpClipId})`} />
        <circle cx={0} cy={0} r={40} fill="url(#sens-hatch)" clipPath={`url(#${fnClipId})`} />
        <line x1={14} y1={-40} x2={14} y2={40} stroke="var(--c-text-dim)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={-14} y={4} fill="var(--c-text)" textAnchor="middle">
          {t.tp}
        </text>
        <text x={28} y={4} fill="var(--c-warn)" textAnchor="middle">
          {t.fn}
        </text>
      </g>
      <SvgPanelCaption text={t.caption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-text-dim)" />

      {/* ----- Panel 2: misleading ----- */}
      <g transform={`translate(${PANEL_W}, 0)`} data-role="misleading">
        <text x={PANEL_CX - 8} y={TAG_Y} fill="var(--c-warn)" textAnchor="middle">
          {t.misleading}
        </text>
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
          {/* Prediction floods almost the entire field */}
          <rect x={-66} y={-46} width={132} height={92} fill="var(--c-pred-a)" fillOpacity={0.35} stroke="var(--c-pred-a)" strokeWidth={2} />
          {/* The true GT region is small and fully inside the flood */}
          <circle cx={-6} cy={2} r={20} fill="var(--c-gt)" fillOpacity={0.6} stroke="var(--c-gt)" strokeWidth={2} />
          <text x={-6} y={6} fill="var(--c-text)" textAnchor="middle" fontSize="9">
            {t.gt}
          </text>
          <text x={42} y={-34} fill="var(--c-warn)" textAnchor="middle" fontSize="9">
            {t.flood}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn)" />
      </g>
    </svg>
  );
}
