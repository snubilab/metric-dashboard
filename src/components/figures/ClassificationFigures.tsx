import { useLang } from "../../i18n/LanguageContext";

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
};

const monoStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
};

const L = {
  ko: {
    cm: "분류 혼동행렬",
    actual: "실제",
    predicted: "예측",
    pos: "양성",
    neg: "음성",
    threshold: "임계값",
    score: "점수",
    roc: "ROC",
    pr: "PR",
    fpr: "FPR",
    tpr: "TPR",
    recall: "Recall",
    precision: "Precision",
    count: "예시 수",
    actualPosTotal: "실제 양성 50",
    actualNegTotal: "실제 음성 150",
    predPosTotal: "예측 양성 52",
    predNegTotal: "예측 음성 148",
    total: "전체 200",
    hit: "맞춘 양성",
    miss: "놓친 양성",
    falseAlarm: "오경보",
    correctReject: "맞춘 음성",
    sensitivity: "Recall/Sens",
    specificity: "Specificity",
    ppv: "Precision/PPV",
    npv: "NPV",
    accuracy: "Accuracy",
    balancedAccuracy: "Balanced Acc",
    f1: "F1",
  },
  en: {
    cm: "Classification confusion matrix",
    actual: "Actual",
    predicted: "Predicted",
    pos: "Positive",
    neg: "Negative",
    threshold: "Threshold",
    score: "Score",
    roc: "ROC",
    pr: "PR",
    fpr: "FPR",
    tpr: "TPR",
    recall: "Recall",
    precision: "Precision",
    count: "Example counts",
    actualPosTotal: "Actual positive 50",
    actualNegTotal: "Actual negative 150",
    predPosTotal: "Predicted positive 52",
    predNegTotal: "Predicted negative 148",
    total: "Total 200",
    hit: "positive hit",
    miss: "missed positive",
    falseAlarm: "false alarm",
    correctReject: "correct rejection",
    sensitivity: "Recall/Sens",
    specificity: "Specificity",
    ppv: "Precision/PPV",
    npv: "NPV",
    accuracy: "Accuracy",
    balancedAccuracy: "Balanced Acc",
    f1: "F1",
  },
} as const;

type ConfusionVariant = "overview" | "rows" | "columns" | "accuracy" | "f1";

interface ConfusionExample {
  readonly tp: number;
  readonly fp: number;
  readonly fn: number;
  readonly tn: number;
}

const CONFUSION_EXAMPLES: Record<ConfusionVariant, ConfusionExample> = {
  overview: { tp: 42, fn: 8, fp: 10, tn: 140 },
  rows: { tp: 18, fn: 2, fp: 28, tn: 52 },
  columns: { tp: 18, fn: 2, fp: 42, tn: 138 },
  accuracy: { tp: 0, fn: 5, fp: 0, tn: 95 },
  f1: { tp: 30, fn: 20, fp: 5, tn: 145 },
};

function ratio(numerator: number, denominator: number): string {
  return denominator === 0 ? "—" : (numerator / denominator).toFixed(2);
}

function confusionChips(t: typeof L[keyof typeof L], example: ConfusionExample, variant: ConfusionVariant) {
  const total = example.tp + example.fn + example.fp + example.tn;
  const sensitivity = ratio(example.tp, example.tp + example.fn);
  const specificity = ratio(example.tn, example.tn + example.fp);
  const ppv = ratio(example.tp, example.tp + example.fp);
  const npv = ratio(example.tn, example.tn + example.fn);
  const accuracy = ratio(example.tp + example.tn, total);
  const balancedAccuracy =
    sensitivity === "—" || specificity === "—"
      ? "—"
      : ((Number(sensitivity) + Number(specificity)) / 2).toFixed(2);
  const f1 = ratio(2 * example.tp, 2 * example.tp + example.fp + example.fn);

  if (variant === "rows") {
    return [
      { label: t.sensitivity, formula: `${example.tp} / (${example.tp}+${example.fn})`, value: sensitivity },
      { label: t.specificity, formula: `${example.tn} / (${example.tn}+${example.fp})`, value: specificity },
      { label: t.balancedAccuracy, formula: "(Sens+Spec)/2", value: balancedAccuracy },
    ];
  }
  if (variant === "columns") {
    return [
      { label: t.ppv, formula: `${example.tp} / (${example.tp}+${example.fp})`, value: ppv },
      { label: t.npv, formula: `${example.tn} / (${example.tn}+${example.fn})`, value: npv },
    ];
  }
  if (variant === "accuracy") {
    return [
      { label: t.accuracy, formula: `(${example.tp}+${example.tn}) / ${total}`, value: accuracy },
      { label: t.sensitivity, formula: `${example.tp} / (${example.tp}+${example.fn})`, value: sensitivity },
      { label: t.balancedAccuracy, formula: "(Sens+Spec)/2", value: balancedAccuracy },
    ];
  }
  if (variant === "f1") {
    return [
      { label: t.ppv, formula: `${example.tp} / (${example.tp}+${example.fp})`, value: ppv },
      { label: t.sensitivity, formula: `${example.tp} / (${example.tp}+${example.fn})`, value: sensitivity },
      { label: t.f1, formula: "2TP / (2TP+FP+FN)", value: f1 },
    ];
  }
  return [
    { label: t.sensitivity, formula: `${example.tp} / (${example.tp}+${example.fn})`, value: sensitivity },
    { label: t.specificity, formula: `${example.tn} / (${example.tn}+${example.fp})`, value: specificity },
    { label: t.ppv, formula: `${example.tp} / (${example.tp}+${example.fp})`, value: ppv },
    { label: t.npv, formula: `${example.tn} / (${example.tn}+${example.fn})`, value: npv },
    { label: t.accuracy, formula: `(${example.tp}+${example.tn}) / ${total}`, value: accuracy },
    { label: t.f1, formula: "2TP / (2TP+FP+FN)", value: f1 },
  ];
}

