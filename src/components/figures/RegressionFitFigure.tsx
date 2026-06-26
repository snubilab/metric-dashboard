import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "R2 편향 Pearson r Spearman rho 예시",
    diagonal: "목표=예측",
    bias: "편향",
    linear: "선형",
    monotonic: "단조",
    note: "상관과 편향은 서로 다른 질문",
  },
  en: {
    aria: "R2 bias Pearson r and Spearman rho example",
    diagonal: "target=pred",
    bias: "bias",
    linear: "linear",
    monotonic: "monotonic",
    note: "Correlation and bias ask different questions",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 220;

export default function RegressionFitFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const linear = [
    [54, 158],
    [86, 130],
    [118, 102],
    [150, 74],
  ] as const;
  const curved = [
    [214, 158],
    [242, 146],
    [270, 114],
    [298, 54],
  ] as const;
  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <line x1={36} y1={170} x2={166} y2={40} stroke="var(--c-gt)" strokeDasharray="4 4" strokeWidth={2} />
      <line x1={206} y1={170} x2={326} y2={40} stroke="var(--c-gt)" strokeDasharray="4 4" strokeWidth={2} />
      <polyline points={linear.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />
      <polyline points={curved.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="var(--c-pred-b)" strokeWidth={2} />
      {linear.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill="var(--c-pred-a)" />)}
      {curved.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill="var(--c-pred-b)" />)}
      <path d="M54 128 L150 44" stroke="var(--c-warn)" strokeWidth={2} />
      <text x={104} y={40} fill="var(--c-warn-text)" textAnchor="middle">{t.bias}</text>
      <text x={102} y={190} fill="var(--c-pred-a-text)" textAnchor="middle">{t.linear}</text>
      <text x={266} y={190} fill="var(--c-pred-b-text)" textAnchor="middle">{t.monotonic}</text>
      <text x={180} y={18} fill="var(--c-text-dim)" textAnchor="middle">{t.note}</text>
    </svg>
  );
}
