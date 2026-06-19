/**
 * PrCurveFigure — an example precision-recall curve with the area under it
 * shaded, since average precision (AP) is exactly that area.
 *
 * The curve is drawn by the shared <PRCurve> chart with a static sample; an
 * overlay SVG of identical geometry shades the region between the curve and the
 * recall axis. The caption states AP = area under the PR curve (the basis for
 * ap, mAP, and AP over an IoU range).
 *
 * Static, non-interactive. Tokens only; bilingual labels via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { PRCurve } from "../charts/PRCurve";
import type { PRPoint } from "../charts/PRCurve";
import { linearScale } from "../charts/scale";

const L = {
  ko: {
    aria: "정밀도-재현율 곡선 예시. 곡선 아래 면적이 음영으로 칠해져 있으며, 이 면적이 평균 정밀도(AP)임을 보여줍니다.",
    caption: "AP = PR 곡선 아래 면적",
  },
  en: {
    aria: "Example precision-recall curve with the area under the curve shaded, illustrating that average precision (AP) equals that area.",
    caption: "AP = area under the PR curve",
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

// Mirror the geometry baked into <PRCurve> so the shading aligns with the curve.
const CHART_W = 360;
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

  return (
    <figure
      role="img"
      aria-label={t.aria}
      style={{ margin: 0, width: "100%", textAlign: "center" }}
    >
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

export default PrCurveFigure;