function MatrixCell({
  x,
  y,
  fill,
  stroke,
  code,
  count,
  label,
}: {
  x: number;
  y: number;
  fill: string;
  stroke: string;
  code: string;
  count: number;
  label: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={118} height={66} rx={6} fill={fill} fillOpacity={0.16} stroke={stroke} strokeWidth={1.8} />
      <text x={x + 59} y={y + 25} fill={stroke} textAnchor="middle" style={{ ...monoStyle, fontWeight: 700 }}>
        {code}={count}
      </text>
      <text x={x + 59} y={y + 46} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {label}
      </text>
    </g>
  );
}

function MetricChip({
  x,
  y,
  width = 138,
  label,
  value,
  formula,
}: {
  x: number;
  y: number;
  width?: number;
  label: string;
  value: string;
  formula: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={50} rx={7} fill="var(--c-surface)" stroke="var(--c-border)" />
      <text x={x + 10} y={y + 16} fill="var(--c-text)" style={{ ...labelStyle, fontWeight: 700 }}>
        {label}
      </text>
      <text x={x + width - 10} y={y + 16} fill="var(--c-pred-a-text)" textAnchor="end" style={{ ...monoStyle, fontWeight: 700 }}>
        {value}
      </text>
      <text x={x + 10} y={y + 36} fill="var(--c-text-dim)" style={monoStyle}>
        {formula}
      </text>
    </g>
  );
}

function ClassificationConfusionExampleFigure({ variant = "overview" }: { readonly variant?: ConfusionVariant }) {
  const { lang } = useLang();
  const t = L[lang];
  const example = CONFUSION_EXAMPLES[variant];
  const actualPosTotal = example.tp + example.fn;
  const actualNegTotal = example.fp + example.tn;
  const predPosTotal = example.tp + example.fp;
  const predNegTotal = example.fn + example.tn;
  const total = actualPosTotal + actualNegTotal;
  const chips = confusionChips(t, example, variant);

  return (
    <svg
      width="100%"
      height={320}
      viewBox="0 0 560 320"
      role="img"
      aria-label={`${t.cm}: TP ${example.tp}, FN ${example.fn}, FP ${example.fp}, TN ${example.tn}`}
      style={{ minWidth: 560 }}
    >
      <text x={28} y={138} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle} transform="rotate(-90 28 138)">
        {t.actual}
      </text>
      <text x={254} y={20} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.predicted}
      </text>
      <text x={194} y={45} fill="var(--c-pred-a-text)" textAnchor="middle" style={{ ...labelStyle, fontWeight: 700 }}>
        {t.pos}
      </text>
      <text x={326} y={45} fill="var(--c-pred-b-text)" textAnchor="middle" style={{ ...labelStyle, fontWeight: 700 }}>
        {t.neg}
      </text>
      <text x={74} y={92} fill="var(--c-gt-text)" textAnchor="middle" style={{ ...labelStyle, fontWeight: 700 }}>
        {t.pos}
      </text>
      <text x={74} y={174} fill="var(--c-warn-text)" textAnchor="middle" style={{ ...labelStyle, fontWeight: 700 }}>
        {t.neg}
      </text>
      <text x={74} y={110} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {`${t.actualPosTotal.split(" ")[0]} ${t.actualPosTotal.split(" ")[1]} ${actualPosTotal}`}
      </text>
      <text x={74} y={192} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {`${t.actualNegTotal.split(" ")[0]} ${t.actualNegTotal.split(" ")[1]} ${actualNegTotal}`}
      </text>

      <MatrixCell x={136} y={58} fill="var(--c-gt)" stroke="var(--c-gt-text)" code="TP" count={example.tp} label={t.hit} />
      <MatrixCell x={268} y={58} fill="var(--c-warn)" stroke="var(--c-warn-text)" code="FN" count={example.fn} label={t.miss} />
      <MatrixCell x={136} y={140} fill="var(--c-warn)" stroke="var(--c-warn-text)" code="FP" count={example.fp} label={t.falseAlarm} />
      <MatrixCell x={268} y={140} fill="var(--c-gt)" stroke="var(--c-gt-text)" code="TN" count={example.tn} label={t.correctReject} />

      <text x={194} y={232} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {`${t.predPosTotal.split(" ")[0]} ${t.predPosTotal.split(" ")[1]} ${predPosTotal}`}
      </text>
      <text x={326} y={232} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {`${t.predNegTotal.split(" ")[0]} ${t.predNegTotal.split(" ")[1]} ${predNegTotal}`}
      </text>
      <text x={74} y={232} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {`${t.total.split(" ")[0]} ${total}`}
      </text>

      {chips.slice(0, 4).map((chip, index) => (
        <MetricChip key={`${chip.label}-${index}`} x={410} y={58 + index * 54} label={chip.label} formula={chip.formula} value={chip.value} />
      ))}
      {chips.slice(4, 6).map((chip, index) => (
        <MetricChip key={`${chip.label}-${index + 4}`} x={136 + index * 200} y={260} width={190} label={chip.label} formula={chip.formula} value={chip.value} />
      ))}
    </svg>
  );
}

