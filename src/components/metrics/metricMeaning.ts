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
  specificity: {
    ko: "실제 음성 중 음성으로 걸러낸 비율",
    en: "Fraction of actual negatives rejected",
  },
  ppv: {
    ko: "예측 양성 중 실제 양성의 비율",
    en: "Fraction of predicted positives that are actual positives",
  },
  npv: {
    ko: "예측 음성 중 실제 음성의 비율",
    en: "Fraction of predicted negatives that are actual negatives",
  },
  accuracy: {
    ko: "전체 사례 중 맞춘 비율",
    en: "Fraction of all cases labeled correctly",
  },
  balancedAccuracy: {
    ko: "민감도와 특이도의 평균",
    en: "Average of sensitivity and specificity",
  },
  f1: {
    ko: "Precision과 Recall의 조화평균",
    en: "Harmonic mean of precision and recall",
  },
  auroc: {
    ko: "ROC 곡선 아래 면적",
    en: "Area under the ROC curve",
  },
  ap: {
    ko: "PR 순위 곡선의 평균 precision 요약",
    en: "Average precision summary of the PR ranking curve",
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
  lexicalOverlap: {
    ko: "reference와 candidate의 표면 단어 겹침",
    en: "Surface token overlap between reference and candidate",
  },
  findingF1: {
    ko: "finding 단위가 reference와 맞는 정도",
    en: "Matches report findings regardless of exact wording",
  },
  assertionF1: {
    ko: "finding의 present/absent 상태까지 맞는 정도",
    en: "Matches whether each finding is present or absent",
  },
  lateralityF1: {
    ko: "right/left/bilateral 같은 좌우 정보 일치",
    en: "Compares right, left, and bilateral laterality cues",
  },
  temporalF1: {
    ko: "improved/worsened/stable 같은 변화 방향 일치",
    en: "Compares temporal change cues such as improved, worsened, or stable",
  },
  safetyErrors: {
    ko: "없는 소견 생성, 소견 누락, assertion 뒤집힘의 개수",
    en: "Counts false findings, omissions, and assertion flips",
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
