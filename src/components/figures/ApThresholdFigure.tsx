/**
 * ApThresholdFigure — why the IoU threshold changes AP (AP50 vs AP75).
 *
 * One GT box is overlapped by a prediction at IoU ~ 0.6. Under the loose 0.5
 * threshold the pair counts as a true positive (AP50); under the strict 0.75
 * threshold the same pair fails to match and becomes a false positive (AP75).
 * The caption contrasts the loose vs strict regimes — a stricter IoU threshold
 * lowers AP.
 *
 * Static, non-interactive SVG. Tokens only; bilingual labels via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "AP50 대 AP75 예시: IoU 약 0.6인 박스 쌍이 0.5 기준에서는 TP이지만 0.75 기준에서는 FP가 되어, 기준이 엄격해질수록 AP가 낮아짐을 보여줍니다.",
    iou: "IoU ≈ 0.6",
    tp50: "AP50: TP",
    fp75: "AP75: FP",
    caption: "AP50 (느슨) vs AP75 (엄격) — 기준↑ → AP↓",
  },
  en: {
    aria: "AP50 versus AP75 example: a box pair at IoU about 0.6 is a TP under the 0.5 threshold but an FP under the 0.75 threshold, so a stricter IoU threshold lowers AP.",
    iou: "IoU ≈ 0.6",
    tp50: "AP50: TP",
    fp75: "AP75: FP",
    caption: "AP50 (loose) vs AP75 (strict) — stricter → lower AP",
  },
} as const;

export function ApThresholdFigure() {
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
      {/* Ground-truth box */}
      <rect
        data-role="gt"
        x={150}
        y={40}
        width={110}
        height={78}
        fill="none"
        stroke="var(--c-gt)"
        strokeWidth={2.5}
      />
      <text x={205} y={32} textAnchor="middle" fill="var(--c-gt)">
        GT
      </text>

      {/* Prediction overlapping at IoU ~ 0.6 (offset down-right) */}
      <rect
        data-role="pred"
        x={196}
        y={66}
        width={110}
        height={78}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />
      <text x={252} y={138} textAnchor="middle" fill="var(--c-pred-a)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.iou}
      </text>

      {/* Loose threshold: counts as TP */}
      <g data-role="loose">
        <circle cx={356} cy={62} r={5} fill="var(--c-pred-a)" />
        <text x={368} y={66} fill="var(--c-pred-a)">
          {t.tp50}
        </text>
      </g>

      {/* Strict threshold: same pair becomes FP */}
      <g data-role="strict">
        <circle cx={356} cy={92} r={5} fill="var(--c-warn)" />
        <text x={368} y={96} fill="var(--c-warn)">
          {t.fp75}
        </text>
      </g>

      {/* Caption */}
      <text x={240} y={164} textAnchor="middle" fill="var(--c-text-dim)">
        {t.caption}
      </text>
    </svg>
  );
}

export default ApThresholdFigure;
