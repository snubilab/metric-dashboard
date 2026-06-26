import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { RegressionPoint } from "../../types/engine";
import { AnimatedMetric } from "../../components/AnimatedMetric";
import { regressionMetrics } from "../../engine/metrics/regression";
import { useLang } from "../../i18n/LanguageContext";
import { REG_PRESETS } from "./presets";
import { RegressionPlot } from "./RegressionPlot";

const L = {
  ko: {
    step: "STEP 1 / 2",
    prompt: "목표값과 예측값을 직접 추가하거나, 목표값과 잔차로 한 점을 만드세요.",
    target: "목표값",
    prediction: "예측값",
    residual: "잔차",
    addPair: "점 추가",
    addResidual: "잔차로 추가",
    reset: "초기화",
    examples: "예시 불러오기",
    empty: "아직 점이 없습니다. 첫 점을 추가하면 산점도가 시작됩니다.",
    metrics: "현재 점들의 지표",
    needMore: "상관과 R²는 적어도 두 점이 필요합니다.",
  },
  en: {
    step: "STEP 1 / 2",
    prompt: "Add target/prediction pairs directly, or create a point from target plus residual.",
    target: "Target",
    prediction: "Prediction",
    residual: "Residual",
    addPair: "Add point",
    addResidual: "Add residual",
    reset: "Reset",
    examples: "Load an example",
    empty: "No points yet. Add the first point to start the scatter plot.",
    metrics: "Metrics for current points",
    needMore: "Correlation and R² need at least two points.",
  },
} as const;

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const splitStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-5)",
  alignItems: "flex-start",
};

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  flex: "1 1 320px",
  minWidth: "280px",
  padding: "var(--space-4)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

const examplePanelStyle: CSSProperties = {
  ...panelStyle,
  flex: "0 0 auto",
  minWidth: "280px",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
  alignItems: "flex-end",
};

const inputStyle: CSSProperties = {
  width: "8rem",
  padding: "var(--space-2)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-mono)",
};

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  color: "var(--c-text-dim)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const buttonStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
};

const activeButtonStyle: CSSProperties = {
  ...buttonStyle,
  border: "1px solid var(--c-pred-a)",
  color: "var(--c-pred-a-text)",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "var(--c-text-dim)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
};

const stepStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "var(--space-1) var(--space-3)",
  color: "var(--c-pred-a-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-pred-a)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
};

function numeric(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clonePoints(points: readonly RegressionPoint[]): RegressionPoint[] {
  return points.map((point) => ({ ...point }));
}

export default function RegressionPlayground() {
  const { lang } = useLang();
  const t = L[lang];
  const [points, setPoints] = useState<RegressionPoint[]>([]);
  const [activePreset, setActivePreset] = useState<string | undefined>();
  const [target, setTarget] = useState("");
  const [prediction, setPrediction] = useState("");
  const [residual, setResidual] = useState("");
  const metrics = useMemo(() => regressionMetrics(points), [points]);
  const selectedPreset = REG_PRESETS.find((preset) => preset.id === activePreset);

  function addPoint(next: RegressionPoint): void {
    setPoints((current) => [...current, next]);
    setActivePreset(undefined);
  }

  function addPair(): void {
    const nextTarget = numeric(target);
    const nextPrediction = numeric(prediction);
    if (nextTarget === undefined || nextPrediction === undefined) return;
    addPoint({ target: nextTarget, prediction: nextPrediction });
    setTarget("");
    setPrediction("");
  }

  function addResidualPoint(): void {
    const nextTarget = numeric(target);
    const nextResidual = numeric(residual);
    if (nextTarget === undefined || nextResidual === undefined) return;
    addPoint({ target: nextTarget, prediction: nextTarget + nextResidual });
    setTarget("");
    setResidual("");
  }

  return (
    <div style={pageStyle}>
      <span style={stepStyle}>{t.step}</span>
      <p style={textStyle}>{t.prompt}</p>
      <section style={examplePanelStyle} aria-label={t.examples}>
        <h3 style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--c-text-dim)" }}>{t.examples}</h3>
        <div style={rowStyle}>
          {REG_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePreset === preset.id}
              style={activePreset === preset.id ? activeButtonStyle : buttonStyle}
              onClick={() => {
                setPoints(clonePoints(preset.points));
                setActivePreset(preset.id);
              }}
            >
              {lang === "ko" ? preset.labelKo : preset.label}
            </button>
          ))}
        </div>
        {selectedPreset ? <p style={textStyle}>{lang === "ko" ? selectedPreset.descriptionKo : selectedPreset.description}</p> : null}
      </section>
      <div style={splitStyle}>
        <section style={panelStyle}>
          <div style={rowStyle}>
            <label style={labelStyle}>
              {t.target}
              <input style={inputStyle} type="number" value={target} onChange={(event) => setTarget(event.currentTarget.value)} />
            </label>
            <label style={labelStyle}>
              {t.prediction}
              <input style={inputStyle} type="number" value={prediction} onChange={(event) => setPrediction(event.currentTarget.value)} />
            </label>
            <button type="button" style={buttonStyle} onClick={addPair}>{t.addPair}</button>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              {t.residual}
              <input style={inputStyle} type="number" value={residual} onChange={(event) => setResidual(event.currentTarget.value)} />
            </label>
            <button type="button" style={buttonStyle} onClick={addResidualPoint}>{t.addResidual}</button>
            <button type="button" style={buttonStyle} onClick={() => { setPoints([]); setActivePreset(undefined); }}>{t.reset}</button>
          </div>
          {points.length === 0 ? <p style={textStyle}>{t.empty}</p> : null}
          <RegressionPlot points={points} ariaLabel={t.metrics} />
        </section>
        <section style={panelStyle}>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>{t.metrics}</h3>
          {points.length < 2 ? <p style={textStyle}>{t.needMore}</p> : null}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["MAE", metrics.mae],
                ["MSE", metrics.mse],
                ["RMSE", metrics.rmse],
                ["R²", metrics.r2],
                [lang === "ko" ? "평균 부호 편향" : "Mean signed bias", metrics.meanSignedBias],
                ["Pearson r", metrics.pearsonR],
                ["Spearman ρ", metrics.spearmanRho],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--c-border)", color: "var(--c-text)" }}>{label}</td>
                  <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--c-border)", textAlign: "right" }}>
                    <AnimatedMetric value={Number(value)} decimals={2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
