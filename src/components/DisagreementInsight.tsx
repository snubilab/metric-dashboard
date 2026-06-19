/**
 * DisagreementInsight — turns an A-vs-B metric comparison into a single,
 * auto-generated sentence of insight.
 *
 * The first row (conventionally Dice) is treated as the reference verdict. Any
 * metric whose winner flips against that reference, or whose A/B gap is large
 * (per {@link detectDisagreements}), is "flagged". When flags exist we render a
 * token-styled warn callout describing which side wins each flagged metric, so
 * the reader sees that the verdict depends on which metric you trust. With no
 * disagreement we render a calm note that A and B agree across these metrics.
 *
 * The sentence is derived entirely from the row data (labels + winners); no
 * specific metric name is hardcoded. All visual values come from design tokens.
 */

import type { MetricRow } from "./metrics/types";
import { detectDisagreements, winner } from "./metrics/detectDisagreements";
import { useLang } from "../i18n/LanguageContext";

interface DisagreementInsightProps {
  rows: MetricRow[];
}

const L = {
  ko: {
    referenceWins: (side: string, label: string) => `예측 ${side}가 ${label} 기준으로 더 낫지만`,
    flaggedWin: (label: string, side: string) => `${label}는 예측 ${side}가 더 낫고`,
    verdictFlips: "어떤 지표를 보느냐에 따라 우열이 바뀝니다.",
    agree: "이 장면에서는 모든 지표에서 예측 A와 B의 우열이 일치합니다.",
  },
  en: {
    referenceWins: (side: string, label: string) => `Prediction ${side} is better on ${label}, but`,
    flaggedWin: (label: string, side: string) => `${label} favors prediction ${side}`,
    verdictFlips: "— which prediction wins depends on the metric you look at.",
    agree: "In this scene, predictions A and B agree across every metric.",
  },
} as const;

const calloutStyle: React.CSSProperties = {
  margin: 0,
  padding: "var(--space-3) var(--space-4)",
  background: "var(--c-surface-2)",
  borderLeftWidth: "3px",
  borderLeftStyle: "solid",
  borderLeftColor: "var(--c-warn)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text)",
};

const agreeStyle: React.CSSProperties = {
  ...calloutStyle,
  borderLeftColor: "var(--c-border)",
  color: "var(--c-text-dim)",
};

export function DisagreementInsight({ rows }: DisagreementInsightProps) {
  const { lang } = useLang();
  const t = L[lang];

  if (rows.length === 0) {
    return (
      <p data-role="insight" data-disagree="false" style={agreeStyle}>
        {t.agree}
      </p>
    );
  }

  const flags = detectDisagreements(rows);
  const flagByKey = new Map(flags.map((f) => [f.key, f]));
  const referenceRow = rows[0];

  // Metrics that flip the verdict or show a large gap, excluding the reference.
  const flagged = rows.filter((row, index) => {
    if (index === 0) {
      return false;
    }
    const flag = flagByKey.get(row.key);
    return flag !== undefined && (flag.rankFlip || flag.largeGap);
  });

  if (flagged.length === 0) {
    return (
      <p data-role="insight" data-disagree="false" style={agreeStyle}>
        {t.agree}
      </p>
    );
  }

  const referenceWinner = winner(referenceRow);
  const referenceSide = referenceWinner === "tie" ? "A" : referenceWinner;
  const lead = t.referenceWins(referenceSide, referenceRow.label);

  const clauses = flagged.map((row) => {
    const rowWinner = winner(row);
    const side = rowWinner === "tie" ? "A" : rowWinner;
    return t.flaggedWin(row.label, side);
  });

  const sentence = `${lead} ${clauses.join(", ")} ${t.verdictFlips}`;

  return (
    <p data-role="insight" data-disagree="true" style={calloutStyle}>
      {sentence}
    </p>
  );
}

export default DisagreementInsight;
