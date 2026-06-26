export type Stage = "positive" | "negative" | "compare";

export const L = {
  ko: {
    step: "단계",
    addPositive: "양성 추가",
    addNegative: "음성 추가",
    reset: "비우기",
    examples: "데이터 선택",
    workspace: "분류 작업판",
    metrics: "지표",
    threshold: "임계값",
    actual: "실제",
    count: "개수",
    score: "점수",
    prediction: "예측",
    positive: "양성",
    negative: "음성",
    gatedPositive: "먼저 실제 양성 사례를 하나 이상 만드세요.",
    gatedNegative: "이제 실제 음성 사례를 하나 이상 추가하세요.",
    gatedMetrics: "양성과 음성이 모두 있어야 지표가 열립니다.",
    presetsLabel: "분류 데이터셋",
    empty: "필요하면 임계값이나 점수 그룹을 조정해 지표 변화를 확인하세요.",
  },
  en: {
    step: "Step",
    addPositive: "Add positive",
    addNegative: "Add negative",
    reset: "Reset empty",
    examples: "Choose data",
    workspace: "Classification workspace",
    metrics: "Metrics",
    threshold: "Threshold",
    actual: "Actual",
    count: "Count",
    score: "Score",
    prediction: "Prediction",
    positive: "Positive",
    negative: "Negative",
    gatedPositive: "Create at least one actual positive case first.",
    gatedNegative: "Now add at least one actual negative case.",
    gatedMetrics: "Metrics unlock when both actual classes exist.",
    presetsLabel: "Classification datasets",
    empty: "Adjust the threshold or score groups to see how the metrics move.",
  },
} as const;

export const pageStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

export const splitStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-5)",
  alignItems: "flex-start",
};

export const columnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  flex: "1 1 360px",
  minWidth: "300px",
};

export const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

export const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

export const buttonStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-2) var(--space-3)",
  cursor: "pointer",
};

export const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid var(--c-gt)",
  color: "var(--c-gt-text)",
};

export const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
  alignItems: "center",
};

export const stepStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  padding: "var(--space-1) var(--space-3)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface-2)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text)",
};

export const mutedStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text-dim)",
};

export const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--text-sm)",
};

export const cellStyle: React.CSSProperties = {
  padding: "var(--space-2)",
  borderBottom: "1px solid var(--c-border)",
  textAlign: "left",
};

export const scoreStripStyle: React.CSSProperties = {
  position: "relative",
  height: "96px",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
  background: "var(--c-surface-2)",
};

export function stepText(stage: Stage, lang: "ko" | "en"): string {
  const index = stage === "positive" ? 1 : stage === "negative" ? 2 : 3;
  return `${L[lang].step} ${index}/3`;
}

export function promptText(stage: Stage, lang: "ko" | "en"): string {
  if (stage === "positive") return L[lang].gatedPositive;
  if (stage === "negative") return L[lang].gatedNegative;
  return L[lang].empty;
}
