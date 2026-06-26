import { useState } from "react";
import type { MiniSimConfig } from "../../types/topic";
import type { ConfusionCounts } from "../../engine/metrics/classification";
import { classificationMetrics, fBeta } from "../../engine/metrics/classification";
import { useLang } from "../../i18n/LanguageContext";
import { AnimatedMetricBlock } from "./AnimatedMetricBlock";
import { MetricCell, MetricStrip, Slider, WidgetCard } from "./widgetChrome";

type SimKind =
  | "cls-row-tradeoff"
  | "cls-prevalence-columns"
  | "cls-accuracy-imbalance"
  | "cls-fbeta-weight";

interface ClassificationMetricSimProps {
  config: MiniSimConfig;
}

const L = {
  ko: {
    rowsTitle: "임계값을 낮추면 Recall은 오르고 Specificity는 내려갑니다",
    rowsCaption: "선별처럼 놓침을 줄이면 위양성 부담이 같이 늘어납니다.",
    prevalenceTitle: "같은 Sens/Spec라도 prevalence가 바뀌면 PPV가 바뀝니다",
    prevalenceCaption: "양성이 희귀할수록 FP가 PPV 분모를 크게 흔듭니다.",
    accuracyTitle: "모두 음성 예측은 Accuracy만 보면 그럴듯해 보입니다",
    accuracyCaption: "양성이 희귀하면 Accuracy는 높아도 Sensitivity와 Balanced Accuracy가 위험을 드러냅니다.",
    fbetaTitle: "beta는 Precision-Recall 가중을 바꿉니다",
    fbetaCaption: "F2는 Recall, F0.5는 Precision 쪽으로 가중이 이동합니다.",
    threshold: "임계값 완화",
    prevalence: "양성 비율",
    allNegativePrevalence: "모두 음성 예측에서의 양성 비율",
    beta: "beta",
    actual: "실제",
    predicted: "예측",
    pos: "양성",
    neg: "음성",
    tp: "TP",
    fn: "FN",
    fp: "FP",
    tn: "TN",
    baseRate: "실제 구성",
    predictedPositive: "예측 양성 구성",
    allNegative: "모두 음성 예측",
    missedPositive: "놓친 양성",
    precisionSide: "Precision 쪽",
    recallSide: "Recall 쪽",
    prevalenceMetric: "Prevalence",
    balanced: "Balanced Acc",
    fbeta: "F-beta",
  },
  en: {
    rowsTitle: "Lowering the threshold raises Recall and lowers Specificity",
    rowsCaption: "Screening-style sensitivity usually accepts more false positives.",
    prevalenceTitle: "PPV changes with prevalence even when Sens/Spec stay fixed",
    prevalenceCaption: "When positives are rare, FP dominates the PPV denominator.",
    accuracyTitle: "All-negative prediction can look plausible through Accuracy alone",
    accuracyCaption: "Under rare positives, Accuracy stays high while Sensitivity and Balanced Accuracy expose the miss.",
    fbetaTitle: "Changing beta changes which operating goal the same counts emphasize",
    fbetaCaption: "F2 leans toward Recall; F0.5 leans toward Precision.",
    threshold: "Threshold relaxation",
    prevalence: "Positive prevalence",
    allNegativePrevalence: "Positive prevalence with all-negative prediction",
    beta: "beta",
    actual: "Actual",
    predicted: "Predicted",
    pos: "Positive",
    neg: "Negative",
    tp: "TP",
    fn: "FN",
    fp: "FP",
    tn: "TN",
    baseRate: "Actual mix",
    predictedPositive: "Predicted-positive mix",
    allNegative: "All-negative prediction",
    missedPositive: "Missed positives",
    precisionSide: "Precision side",
    recallSide: "Recall side",
    prevalenceMetric: "Prevalence",
    balanced: "Balanced Acc",
    fbeta: "F-beta",
  },
} as const;

const matrixStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "76px repeat(2, minmax(92px, 1fr))",
  gap: "var(--space-2)",
  alignItems: "stretch",
  maxWidth: "420px",
};

const axisStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "52px",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const cellStyle: React.CSSProperties = {
  minHeight: "60px",
  padding: "var(--space-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "var(--space-1)",
};

const countStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-lg)",
  fontWeight: 700,
};

const visualCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-3)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
  background: "var(--c-surface-2)",
};

const barTrackStyle: React.CSSProperties = {
  display: "flex",
  width: "100%",
  minHeight: "34px",
  overflow: "hidden",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface)",
};

const barLabelStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-2)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const badgeRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "var(--space-2)",
};

const badgeStyle: React.CSSProperties = {
  padding: "var(--space-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const scaleStyle: React.CSSProperties = {
  position: "relative",
  height: "18px",
  borderRadius: "var(--radius-full)",
  background: "linear-gradient(90deg, color-mix(in srgb, var(--c-pred-a) 55%, var(--c-surface)), color-mix(in srgb, var(--c-gt) 55%, var(--c-surface)))",
};

function clampCount(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function countsFor(kind: SimKind, value: number): ConfusionCounts {
  if (kind === "cls-row-tradeoff") {
    const tp = clampCount(10 + value * 9, 20);
    const fp = clampCount(2 + value * 28, 80);
    return { tp, fn: 20 - tp, fp, tn: 80 - fp };
  }
  if (kind === "cls-prevalence-columns") {
    const positives = clampCount((value / 100) * 200, 200);
    const negatives = 200 - positives;
    const tp = clampCount(positives * 0.9, positives);
    const fp = clampCount(negatives * 0.1, negatives);
    return { tp, fn: positives - tp, fp, tn: negatives - fp };
  }
  if (kind === "cls-accuracy-imbalance") {
    const positives = clampCount(value, 100);
    return { tp: 0, fn: positives, fp: 0, tn: 100 - positives };
  }
  return { tp: 30, fn: 20, fp: 5, tn: 145 };
}

function MatrixCell({
  code,
  value,
  tone,
}: {
  code: string;
  value: number;
  tone: "hit" | "miss";
}) {
  return (
    <div
      style={{
        ...cellStyle,
        borderColor: tone === "hit" ? "var(--c-gt)" : "var(--c-warn)",
        background: tone === "hit" ? "color-mix(in srgb, var(--c-gt) 12%, var(--c-surface))" : "color-mix(in srgb, var(--c-warn) 12%, var(--c-surface))",
      }}
    >
      <span style={{ ...countStyle, color: tone === "hit" ? "var(--c-gt-text)" : "var(--c-warn-text)" }}>
        {code}={value}
      </span>
    </div>
  );
}

function ConfusionMatrix({ counts }: { counts: ConfusionCounts }) {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <div style={matrixStyle} role="img" aria-label={`TP ${counts.tp}, FN ${counts.fn}, FP ${counts.fp}, TN ${counts.tn}`}>
      <span />
      <div style={axisStyle}>{t.predicted} {t.pos}</div>
      <div style={axisStyle}>{t.predicted} {t.neg}</div>
      <div style={axisStyle}>{t.actual} {t.pos}</div>
      <MatrixCell code={t.tp} value={counts.tp} tone="hit" />
      <MatrixCell code={t.fn} value={counts.fn} tone="miss" />
      <div style={axisStyle}>{t.actual} {t.neg}</div>
      <MatrixCell code={t.fp} value={counts.fp} tone="miss" />
      <MatrixCell code={t.tn} value={counts.tn} tone="hit" />
    </div>
  );
}

function BarSegment({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: value > 0 ? "24px" : 0,
        width: `${value}%`,
        background: color,
        color: "var(--c-surface)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        fontWeight: 700,
      }}
    >
      {value >= 8 ? label : ""}
    </span>
  );
}

