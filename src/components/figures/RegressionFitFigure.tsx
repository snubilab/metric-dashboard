import { useLang } from "../../i18n/LanguageContext";

type FitVariant = "r2" | "bias" | "pearson" | "spearman";

const L = {
  ko: {
    r2Aria: "R2 예시: 목표 평균 대비 설명된 분산과 잔차 분산",
    biasAria: "평균 부호 편향 예시: 예측값이 목표값보다 일정하게 위로 이동",
    pearsonAria: "Pearson r 예시: 직선 관계에 맞는 선형 상관",
    spearmanAria: "Spearman rho 예시: 곡선이어도 순위가 보존되는 단조 상관",
    mean: "목표 평균",
    fitted: "예측선",
    residual: "잔차",
    explained: "설명된 변동",
    diagonal: "목표=예측",
    bias: "평균 이동",
    over: "과대예측",
    linear: "직선 관계",
    curved: "곡선 관계",
    ranks: "순위 보존",
  },
  en: {
    r2Aria: "R squared example comparing explained variation with residual variation",
    biasAria: "Mean signed bias example where predictions are shifted above targets",
    pearsonAria: "Pearson r example emphasizing straight-line association",
    spearmanAria: "Spearman rho example emphasizing preserved monotonic rank",
    mean: "target mean",
    fitted: "prediction line",
    residual: "residual",
    explained: "explained variation",
    diagonal: "target=pred",
    bias: "mean shift",
    over: "over-predict",
    linear: "linear relation",
    curved: "curved relation",
    ranks: "rank preserved",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 220;
const points = [
  [56, 154],
  [94, 128],
  [132, 98],
  [170, 74],
  [208, 56],
] as const;

function R2Figure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.r2Aria} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
      <line x1={44} y1={138} x2={310} y2={138} stroke="var(--c-border)" strokeWidth={2} />
      <text x={48} y={128} fill="var(--c-text-dim)">{t.mean}</text>
      <line x1={44} y1={164} x2={250} y2={46} stroke="var(--c-pred-a)" strokeWidth={2} />
      <text x={242} y={42} fill="var(--c-pred-a-text)" textAnchor="middle">{t.fitted}</text>
      {points.map(([x, y]) => {
        const fitY = 190 - x * 0.58;
        return (
          <g key={x}>
            <line x1={x} y1={138} x2={x} y2={fitY} stroke="var(--c-gt)" strokeWidth={2} strokeOpacity={0.55} />
            <line x1={x} y1={fitY} x2={x} y2={y} stroke="var(--c-warn)" strokeWidth={2} />
            <circle cx={x} cy={y} r={4} fill="var(--c-pred-a)" />
          </g>
        );
      })}
      <text x={114} y={188} fill="var(--c-gt-text)" textAnchor="middle">{t.explained}</text>
      <text x={244} y={178} fill="var(--c-warn-text)" textAnchor="middle">{t.residual}</text>
    </svg>
  );
}

function BiasFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.biasAria} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
      <line x1={50} y1={166} x2={300} y2={50} stroke="var(--c-gt)" strokeDasharray="4 4" strokeWidth={2} />
      <line x1={50} y1={134} x2={300} y2={18} stroke="var(--c-pred-a)" strokeWidth={2} />
      <text x={86} y={172} fill="var(--c-gt-text)">{t.diagonal}</text>
      <text x={230} y={28} fill="var(--c-pred-a-text)">{t.over}</text>
      {[80, 130, 180, 230].map((x) => {
        const targetY = 189 - x * 0.46;
        const predY = targetY - 32;
        return (
          <g key={x}>
            <line x1={x} y1={targetY} x2={x} y2={predY} stroke="var(--c-warn)" strokeWidth={2} markerEnd="url(#bias-arrow)" />
            <circle cx={x} cy={predY} r={4} fill="var(--c-pred-a)" />
          </g>
        );
      })}
      <defs>
        <marker id="bias-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="var(--c-warn)" />
        </marker>
      </defs>
      <text x={174} y={116} fill="var(--c-warn-text)" textAnchor="middle">{t.bias}</text>
    </svg>
  );
}

function PearsonFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const noisy = [
    [54, 154],
    [92, 128],
    [130, 112],
    [168, 78],
    [206, 62],
    [244, 40],
  ] as const;

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.pearsonAria} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
      <line x1={42} y1={166} x2={260} y2={34} stroke="var(--c-pred-a)" strokeWidth={3} />
      <text x={206} y={30} fill="var(--c-pred-a-text)" textAnchor="middle">{t.linear}</text>
      {noisy.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={5} fill="var(--c-pred-a)" />
      ))}
      <path d="M56 172 L250 54" fill="none" stroke="var(--c-gt)" strokeDasharray="4 4" strokeWidth={2} />
      <text x={96} y={198} fill="var(--c-text-dim)">r</text>
    </svg>
  );
}

function SpearmanFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const curved = [
    [54, 162],
    [92, 150],
    [130, 128],
    [168, 92],
    [206, 48],
    [244, 30],
  ] as const;

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.spearmanAria} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
      <polyline points={curved.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="var(--c-pred-b)" strokeWidth={3} />
      <line x1={42} y1={172} x2={260} y2={44} stroke="var(--c-border)" strokeDasharray="4 4" strokeWidth={2} />
      {curved.map(([x, y], index) => (
        <g key={x}>
          <circle cx={x} cy={y} r={5} fill="var(--c-pred-b)" />
          <text x={x} y={190} fill="var(--c-text-dim)" textAnchor="middle">{index + 1}</text>
        </g>
      ))}
      <text x={178} y={24} fill="var(--c-pred-b-text)" textAnchor="middle">{t.curved}</text>
      <text x={178} y={206} fill="var(--c-text)" textAnchor="middle">{t.ranks}</text>
    </svg>
  );
}

function RegressionFitFigure({ variant = "r2" }: { readonly variant?: FitVariant }) {
  if (variant === "bias") return <BiasFigure />;
  if (variant === "pearson") return <PearsonFigure />;
  if (variant === "spearman") return <SpearmanFigure />;
  return <R2Figure />;
}

export function RegressionR2Figure() {
  return <RegressionFitFigure variant="r2" />;
}

export function RegressionBiasFigure() {
  return <RegressionFitFigure variant="bias" />;
}

export function RegressionPearsonFigure() {
  return <RegressionFitFigure variant="pearson" />;
}

export function RegressionSpearmanFigure() {
  return <RegressionFitFigure variant="spearman" />;
}

export default RegressionFitFigure;
