/**
 * MatchingFigure (v2) — one-to-one detection matching, shown in two panels.
 *
 * Panel 1 (typical): the correct one-to-one matching — a GT with a matched TP
 * (IoU >= 0.5) and a duplicate prediction counted as an FP, plus a second GT
 * with no prediction (FN). Each GT claims at most one prediction.
 *
 * Panel 2 (misleading): a prediction that is ALMOST right but just under the
 * IoU threshold is counted as a false positive, and a duplicate box on an
 * already-matched GT is also an FP — so visually-good boxes still hurt the
 * score.
 *
 * Static, non-interactive SVG panels. Tokens only; bilingual via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { TwoPanelFigure } from "./detPanels";

const L = {
  ko: {
    aria: "탐지 1:1 매칭 개념과, 임계값 바로 아래의 좋은 박스가 거짓양성으로 처리되는 오해 사례를 함께 보여주는 그림.",
    typicalTag: "정상 예시",
    misleadingTag: "오해 사례",
    gt: "정답(GT)",
    tp: "TP (IoU≥0.5)",
    fp: "FP (중복)",
    fn: "FN (놓침)",
    iouLow: "IoU 0.49",
    fpNear: "FP (임계값 미달)",
    fpDup: "FP (중복)",
    misleadingCaption: "임계값 바로 아래의 좋은 박스도 거짓양성 처리",
  },
  en: {
    aria: "Detection one-to-one matching concept, plus a misleading case where a good box just under the IoU threshold is counted as a false positive.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    gt: "GT",
    tp: "TP (IoU≥0.5)",
    fp: "FP (duplicate)",
    fn: "FN (missed)",
    iouLow: "IoU 0.49",
    fpNear: "FP (below threshold)",
    fpDup: "FP (duplicate)",
    misleadingCaption: "A good box just under the IoU threshold is still counted FP",
  },
} as const;

const VIEW_W = 220;
const VIEW_H = 150;

export function MatchingFigure() {
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
      {/* GT with a matched TP and a duplicate FP */}
      <rect x={18} y={42} width={78} height={60} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <text x={57} y={34} textAnchor="middle" fill="var(--c-gt)">
        {t.gt}
      </text>
      <rect
        data-role="tp"
        x={28}
        y={50}
        width={74}
        height={56}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />
      <text x={64} y={120} textAnchor="middle" fill="var(--c-pred-a)">
        {t.tp}
      </text>
      <rect
        data-role="fp"
        x={70}
        y={62}
        width={56}
        height={46}
        fill="var(--c-warn)"
        fillOpacity={0.14}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text x={132} y={134} textAnchor="middle" fill="var(--c-warn)">
        {t.fp}
      </text>

      {/* Unmatched GT (FN) */}
      <rect
        data-role="fn"
        x={158}
        y={48}
        width={48}
        height={48}
        fill="none"
        stroke="var(--c-warn)"
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      <text x={182} y={42} textAnchor="middle" fill="var(--c-warn)">
        {t.fn}
      </text>
      <text x={182} y={78} textAnchor="middle" fill="var(--c-text-dim)">
        ?
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
      {/* Left GT: prediction is almost perfect but IoU just below threshold => FP */}
      <rect x={16} y={40} width={72} height={58} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <rect
        data-role="near-miss"
        x={26}
        y={50}
        width={72}
        height={58}
        fill="var(--c-warn)"
        fillOpacity={0.14}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text x={56} y={32} textAnchor="middle" fill="var(--c-text-dim)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.iouLow}
      </text>
      <text x={56} y={122} textAnchor="middle" fill="var(--c-warn)">
        {t.fpNear}
      </text>

      {/* Right GT: already matched by a TP, a duplicate good box is also FP */}
      <rect x={134} y={40} width={66} height={58} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <rect
        x={140}
        y={46}
        width={62}
        height={54}
        fill="var(--c-pred-a)"
        fillOpacity={0.16}
        stroke="var(--c-pred-a)"
        strokeWidth={2}
      />
      <rect
        data-role="dup"
        x={150}
        y={56}
        width={58}
        height={50}
        fill="var(--c-warn)"
        fillOpacity={0.14}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text x={170} y={122} textAnchor="middle" fill="var(--c-warn)">
        {t.fpDup}
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

export default MatchingFigure;