function PrevalenceVisual({ counts }: { counts: ConfusionCounts }) {
  const { lang } = useLang();
  const t = L[lang];
  const total = counts.tp + counts.fn + counts.fp + counts.tn;
  const positives = counts.tp + counts.fn;
  const negatives = counts.fp + counts.tn;
  const predictedPositive = counts.tp + counts.fp;

  return (
    <div
      style={visualCardStyle}
      role="img"
      aria-label={`Prevalence ${Math.round((positives / total) * 100)}%: positives ${positives}, negatives ${negatives}, TP ${counts.tp}, FP ${counts.fp}`}
    >
      <div style={barLabelStyle}>
        <strong>{t.baseRate}</strong>
        <span>{t.pos} {positives} · {t.neg} {negatives}</span>
      </div>
      <div style={barTrackStyle}>
        <BarSegment value={(positives / total) * 100} color="var(--c-gt)" label={`${positives}`} />
        <BarSegment value={(negatives / total) * 100} color="var(--c-pred-b)" label={`${negatives}`} />
      </div>
      <div style={barLabelStyle}>
        <strong>{t.predictedPositive}</strong>
        <span>{t.tp} {counts.tp} · {t.fp} {counts.fp}</span>
      </div>
      <div style={barTrackStyle}>
        <BarSegment value={predictedPositive === 0 ? 0 : (counts.tp / predictedPositive) * 100} color="var(--c-gt)" label={`${counts.tp}`} />
        <BarSegment value={predictedPositive === 0 ? 0 : (counts.fp / predictedPositive) * 100} color="var(--c-warn)" label={`${counts.fp}`} />
      </div>
    </div>
  );
}

function AccuracyImbalanceVisual({ counts }: { counts: ConfusionCounts }) {
  const { lang } = useLang();
  const t = L[lang];
  const total = counts.tp + counts.fn + counts.fp + counts.tn;
  const positives = counts.tp + counts.fn;
  const negatives = counts.fp + counts.tn;

  return (
    <div style={visualCardStyle} role="img" aria-label={`All-negative prediction: missed positives ${positives}, true negatives ${negatives}`}>
      <div style={barLabelStyle}>
        <strong>{t.allNegative}</strong>
        <span>{t.missedPositive} {positives} / {total}</span>
      </div>
      <div style={barTrackStyle}>
        <BarSegment value={(positives / total) * 100} color="var(--c-warn)" label={`${positives}`} />
        <BarSegment value={(negatives / total) * 100} color="var(--c-gt)" label={`${negatives}`} />
      </div>
      <div style={badgeRowStyle}>
        <span style={badgeStyle}>{t.fn}={counts.fn} · Sensitivity 0</span>
        <span style={badgeStyle}>{t.tn}={counts.tn} · Accuracy {((counts.tn / total) || 0).toFixed(2)}</span>
      </div>
    </div>
  );
}

function FBetaVisual({ beta }: { beta: number }) {
  const { lang } = useLang();
  const t = L[lang];
  const marker = ((beta - 0.5) / 1.5) * 100;

  return (
    <div style={visualCardStyle} role="img" aria-label={`F-beta weighting beta ${beta.toFixed(1)}`}>
      <div style={barLabelStyle}>
        <strong>{t.precisionSide}</strong>
        <strong>{t.recallSide}</strong>
      </div>
      <div style={scaleStyle}>
        <span
          style={{
            position: "absolute",
            left: `calc(${marker}% - 8px)`,
            top: "-7px",
            width: "16px",
            height: "32px",
            borderRadius: "var(--radius-full)",
            background: "var(--c-text)",
            boxShadow: "0 0 0 3px var(--c-surface)",
          }}
        />
      </div>
      <div style={badgeRowStyle}>
        <span style={badgeStyle}>F0.5 → {t.precisionSide}</span>
        <span style={badgeStyle}>F1 → Precision = Recall</span>
        <span style={badgeStyle}>F2 → {t.recallSide}</span>
      </div>
    </div>
  );
}

function ClassificationVisual({ kind, counts, beta }: { kind: SimKind; counts: ConfusionCounts; beta: number }) {
  if (kind === "cls-prevalence-columns") return <PrevalenceVisual counts={counts} />;
  if (kind === "cls-accuracy-imbalance") return <AccuracyImbalanceVisual counts={counts} />;
  if (kind === "cls-fbeta-weight") return <FBetaVisual beta={beta} />;
  return <ConfusionMatrix counts={counts} />;
}

function labels(kind: SimKind, lang: keyof typeof L) {
  const t = L[lang];
  if (kind === "cls-row-tradeoff") return { title: t.rowsTitle, caption: t.rowsCaption };
  if (kind === "cls-prevalence-columns") return { title: t.prevalenceTitle, caption: t.prevalenceCaption };
  if (kind === "cls-accuracy-imbalance") return { title: t.accuracyTitle, caption: t.accuracyCaption };
  return { title: t.fbetaTitle, caption: t.fbetaCaption };
}

