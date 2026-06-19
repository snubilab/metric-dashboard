/**
 * MatchingFigure — one concrete example of one-to-one detection matching.
 *
 * A ground-truth box (left) is overlapped by two predictions: the best-matching
 * prediction (IoU >= 0.5) is the true positive, while the second, duplicate
 * prediction on the same GT is counted as a false positive. A separate GT box
 * (right) has no matching prediction and is therefore a false negative. This
 * illustrates that each GT can claim at most one prediction.
 *
 * Static, non-interactive SVG. Tokens only; bilingual labels via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "탐지 매칭 예시: 정답 박스 하나에 매칭된 예측은 TP, 같은 정답에 겹친 중복 예측은 FP, 매칭되지 않은 정답은 FN.",
    gt: "정답(GT)",
    tp: "TP (IoU≥0.5)",
    fp: "FP (중복)",
    fn: "FN (놓침)",
    caption: "정답 하나당 예측 하나 — 1:1 매칭",
  },
  en: {
    aria: "Detection matching example: a prediction matched to a GT box is a TP, a duplicate prediction on the same GT is an FP, and an unmatched GT is an FN.",
    gt: "GT",
    tp: "TP (IoU≥0.5)",
    fp: "FP (duplicate)",
    fn: "FN (missed)",
    caption: "One prediction per GT — one-to-one matching",
  },
} as const;

export function MatchingFigure() {
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
      {/* --- Left scene: a GT box with a matched TP and a duplicate FP --- */}
      {/* Ground-truth box */}
      <rect
        data-role="gt"
        x={50}
        y={40}
        width={90}
        height={70}
        fill="none"
        stroke="var(--c-gt)"
        strokeWidth={2.5}
      />
      <text x={95} y={32} textAnchor="middle" fill="var(--c-gt)">
        {t.gt}
      </text>

      {/* Matched prediction (TP) — high overlap with the GT */}
      <rect
        data-role="tp"
        x={62}
        y={50}
        width={86}
        height={66}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />
      <text x={105} y={132} textAnchor="middle" fill="var(--c-pred-a)">
        {t.tp}
      </text>

      {/* Duplicate prediction on the same GT (FP) */}
      <rect
        data-role="fp"
        x={108}
        y={64}
        width={70}
        height={56}
        fill="var(--c-warn)"
        fillOpacity={0.14}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text x={188} y={150} textAnchor="middle" fill="var(--c-warn)">
        {t.fp}
      </text>

      {/* --- Right scene: an unmatched GT (FN) --- */}
      <rect
        data-role="fn"
        x={330}
        y={48}
        width={90}
        height={70}
        fill="none"
        stroke="var(--c-warn)"
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      <text x={375} y={40} textAnchor="middle" fill="var(--c-warn)">
        {t.fn}
      </text>
      <text x={375} y={92} textAnchor="middle" fill="var(--c-text-dim)">
        ?
      </text>

      {/* Caption */}
      <text x={240} y={166} textAnchor="middle" fill="var(--c-text-dim)">
        {t.caption}
      </text>
    </svg>
  );
}

export default MatchingFigure;
