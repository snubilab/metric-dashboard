/**
 * PrCurveFigure (v2) — average precision (AP), shown in two panels.
 *
 * Panel 1 (typical): an example precision-recall curve with the area under it
 * shaded in the Pred-A token, since AP is exactly that area.
 *
 * Panel 2 (misleading): two PR curves with nearly the same AP (area) but very
 * different usable behavior — one holds high precision across recall, the other
 * is poor at every useful confidence and only "catches up" in area near the
 * extremes. Similar AP can hide a much worse operating curve.
 *
 * Reuses the shared <PRCurve> chart with static samples. Tokens only; bilingual
 * via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { PRCurve } from "../charts/PRCurve";
import type { PRPoint } from "../charts/PRCurve";
import { linearScale } from "../charts/scale";
import { TwoPanelFigure } from "./detPanels";

const L = {
  ko: {
    aria: "평균 정밀도(AP)는 PR 곡선 아래 면적이라는 개념과, AP가 비슷해도 실제 운용 성능은 다를 수 있다는 오해 사례를 함께 보여주는 그림.",
    typicalTag: "정상 예시",
    misleadingTag: "오해 사례",
    typicalCaption: "AP = PR 곡선 아래 면적",
    good: "운용 양호",
    bad: "운용 불량",
    misleadingCaption: "AP가 비슷해도 실제 운용점 성능은 다를 수 있음",
  },
  en: {
    aria: "Average precision (AP) as the area under the PR curve, plus a misleading case where two curves share a similar AP but behave very differently in use.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    typicalCaption: "AP = area under the PR curve",
    good: "usable",
    bad: "poor in use",
    misleadingCaption: "Similar AP can still mean different real operating-point performance",
  },
} as const;

/** A static, monotonically-stepping-down sample PR curve. */
const SAMPLE_POINTS: PRPoint[] = [
  { recall: 0, precision: 1 },
  { recall: 0.2, precision: 0.97 },
  { recall: 0.4, precision: 0.92 },
  { recall: 0.6, precision: 0.83 },
  { recall: 0.8, precision: 0.68 },
  { recall: 1, precision: 0.45 },
];

/** Curve A: high precision held across most of the recall range (usable). */
const GOOD_POINTS: PRPoint[] = [
  { recall: 0, precision: 0.95 },
  { recall: 0.3, precision: 0.93 },
  { recall: 0.6, precision: 0.88 },
  { recall: 0.8, precision: 0.78 },
  { recall: 0.9, precision: 0.5 },
  { recall: 1, precision: 0.1 },
];

/** Curve B: similar area, but precision is poor across every useful confidence. */
const BAD_POINTS: PRPoint[] = [
  { recall: 0, precision: 1 },
  { recall: 0.2, precision: 0.55 },
  { recall: 0.45, precision: 0.5 },
  { recall: 0.7, precision: 0.52 },
  { recall: 0.9, precision: 0.56 },
  { recall: 1, precision: 0.55 },
];

// Mirror the geometry baked into <PRCurve> so the shading aligns with the curve.
const CHART_W = 220;
const CHART_H = 150;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };

function buildAreaPath(points: PRPoint[]): string {
  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
  const x = linearScale([0, 1], [MARGIN.left, MARGIN.left + plotW]);
  const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
  const baseline = y(0);
  const top = points.map((p) => `${x(p.recall)},${y(p.precision)}`).join(" L ");
  const firstX = x(points[0].recall);
  const lastX = x(points[points.length - 1].recall);
  return `M ${firstX},${baseline} L ${top} L ${lastX},${baseline} Z`;
}

export function PrCurveFigure() {
  const { lang } = useLang();
  const t = L[lang];

  const typical = (
    <div style={{ position: "relative", display: "inline-block" }}>
      <PRCurve points={SAMPLE_POINTS} width={CHART_W} height={CHART_H} />
      <svg
        data-role="auc-overlay"
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <path
          data-role="auc-area"
          d={buildAreaPath(SAMPLE_POINTS)}
          fill="var(--c-pred-a)"
          fillOpacity={0.2}
          stroke="none"
        />
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

  const misleading = (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Base chart draws curve A (good) in Pred-A; overlay adds curve B (bad). */}
      <PRCurve points={GOOD_POINTS} width={CHART_W} height={CHART_H} />
      <svg
        data-role="compare-overlay"
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <polyline
          data-role="bad-curve"
          points={BAD_POINTS.map((p) => {
            const plotW = CHART_W - MARGIN.left - MARGIN.right;
            const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
            const x = linearScale([0, 1], [MARGIN.left, MARGIN.left + plotW]);
            const y = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
            return `${x(p.recall)},${y(p.precision)}`;
          }).join(" ")}
          fill="none"
          stroke="var(--c-warn)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text x={CHART_W - 18} y={MARGIN.top + 8} textAnchor="end" fill="var(--c-pred-a)" style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}>
          {t.good}
        </text>
        <text x={CHART_W - 18} y={MARGIN.top + 24} textAnchor="end" fill="var(--c-warn)" style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}>
          {t.bad}
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

export default PrCurveFigure;