export function ClassificationConfusionFigure() {
  return <ClassificationConfusionExampleFigure />;
}

export function ClassificationRowsFigure() {
  return <ClassificationConfusionExampleFigure variant="rows" />;
}

export function ClassificationColumnsFigure() {
  return <ClassificationConfusionExampleFigure variant="columns" />;
}

export function ClassificationAccuracyFigure() {
  return <ClassificationConfusionExampleFigure variant="accuracy" />;
}

export function ClassificationF1Figure() {
  return <ClassificationConfusionExampleFigure variant="f1" />;
}

export function ClassificationThresholdFigure() {
  const { lang } = useLang();
  const t = L[lang];
  const positives = [62, 84, 132, 172, 246];
  const negatives = [40, 112, 154, 212, 286, 320];
  return (
    <svg width="100%" height={180} viewBox="0 0 360 180" role="img" aria-label={t.threshold}>
      <line x1={32} y1={104} x2={328} y2={104} stroke="var(--c-border)" strokeWidth={2} />
      <line x1={190} y1={42} x2={190} y2={126} stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="5 4" />
      <text x={190} y={32} fill="var(--c-warn-text)" textAnchor="middle" style={labelStyle}>
        {t.threshold}
      </text>
      <text x={180} y={150} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.score}
      </text>
      {positives.map((x, index) => (
        <circle key={`p-${index}`} cx={x} cy={80} r={7} fill="var(--c-gt)" />
      ))}
      {negatives.map((x, index) => (
        <rect key={`n-${index}`} x={x - 6} y={112} width={12} height={12} fill="var(--c-pred-b)" />
      ))}
      <text x={56} y={62} fill="var(--c-gt-text)" style={labelStyle}>{t.pos}</text>
      <text x={56} y={144} fill="var(--c-pred-b-text)" style={labelStyle}>{t.neg}</text>
    </svg>
  );
}

export function ClassificationCurveFigure() {
  const { lang } = useLang();
  const t = L[lang];
  return (
    <svg width="100%" height={210} viewBox="0 0 380 210" role="img" aria-label="ROC and PR curves">
      <g transform="translate(20 12)">
        <text x={80} y={12} fill="var(--c-text)" textAnchor="middle" style={labelStyle}>{t.roc}</text>
        <line x1={24} y1={144} x2={144} y2={144} stroke="var(--c-border)" />
        <line x1={24} y1={24} x2={24} y2={144} stroke="var(--c-border)" />
        <path d="M24 144 C40 86 76 42 144 24" fill="none" stroke="var(--c-pred-a)" strokeWidth={2.5} />
        <line x1={24} y1={144} x2={144} y2={24} stroke="var(--c-text-dim)" strokeDasharray="4 4" />
        <text x={84} y={168} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>{t.fpr}</text>
        <text x={6} y={84} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle} transform="rotate(-90 6 84)">{t.tpr}</text>
      </g>
      <g transform="translate(200 12)">
        <text x={80} y={12} fill="var(--c-text)" textAnchor="middle" style={labelStyle}>{t.pr}</text>
        <line x1={24} y1={144} x2={144} y2={144} stroke="var(--c-border)" />
        <line x1={24} y1={24} x2={24} y2={144} stroke="var(--c-border)" />
        <path d="M24 34 C52 38 70 56 90 84 S126 126 144 134" fill="none" stroke="var(--c-pred-b)" strokeWidth={2.5} />
        <line x1={24} y1={126} x2={144} y2={126} stroke="var(--c-text-dim)" strokeDasharray="4 4" />
        <text x={84} y={168} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>{t.recall}</text>
        <text x={6} y={84} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle} transform="rotate(-90 6 84)">{t.precision}</text>
      </g>
    </svg>
  );
}
