/**
 * ApThresholdFigure (v2) — IoU threshold effect on AP, shown in two panels.
 *
 * Panel 1 (typical): one GT overlapped by a prediction at IoU ~ 0.6 — a TP under
 * the loose 0.5 threshold (AP50) but an FP under the strict 0.75 threshold
 * (AP75). A stricter IoU threshold lowers AP.
 *
 * Panel 2 (misleading): a detector with high AP50 but low AP75. Boxes are found
 * (high AP50) yet only loosely localized, so the stricter AP75 collapses — a
 * high AP50 alone hides sloppy localization.
 *
 * Static, non-interactive SVG panels. Tokens only; bilingual via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { TwoPanelFigure } from "./detPanels";

const L = {
  ko: {
    aria: "IoU 기준이 AP에 미치는 영향 개념과, AP50은 높지만 AP75는 낮아 위치추정이 느슨한 오해 사례를 함께 보여주는 그림.",
    typicalTag: "정상 예시",
    misleadingTag: "오해 사례",
    iou: "IoU ≈ 0.6",
    tp50: "AP50: TP",
    fp75: "AP75: FP",
    ap50: "AP50 0.82",
    ap75: "AP75 0.31",
    misleadingCaption: "AP50은 높아도 AP75는 낮음 — 위치추정이 느슨",
  },
  en: {
    aria: "How the IoU threshold affects AP, plus a misleading case where AP50 is high but AP75 is low due to loose localization.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    iou: "IoU ≈ 0.6",
    tp50: "AP50: TP",
    fp75: "AP75: FP",
    ap50: "AP50 0.82",
    ap75: "AP75 0.31",
    misleadingCaption: "AP50 high but AP75 low — loose localization",
  },
} as const;

const VIEW_W = 220;
const VIEW_H = 150;

export function ApThresholdFigure() {
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
      {/* Ground-truth box */}
      <rect data-role="gt" x={40} y={36} width={86} height={64} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <text x={83} y={28} textAnchor="middle" fill="var(--c-gt-text)">
        GT
      </text>

      {/* Prediction overlapping at IoU ~ 0.6 */}
      <rect
        data-role="pred"
        x={76}
        y={58}
        width={86}
        height={64}
        fill="var(--c-pred-a)"
        fillOpacity={0.18}
        stroke="var(--c-pred-a)"
        strokeWidth={2.5}
      />
      <text x={118} y={118} textAnchor="middle" fill="var(--c-pred-a-text)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.iou}
      </text>

      {/* Loose vs strict outcome */}
      <g data-role="loose">
        <circle cx={172} cy={50} r={5} fill="var(--c-pred-a)" />
        <text x={182} y={54} fill="var(--c-pred-a-text)">
          {t.tp50}
        </text>
      </g>
      <g data-role="strict">
        <circle cx={172} cy={74} r={5} fill="var(--c-warn)" />
        <text x={182} y={78} fill="var(--c-warn-text)">
          {t.fp75}
        </text>
      </g>
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
      {/* Two bars contrasting AP50 (high) vs AP75 (low). */}
      {/* AP50 — tall, Pred-A */}
      <rect data-role="ap50-bar" x={48} y={30} width={44} height={78} fill="var(--c-pred-a)" fillOpacity={0.85} />
      <text x={70} y={24} textAnchor="middle" fill="var(--c-pred-a-text)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.ap50}
      </text>

      {/* AP75 — short, warn */}
      <rect data-role="ap75-bar" x={128} y={78} width={44} height={30} fill="var(--c-warn)" fillOpacity={0.85} />
      <text x={150} y={72} textAnchor="middle" fill="var(--c-warn-text)" style={{ fontFamily: "var(--font-mono)" }}>
        {t.ap75}
      </text>

      {/* Baseline */}
      <line x1={30} y1={108} x2={190} y2={108} stroke="var(--c-border)" strokeWidth={1.5} />
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

export default ApThresholdFigure;
