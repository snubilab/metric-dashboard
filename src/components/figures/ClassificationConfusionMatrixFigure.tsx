import { useLang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    aria:
      "이진 분류 혼동행렬 그림. 실제 양성/음성과 예측 양성/음성의 2x2 표에서 TP, FP, FN, TN을 배치하고, 민감도, 특이도, PPV, NPV, 정확도가 어느 방향으로 읽히는지 보여준다.",
    actual: "실제",
    predicted: "예측",
    positive: "양성",
    negative: "음성",
    total: "전체",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    tn: "TN",
    truePositive: "참양성",
    falsePositive: "위양성",
    falseNegative: "위음성",
    trueNegative: "참음성",
    sensitivity: "민감도",
    specificity: "특이도",
    ppv: "PPV",
    npv: "NPV",
    accuracy: "정확도",
    axisRead: "행은 실제 기준, 열은 예측 기준",
  },
  en: {
    aria:
      "Binary classification confusion matrix figure. A 2x2 Actual-vs-Predicted table places TP, FP, FN, and TN, then shows how Sensitivity, Specificity, PPV, NPV, and Accuracy are read from rows, columns, or the whole table.",
    actual: "Actual",
    predicted: "Predicted",
    positive: "Positive",
    negative: "Negative",
    total: "Total",
    tp: "TP",
    fp: "FP",
    fn: "FN",
    tn: "TN",
    truePositive: "true positive",
    falsePositive: "false positive",
    falseNegative: "false negative",
    trueNegative: "true negative",
    sensitivity: "Sensitivity",
    specificity: "Specificity",
    ppv: "PPV",
    npv: "NPV",
    accuracy: "Accuracy",
    axisRead: "Rows read actual; columns read predicted",
  },
} as const;

const WIDTH = 560;
const HEIGHT = 360;

function Cell({
  x,
  y,
  fill,
  stroke,
  code,
  label,
}: {
  x: number;
  y: number;
  fill: string;
  stroke: string;
  code: string;
  label: string;
}) {
  return (
    <g data-role={code.toLowerCase()}>
      <rect x={x} y={y} width={126} height={76} rx={8} fill={fill} fillOpacity={0.14} stroke={stroke} strokeWidth={2} />
      <text x={x + 63} y={y + 34} textAnchor="middle" fill="var(--c-text)" fontSize={22} fontWeight={700}>
        {code}
      </text>
      <text x={x + 63} y={y + 56} textAnchor="middle" fill="var(--c-text-dim)" fontSize={11}>
        {label}
      </text>
    </g>
  );
}

function FormulaBand({
  x,
  y,
  width,
  label,
  formula,
  stroke,
  textFill = "var(--c-text)",
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  formula: string;
  stroke: string;
  textFill?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={38} rx={8} fill="var(--c-surface)" stroke={stroke} strokeWidth={1.8} />
      <text x={x + 12} y={y + 15} fill={textFill} fontSize={11} fontWeight={700}>
        {label}
      </text>
      <text x={x + 12} y={y + 30} fill="var(--c-text-dim)" fontSize={10} fontFamily="var(--font-mono)">
        {formula}
      </text>
    </g>
  );
}

export function ClassificationConfusionMatrixFigure() {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={t.aria}
      style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}
    >
      <rect x={1} y={1} width={WIDTH - 2} height={HEIGHT - 2} rx={10} fill="var(--c-surface)" stroke="var(--c-border)" />

      <text x={296} y={26} textAnchor="middle" fill="var(--c-text)" fontSize={13} fontWeight={700}>
        {t.predicted}
      </text>
      <text x={82} y={178} textAnchor="middle" fill="var(--c-text)" fontSize={13} fontWeight={700} transform="rotate(-90 82 178)">
        {t.actual}
      </text>

      <text x={230} y={52} textAnchor="middle" fill="var(--c-pred-a-text)" fontWeight={700}>
        {t.positive}
      </text>
      <text x={362} y={52} textAnchor="middle" fill="var(--c-pred-b-text)" fontWeight={700}>
        {t.negative}
      </text>
      <text x={128} y={112} textAnchor="end" fill="var(--c-gt-text)" fontWeight={700}>
        {t.positive}
      </text>
      <text x={128} y={190} textAnchor="end" fill="var(--c-warn-text)" fontWeight={700}>
        {t.negative}
      </text>

      <Cell x={166} y={72} fill="var(--c-gt)" stroke="var(--c-gt)" code={t.tp} label={t.truePositive} />
      <Cell x={298} y={72} fill="var(--c-warn)" stroke="var(--c-warn)" code={t.fn} label={t.falseNegative} />
      <Cell x={166} y={154} fill="var(--c-warn)" stroke="var(--c-warn)" code={t.fp} label={t.falsePositive} />
      <Cell x={298} y={154} fill="var(--c-gt)" stroke="var(--c-gt)" code={t.tn} label={t.trueNegative} />

      <path d="M 148 110 H 138" stroke="var(--c-gt)" strokeWidth={2} strokeLinecap="round" />
      <path d="M 148 192 H 138" stroke="var(--c-warn)" strokeWidth={2} strokeLinecap="round" />
      <path d="M 230 62 V 58" stroke="var(--c-pred-a)" strokeWidth={2} strokeLinecap="round" />
      <path d="M 362 62 V 58" stroke="var(--c-pred-b)" strokeWidth={2} strokeLinecap="round" />

      <FormulaBand
        x={438}
        y={78}
        width={104}
        label={t.sensitivity}
        formula="TP/(TP+FN)"
        stroke="var(--c-gt)"
        textFill="var(--c-gt-text)"
      />
      <FormulaBand
        x={438}
        y={160}
        width={104}
        label={t.specificity}
        formula="TN/(TN+FP)"
        stroke="var(--c-warn)"
        textFill="var(--c-warn-text)"
      />
      <FormulaBand x={166} y={254} width={126} label={t.ppv} formula="TP/(TP+FP)" stroke="var(--c-pred-a)" textFill="var(--c-pred-a-text)" />
      <FormulaBand x={298} y={254} width={126} label={t.npv} formula="TN/(TN+FN)" stroke="var(--c-pred-b)" textFill="var(--c-pred-b-text)" />
      <FormulaBand x={166} y={306} width={258} label={t.accuracy} formula="(TP+TN)/(TP+FP+FN+TN)" stroke="var(--c-border)" />

      <text x={84} y={328} fill="var(--c-text-dim)" fontSize={11}>
        {t.axisRead}
      </text>
      <text x={520} y={238} fill="var(--c-text-dim)" fontSize={10} textAnchor="middle">
        {t.total}
      </text>
    </svg>
  );
}

export default ClassificationConfusionMatrixFigure;
