/**
 * FrocFigure — an example FROC curve over the LUNA16 operating points.
 *
 * The curve is drawn by the shared <FROCCurve> chart with a static sample; its
 * default vertical guides mark the seven LUNA16 false-positive-per-scan
 * operating points. The caption states the trade-off the curve encodes:
 * sensitivity versus false positives per scan.
 *
 * Static, non-interactive. Tokens only; bilingual labels via useLang().
 */

import { useLang } from "../../i18n/LanguageContext";
import { FROCCurve } from "../charts/FROCCurve";
import type { FROCPoint } from "../charts/FROCCurve";

const L = {
  ko: {
    aria: "FROC 곡선 예시. LUNA16의 스캔당 오탐 동작점들이 세로 안내선으로 표시되며, 스캔당 오탐 대비 민감도를 보여줍니다.",
    caption: "민감도 vs 스캔당 오탐(FP)",
  },
  en: {
    aria: "Example FROC curve with the LUNA16 false-positive-per-scan operating points shown as vertical guides, illustrating sensitivity versus false positives per scan.",
    caption: "sensitivity vs FP per scan",
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

const CHART_W = 360;
const CHART_H = 150;

export function FrocFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <figure
      role="img"
      aria-label={t.aria}
      style={{ margin: 0, width: "100%", textAlign: "center" }}
    >
      <FROCCurve points={SAMPLE_POINTS} width={CHART_W} height={CHART_H} />
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

export default FrocFigure;
