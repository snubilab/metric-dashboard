import { useLang } from "../../i18n/LanguageContext";

type ErrorVariant = "mae" | "mse" | "rmse";

const L = {
  ko: {
    maeAria: "MAE 예시: 모든 절대 잔차를 같은 무게로 평균",
    mseAria: "MSE 예시: 잔차를 제곱해 큰 잔차 면적을 강조",
    rmseAria: "RMSE 예시: 제곱 평균 뒤 목표값 단위로 돌아온 오차",
    target: "목표",
    pred: "예측",
    residual: "절대 잔차",
    equalWeight: "각 잔차를 선형으로 평균",
    squared: "제곱 면적",
    outlier: "큰 잔차가 면적을 지배",
    mae: "MAE",
    rmse: "RMSE",
    gap: "큰 잔차 꼬리",
  },
  en: {
    maeAria: "MAE example averaging all absolute residuals with equal linear weight",
    mseAria: "MSE example squaring residuals so one large miss dominates area",
    rmseAria: "RMSE example returning squared error to the target unit",
    target: "target",
    pred: "pred",
    residual: "absolute residual",
    equalWeight: "linear average of each residual",
    squared: "squared area",
    outlier: "large miss dominates area",
    mae: "MAE",
    rmse: "RMSE",
    gap: "tail gap",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 210;
const residuals = [20, 16, 18, 14, 56];

function MaeFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.maeAria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <line x1={34} y1={56} x2={326} y2={56} stroke="var(--c-gt)" strokeWidth={2} />
      <text x={34} y={42} fill="var(--c-gt-text)">{t.target}</text>
      {residuals.map((value, index) => {
        const x = 58 + index * 62;
        const y = 56 + value;
        return (
          <g key={x}>
            <line x1={x} y1={56} x2={x} y2={y} stroke="var(--c-warn)" strokeWidth={3} />
            <circle cx={x} cy={y} r={5} fill="var(--c-pred-a)" />
            <text x={x} y={y + 18} fill="var(--c-warn-text)" textAnchor="middle">|e|</text>
          </g>
        );
      })}
      <rect x={58} y={154} width={244} height={24} rx={6} fill="var(--c-surface)" stroke="var(--c-border)" />
      <text x={180} y={171} fill="var(--c-text)" textAnchor="middle">{t.equalWeight}</text>
      <text x={180} y={198} fill="var(--c-pred-a-text)" textAnchor="middle">{t.residual}</text>
    </svg>
  );
}

function MseFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const sizes = residuals.map((value) => Math.max(14, value * 0.62));

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.mseAria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <text x={180} y={24} fill="var(--c-text)" textAnchor="middle">{t.squared}</text>
      {sizes.map((size, index) => {
        const x = 54 + index * 60 - size / 2;
        const y = 86 - size / 2;
        const isOutlier = index === sizes.length - 1;
        return (
          <g key={x}>
            <rect
              x={x}
              y={y}
              width={size}
              height={size}
              rx={4}
              fill={isOutlier ? "var(--c-warn)" : "var(--c-pred-a)"}
              fillOpacity={isOutlier ? 0.22 : 0.16}
              stroke={isOutlier ? "var(--c-warn)" : "var(--c-pred-a)"}
            />
            <text x={x + size / 2} y={136} fill={isOutlier ? "var(--c-warn-text)" : "var(--c-pred-a-text)"} textAnchor="middle">
              e²
            </text>
          </g>
        );
      })}
      <path d="M244 128 C270 154, 286 154, 314 128" fill="none" stroke="var(--c-warn)" strokeWidth={2} />
      <text x={256} y={174} fill="var(--c-warn-text)" textAnchor="middle">{t.outlier}</text>
    </svg>
  );
}

function RmseFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.rmseAria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <line x1={50} y1={144} x2={310} y2={144} stroke="var(--c-border)" strokeWidth={2} />
      <line x1={50} y1={144} x2={142} y2={144} stroke="var(--c-pred-a)" strokeWidth={10} strokeLinecap="round" />
      <line x1={50} y1={108} x2={196} y2={108} stroke="var(--c-warn)" strokeWidth={10} strokeLinecap="round" />
      <text x={50} y={78} fill="var(--c-text-dim)">{t.target}</text>
      <circle cx={50} cy={144} r={5} fill="var(--c-gt)" />
      <circle cx={142} cy={144} r={5} fill="var(--c-pred-a)" />
      <circle cx={196} cy={108} r={5} fill="var(--c-warn)" />
      <text x={142} y={170} fill="var(--c-pred-a-text)" textAnchor="middle">{t.mae}</text>
      <text x={196} y={96} fill="var(--c-warn-text)" textAnchor="middle">{t.rmse}</text>
      <path d="M146 132 C158 118, 172 114, 190 116" fill="none" stroke="var(--c-warn)" strokeWidth={2} />
      <text x={224} y={132} fill="var(--c-warn-text)">{t.gap}</text>
      <text x={180} y={196} fill="var(--c-text)" textAnchor="middle">{t.pred}</text>
    </svg>
  );
}

function RegressionErrorFigure({ variant = "mae" }: { readonly variant?: ErrorVariant }) {
  if (variant === "mse") return <MseFigure />;
  if (variant === "rmse") return <RmseFigure />;
  return <MaeFigure />;
}

export function RegressionMaeFigure() {
  return <RegressionErrorFigure variant="mae" />;
}

export function RegressionMseFigure() {
  return <RegressionErrorFigure variant="mse" />;
}

export function RegressionRmseFigure() {
  return <RegressionErrorFigure variant="rmse" />;
}

export default RegressionErrorFigure;
