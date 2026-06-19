/**
 * SensitivityFigure — one static example of recall / sensitivity.
 *
 * The whole GT region is shown. The part the prediction also covered is the
 * true-positive area (filled in the GT color); the part the prediction missed
 * is the false-negative area (hatched, warn color). Caption: TP / (TP + FN).
 * Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "민감도 예시: 정답 영역 중 찾은 부분(TP)과 놓친 부분(FN)",
    tp: "TP (찾음)",
    fn: "FN (놓침)",
    caption: "민감도 = TP / (TP + FN)",
  },
  en: {
    aria: "Sensitivity example: the GT region split into found (TP) and missed (FN)",
    tp: "TP (found)",
    fn: "FN (missed)",
    caption: "Sensitivity = TP / (TP + FN)",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const CX = 150;
const CY = 74;
const R = 56;
/** The prediction covers everything left of this x; right of it is the missed FN slice. */
const SPLIT_X = 178;

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
        {/* Hatch pattern marks the missed (false-negative) slice. */}
        <pattern id="sens-hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} fill="var(--c-warn)" fillOpacity={0.12} />
          <line x1={0} y1={0} x2={0} y2={8} stroke="var(--c-warn)" strokeWidth={2.5} />
        </pattern>
        <clipPath id={tpClipId}>
          <rect x={CX - R - 2} y={CY - R - 2} width={SPLIT_X - (CX - R - 2)} height={2 * R + 4} />
        </clipPath>
        <clipPath id={fnClipId}>
          <rect x={SPLIT_X} y={CY - R - 2} width={CX + R + 2 - SPLIT_X} height={2 * R + 4} />
        </clipPath>
      </defs>

      {/* GT outline */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--c-gt)" strokeWidth={2} />

      {/* TP: found part of GT, solid GT color */}
      <circle cx={CX} cy={CY} r={R} fill="var(--c-gt)" fillOpacity={0.55} clipPath={`url(#${tpClipId})`} />
      {/* FN: missed part of GT, hatched warn */}
      <circle cx={CX} cy={CY} r={R} fill="url(#sens-hatch)" clipPath={`url(#${fnClipId})`} />
      {/* Boundary between TP and FN */}
      <line x1={SPLIT_X} y1={CY - R} x2={SPLIT_X} y2={CY + R} stroke="var(--c-text-dim)" strokeWidth={1.5} strokeDasharray="4 3" />

      {/* Labels */}
      <text x={CX - 6} y={CY + 4} fill="var(--c-text)" textAnchor="middle">
        {t.tp}
      </text>
      <text x={CX + R + 8} y={CY + 4} fill="var(--c-warn)" textAnchor="start">
        {t.fn}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 12} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
