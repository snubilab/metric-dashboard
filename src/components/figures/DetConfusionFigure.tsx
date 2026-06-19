/**
 * DetConfusionFigure (v2) — precision / recall / F1, shown in two panels.
 *
 * Panel 1 (typical): a small detection scene labeling TP / FP / FN, with the
 * precision and recall formulas — the basis for precision, recall, and F1.
 *
 * Panel 2 (misleading): a conservative model that only fires on the easiest
 * lesion. Its one prediction is correct (precision = 1.0) but it misses three
 * other GTs (recall = 0.25). A high precision number hides poor recall, and F1
 * shifts with the confidence threshold.
 *
 * Static, non-interactive SVG panels. Tokens only; bilingual via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { TwoPanelFigure } from "./detPanels";

const L = {
  ko: {
    aria: "탐지 혼동(정밀도/재현율/F1) 개념과, 보수적인 모델의 높은 정밀도가 낮은 재현율을 가리는 오해 사례를 함께 보여주는 그림.",
    typicalTag: "정상 예시",
    misleadingTag: "오해 사례",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    precision: "정밀도 = TP/(TP+FP)",
    recall: "재현율 = TP/(TP+FN)",
    p: "정밀도 1.0",
    r: "재현율 0.25",
    misleadingCaption: "보수적이면 정밀도↑ 재현율↓ — F1은 임계값에 의존",
  },
  en: {
    aria: "Detection confusion (precision/recall/F1) concept, plus a misleading case where a conservative model's high precision hides low recall.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    precision: "precision = TP/(TP+FP)",
    recall: "recall = TP/(TP+FN)",
    p: "precision 1.0",
    r: "recall 0.25",
    misleadingCaption: "Conservative: precision up, recall down — F1 depends on threshold",
  },
} as const;

const VIEW_W = 220;
const VIEW_H = 150;

export function DetConfusionFigure() {
  const { lang } = useLang();
  const t = L[lang];

  const typical = (
    <svg
      width="100%"
      height={VIEW_H}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}
    >
      {/* GT #1 detected correctly = TP */}
      <rect x={16} y={26} width={64} height={50} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <rect
        data-role="tp"
        x={26}
        y={34}
        width={62}
        height={46}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />
      <text x={52} y={92} textAnchor="middle" fill="var(--c-pred-a)">
        {t.tp}
      </text>

      {/* Spurious prediction with no GT = FP */}
      <rect
        data-role="fp"
        x={96}
        y={34}
        width={52}
        height={42}
        fill="var(--c-warn)"
        fillOpacity={0.14}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text x={122} y={92} textAnchor="middle" fill="var(--c-warn)">
        {t.fp}
      </text>

      {/* Missed GT = FN */}
      <rect
        data-role="fn"
        x={158}
        y={26}
        width={48}
        height={50}
        fill="none"
        stroke="var(--c-warn)"
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      <text x={182} y={56} textAnchor="middle" fill="var(--c-text-dim)">
        ?
      </text>
      <text x={182} y={92} textAnchor="middle" fill="var(--c-warn)">
        {t.fn}
      </text>

      {/* Formulas */}
      <text x={VIEW_W / 2} y={122} textAnchor="middle" fill="var(--c-text-dim)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.precision}
      </text>
      <text x={VIEW_W / 2} y={138} textAnchor="middle" fill="var(--c-text-dim)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.recall}
      </text>
    </svg>
  );

  const misleading = (
    <svg
      width="100%"
      height={VIEW_H}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}
    >
      {/* Four GTs; only the first is detected (conservative model). */}
      {/* Detected GT = TP */}
      <rect x={14} y={30} width={42} height={36} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <rect
        data-role="tp"
        x={20}
        y={36}
        width={40}
        height={34}
        fill="var(--c-pred-a)"
        fillOpacity={0.2}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />

      {/* Three missed GTs = FN */}
      {[68, 118, 168].map((gx) => (
        <g key={gx} data-role="fn">
          <rect x={gx} y={30} width={42} height={36} fill="none" stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="6 4" />
          <text x={gx + 21} y={52} textAnchor="middle" fill="var(--c-text-dim)">
            ?
          </text>
        </g>
      ))}

      <text x={VIEW_W / 2} y={92} textAnchor="middle" fill="var(--c-warn)">
        3 × FN
      </text>
      <text x={VIEW_W / 2} y={118} textAnchor="middle" fill="var(--c-pred-a)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.p}
      </text>
      <text x={VIEW_W / 2} y={134} textAnchor="middle" fill="var(--c-warn)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.r}
      </text>
    </svg>
  );

  return (
    <TwoPanelFigure
      strings={{
        aria: t.aria,
        typicalTag: t.typicalTag,
        misleadingTag: t.misleadingTag,
        misleadingCaption: t.misleadingCaption,
      }}
      typical={typical}
      misleading={misleading}
    />
  );
}

export default DetConfusionFigure;
