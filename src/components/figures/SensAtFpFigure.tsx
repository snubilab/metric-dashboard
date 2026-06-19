/**
 * SensAtFpFigure — sensitivity read off a FROC curve at a fixed FP/image.
 *
 * The shared <FROCCurve> draws a static sample; an overlay SVG of identical
 * geometry adds a highlighted vertical guide at a fixed operating point (4
 * FP/image) and marks the sensitivity where the guide meets the curve. The
 * caption states the metric: sensitivity at a fixed false-positive rate.
 *
 * Static, non-interactive. Tokens only; bilingual labels via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { FROCCurve } from "../charts/FROCCurve";
import type { FROCPoint } from "../charts/FROCCurve";
import { linearScale, logScale } from "../charts/scale";

const L = {
  ko: {
    aria: "FROC 곡선에서 고정된 스캔당 오탐 4에 세로 안내선을 두고, 그 지점의 민감도를 읽어 표시한 예시.",
    fpLabel: "FP=4",
    caption: "고정 FP에서의 민감도 (sensitivity @ fixed FP)",
  },
  en: {
    aria: "FROC curve with a vertical guide at a fixed 4 false positives per image, marking the sensitivity read off at that point.",
    fpLabel: "FP=4",
    caption: "sensitivity @ fixed FP",
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
const CHART_W = 360;
const CHART_H = 150;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };
const FP_MIN = 0.125;
const FP_MAX = 8;

export function SensAtFpFigure() {
  const { lang } = useLang();
  const t = L[lang];

  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
  const x = logScale([FP_MIN, FP_MAX], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
  const guideX = x(FIXED_FP);
  const pointY = y(SENS_AT_FIXED_FP);

  return (
    <figure
      role="img"
      aria-label={t.aria}
      style={{ margin: 0, width: "100%", textAlign: "center" }}
    >
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
          {/* Highlighted vertical guide at the fixed FP/image */}
          <line
            data-role="fp-guide"
            x1={guideX}
            y1={MARGIN.top}
            x2={guideX}
            y2={MARGIN.top + plotH}
            stroke="var(--c-warn)"
            strokeWidth={2}
          />
          {/* Horizontal read-off from the curve to the y-axis */}
          <line
            x1={MARGIN.left}
            y1={pointY}
            x2={guideX}
            y2={pointY}
            stroke="var(--c-warn)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {/* Sensitivity read-off point where guide meets the curve */}
          <circle
            data-role="readoff-point"
            cx={guideX}
            cy={pointY}
            r={4}
            fill="var(--c-warn)"
          />
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
      </div>
      <figcaption
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--c-text-dim)",
        }}
      >
        {t.caption}
      </figcaption>
    </figure>
  );
}

export default SensAtFpFigure;
