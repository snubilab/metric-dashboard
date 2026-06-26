/**
 * PrCurveFigure (v2) — average precision (AP), shown in two panels.
 *
 * Panel 1 (typical): a raw precision-recall sample drawn as a faint saw-tooth,
 * with the COCO-style max-interpolated monotone envelope laid on top. The shaded
 * area follows the envelope (Pred-A token), since AP is computed by the engine as
 * the area under the *interpolated* curve, not the raw wiggly samples.
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
    typicalCaption: "AP ≈ 보간된 PR 곡선 아래 면적",
    good: "곡선 A",
    bad: "곡선 B",
    misleadingCaption: "AP가 비슷해도 실제 운용점 성능은 다를 수 있음",
  },
  en: {
    aria: "Average precision (AP) as the area under the PR curve, plus a misleading case where two curves share a similar AP but behave very differently in use.",
    typicalTag: "typical",
    misleadingTag: "misleading",
    typicalCaption: "AP ≈ area under the INTERPOLATED PR curve",
    good: "curve A",
    bad: "curve B",
    misleadingCaption: "Similar AP can hide very different operating-point behavior",
  },
} as const;

/**
 * A static RAW precision-recall sample that wiggles (saw-tooth): precision does
 * not fall monotonically as recall grows, exactly the messy shape a real scan of
 * confidence thresholds produces.
 */
const SAMPLE_POINTS: PRPoint[] = [
  { recall: 0, precision: 1 },
  { recall: 0.1, precision: 0.85 },
  { recall: 0.2, precision: 0.95 },
  { recall: 0.3, precision: 0.78 },
  { recall: 0.4, precision: 0.88 },
  { recall: 0.5, precision: 0.7 },
  { recall: 0.6, precision: 0.8 },
  { recall: 0.7, precision: 0.6 },
  { recall: 0.8, precision: 0.68 },
  { recall: 0.9, precision: 0.45 },
  { recall: 1, precision: 0.5 },
];

/**
 * COCO-style max interpolation: at each recall, precision is the maximum over all
 * raw points with recall >= the current one. Sweeping from the right yields the
 * monotone non-increasing envelope the AP engine actually integrates.
 */
function maxInterpolate(points: PRPoint[]): PRPoint[] {
  let runningMax = 0;
  const reversed = [...points]
    .slice()
    .reverse()
    .map((p) => {
      runningMax = Math.max(runningMax, p.precision);
      return { recall: p.recall, precision: runningMax };
    });
  return reversed.reverse();
}

/** The max-interpolated monotone envelope that the AP area follows. */
const ENVELOPE_POINTS: PRPoint[] = maxInterpolate(SAMPLE_POINTS);

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

  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
  const xScale = linearScale([0, 1], [MARGIN.left, MARGIN.left + plotW]);
  const yScale = linearScale([0, 1], [MARGIN.top + plotH, MARGIN.top]);
  const envelopePolyline = ENVELOPE_POINTS.map(
    (p) => `${xScale(p.recall)},${yScale(p.precision)}`,
  ).join(" ");

  const typical = (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Base chart draws the raw saw-tooth sample; faded so the envelope reads. */}
      <div style={{ opacity: 0.4 }}>
        <PRCurve points={SAMPLE_POINTS} width={CHART_W} height={CHART_H} />
      </div>
      <svg
        data-role="auc-overlay"
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {/* AP = area under the max-interpolated envelope, not the raw samples. */}
        <path
          data-role="auc-area"
          d={buildAreaPath(ENVELOPE_POINTS)}
          fill="var(--c-pred-a)"
          fillOpacity={0.2}
          stroke="none"
        />
        {/* The monotone envelope drawn crisply on top of the faded saw-tooth. */}
        <polyline
          data-role="interp-envelope"
          points={envelopePolyline}
          fill="none"
          stroke="var(--c-pred-a)"
          strokeWidth={2}
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
          data-role="curve-b"
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
        <text x={CHART_W - 18} y={MARGIN.top + 8} textAnchor="end" fill="var(--c-pred-a-text)" style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}>
          {t.good}
        </text>
        <text x={CHART_W - 18} y={MARGIN.top + 24} textAnchor="end" fill="var(--c-warn-text)" style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}>
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
