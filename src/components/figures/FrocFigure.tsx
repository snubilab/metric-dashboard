/**
 * FrocFigure (v2) — the FROC sensitivity/FP trade-off, shown in two panels.
 *
 * Panel 1 (typical): an example FROC curve over the LUNA16 operating points,
 * illustrating sensitivity versus false positives per scan.
 *
 * Panel 2 (misleading): a curve whose sensitivity only reaches ~1.0 at the
 * far-right, very high FP/scan operating point. Claiming "sensitivity 1.0" is
 * meaningless unless you accept an enormous false-positive rate.
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
    aria: "FROC 곡선의 민감도 대 스캔당 오탐 개념과, 민감도 1.0이 엄청난 오탐에서만 달성되는 오해 사례를 함께 보여주는 그림.",
    typicalTag: "정상 예시",
    misleadingTag: "오해 사례",
    typicalCaption: "민감도 vs 스캔당 오탐(FP)",
    label: "민감도 1.0 @ FP=8",
    misleadingCaption: "민감도 1.0은 엄청난 거짓양성을 허용해야만 달성",
  },
  en: {
    aria: "FROC sensitivity versus false positives per scan, plus a misleading case where sensitivity 1.0 is reached only at an enormous false-positive rate.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    typicalCaption: "sensitivity vs FP per scan",
    label: "sensitivity 1.0 @ FP=8",
    misleadingCaption: "Sensitivity 1.0 is only reached by allowing huge false positives",
  },
} as const;

/** A static FROC sample rising sanely across the LUNA16 operating points. */
const SAMPLE_POINTS: FROCPoint[] = [
  { fpPerScan: 0.125, sensitivity: 0.45 },
  { fpPerScan: 0.25, sensitivity: 0.58 },
  { fpPerScan: 0.5, sensitivity: 0.68 },
  { fpPerScan: 1, sensitivity: 0.78 },
  { fpPerScan: 2, sensitivity: 0.86 },
  { fpPerScan: 4, sensitivity: 0.92 },
  { fpPerScan: 8, sensitivity: 0.96 },
];

/** Sensitivity stays low until it spikes to ~1.0 only at the far-right FP. */
const SPIKE_POINTS: FROCPoint[] = [
  { fpPerScan: 0.125, sensitivity: 0.3 },
  { fpPerScan: 0.25, sensitivity: 0.36 },
  { fpPerScan: 0.5, sensitivity: 0.42 },
  { fpPerScan: 1, sensitivity: 0.5 },
  { fpPerScan: 2, sensitivity: 0.6 },
  { fpPerScan: 4, sensitivity: 0.75 },
  { fpPerScan: 8, sensitivity: 1 },
];

const CHART_W = 220;
const CHART_H = 150;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };
const FP_MIN = 0.125;
const FP_MAX = 8;

export function FrocFigure() {
  const { lang } = useLang();
  const t = L[lang];

  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
  const x = logScale([FP_MIN, FP_MAX], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);

  const typical = (
    <div style={{ display: "inline-block" }}>
      <FROCCurve points={SAMPLE_POINTS} width={CHART_W} height={CHART_H} />
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

  const misleading = (
    <div style={{ position: "relative", display: "inline-block" }}>
      <FROCCurve points={SPIKE_POINTS} width={CHART_W} height={CHART_H} />
      <svg
        data-role="spike-overlay"
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {/* Mark the sensitivity=1.0 point reached only at the highest FP. */}
        <circle data-role="spike-point" cx={x(FP_MAX)} cy={y(1)} r={5} fill="var(--c-warn)" />
        <text
          x={x(FP_MAX) - 6}
          y={y(1) + 14}
          textAnchor="end"
          fill="var(--c-warn)"
          style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
        >
          {t.label}
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

export default FrocFigure;
