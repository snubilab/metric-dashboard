/**
 * PrecisionFigure — one static example of precision (positive predictive value).
 *
 * The whole predicted region is shown. The part that fell inside GT is the
 * true-positive area (filled in the prediction color); the part outside GT is
 * the false-positive area (hatched, warn color). Caption: TP / (TP + FP).
 * Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "정밀도 예시: 예측 영역 중 맞은 부분(TP)과 정답 밖 부분(FP)",
    tp: "TP (맞음)",
    fp: "FP (정답 밖)",
    caption: "정밀도 = TP / (TP + FP)",
  },
  en: {
    aria: "Precision example: the predicted region split into correct (TP) and outside-GT (FP)",
    tp: "TP (correct)",
    fp: "FP (outside GT)",
    caption: "Precision = TP / (TP + FP)",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const CX = 170;
const CY = 74;
const R = 56;
/** The prediction's left part lies inside GT (TP); right of this x is outside GT (FP). */
const SPLIT_X = 162;

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
        <clipPath id={tpClipId}>
          <rect x={CX - R - 2} y={CY - R - 2} width={SPLIT_X - (CX - R - 2)} height={2 * R + 4} />
        </clipPath>
        <clipPath id={fpClipId}>
          <rect x={SPLIT_X} y={CY - R - 2} width={CX + R + 2 - SPLIT_X} height={2 * R + 4} />
        </clipPath>
      </defs>

      {/* Prediction outline */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />

      {/* TP: part of the prediction inside GT, solid prediction color */}
      <circle cx={CX} cy={CY} r={R} fill="var(--c-pred-a)" fillOpacity={0.55} clipPath={`url(#${tpClipId})`} />
      {/* FP: part of the prediction outside GT, hatched warn */}
      <circle cx={CX} cy={CY} r={R} fill="url(#prec-hatch)" clipPath={`url(#${fpClipId})`} />
      {/* Boundary between TP and FP */}
      <line x1={SPLIT_X} y1={CY - R} x2={SPLIT_X} y2={CY + R} stroke="var(--c-text-dim)" strokeWidth={1.5} strokeDasharray="4 3" />

      {/* Labels */}
      <text x={CX - R - 8} y={CY + 4} fill="var(--c-text)" textAnchor="end">
        {t.tp}
      </text>
      <text x={CX + 6} y={CY + 4} fill="var(--c-warn)" textAnchor="middle">
        {t.fp}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 12} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
