/**
 * LesionWiseFigure — one static example of lesion-level (instance) detection.
 *
 * A scene with three GT lesions: one correctly found (TP — GT outline with a
 * matching prediction fill), one missed (FN — GT outline in warn), and one
 * spurious prediction with no GT (FP — extra color). This shows lesion-level
 * detection, which is coarser than voxel overlap. Static, non-interactive.
 */

import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "병변 단위 예시: 찾음(TP), 놓침(FN), 헛검출(FP)",
    tp: "TP (찾음)",
    fn: "FN (놓침)",
    fp: "FP (헛검출)",
    caption: "병변 단위: 복셀 겹침이 아닌 검출 수",
  },
  en: {
    aria: "Lesion-wise example: one found (TP), one missed (FN), one spurious (FP)",
    tp: "TP (found)",
    fn: "FN (missed)",
    fp: "FP (spurious)",
    caption: "Lesion-wise: detection count, not voxel overlap",
  },
} as const;

const WIDTH = 320;
const HEIGHT = 170;
const ROW_Y = 70;

export default function LesionWiseFigure() {
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
      {/* TP lesion: GT outline with a matching prediction fill inside */}
      <circle cx={58} cy={ROW_Y} r={30} fill="none" stroke="var(--c-gt)" strokeWidth={2.5} />
      <circle cx={58} cy={ROW_Y} r={20} fill="var(--c-pred-a)" fillOpacity={0.55} stroke="var(--c-pred-a)" strokeWidth={2} />
      <text x={58} y={ROW_Y + 52} fill="var(--c-gt)" textAnchor="middle">
        {t.tp}
      </text>

      {/* FN lesion: GT present but no prediction — dashed warn outline */}
      <circle cx={160} cy={ROW_Y} r={28} fill="var(--c-warn)" fillOpacity={0.08} stroke="var(--c-warn)" strokeWidth={2.5} strokeDasharray="6 4" />
      <text x={160} y={ROW_Y + 52} fill="var(--c-warn)" textAnchor="middle">
        {t.fn}
      </text>

      {/* FP lesion: a spurious prediction with no GT — extra color */}
      <circle cx={262} cy={ROW_Y} r={24} fill="var(--c-pred-b)" fillOpacity={0.5} stroke="var(--c-pred-b)" strokeWidth={2.5} />
      <text x={262} y={ROW_Y + 50} fill="var(--c-pred-b)" textAnchor="middle">
        {t.fp}
      </text>

      <text x={WIDTH / 2} y={HEIGHT - 8} fill="var(--c-text-dim)" textAnchor="middle">
        {t.caption}
      </text>
    </svg>
  );
}
