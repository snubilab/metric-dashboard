/**
 * SensAtFpFigure (v2) — sensitivity at a fixed FP, shown in two panels.
 *
 * Panel 1 (typical): the shared <FROCCurve> with a highlighted vertical guide at
 * a fixed operating point (4 FP/image) and the sensitivity read off where the
 * guide meets the curve — sensitivity at a fixed false-positive rate.
 *
 * Panel 2 (misleading): the SAME sensitivity value reported at two very
 * different FP levels (e.g. 0.5 vs 8 FP/scan). A sensitivity quoted without its
 * FP level is meaningless.
 *
 * Reuses the shared <FROCCurve> chart with static samples. Tokens only;
 * bilingual via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { FROCCurve } from "../charts/FROCCurve";
import type { FROCPoint } from "../charts/FROCCurve";
import { linearScale, logScale } from "../charts/scale";
import { TwoPanelFigure } from "./detPanels";

const L = {
  ko: {
    aria: "고정 FP에서의 민감도 개념과, 같은 민감도가 서로 다른 FP 수준에서 보고되는 오해 사례를 함께 보여주는 그림.",
    typicalTag: "정상 예시",
    misleadingTag: "오해 사례",
    fpLabel: "FP=4",
    typicalCaption: "고정 FP에서의 민감도 (sensitivity @ fixed FP)",
    same: "민감도 0.8",
    lowFp: "@ FP=0.5",
    highFp: "@ FP=8",
    misleadingCaption: "FP 수준을 함께 말하지 않은 민감도는 무의미",
  },
  en: {
    aria: "Sensitivity at a fixed FP, plus a misleading case where the same sensitivity is reported at two very different FP levels.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    fpLabel: "FP=4",
    typicalCaption: "sensitivity @ fixed FP",
    same: "sensitivity 0.8",
    lowFp: "@ FP=0.5",
    highFp: "@ FP=8",
    misleadingCaption: "A sensitivity reported without its FP level is meaningless",
  },
} as const;

/** A static FROC sample rising across the LUNA16 operating points. */
const SAMPLE_POINTS: FROCPoint[] = [
  { fpPerScan: 0.125, sensitivity: 0.45 },
  { fpPerScan: 0.25, sensitivity: 0.58 },
  { fpPerScan: 0.5, sensitivity: 0.68 },
  { fpPerScan: 1, sensitivity: 0.78 },
  { fpPerScan: 2, sensitivity: 0.86 },
  { fpPerScan: 4, sensitivity: 0.92 },
  { fpPerScan: 8, sensitivity: 0.96 },
];

/** The fixed false-positive-per-image operating point read off. */
const FIXED_FP = 4;
const SENS_AT_FIXED_FP = 0.92;

// Mirror the geometry baked into <FROCCurve> so the overlay aligns.
const CHART_W = 220;
const CHART_H = 150;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };
const FP_MIN = 0.125;
const FP_MAX = 8;

/** The single sensitivity value that the misleading panel quotes twice. */
const SAME_SENS = 0.8;
const LOW_FP = 0.5;
const HIGH_FP = 8;

export function SensAtFpFigure() {
  const { lang } = useLang();
  const t = L[lang];

  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
  const x = logScale([FP_MIN, FP_MAX], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
  const guideX = x(FIXED_FP);
  const pointY = y(SENS_AT_FIXED_FP);

  const typical = (
    <div style={{ position: "relative", display: "inline-block" }}>
      <FROCCurve points={SAMPLE_POINTS} width={CHART_W} height={CHART_H} />
      <svg
        data-role="readoff-overlay"
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <line
          data-role="fp-guide"
          x1={guideX}
          y1={MARGIN.top}
          x2={guideX}
          y2={MARGIN.top + plotH}
          stroke="var(--c-warn)"
          strokeWidth={2}
        />
        <line
          x1={MARGIN.left}
          y1={pointY}
          x2={guideX}
          y2={pointY}
          stroke="var(--c-warn)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <circle data-role="readoff-point" cx={guideX} cy={pointY} r={4} fill="var(--c-warn)" />
        <text
          x={guideX}
          y={MARGIN.top - 4}
          textAnchor="middle"
          fill="var(--c-warn)"
          style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
        >
          {t.fpLabel}
        </text>
      </svg>
      <figcaption
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--c-text-dim)",
          textAlign: "center",
        }}
      >
        {t.typicalCaption}
      </figcaption>
    </div>
  );

  const sameY = y(SAME_SENS);
  const lowX = x(LOW_FP);
  const highX = x(HIGH_FP);

  const misleading = (
    <div style={{ position: "relative", display: "inline-block" }}>
      <FROCCurve points={SAMPLE_POINTS} width={CHART_W} height={CHART_H} />
      <svg
        data-role="ambiguous-overlay"
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {/* One sensitivity level, two wildly different FP read-offs. */}
        <line
          data-role="same-sens"
          x1={MARGIN.left}
          y1={sameY}
          x2={MARGIN.left + plotW}
          y2={sameY}
          stroke="var(--c-warn)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <circle data-role="fp-low" cx={lowX} cy={sameY} r={4} fill="var(--c-warn)" />
        <circle data-role="fp-high" cx={highX} cy={sameY} r={4} fill="var(--c-warn)" />
        <text x={lowX} y={sameY - 6} textAnchor="middle" fill="var(--c-warn)" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
          {t.lowFp}
        </text>
        <text x={highX} y={sameY - 6} textAnchor="end" fill="var(--c-warn)" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
          {t.highFp}
        </text>
        <text x={MARGIN.left + plotW / 2} y={MARGIN.top + 4} textAnchor="middle" fill="var(--c-warn)" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
          {t.same}
        </text>
      </svg>
    </div>
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

export default SensAtFpFigure;
