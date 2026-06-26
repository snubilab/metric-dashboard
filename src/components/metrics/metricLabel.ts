/**
 * Localized display labels for metric rows, keyed by MetricRow.key.
 *
 * Acronyms / proper-noun metric names (Dice, IoU, HD95, ASSD) are intentionally
 * kept as-is in both languages; only the worded names are localized. Unknown
 * keys fall back to the metric's English `label`.
 */

import type { Lang } from "../../i18n/LanguageContext";

const KO_METRIC_LABELS: Record<string, string> = {
  sensitivity: "민감도",
  recall: "재현율",
  precision: "정밀도",
  specificity: "특이도",
  ppv: "PPV",
  npv: "NPV",
  accuracy: "Accuracy",
  balancedAccuracy: "Balanced Accuracy",
  f1: "F1",
  auroc: "AUROC",
  ap: "AP",
  nsd: "표면 Dice (NSD)",
  surfaceDice: "표면 Dice (NSD)",
  volRel: "상대 부피차",
  volumeDiff: "상대 부피차",
  lexicalOverlap: "Lexical overlap proxy",
  findingF1: "Finding F1",
  assertionF1: "Assertion F1",
  lateralityF1: "Laterality F1",
  temporalF1: "Temporal F1",
  safetyErrors: "Safety error count",
};

/** The display label for a metric row in the active language. */
export function localizedMetricLabel(key: string, fallback: string, lang: Lang): string {
  if (lang === "ko") {
    return KO_METRIC_LABELS[key] ?? fallback;
  }
  return fallback;
}
