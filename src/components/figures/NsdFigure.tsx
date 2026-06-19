/**
 * NsdFigure — one static example of the Normalized Surface Dice tolerance band.
 *
 * A single boundary is drawn with a shaded tolerance band of width tau around
 * it. Boundary sample points that fall inside the band count as OK (GT color);
 * the few that stray outside count against NSD (warn color). Caption: NSD@tau.
 * Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "NSD 예시: 허용 오차 띠(τ) 안의 경계점은 정상, 밖은 오차",
    tau: "허용 오차 τ",
    ok: "정상",
    out: "초과",
    caption: "NSD@τ = 띠 안 경계점 비율",
  },
  en: {
    aria: "NSD example: boundary points inside the tolerance band tau count as OK",
    tau: "tolerance τ",
    ok: "in band",
    out: "outside",
    caption: "NSD@τ = fraction of boundary in band",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const TAU = 14; // half-width of the tolerance band in svg units

/** Reference boundary y at a given x — a gentle curve centered vertically. */
function boundaryY(x: number): number {
  return 78 + 22 * Math.sin((x - 40) / 70);
}

function curvePoints(offset: number): string {
  const pts: string[] = [];
  for (let x = 36; x <= 284; x += 8) {
    pts.push(`${x},${(boundaryY(x) + offset).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Sample boundary points; `dy` nudges a point off the boundary for OK/outside. */
const SAMPLES: { x: number; dy: number }[] = [
  { x: 60, dy: 4 },
  { x: 96, dy: -6 },
  { x: 132, dy: 20 }, // strays outside the band
  { x: 168, dy: -5 },
  { x: 204, dy: 7 },
  { x: 240, dy: -22 }, // strays outside the band
  { x: 268, dy: 3 },
];

export default function NsdFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      {/* Tolerance band: area between the boundary offset by +/- tau */}
      <polygon
        points={`${curvePoints(-TAU)} ${curvePoints(TAU)
          .split(" ")
          .reverse()
          .join(" ")}`}
        fill="var(--c-gt)"
        fillOpacity={0.14}
        stroke="var(--c-text-dim)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* The reference boundary */}
      <polyline points={curvePoints(0)} fill="none" stroke="var(--c-text)" strokeWidth={2} />

      {/* Boundary sample points: inside the band -> OK, outside -> warn */}
      {SAMPLES.map((s) => {
        const inBand = Math.abs(s.dy) <= TAU;
        return (
          <circle
            key={s.x}
            cx={s.x}
            cy={boundaryY(s.x) + s.dy}
            r={4}
            fill={inBand ? "var(--c-gt)" : "var(--c-warn)"}
            stroke="var(--c-surface)"
            strokeWidth={1}
          />
        );
      })}

      {/* tau callout near the band edge */}
      <text x={300} y={boundaryY(284) - TAU - 4} fill="var(--c-text-dim)" textAnchor="end">
        {t.tau}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 12} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
