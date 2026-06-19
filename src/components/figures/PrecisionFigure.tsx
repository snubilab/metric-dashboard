/**
 * PrecisionFigure — two panels contrasting precision (positive predictive value).
 *
 * Panel 1 ("typical"): the predicted region split into the correct part (TP)
 * and the part outside GT (FP), centered in the panel. Panel 2 ("misleading"):
 * the prediction marks only a small easy core that is entirely correct, so
 * precision ≈ 1.0 while most of GT is missed. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption } from "./detPanels";

const L = {
  ko: {
    aria: "정밀도 예시: 예측 중 맞은 부분(TP)과 정답 밖(FP), 그리고 쉬운 일부만 예측해 정밀도 1.0이 되는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    tp: "TP",
    fp: "FP",
    caption: "정밀도 = TP / (TP + FP)",
    trap: "쉬운 일부만 예측하면 정밀도 1.0 — 대부분 놓침",
    core: "쉬운 일부",
    missed: "놓친 정답",
  },
  en: {
    aria: "Precision example: prediction split into correct (TP) and outside-GT (FP), plus a misleading case where predicting only a small easy core makes precision 1.0",
    typical: "typical",
    misleading: "misleading",
    tp: "TP",
    fp: "FP",
    caption: "Precision = TP / (TP + FP)",
    trap: "Predicting only the easy core gives precision 1.0 — most is missed",
    core: "easy core",
    missed: "missed GT",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

export default function PrecisionFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const tpClipId = "prec-tp-clip";
  const fpClipId = "prec-fp-clip";

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
        <pattern id="prec-hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} fill="var(--c-warn)" fillOpacity={0.12} />
          <line x1={0} y1={0} x2={0} y2={8} stroke="var(--c-warn)" strokeWidth={2.5} />
        </pattern>
        {/* Prediction circle centered at 0,0 r=40: left of split = TP, right = FP */}
        <clipPath id={tpClipId}>
          <rect x={-42} y={-42} width={50} height={84} />
        </clipPath>
        <clipPath id={fpClipId}>
          <rect x={8} y={-42} width={34} height={84} />
        </clipPath>
      </defs>

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: typical ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 102)`}>
        <circle cx={0} cy={0} r={40} fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />
        <circle cx={0} cy={0} r={40} fill="var(--c-pred-a)" fillOpacity={0.55} clipPath={`url(#${tpClipId})`} />
        <circle cx={0} cy={0} r={40} fill="url(#prec-hatch)" clipPath={`url(#${fpClipId})`} />
        <line x1={8} y1={-40} x2={8} y2={40} stroke="var(--c-text-dim)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={-18} y={4} fill="var(--c-text)" textAnchor="middle">
          {t.tp}
        </text>
        <text x={24} y={4} fill="var(--c-warn)" textAnchor="middle">
          {t.fp}
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
          {/* Large GT region; most of it is left unpredicted (hatched warn) */}
          <circle cx={0} cy={0} r={44} fill="url(#prec-hatch)" stroke="var(--c-gt)" strokeWidth={2} />
          {/* Small easy core that the prediction marks — all of it correct */}
          <circle cx={-2} cy={4} r={15} fill="var(--c-pred-a)" fillOpacity={0.7} stroke="var(--c-pred-a)" strokeWidth={2} />
          <text x={-2} y={7} fill="var(--c-surface)" textAnchor="middle" fontSize="8">
            {t.core}
          </text>
          <text x={0} y={-50} fill="var(--c-warn)" textAnchor="middle" fontSize="9">
            {t.missed}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn)" />
      </g>
    </svg>
  );
}
