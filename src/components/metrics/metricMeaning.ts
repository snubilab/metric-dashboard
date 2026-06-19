/**
 * Plain-language meaning for a metric, keyed by MetricRow.key.
 *
 * Each entry is a short, descriptive sentence that explains *what the metric
 * measures* — never whether a value is good or bad. This supports the dashboard
 * thesis that no single number is "good" or "bad" in isolation: descriptions
 * stay neutral and factual, with no quality grade words.
 */

import type { Lang } from "../../i18n/LanguageContext";

/** Short bilingual descriptions per metric key; unknown keys resolve to "". */
const METRIC_MEANINGS: Record<string, Record<Lang, string>> = {
  dice: {
    ko: "예측과 정답의 겹침 정도",
    en: "Overlap between prediction and ground truth",
  },
  iou: {
    ko: "예측과 정답의 교집합 대비 합집합 비율",
    en: "Intersection over union of prediction and ground truth",
  },
  sensitivity: {
    ko: "정답 중 검출한 비율",
    en: "Fraction of ground-truth region that was detected",
  },
  precision: {
    ko: "예측 중 실제로 정답인 비율",
    en: "Fraction of predicted region that is correct",
  },
  nsd: {
    ko: "허용 오차 내 경계 일치 정도(표면 Dice)",
    en: "Boundary agreement within a tolerance (surface Dice)",
  },
  hd95: {
    ko: "최악에 가까운 경계 거리(95퍼센타일)",
    en: "Near-worst-case boundary distance (95th percentile)",
  },
  assd: {
    ko: "경계 간 평균 거리",
    en: "Average distance between boundaries",
  },
  volRel: {
    ko: "정답 대비 예측 부피의 상대 차이",
    en: "Relative difference in volume versus ground truth",
  },
};

/**
 * The plain-language meaning of a metric in the active language.
 *
 * @param key - The metric row key (e.g. "dice", "hd95").
 * @param lang - The active UI language.
 * @returns A short descriptive sentence, or "" for an unknown key.
 */
export function metricMeaning(key: string, lang: Lang): string {
  return METRIC_MEANINGS[key]?.[lang] ?? "";
}
