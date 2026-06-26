import { AnimatedMetric } from "../../components/AnimatedMetric";
import { useLang } from "../../i18n/LanguageContext";
import type { RegressionComparisonRow, RegressionLead } from "./scenarioRows";
import { regressionRowLead } from "./scenarioRows";

interface RegressionMetricTableProps {
  readonly rows: readonly RegressionComparisonRow[];
}

const L = {
  ko: {
    metric: "지표",
    predictionA: "예측 A",
    predictionB: "예측 B",
  },
  en: {
    metric: "Metric",
    predictionA: "Prediction A",
    predictionB: "Prediction B",
  },
} as const;

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: "100%",
  overflowX: "auto",
};

const headStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  borderBottom: "1px solid var(--c-border)",
  color: "var(--c-text-dim)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const valueHeadStyle = (color: string): React.CSSProperties => ({
  ...headStyle,
  color,
  textAlign: "right",
});

const cellStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  borderBottom: "1px solid var(--c-border)",
  fontSize: "var(--text-sm)",
};

const valueStyle = (lead: RegressionLead, side: "A" | "B"): React.CSSProperties => ({
  ...cellStyle,
  textAlign: "right",
  borderLeft: lead === side ? `3px solid var(--c-pred-${side.toLowerCase()})` : "3px solid transparent",
});

export function RegressionMetricTable({ rows }: RegressionMetricTableProps) {
  const { lang } = useLang();
  const t = L[lang];
  return (
    <div style={wrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headStyle}>{t.metric}</th>
            <th style={valueHeadStyle("var(--c-pred-a-text)")}>{t.predictionA}</th>
            <th style={valueHeadStyle("var(--c-pred-b-text)")}>{t.predictionB}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const lead = regressionRowLead(row);
            return (
              <tr key={row.key}>
                <td style={cellStyle}>{lang === "ko" ? row.labelKo : row.label}</td>
                <td style={valueStyle(lead, "A")}><AnimatedMetric value={row.a} decimals={2} unit={row.unit} size="sm" /></td>
                <td style={valueStyle(lead, "B")}><AnimatedMetric value={row.b} decimals={2} unit={row.unit} size="sm" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