export function ClassificationMetricSim({ config }: ClassificationMetricSimProps) {
  const { lang } = useLang();
  const t = L[lang];
  const kind = config.kind as SimKind;
  const [rowRelaxation, setRowRelaxation] = useState(0.9);
  const [prevalence, setPrevalence] = useState(10);
  const [imbalance, setImbalance] = useState(5);
  const [beta, setBeta] = useState(1);
  const controlValue =
    kind === "cls-row-tradeoff"
      ? rowRelaxation
      : kind === "cls-prevalence-columns"
        ? prevalence
        : kind === "cls-accuracy-imbalance"
          ? imbalance
          : beta;
  const counts = countsFor(kind, controlValue);
  const metrics = classificationMetrics(counts);
  const copy = labels(kind, lang);
  const fBetaValue = fBeta(metrics.precision, metrics.recall, beta);

  return (
    <WidgetCard title={copy.title} caption={copy.caption}>
      {kind === "cls-row-tradeoff" && (
        <Slider label={t.threshold} value={rowRelaxation} min={0} max={1} step={0.01} decimals={2} onChange={setRowRelaxation} />
      )}
      {kind === "cls-prevalence-columns" && (
        <Slider label={t.prevalence} value={prevalence} min={5} max={80} step={1} unit="%" onChange={setPrevalence} />
      )}
      {kind === "cls-accuracy-imbalance" && (
        <Slider label={t.allNegativePrevalence} value={imbalance} min={1} max={50} step={1} unit="%" onChange={setImbalance} />
      )}
      {kind === "cls-fbeta-weight" && (
        <Slider label={t.beta} value={beta} min={0.5} max={2} step={0.1} decimals={1} onChange={setBeta} />
      )}
      <ClassificationVisual kind={kind} counts={counts} beta={beta} />
      <MetricStrip>
        {kind === "cls-row-tradeoff" && (
          <>
            <MetricCell metricKey="sensitivity"><AnimatedMetricBlock dataMetric="sensitivity" label="Sensitivity" value={metrics.sensitivity} /></MetricCell>
            <MetricCell metricKey="specificity"><AnimatedMetricBlock dataMetric="specificity" label="Specificity" value={metrics.specificity} /></MetricCell>
            <MetricCell metricKey="balanced-accuracy"><AnimatedMetricBlock dataMetric="balanced-accuracy" label={t.balanced} value={metrics.balancedAccuracy} /></MetricCell>
          </>
        )}
        {kind === "cls-prevalence-columns" && (
          <>
            <MetricCell metricKey="ppv"><AnimatedMetricBlock dataMetric="ppv" label="PPV" value={metrics.ppv} /></MetricCell>
            <MetricCell metricKey="npv"><AnimatedMetricBlock dataMetric="npv" label="NPV" value={metrics.npv} /></MetricCell>
            <MetricCell metricKey="prevalence"><AnimatedMetricBlock dataMetric="prevalence" label={t.prevalenceMetric} value={prevalence / 100} /></MetricCell>
          </>
        )}
        {kind === "cls-accuracy-imbalance" && (
          <>
            <MetricCell metricKey="accuracy"><AnimatedMetricBlock dataMetric="accuracy" label="Accuracy" value={metrics.accuracy} /></MetricCell>
            <MetricCell metricKey="sensitivity"><AnimatedMetricBlock dataMetric="sensitivity" label="Sensitivity" value={metrics.sensitivity} /></MetricCell>
            <MetricCell metricKey="balanced-accuracy"><AnimatedMetricBlock dataMetric="balanced-accuracy" label={t.balanced} value={metrics.balancedAccuracy} /></MetricCell>
          </>
        )}
        {kind === "cls-fbeta-weight" && (
          <>
            <MetricCell metricKey="precision"><AnimatedMetricBlock dataMetric="precision" label="Precision" value={metrics.precision} /></MetricCell>
            <MetricCell metricKey="recall"><AnimatedMetricBlock dataMetric="recall" label="Recall" value={metrics.recall} /></MetricCell>
            <MetricCell metricKey="fbeta"><AnimatedMetricBlock dataMetric="fbeta" label={t.fbeta} value={fBetaValue} /></MetricCell>
          </>
        )}
      </MetricStrip>
    </WidgetCard>
  );
}

export default ClassificationMetricSim;
