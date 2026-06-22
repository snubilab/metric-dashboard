/**
 * Hd95Figure — two panels illustrating HD95's defining behavior: it uses the
 * 95th-percentile boundary distance, NOT the maximum, so it is robust to a single
 * stray outlier. Panel 1 ("typical"): the 95th-percentile boundary distance (a
 * near-worst, not the absolute max). Panel 2 ("robust"): the SAME far outlier that
 * spikes HD lands in the discarded top 5%, so HD95 trims it and stays low — the
 * mirror of HausdorffFigure, where that outlier dominates. Static.
 *
 * This is HD95's own figure (HD reuses HausdorffFigure): HD = worst-case point,
 * HD95 = robust near-worst-case, matching the HD95 card and the ASSD pairing.
 */

import { useLang } from "../../i18n/LanguageContext";
import { SvgPanelCaption } from "./detPanels";

const L = {
  ko: {
    aria:
      "HD95 예시: 95퍼센타일 경계 거리, 그리고 멀리 떨어진 이상점을 상위 5%로 잘라내 HD95가 낮게 유지되는 사례",
    typical: "정상 예시",
    robust: "강건성",
    gt: "정답(GT)",
    pred: "예측",
    pct: "95퍼센타일",
    caption: "HD95 = 95퍼센타일 경계 거리 (최댓값이 아님)",
    robustCaption: "이상점은 상위 5%로 잘려 HD95는 낮게 유지됨 — HD라면 치솟음",
    outlier: "이상점 (상위 5% 제외)",
    kept: "HD95",
  },
  en: {
    aria:
      "HD95 example: the 95th-percentile boundary distance, and a far outlier trimmed as the top 5% so HD95 stays low",
    typical: "typical",
    robust: "robust",
    gt: "GT",
    pred: "Pred",
    pct: "95th pct",
    caption: "HD95 = 95th-percentile boundary distance (not the max)",
    robustCaption: "The outlier is trimmed as the top 5%, so HD95 stays low — HD would spike",
    outlier: "outlier (top 5% trimmed)",
    kept: "HD95",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 234;
const PANEL_W = WIDTH / 2;
const PANEL_CX = PANEL_W / 2;
const TAG_Y = 22;
const CAPTION_Y = HEIGHT - 12;
const CAPTION_MAX_W = PANEL_W - 12;

export default function Hd95Figure() {
  const { lang } = useLang();
  const t = L[lang];
  const arrowId = "hd95-arrow";

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

      <line x1={PANEL_W} y1={14} x2={PANEL_W} y2={HEIGHT - 22} stroke="var(--c-border)" strokeWidth={1} />

      {/* ----- Panel 1: the 95th-percentile distance (near-worst, not the max) ----- */}
      <text x={PANEL_CX} y={TAG_Y} fill="var(--c-text-dim)" textAnchor="middle">
        {t.typical}
      </text>
      <g transform={`translate(${PANEL_CX}, 92)`}>
        <path
          d="M -52 4 C -52 -26, -20 -32, -2 -20 C 16 -8, 12 22, -8 28 C -32 36, -52 22, -52 4 Z"
          fill="var(--c-gt)"
          fillOpacity={0.1}
          stroke="var(--c-gt)"
          strokeWidth={2}
        />
        <path
          d="M -24 6 C -24 -28, 24 -38, 50 -16 C 70 0, 60 30, 32 36 C 0 42, -24 28, -24 6 Z"
          fill="var(--c-pred-a)"
          fillOpacity={0.1}
          stroke="var(--c-pred-a)"
          strokeWidth={2}
        />
        {/* A moderate 95th-percentile distance (shorter than HD's full reach) */}
        <line x1={-50} y1={-2} x2={20} y2={-12} stroke="var(--c-text-dim)" strokeWidth={2} markerEnd={`url(#${arrowId})`} />
        <circle cx={-50} cy={-2} r={3} fill="var(--c-text-dim)" />
        <text x={-14} y={-22} fill="var(--c-gt-text)" textAnchor="middle">
          {t.pct}
        </text>
        <text x={-46} y={44} fill="var(--c-gt-text)" textAnchor="middle">
          {t.gt}
        </text>
        <text x={42} y={50} fill="var(--c-pred-a-text)" textAnchor="middle">
          {t.pred}
        </text>
      </g>
      <SvgPanelCaption text={t.caption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-text-dim)" />

      {/* ----- Panel 2: robust — the far outlier is trimmed (top 5%) ----- */}
      <g transform={`translate(${PANEL_W}, 0)`} data-role="robust">
        <text x={PANEL_CX} y={TAG_Y} fill="var(--c-gt-text)" textAnchor="middle">
          {t.robust}
        </text>

        <g transform={`translate(${PANEL_CX}, 92)`}>
          {/* Near-perfect overlap of GT and prediction */}
          <circle cx={-14} cy={8} r={34} fill="var(--c-gt)" fillOpacity={0.14} stroke="var(--c-gt)" strokeWidth={2} />
          <circle cx={-12} cy={8} r={34} fill="var(--c-pred-a)" fillOpacity={0.18} stroke="var(--c-pred-a)" strokeWidth={2} />
          {/* HD95 measures a NEAR boundary point (the 95th percentile), staying low */}
          <line x1={-12} y1={4} x2={18} y2={-6} stroke="var(--c-gt-text)" strokeWidth={2} markerEnd={`url(#${arrowId})`} />
          <text x={6} y={-14} fill="var(--c-gt-text)" textAnchor="middle" fontSize="9">
            {t.kept}
          </text>
          {/* The far outlier — DIMMED and dashed: it falls in the discarded top 5% */}
          <rect x={56} y={-44} width={9} height={9} fill="var(--c-text-dim)" fillOpacity={0.4} stroke="var(--c-text-dim)" strokeWidth={1} strokeDasharray="2 2" />
          <line x1={56} y1={-40} x2={65} y2={-31} stroke="var(--c-text-dim)" strokeWidth={1} />
          <line x1={65} y1={-44} x2={56} y2={-35} stroke="var(--c-text-dim)" strokeWidth={1} />
          <text x={60} y={-50} fill="var(--c-text-dim)" textAnchor="middle" fontSize="9">
            {t.outlier}
          </text>
        </g>
        <SvgPanelCaption text={t.robustCaption} x={PANEL_CX} y={CAPTION_Y} maxWidth={CAPTION_MAX_W} fill="var(--c-gt-text)" />
      </g>
    </svg>
  );
}
