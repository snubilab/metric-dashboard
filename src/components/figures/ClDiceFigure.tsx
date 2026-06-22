/**
 * ClDiceFigure — two panels contrasting centerline Dice (clDice) for a tubular
 * structure. Panel 1 ("typical"): the prediction covers the whole vessel, so its
 * centerline is unbroken → clDice high. Panel 2 ("misleading"): the prediction
 * has nearly the same area (high voxel Dice) but a GAP severs the vessel, breaking
 * its centerline → clDice drops. This is the connectivity blind spot of Dice.
 * Static, non-interactive.
 *
 * Marks (vessel strokes, warn glyph) use the bright data vars; text/centerline use
 * the readable -text variants per the design-system convention.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption, SvgWarnMark } from "./detPanels";

const L = {
  ko: {
    aria:
      "clDice 예시: 중심선이 이어진 혈관과, 부피 Dice는 높지만 끊겨서 중심선이 깨진 혈관 비교",
    typical: "정상 예시",
    misleading: "오해 사례",
    caption: "예측이 혈관을 모두 덮어 중심선이 이어짐 (clDice 높음)",
    trap: "부피 Dice는 높아도 끊김이 중심선을 깨서 clDice 하락",
    breakLabel: "끊김",
  },
  en: {
    aria:
      "clDice example: a vessel whose centerline is connected, versus one with high voxel Dice but a break that severs the centerline",
    typical: "typical",
    misleading: "misleading",
    caption: "Prediction covers the whole vessel, centerline connected (clDice high)",
    trap: "High voxel Dice, but a gap severs the centerline so clDice drops",
    breakLabel: "break",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

/** An S-curved tube segment, centered on its translate origin. */
const VESSEL = "M 0,-58 C -22,-24 22,24 0,58";
/** Dash pattern (≈ path length) leaving one clean gap near the middle. */
const BREAK_DASH = "50 30 50";

export default function ClDiceFigure() {
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
      {/* Divider between the two panels */}
      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: intact centerline ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 108)`}>
        {/* GT vessel (thick green) */}
        <path d={VESSEL} fill="none" stroke="var(--c-gt)" strokeWidth={20} strokeLinecap="round" opacity={0.4} />
        {/* Prediction (blue), fully covering the vessel */}
        <path d={VESSEL} fill="none" stroke="var(--c-pred-a)" strokeWidth={13} strokeLinecap="round" opacity={0.5} />
        {/* Centerline (skeleton) — unbroken */}
        <path d={VESSEL} fill="none" stroke="var(--c-gt-text)" strokeWidth={2} strokeDasharray="4 3" />
      </g>
      <SvgPanelCaption text={t.caption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-text-dim)" />

      {/* ----- Panel 2: broken centerline (high Dice, low clDice) ----- */}
      <text x={PANEL_W + PANEL_CX} y={TAG_Y} fill="var(--c-warn-text)" textAnchor="middle">
        {t.misleading}
      </text>
      <g transform={`translate(${PANEL_W + PANEL_CX}, 108)`}>
        {/* GT vessel — the truth is fully connected */}
        <path d={VESSEL} fill="none" stroke="var(--c-gt)" strokeWidth={20} strokeLinecap="round" opacity={0.4} />
        {/* Prediction along the SAME vessel but with a central gap (high area, broken) */}
        <path
          d={VESSEL}
          fill="none"
          stroke="var(--c-pred-a)"
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={BREAK_DASH}
          opacity={0.55}
        />
        {/* Centerline broken at the same gap */}
        <path
          d={VESSEL}
          fill="none"
          stroke="var(--c-warn-text)"
          strokeWidth={2}
          strokeDasharray={BREAK_DASH}
        />
        {/* Mark the severing gap */}
        <SvgWarnMark x={-7} y={-9} fill="var(--c-warn)" />
        <text x={16} y={2} fill="var(--c-warn-text)" textAnchor="start" fontSize="9">
          {t.breakLabel}
        </text>
      </g>
      <SvgPanelCaption text={t.trap} x={PANEL_W + PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-warn-text)" />
    </svg>
  );
}
