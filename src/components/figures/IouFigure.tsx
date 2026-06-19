/**
 * IouFigure — one static example of Intersection-over-Union (Jaccard).
 *
 * Two overlapping circles; the lens intersection is shaded while the full union
 * is outlined with a dashed dim contour, so the ratio intersection / union reads
 * at a glance. A small mono caption states IoU = intersection / union. Static.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "IoU 예시: 교집합(음영)과 합집합(외곽선)",
    intersection: "교집합",
    union: "합집합",
    caption: "IoU = 교집합 / 합집합",
  },
  en: {
    aria: "IoU example: intersection shaded versus union outlined",
    intersection: "intersection",
    union: "union",
    caption: "IoU = intersection / union",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const GT_CX = 132;
const PRED_CX = 197;
const CY = 74;
const R = 50;

export default function IouFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const clipId = "iou-intersection-clip";

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={GT_CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {/* Union: both circles outlined dashed to show the combined extent */}
      <circle cx={GT_CX} cy={CY} r={R} fill="none" stroke="var(--c-text-dim)" strokeWidth={2} strokeDasharray="5 3" />
      <circle cx={PRED_CX} cy={CY} r={R} fill="none" stroke="var(--c-text-dim)" strokeWidth={2} strokeDasharray="5 3" />

      {/* Faint per-circle fills to distinguish GT and prediction */}
      <circle cx={GT_CX} cy={CY} r={R} fill="var(--c-gt)" fillOpacity={0.12} />
      <circle cx={PRED_CX} cy={CY} r={R} fill="var(--c-pred-a)" fillOpacity={0.12} />

      {/* Shaded intersection */}
      <circle cx={PRED_CX} cy={CY} r={R} fill="var(--c-warn)" fillOpacity={0.45} clipPath={`url(#${clipId})`} />

      {/* Labels */}
      <text x={(GT_CX + PRED_CX) / 2} y={CY + 4} fill="var(--c-text)" textAnchor="middle">
        {t.intersection}
      </text>
      <text x={WIDTH / 2} y={CY - R - 6} fill="var(--c-text-dim)" textAnchor="middle">
        {t.union}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 12} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
