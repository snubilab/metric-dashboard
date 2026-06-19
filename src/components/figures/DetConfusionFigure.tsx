/**
 * DetConfusionFigure — a small detection scene labeling TP / FP / FN.
 *
 * Two GT boxes are present. One is correctly detected (TP), the other is missed
 * (FN). A spurious prediction with no GT is a false positive (FP). The caption
 * shows how these counts feed precision and recall — the basis for precision,
 * recall, and F1.
 *
 * Static, non-interactive SVG. Tokens only; bilingual labels via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "탐지 혼동 예시: 맞게 탐지한 TP, 정답 없는 곳의 FP, 놓친 정답 FN을 표시하고 정밀도와 재현율 식을 보여줍니다.",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    precision: "정밀도 = TP/(TP+FP)",
    recall: "재현율 = TP/(TP+FN)",
  },
  en: {
    aria: "Detection confusion example: a correctly detected TP, a spurious FP, and a missed GT FN, with the precision and recall formulas.",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    precision: "precision = TP/(TP+FP)",
    recall: "recall = TP/(TP+FN)",
  },
} as const;

export function DetConfusionFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg
      width="100%"
      height={170}
      viewBox="0 0 480 170"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}
    >
      {/* GT #1 detected correctly: GT box + overlapping prediction = TP */}
      <rect
        x={40}
        y={36}
        width={84}
        height={64}
        fill="none"
        stroke="var(--c-gt)"
        strokeWidth={2.5}
      />
      <rect
        data-role="tp"
        x={52}
        y={46}
        width={82}
        height={60}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />
      <text x={88} y={120} textAnchor="middle" fill="var(--c-pred-a)">
        {t.tp}
      </text>

      {/* Spurious prediction with no GT = FP */}
      <rect
        data-role="fp"
        x={200}
        y={50}
        width={70}
        height={56}
        fill="var(--c-warn)"
        fillOpacity={0.14}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text x={235} y={120} textAnchor="middle" fill="var(--c-warn)">
        {t.fp}
      </text>

      {/* Missed GT = FN */}
      <rect
        data-role="fn"
        x={340}
        y={36}
        width={84}
        height={64}
        fill="none"
        stroke="var(--c-warn)"
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      <text x={382} y={72} textAnchor="middle" fill="var(--c-text-dim)">
        ?
      </text>
      <text x={382} y={120} textAnchor="middle" fill="var(--c-warn)">
        {t.fn}
      </text>

      {/* Caption: precision & recall formulas */}
      <text x={240} y={146} textAnchor="middle" fill="var(--c-text-dim)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.precision}
      </text>
      <text x={240} y={163} textAnchor="middle" fill="var(--c-text-dim)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.recall}
      </text>
    </svg>
  );
}

export default DetConfusionFigure;
