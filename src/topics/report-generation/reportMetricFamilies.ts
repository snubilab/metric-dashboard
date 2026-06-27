import type { ReportComparisonRowKey } from "../../components/metrics/reportComparisonRows";

export const REPORT_METRIC_FAMILY_LABEL = {
  lexical: "Lexical",
  semantic: "Semantic",
  proxy: "Proxy/style",
} as const;

export const REPORT_METRIC_FAMILY_ORDER = ["lexical", "semantic", "proxy"] as const;

type ReportMetricFamily = keyof typeof REPORT_METRIC_FAMILY_LABEL;

const REPORT_METRIC_FAMILY_BY_KEY: Record<ReportComparisonRowKey, ReportMetricFamily> = {
  bleu1: "lexical",
  rougeL: "lexical",
  meteor: "lexical",
  bertScore: "semantic",
  rateScore: "semantic",
  chexbertF1: "proxy",
  srrBertF1: "proxy",
  temporalF1: "proxy",
  radGraphF1: "proxy",
  greenErrors: "proxy",
  crimsonWeightedErrors: "proxy",
};

export function reportMetricFamilyForKey(key: ReportComparisonRowKey): ReportMetricFamily {
  return REPORT_METRIC_FAMILY_BY_KEY[key];
}
