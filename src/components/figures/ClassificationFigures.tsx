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
    f1: "F1",
  },
} as const;

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

export function ClassificationConfusionFigure() {
  const { lang } = useLang();
  const t = L[lang];
  return (
    <svg
      width="100%"
      height={320}
      viewBox="0 0 560 320"
      role="img"
      aria-label={`${t.cm}: TP 42, FN 8, FP 10, TN 140`}
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
        {t.actualPosTotal}
      </text>
      <text x={74} y={192} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.actualNegTotal}
      </text>

      <MatrixCell x={136} y={58} fill="var(--c-gt)" stroke="var(--c-gt-text)" code="TP" count={42} label={t.hit} />
      <MatrixCell x={268} y={58} fill="var(--c-warn)" stroke="var(--c-warn-text)" code="FN" count={8} label={t.miss} />
      <MatrixCell x={136} y={140} fill="var(--c-warn)" stroke="var(--c-warn-text)" code="FP" count={10} label={t.falseAlarm} />
      <MatrixCell x={268} y={140} fill="var(--c-gt)" stroke="var(--c-gt-text)" code="TN" count={140} label={t.correctReject} />

      <text x={194} y={232} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.predPosTotal}
      </text>
      <text x={326} y={232} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.predNegTotal}
      </text>
      <text x={74} y={232} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.total}
      </text>

      <MetricChip x={410} y={58} label={t.sensitivity} formula="42 / (42+8)" value="0.84" />
      <MetricChip x={410} y={112} label={t.specificity} formula="140 / (140+10)" value="0.93" />
      <MetricChip x={410} y={166} label={t.ppv} formula="42 / (42+10)" value="0.81" />
      <MetricChip x={410} y={220} label={t.npv} formula="140 / (140+8)" value="0.95" />
      <MetricChip x={136} y={260} width={190} label={t.accuracy} formula="(42+140) / 200" value="0.91" />
      <MetricChip x={336} y={260} width={190} label={t.f1} formula="2TP / (2TP+FP+FN)" value="0.82" />
    </svg>
  );
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
