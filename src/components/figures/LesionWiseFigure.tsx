/**
 * LesionWiseFigure — two panels contrasting lesion-level (instance) detection.
 *
 * Panel 1 ("typical"): three GT lesions — one found (TP), one missed (FN), one
 * spurious prediction (FP) — centered in the panel, showing detection counts
 * rather than voxel overlap. Panel 2 ("misleading"): voxel Dice is high on the
 * big lesion while one small lesion is missed entirely. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria: "병변 단위 예시: 찾음/놓침/거짓 검출, 그리고 복셀 Dice는 높지만 병변 하나를 통째로 놓치는 오해 사례",
    typical: "정상 예시",
    misleading: "오해 사례",
    tp: "TP",
    fn: "FN",
    fp: "FP",
    caption: "병변 단위: 복셀 겹침이 아닌 검출 수",
    trap: "복셀 Dice는 높지만 병변 하나를 통째로 놓침",
    big: "큰 병변",
    miss: "놓친 병변",
  },
  en: {
    aria: "Lesion-wise example: found, missed and spurious lesions, plus a misleading case where voxel Dice is high yet an entire small lesion is missed",
    typical: "typical",
    misleading: "misleading",
    tp: "TP",
    fn: "FN",
    fp: "FP",
    caption: "Lesion-wise: detection count, not voxel overlap",
    trap: "Voxel Dice is high but one whole lesion is missed",
    big: "big lesion",
    miss: "missed lesion",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

export default function LesionWiseFigure() {
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
        {/* TP: GT outline with a matching prediction fill */}
        <circle cx={-54} cy={0} r={24} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
        <circle cx={-54} cy={0} r={15} fill="var(--c-pred-a)" fillOpacity={0.55} stroke="var(--c-pred-a)" strokeWidth={2} />
        <text x={-54} y={42} fill="var(--c-gt-text)" textAnchor="middle">
          {t.tp}
        </text>
        {/* FN: GT present, no prediction */}
        <circle cx={2} cy={0} r={22} fill="var(--c-warn)" fillOpacity={0.08} stroke="var(--c-warn)" strokeWidth={2.5} strokeDasharray="6 4" />
        <text x={2} y={42} fill="var(--c-warn-text)" textAnchor="middle">
          {t.fn}
        </text>
        {/* FP: spurious prediction with no GT */}
        <circle cx={56} cy={0} r={19} fill="var(--c-pred-b)" fillOpacity={0.5} stroke="var(--c-pred-b)" strokeWidth={2.5} />
        <text x={56} y={40} fill="var(--c-pred-b-text)" textAnchor="middle">
          {t.fp}
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
          {/* Big lesion with high voxel overlap (Dice high) */}
          <circle cx={-22} cy={2} r={38} fill="var(--c-gt)" fillOpacity={0.16} stroke="var(--c-gt)" strokeWidth={2} />
          <circle cx={-19} cy={2} r={38} fill="var(--c-pred-a)" fillOpacity={0.32} stroke="var(--c-pred-a)" strokeWidth={2} />
          <text x={-20} y={6} fill="var(--c-text)" textAnchor="middle" fontSize="9">
            {t.big}
          </text>
          {/* One small lesion missed entirely */}
          <circle cx={58} cy={-26} r={8} fill="var(--c-warn)" fillOpacity={0.18} stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="3 2" />
          <text x={56} y={-40} fill="var(--c-warn-text)" textAnchor="middle" fontSize="9">
            {t.miss}
          </text>
        </g>
        <SvgPanelCaption text={t.trap} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn-text)" />
      </g>
    </svg>
  );
}
