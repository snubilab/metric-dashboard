/**
 * HausdorffFigure — one static example of the Hausdorff distance.
 *
 * Two slightly offset closed boundaries (GT + prediction). A single long arrow
 * marks the farthest boundary-to-boundary distance — the worst case the
 * Hausdorff distance reports. A note reminds that HD95 trims the extreme 5%.
 * Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "하우스도르프 예시: 두 경계 사이 최대 거리 화살표",
    gt: "정답(GT)",
    pred: "예측",
    worst: "최대 거리",
    caption: "HD = 최악의 경계 거리 · HD95는 상위 5% 제외",
  },
  en: {
    aria: "Hausdorff example: arrow marking the single farthest boundary distance",
    gt: "GT",
    pred: "Pred",
    worst: "max distance",
    caption: "HD = worst boundary distance · HD95 trims top 5%",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;

export default function HausdorffFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const arrowId = "hd-arrow";

  // GT blob (a smooth closed curve) and a prediction blob offset to the right,
  // with a bulge at top-right that creates the single worst-case spike.
  const gtPath = "M 90 78 C 90 48, 130 42, 150 56 C 172 70, 168 104, 146 112 C 120 122, 90 108, 90 78 Z";
  const predPath = "M 116 80 C 116 46, 168 36, 196 58 C 224 80, 214 112, 186 118 C 150 126, 116 114, 116 80 Z";

  // The worst-case arrow: from a GT boundary point to the farthest prediction point.
  const fromX = 95;
  const fromY = 86;
  const toX = 218;
  const toY = 64;

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
        <marker id={arrowId} markerWidth={9} markerHeight={9} refX={7} refY={4.5} orient="auto">
          <path d="M 0 0 L 9 4.5 L 0 9 z" fill="var(--c-text-dim)" />
        </marker>
      </defs>

      {/* Boundaries */}
      <path d={gtPath} fill="var(--c-gt)" fillOpacity={0.1} stroke="var(--c-gt)" strokeWidth={2} />
      <path d={predPath} fill="var(--c-pred-a)" fillOpacity={0.1} stroke="var(--c-pred-a)" strokeWidth={2} />

      {/* The single worst-case distance arrow */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="var(--c-text-dim)"
        strokeWidth={2}
        markerEnd={`url(#${arrowId})`}
      />
      <circle cx={fromX} cy={fromY} r={3} fill="var(--c-text-dim)" />

      {/* Labels */}
      <text x={108} y={132} fill="var(--c-gt)" textAnchor="middle">
        {t.gt}
      </text>
      <text x={196} y={132} fill="var(--c-pred-a)" textAnchor="middle">
        {t.pred}
      </text>
      <text x={(fromX + toX) / 2} y={(fromY + toY) / 2 - 8} fill="var(--c-warn)" textAnchor="middle">
        {t.worst}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 10} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
