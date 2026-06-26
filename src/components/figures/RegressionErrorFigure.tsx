import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria: "MAE MSE RMSE 예시: 같은 잔차와 이상치 잔차를 비교",
    typical: "잔차",
    outlier: "큰 잔차",
    target: "목표",
    pred: "예측",
    mae: "MAE는 절댓값 평균",
    rmse: "RMSE는 큰 잔차를 더 키움",
  },
  en: {
    aria: "MAE MSE RMSE example comparing ordinary residuals with one outlier residual",
    typical: "residuals",
    outlier: "large residual",
    target: "target",
    pred: "pred",
    mae: "MAE averages absolute residuals",
    rmse: "RMSE magnifies a large residual",
  },
} as const;

const WIDTH = 360;
const HEIGHT = 210;

export default function RegressionErrorFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const bars = [20, -16, 18, -14, 56];
  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
    >
      <line x1={34} y1={100} x2={326} y2={100} stroke="var(--c-gt)" strokeWidth={2} />
      <text x={34} y={86} fill="var(--c-gt-text)">{t.target}</text>
      {bars.map((bar, index) => {
        const x = 70 + index * 52;
        const y2 = 100 - bar;
        return (
          <g key={x}>
            <line x1={x} y1={100} x2={x} y2={y2} stroke="var(--c-warn)" strokeWidth={3} />
            <circle cx={x} cy={y2} r={5} fill="var(--c-pred-a)" />
          </g>
        );
      })}
      <text x={290} y={38} fill="var(--c-warn-text)" textAnchor="middle">{t.outlier}</text>
      <text x={180} y={136} fill="var(--c-pred-a-text)" textAnchor="middle">{t.pred}</text>
      <text x={92} y={174} fill="var(--c-text)">{t.mae}</text>
      <text x={92} y={194} fill="var(--c-warn-text)">{t.rmse}</text>
    </svg>
  );
}
