import { useLang } from "../../i18n/LanguageContext";

const cellStyle: React.CSSProperties = {
  fill: "var(--c-surface)",
  stroke: "var(--c-border)",
  strokeWidth: 1.5,
};

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
  },
} as const;

export function ClassificationConfusionFigure() {
  const { lang } = useLang();
  const t = L[lang];
  return (
    <svg width="100%" height={190} viewBox="0 0 360 190" role="img" aria-label={t.cm}>
      <text x={42} y={102} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle} transform="rotate(-90 42 102)">
        {t.actual}
      </text>
      <text x={220} y={20} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.predicted}
      </text>
      <text x={160} y={44} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.pos}
      </text>
      <text x={280} y={44} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.neg}
      </text>
      <text x={84} y={88} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.pos}
      </text>
      <text x={84} y={148} fill="var(--c-text-dim)" textAnchor="middle" style={labelStyle}>
        {t.neg}
      </text>
      <rect x={110} y={58} width={100} height={52} style={cellStyle} fillOpacity={0.8} />
      <rect x={230} y={58} width={100} height={52} style={cellStyle} />
      <rect x={110} y={122} width={100} height={52} style={cellStyle} />
      <rect x={230} y={122} width={100} height={52} style={cellStyle} fillOpacity={0.8} />
      <text x={160} y={90} fill="var(--c-gt-text)" textAnchor="middle" style={monoStyle}>TP</text>
      <text x={280} y={90} fill="var(--c-warn-text)" textAnchor="middle" style={monoStyle}>FN</text>
      <text x={160} y={154} fill="var(--c-warn-text)" textAnchor="middle" style={monoStyle}>FP</text>
      <text x={280} y={154} fill="var(--c-gt-text)" textAnchor="middle" style={monoStyle}>TN</text>
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
